// এই লিঙ্ক কেবল সার্ভার-সাইডে থাকবে — ক্লায়েন্ট দেখবে না
const SECRET_HLS_URL = 'https://srknowapp.ncare.live/srktvhlswodrm/srktv.stream/tracks-v1a1/mono.m3u8';

export default async function handler(req, res) {
  // প্রক্সি ইউআরএল তৈরি
  const proxyUrl = `https://srk-hls-proxy.vercel.app/proxy?url=${encodeURIComponent(SECRET_HLS_URL)}`;

  // ক্লায়েন্টকে শুধু প্রক্সি ইউআরএল দিন
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ streamUrl: proxyUrl });
}
