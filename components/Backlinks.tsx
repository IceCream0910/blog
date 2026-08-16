import * as React from "react";
import Link from "next/link";
import IonIcon from "@reacticons/ionicons";
import { KnowledgeGraph, type GraphData } from "./Graph/KnowledgeGraph";
import { compactNotionId, resolveBacklinkSources } from "../utils/backlink-graph";
import { motion } from "framer-motion";

interface BacklinksProps {
  currentId: string;
  currentTitle?: string;
}

export const Backlinks: React.FC<BacklinksProps> = ({ currentId, currentTitle = "현재 문서" }) => {
  const [sources, setSources] = React.useState<ReturnType<typeof resolveBacklinkSources>>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    setSources([]);
    fetch("/api/backlink", {
      method: "POST",
      body: JSON.stringify({ currentId }),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("backlink request failed")))
      .then((payload) => setSources(resolveBacklinkSources(payload).filter(
        (source) => compactNotionId(source.id) !== compactNotionId(currentId),
      )))
      .catch((error) => {
        if (error.name !== "AbortError") setSources([]);
      });
    return () => controller.abort();
  }, [currentId]);

  const graph = React.useMemo<GraphData>(() => ({
    nodes: [
      { id: currentId, title: currentTitle, href: `/${currentId}`, kind: "current" },
      ...sources.map((source) => ({ ...source, kind: "reference" as const })),
    ],
    links: sources.map((source) => ({ source: source.id, target: currentId })),
  }), [currentId, currentTitle, sources]);

  return (
    <section className="backlink-graph" aria-labelledby={`backlink-title-${compactNotionId(currentId)}`}>
      <div className="backlink-graph-heading">
        <div>
          <b id={`backlink-title-${compactNotionId(currentId)}`}>이 문서를 가리키는 연결</b>
          <small>{sources.length ? `${sources.length}개의 문서가 연결되어 있습니다.` : "아직 연결된 문서가 없습니다."}</small>
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
      <KnowledgeGraph data={graph} activeId={currentId} variant="compact" />
    </section>
  );
};
