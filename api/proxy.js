// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  const targetUrl = decodeURIComponent(url);

  try {
    // Referer, Origin — কিছুই পাঠাবেন না
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SRKTV/1.0)',
        // 'Referer' এবং 'Origin' এখানে দেওয়া হয়নি — অর্থাৎ পাঠানো হবে না
      },
    });

    // CORS সমস্যা এড়াতে: সব সাইট থেকে অ্যাক্সেস অনুমোদন
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // কন্টেন্ট টাইপ সেট করুন
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');

    // ডেটা পাঠান
    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
