// api/video.js
export default async function handler(req, res) {
  const { channel } = req.query;

  if (!channel) {
    return res.status(400).send('Missing channel');
  }

  // চ্যানেল ম্যাপিং — আপনার দেওয়া m3u8 লিংকগুলো
  const channelMap = {
    sony_aath: 'https://live20.bozztv.com/giatvplayout7/giatv-209611/tracks-v1a1/mono.ts.m3u8',
    srk_tv: 'https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8',
    bbc_news: 'https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist_4300k.m3u8'
  };

  const targetUrl = channelMap[channel];
  if (!targetUrl) {
    return res.status(404).send('Channel not found');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HLS Proxy)',
        'Referer': 'https://srk-hls-proxy.vercel.app/'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch m3u8 for ${channel}:`, response.status);
      return res.status(502).send('Upstream error');
    }

    let m3u8Text = await response.text();

    // ✨ সেগমেন্ট URL গুলোকে /api/segment এ রিওয়াইট করুন
    // (যদি সেগমেন্টগুলো আলাদা ডোমেইনে থাকে)
    const baseUrl = new URL(targetUrl).origin + new URL(targetUrl).pathname.replace(/[^/]*$/, '');
    m3u8Text = m3u8Text.replace(
      new RegExp(`(?!\\/)([^\\n\\r"]+\\.(?:ts|m4s|mp4))`, 'g'),
      (match) => {
        const segUrl = new URL(match, baseUrl).href;
        return `/api/segment?url=${encodeURIComponent(segUrl)}`;
      }
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(m3u8Text);
  } catch (err) {
    console.error('video.js error:', err);
    res.status(500).send('Proxy failed');
  }
}
