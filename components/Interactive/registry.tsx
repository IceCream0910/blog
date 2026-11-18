import { useState, type ComponentType } from "react";
import { Badge, Binary, Button, Controls, Frame, Panel } from "./sdk";

function Register({ title }: { title?: string }) {
  const [value, setValue] = useState(0);
  return <Frame title={title ?? "8비트 레지스터"}>
    <Panel><Badge>R0 = {value}</Badge><Binary value={value} /></Panel>
    <Controls>
      {Array.from({ length: 8 }, (_, index) => 7 - index).map((bit) =>
        <Button key={bit} aria-pressed={Boolean(value & (1 << bit))}
          onClick={() => setValue((current) => current ^ (1 << bit))}>비트 {bit}</Button>)}
      <Button onClick={() => setValue(0)}>초기화</Button>
    </Controls>
  </Frame>;
}

const registry = new Map<string, ComponentType<{ title?: string }>>([["cpu-8bit", Register]]);


export default function Registered({ name, title }: { name: string; title?: string }) {
  const Component = registry.get(name);
  if (!Component) throw new Error("Unregistered interactive component");
  return <Component title={title} />;
}
