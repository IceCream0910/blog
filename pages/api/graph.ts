import type { NextApiRequest, NextApiResponse } from "next";
import { buildGraphData } from "../../utils/build-graph-data";
import { readGraphSnapshot, writeGraphSnapshot } from "../../utils/graph-cache";

let activeBuild: Promise<any> | null = null;

async function buildOnce() {
  if (!activeBuild) {
    activeBuild = buildGraphData()
      .then(async (snapshot) => {
        try {
          await writeGraphSnapshot(snapshot);
        } catch {
          // The graph is still usable when persistent cache storage is temporarily unavailable.
        }
        return snapshot;
      })
      .finally(() => { activeBuild = null; });
  }
  return activeBuild;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  try {
    const cached = await readGraphSnapshot();
    const snapshot = cached || await buildOnce();
    res.setHeader("X-Graph-Cache", cached ? "HIT" : "MISS");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(snapshot);
  } catch {
    return res.status(500).json({ error: "failed to load graph" });
  }
}

export const config = { maxDuration: 120 };
