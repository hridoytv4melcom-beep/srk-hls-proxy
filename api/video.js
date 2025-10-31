export default async function handler(req, res) {
  // ✅ CORS হেডার
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { channel } = req.query;

  if (!channel) {
    return res.status(400).send('❌ Missing channel parameter');
  }

  // ✅ চ্যানেল ম্যাপিং
  const channelMap = {
    sony_aath: 'https://live20.bozztv.com/giatvplayout7/giatv-209611/tracks-v1a1/mono.ts.m3u8',
    srk_tv3330: 'https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8',
    bbc_news: 'https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist_4300k.m3u8'
  };

  const upstreamUrl = channelMap[channel];
  if (!upstreamUrl) {
    return res.status(404).send('❌ Channel not found');
  }

  try {
    // ✅ আপস্ট্রিম m3u8 ফেচ
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HLS Proxy)',
        'Referer': 'https://srk-hls-proxy.vercel.app/',
        'Origin': 'https://srk-hls-proxy.vercel.app',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      console.error(`Upstream error for ${channel}:`, response.status, response.statusText);
      return res.status(502).send('❌ Failed to fetch stream');
    }

    let m3u8Text = await response.text();

    // Base URL (relative link ঠিক করার জন্য)
    const baseUrl = new URL(upstreamUrl).origin + new URL(upstreamUrl).pathname.replace(/[^/]*$/, '');

    // ✅ সমস্ত segment লিংক /api/segment দিয়ে রিওয়াইট
    m3u8Text = m3u8Text.replace(
      /(?<!https?:\/\/)([^"\n\r]+?\.(?:ts|m4s|mp4|aac|vtt))/g,
      (match) => {
        const absoluteUrl = new URL(match, baseUrl).href;
        return `/api/segment?url=${encodeURIComponent(absoluteUrl)}`;
      }
    );

    // ✅ Content-Type + Cache-Control
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(m3u8Text);
  } catch (err) {
    console.error('video.js error:', err.message);
    res.status(500).send('❌ Internal proxy error');
  }
}
