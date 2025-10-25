// api/stream.js
import fetch from "node-fetch";

// আপনার origin m3u8 লিংক এখানে রাখুন
const ORIGIN_M3U8 = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";

export default async function handler(req, res) {
  try {
    if (req.query.segment) {
      // segment fetch
      const segUrl = decodeURIComponent(req.query.segment);
      const segRes = await fetch(segUrl, {
        headers: { "User-Agent": "Mozilla/5.0", "Origin": "https://srknowapp.ncare.live", "Referer": "https://srknowapp.ncare.live/" }
      });
      const buf = await segRes.arrayBuffer();
      res.setHeader("Content-Type", segRes.headers.get("content-type") || "video/mp2t");
      res.setHeader("Cache-Control", "public, max-age=5");
      return res.send(Buffer.from(buf));
    }

    // main m3u8 fetch
    const response = await fetch(ORIGIN_M3U8, {
      headers: { "User-Agent": "Mozilla/5.0", "Origin": "https://srknowapp.ncare.live", "Referer": "https://srknowapp.ncare.live/" }
    });

    let text = await response.text();

    // সব segment URL proxy route দিয়ে রিরাইট
    text = text.replace(/https?:\/\/[^\r\n]+/g, (m) =>
      `/api/stream?segment=${encodeURIComponent(m)}`
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    return res.send(text);

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
}
