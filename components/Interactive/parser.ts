const SOURCE_LIMIT = 64_000;
const REACT_MARKER = /^\/\/\s*@blog-interactive\/react(?:[ \t]+([^\r\n]+))?[ \t]*(?:\r?\n|$)/;
const JSON_MARKER = /^\{\s*"\$viz"\s*:/;
const REACT_LANGUAGES = new Set(["typescript", "javascript", "tsx", "jsx"]);

type BlockLike = { type?: string; properties?: { title?: unknown[][]; language?: unknown[][] } };
type Item = string | number;

export type StructureSpec = {
  kind: "stack" | "queue" | "list" | "tree";
  title?: string;
  initial: Item[];
  capacity: number;
  allowPush: boolean;
  allowPop: boolean;
  animated: boolean;
};

export type InteractiveSpec = StructureSpec
  | { kind: "chart"; spec: Record<string, unknown>; title?: string }
  | { kind: "component"; name: string; title?: string }
  | { kind: "react"; source: string }
  | { kind: "invalid" };

export function getInteractiveSource(block: BlockLike) {
  const language = String(block.properties?.language?.[0]?.[0] || "").toLowerCase();
  const source = (block.properties?.title || []).map((part) => part[0]).join("").trim();
  return { language, source };
}

function parseJSON(source: string) {
  return JSON.parse(source, (key, value) => {
    if (key === "__proto__" || key === "prototype" || key === "constructor") {
      throw new Error("Unsupported key");
    }
    return value;
  });
}

function classify({ language, source }: ReturnType<typeof getInteractiveSource>) {
  if (REACT_LANGUAGES.has(language) && REACT_MARKER.test(source)) return "react";
  if (language !== "json") return null;
  if (JSON_MARKER.test(source)) return "json";
  if (source.length > SOURCE_LIMIT || !source.includes('"$viz"')) return null;
  try {
    const value = JSON.parse(source);
    return value && Object.hasOwn(value, "$viz") ? "json" : null;
  } catch {
    return null;
  }
}

export function isInteractiveBlock(block?: BlockLike) {
  return block?.type === "code" && classify(getInteractiveSource(block)) !== null;
}

export function parseInteractiveBlock(block: BlockLike): InteractiveSpec | null {
  if (block.type !== "code") return null;
  const input = getInteractiveSource(block);
  const mode = classify(input);
  if (!mode) return null;
  const { source } = input;
  if (source.length > SOURCE_LIMIT) return { kind: "invalid" };

  if (mode === "react") {
    const marker = REACT_MARKER.exec(source)!;
    const body = source.slice(marker[0].length).trim();
    return marker[1]?.trim() === "v1" && body ? { kind: "react", source: body } : { kind: "invalid" };
  }

  try {
    const value = parseJSON(source);
    if (value.$viz !== 1) return { kind: "invalid" };
    const kind = value.kind ?? value.type;
    const title = typeof value.title === "string" ? value.title.slice(0, 160) : undefined;
    if (kind === "chart" && value.spec && typeof value.spec === "object" && !Array.isArray(value.spec)) {
      return { kind, title, spec: value.spec };
    }
    if (kind === "component" && typeof value.name === "string") return { kind, title, name: value.name };
    if (kind === "stack" || kind === "queue" || kind === "list" || kind === "tree") {
      const initial = value.initial ?? [];
      const options = value.options ?? {};
      const capacity = options.capacity ?? Math.max(8, initial.length);
      if (!Array.isArray(initial) || !Number.isInteger(capacity) || capacity < 1 || capacity > 31
        || initial.length > capacity
        || !initial.every((item) => typeof item === "number" ? Number.isFinite(item) : typeof item === "string" && item.length <= 24)
        || ["allowPush", "allowPop", "animated"].some((key) => options[key] !== undefined && typeof options[key] !== "boolean")) {
        return { kind: "invalid" };
      }
      return { kind, title, initial, capacity, allowPush: options.allowPush ?? true,
        allowPop: options.allowPop ?? true, animated: options.animated ?? true };
    }
  } catch {
    return { kind: "invalid" };
  }
  return { kind: "invalid" };
}
