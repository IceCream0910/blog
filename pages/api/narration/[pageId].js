export default async function handler(req, res) {
  const pageId = Array.isArray(req.query.pageId) ? req.query.pageId[0] : req.query.pageId;
  if (!pageId?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    return res.status(400).json({ error: "Invalid page id" });
  }
  if (!process.env.AUDIO_SERVER_URL) {
    return res.status(503).json({ error: "Narration server is not configured" });
  }

  const origin = process.env.AUDIO_SERVER_URL.replace(/\/$/, "");
  try {
    const response = await fetch(`${origin}/v1/pages/${pageId}/manifest`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: "Narration manifest unavailable" });
    }
    const manifest = await response.json();
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json(manifest);
  } catch (error) {
    console.error("Post narration manifest fetch failed", { pageId, message: error?.message });
    return res.status(502).json({ error: "Narration manifest fetch failed" });
  }
}
