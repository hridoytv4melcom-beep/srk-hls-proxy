export default async function handler(req, res) {
  try {
    // 🔒 এখানে অরিজিনাল m3u8 লিংক
    const url = "https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8";

    // অরিজিনাল playlist ফেচ করা
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).send("Failed to fetch source playlist");
    }

    let playlist = await response.text();

    // সব .ts লিংককে proxy segment এ রিরাইট করা
    playlist = playlist.replace(
      /(https?:\/\/[^\s]+?\.ts)/g,
      (match) =>
        `https://srk-hls-proxy.vercel.app/api/segment?u=${encodeURIComponent(match)}`
    );

    // Content-Type সেট করা যাতে player চিনতে পারে
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(playlist);

  } catch (err) {
    console.error("Error proxying video:", err);
    res.status(500).send("Server error");
  }
}
