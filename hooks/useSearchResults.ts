import { useEffect, useState } from "react";
import { SearchResultCache, searchKey, type SearchSnapshot } from "../utils/search/result-cache";
import type { SearchScope } from "../utils/search/types";

const EMPTY: SearchSnapshot = { results: [], partial: false };

export function useSearchResults(query: string, scope: SearchScope, folder: string) {
  const [cache] = useState(() => new SearchResultCache());
  const [response, setResponse] = useState<{ key: string; snapshot: SearchSnapshot } | null>(null);
  const [status, setStatus] = useState({ key: "", loading: false, error: "" });
  const trimmed = query.trim();
  const key = searchKey(trimmed, scope, folder);
  const snapshot = !trimmed ? EMPTY : response?.key === key ? response.snapshot : cache.get(trimmed, scope, folder) || EMPTY;

  useEffect(() => {
    const controller = new AbortController();
    setResponse(trimmed ? { key, snapshot: cache.get(trimmed, scope, folder) || EMPTY } : null);
    setStatus({ key, loading: !!trimmed, error: "" });
    if (!trimmed) return () => controller.abort();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, type: scope, folder });
        const result = await fetch(`/api/search?${params}`, { signal: controller.signal });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error || "검색에 실패했습니다.");
        if (controller.signal.aborted) return;
        const next: SearchSnapshot = { results: data.results, partial: !!data.partial };
        cache.set(trimmed, scope, folder, next);
        setResponse({ key, snapshot: next });
        setStatus({ key, loading: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setStatus({ key, loading: false, error: error.message || "검색에 실패했습니다." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [trimmed, scope, folder, key, cache]);

  return {
    ...snapshot,
    loading: !!trimmed && (status.key !== key || status.loading),
    error: status.key === key ? status.error : "",
  };
}
