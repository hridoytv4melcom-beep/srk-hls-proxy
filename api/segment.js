// api/segment.js
import fetch from "node-fetch";
import LRU from "lru-cache";

const cache =
  global.__SEG_MAP ||
  new LRU({
    max: 5000,
    ttl: 60 * 1000,
  });
global.__SEG_MAP = cache;

function copySafeHeaders(originHeaders, res) {
  const allowed = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ];
  allowed.forEach((k) => {
    const v = originHeaders.get(k);
    if (v) res.setHeader(k, v);
  });
  res.setHeader("Cache-Control", "no-store, must-revalidate");
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const segUrl = cache.get(id);
  if (!segUrl) return res.status(404).send("Segment expired or invalid");

  const response = await fetch(segUrl);
  if (!response.ok) return res.status(502).send("Failed to fetch segment");

  copySafeHeaders(response.headers, res);

  const body = response.body;
  if (body) {
    body.pipe(res);
  } else {
    const buf = await response.buffer();
    res.end(buf);
  }
}
