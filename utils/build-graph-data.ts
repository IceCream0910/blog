import { getDatabase } from "./get-database";
import { compactNotionId, fetchNotionBacklinks, resolveBacklinkSources } from "./backlink-graph";

const MAIN_DATABASE_ID = "1a346171ed574b0a9c1c3f5a29b39919";
const FOREST_DATABASE_ID = "ff85c8c8bc3345babf2f7970d86506d4";

function pageTitle(page: any) {
  const property = Object.values(page?.properties || {}).find((value: any) => value?.type === "title") as any;
  return property?.title?.map((item: any) => item.plain_text || item.text?.content || "").join("") || "제목 없는 문서";
}

function forestKind(page: any) {
  const category = page?.properties?.["forest_분류"]?.select?.name;
  if (category === "일지") return "recap";
  if (category === "프로젝트") return "project";
  return "document";
}

const GROUPS = [
  { id: "group:post", title: "포스팅", href: "/", kind: "group", group: "post" },
  { id: "group:project", title: "프로젝트", href: "/forest", kind: "group", group: "project" },
  { id: "group:recap", title: "월말결산", href: "/recap", kind: "group", group: "recap" },
  { id: "group:document", title: "문서", href: "/forest", kind: "group", group: "document" },
];

export async function buildGraphData() {
  const [main, forest] = await Promise.all([getDatabase(MAIN_DATABASE_ID), getDatabase(FOREST_DATABASE_ID)]);
  const pages = [
    ...main.results.map((page: any) => ({ page, kind: "post" })),
    ...forest.results.map((page: any) => ({ page, kind: forestKind(page) })),
  ];
  const nodes = new Map<string, any>();

  pages.forEach(({ page, kind }) => nodes.set(compactNotionId(page.id), {
    id: page.id,
    title: pageTitle(page),
    href: `/${page.id}`,
    kind,
    group: kind,
  }));

  const edges = new Map<string, { source: string; target: string; kind?: "reference" | "membership" }>();
  const batchSize = 8;
  for (let index = 0; index < pages.length; index += batchSize) {
    const results = await Promise.all(pages.slice(index, index + batchSize).map(async ({ page }) => {
      try {
        return { target: page.id, payload: await fetchNotionBacklinks(page.id) };
      } catch {
        return null;
      }
    }));

    results.forEach((result) => {
      if (!result) return;
      const targetKey = compactNotionId(result.target);
      const target = nodes.get(targetKey);
      if (!target) return;
      resolveBacklinkSources(result.payload).forEach((source) => {
        const sourceKey = compactNotionId(source.id);
        const existingSource = nodes.get(sourceKey);
        if (!existingSource) nodes.set(sourceKey, { ...source, href: `/${source.id}`, kind: "reference" });
        const sourceId = (existingSource || nodes.get(sourceKey)).id;
        if (compactNotionId(sourceId) !== targetKey) {
          edges.set(`${compactNotionId(sourceId)}:${targetKey}`, { source: sourceId, target: target.id, kind: "reference" });
        }
      });
    });
  }

  GROUPS.forEach((group) => nodes.set(group.id, group));
  [...nodes.values()].forEach((node) => {
    if (!node.group || node.kind === "group") return;
    const groupId = `group:${node.group}`;
    edges.set(`membership:${groupId}:${compactNotionId(node.id)}`, {
      source: groupId,
      target: node.id,
      kind: "membership",
    });
  });

  return { version: 3, nodes: [...nodes.values()], links: [...edges.values()], generatedAt: new Date().toISOString() };
}
