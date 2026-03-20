export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const response = await fetch(
    "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services?f=json"
  );
  const data = await response.json();
  const filtered = data.services.filter(s => 
    s.name.toLowerCase().includes("sac") || 
    s.name.toLowerCase().includes("possible") ||
    s.name.toLowerCase().includes("candidate")
  );
  return res.status(200).json(filtered);
}
