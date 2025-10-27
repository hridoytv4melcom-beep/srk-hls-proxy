// api/segment.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing segment URL');
  }

  // ডিকোড করুন
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }

  // শুধু নির্দিষ্ট ডোমেইন থেকে অনুমতি দিন (সিকিউরিটি)
  const allowedDomains = [
    'live20.bozztv.com',
    'srknowapp.ncare.live',
    'd2vnbkvjbims7j.cloudfront.net'
  ];
  const urlObj = new URL(decodedUrl);
  if (!allowedDomains.some(d => urlObj.hostname.includes(d))) {
    return res.status(403).send('Domain not allowed');
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (HLS Segment Proxy)',
        'Referer': 'https://srk-hls-proxy.vercel.app/'
      }
    });

    if (!response.ok) {
      return res.status(404).send('Segment not found');
    }

    const contentType = response.headers.get('content-type') || 'video/MP2T';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Segment proxy error:', err);
    res.status(500).send('Segment fetch failed');
  }
}
