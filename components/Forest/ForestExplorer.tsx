import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ForestTree } from "./ForestTree";
import { ForestPanel } from "./ForestPanel";
import { FolderToggleIcon } from "./FolderToggleIcon";
import { ForestSortMenu } from "./ForestSortMenu";
import { folderAncestors, type ForestDocument } from "../../utils/search/folders";
import { compareDocuments, forestPageIdFromHref, forestPanelWindow, openForestDocument, type ForestSort } from "../../utils/forest-navigation";

const dragType = "application/x-forest-document";
export function ForestExplorer({ documents }: { documents: ForestDocument[] }) {
  const router = useRouter();
  const [panels, setPanels] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [foldersReady, setFoldersReady] = useState(false);
  const [sort, setSort] = useState<ForestSort>("title-asc");
  const [draggedId, setDraggedId] = useState("");
  const [dropSide, setDropSide] = useState<"replace" | "append" | null>(null);
  const [stackWidth, setStackWidth] = useState(0);
  const [stacked, setStacked] = useState(false);
  const [linkedDocuments, setLinkedDocuments] = useState<Record<string, ForestDocument>>({});
  const stackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<number | null>(null);
  const dropCommittedRef = useRef(false);
  const listRef = useRef<HTMLElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const folderRefs = useRef(new Map<string, HTMLButtonElement>());
  const documentsById = useMemo(() => new Map(documents.map((doc) => [doc.id, doc])), [documents]);
  const visibleDocuments = useMemo(() => [...documents].sort((a, b) => compareDocuments(a, b, sort)), [documents, sort]);
  const allFolders = useMemo(() => new Set(documents.flatMap((doc) => folderAncestors(doc.folderPath))), [documents]);
  const allExpanded = allFolders.size > 0 && [...allFolders].every((path) => expanded.has(path));
  const appendPreview = !!draggedId && dropSide === "append";
  const spreadPanels = stacked || appendPreview;
  const focusIndex = Math.max(0, panels.indexOf(focusedId));
  const { start: firstVisible, visible: visibleCount, panelWidth } = forestPanelWindow(panels.length, focusIndex, stackWidth, appendPreview);
  const twoPanels = visibleCount === 2;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("forest_expanded_folders") || "[]");
      if (Array.isArray(saved)) setExpanded(new Set(saved.filter((path) => typeof path === "string")));
      if (listRef.current) listRef.current.scrollTop = Number(sessionStorage.getItem("forest_list_scroll_top")) || 0;
    } catch { }
    setFoldersReady(true);
  }, []);
  useEffect(() => {
    if (foldersReady) try { sessionStorage.setItem("forest_expanded_folders", JSON.stringify([...expanded])); } catch { }
  }, [expanded, foldersReady]);
  useEffect(() => {
    if (!router.isReady) return;
    const ids = typeof router.query.panels === "string" ? router.query.panels.split(",") : typeof router.query.document === "string" ? [router.query.document] : [];
    const valid = [...new Set(ids.map((id) => forestPageIdFromHref(`/${id}`, "https://forest.local")).filter((id): id is string => !!id))];
    setPanels(valid); setFocusedId(valid.at(-1) || ""); setStacked(router.query.layout === "stack");
  }, [router.isReady, router.query.document, router.query.panels, router.query.layout, documentsById]);
  useEffect(() => {
    const host = stackRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => setStackWidth(host.clientWidth));
    observer.observe(host);
    return () => observer.disconnect();
  }, [panels.length]);
  useEffect(() => {
    if (!foldersReady || !focusedId) return;
    const doc = documentsById.get(focusedId);
    if (doc) setExpanded((current) => new Set([...current, ...folderAncestors(doc.folderPath)]));
  }, [focusedId, foldersReady, documentsById]);
  useEffect(() => {
    const host = viewportRef.current;
    const active = host?.querySelector<HTMLElement>(`[data-document-id="${focusedId}"]`);
    if (!host || !active || appendPreview) return;
    const bounds = host.getBoundingClientRect();
    const panel = active.getBoundingClientRect();
    if (panel.right > bounds.right) host.scrollLeft += panel.right - bounds.right;
    else if (panel.left < bounds.left) host.scrollLeft -= bounds.left - panel.left;
  }, [focusedId, twoPanels, panels.length, stacked, appendPreview]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (appendPreview) {
      if (previewScrollRef.current === null) previewScrollRef.current = viewport.scrollLeft;
      viewport.scrollTo({ left: viewport.scrollWidth - viewport.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else if (previewScrollRef.current !== null) {
      if (!dropCommittedRef.current) viewport.scrollLeft = previewScrollRef.current;
      previewScrollRef.current = null;
      dropCommittedRef.current = false;
    }
  }, [appendPreview, stackWidth, stacked]);
  useEffect(() => {
    const clear = () => { setDraggedId(""); setDropSide(null); };
    window.addEventListener("dragend", clear); window.addEventListener("drop", clear);
    return () => { window.removeEventListener("dragend", clear); window.removeEventListener("drop", clear); };
  }, []);

  const navigate = (ids: string[], hash = "", keepStack = false) => {
    setPanels(ids); setFocusedId(ids.at(-1) || ""); setStacked(keepStack);
    const query = ids.length ? { document: ids.at(-1)!, ...(ids.length > 1 ? { panels: ids.join(",") } : {}), ...(keepStack ? { layout: "stack" } : {}) } : {};
    void router.push({ pathname: "/forest", query, hash }, undefined, { shallow: true, scroll: false });
  };
  const open = (id: string, mode: "replace" | "append", source?: string, hash = "", keepStack = false) => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    navigate(openForestDocument(panels, id, mobile ? "replace" : mode, source), hash, !mobile && keepStack);
    const doc = documentsById.get(id);
    if (doc) setExpanded((current) => new Set([...current, ...folderAncestors(doc.folderPath)]));
  };
  const openLink = (href: string, source: string, title?: string) => {
    const id = forestPageIdFromHref(href, window.location.origin);
    if (!id) return false;
    if (id === source) return true;
    if (!documentsById.has(id)) setLinkedDocuments((current) => ({ ...current, [id]: { id, title: title || "문서", folderPath: "", createdTime: "", lastEditedTime: "" } }));
    open(id, "append", source, new URL(href, window.location.origin).hash);
    return true;
  };

  return <main className={`forest-explorer ${panels.length ? "has-panels" : "is-index"} ${draggedId ? "is-dragging" : ""}`}>
    <aside className="forest-sidebar" aria-label="문서 목록">

      <div className="forest-sidebar-toolbar"><span className="forest-document-count">문서 {documents.length}개</span><div className="forest-sidebar-actions"><button className="forest-icon-button" type="button" disabled={!allFolders.size} title={allExpanded ? "모든 폴더 접기" : "모든 폴더 펼치기"}
        aria-label={allExpanded ? "모든 폴더 접기" : "모든 폴더 펼치기"} onClick={() => setExpanded(allExpanded ? new Set() : new Set(allFolders))}>
        <FolderToggleIcon expanded={allExpanded} />
      </button>
        <ForestSortMenu value={sort} onChange={setSort} /></div></div>
      <nav className="forest-document-list" ref={listRef} onScroll={(event) => { try { sessionStorage.setItem("forest_list_scroll_top", String(event.currentTarget.scrollTop)); } catch { } }}>
        <ForestTree documents={visibleDocuments} expanded={expanded} selectedId={focusedId} sort={sort} itemRefs={itemRefs} folderRefs={folderRefs}
          onToggle={(path) => setExpanded((current) => { const next = new Set(current); if (next.has(path)) next.delete(path); else next.add(path); return next; })}
          onSelect={(doc) => open(doc.id, "replace")}
          onDragStart={(event, doc) => {
            if (window.matchMedia("(max-width: 760px)").matches) { event.preventDefault(); return; }
            dropCommittedRef.current = false;
            event.dataTransfer.setData(dragType, doc.id); event.dataTransfer.effectAllowed = "copy"; setDraggedId(doc.id);
          }}
          onDragEnd={() => { setDraggedId(""); setDropSide(null); }} />
        {!documents.length && <p className="forest-empty-list">등록된 문서가 없습니다.</p>}
      </nav>
    </aside>
    <div ref={stackRef} className={`forest-panel-stack ${spreadPanels ? "is-spread" : ""}`} aria-label="열린 문서"
      style={{ "--forest-panel-width": `${panelWidth}px` } as CSSProperties}
      onDragOver={(event) => {
        if (!draggedId || !event.dataTransfer.types.includes(dragType)) return;
        event.preventDefault(); event.dataTransfer.dropEffect = "copy";
        const rect = event.currentTarget.getBoundingClientRect();
        setDropSide(event.clientX < rect.left + rect.width / 2 ? "replace" : "append");
      }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropSide(null); }}
      onDrop={(event) => {
        const id = event.dataTransfer.getData(dragType);
        if (!draggedId || !documentsById.has(id)) return;
        event.preventDefault();
        dropCommittedRef.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        const mode = event.clientX < rect.left + rect.width / 2 ? "replace" : "append";
        open(id, mode, undefined, "", mode === "append");
        setDraggedId(""); setDropSide(null);
      }}>
      <div ref={viewportRef} className="forest-panel-viewport"><div className="forest-panel-track">
      {panels.map((id, index) => <ForestPanel key={id} document={documentsById.get(id) || linkedDocuments[id] || { id, title: "문서", folderPath: "", createdTime: "", lastEditedTime: "" }}
        anchor={id === panels.at(-1) ? router.asPath.split("#")[1] || "" : ""}
        collapsed={index < firstVisible || index >= firstVisible + visibleCount} mobileVisible={id === focusedId}
        onExpand={() => setFocusedId(id)} onClose={() => navigate(panels.filter((value) => value !== id), "", stacked)}
        onBack={() => navigate([])} onNavigate={(href, title) => openLink(href, id, title)} />)}
      {appendPreview && <div className="forest-drop-placeholder" aria-hidden="true"><strong>여기에 문서 추가</strong><span>{documentsById.get(draggedId)?.title}</span></div>}
      </div></div>
      {!!draggedId && dropSide === "replace" && <div className="forest-drop-guide" aria-hidden="true"><strong>이 문서로 바꾸기</strong><span>열린 문서를 닫고 새로 열기</span></div>}
    </div>
  </main>;
}
