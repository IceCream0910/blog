import React, { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

export function Frame({ title, children }: { title?: string; children: ReactNode }) {
  const id = useId();
  return <section className="viz-frame" aria-labelledby={title ? id : undefined}>
    {title && <h3 id={id} className="viz-title">{title}</h3>}
    {children}
  </section>;
}

export function Panel({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={`viz-panel ${className}`} />;
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="viz-controls">{children}</div>;
}

export function Button({ className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  return <button type="button" {...props} className={`viz-button ${className}`} />;
}

export function Slider({ label = "값", onChange, ...props }: Omit<ComponentPropsWithoutRef<"input">, "onChange" | "type"> & {
  label?: string;
  onChange: (value: number) => void;
}) {
  return <label className="viz-field">{label}
    <input {...props} type="range" onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
  </label>;
}

export function Select({ label, children, ...props }: ComponentPropsWithoutRef<"select"> & { label: string }) {
  return <label className="viz-field">{label}<select {...props}>{children}</select></label>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="viz-badge">{children}</span>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="viz-code">{children}</code>;
}

export function Binary({ value, bits = 8 }: { value: number; bits?: number }) {
  const width = Math.max(1, Math.min(32, Math.trunc(bits) || 1));
  const binary = (value >>> 0).toString(2).padStart(width, "0").slice(-width);
  return <output className="viz-bits" aria-label={`이진수 ${binary}`}>
    {[...binary].map((bit, index) => <span key={index} aria-hidden="true" data-active={bit === "1"}>{bit}</span>)}
  </output>;
}

export function Node({ children }: { children: ReactNode }) {
  return <span className="viz-node">{children}</span>;
}


export function Tabs({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return <div className="viz-controls" role="group" aria-label={label}>
    {options.map((option) => <Button key={option.value} aria-pressed={value === option.value}
      onClick={() => onChange(option.value)}>{option.label}</Button>)}
  </div>;
}

export function Stack({ children }: ComponentPropsWithoutRef<"ol">) {
  return <ol className="viz-items" data-stack="true">{children}</ol>;
}

export function Edge(props: ComponentPropsWithoutRef<"line">) {
  return <line stroke="var(--viz-accent)" {...props} />;
}

export function Tree({ items, activeIndex = -1 }: { items: (string | number)[]; activeIndex?: number }) {
  const levels = Math.max(1, Math.ceil(Math.log2(items.length + 1)));
  const width = Math.max(420, 76 * 2 ** (levels - 1));
  const positions = items.map((item, index) => {
    const level = Math.floor(Math.log2(index + 1));
    return { item, x: width * (index + 1.5 - 2 ** level) / 2 ** level, y: 22 + 52 * level };
  });
  return <div className="viz-tree-scroll">
    <svg className="viz-tree" style={{ minWidth: width }} viewBox={`0 0 ${width} ${52 * levels}`}
      role="img" aria-label={`이진 트리, 너비 우선 순서 ${items.join(", ")}`}>
      {positions.slice(1).map(({ x, y }, index) => {
        const parent = positions[Math.floor(index / 2)];
        return <Edge key={index} x1={parent.x} y1={parent.y} x2={x} y2={y} />;
      })}
      {positions.map(({ item, x, y }, index) => <g key={index}>
        <rect x={x - 32} y={y - 14} width="64" height="28" rx="8"
          style={activeIndex === index ? { stroke: "var(--viz-accent)", fill: "var(--viz-tint)" } : undefined} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central">{String(item).length > 8 ? `${String(item).slice(0, 7)}…` : item}</text>
      </g>)}
    </svg>
  </div>;
}
