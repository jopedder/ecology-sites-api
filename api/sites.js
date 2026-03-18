export default async function handler(req, res) {
  // Allow the Claude artifact to call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { lat, lng, radius = 1000 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const LAYERS = [
    {
      id: "sssi",
      url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SSSI_England/FeatureServer/0/query",
      nameField: "SSSI_NAME",
    },
    {
      id: "sac",
      url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SAC_England/FeatureServer/0/query",
      nameField: "SAC_NAME",
    },
    {
      id: "spa",
      url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SPA_England/FeatureServer/0/query",
      nameField: "SPA_NAME",
    },
    {
      id: "ramsar",
      url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ramsar_England/FeatureServer/0/query",
      nameField: "NAME",
    },
    {
      id: "lnr",
      url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Local_Nature_Reserves_England/FeatureServer/0/query",
      nameField: "LNR_NAME",
    },
  ];

  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: parseFloat(lng), y: parseFloat(lat) }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(radius),
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });

  const results = {};

  await Promise.all(
    LAYERS.map(async (layer) => {
      try {
        const response = await fetch(`${layer.url}?${params}`);
        const data = await response.json();
        results[layer.id] = (data.features || []).map((f) => {
          const a = f.attributes || {};
          return {
            name: a[layer.nameField] || a.NAME || a.SITE_NAME || "Unnamed site",
            status: a.STATUS || a.CATEGORY || "",
          };
        });
      } catch (e) {
        results[layer.id] = [];
      }
    })
  );

  return res.status(200).json(results);
}
