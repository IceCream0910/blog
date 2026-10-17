import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useSearchResults } from "../hooks/useSearchResults";
import { SEARCH_SCOPES, scopeLabels, type SearchOptions, type SearchResult, type SearchScope } from "../utils/search/types";

const MotionLink = motion.create(Link);
const resultKey = (query: string, id: string) => `${query.trim()}:${id}`;

const SearchResultItem = React.forwardRef<HTMLAnchorElement, {
  result: SearchResult; active: boolean; reducedMotion: boolean; onClose: () => void; onFocus: () => void;
}>(function SearchResultItem({ result, active, reducedMotion, onClose, onFocus }, ref) {
  const isPresent = useIsPresent();
  return <MotionLink ref={ref} href={result.href} className={`global-search-result ${active ? "is-selected" : ""}`}
    aria-hidden={!isPresent || undefined} tabIndex={isPresent ? 0 : -1} style={{ pointerEvents: isPresent ? "auto" : "none" }}
    layout={reducedMotion ? false : "position"}
    initial={{ opacity: 0, y: reducedMotion ? 0 : 6, filter: reducedMotion ? "blur(0px)" : "blur(4px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: reducedMotion ? 0 : -4, filter: reducedMotion ? "blur(0px)" : "blur(4px)" }}
    transition={{ duration: reducedMotion ? 0 : .18, ease: [.22, 1, .36, 1] }}
    onFocus={onFocus} onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) onClose(); }}>
    <motion.div key={`${result.title}:${result.excerpt || ""}`}
      initial={{ opacity: reducedMotion ? 1 : .45 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .18 }}>
      <strong>{result.title}</strong>
      <small>{scopeLabels[result.type]}{result.folderPath && ` · ${result.folderPath.replaceAll("/", " / ")}`}</small>
      {result.excerpt && <p>{result.excerpt}</p>}
    </motion.div>
  </MotionLink>;
});

export function Search({ onClose, initialOptions = {} }: { onClose: () => void; initialOptions?: SearchOptions }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>(initialOptions.scope || "all");
  const [folder, setFolder] = useState(initialOptions.folder || "");
  const { results, loading, error, partial } = useSearchResults(query, scope, folder);
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const [selected, setSelected] = useState(0);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const linksRef = useRef(new Map<string, HTMLAnchorElement>());
  const agentRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.({ preventScroll: true }); agentRef.current?.abort(); };
  }, []);

  useEffect(() => {
    agentRef.current?.abort();
    setAnswer(""); setSources([]); setAgentError(""); setAgentLoading(false);
    setSelected(0);
  }, [query, scope, folder]);

  useEffect(() => { if (!isPresent) agentRef.current?.abort(); }, [isPresent]);
  useEffect(() => { setSelected((previous) => Math.min(previous, Math.max(0, results.length - 1))); }, [results.length]);

  const selectedResultId = results[selected]?.id;
  useEffect(() => {
    if (selectedResultId) linksRef.current.get(resultKey(query, selectedResultId))?.scrollIntoView({ block: "nearest" });
  }, [selectedResultId, query]);

  const askAgent = async () => {
    if (!query.trim() || agentLoading) return;
    agentRef.current?.abort();
    const controller = new AbortController();
    agentRef.current = controller;
    setAgentLoading(true); setAgentError(""); setAnswer(""); setSources([]);
    try {
      const response = await fetch("/api/agent/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query.trim(), scope, folder }), signal: controller.signal,
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "AI 답변을 불러오지 못했습니다."); }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneEvent = false;
      const consume = (line: string) => {
        if (!line.trim() || controller.signal.aborted) return;
        const event = JSON.parse(line);
        if (event.type === "delta") setAnswer((previous) => previous + event.text);
        if (event.type === "sources") setSources(event.sources);
        if (event.type === "error") throw new Error(event.error);
        if (event.type === "done") doneEvent = true;
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        lines.forEach(consume);
        if (done) { consume(buffer); break; }
      }
      if (!doneEvent) throw new Error("답변 연결이 끊겼습니다. 다시 시도해 주세요.");
    } catch (error) {
      if (!controller.signal.aborted) { setAgentError(error.message); setAnswer(""); setSources([]); }
    } finally { if (!controller.signal.aborted) setAgentLoading(false); }
  };

  return <motion.div className="global-search-backdrop" aria-hidden={!isPresent || undefined}
    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
    animate={{ opacity: 1, backdropFilter: reducedMotion ? "blur(0px)" : "blur(8px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
    transition={{ duration: reducedMotion ? 0 : .24, ease: [.22, 1, .36, 1] }}
    style={{ pointerEvents: isPresent ? "auto" : "none" }}
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="블로그 검색" className="global-search"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : .975, filter: reducedMotion ? "blur(0px)" : "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : .985, filter: reducedMotion ? "blur(0px)" : "blur(8px)" }}
      transition={{ duration: reducedMotion ? 0 : .22, ease: [.22, 1, .36, 1] }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
        if (event.key === "Tab") {
          const elements = Array.from(dialogRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]:not([tabindex="-1"]), input'));
          const first = elements[0]; const last = elements[elements.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="global-search-input">
        <input ref={inputRef} value={query} maxLength={300} aria-label="블로그 검색어" placeholder="검색하거나 질문하세요"
          onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void askAgent(); }
            else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
              event.preventDefault(); setSelected((previous) => (previous + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
            } else if (event.key === "Enter" && results[selected]) {
              event.preventDefault();
              void router.push(results[selected].href);
              onClose();
            }
          }} />
        {query && <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>지우기</button>}
        <button type="button" aria-label="검색 닫기" onClick={onClose}>닫기</button>
      </div>
      <div className="global-search-scopes" role="group" aria-label="검색 범위">
        {SEARCH_SCOPES.map((value) => <button key={value} type="button" aria-pressed={scope === value}
          onClick={() => { setScope(value); setFolder(""); }}>{scopeLabels[value]}</button>)}
      </div>
      {folder && <button className="global-search-folder" type="button" onClick={() => setFolder("")}>{folder.replaceAll("/", " / ")} · 폴더 제한 해제</button>}
      <motion.div className="global-search-body" layoutScroll>
        <div role="status" className="global-search-status">
          {!query.trim() ? "제목과 본문을 검색합니다. AI 답변은 질문하기를 눌렀을 때만 생성합니다." : error ? `${results.length ? `검색 결과 ${results.length}개 · ` : ""}${error}` : loading ? results.length ? `검색 결과 ${results.length}개 · 갱신 중…` : "검색 중입니다…" : `검색 결과 ${results.length}개`}
          {partial && <p>본문 검색에 연결하지 못해 제목 검색 결과만 표시합니다.</p>}
        </div>
        {query.trim() && !loading && !error && !results.length && <p className="global-search-status">일치하는 글이 없습니다. 검색어 또는 범위를 바꿔 보세요.</p>}
        <motion.div className="global-search-results" aria-label="검색 결과" aria-busy={loading}>
          <AnimatePresence initial={false} mode="popLayout">
          {results.map((result, index) => <SearchResultItem key={resultKey(query, result.id)} result={result}
            active={selected === index} reducedMotion={!!reducedMotion} onClose={onClose} onFocus={() => setSelected(index)}
            ref={(element) => {
              const key = resultKey(query, result.id);
              if (element) linksRef.current.set(key, element); else linksRef.current.delete(key);
            }} />)}
          </AnimatePresence>
        </motion.div>
        {(agentLoading || answer || agentError) && <section className="global-search-answer" aria-label="AI 답변" aria-busy={agentLoading}>
          <h3>AI 답변</h3>
          {agentLoading && <p role="status">블로그에서 근거를 확인하고 있습니다…</p>}
          {agentError && <p role="alert">{agentError}</p>}
          {answer && <p className="global-search-answer-text">{answer}</p>}
          {!!sources.length && <div aria-label="참고한 문서">{sources.map((source, index) => <Link key={source.id} href={source.href}
            onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey) onClose(); }}>[{index + 1}] {source.title}</Link>)}</div>}
        </section>}
      </motion.div>
      <div className="global-search-footer">
        <button type="button" disabled={!query.trim() || agentLoading} onClick={() => void askAgent()}>AI에게 질문하기 <kbd>⌘/Ctrl ↵</kbd></button>
        {agentLoading && <button type="button" onClick={() => { agentRef.current?.abort(); setAgentLoading(false); setAnswer(""); setSources([]); }}>중지</button>}
      </div>
    </motion.div>
  </motion.div>;
}
