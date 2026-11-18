import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { StructureSpec } from "./parser";
import { Button, Controls, Frame, Node, Panel, Select, Stack, Tree } from "./sdk";

const names = { stack: "스택", queue: "큐", list: "리스트", tree: "이진 트리" };

function StepPlayer({ steps, render }: { steps: string[]; render: (index: number) => React.ReactNode }) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(650);
  useEffect(() => {
    if (!playing || index >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setIndex(index + 1);
      if (index + 1 === steps.length - 1) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [delay, index, playing, steps.length]);

  return <>
    {render(index)}
    <Controls>
      <Button disabled={!steps.length} onClick={() => {
        if (!playing && index === steps.length - 1) setIndex(-1);
        setPlaying(!playing);
      }}>{playing ? "일시정지" : "재생"}</Button>
      <Button disabled={index < 0} onClick={() => { setPlaying(false); setIndex(index - 1); }}>이전</Button>
      <Button disabled={index >= steps.length - 1} onClick={() => { setPlaying(false); setIndex(index + 1); }}>다음</Button>
      <Button onClick={() => { setPlaying(false); setIndex(-1); }}>초기화</Button>
      <Select label="속도" value={delay} onChange={(event) => setDelay(Number(event.target.value))}>
        <option value={1000}>느리게</option><option value={650}>보통</option><option value={300}>빠르게</option>
      </Select>
    </Controls>
    <p className="viz-status" role="status">{index < 0 ? "탐색 대기 중" : steps[index]}</p>
  </>;
}

export default function Structures({ spec }: { spec: StructureSpec }) {
  const [items, setItems] = useState(() => spec.initial.map((value, id) => ({ value, id })));
  const [nextId, setNextId] = useState(spec.initial.length);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const reducedMotion = useReducedMotion();
  const animate = spec.animated && !reducedMotion;
  const Items = spec.kind === "stack" ? Stack : "ol";
  const title = spec.title ?? names[spec.kind];

  if (spec.kind === "tree") return <Frame title={title}>
    <StepPlayer steps={spec.initial.map((item) => `${item} 방문`)} render={(index) =>
      <Panel><Tree items={spec.initial} activeIndex={index} /></Panel>} />
  </Frame>;

  function insert() {
    const value = input.trim();
    if (!value || items.length >= spec.capacity) return;
    setItems([...items, { value, id: nextId }]);
    setNextId(nextId + 1);
    setInput("");
    setStatus(`${value} 추가`);
  }

  function remove() {
    const index = spec.kind === "queue" ? 0 : items.length - 1;
    const item = items[index];
    if (!item) return;
    setItems(items.filter(({ id }) => id !== item.id));
    setStatus(`${item.value} 제거`);
  }

  return <Frame title={title}>
    <Panel>{items.length === 0 && <span>비어 있어요.</span>}
      <Items className="viz-items">
        <AnimatePresence initial={false}>
          {items.map(({ id, value }) => <motion.li key={id} layout={animate}
            initial={animate ? { opacity: 0, y: -5 } : false}
            animate={{ opacity: 1, y: 0 }} exit={animate ? { opacity: 0, y: -5 } : undefined}>
            <Node>{value}</Node>
          </motion.li>)}
        </AnimatePresence>
      </Items>
    </Panel>
    <Controls>
      {spec.allowPush && <>
        <label className="viz-field">추가할 값
          <input value={input} maxLength={24} onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") insert(); }} />
        </label>
        <Button onClick={insert} disabled={!input.trim() || items.length >= spec.capacity}>추가</Button>
      </>}
      {spec.allowPop && <Button onClick={remove} disabled={!items.length}>꺼내기</Button>}
      <Button onClick={() => {
        setItems(spec.initial.map((value, id) => ({ value, id: nextId + id })));
        setNextId(nextId + spec.initial.length);
        setInput("");
        setStatus("초기화했어요.");
      }}>초기화</Button>
    </Controls>
    <p className="viz-status" role="status">{status ? `${status} · ` : ""}{items.length}/{spec.capacity}</p>
  </Frame>;
}
