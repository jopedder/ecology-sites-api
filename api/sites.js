// Haversine distance in metres between two WGS84 points
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
    // Fields to try for description, in priority order — from NE ArcGIS schema
    descFields: ["NOTIFIED_FEATURES", "REASON", "FEATURES", "DESIGNATION_REASON"],
    linkField: "HYPERLINK",
  },
  {
    id: "sac",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SAC_England/FeatureServer/0/query",
    nameField: "SAC_NAME",
    descFields: ["QUALIFYING_HABITATS", "REASON", "QUALIFYING_FEATURES", "CITATION"],
    linkField: "HYPERLINK",
  },
  {
    id: "spa",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SPA_England/FeatureServer/0/query",
    nameField: "SPA_NAME",
    descFields: ["QUALIFYING_SPECIES", "REASON", "QUALIFYING_FEATURES", "CITATION"],
    linkField: "HYPERLINK",
  },
  {
    id: "ramsar",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ramsar_England/FeatureServer/0/query",
    nameField: "NAME",
    descFields: ["REASON", "CRITERIA", "RAMSAR_CRITERIA", "CITATION"],
    linkField: "HYPERLINK",
  },
  {
    id: "lnr",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Local_Nature_Reserves_England/FeatureServer/0/query",
    nameField: "LNR_NAME",
    descFields: ["REASON", "DESCRIPTION", "LNR_DESC", "DESIGNATION_REASON"],
    linkField: "HYPERLINK",
  },
];

function extractDesc(attrs, descFields) {
  for (const f of descFields) {
    const val = attrs[f];
    if (val && typeof val === "string" && val.trim().length > 0) {
      // Truncate to a single sentence — take text up to the first full stop
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
    returnCentroid: "true",   // returns centroid of each polygon
    outSR: "4326",            // centroid coords in WGS84
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

          // Name
          const name =
            a[layer.nameField] || a.NAME || a.SITE_NAME || "Unnamed site";

          // Status
          const status = a.STATUS || a.CATEGORY || "";

          // Description — only from actual API fields, never invented
          const description = extractDesc(a, layer.descFields);

          // Distance — from centroid if available
          let distanceM = null;
          if (f.centroid && f.centroid.x != null && f.centroid.y != null) {
            distanceM = haversine(searchLat, searchLng, f.centroid.y, f.centroid.x);
          }

          // Government link — from HYPERLINK field in NE data
          const link = a[layer.linkField] || null;

          return { name, status, description, distanceM, link };
        });

        // Sort by distance if available
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

