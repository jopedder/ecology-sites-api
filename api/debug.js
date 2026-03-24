export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { source = "scot" } = req.query;

  const urls = {
    // NatureScot (Scotland)
    scot: "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services?f=json",
    // NRW (Wales) - try both known ArcGIS org IDs
    wales1: "https://services.arcgis.com/1ZNp5zJKSIPrAMSo/arcgis/rest/services?f=json",
    wales2: "https://services.arcgis.com/nEZyB4nIp9pe2asL/arcgis/rest/services?f=json",
    // NIEA (Northern Ireland) - confirm ASSI service
    ni: "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services?f=json",
  };

  const url = urls[source];
  if (!url) return res.status(400).json({ error: "unknown source, use: scot, wales1, wales2, ni" });

  try {
    const response = await fetch(url);
    const data = await response.json();
    // Filter to ecologically relevant services only
    const keywords = ["sssi","sac","spa","ramsar","nnr","national park","nature reserve","assi","designat","protected","habitat","wildlife"];
    const filtered = (data.services || []).filter(s =>
      keywords.some(k => s.name.toLowerCase().includes(k))
    );
    return res.status(200).json({ source, total: data.services?.length, filtered });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
