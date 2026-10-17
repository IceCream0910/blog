const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const { chunkAnswerText, createAnswerEmitter, AnswerStreamQueue } = require('../utils/search/answer-stream.ts');
const { parseAnswerMarkdown, parseAnswerInline } = require('../utils/search/answer-markdown.ts');
const { AnswerMarkdown } = require('../components/Search/AnswerMarkdown.tsx');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('wire chunks preserve Unicode, whitespace, markdown and sequential IDs', () => {
  const text = '# 제목\n\n**안녕하세요** 👩🏽‍💻'.repeat(10);
  const chunks = chunkAnswerText(text);
  assert.equal(chunks.join(''), text);
  assert.ok(chunks.every(chunk => Array.from(chunk).length <= 24));
  const events = []; createAnswerEmitter(event => events.push(event))(text);
  assert.equal(events.map(event => event.text).join(''), text);
  assert.deepEqual(events.map(event => event.chunkId), events.map((_, index) => index));
});

test('UI queue paces a coalesced response and resolves only after delivering all text', async () => {
  const output = [];
  const queue = new AnswerStreamQueue(text => output.push(text), 1);
  const text = '**첫 문장**\n다음 문장 😀 '.repeat(12);
  queue.enqueue(text);
  assert.equal(output.length, 1);
  assert.notEqual(output.join(''), text);
  await queue.whenIdle();
  assert.equal(output.join(''), text);
  assert.ok(output.every(chunk => Array.from(chunk).length <= 24));
  queue.cancel();
});

test('cancel drains waiters without leaking queued chunks into the next request', async () => {
  const output = [];
  const queue = new AnswerStreamQueue(text => output.push(text), 1);
  queue.enqueue('old answer '.repeat(100));
  const idle = queue.whenIdle();
  queue.cancel(); queue.enqueue('must not appear');
  await idle;
  const count = output.length;
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(output.length, count);
  assert.ok(!output.join('').includes('must not appear'));
});

test('limited markdown supports headings, flat lists, quotes and unfinished fenced code', () => {
  const blocks = parseAnswerMarkdown('# 제목\n\n문단 **강조**\n\n- 하나\n- 둘\n\n1. 첫째\n2. 둘째\n\n> 인용\n\n```js\nconst a = 1;');
  assert.deepEqual(blocks.map(block => block.kind), ['heading', 'paragraph', 'ul', 'ol', 'quote', 'code']);
  assert.equal(blocks.at(-1).text, 'const a = 1;');
  assert.equal(blocks[2].items.length, 2);
  assert.deepEqual(parseAnswerInline('**강조**와 `코드` [1]').map(token => token.kind), ['strong', 'text', 'code', 'text', 'citation']);
});

test('renderer escapes HTML, never creates model-provided links/images, and links only verified citations', () => {
  const text = '# 제목\n\n**강조**와 *기울임* `코드` [1] [2]\n\n<script>alert(1)</script> ![이미지](https://example.invalid/a.png) [링크](javascript:alert(1))\n\n- 항목\n\n```html\n<img src=x onerror=alert(1)>\n```';
  const html = renderToStaticMarkup(React.createElement(AnswerMarkdown, {text, reducedMotion:true, sources:[{id:'1',title:'검증된 문서',href:'/forest'}], onClose() {}}));
  assert.match(html, /<h4>제목<\/h4>/);
  assert.match(html, /<strong>강조<\/strong>/);
  assert.match(html, /<em>기울임<\/em>/);
  assert.match(html, /<ul>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /href="\/forest"/);
  assert.doesNotMatch(html, /global-search-answer-word/);
});
