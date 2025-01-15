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

const renameNode = (data, id, title) => {
  const node = data.nodes.find(node => node.id === id);
  if (node) {
    node.title = title;
  }
  return data;
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!process.env.NEXT_PUBLIC_NOTION_GRAPH_URL) return;
      const response = await fetch(process.env.NEXT_PUBLIC_NOTION_GRAPH_URL);
      const data = await response.json();

      const processedData = {
        nodes: data.nodes.map(({ id, title, type }) => ({ id, title, type })),
        links: data.links.map(({ source, target }) => ({ source, target }))
      };

      // 특정 노드 삭제
      const filteredData = removeNodeAndLinks(
        processedData,
        ['a8174e3c-ad3a-430e-a7c9-1fe8ae303bbb', 'e5f8cfa7-6c5c-48e0-b060-734faa8cb4bb', '515f927b-635b-4ef1-8d79-88609314de2a']
      );

      // 특정 노드 이름 변경
      const renamedData = renameNode(
        filteredData,
        'ff85c8c8-bc33-45ba-bf2f-7970d86506d4',
        'Forest'
      );

      setGraphData(renamedData);
    };

    fetchData();
  }, []);

  if (!graphData) return <div>Loading...</div>;

  return (
    <div className="pt-16">
      <Graph data={graphData} />
    </div>
  );
}
