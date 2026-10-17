import IonIcon from "@reacticons/ionicons";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NotionRenderer } from "../../packages/notionx";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Code, Collection, Equation, Modal } from "../../utils/notion-components";
import { Backlinks } from "../Backlinks";
import Comments from "../Comments";
import { ForestTree } from "./ForestTree";
import { folderAncestors, type ForestDocument } from "../../utils/search/folders";
import { useSearch } from "../Search/SearchProvider";

type ForestExplorerProps = {
  documents: ForestDocument[];
};

type SortOption = "edited-desc" | "edited-asc" | "created-desc" | "title-asc";

const rendererComponents = { Code, Collection, Equation, Modal };
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function formatEditedTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function ForestExplorer({ documents }: ForestExplorerProps) {
  const router = useRouter();
  const darkMode = useDarkMode();
  const [selectedId, setSelectedId] = useState(documents[0]?.id || "");
  const openSearch = useSearch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [foldersReady, setFoldersReady] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("edited-desc");
  const [recordMap, setRecordMap] = useState<any>(null);
  const [recordMapDocumentId, setRecordMapDocumentId] = useState("");
  const [error, setError] = useState("");
  const [mobileDocumentOpen, setMobileDocumentOpen] = useState(false);
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const cacheRef = useRef(new Map<string, any>());
  const documentItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const folderItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const listRef = useRef<HTMLElement | null>(null);
  const listScrollTopRef = useRef<number>(0);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const selectionScrollModeRef = useRef<"preserve" | "reveal">("reveal");

  const selectedDocument = documents.find((document) => document.id === selectedId) || documents[0];
  const renderedDocument = documents.find((document) => document.id === recordMapDocumentId) || selectedDocument;
  const visibleDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      if (sortOption === "title-asc") return a.title.localeCompare(b.title, "ko-KR");
      if (sortOption === "created-desc") return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      if (sortOption === "edited-asc") return new Date(a.lastEditedTime).getTime() - new Date(b.lastEditedTime).getTime();
      return new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime();
    });
  }, [documents, sortOption]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("forest_expanded_folders") || "[]");
      if (Array.isArray(saved)) setExpanded(new Set(saved.filter((path) => typeof path === "string")));
    } catch { /* Storage may be unavailable in private browsing. */ }
    setFoldersReady(true);
  }, []);

  useEffect(() => {
    if (!foldersReady || !selectionInitialized) return;
    setExpanded((previous) => new Set([...previous, ...folderAncestors(selectedDocument?.folderPath)]));
  }, [foldersReady, selectionInitialized, selectedDocument?.id, selectedDocument?.folderPath]);

  useEffect(() => {
    if (!foldersReady) return;
    try { sessionStorage.setItem("forest_expanded_folders", JSON.stringify([...expanded])); } catch {}
  }, [expanded, foldersReady]);

  const revealFolder = (path: string) => {
    setExpanded((previous) => new Set([...previous, ...folderAncestors(path)]));
    if (window.matchMedia("(max-width: 760px)").matches) closeMobileDocument();
    requestAnimationFrame(() => {
      const item = folderItemRefs.current.get(path);
      item?.scrollIntoView({ block: "nearest" });
      item?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!router.isReady) return;
    const documentId = typeof router.query.document === "string" ? router.query.document : "";
    if (documentId && documents.some((document) => document.id === documentId)) {
      setSelectedId(documentId);
      if (typeof window !== "undefined") sessionStorage.setItem("forest_last_selected_id", documentId);
      setMobileDocumentOpen(true);
    } else {
      const savedId = typeof window !== "undefined" ? sessionStorage.getItem("forest_last_selected_id") : null;
      if (savedId && documents.some((doc) => doc.id === savedId)) {
        setSelectedId(savedId);
      }
      setMobileDocumentOpen(false);
    }
    setSelectionInitialized(true);
  }, [documents, router.isReady, router.query.document]);

  useEffect(() => {
    if (!selectedId && documents[0]?.id) {
      setSelectedId(documents[0].id);
      if (typeof window !== "undefined") sessionStorage.setItem("forest_last_selected_id", documents[0].id);
    }
  }, [documents, selectedId]);

  useClientLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const savedScroll = sessionStorage.getItem("forest_list_scroll_top");
    const parsedScroll = savedScroll === null ? listScrollTopRef.current : Number(savedScroll);
    const targetScroll = Number.isFinite(parsedScroll) ? parsedScroll : 0;
    listScrollTopRef.current = targetScroll;
    list.scrollTop = targetScroll;

    // Wait until the URL/session selection is known before deciding whether the
    // active item needs to be revealed. This keeps the saved position on hydration.
    if (!selectionInitialized) return;

    if (selectionScrollModeRef.current === "preserve") {
      // Selecting an item must not let routing, focus, or layout animation move the list.
      selectionScrollModeRef.current = "reveal";
      return;
    }

    const activeItem = documentItemRefs.current.get(selectedId);
    if (!activeItem) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    if (itemRect.top < listRect.top) {
      list.scrollTop -= listRect.top - itemRect.top;
    } else if (itemRect.bottom > listRect.bottom) {
      list.scrollTop += itemRect.bottom - listRect.bottom;
    }

    listScrollTopRef.current = list.scrollTop;
    sessionStorage.setItem("forest_list_scroll_top", String(list.scrollTop));
  }, [mobileDocumentOpen, selectedId, selectionInitialized, sortOption, visibleDocuments, expanded]);

  useEffect(() => {
    if (!selectedId) return;
    const cached = cacheRef.current.get(selectedId);
    if (cached) {
      setRecordMap(cached);
      setRecordMapDocumentId(selectedId);
      setError("");
      return;
    }

    const controller = new AbortController();
    setError("");

    fetch(`/api/forest/${selectedId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("문서를 불러오지 못했습니다.");
        return response.json();
      })
      .then((nextRecordMap) => {
        cacheRef.current.set(selectedId, nextRecordMap);
        setRecordMap(nextRecordMap);
        setRecordMapDocumentId(selectedId);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message || "문서를 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [selectedId]);

  useClientLayoutEffect(() => {
    if (recordMapDocumentId === selectedId && previewScrollRef.current) {
      previewScrollRef.current.scrollTop = 0;
    }
  }, [recordMapDocumentId, selectedId]);

  const selectDocument = (document: ForestDocument) => {
    if (listRef.current) {
      const currentScroll = listRef.current.scrollTop;
      listScrollTopRef.current = currentScroll;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("forest_list_scroll_top", String(currentScroll));
      }
    }
    selectionScrollModeRef.current = "preserve";
    setSelectedId(document.id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("forest_last_selected_id", document.id);
    }
    setMobileDocumentOpen(true);
    if (router.query.document !== document.id) {
      const destination = { pathname: "/forest", query: { document: document.id } };
      if (typeof router.query.document === "string") {
        router.replace(destination, undefined, { shallow: true, scroll: false });
      } else {
        router.push(destination, undefined, { shallow: true, scroll: false });
      }
    }
  };

  const closeMobileDocument = () => {
    selectionScrollModeRef.current = "preserve";
    setMobileDocumentOpen(false);
    router.replace("/forest", undefined, { shallow: true, scroll: false });

    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listScrollTopRef.current;
      documentItemRefs.current.get(selectedId)?.focus({ preventScroll: true });
    });
  };

  return (
    <main className={`forest-explorer container ${mobileDocumentOpen ? "is-mobile-document" : ""}`}>
      <aside className="forest-sidebar" aria-label="문서 목록">
        <button type="button" className="forest-search" onClick={() => openSearch({ scope: "document" })}>
          <IonIcon name="search-outline" />
          <span>문서 검색</span><kbd>/</kbd>
        </button>

        <div className="forest-folder-label">
          <IonIcon name="folder-open-outline" />
          <span>모든 문서</span>
          <span>{visibleDocuments.length}</span>
        </div>

        <label className="forest-sort">
          <span><IonIcon name="swap-vertical-outline" /> 정렬</span>
          <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
            <option value="edited-desc">최근 수정순</option>
            <option value="edited-asc">오래된 수정순</option>
            <option value="created-desc">최근 생성순</option>
            <option value="title-asc">이름순</option>
          </select>
        </label>

        <nav
          className="forest-document-list"
          ref={listRef}
          onScroll={(e) => {
            const scrollTop = e.currentTarget.scrollTop;
            listScrollTopRef.current = scrollTop;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("forest_list_scroll_top", String(scrollTop));
            }
          }}
        >
          <ForestTree documents={visibleDocuments} expanded={expanded} selectedId={selectedDocument?.id}
            onToggle={(path) => { selectionScrollModeRef.current = "preserve"; setExpanded((previous) => {
              const next = new Set(previous);
              if (next.has(path)) next.delete(path); else next.add(path);
              return next;
            }); }} onSelect={selectDocument} itemRefs={documentItemRefs} folderRefs={folderItemRefs} />
          {!visibleDocuments.length && <p className="forest-empty-list">등록된 문서가 없습니다.</p>}
        </nav>
      </aside>

      <section className="forest-preview" aria-live="polite">
        {renderedDocument ? (
          <>
            <div className="forest-preview-toolbar">
              <button
                type="button"
                className="forest-document-back"
                onClick={closeMobileDocument}
                aria-label="문서 목록으로 돌아가기"
              >
                <IonIcon name="arrow-back-outline" />
              </button>
            </div>
            <div className="forest-preview-scroll" ref={previewScrollRef}>
              <div className="forest-document-heading">
                <div>
                  {!!renderedDocument.folderPath && <nav className="forest-breadcrumb" aria-label="문서 폴더">
                    {folderAncestors(renderedDocument.folderPath).map((path, index) => <span key={path}>
                      {index > 0 && <span aria-hidden="true"> / </span>}
                      <button type="button" onClick={() => revealFolder(path)}>{path.split("/").pop()}</button>
                    </span>)}
                  </nav>}
                  <h2>{renderedDocument.title}</h2>
                  <div className="forest-document-dates">
                    <p><IonIcon name="add-circle-outline" /> {formatEditedTime(renderedDocument.createdTime)} 생성</p>
                    <p><IonIcon name="time-outline" /> {formatEditedTime(renderedDocument.lastEditedTime)} 수정</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="forest-document-error">
                  <IonIcon name="cloud-offline-outline" />
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const retryId = selectedId;
                      setSelectedId("");
                      setTimeout(() => setSelectedId(retryId), 0);
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {!error && recordMapDocumentId !== selectedId && <p className="forest-empty-list" role="status">선택한 문서를 불러오는 중입니다…</p>}
              {recordMap && (
                <article
                  key={recordMapDocumentId}
                  className="forest-notion-document"
                >
                  <NotionRenderer
                    recordMap={recordMap}
                    components={rendererComponents}
                    fullPage={false}
                    darkMode={darkMode}
                    showTableOfContents={false}
                    previewImages={!!recordMap.preview_images}
                  />
                  <Backlinks key={recordMapDocumentId} currentId={recordMapDocumentId} currentTitle={renderedDocument.title} />
                  <Comments pageId={recordMapDocumentId} />
                </article>
              )}
            </div>
          </>
        ) : (
          <div className="forest-no-document">
            <IonIcon name="documents-outline" />
            <h2>표시할 문서가 없습니다</h2>
            <p>Notion의 문서 카테고리에 게시물을 추가하면 여기에 표시됩니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
