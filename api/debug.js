export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { source = "scot_lnr" } = req.query;

  const targets = {
    scot_lnr:  "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/LNR_dashboard_keep_this_one/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_np:   "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services?f=json",
    ni_all:    "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services?f=json",
    wales_lnr: "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_LNR&outputFormat=application/json&count=1&srsName=EPSG:4326",
    wales_nnr: "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_NNR&outputFormat=application/json&count=1&srsName=EPSG:4326",
    wales_np:  "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_NP&outputFormat=application/json&count=1&srsName=EPSG:4326",
  };

  const url = targets[source];
  if (!url) return res.status(400).json({ error: "unknown source", available: Object.keys(targets) });

  try {
    const r = await fetch(url);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { return res.status(200).json({ raw: text.slice(0, 500) }); }

    // Service list — filter for NP/LNR/NNR
    if (data.services) {
      const keywords = ["national_park","nationalpark","national park","lnr","local nature","nnr","nature reserve","cairngorm","trossach","snowdon","brecon","pembroke"];
      const filtered = (data.services || []).filter(s =>
        keywords.some(k => s.name.toLowerCase().replace(/_/g," ").includes(k))
      );
      return res.status(200).json({ total: data.services.length, filtered });
    }

    // WFS GeoJSON
    if (data.features) {
      const props = data.features[0]?.properties || {};
      return res.status(200).json({ type: "WFS", ok: true, fields: Object.keys(props), sample: props });
    }

    // ArcGIS JSON
    if (data.fields) {
      const fields = data.fields.map(f => f.name);
      const attrs = data.features?.[0]?.attributes || {};
      return res.status(200).json({ type: "ArcGIS", fields, sample: attrs });
    }

    return res.status(200).json({ data });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
