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
    let narration = { pageId, status: "unavailable", blocks: {} };
    if (process.env.AUDIO_SERVER_URL) {
      const narrationUrl = `${process.env.AUDIO_SERVER_URL.replace(/\/$/, "")}/v1/pages/${pageId}/manifest`;
      try {
        const response = await fetch(narrationUrl, {
          signal: AbortSignal.timeout(2500),
        });
        if (response.ok) {
          narration = await response.json();
        } else {
          console.warn(`Narration manifest responded ${response.status} for ${pageId} from ${new URL(narrationUrl).origin}`);
        }
      } catch (error) {
        const cause = error?.cause;
        console.error("Narration manifest fetch failed", {
          pageId,
          origin: new URL(narrationUrl).origin,
          name: error?.name,
          message: error?.message,
          cause: cause instanceof Error
            ? { name: cause.name, message: cause.message, code: cause.code, errno: cause.errno, syscall: cause.syscall, hostname: cause.hostname, address: cause.address, port: cause.port }
            : cause,
        });
      }
    }
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ ...recap, narration });
  } catch (error) {
    console.error(`Failed to fetch recap page ${pageId}:`, error);
    return res.status(502).json({ error: "Failed to fetch recap page" });
  }
}
