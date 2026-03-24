const toRad = d => d * Math.PI / 180;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function distToSegmentM(pLat, pLng, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx*dx + dy*dy;
  let t = lenSq > 0 ? Math.max(0, Math.min(1, ((pLng - a[0])*dx + (pLat - a[1])*dy) / lenSq)) : 0;
  return haversine(pLat, pLng, a[1] + t*dy, a[0] + t*dx);
}

// Normalize ArcGIS rings or GeoJSON coordinates to array of [[lng,lat],...] rings
function getRings(geometry) {
  if (!geometry) return [];
  if (geometry.rings) return geometry.rings;
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(1);
  return [];
}

function distToGeometry(searchLat, searchLng, geometry) {
  const rings = getRings(geometry);
  if (!rings.length) return null;
  for (const ring of rings) {
    if (ring.length >= 3 && pointInRing(searchLng, searchLat, ring)) return 0;
  }
  let minDist = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const d = distToSegmentM(searchLat, searchLng, ring[i], ring[i+1]);
      if (d < minDist) minDist = d;
    }
  }
  return minDist === Infinity ? null : minDist;
}

function ringsToLeaflet(rings, maxPoints = 500) {
  if (!rings?.length) return null;
  return rings.map(ring => {
    const step = Math.max(1, Math.floor(ring.length / maxPoints));
    const out = [];
    for (let i = 0; i < ring.length; i += step) out.push([ring[i][1], ring[i][0]]);
    const last = ring[ring.length - 1];
    if (out[out.length-1][0] !== last[1]) out.push([last[1], last[0]]);
    return out;
  });
}

const KEEP_CAPS = new Set(["SSSI","SAC","SPA","NNR","LNR","NP","AONB","UK","GB","ASSI"]);
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

function deduplicateByName(features) {
  const seen = new Map();
  for (const f of features) {
    const key = f.name.trim().toLowerCase();
    if (!seen.has(key) || (f.distanceM != null && (seen.get(key).distanceM == null || f.distanceM < seen.get(key).distanceM))) {
      seen.set(key, f);
    }
  }
  return Array.from(seen.values());
}

const NE = "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services";
const SC = "https://services1.arcgis.com/LM9GyVFsughzHdbO/arcgis/rest/services";
const NI = "https://services-eu1.arcgis.com/d5l49Upuvx1Y6xxs/arcgis/rest/services";
const WALES = "https://datamap.gov.wales/geoserver/inspire-nrw/ows";

const SOURCES = [
  // England core
  { id:"sssi_en",    outputId:"sssi",   url:`${NE}/SSSI_England/FeatureServer/0/query`,                          nameField:"SSSI_NAME" },
  { id:"sac_en",     outputId:"sac",    url:`${NE}/Special_Areas_of_Conservation_England/FeatureServer/0/query`, nameField:"SAC_NAME" },
  { id:"spa_en",     outputId:"spa",    url:`${NE}/Special_Protection_Areas_England/FeatureServer/0/query`,      nameField:"SPA_NAME" },
  { id:"ramsar_en",  outputId:"ramsar", url:`${NE}/Ramsar_England/FeatureServer/0/query`,                        nameField:"NAME" },
  { id:"nnr_en",     outputId:"nnr",    url:`${NE}/National_Nature_Reserves_England/FeatureServer/0/query`,      nameField:"NNR_NAME" },
  { id:"np_en",      outputId:"np",     url:`${NE}/National_Parks_England/FeatureServer/0/query`,                nameField:"NAME" },
  { id:"lnr_en",     outputId:"lnr",    url:`${NE}/Local_Nature_Reserves_England/FeatureServer/0/query`,         nameField:"LNR_NAME" },
  // England optional
  { id:"aonb_en",    outputId:"aonb",   url:`${NE}/Areas_of_Outstanding_Natural_Beauty_England/FeatureServer/0/query`,  nameField:"NAME" },
  { id:"lpo_en",     outputId:"lpo",    url:`${NE}/Limestone_Pavement_Orders_England/FeatureServer/0/query`,            nameField:"NAME" },
  { id:"cp_en",      outputId:"cp",     url:`${NE}/Country_Parks_England/FeatureServer/0/query`,                        nameField:"NAME" },
  { id:"aw_en",      outputId:"aw",     url:`${NE}/Ancient_Woodland_England/FeatureServer/0/query`,                     nameField:"NAME" },
  { id:"phi_en",     outputId:"phi",    url:`${NE}/Priority_Habitats_Inventory_England/FeatureServer/0/query`,          nameField:"Main_Habit" },
  { id:"wpp_en",     outputId:"wpp",    url:`${NE}/Wood_Pasture_and_Parkland/FeatureServer/0/query`,                    nameField:"NAME" },
  { id:"to_en",      outputId:"to",     url:`${NE}/Traditional_Orchards_HAP_England/FeatureServer/0/query`,             nameField:"NAME" },
  { id:"cr_en",      outputId:"cr",     url:`${NE}/Chalk_Rivers_England/FeatureServer/0/query`,                         nameField:"NAME" },
  { id:"nia_en",     outputId:"nia",    url:`${NE}/Nature_Improvement_Areas_England/FeatureServer/0/query`,             nameField:"NAME" },
  { id:"nca_en",     outputId:"nca",    url:`${NE}/National_Character_Areas_England/FeatureServer/0/query`,             nameField:"JCANAME" },
  // Scotland
  { id:"sssi_sc",    outputId:"sssi",   url:`${SC}/Sites_of_Special_Scientific_Interest/FeatureServer/0/query`, nameField:"NAME" },
  { id:"sac_sc",     outputId:"sac",    url:`${SC}/SAC_clip/FeatureServer/0/query`,                             nameField:"NAME" },
  { id:"spa_sc",     outputId:"spa",    url:`${SC}/SPA_clip/FeatureServer/0/query`,                             nameField:"NAME" },
  { id:"ramsar_sc",  outputId:"ramsar", url:`${SC}/RAMSAR_Wetlands_of_International_Importance/FeatureServer/0/query`, nameField:"NAME" },
  { id:"nnr_sc",     outputId:"nnr",    url:`${SC}/NNR_WEBSITE_DATA/FeatureServer/0/query`,                     nameField:"NAME" },
  // Wales (WFS/GeoServer)
  { id:"sssi_wa",   outputId:"sssi",   wfs:true, typeName:"inspire-nrw:NRW_SSSI",   nameField:"sssi_name" },
  { id:"sac_wa",    outputId:"sac",    wfs:true, typeName:"inspire-nrw:NRW_SAC",    nameField:"SAC_name" },
  { id:"spa_wa",    outputId:"spa",    wfs:true, typeName:"inspire-nrw:NRW_SPA",    nameField:"SPA_Name" },
  { id:"ramsar_wa", outputId:"ramsar", wfs:true, typeName:"inspire-nrw:NRW_RAMSAR", nameField:"RAM_name" },
  // Northern Ireland (NI ASSI maps to sssi outputId)
  { id:"assi_ni",   outputId:"sssi",   url:`${NI}/ASSI/FeatureServer/0/query`,   nameField:"NAME" },
  { id:"sac_ni",    outputId:"sac",    url:`${NI}/SAC/FeatureServer/0/query`,    nameField:"NAME" },
  { id:"spa_ni",    outputId:"spa",    url:`${NI}/SPA/FeatureServer/0/query`,    nameField:"NAME" },
  { id:"ramsar_ni", outputId:"ramsar", url:`${NI}/ramsar/FeatureServer/0/query`, nameField:"NAME" },
];

const CORE_IDS = new Set(["sssi","sac","spa","ramsar","nnr","np","lnr"]);

async function queryArcGIS(source, searchLat, searchLng, radius) {
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
  const r = await fetch(`${source.url}?${params}`);
  const data = await r.json();
  return (data.features || []).map(f => {
    const a = f.attributes || {};
    const name = toTitleCase(a[source.nameField] || a.NAME || a.SITE_NAME || "Unnamed site");
    const rawDist = distToGeometry(searchLat, searchLng, f.geometry);
    const distanceM = rawDist != null ? Math.round(rawDist) : null;
    const rings = ringsToLeaflet(getRings(f.geometry));
    return { name, distanceM, rings };
  });
}

async function queryWFS(source, searchLat, searchLng, radius) {
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos(toRad(searchLat)));
  const bbox = `${searchLng - lngDelta},${searchLat - latDelta},${searchLng + lngDelta},${searchLat + latDelta},EPSG:4326`;
  const url = `${WALES}?${new URLSearchParams({
    service: "WFS", version: "1.1.0", request: "GetFeature",
    typeName: source.typeName, outputFormat: "application/json",
    srsName: "EPSG:4326", bbox,
  })}`;
  const r = await fetch(url);
  const data = await r.json();
  return (data.features || []).map(f => {
    const name = toTitleCase((f.properties[source.nameField] || "Unnamed site").trim());
    const rawDist = distToGeometry(searchLat, searchLng, f.geometry);
    const distanceM = rawDist != null ? Math.round(rawDist) : null;
    const rings = ringsToLeaflet(getRings(f.geometry));
    return { name, distanceM, rings };
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { lat, lng, radius = 1000, layers } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  const searchLat = parseFloat(lat), searchLng = parseFloat(lng);
  const radiusM = parseInt(radius);
  const requestedIds = layers ? new Set(layers.split(",")) : CORE_IDS;
  const activeSources = SOURCES.filter(s => requestedIds.has(s.outputId));

  const sourceResults = await Promise.all(activeSources.map(async source => {
    try {
      return source.wfs
        ? await queryWFS(source, searchLat, searchLng, radiusM)
        : await queryArcGIS(source, searchLat, searchLng, radiusM);
    } catch(e) { return []; }
  }));

  // Aggregate by outputId
  const buckets = {};
  activeSources.forEach((source, i) => {
    if (!buckets[source.outputId]) buckets[source.outputId] = [];
    buckets[source.outputId].push(...sourceResults[i]);
  });

  const results = {};
  for (const id of requestedIds) {
    const features = buckets[id] || [];
    features.sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
    results[id] = deduplicateByName(features);
  }

  return res.status(200).json(results);
}
