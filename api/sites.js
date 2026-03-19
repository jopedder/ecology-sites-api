function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const LAYERS = [
  {
    id: "sssi",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SSSI_England/FeatureServer/0/query",
    nameField: "SSSI_NAME",
    descFields: ["NOTIFIED_FEATURES", "REASON", "FEATURES", "DESIGNATION_REASON"],
  },
  {
    id: "sac",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Areas_of_Conservation_England/FeatureServer/0/query",
    nameField: "SAC_NAME",
    descFields: ["QUALIFYING_HABITATS", "REASON", "QUALIFYING_FEATURES", "CITATION"],
  },
  {
    id: "spa",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Protection_Areas_England/FeatureServer/0/query",
    nameField: "SPA_NAME",
    descFields: ["QUALIFYING_SPECIES", "REASON", "QUALIFYING_FEATURES", "CITATION"],
  },
  {
    id: "pspa",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Potential_Special_Protection_Areas_England/FeatureServer/0/query",
    nameField: "SPA_NAME",
    descFields: ["QUALIFYING_SPECIES", "REASON", "QUALIFYING_FEATURES"],
  },
  {
    id: "ramsar",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ramsar_England/FeatureServer/0/query",
    nameField: "NAME",
    descFields: ["REASON", "CRITERIA", "RAMSAR_CRITERIA", "CITATION"],
  },
  {
    id: "lnr",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Local_Nature_Reserves_England/FeatureServer/0/query",
    nameField: "LNR_NAME",
    descFields: ["REASON", "DESCRIPTION", "LNR_DESC", "DESIGNATION_REASON"],
  },
];

function extractDesc(attrs, descFields) {
  for (const f of descFields) {
    const val = attrs[f];
    if (val && typeof val === "string" && val.trim().length > 0) {
      const firstSentence = val.split(/\.(\s|$)/)[0];
      return firstSentence.trim() + (firstSentence.endsWith(".") ? "" : ".");
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { lat, lng, radius = 1000 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const searchLat = parseFloat(lat);
  const searchLng = parseFloat(lng);

  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: searchLng, y: searchLat }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(radius),
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "false",
    returnCentroid: "true",
    outSR: "4326",
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
          const name = a[layer.nameField] || a.NAME || a.SITE_NAME || "Unnamed site";
          const status = a.STATUS || a.CATEGORY || "";
          const description = extractDesc(a, layer.descFields);
          let distanceM = null;
          if (f.centroid && f.centroid.x != null && f.centroid.y != null) {
            distanceM = haversine(searchLat, searchLng, f.centroid.y, f.centroid.x);
          }
          return { name, status, description, distanceM };
        });

        results[layer.id].sort((a, b) => {
          if (a.distanceM == null) return 1;
          if (b.distanceM == null) return -1;
          return a.distanceM - b.distanceM;
        });

      } catch (e) {
        results[layer.id] = [];
      }
    })
  );

  return res.status(200).json(results);
}
