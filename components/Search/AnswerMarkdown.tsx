import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { parseAnswerInline, parseAnswerMarkdown, type AnswerInline } from "../../utils/search/answer-markdown";
import type { SearchResult } from "../../utils/search/types";

export function AnswerMarkdown({ text, reducedMotion, sources, onClose }: { text: string; reducedMotion: boolean; sources: SearchResult[]; onClose: () => void }) {
  const words = (value: string, start: number) => reducedMotion ? value : Array.from(value.matchAll(/\s+|\S+/gu), (match) =>
    /^\s+$/.test(match[0]) ? match[0] : <motion.span key={start + match.index!} className="global-search-answer-word"
      initial={{ opacity: 0, y: 7, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: .28, ease: [.22, 1, .36, 1] }}>{match[0]}</motion.span>);
  const inline = (tokens: AnswerInline[]): React.ReactNode => tokens.map((token) => {
    if (token.kind === "strong") return <strong key={token.start}>{inline(token.children!)}</strong>;
    if (token.kind === "em") return <em key={token.start}>{inline(token.children!)}</em>;
    if (token.kind === "code") return <code key={token.start}>{words(token.text, token.start)}</code>;
    if (token.kind === "citation") {
      const source = sources[Number(token.text) - 1];
      return source ? <Link key={token.start} className="global-search-citation" href={source.href} aria-label={`참고 문서 ${token.text}: ${source.title}`}
        onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) onClose(); }}>[{token.text}]</Link> : <React.Fragment key={token.start}>[{token.text}]</React.Fragment>;
    }
    return <React.Fragment key={token.start}>{words(token.text, token.start)}</React.Fragment>;
  });
  return <div className="global-search-answer-text global-search-markdown">{parseAnswerMarkdown(text).map((block) => {
    const content = () => inline(parseAnswerInline(block.text, block.start));
    if (block.kind === "heading") {
      const Heading = `h${(block.level || 1) + 3}` as "h4" | "h5" | "h6";
      return <Heading key={block.start}>{content()}</Heading>;
    }
    if (block.kind === "ul" || block.kind === "ol") {
      const List = block.kind;
      return <List key={block.start}>{block.items!.map((item) => <li key={item.start}>{inline(parseAnswerInline(item.text, item.start))}</li>)}</List>;
    }
    if (block.kind === "code") return <pre key={block.start}><code>{words(block.text, block.start)}</code></pre>;
    if (block.kind === "quote") return <blockquote key={block.start}>{content()}</blockquote>;
    return <p key={block.start}>{content()}</p>;
  })}</div>;
}
