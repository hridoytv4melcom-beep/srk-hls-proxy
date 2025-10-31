import crypto from 'crypto';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL); // Redis URL env এ রাখো

const channelMap = {
  sony_aath: 'https://live20.bozztv.com/giatvplayout7/giatv-209611/tracks-v1a1/mono.ts.m3u8',
  srk_tv: 'https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8',
  bbc_news: 'https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist_4300k.m3u8'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { channel } = req.query;
  if (!channel) return res.status(400).send('❌ Missing channel parameter');

  const upstreamUrl = channelMap[channel];
  if (!upstreamUrl) return res.status(404).send('❌ Channel not found');

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HLS Proxy)',
        'Referer': 'https://srk-hls-proxy.vercel.app/',
        'Origin': 'https://srk-hls-proxy.vercel.app',
        'Accept': '*/*'
      }
    });
    if (!response.ok) return res.status(502).send('❌ Failed to fetch stream');

    let m3u8Text = await response.text();
    const baseUrl = new URL(upstreamUrl).origin + new URL(upstreamUrl).pathname.replace(/[^/]*$/, '');

    // TS লিংক random ID তে রিরাইট এবং Redis এ store
    const regex = /(?<!https?:\/\/)([^"\n\r]+?\.(?:ts|m4s|mp4|aac|vtt))/g;
    m3u8Text = m3u8Text.replace(regex, async (match) => {
      const absoluteUrl = new URL(match, baseUrl).href;
      const segId = crypto.randomBytes(8).toString('hex');
      await redis.set(`segment:${segId}`, absoluteUrl, 'EX', 86400); // 1 day TTL
      return `/api/segment?seg=${segId}`;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(m3u8Text);

  } catch (err) {
    console.error('video.js error:', err);
    res.status(500).send('❌ Internal proxy error');
  }
}
