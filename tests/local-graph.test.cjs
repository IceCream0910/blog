const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { buildLocalGraph, compactNotionId, resolveOutgoingSources } = require("../utils/backlink-graph.ts");
const { fitCompactGraph } = require("../utils/compact-graph-layout.ts");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("finds direct links inside the current article without following the linked articles", () => {
  const [root, text, mention, direct, child, nested, unrelated, alias, aliasedPage, bookmark, bookmarkedPage] =
    Array.from({ length: 11 }, (_, index) => id(index));
  const value = (id, type, fields) => ({ value: { id, type, ...fields } });
  const map = { block: {
    [root]: value(root, "page", { content: [text, child, alias, bookmark] }),
    [text]: value(text, "text", { properties: { title: [
      ["mention", [["p", compactNotionId(mention)]]],
      ["duplicate", [["a", `/${mention}`]]],
      ["blog link", [["a", `https://blog.yuntae.in/${direct}#section`]]],
      ["other site", [["a", `https://example.com/${unrelated}`]]],
      ["self", [["p", root]]],
      ["block", [["a", `/${text}`]]],
    ] } }),
    [mention]: value(mention, "page", { properties: { title: [["Document"], [" title"]] } }),
    [child]: value(child, "page", { content: [nested] }),
    [nested]: value(nested, "text", { properties: { title: [["nested link", [["a", `/${unrelated}`]]]] } }),
    [alias]: value(alias, "alias", { format: { alias_pointer: { id: aliasedPage } } }),
    [aliasedPage]: value(aliasedPage, "collection_view_page", {}),
    [bookmark]: value(bookmark, "bookmark", { properties: { title: [["Bookmark"]], link: [[`/forest?document=${bookmarkedPage}`]] } }),
  } };
  assert.deepEqual(resolveOutgoingSources(map, root).map(({ id, href }) => [id, href]), [
    [mention, `/${mention}`], [direct, `/${direct}#section`], [child, `/${child}`],
    [aliasedPage, `/${aliasedPage}`], [bookmarkedPage, `/${bookmarkedPage}`],
  ]);
  assert.equal(resolveOutgoingSources(map, root)[0].title, "Document title");
});

test("merges reciprocal references and preserves the incoming mention anchor", () => {
  const [root, incoming, outgoing, mutual] = [0, 1, 2, 3].map(id);
  const source = (id, hash = "") => ({ id, title: id, href: `/${id}${hash}` });
  const graph = buildLocalGraph(root, "Root",
    [source(root), source(incoming), source(mutual, "#mention")],
    [source(outgoing), source(compactNotionId(mutual))]);
  assert.deepEqual(graph.nodes.map((node) => node.href), [`/${root}`, `/${incoming}`, `/${mutual}#mention`, `/${outgoing}`]);
  assert.deepEqual(graph.links, [
    { source: incoming, target: root }, { source: mutual, target: root }, { source: root, target: outgoing },
  ]);
});

test("fits all dense graph nodes inside the mobile box with room for their circles", () => {
  const size = { width: 320, height: 220 };
  const points = Array.from({ length: 96 }, (_, index) => ({ x: (index % 12) * 84 - 400, y: Math.floor(index / 12) * 65 - 80 }));
  const fitted = fitCompactGraph(points, size);
  assert.equal(fitted.points.length, points.length);
  assert.ok(fitted.scale < 1);
  for (const { x, y } of fitted.points) assert.ok(x >= 16 && x <= 304 && y >= 16 && y <= 204);
  assert.deepEqual(fitCompactGraph([{ x: -50, y: 800 }], size).points, [{ x: 160, y: 110 }]);
});
