export type AnswerInline = { kind: "text" | "strong" | "em" | "code" | "citation"; text: string; start: number; children?: AnswerInline[] };
export type AnswerBlock = { kind: "paragraph" | "heading" | "quote" | "code" | "ul" | "ol"; text: string; start: number; level?: number; items?: { text: string; start: number }[] };

export function parseAnswerInline(text: string, start = 0, depth = 0): AnswerInline[] {
  if (depth > 3) return [{ kind: "text", text, start }];
  const pattern = /`([^`\n]+)`|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+)\*|_([^_\n]+)_|\[(\d{1,2})\]/g;
  const tokens: AnswerInline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > cursor) tokens.push({ kind: "text", text: text.slice(cursor, match.index), start: start + cursor });
    const kind = match[1] ? "code" : match[2] || match[3] ? "strong" : match[4] || match[5] ? "em" : "citation";
    const content = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
    const offset = start + match.index! + (kind === "strong" ? 2 : 1);
    tokens.push({ kind, text: content, start: start + match.index!, children: kind === "strong" || kind === "em" ? parseAnswerInline(content, offset, depth + 1) : undefined });
    cursor = match.index! + match[0].length;
  }
  if (cursor < text.length) tokens.push({ kind: "text", text: text.slice(cursor), start: start + cursor });
  return tokens;
}

export function parseAnswerMarkdown(source: string): AnswerBlock[] {
  const text = source.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) { offsets.push(offset); offset += line.length + 1; }
  const blocks: AnswerBlock[] = [];
  const list = (line: string) => line.match(/^ {0,3}([-+*]|\d+\.)\s+(.*)$/);
  const special = (line: string) => /^\s*$|^ {0,3}#{1,3}\s|^ {0,3}>\s?|^ {0,3}```/.test(line) || Boolean(list(line));
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const start = offsets[index];
    if (!line.trim()) { index++; continue; }
    if (/^ {0,3}```/.test(line)) {
      const content: string[] = [];
      index++;
      while (index < lines.length && !/^ {0,3}```\s*$/.test(lines[index])) content.push(lines[index++]);
      if (index < lines.length) index++;
      blocks.push({ kind: "code", text: content.join("\n"), start });
      continue;
    }
    const heading = line.match(/^ {0,3}(#{1,3})\s+(.*)$/);
    if (heading) { blocks.push({ kind: "heading", level: heading[1].length, text: heading[2], start }); index++; continue; }
    const first = list(line);
    if (first) {
      const ordered = /\d/.test(first[1]);
      const items: { text: string; start: number }[] = [];
      while (index < lines.length) {
        const match = list(lines[index]);
        if (!match || /\d/.test(match[1]) !== ordered) break;
        items.push({ text: match[2], start: offsets[index] + lines[index].indexOf(match[2], match[1].length) });
        index++;
      }
      blocks.push({ kind: ordered ? "ol" : "ul", text: "", start, items });
      continue;
    }
    if (/^ {0,3}>/.test(line)) {
      const content: string[] = [];
      while (index < lines.length && /^ {0,3}>/.test(lines[index])) content.push(lines[index++].replace(/^ {0,3}>\s?/, ""));
      blocks.push({ kind: "quote", text: content.join("\n"), start });
      continue;
    }
    const content = [line]; index++;
    while (index < lines.length && !special(lines[index])) content.push(lines[index++]);
    blocks.push({ kind: "paragraph", text: content.join("\n"), start });
  }
  return blocks;
}
