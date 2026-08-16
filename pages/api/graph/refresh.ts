import type { NextApiRequest, NextApiResponse } from "next";
import { buildGraphData } from "../../../utils/build-graph-data";
import { hasPersistentGraphCache, writeGraphSnapshot } from "../../../utils/graph-cache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!hasPersistentGraphCache()) return res.status(503).json({ error: "blob cache is not configured" });
  try {
    const snapshot = await buildGraphData();
    await writeGraphSnapshot(snapshot);
    return res.status(200).json({ ok: true, generatedAt: snapshot.generatedAt, nodes: snapshot.nodes.length, links: snapshot.links.length });
  } catch {
    return res.status(500).json({ error: "failed to refresh graph" });
  }
}

export const config = { maxDuration: 60 };
