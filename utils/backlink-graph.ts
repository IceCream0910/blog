import type { ExtendedRecordMap } from "notion-types";

export type BacklinkSource = {
  id: string;
  title: string;
  href: string;
};

export const compactNotionId = (id = "") => id.replace(/-/g, "").toLowerCase();

export function blockValue(entry: any) {
  if (entry?.value?.value && entry.value.role) return entry.value.value;
  return entry?.value || entry;
}

export async function fetchNotionBacklinks(currentId: string, signal?: AbortSignal) {
  const response = await fetch("https://app.notion.com/api/v3/getBacklinksForBlockInitial", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      cookie: `token_v2=${process.env.NOTION_TOKEN};`,
    },
    body: JSON.stringify({
      block: {
        id: currentId,
        spaceId: "efee2221-b063-4e3f-b2ba-7931ce73adb9",
      },
    }),
  });

  if (!response.ok) throw new Error(`Backlink request failed: ${response.status}`);
  return response.json();
}

export function resolveBacklinkSources(payload: any): BacklinkSource[] {
  const backlinks = Array.isArray(payload?.backlinks) ? payload.backlinks : [];
  const blocks = payload?.recordMap?.block || {};
  const sources = new Map<string, BacklinkSource>();

  backlinks.forEach((backlink: any) => {
    const mentionId = backlink?.mentioned_from?.block_id;
    let current = blockValue(blocks[mentionId]);
    const visited = new Set<string>();

    while (current?.id && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.type === "page") {
        const title = current.properties?.title?.[0]?.[0] || "제목 없는 문서";
        const key = compactNotionId(current.id);
        sources.set(key, {
          id: current.id,
          title: String(title),
          href: `/${current.id}#${compactNotionId(mentionId)}`,
        });
        break;
      }
      current = blockValue(blocks[current.parent_id]);
    }
  });

  return [...sources.values()];
}

const BLOG_ORIGIN = "https://blog.yuntae.in";
const PAGE_ID = /^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i;

export function resolveOutgoingSources(recordMap: ExtendedRecordMap, currentId: string): BacklinkSource[] {
  const currentKey = compactNotionId(currentId);
  const blocks = new Map(Object.entries(recordMap?.block || {}).map(([id, entry]) => [compactNotionId(id), blockValue(entry)]));
  const sources = new Map<string, BacklinkSource>();
  const isPage = (block: any) => block?.type === "page" || block?.type === "collection_view_page";
  const add = (id: unknown, label?: string, hash = "", allowMissing = false) => {
    if (typeof id !== "string" || !PAGE_ID.test(id)) return;
    const key = compactNotionId(id);
    const target = blocks.get(key);
    if (key === currentKey || sources.has(key) || (!allowMissing && !isPage(target)) || (target && !isPage(target))) return;
    const title = target?.properties?.title?.map(([text]: [string]) => text).join("").trim();
    sources.set(key, { id: target?.id || id, title: title || label?.trim() || "제목 없는 문서", href: `/${target?.id || id}${hash}` });
  };
  const addHref = (href: unknown, label?: string) => {
    if (typeof href !== "string" || href.startsWith("#")) return;
    try {
      const url = new URL(href, BLOG_ORIGIN);
      const path = url.pathname.replace(/\/$/, "");
      if (url.origin === BLOG_ORIGIN) {
        const id = path === "/forest" ? url.searchParams.get("document") : path.slice(1);
        if (id && PAGE_ID.test(id)) {
          add(id, label, url.hash, true);
        } else if (href.startsWith("/") && !href.startsWith("//")) {
          // Notion can encode links as relative slug-ID paths.
          add(path.match(/-([a-f0-9]{32})$/i)?.[1], label, url.hash);
        }
      } else if (url.protocol === "https:" && (url.hostname === "notion.so" || url.hostname.endsWith(".notion.so") || url.hostname.endsWith(".notion.site"))) {
        const segment = path.split("/").pop() || "";
        add(PAGE_ID.test(segment) ? segment : segment.match(/-([a-f0-9]{32})$/i)?.[1], label, url.hash);
      }
    } catch {
      // Ignore malformed links.
    }
  };

  const visited = new Set<string>();
  const pending = [currentKey];
  while (pending.length) {
    const key = compactNotionId(pending.pop());
    if (visited.has(key)) continue;
    visited.add(key);
    const block = blocks.get(key);
    if (!block) continue;
    if (key !== currentKey && isPage(block)) {
      add(block.id);
      continue;
    }
    if (block.type === "alias") add(block.format?.alias_pointer?.id);
    if (block.type === "bookmark") addHref(block.properties?.link?.[0]?.[0], block.properties?.title?.[0]?.[0]);
    for (const value of Object.values(block.properties || {})) {
      if (!Array.isArray(value)) continue;
      for (const part of value) {
        if (!Array.isArray(part) || !Array.isArray(part[1])) continue;
        const [label, decorations] = part;
        for (const [kind, target] of decorations) {
          if (kind === "p") add(target, label);
          if (kind === "‣" && Array.isArray(target) && target[0] !== "u") add(target[1], label);
          if (kind === "a") addHref(target, label);
        }
      }
    }
    if (block.type === "transclusion_reference") {
      const syncedId = block.format?.transclusion_reference_pointer?.id;
      if (syncedId) pending.push(syncedId);
    }
    for (const child of (block.content || []).slice().reverse()) pending.push(child);
  }
  return [...sources.values()];
}

export function buildLocalGraph(currentId: string, currentTitle: string, incoming: BacklinkSource[], outgoing: BacklinkSource[]) {
  const key = compactNotionId(currentId);
  const neighbors = new Map<string, BacklinkSource>();
  const links: Array<{ source: string; target: string }> = [];
  for (const [sources, isIncoming] of [[incoming, true], [outgoing, false]] as const) {
    for (const source of sources) {
      const id = compactNotionId(source.id);
      if (id === key || neighbors.has(id)) continue;
      neighbors.set(id, source);
      links.push(isIncoming ? { source: source.id, target: currentId } : { source: currentId, target: source.id });
    }
  }
  return {
    nodes: [
      { id: currentId, title: currentTitle, href: `/${currentId}`, kind: "current" as const },
      ...[...neighbors.values()].map((source) => ({ ...source, kind: "reference" as const })),
    ],
    links,
  };
}
