export default async function handler(req, res) {
  // 🎯 এখানে তোমার অরিজিনাল M3U8 URL দাও
  const originalUrl = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";

  try {
    // 🔥 Header সহ ফেচ (CORS বাইপাসে সহায়ক)
    const fetched = await fetch(originalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://srk-hls-proxy.vercel.app"
      }
    });

    if (!fetched.ok) {
      res.status(502).send("Bad gateway fetching playlist");
      return;
    }

    let playlist = await fetched.text();

    // 🔁 Absolute URL (https://...) কে proxy segment এ রিরাইট
    playlist = playlist.replace(
      /(https?:\/\/[^\s\n\r",]+)/g,
      (match) =>
        `https://srk-hls-proxy.vercel.app/api/segment?u=${encodeURIComponent(match)}`
    );

    // 🧩 Relative URL (segment.ts, বা sub/segment.ts ইত্যাদি) ঠিক করা
    try {
      const base = new URL(originalUrl);
      const originBase =
        base.origin + base.pathname.substring(0, base.pathname.lastIndexOf("/") + 1);

      playlist = playlist
        .split(/\r?\n/)
        .map((line) => {
          if (!line || line.startsWith("#")) return line;
          const trimmed = line.trim();
          if (trimmed.startsWith("/api/segment")) return trimmed;
          if (/^https?:\/\//i.test(trimmed)) return trimmed;
          const absolute = trimmed.startsWith("/")
            ? base.origin + trimmed
            : originBase + trimmed;
          return `https://srk-hls-proxy.vercel.app/api/segment?u=${encodeURIComponent(absolute)}`;
        })
        .join("\n");
    } catch (e) {
      console.error("Base rewrite error:", e);
    }

    // 🧠 Cache ও Streaming Hint যোগ করা
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(200).send(playlist);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Server error");
  }
}
