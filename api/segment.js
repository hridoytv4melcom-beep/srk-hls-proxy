// api/segment.js
export default async function handler(req, res) {
  const u = req.query.u;
  if (!u) {
    res.status(400).send("Missing url");
    return;
  }
  const original = decodeURIComponent(u);

  try {
    // Optional: forward certain headers (like Referer or User-Agent) if origin server needs them.
    const fetchOptions = {
      // headers: { 'Referer': 'https://your-site.vercel.app/' } // uncomment if needed
    };

    const fetched = await fetch(original, fetchOptions);
    if (!fetched.ok) {
      res.status(502).send("Bad gateway fetching segment");
      return;
    }

    // Forward content-type if present
    const contentType = fetched.headers.get('content-type') || 'application/octet-stream';
    res.setHeader("Content-Type", contentType);

    // stream the content as buffer
    const arrayBuffer = await fetched.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
