const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, filename);
const { normalizeNotionRecordMap, isNotionNotFound } = require('../utils/get-notion-page.ts');
const { notionPrerenderPaths, readPrerenderedNotionPage } = require('../utils/notion-prerender-data.ts');
const { drainNotionPrerenderQueue } = require('../utils/notion-prerender-queue.ts');
const { fetchNotionJson } = require('../utils/notion-fetch.ts');
const id = '3fdfc9b9-3eca-8041-b98c-ca653f320b1c';

test('missing titles and nested recordMap values remain valid; incomplete responses are errors, not cached 404s', () => {
  for (const entry of [{value:{id,type:'page'}}, {value:{role:'reader',value:{id,type:'page'}}}, {id,type:'page'}]) {
    const map = normalizeNotionRecordMap({block:{[id]:entry}},id);
    assert.equal(map.block[id].value.id,id);
    assert.equal(map.block[id].value.properties,undefined);
  }
  assert.throws(() => normalizeNotionRecordMap({block:{}},id), /Incomplete/);
  for (const error of [{status:429},{statusCode:503},new Error('network'),new Error('Incomplete')]) assert.equal(isNotionNotFound(error), false);
  assert.equal(isNotionNotFound({response:{status:404}}),true);
});

test('the embed component renders without title, category or tags properties', () => {
  const path='pages/embed/[pageId].js';
  const source=ts.createSourceFile(path,fs.readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
  const component=source.statements.find(node=>ts.isFunctionDeclaration(node) && node.name?.text==='Page');
  const code=ts.createPrinter().printNode(ts.EmitHint.Unspecified,component,source).replace(/^export default\s+/,'');
  const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const Page=new Function('require','exports','useState','useEffect','NotionRenderer','Code','Collection','Equation','Modal',compiled+'\nreturn Page;')(require,{},value=>[value,()=>{}],()=>{},()=>null,null,null,null,null);
  assert.doesNotThrow(()=>Page({pageId:id,recordMap:{block:{[id]:{value:{id,type:'page',properties:{}}}}}}));
});

function pageFunctions(path, getNotionPage) {
  const source = ts.createSourceFile(path, fs.readFileSync(path,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const printer = ts.createPrinter();
  const code = source.statements.filter(node => ts.isFunctionDeclaration(node) && ['getStaticPaths','getStaticProps'].includes(node.name?.text)).map(node => printer.printNode(ts.EmitHint.Unspecified,node,source).replace(/^export\s+/, '')).join('\n');
  return new Function('notionPrerenderPaths','readPrerenderedNotionPage','getNotionPage','isNotionNotFound','manageSummary','extractTextFromRecordMap','console',code+'\nreturn {getStaticPaths,getStaticProps};')(notionPrerenderPaths,readPrerenderedNotionPage,getNotionPage,isNotionNotFound,async()=>null,()=>'',{error(){}});
}
test('both page loaders use prepared posts and retain blocking fallback for skipped posts', async (t) => {
  const previous = process.env.NOTION_PRERENDER_DIR;
  const dir = fs.mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'notion-prerender-test-'));
  t.after(() => {
    if (previous === undefined) delete process.env.NOTION_PRERENDER_DIR;
    else process.env.NOTION_PRERENDER_DIR = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  process.env.NOTION_PRERENDER_DIR = dir;
  fs.writeFileSync(`${dir}/paths.json`, JSON.stringify([id]));
  fs.writeFileSync(`${dir}/${id}.json`, JSON.stringify({ recordMap: { block: { [id]: { value: { id, type: 'page' } } } } }));
  const skipped = '4fdfc9b9-3eca-8041-b98c-ca653f320b1c';
  for (const path of ['pages/[pageId].js','pages/embed/[pageId].js']) {
    let calls=0;
    let reason = Object.assign(new Error('rate limited'),{statusCode:429});
    const page=pageFunctions(path,async()=>{calls++;throw reason;});
    assert.deepEqual(await page.getStaticPaths(),{paths:[{params:{pageId:id}}],fallback:'blocking'});
    const result=await page.getStaticProps({params:{pageId:id}});
    assert.equal(result.props.pageId,id);
    assert.equal(result.revalidate,10);
    assert.equal(calls,0);
    await assert.rejects(page.getStaticProps({params:{pageId:skipped}}),error=>error===reason);
    reason=Object.assign(new Error('not found'),{statusCode:404});
    assert.deepEqual(await page.getStaticProps({params:{pageId:skipped}}),{notFound:true,revalidate:60});
  }
});

test('prerender retries later, honors a shared Notion cooldown and keeps successes when the budget runs out', async () => {
  let time = 0;
  const calls = [];
  const done = await drainNotionPrerenderQueue(['ok', 'retry', 'ready', 'retry', 'missing', 'long', 'skipped'], async (id) => {
    calls.push([id, time]);
    if (id === 'retry' && time === 0) throw { status: 503 };
    if (id === 'ready') {
      time += 2000;
      if (calls.filter(([id]) => id === 'ready').length === 1) throw { response: { status: 429, headers: new Headers({ 'Retry-After': '3' }) } };
    }
    if (id === 'missing') throw { status: 404 };
    if (id === 'long') throw { response: { status: 429, headers: new Headers({ 'Retry-After': '30' }) } };
  }, { deadline: 10_000, attemptMs: 1000, maxAttempts: 3, now: () => time, wait: async (ms) => { time += ms; } });
  assert.deepEqual(calls, [['ok', 0], ['retry', 0], ['ready', 0], ['missing', 5000], ['long', 5000]]);
  assert.deepEqual(done, ['ok']);
});

test('temporary failures go to the back of the queue and persistent failures stop after three attempts', async () => {
  let time = 0;
  const calls = [];
  const done = await drainNotionPrerenderQueue(['retry', 'persistent', 'ready'], async (id) => {
    const seen = calls.includes(id);
    calls.push(id);
    if (id === 'persistent' || (id === 'retry' && !seen)) throw { status: 503 };
  }, { deadline: 10_000, attemptMs: 1000, maxAttempts: 3, now: () => time, wait: async (ms) => { time += ms; } });
  assert.deepEqual(calls, ['retry', 'persistent', 'ready', 'retry', 'persistent', 'persistent']);
  assert.deepEqual(done, ['ready', 'retry']);
});

test('database 429 respects Retry-After, bounds retries, and never retries auth failures or long cooldowns early', async () => {
  const original=global.fetch;
  try {
    let calls=0; const waits=[];
    global.fetch=async()=> ++calls===1 ? Response.json({code:'rate_limited'},{status:429,headers:{'retry-after':'2'}}) : Response.json({results:[]});
    assert.deepEqual(await fetchNotionJson('https://api.notion.com/test',{},async ms=>waits.push(ms)),{results:[]});
    assert.equal(calls,2); assert.ok(waits[0]>=2000 && waits[0]<2250);
    calls=0; global.fetch=async()=>{calls++;return Response.json({}, {status:429});};
    await assert.rejects(fetchNotionJson('https://api.notion.com/test',{},async()=>{}),error=>error.status===429);
    assert.equal(calls,3);
    for(const [status,header] of [[401,null],[429,'120']]) {
      calls=0;global.fetch=async()=>{calls++;return Response.json({}, {status,headers:header?{'retry-after':header}:{}});};
      await assert.rejects(fetchNotionJson('https://api.notion.com/test',{},async()=>assert.fail('must not wait')),error=>error.status===status);
      assert.equal(calls,1);
    }
  } finally { global.fetch=original; }
});
