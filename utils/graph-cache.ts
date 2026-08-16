import { get, put } from "@vercel/blob";

const GRAPH_CACHE_VERSION = 3;
const GRAPH_CACHE_PATH = `graph-cache/v${GRAPH_CACHE_VERSION}/latest.json`;
const MEMORY_TTL_MS = 5 * 60 * 1000;

export type GraphSnapshot = { version: number; nodes: any[]; links: any[]; generatedAt: string };
let memoryCache: { snapshot: GraphSnapshot; loadedAt: number } | null = null;

export function hasPersistentGraphCache() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readGraphSnapshot(): Promise<GraphSnapshot | null> {
  if (memoryCache && Date.now() - memoryCache.loadedAt < MEMORY_TTL_MS) return memoryCache.snapshot;
  if (!hasPersistentGraphCache()) return null;
  try {
    const result = await get(GRAPH_CACHE_PATH, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const snapshot = await new Response(result.stream).json() as GraphSnapshot;
    if (snapshot.version !== GRAPH_CACHE_VERSION) return null;
    memoryCache = { snapshot, loadedAt: Date.now() };
    return snapshot;
  } catch {
    return null;
  }
}

export async function writeGraphSnapshot(snapshot: GraphSnapshot) {
  memoryCache = { snapshot, loadedAt: Date.now() };
  if (!hasPersistentGraphCache()) return false;
  await put(GRAPH_CACHE_PATH, JSON.stringify(snapshot), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  return true;
}
