import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function notionPrerenderPaths() {
  const dir = process.env.NOTION_PRERENDER_DIR;
  const ids: string[] = dir ? JSON.parse(readFileSync(join(dir, 'paths.json'), 'utf8')) : [];
  return { paths: ids.map((pageId) => ({ params: { pageId } })), fallback: 'blocking' as const };
}

export function readPrerenderedNotionPage(pageId: string): { recordMap: any; cachedSummary: string } | undefined {
  const dir = process.env.NOTION_PRERENDER_DIR;
  if (!dir) return;
  try {
    return JSON.parse(readFileSync(join(dir, `${pageId}.json`), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
