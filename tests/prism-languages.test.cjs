const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { resolvePrismLanguage, prismLanguageCount } = require('../utils/prism-languages.ts');
const { loadPrismLanguage } = require('../utils/load-prism-components.ts');
const prism = require('prismjs');
const components = require('prismjs/components.json');

test('Notion language names, file aliases and plain text resolve without using arbitrary import paths', () => {
  for (const [name, id] of Object.entries({ 'C++': 'cpp', 'C#': 'csharp', 'F#': 'fsharp', 'Objective-C': 'objectivec', 'Shell': 'bash', 'Visual Basic': 'visual-basic', 'Kotlin': 'kotlin', kt: 'kotlin', 'TSX': 'tsx', 'dockerfile': 'docker', 'YAML': 'yaml', 'yml': 'yaml' })) {
    assert.equal(resolvePrismLanguage(name), id);
  }
  for (const name of ['Plain Text', 'unknown-language', '../../javascript', '<script>']) assert.equal(resolvePrismLanguage(name), 'none');
});

test('concurrent dependent requests and every installed grammar load successfully', async () => {
  await Promise.all(['tsx', 'jsx', 'typescript', 'C#', 'kotlin', 'php'].map(loadPrismLanguage));
  for (const id of Object.keys(components.languages).filter(id => id !== 'meta')) {
    const loaded = await loadPrismLanguage(id);
    assert.ok(loaded || components.languages[id].modify, id);
  }
  assert.equal(prismLanguageCount, 297);
  assert.equal(await loadPrismLanguage('Plain Text'), false);
  assert.match(prism.highlight('fun main() { println("hello") }', prism.languages.kotlin, 'kotlin'), /token keyword/);
  assert.match(prism.highlight('const element = <div>{value}</div>;', prism.languages.tsx, 'tsx'), /token tag/);
});
