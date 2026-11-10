import { NotionAPI } from 'notion-client';
import { blockValue } from './backlink-graph';

export function normalizeNotionRecordMap(recordMap: any, pageId: string) {
  const root = blockValue(recordMap?.block?.[pageId]);
  if (!root?.id || !['page', 'collection_view_page'].includes(root.type)) throw new Error(`Incomplete Notion page response: ${pageId}`);
  for (const [id, entry] of Object.entries(recordMap.block) as [string, any][]) {
    recordMap.block[id] = { ...entry, value: blockValue(entry) };
  }
  return recordMap;
}
export async function getNotionPage(pageId: string, build?: { signal: AbortSignal; beforeRequest: (signal: AbortSignal) => Promise<void> }) {
  const notion = new NotionAPI({ apiBaseUrl: 'https://app.notion.com/api/v3' });
  let rateLimit: { status: number; response: Response } | undefined;
  const recordMap = await notion.getPage(pageId, build && {
    concurrency: 1,
    throwOnCollectionErrors: true,
    ofetchOptions: {
      retry: 0,
      signal: build.signal,
      onRequest: () => build.beforeRequest(build.signal),
      // The client catches signed-URL errors internally, so preserve its rate limits.
      onResponseError: ({ response }) => {
        if (response.status === 429 || response.status === 529) rateLimit = { status: response.status, response };
      },
    },
  });
  if (rateLimit) throw Object.assign(new Error('Notion rate limit'), rateLimit);
  return normalizeNotionRecordMap(recordMap, pageId);
}
export function isNotionNotFound(error: any) {
  return (error?.statusCode || error?.status || error?.response?.status) === 404 || error?.code === 'object_not_found';
}
