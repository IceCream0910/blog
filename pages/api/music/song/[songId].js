const MUSIC_API_ORIGIN = "https://yuntae.in";

export default async function handler(req, res) {
  const songId = Array.isArray(req.query.songId) ? req.query.songId[0] : req.query.songId;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (typeof songId !== "string" || !/^[A-Za-z0-9._-]{1,128}$/.test(songId)) {
    return res.status(400).json({ error: "Invalid song id" });
  }

  try {
    const upstream = await fetch(`${MUSIC_API_ORIGIN}/api/music/song/${encodeURIComponent(songId)}`);
    if (!upstream.ok) {
      console.warn("Music metadata request failed", { songId, status: upstream.status });
      return res.status(upstream.status === 404 ? 404 : 502).json({ error: "Music metadata unavailable" });
    }
    const payload = await upstream.json();
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Music metadata request failed", { songId, message: error instanceof Error ? error.message : String(error) });
    return res.status(502).json({ error: "Music metadata unavailable" });
  }
}
