export type ForestDocument = {
  id: string; title: string; folderPath: string; createdTime: string; lastEditedTime: string;
};
export type FolderNode = {
  name: string; path: string; folders: Map<string, FolderNode>; documents: ForestDocument[];
};
export function normalizeFolderPath(value = "") {
  return value.split("/").map((part) => part.trim()).filter(Boolean).join("/");
}
export function folderPathFromProperty(property: any) {
  const text = Array.isArray(property?.rich_text)
    ? property.rich_text.map((part: any) => part.plain_text || part.text?.content || "").join("")
    : property?.select?.name || "";
  return normalizeFolderPath(text);
}
export function folderAncestors(value = "") {
  const parts = normalizeFolderPath(value).split("/").filter(Boolean);
  return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
}
export function buildFolderTree(documents: ForestDocument[]): FolderNode {
  const root: FolderNode = { name: "", path: "", folders: new Map(), documents: [] };
  for (const document of documents) {
    let parent = root;
    for (const path of folderAncestors(document.folderPath)) {
      if (!parent.folders.has(path)) {
        parent.folders.set(path, { name: path.split("/").pop()!, path, folders: new Map(), documents: [] });
      }
      parent = parent.folders.get(path)!;
    }
    parent.documents.push(document);
  }
  return root;
}
