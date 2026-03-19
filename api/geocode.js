export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "q is required" });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=gb&limit=1&format=json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ProtectedSitesFinder/1.0 (ecology tool)",
        "Accept-Language": "en",
      },
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
