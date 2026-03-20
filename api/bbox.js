function ringsToLeaflet(rings, maxPoints = 300) {
  if (!rings || rings.length === 0) return null;
  return rings.map(ring => {
    const step = Math.max(1, Math.floor(ring.length / maxPoints));
    const simplified = [];
    for (let i = 0; i < ring.length; i += step) {
      simplified.push([ring[i][1], ring[i][0]]);
    }
    const last = ring[ring.length - 1];
    if (simplified[simplified.length - 1][0] !== last[1]) {
      simplified.push([last[1], last[0]]);
    }
    return simplified;
  });
}

const LAYERS = [
  { id: "sssi",   url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SSSI_England/FeatureServer/0/query",                          nameField: "SSSI_NAME" },
  { id: "sac",    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Areas_of_Conservation_England/FeatureServer/0/query", nameField: "SAC_NAME" },
  { id: "spa",    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Protection_Areas_England/FeatureServer/0/query",      nameField: "SPA_NAME" },
  { id: "ramsar", url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ramsar_England/FeatureServer/0/query",                        nameField: "NAME" },
  { id: "nnr",    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/National_Nature_Reserves_England/FeatureServer/0/query",      nameField: "NNR_NAME" },
  { id: "np",     url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/National_Parks_England/FeatureServer/0/query",                nameField: "NAME" },
  { id: "lnr",    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Local_Nature_Reserves_England/FeatureServer/0/query",         nameField: "LNR_NAME" },
];

const KEEP_CAPS = new Set(["SSSI","SAC","SPA","NNR","LNR","NP","AONB","UK","GB"]);
const LOWER_WORDS = new Set(["and","or","of","the","in","on","at","to","a","an","for","by","with","near"]);

function toTitleCase(str) {
  if (!str) return str;
  const upper = str.replace(/[^A-Za-z]/g, "");
  if (!upper || upper !== upper.toUpperCase()) return str;
  return str.toLowerCase().split(" ").map((word, i) => {
    const clean = word.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (KEEP_CAPS.has(clean)) return clean;
    if (i > 0 && LOWER_WORDS.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // bbox = west,south,east,north (WGS84)
  const { bbox } = req.query;
  if (!bbox) return res.status(400).json({ error: "bbox is required" });

  const [west, south, east, north] = bbox.split(",").map(Number);
  if ([west, south, east, north].some(isNaN)) {
    return res.status(400).json({ error: "Invalid bbox" });
  }

  const params = new URLSearchParams({
    geometry: JSON.stringify({ xmin: west, ymin: south, xmax: east, ymax: north }),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "json",
  });

  const results = {};

  await Promise.all(
    LAYERS.map(async (layer) => {
      try {
        const response = await fetch(`${layer.url}?${params}`);
        const data = await response.json();
        const seen = new Set();
        results[layer.id] = (data.features || []).reduce((acc, f) => {
          const a = f.attributes || {};
          const rawName = a[layer.nameField] || a.NAME || a.SITE_NAME || "Unnamed site";
          const name = toTitleCase(rawName);
          if (seen.has(name.toLowerCase())) return acc;
          seen.add(name.toLowerCase());
          const rings = f.geometry ? ringsToLeaflet(f.geometry.rings) : null;
          if (rings) acc.push({ name, rings });
          return acc;
        }, []);
      } catch (e) {
        results[layer.id] = [];
      }
    })
  );

  return res.status(200).json(results);
}
