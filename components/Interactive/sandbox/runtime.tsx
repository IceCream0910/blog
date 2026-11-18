import React, { useEffect, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { transform } from "@babel/standalone";
import * as Viz from "../sdk";
import { CHANNEL, THEME_KEYS } from "./protocol";

const host = document.getElementById("root")!;
const sendToParent = window.parent.postMessage.bind(window.parent);
let session = "";

function send(type: string, details: Record<string, unknown> = {}) {
  sendToParent({ channel: CHANNEL, session, type, ...details }, "*");
}

function applyTheme(theme: { darkMode?: boolean; tokens?: string[]; font?: string }) {
  const root = document.documentElement;
  root.style.colorScheme = theme.darkMode ? "dark" : "light";
  if (typeof theme.font === "string") root.style.fontFamily = theme.font;
  THEME_KEYS.forEach((key, index) => {
    const value = theme.tokens?.[index];
    if (typeof value === "string" && CSS.supports("color", value)) root.style.setProperty(key, value);
  });
}

function compile(source: string): ComponentType {
  if (source.length > 64_000) throw new Error("Source too large");
  const result = transform(source, {
    filename: "content.tsx",
    presets: ["typescript", ["react", { runtime: "classic" }]],
    plugins: ["transform-modules-commonjs"],
    comments: false,
  });
  const module = { exports: {} as { default?: ComponentType } };
  const modules = new Map<string, unknown>([["react", React], ["@blog-interactive/react", Viz]]);
  function require(name: string) {
    if (!modules.has(name)) throw new Error("Unsupported import");
    return modules.get(name);
  }
  const evaluate = new Function("module", "exports", "require", "React", "Viz", result.code);
  evaluate(module, module.exports, require, React, Viz);
  if (typeof module.exports.default !== "function" && typeof module.exports.default !== "object") {
    throw new Error("Missing default React component");
  }
  return module.exports.default;
}

function Ready({ View }: { View: ComponentType }) {
  useEffect(() => {
    const observer = new ResizeObserver(() => send("resize", { height: host.getBoundingClientRect().height }));
    observer.observe(host);
    send("ready");
    return () => observer.disconnect();
  }, []);
  return <View />;
}

class RuntimeBoundary extends React.Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { send("error"); }
  render() { return this.state.failed ? null : this.props.children; }
}

if (window.parent !== window && window.origin === "null") {
  window.addEventListener("error", () => { if (session) send("error"); });
  window.addEventListener("unhandledrejection", () => { if (session) send("error"); });
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (event.source !== window.parent || event.origin !== window.location.origin || data?.channel !== CHANNEL || typeof data.session !== "string") return;
    if (session) {
      if (data.session === session && data.type === "theme") applyTheme(data.theme);
      return;
    }
    if (data.type !== "init" || typeof data.source !== "string") return;
    session = data.session;
    try {
      applyTheme(data.theme);
      const View = compile(data.source);
      const root = createRoot(host, { onUncaughtError: () => send("error") });
      root.render(<RuntimeBoundary><Ready View={View} /></RuntimeBoundary>);
    } catch {
      send("error");
    }
  });
  send("boot");
}
