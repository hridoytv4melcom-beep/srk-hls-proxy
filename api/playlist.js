// api/playlist.js
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import LRU from "lru-cache";

// cache for segment map (temporary)
const cache =
  global.__SEG_MAP ||
  new LRU({
    max: 5000,
    ttl: 60 * 1000, // 60 seconds
  });
global.__SEG_MAP = cache;

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).send("Missing channel name");

  // তোমার ২টি চ্যানেল এখানে যুক্ত করো
  const channels = {
    srk: "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8",
    bbc: "https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist_4300k.m3u8",
  };

  const originUrl = channels[name.toLowerCase()];
  if (!originUrl) return res.status(404).send("Channel not found");

  const response = await fetch(originUrl);
  if (!response.ok) return res.status(502).send("Failed to fetch origin playlist");

  const text = await response.text();
  const base = new URL(originUrl);

  // প্রতিটি segment URL কে uuid বানাও
  const rewritten = text
    .split(/\r?\n/)
    .map((line) => {
      if (!line || line.startsWith("#")) return line;
      try {
        const segUrl = new URL(line, base).toString();
        const id = uuidv4();
        cache.set(id, segUrl);
        return `/api/segment?id=${id}`;
      } catch {
        return line;
      }
    })
    .join("\n");

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "no-store, must-revalidate");
  res.send(rewritten);
    }
