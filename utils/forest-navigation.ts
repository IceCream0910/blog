import { compactNotionId } from "./backlink-graph";
import type { ForestDocument, FolderNode } from "./search/folders";

export type ForestSort = "edited-desc" | "edited-asc" | "created-desc" | "title-asc";
export function forestPanelWindow(count: number, focus: number, width: number, preview = false) {
  const total = count + (preview ? 1 : 0);
  const visible = width - Math.max(0, total - 2) * 42 >= 960 ? 2 : 1;
  const start = preview ? Math.max(0, total - visible) : visible === 2 ? Math.max(0, Math.min(focus - 1, count - 2)) : Math.max(0, focus);
  return { start, visible, panelWidth: Math.max(360, (width - Math.max(0, total - visible) * 42) / visible) };
}
export function compareDocuments(a: ForestDocument, b: ForestDocument, sort: ForestSort) {
  const title = a.title.localeCompare(b.title, "ko-KR");
  if (sort === "title-asc") return title;
  const field = sort === "created-desc" ? "createdTime" : "lastEditedTime";
  return (Date.parse(a[field]) - Date.parse(b[field])) * (sort === "edited-asc" ? 1 : -1) || title;
}
export function sortedFolders(node: FolderNode, sort: ForestSort): FolderNode[] {
  const date = (folder: FolderNode): number => {
    const values = [...folder.documents.map((doc) => Date.parse(sort === "created-desc" ? doc.createdTime : doc.lastEditedTime)), ...[...folder.folders.values()].map(date)];
    return sort === "edited-asc" ? Math.min(...values) : Math.max(...values);
  };
  return [...node.folders.values()].sort((a, b) => {
    const title = a.name.localeCompare(b.name, "ko-KR");
    return sort === "title-asc" ? title : (date(a) - date(b)) * (sort === "edited-asc" ? 1 : -1) || title;
  });
}
export function openForestDocument(current: string[], id: string, mode: "replace" | "append", source?: string) {
  if (mode === "replace") return [id];
  const index = source ? current.indexOf(source) : -1;
  const base = index < 0 ? current : current.slice(0, index + 1);
  return [...base.filter((value) => value !== id), id];
}
export function forestDocumentFromHref(href: string, origin: string, documents: ForestDocument[]) {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return;
    const id = url.pathname === "/forest" ? url.searchParams.get("document") : url.pathname.slice(1).replace(/\/$/, "");
    return documents.find((doc) => compactNotionId(doc.id) === compactNotionId(id || ""));
  } catch { return; }
}
export function forestPageIdFromHref(href: string, origin: string) {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return;
    const raw = url.pathname === "/forest" ? url.searchParams.get("document") || "" : url.pathname.slice(1).replace(/\/$/, "");
    const id = compactNotionId(raw);
    if (!/^[a-f0-9]{32}$/.test(id)) return;
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  } catch { return; }
}
