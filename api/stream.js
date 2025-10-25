// api/stream.js
import fetch from "node-fetch";

const ORIGIN = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";

export default async function handler(req, res) {
  try {
    const response = await fetch(ORIGIN, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://srknowapp.ncare.live",
        "Referer": "https://srknowapp.ncare.live/"
      }
    });

    const contentType = response.headers.get("content-type");

    if (ORIGIN.endsWith(".m3u8") || contentType.includes("application/vnd.apple.mpegurl")) {
      let text = await response.text();

      // সব segment URLs proxy route দিয়ে রিরাইট
      text = text.replace(/https?:\/\/[^\r\n]+/g, (m) =>
        `/api/stream?segment=${encodeURIComponent(m)}`
      );

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(text);
    }

    // segment fetch
    if (req.query.segment) {
      const segUrl = decodeURIComponent(req.query.segment);
      const segRes = await fetch(segUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const buffer = await segRes.arrayBuffer();
      res.setHeader("Content-Type", segRes.headers.get("content-type") || "video/mp2t");
      return res.send(Buffer.from(buffer));
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
}
