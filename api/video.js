// api/video.js
export default async function handler(req, res) {
  // ORIGINAL playlist URL (তুমি দিলে)
  const originalUrl = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";

  try {
    const fetched = await fetch(originalUrl);
    if (!fetched.ok) {
      res.status(502).send("Bad gateway fetching playlist");
      return;
    }
    let playlist = await fetched.text();

    // প্রথম ধাপ: প্লেলিস্টে থাকা absolute URLs (http/https) আমাদের /api/segment এ রিরাইট করো
    const urlRegex = /(https?:\/\/[^\s\n\r,]+)/g;
    playlist = playlist.replace(urlRegex, (match) => {
      return `/api/segment?u=${encodeURIComponent(match)}`;
    });

    // দ্বিতীয় ধাপ: relative URLs (যেগুলো সরাসরি সেগমেন্ট পাথ হতে পারে) রিরাইট করো
    try {
      const base = new URL(originalUrl);
      const originBase = base.origin + base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);

      // প্রতিটি লাইন চেক করে যদি তা URL/পাথ হয় তখন রিরাইট
      playlist = playlist.split(/\r?\n/).map(line => {
        if (!line || line.startsWith('#')) return line; // comment/metadata
        const trimmed = line.trim();
        // যদি ইতিমধ্যে /api/segment হলে skip
        if (trimmed.startsWith('/api/segment')) return trimmed;
        // যদি absolute URL হয়ে থাকে skip (আগেই রিরাইট হয়ে গেছে)
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        // যদি starts with '/' then root relative
        if (trimmed.startsWith('/')) {
          const absolute = base.origin + trimmed;
          return `/api/segment?u=${encodeURIComponent(absolute)}`;
        }
        // otherwise treat as relative to playlist folder
        const absolute = originBase + trimmed;
        return `/api/segment?u=${encodeURIComponent(absolute)}`;
      }).join('\n');
    } catch (e) {
      console.error('base rewrite error', e);
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
