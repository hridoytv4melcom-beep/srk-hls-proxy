import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if(!url) return res.status(400).send("URL required");

  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const contentType = response.headers.get("content-type") || "";

    if(contentType.includes("application/vnd.apple.mpegurl") ||     url.endsWith(".m3u8")) {
      let text = await response.text();
      // m3u8 ভিতরের সব URLs proxy করবে
      text = text.replace(/(https?:\/\/[^\n]+)/g, "/api/stream?url=$1");
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(text);
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
}
