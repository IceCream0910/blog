import type { NextApiRequest, NextApiResponse } from "next";
import searchHandler from "./search";

// Keep the old URL during migration, but no longer accept raw Notion search parameters.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  res.setHeader("Deprecation", "true");
  req.method = "GET";
  req.query = { q: req.body?.query, type: req.body?.type || "all", folder: req.body?.folder || "" };
  return searchHandler(req, res);
}
