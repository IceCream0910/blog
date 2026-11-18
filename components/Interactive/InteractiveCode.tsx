import React from "react";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { useNotionContext } from "../../packages/notionx/context";
import { Code as StandardCode } from "../../utils/notion-components";
import { getInteractiveSource, parseInteractiveBlock } from "./parser";
import { Frame } from "./sdk";

const Loading = () => <p className="viz-status" role="status">시각화를 불러오는 중이에요.</p>;
const ChartView = dynamic(() => import("./ChartView"), { ssr: false, loading: Loading });
const Structures = dynamic(() => import("./Structures"), { loading: Loading });
const Registered = dynamic(() => import("./registry"), { loading: Loading });
const Sandbox = dynamic(() => import("./sandbox/Sandbox"), { ssr: false, loading: Loading });

function ErrorMessage() {
  return <Frame><p className="viz-status" role="status">인터랙티브 콘텐츠를 표시할 수 없어요.</p></Frame>;
}

class BlockBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ErrorMessage /> : this.props.children; }
}

export function InteractiveCode({ block }: ComponentProps<typeof StandardCode>) {
  const { darkMode } = useNotionContext();
  const spec = parseInteractiveBlock(block);
  if (!spec) return <StandardCode block={block} />;
  let content: React.ReactNode;
  switch (spec.kind) {
    case "invalid": content = <ErrorMessage />; break;
    case "react": content = <Sandbox source={spec.source} darkMode={darkMode} />; break;
    case "chart": {
      const chart = <ChartView spec={spec.spec} darkMode={darkMode} />;
      content = spec.title || !spec.spec.card ? <Frame title={spec.title}>{chart}</Frame> : chart;
      break;
    }
    case "component": content = <Registered name={spec.name} title={spec.title} />; break;
    default: content = <Structures spec={spec} />;
  }
  return <div className="blog-viz" data-viz-kind={spec.kind}>
    <BlockBoundary key={getInteractiveSource(block).source}>{content}</BlockBoundary>
  </div>;
}
