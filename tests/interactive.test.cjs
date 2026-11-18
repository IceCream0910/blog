const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { isInteractiveBlock, parseInteractiveBlock } = require("../components/Interactive/parser.ts");

const code = (language, ...parts) => ({ type: "code", properties: { language: [[language]], title: parts.map((part) => [part]) } });

test("recognizes Notion language names and rejoins split rich text", () => {
  const block = code("TypeScript", "// @blog-interactive/", "react v1\nexport default () => <div />;");
  assert.equal(isInteractiveBlock(block), true);
  assert.deepEqual(parseInteractiveBlock(block), { kind: "react", source: "export default () => <div />;" });
});

test("preserves ordinary code and recognizes explicit markers when a visualization is invalid", () => {
  for (const block of [
    code("TypeScript", "const example = '// @blog-interactive/react v1';"),
    code("JSON", '{"nested":{"$viz":1}}'),
    code("Plain Text", '{"$viz":1}'),
  ]) {
    assert.equal(isInteractiveBlock(block), false);
    assert.equal(parseInteractiveBlock(block), null);
  }
  for (const block of [
    code("JSON", '{"$viz": 1,'),
    code("JSON", '{"title":"example","$viz":2}'),
    code("JSON", '{"$viz":1,"kind":"stack","initial":[1],"options":{"capacity":0}}'),
    code("TypeScript", "// @blog-interactive/react v2\nexport default () => null;"),
  ]) {
    assert.equal(isInteractiveBlock(block), true);
    assert.deepEqual(parseInteractiveBlock(block), { kind: "invalid" });
  }
});

test("accepts the original type field and the newer kind field", () => {
  for (const key of ["type", "kind"]) {
    const block = code("JSON", JSON.stringify({ $viz: 1, [key]: "queue", initial: [10, 20], options: { capacity: 6, allowPop: false } }));
    assert.deepEqual(parseInteractiveBlock(block), {
      kind: "queue", title: undefined, initial: [10, 20], capacity: 6,
      allowPush: true, allowPop: false, animated: true,
    });
  }
});
