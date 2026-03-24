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

function ringsToLeaflet(rings, maxPoints = 300) {
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

function getRings(geometry) {
  if (!geometry) return [];
  if (geometry.rings) return geometry.rings;
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(1);
  return [];
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
  { id:"aonb_en",    outputId:"aonb",   url:`${NE}/Areas_of_Outstanding_Natural_Beauty_England/FeatureServer/0/query`,         nameField:"NAME" },
  { id:"lpo_en",     outputId:"lpo",    url:`${NE}/Limestone_Pavement_Orders_England/FeatureServer/0/query`,                   nameField:"NAME" },
  { id:"cp_en",      outputId:"cp",     url:`${NE}/Country_Parks_England/FeatureServer/0/query`,                               nameField:"NAME" },
  { id:"aw_en",      outputId:"aw",     url:`${NE}/Ancient_Woodland_England/FeatureServer/0/query`,                            nameField:"NAME" },
  { id:"phi_en",     outputId:"phi",    url:`${NE}/Priority_Habitats_Inventory_England/FeatureServer/0/query`,                 nameField:"Main_Habit" },
  { id:"wpp_en",     outputId:"wpp",    url:`${NE}/Wood_Pasture_and_Parkland/FeatureServer/0/query`,                           nameField:"NAME" },
  { id:"to_en",      outputId:"to",     url:`${NE}/Traditional_Orchards_HAP_England/FeatureServer/0/query`,                    nameField:"NAME" },
  { id:"cr_en",      outputId:"cr",     url:`${NE}/Chalk_Rivers_England/FeatureServer/0/query`,                                nameField:"NAME" },
  { id:"nia_en",     outputId:"nia",    url:`${NE}/Nature_Improvement_Areas_England/FeatureServer/0/query`,                    nameField:"NAME" },
  { id:"nca_en",     outputId:"nca",    url:`${NE}/National_Character_Areas_England/FeatureServer/0/query`,                    nameField:"JCANAME" },
  // Scotland
  { id:"sssi_sc",    outputId:"sssi",   url:`${SC}/Sites_of_Special_Scientific_Interest/FeatureServer/0/query`, nameField:"NAME" },
  { id:"sac_sc",     outputId:"sac",    url:`${SC}/SAC_clip/FeatureServer/0/query`,                             nameField:"NAME" },
  { id:"spa_sc",     outputId:"spa",    url:`${SC}/SPA_clip/FeatureServer/0/query`,                             nameField:"NAME" },
  { id:"ramsar_sc",  outputId:"ramsar", url:`${SC}/RAMSAR_Wetlands_of_International_Importance/FeatureServer/0/query`, nameField:"NAME" },
  { id:"nnr_sc",     outputId:"nnr",    url:`${SC}/NNR_WEBSITE_DATA/FeatureServer/0/query`,                     nameField:"NAME" },
  // Wales (WFS)
  { id:"sssi_wa",   outputId:"sssi",   wfs:true, typeName:"inspire-nrw:NRW_SSSI",   nameField:"sssi_name" },
  { id:"sac_wa",    outputId:"sac",    wfs:true, typeName:"inspire-nrw:NRW_SAC",    nameField:"SAC_name" },
  { id:"spa_wa",    outputId:"spa",    wfs:true, typeName:"inspire-nrw:NRW_SPA",    nameField:"SPA_Name" },
  { id:"ramsar_wa", outputId:"ramsar", wfs:true, typeName:"inspire-nrw:NRW_RAMSAR", nameField:"RAM_name" },
  // Northern Ireland
  { id:"assi_ni",   outputId:"sssi",   url:`${NI}/ASSI/FeatureServer/0/query`,   nameField:"NAME" },
  { id:"sac_ni",    outputId:"sac",    url:`${NI}/SAC/FeatureServer/0/query`,    nameField:"NAME" },
  { id:"spa_ni",    outputId:"spa",    url:`${NI}/SPA/FeatureServer/0/query`,    nameField:"NAME" },
  { id:"ramsar_ni", outputId:"ramsar", url:`${NI}/ramsar/FeatureServer/0/query`, nameField:"NAME" },
];

const CORE_IDS = new Set(["sssi","sac","spa","ramsar","nnr","np","lnr"]);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { bbox, layers } = req.query;
  if (!bbox) return res.status(400).json({ error: "bbox required" });

  const [west, south, east, north] = bbox.split(",").map(Number);
  if ([west, south, east, north].some(isNaN)) return res.status(400).json({ error: "Invalid bbox" });

  const requestedIds = layers ? new Set(layers.split(",")) : CORE_IDS;
  const activeSources = SOURCES.filter(s => requestedIds.has(s.outputId));

  const arcgisParams = new URLSearchParams({
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

  await Promise.all(activeSources.map(async source => {
    try {
      let features = [];
      if (source.wfs) {
        const url = `${WALES}?${new URLSearchParams({
          service: "WFS", version: "1.1.0", request: "GetFeature",
          typeName: source.typeName, outputFormat: "application/json",
          srsName: "EPSG:4326", bbox: `${west},${south},${east},${north},EPSG:4326`,
        })}`;
        const r = await fetch(url);
        const data = await r.json();
        features = (data.features || []).map(f => ({
          name: toTitleCase((f.properties[source.nameField] || "Unnamed").trim()),
          rings: ringsToLeaflet(getRings(f.geometry)),
        }));
      } else {
        const r = await fetch(`${source.url}?${arcgisParams}`);
        const data = await r.json();
        features = (data.features || []).map(f => ({
          name: toTitleCase(f.attributes?.[source.nameField] || f.attributes?.NAME || "Unnamed"),
          rings: ringsToLeaflet(getRings(f.geometry)),
        })).filter(f => f.rings);
      }

      if (!results[source.outputId]) results[source.outputId] = [];
      // Deduplicate by name within this outputId
      const seen = new Set(results[source.outputId].map(f => f.name.toLowerCase()));
      for (const f of features) {
        if (f.rings && !seen.has(f.name.toLowerCase())) {
          results[source.outputId].push(f);
          seen.add(f.name.toLowerCase());
        }
      }
    } catch(e) {
      // silently fail - viewport layer is supplementary
    }
  }));

  return res.status(200).json(results);
}
