import { useEffect, useRef, useState } from "react";
import { Button, Frame } from "../sdk";
import { CHANNEL, MAX_HEIGHT, THEME_KEYS } from "./protocol";

export default function Sandbox({ source, darkMode }: { source: string; darkMode: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const session = useRef("");
  const currentDarkMode = useRef(darkMode);
  currentDarkMode.current = darkMode;
  const timeout = useRef<number>(undefined);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [height, setHeight] = useState(160);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "160px" });
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || failed) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.origin !== "null") return;
      const data = event.data;
      if (data?.channel !== CHANNEL) return;
      if (data.type === "boot" && !session.current) {
        session.current = Array.from(window.crypto.getRandomValues(new Uint32Array(4))).join("-");
        iframe.current?.contentWindow?.postMessage({ channel: CHANNEL, session: session.current,
          type: "init", source, theme: theme() }, "*");
        return;
      }
      if (!session.current || data.session !== session.current) return;
      if (data.type === "ready") {
        window.clearTimeout(timeout.current);
        setReady(true);
      } else if (data.type === "resize" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setHeight(Math.max(48, Math.min(MAX_HEIGHT, Math.ceil(data.height))));
      } else if (data.type === "error") {
        setFailed(true);
      }
    };
    window.addEventListener("message", onMessage);
    timeout.current = window.setTimeout(() => setFailed(true), 8000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout.current);
    };
  }, [attempt, failed, source, visible]);

  function theme() {
    const style = getComputedStyle(host.current!);
    return { darkMode: currentDarkMode.current, tokens: THEME_KEYS.map((key) => style.getPropertyValue(key).trim()),
      font: style.fontFamily };
  }

  useEffect(() => {
    if (!ready || failed) return;
    const frame = requestAnimationFrame(() => {
      iframe.current?.contentWindow?.postMessage({ channel: CHANNEL, session: session.current,
        type: "theme", theme: theme() }, "*");
    });
    return () => cancelAnimationFrame(frame);
  }, [darkMode, ready, failed]);

  function restart() {
    session.current = "";
    setReady(false);
    setFailed(false);
    setHeight(160);
    setAttempt((count) => count + 1);
  }

  return <div ref={host}>
    {(!visible || (!ready && !failed)) && <p className="viz-status" role="status">인터랙티브 콘텐츠를 불러오는 중이에요.</p>}
    {visible && !failed && <iframe ref={iframe} key={attempt} className="viz-iframe" title="커스텀 인터랙티브 콘텐츠"
      sandbox="allow-scripts" referrerPolicy="no-referrer" height={height} src="/interactive-sandbox.html" />}
    {failed && <Frame><p role="status">커스텀 콘텐츠를 실행할 수 없어요.</p></Frame>}
    {(ready || failed) && <Button className="viz-restart" onClick={restart}>다시 실행</Button>}
  </div>;
}
