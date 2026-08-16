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

export async function fetchNotionBacklinks(currentId: string) {
  const response = await fetch("https://app.notion.com/api/v3/getBacklinksForBlockInitial", {
    method: "POST",
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
