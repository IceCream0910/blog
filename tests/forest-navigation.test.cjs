const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { compareDocuments, sortedFolders, openForestDocument, forestDocumentFromHref, forestPageIdFromHref, forestPanelWindow } = require('../utils/forest-navigation.ts');
const { buildFolderTree } = require('../utils/search/folders.ts');
const doc = (id, title, folderPath, day) => ({ id, title, folderPath, createdTime: `2026-01-${day}T00:00:00Z`, lastEditedTime: `2026-02-${day}T00:00:00Z` });

test('third and later panels keep older title strips and reserve a reading slot for the drop placeholder', () => {
  for (let count = 3; count <= 8; count++) {
    const layout = forestPanelWindow(count, count - 1, 1400);
    assert.equal(layout.visible, 2);
    assert.equal(layout.start, count - 2);
    assert.equal(layout.panelWidth * 2 + layout.start * 42, 1400);
    const preview = forestPanelWindow(count, count - 1, 1400, true);
    assert.equal(preview.start, count - 1);
  }
  assert.equal(forestPanelWindow(4, 3, 800).visible, 1);
  assert.equal(forestPanelWindow(4, 3, 800).start, 3);
  assert.equal(forestPanelWindow(4, 0, 1400).start, 0);
});

test('list selection replaces all panels; dropping right preserves them; body links branch from their source', () => {
  assert.deepEqual(openForestDocument([], 'a', 'replace'), ['a']);
  assert.deepEqual(openForestDocument(['a', 'b'], 'c', 'replace'), ['c']);
  assert.deepEqual(openForestDocument(['a', 'b'], 'c', 'append'), ['a', 'b', 'c']);
  assert.deepEqual(openForestDocument(['a', 'b', 'c'], 'd', 'append', 'a'), ['a', 'd']);
  assert.deepEqual(openForestDocument(['a', 'b', 'c'], 'a', 'append', 'c'), ['b', 'c', 'a']);
});

test('graph-linked posts outside the document index can open as canonical panels without accepting other URLs', () => {
  const origin = 'https://blog.yuntae.in';
  const id = '22222222-2222-4222-8222-222222222222';
  assert.equal(forestPageIdFromHref('/' + id.replaceAll('-', '') + '#section', origin), id);
  assert.equal(forestPageIdFromHref('/forest?document=' + id, origin), id);
  for (const href of ['https://example.com/' + id, '/graph', '/recap?document=' + id, '/invalid', 'javascript:alert(1)']) {
    assert.equal(forestPageIdFromHref(href, origin), undefined);
  }
});

test('folder sorting aggregates descendants through every parent and sorts document titles independently', () => {
  const docs = [doc('1', 'Z', 'Alpha/Deep', '20'), doc('2', 'A', 'Beta/Deep', '02'), doc('3', 'B', 'Alpha/Other', '10')];
  const tree = buildFolderTree(docs);
  assert.deepEqual(sortedFolders(tree, 'title-asc').map(f => f.name), ['Alpha', 'Beta']);
  assert.deepEqual(sortedFolders(tree, 'edited-desc').map(f => f.name), ['Alpha', 'Beta']);
  assert.deepEqual(sortedFolders(tree, 'edited-asc').map(f => f.name), ['Beta', 'Alpha']);
  assert.deepEqual(sortedFolders(tree, 'created-desc').map(f => f.name), ['Alpha', 'Beta']);
  assert.deepEqual(sortedFolders(tree.folders.get('Alpha'), 'edited-asc').map(f => f.name), ['Other', 'Deep']);
  assert.deepEqual(docs.sort((a,b) => compareDocuments(a,b,'title-asc')).map(d => d.title), ['A', 'B', 'Z']);
});

test('only known same-origin document links can become panels; external and unrelated routes stay ordinary links', () => {
  const docs = [doc('11111111-1111-4111-8111-111111111111', 'Doc', '', '01')];
  const origin = 'https://blog.yuntae.in';
  assert.equal(forestDocumentFromHref('/11111111111141118111111111111111#block', origin, docs), docs[0]);
  assert.equal(forestDocumentFromHref(`/forest?document=${docs[0].id}`, origin, docs), docs[0]);
  for (const href of ['https://example.com/' + docs[0].id, '/graph', '/not-a-document', '/forest', 'javascript:alert(1)']) {
    assert.equal(forestDocumentFromHref(href, origin, docs), undefined);
  }
});
