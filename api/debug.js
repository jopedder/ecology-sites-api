export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { source = "scot_sssi" } = req.query;

  const targets = {
    // Confirm Scotland field names
    scot_sssi:   "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Sites_of_Special_Scientific_Interest/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_sac:    "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/SAC_clip/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_spa:    "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/SPA_clip/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_ramsar: "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/RAMSAR_Wetlands_of_International_Importance/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_nnr:    "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/NNR_WEBSITE_DATA/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    // Confirm NI field names
    ni_assi:     "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/ASSI/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_sac:      "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/SAC/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_spa:      "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/SPA/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_ramsar:   "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/ramsar/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    // Try Wales org IDs
    wales_a:     "https://services.arcgis.com/nEZyB4nIp9pe2asL/arcgis/rest/services?f=json",
    wales_b:     "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services?f=json", // NE - for reference
    wales_c:     "https://services1.arcgis.com/9ZAPY3BuRdGFos63/arcgis/rest/services?f=json",
  };

  const url = targets[source];
  if (!url) return res.status(400).json({ error: "unknown source", available: Object.keys(targets) });

  try {
    const r = await fetch(url);
    const data = await r.json();
    // For query endpoints, just return the field names and first feature attributes
    if (data.features) {
      const fields = (data.fields || []).map(f => f.name);
      const attrs = data.features[0]?.attributes || {};
      return res.status(200).json({ fields, sample: attrs });
    }
    // For services list endpoints, filter to ecology-relevant
    const keywords = ["sssi","sac","spa","ramsar","nnr","nature reserve","assi","designat","protected","habitat"];
    const filtered = (data.services || []).filter(s =>
      keywords.some(k => s.name.toLowerCase().includes(k))
    );
    return res.status(200).json({ total: data.services?.length, filtered });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
