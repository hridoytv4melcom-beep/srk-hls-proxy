import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  const { seg } = req.query;
  if (!seg) return res.status(400).send('❌ Missing segment ID');

  try {
    const url = await redis.get(`segment:${seg}`);
    if (!url) return res.status(404).send('❌ Segment not found');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HLS Segment Proxy)',
        'Referer': 'https://srk-hls-proxy.vercel.app/',
        'Origin': 'https://srk-hls-proxy.vercel.app',
        'Accept': '*/*'
      }
    });

    if (!response.ok) return res.status(404).send('❌ Segment fetch failed');

    const contentType = response.headers.get('content-type') || 'video/MP2T';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('segment.js error:', err);
    res.status(500).send('❌ Segment fetch failed');
  }
}
