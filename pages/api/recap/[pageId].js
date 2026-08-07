import { NotionAPI } from "notion-client";
import { prepareRecapRecordMap } from "../../../utils/recap-record-map";

export default async function handler(req, res) {
  const pageId = Array.isArray(req.query.pageId) ? req.query.pageId[0] : req.query.pageId;
  if (!pageId?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    return res.status(400).json({ error: "Invalid page id" });
  }
  try {
    const notion = new NotionAPI({ apiBaseUrl: "https://app.notion.com/api/v3" });
    const recap = prepareRecapRecordMap(await notion.getPage(pageId), pageId);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(recap);
  } catch (error) {
    console.error(`Failed to fetch recap page ${pageId}:`, error);
    return res.status(502).json({ error: "Failed to fetch recap page" });
  }
}
