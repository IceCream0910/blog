const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { paginateRecapSection, recapCoverTitle } = require('../utils/recap-pagination.ts');
const { SKY_PRESETS, chooseSkyPreset, skyPresetForPost, skyTones } = require('../utils/recap-sky-presets.ts');
const options = { budget: 600, gap: 20, sideBySide: false, lineHeight: 28 };
const text = (id, height = 130) => ({ id, type: 'text', height, characters: 100 });
const image = id => ({ id, type: 'image', height: 280, characters: 0 });
test('subtitle keeps explicit lines and falls back to year-month', () => {
  assert.equal(recapCoverTitle({ date: '2026-09-30', subtitle: '  여름의 끝\n새로운 시작  ' }), '여름의 끝\n새로운 시작');
  assert.equal(recapCoverTitle({ date: '2026-09-30', subtitle: '  ' }), '2026-09');
  assert.equal(recapCoverTitle({ date: '2026-09-30', subtitle: '첫 줄\\n다음 줄' }), '첫 줄\n다음 줄');
});
test('all twelve actual sky palettes can be selected', () => {
  assert.equal(SKY_PRESETS.length, 12);
  SKY_PRESETS.forEach((preset, i) => {
    assert.equal(chooseSkyPreset(() => (i + .5) / 12), preset);
    Object.values(skyTones(preset.stops)).flat().forEach(value => assert.ok(value >= 0 && value <= 1));
  });
});
test('consecutive images form one contextual stack, preserving every block once', () => {
  const blocks = [text('a'), image('b'), image('c'), image('d'), text('e')];
  const pages = paginateRecapSection(blocks, options);
  assert.equal(pages[0].layout, 'stack');
  assert.deepEqual(pages[0].blockIds, ['a', 'b', 'c', 'd']);
  assert.deepEqual(pages.flatMap(page => page.blockIds), blocks.map(block => block.id));
});
test('a tall passage stays with its image in an immersive page', () => {
  const pages = paginateRecapSection([text('a', 420), image('b')], { ...options, budget: 400 });
  assert.equal(pages.length, 1);
  assert.equal(pages[0].layout, 'immersive');
  assert.deepEqual(pages[0].blockIds, ['a', 'b']);
});
test('leading image and bookmark take adjacent text without losing content', () => {
  for (const type of ['image', 'bookmark']) {
    const pages = paginateRecapSection([{ ...image('a'), type }, text('b', 450)], options);
    assert.equal(pages.length, 1);
    assert.deepEqual(pages[0].blockIds, ['a', 'b']);
  }
});
test('image-only sections stay grouped and empty sections create no fake pages', () => {
  assert.deepEqual(paginateRecapSection([], options), []);
  const pages = paginateRecapSection([image('a'), image('b')], options);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].layout, 'stack');
});
test('varying viewport budgets preserve exact source order and coverage', () => {
  const blocks = [text('a'), text('b'), image('c'), image('d'), text('e'), { ...image('f'), type: 'bookmark' }, text('g', 800), image('h')];
  for (const budget of [200, 400, 650, 950]) for (const sideBySide of [false, true]) {
    const pages = paginateRecapSection(blocks, { ...options, budget, sideBySide });
    assert.deepEqual(pages.flatMap(page => page.blockIds), blocks.map(block => block.id));
    assert.ok(pages.every(page => page.blockIds.length && page.textMaxHeight > 0));
  }
});

test('post palette is stable across mounts and canonical UUID forms', () => {
  const id = '3ebfc9b9-3eca-802b-811c-c34dd85f710f';
  const expected = skyPresetForPost(id);
  for (let index = 0; index < 20; index++) assert.equal(skyPresetForPost(id), expected);
  assert.equal(skyPresetForPost(id.replaceAll('-', '').toUpperCase()), expected);
  assert.ok(new Set(Array.from({length: 100}, (_, i) => skyPresetForPost('post-' + i).name)).size > 8);
});
