import { NotionAPI } from 'notion-client';
import { blockValue } from './backlink-graph';

export function deferredNotionPaths() {
  return { paths: [], fallback: 'blocking' as const };
}
export function normalizeNotionRecordMap(recordMap: any, pageId: string) {
  const root = blockValue(recordMap?.block?.[pageId]);
  if (!root?.id || !['page', 'collection_view_page'].includes(root.type)) throw new Error(`Incomplete Notion page response: ${pageId}`);
  for (const [id, entry] of Object.entries(recordMap.block) as [string, any][]) {
    recordMap.block[id] = { ...entry, value: blockValue(entry) };
  }
  return recordMap;
}
export async function getNotionPage(pageId: string) {
  const notion = new NotionAPI({ apiBaseUrl: 'https://app.notion.com/api/v3' });
  return normalizeNotionRecordMap(await notion.getPage(pageId), pageId);
}
export function isNotionNotFound(error: any) {
  return (error?.statusCode || error?.status || error?.response?.status) === 404 || error?.code === 'object_not_found';
}
