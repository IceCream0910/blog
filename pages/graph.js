"use client";
import { useEffect, useState } from "react";
import Graph from "../components/Graph";

const removeNodeAndLinks = (data, nodeIds) => {
  const idsToRemove = new Set(nodeIds);
  return {
    nodes: data.nodes.filter(node => !idsToRemove.has(node.id)),
    links: data.links.filter(link =>
      !idsToRemove.has(link.source) && !idsToRemove.has(link.target)
    )
  };
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    // 데이터 로드 시 메모리 효율을 위해 필요한 속성만 추출
    const data = require('../public/graph-test.json');
    const processedData = {
      nodes: data.nodes.map(({ id, title, type }) => ({ id, title, type })),
      links: data.links.map(({ source, target }) => ({ source, target }))
    };

    // 특정 노드 삭제
    const filteredData = removeNodeAndLinks(
      processedData,
      ['515f927b-635b-4ef1-8d79-88609314de2a', '1a346171-ed57-4b0a-9c1c-3f5a29b39919', 'a8174e3c-ad3a-430e-a7c9-1fe8ae303bbb']
    );

    setGraphData(filteredData);
  }, []);

  if (!graphData) return <div>Loading...</div>;

  return (
    <div className="pt-16">
      <Graph data={graphData} />
    </div>
  );
}
