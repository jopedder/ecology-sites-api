export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { source = "scot" } = req.query;

  const listUrls = {
    scot: "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services?f=json",
    ni:   "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services?f=json",
  };

  const wfsTests = {
    wales_lnr:  "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_LNR&outputFormat=application/json&count=1&srsName=EPSG:4326",
    wales_nnr:  "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_NNR&outputFormat=application/json&count=1&srsName=EPSG:4326",
    wales_np:   "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_NP&outputFormat=application/json&count=1&srsName=EPSG:4326",
    wales_aonb: "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_AONB&outputFormat=application/json&count=1&srsName=EPSG:4326",
  };

  if (wfsTests[source]) {
    try {
      const r = await fetch(wfsTests[source]);
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { return res.status(200).json({ raw: text.slice(0, 500) }); }
      if (data.features?.length) {
        const props = data.features[0].properties || {};
        return res.status(200).json({ ok: true, fields: Object.keys(props), sample: props });
      }
      return res.status(200).json({ ok: false, data });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  if (listUrls[source]) {
    try {
      const r = await fetch(listUrls[source]);
      const data = await r.json();
      const keywords = ["lnr","local nature","national park","nnr","nature reserve"];
      const filtered = (data.services || []).filter(s =>
        keywords.some(k => s.name.toLowerCase().includes(k))
      );
      return res.status(200).json({ total: data.services?.length, filtered });
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: "unknown source", available: [...Object.keys(listUrls), ...Object.keys(wfsTests)] });
}
