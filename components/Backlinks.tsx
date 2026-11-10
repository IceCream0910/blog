import * as React from "react";
import type { ExtendedRecordMap } from "notion-types";
import Link from "next/link";
import IonIcon from "@reacticons/ionicons";
import { KnowledgeGraph } from "./Graph/KnowledgeGraph";
import { buildLocalGraph, compactNotionId, resolveBacklinkSources, resolveOutgoingSources, type BacklinkSource } from "../utils/backlink-graph";
import { motion } from "framer-motion";

interface BacklinksProps {
  currentId: string;
  currentTitle?: string;
  recordMap: ExtendedRecordMap;
  onNavigate?: (href: string, title?: string) => boolean;
}

export const Backlinks: React.FC<BacklinksProps> = ({ currentId, currentTitle = "현재 문서", recordMap, onNavigate }) => {
  const [incoming, setIncoming] = React.useState<{ id: string; sources: BacklinkSource[] }>();
  const outgoing = React.useMemo(() => resolveOutgoingSources(recordMap, currentId), [recordMap, currentId]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/backlink", {
      method: "POST",
      body: JSON.stringify({ currentId }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("backlink request failed")))
      .then((payload) => {
        if (!controller.signal.aborted) setIncoming({ id: currentId, sources: resolveBacklinkSources(payload) });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentId]);

  const graph = React.useMemo(() => buildLocalGraph(
    currentId, currentTitle, incoming?.id === currentId ? incoming.sources : [], outgoing,
  ), [currentId, currentTitle, incoming, outgoing]);
  const count = graph.nodes.length - 1;

  return (
    <section className="backlink-graph" aria-labelledby={`backlink-title-${compactNotionId(currentId)}`}>
      <div className="backlink-graph-heading">
        <div>
          <b id={`backlink-title-${compactNotionId(currentId)}`}>이 문서와 연결된 문서</b>
          <small>{count ? `${count}개의 문서가 연결되어 있습니다.` : "아직 연결된 문서가 없습니다."}</small>
        </div>
        <Link href={`/graph?focus=${encodeURIComponent(currentId)}`} className="no-underline">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 text-xs rounded-xl hover:bg-blue-600 transition-colors float-right"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
            type="submit"
          >
            전체 그래프
            <IonIcon name="arrow-forward-outline" style={{ position: 'relative', top: '2px' }} />
          </motion.button>

        </Link>
      </div>
      {count > 0 && <KnowledgeGraph data={graph} activeId={currentId} variant="compact" onNavigate={onNavigate} />}
    </section>
  );
};
