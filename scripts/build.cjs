const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');
const { loadEnvConfig } = require('@next/env');
const ts = require('typescript');

// Load the same server utilities that Next uses, before its workers start.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
).outputText, filename);
const { getDatabase } = require('../utils/get-database.ts');
const { getNotionPage } = require('../utils/get-notion-page.ts');
const { drainNotionPrerenderQueue } = require('../utils/notion-prerender-queue.ts');

const POST_DATABASE_ID = '1a346171ed574b0a9c1c3f5a29b39919';
const REQUEST_GAP_MS = 500;
const ATTEMPT_MS = 12_000;
const DEFAULT_BUDGET_MS = 120_000;

async function preparePosts(dir) {
  if (!process.env.NOTION_API_KEY) {
    console.warn('[Notion prerender] No database key; posts will render on demand.');
    return [];
  }
  const configuredBudget = Number(process.env.NOTION_PRERENDER_BUDGET_MS);
  const budget = Number.isSafeInteger(configuredBudget) && configuredBudget > 0
    ? Math.min(configuredBudget, 600_000) : DEFAULT_BUDGET_MS;
  const deadline = Date.now() + budget;
  let posts;
  try {
    const { results } = await getDatabase(POST_DATABASE_ID, {
      sorts: [{ property: 'cwqu', direction: 'descending' }],
    }, AbortSignal.timeout(Math.min(budget, ATTEMPT_MS)));
    posts = new Map(results.filter(({ id }) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
      .map((post) => [post.id.toLowerCase(), post]));
  } catch (error) {
    console.warn('[Notion prerender] Could not load the post list; posts will render on demand.', error.status || error.name);
    return [];
  }
  let nextRequest = Date.now() + REQUEST_GAP_MS;
  const beforeRequest = async (signal) => {
    await sleep(Math.max(0, nextRequest - Date.now()), undefined, { signal });
    signal.throwIfAborted();
    nextRequest = Date.now() + REQUEST_GAP_MS;
  };
  const prepared = await drainNotionPrerenderQueue([...posts.keys()], async (id, signal) => {
    const recordMap = await getNotionPage(id, { signal, beforeRequest });
    signal.throwIfAborted();
    const properties = posts.get(id).properties ?? {};
    const key = Object.keys(properties).find((name) => name.toLowerCase().replace(/_/g, '') === 'aisummary');
    const cachedSummary = properties[key]?.rich_text?.map((part) => part.plain_text || '').join('') || '';
    await writeFile(join(dir, `${id}.json`), JSON.stringify({ recordMap, cachedSummary }), { signal });
  }, {
    deadline, attemptMs: ATTEMPT_MS, maxAttempts: 3, wait: sleep,
    onFailure: (id, error) => console.warn(`[Notion prerender] Attempt failed for ${id} (${error.statusCode || error.status || error.name}).`),
  });
  console.log(`[Notion prerender] Prepared ${prepared.length}/${posts.size} posts. Remaining posts will render on demand.`);
  return prepared;
}

async function main() {
  process.env.NODE_ENV ||= 'production';
  loadEnvConfig(process.cwd());
  const dir = await mkdtemp(join(tmpdir(), 'blog-notion-prerender-'));
  try {
    const paths = await preparePosts(dir);
    await writeFile(join(dir, 'paths.json'), JSON.stringify(paths));
    const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--turbopack', ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, NOTION_PRERENDER_DIR: dir },
    });
    const [code] = await once(child, 'exit');
    process.exitCode = code ?? 1;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
