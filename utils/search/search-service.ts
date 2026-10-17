import { getDatabase } from "../get-database";
import { blockValue, compactNotionId } from "../backlink-graph";
import { folderPathFromProperty, normalizeFolderPath } from "./folders";
import type { SearchResult, SearchScope } from "./types";

export const FOREST_DATABASE_ID = "ff85c8c8bc3345babf2f7970d86506d4";
const MAIN_DATABASE_ID = "1a346171ed574b0a9c1c3f5a29b39919";
let catalog: { expires: number; items: SearchResult[] } | undefined;
let pending: Promise<SearchResult[]> | undefined;

export function normalizePage(page: any, type: SearchResult["type"]): SearchResult {
  const title = Object.values(page.properties || {}).find((property: any) => property.type === "title") as any;
  return {
    id: page.id,
    title: title?.title?.map((part: any) => part.plain_text || part.text?.content || "").join("") || "제목 없는 문서",
    type,
    folderPath: folderPathFromProperty(page.properties?.["forest_폴더"]),
    href: type === "document" ? `/forest?document=${page.id}` : type === "recap" ? `/recap?document=${page.id}` : `/${page.id}`,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

export async function getSearchCatalog(): Promise<SearchResult[]> {
  if (catalog && catalog.expires > Date.now()) return catalog.items;
  if (!pending) pending = Promise.all([getDatabase(MAIN_DATABASE_ID), getDatabase(FOREST_DATABASE_ID)])
    .then(([main, forest]) => {
      const currentMonth = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date());
      const items = [
        ...main.results.map((page: any) => normalizePage(page, "post")),
        ...forest.results.flatMap((page: any) => {
          const category = page.properties?.["forest_분류"]?.select?.name;
          const type = category === "문서" ? "document" : category === "프로젝트" ? "project" : category === "일지" ? "recap" : null;
          if (!type) return [];
          const date = page.properties?.["forest_날짜"]?.date?.start || page.created_time;
          if (type === "recap" && new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(new Date(date)) === currentMonth) return [];
          return [normalizePage(page, type)];
        }),
      ].filter((item) => item.id);
      catalog = { items, expires: Date.now() + 60_000 };
      return items;
    }).finally(() => { pending = undefined; });
  return pending;
}

export function inScope(item: SearchResult, scope: SearchScope = "all", folder = "") {
  const path = normalizeFolderPath(folder);
  return (scope === "all" || item.type === scope) && (!path || item.folderPath === path || item.folderPath.startsWith(`${path}/`));
}

function cleanHighlight(value: unknown) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, "").slice(0, 500) : "";
}

export async function searchContent(query: string, scope: SearchScope = "all", folder = "", limit = 30) {
  const items = (await getSearchCatalog()).filter((item) => inScope(item, scope, folder));
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  if (!normalized) return { results: [], partial: false };
  const matches = new Map<string, SearchResult>();
  items.filter((item) => item.title.toLocaleLowerCase("ko-KR").includes(normalized))
    .forEach((item) => matches.set(compactNotionId(item.id), item));
  const allowed = new Map(items.map((item) => [compactNotionId(item.id), item]));
  let partial = false;
  try {
    const response = await fetch("https://app.notion.com/api/v3/search", {
      method: "POST", headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        type: "BlocksInAncestor", query: query.trim(), ancestorId: "e5f8cfa7-6c5c-48e0-b060-734faa8cb4bb",
        filters: { isDeletedOnly: false, excludeTemplates: true, navigableBlockContentOnly: false, requireEditPermissions: false, includePublicPagesWithoutExplicitAccess: true, ancestors: [], createdBy: [], editedBy: [], lastEditedTime: {}, createdTime: {}, inTeams: [] },
        sort: { field: "relevance" }, limit: 100, source: "quick_find_input_change",
        searchSessionId: crypto.randomUUID(), searchSessionFlowNumber: 1,
        excludedBlockIds: [], searchExperimentOverrides: {},
      }),
    });
    if (!response.ok) throw new Error("Notion search unavailable");
    const data = await response.json();
    const blocks = data.recordMap?.block || {};
    for (const hit of data.results || []) {
      let id = hit.id;
      const visited = new Set<string>();
      while (id && !visited.has(id)) {
        visited.add(id);
        const key = compactNotionId(id);
        const item = allowed.get(key);
        if (item) {
          matches.set(key, { ...item, excerpt: cleanHighlight(hit.highlight?.text) || undefined });
          break;
        }
        id = blockValue(blocks[id] || blocks[key])?.parent_id;
      }
    }
  } catch { partial = true; }
  return { results: [...matches.values()].slice(0, Math.max(1, Math.min(limit, 50))), partial };
}
