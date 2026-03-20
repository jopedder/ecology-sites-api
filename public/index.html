const toRad = d => (d * Math.PI) / 180;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegmentM(pLat, pLng, a, b) {
  const aLat = a[1], aLng = a[0];
  const bLat = b[1], bLng = b[0];
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 0) {
    t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }
  const closestLng = aLng + t * dx;
  const closestLat = aLat + t * dy;
  return haversine(pLat, pLng, closestLat, closestLng);
}

function distToGeometry(searchLat, searchLng, geometry) {
  if (!geometry) return null;
  const rings = geometry.rings || [];
  if (rings.length === 0) return null;
  for (const ring of rings) {
    if (ring.length < 3) continue;
    if (pointInRing(searchLng, searchLat, ring)) return 0;
  }
  let minDist = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const d = distToSegmentM(searchLat, searchLng, ring[i], ring[i + 1]);
      if (d < minDist) minDist = d;
    }
  }
  return minDist === Infinity ? null : minDist;
}

function ringsToLeaflet(rings, maxPoints = 500) {
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

// Abbreviations that should stay in full caps
const KEEP_CAPS = new Set([
  "SSSI", "SAC", "SPA", "NNR", "LNR", "NP", "AONB",
  "UK", "GB", "ES", "NFU", "RSPB", "MOD", "RAF",
  "II", "III", "IV", "VI", "VII", "VIII", "IX", "XI",
]);

// Words that should be lowercase unless first word
const LOWER_WORDS = new Set([
  "and", "or", "of", "the", "in", "on", "at", "to",
  "a", "an", "for", "by", "with", "near", "de", "le",
]);

function toTitleCase(str) {
  if (!str) return str;
  // If not all caps / mixed already, return as-is
  const upper = str.replace(/[^A-Za-z]/g, "");
  if (upper.length === 0) return str;
  const isAllCaps = upper === upper.toUpperCase();
  if (!isAllCaps) return str; // already mixed case, don't touch

  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      const clean = word.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (KEEP_CAPS.has(clean)) return clean;
      if (i > 0 && LOWER_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
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
    id: "ramsar",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ramsar_England/FeatureServer/0/query",
    nameField: "NAME",
    descFields: ["REASON", "CRITERIA", "RAMSAR_CRITERIA", "CITATION"],
  },
  {
    id: "nnr",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/National_Nature_Reserves_England/FeatureServer/0/query",
    nameField: "NNR_NAME",
    descFields: ["REASON", "DESCRIPTION", "DESIGNATION_REASON"],
  },
  {
    id: "np",
    url: "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/National_Parks_England/FeatureServer/0/query",
    nameField: "NAME",
    descFields: ["DESCRIPTION", "REASON"],
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
      return toTitleCase(firstSentence.trim() + (firstSentence.endsWith(".") ? "" : "."));
    }
  }
  return null;
}

function deduplicateByName(features) {
  const seen = new Map();
  for (const f of features) {
    const key = f.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, f);
    } else {
      const existing = seen.get(key);
      if (f.distanceM != null && (existing.distanceM == null || f.distanceM < existing.distanceM)) {
        seen.set(key, f);
      }
    }
  }
  return Array.from(seen.values());
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

        const features = (data.features || []).map((f) => {
          const a = f.attributes || {};
          const rawName = a[layer.nameField] || a.NAME || a.SITE_NAME || "Unnamed site";
          const name = toTitleCase(rawName);
          const status = a.STATUS || a.CATEGORY || "";
          const description = extractDesc(a, layer.descFields);
          const rawDist = distToGeometry(searchLat, searchLng, f.geometry);
          const distanceM = rawDist !== null ? Math.round(rawDist) : null;
          const rings = f.geometry ? ringsToLeaflet(f.geometry.rings) : null;
          return { name, status, description, distanceM, rings };
        });

        features.sort((a, b) => {
          if (a.distanceM == null) return 1;
          if (b.distanceM == null) return -1;
          return a.distanceM - b.distanceM;
        });

        results[layer.id] = deduplicateByName(features);

      } catch (e) {
        results[layer.id] = [];
      }
    })
  );

  return res.status(200).json(results);
}
