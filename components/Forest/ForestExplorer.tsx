import IonIcon from "@reacticons/ionicons";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { NotionRenderer } from "../../packages/notionx";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Code, Collection, Equation, Modal } from "../../utils/notion-components";

type ForestDocument = {
  id: string;
  title: string;
  lastEditedTime: string;
  createdTime: string;
};

type ForestExplorerProps = {
  documents: ForestDocument[];
};

type SortOption = "edited-desc" | "edited-asc" | "created-desc" | "title-asc";

const rendererComponents = { Code, Collection, Equation, Modal };

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
  const [query, setQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("edited-desc");
  const [recordMap, setRecordMap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileDocumentOpen, setMobileDocumentOpen] = useState(false);
  const cacheRef = useRef(new Map<string, any>());
  const documentItemRefs = useRef(new Map<string, HTMLButtonElement>());

  const selectedDocument = documents.find((document) => document.id === selectedId) || documents[0];
  const visibleDocuments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    const filtered = normalized
      ? documents.filter((document) => document.title.toLocaleLowerCase("ko-KR").includes(normalized))
      : documents;

    return [...filtered].sort((a, b) => {
      if (sortOption === "title-asc") return a.title.localeCompare(b.title, "ko-KR");
      if (sortOption === "created-desc") return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      if (sortOption === "edited-asc") return new Date(a.lastEditedTime).getTime() - new Date(b.lastEditedTime).getTime();
      return new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime();
    });
  }, [documents, query, sortOption]);

  useEffect(() => {
    if (!router.isReady) return;
    const documentId = typeof router.query.document === "string" ? router.query.document : "";
    if (documentId && documents.some((document) => document.id === documentId)) {
      setSelectedId(documentId);
      setMobileDocumentOpen(true);
    } else {
      setMobileDocumentOpen(false);
    }
  }, [documents, router.isReady, router.query.document]);

  useEffect(() => {
    if (!selectedId && documents[0]?.id) setSelectedId(documents[0].id);
  }, [documents, selectedId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      documentItemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [mobileDocumentOpen, selectedId, sortOption, visibleDocuments]);

  useEffect(() => {
    if (!selectedId) return;
    const cached = cacheRef.current.get(selectedId);
    if (cached) {
      setRecordMap(cached);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRecordMap(null);

    fetch(`/api/forest/${selectedId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("문서를 불러오지 못했습니다.");
        return response.json();
      })
      .then((nextRecordMap) => {
        cacheRef.current.set(selectedId, nextRecordMap);
        setRecordMap(nextRecordMap);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message || "문서를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedId]);

  const selectDocument = (document: ForestDocument) => {
    setSelectedId(document.id);
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
    setMobileDocumentOpen(false);
    router.replace("/forest", undefined, { shallow: true, scroll: false });
  };

  return (
    <main className={`forest-explorer container ${mobileDocumentOpen ? "is-mobile-document" : ""}`}>
      <aside className="forest-sidebar" aria-label="문서 목록">
        <label className="forest-search">
          <IonIcon name="search-outline" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="문서 검색"
            aria-label="문서 검색"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">
              <IonIcon name="close-circle" />
            </button>
          )}
        </label>

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

        <nav className="forest-document-list">
          <AnimatePresence initial={false}>
            {visibleDocuments.map((document) => {
              const active = document.id === selectedDocument?.id;
              return (
                <motion.button
                  layout
                  key={document.id}
                  type="button"
                  className={`forest-document-item ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => selectDocument(document)}
                  ref={(element) => {
                    if (element) documentItemRefs.current.set(document.id, element);
                    else documentItemRefs.current.delete(document.id);
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="forest-file-icon"><IonIcon name="document-text-outline" /></span>
                  <span className="forest-file-copy">
                    <strong>{document.title}</strong>
                    <small>
                      <span>{formatEditedTime(document.createdTime)} 생성</span>
                      <span>{formatEditedTime(document.lastEditedTime)} 수정</span>
                    </small>
                  </span>
                  <IonIcon className="forest-file-chevron" name="chevron-forward-outline" />
                </motion.button>
              );
            })}
          </AnimatePresence>
          {!visibleDocuments.length && <p className="forest-empty-list">일치하는 문서가 없습니다.</p>}
        </nav>
      </aside>

      <section className="forest-preview" aria-live="polite">
        {selectedDocument ? (
          <>
            <div className="forest-preview-toolbar">
              <button type="button" className="forest-document-back" onClick={closeMobileDocument} aria-label="문서 목록으로 돌아가기">
                <IonIcon name="chevron-back-outline" />
              </button>
              <div className="forest-breadcrumb">
                <span><IonIcon name="folder-outline" /> 문서</span>
                <IonIcon name="chevron-forward-outline" />
                <strong>{selectedDocument.title}</strong>
              </div>
              <a href={`/${selectedDocument.id}`} className="forest-open-document" aria-label="문서 전체 페이지로 열기">
                <IonIcon name="open-outline" />
              </a>
            </div>

            <div className="forest-preview-scroll">
              <div className="forest-document-heading">
                <span className="forest-document-symbol"><IonIcon name="document-text-outline" /></span>
                <div>
                  <h2>{selectedDocument.title}</h2>
                  <div className="forest-document-dates">
                    <p><IonIcon name="add-circle-outline" /> {formatEditedTime(selectedDocument.createdTime)} 생성</p>
                    <p><IonIcon name="time-outline" /> {formatEditedTime(selectedDocument.lastEditedTime)} 수정</p>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="forest-document-loading" aria-label="문서 불러오는 중">
                  <span /><span /><span />
                </div>
              )}
              {error && (
                <div className="forest-document-error">
                  <IonIcon name="cloud-offline-outline" />
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId("");
                      setTimeout(() => setSelectedId(selectedDocument.id), 0);
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {recordMap && (
                <motion.article
                  key={selectedDocument.id}
                  className="forest-notion-document"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <NotionRenderer
                    recordMap={recordMap}
                    components={rendererComponents}
                    fullPage={false}
                    darkMode={darkMode}
                    showTableOfContents={false}
                    previewImages={!!recordMap.preview_images}
                  />
                </motion.article>
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
