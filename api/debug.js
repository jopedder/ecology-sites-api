export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const response = await fetch(
    "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Areas_of_Conservation_England/FeatureServer/0/query?"
  );
  const data = await response.json();
  return res.status(200).json(data);
}
