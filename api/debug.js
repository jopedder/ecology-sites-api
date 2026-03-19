export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const url = "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SPA_England/FeatureServer/0/query?" + new URLSearchParams({
    geometry: JSON.stringify({ x: -1.62863, y: 53.30666 }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: "5000",
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });
  const response = await fetch(url);
  const data = await response.json();
  return res.status(200).json(data);
}
