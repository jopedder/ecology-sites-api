export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { source = "wales_sssi" } = req.query;

  const targets = {
    wales_sssi:   "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_SSSI&outputFormat=application/json&count=2&srsName=EPSG:4326",
    wales_sac:    "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_SAC&outputFormat=application/json&count=2&srsName=EPSG:4326",
    wales_spa:    "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_SPA&outputFormat=application/json&count=2&srsName=EPSG:4326",
    wales_ramsar: "https://datamap.gov.wales/geoserver/inspire-nrw/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=inspire-nrw:NRW_RAMSAR&outputFormat=application/json&count=2&srsName=EPSG:4326",
    scot_sssi:    "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/Sites_of_Special_Scientific_Interest/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_sac:     "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/SAC_clip/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_spa:     "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/SPA_clip/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_ramsar:  "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/RAMSAR_Wetlands_of_International_Importance/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    scot_nnr:     "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services/NNR_WEBSITE_DATA/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_assi:      "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/ASSI/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_sac:       "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/SAC/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_spa:       "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/SPA/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
    ni_ramsar:    "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services/ramsar/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=1&outSR=4326&f=json",
  };

  const url = targets[source];
  if (!url) return res.status(400).json({ error: "unknown source", available: Object.keys(targets) });

  try {
    const r = await fetch(url);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { return res.status(200).json({ raw: text.slice(0, 2000) }); }

    if (data.features) {
      const props = data.features[0]?.properties || data.features[0]?.attributes || {};
      return res.status(200).json({ type: data.fields ? "ArcGIS" : "WFS", fields: Object.keys(props), sample: props });
    }
    if (data.fields) {
      return res.status(200).json({ type: "ArcGIS", fields: data.fields.map(f => f.name), sample: {} });
    }
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
