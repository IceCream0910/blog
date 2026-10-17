import IonIcon from "@reacticons/ionicons";
import { useMemo } from "react";
import { buildFolderTree, type ForestDocument, type FolderNode } from "../../utils/search/folders";

type Props = {
  documents: ForestDocument[];
  expanded: Set<string>;
  selectedId: string;
  onToggle: (path: string) => void;
  onSelect: (document: ForestDocument) => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  folderRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
};

export function ForestTree(props: Props) {
  const root = useMemo(() => buildFolderTree(props.documents), [props.documents]);
  const renderFolder = (node: FolderNode) => <ul className="forest-tree-children">
    {[...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name, "ko-KR")).map((folder) => {
      const open = props.expanded.has(folder.path);
      return <li key={folder.path}>
        <button type="button" className="forest-folder-node" aria-expanded={open}
          ref={(element) => { if (element) props.folderRefs.current.set(folder.path, element); else props.folderRefs.current.delete(folder.path); }}
          onClick={() => props.onToggle(folder.path)}>
          <IonIcon name={open ? "chevron-down-outline" : "chevron-forward-outline"} aria-hidden="true" />
          <IonIcon name={open ? "folder-open-outline" : "folder-outline"} aria-hidden="true" />
          <span>{folder.name}</span>
        </button>
        {open && renderFolder(folder)}
      </li>;
    })}
    {node.documents.map((document) => <li key={document.id}>
      <button type="button" className={`forest-document-item ${document.id === props.selectedId ? "is-active" : ""}`}
        aria-current={document.id === props.selectedId ? "page" : undefined}
        ref={(element) => { if (element) props.itemRefs.current.set(document.id, element); else props.itemRefs.current.delete(document.id); }}
        onClick={() => props.onSelect(document)} title={document.title}>
        <IonIcon name="document-text-outline" aria-hidden="true" />
        <span className="forest-file-copy"><strong>{document.title}</strong></span>
      </button>
    </li>)}
  </ul>;
  return <div className="forest-tree">{renderFolder(root)}</div>;
}
