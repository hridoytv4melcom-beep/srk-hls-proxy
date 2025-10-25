// api/stream.js
import fetch from "node-fetch";

const ORIGIN_M3U8 = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";
// আপনি চাইলে এখানে base (without filename) রাখতে পারেন এবং path logic যোগ করতে পারেন.

export default async function handler(req, res) {
  try {
    const url = ORIGIN_M3U8; // সরাসরি সার্ভার-ইOrigen ব্যবহার করছে

    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(response.status).send("Origin fetch failed");

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/vnd.apple.mpegurl") || url.endsWith(".m3u8")) {
      let text = await response.text();

      // সব absolute segment/playlist লিংককে আমাদের proxy দিয়ে রিরাইট করবো
      // (প্রয়োজনে regex টিউন করতে হবে origin manifest ধরন অনুযায়ী)
      const proxyBase = `${req.protocol}://${req.get("host")}/api/stream?segment=`;
      // সাধারণভাবে: যে কোন http(s)://... অংশকে proxyBase + encodeURIComponent(original)
      text = text.replace(/https?:\/\/[^\r\n]+/g, (m) => proxyBase + encodeURIComponent(m));

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      return res.status(200).send(text);
    } else {
      // .ts বা বাইনারি সেগমেন্ট রিটার্ন করা (segment param এ আসবে)
      const segmentUrl = req.query.segment ? decodeURIComponent(req.query.segment) : null;
      if (segmentUrl) {
        const segRes = await fetch(segmentUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!segRes.ok) return res.status(segRes.status).send("Segment fetch failed");
        const buf = await segRes.arrayBuffer();
        res.setHeader("Content-Type", segRes.headers.get("content-type") || "application/octet-stream");
        // short cache for segments
        res.setHeader("Cache-Control", "public, max-age=5");
        return res.status(200).send(Buffer.from(buf));
      } else {
        // fallback: just pipe whatever (rare)
        const buf = await response.arrayBuffer();
        res.send(Buffer.from(buf));
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
}
