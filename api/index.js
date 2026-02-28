const JSON_SOURCE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

const ICON_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/ICONS/";

const HTML_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/HTML/";

const RECO_SOURCE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/Banners/Recommendation/reco.zone.json";

const RECO_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/Banners/Recommendation/";

const INTRO_GIF =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Intro.gif";

module.exports = async (req, res) => {

  // ================= CORS =================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const BASE_URL = `${protocol}://${req.headers.host}`;
  const url = new URL(req.url, BASE_URL);
  const path = url.pathname;

  try {

    // ================= ROOT =================
    if (path === "/api" || path === "/api/") {
      res.status(200).json({
        status: "running",
        base: BASE_URL,
        endpoints: [
          `${BASE_URL}/api/games`,
          `${BASE_URL}/api/recommendations`
        ]
      });
      return;
    }

    // ================= GAMES =================
    if (path === "/api/games") {

      const response = await fetch(JSON_SOURCE);
      const original = await response.json();

      const search = url.searchParams.get("search");
      const limit = parseInt(url.searchParams.get("limit"));
      const page = parseInt(url.searchParams.get("page")) || 1;
      const sort = url.searchParams.get("sort");

      let games = [...original];

      if (search) {
        games = games.filter(g =>
          g.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (sort === "asc") games.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === "desc") games.sort((a, b) => b.name.localeCompare(a.name));

      const perPage = limit && limit > 0 ? limit : games.length;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      games = games.slice(start, end);

      const rewritten = games.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = decodeURIComponent(g.url.split("/").pop());

        return {
          name: g.name,
          cover: `${BASE_URL}/api/covers/${coverName}`,
          url: `${BASE_URL}/api/html/${htmlName}`
        };
      });

      res.status(200).json({
        total: original.length,
        returned: rewritten.length,
        page,
        data: rewritten
      });

      return;
    }

    // ================= RECOMMENDATIONS =================
    if (path === "/api/recommendations") {

      const response = await fetch(RECO_SOURCE);
      const original = await response.json();

      const rewritten = original.map(i => {

        const staticFile = i["banner-static"].split("/Recommendation/")[1];
        const animatedFile = i["banner-vid"].split("/Recommendation/")[1];
        const htmlName = decodeURIComponent(i.url.split("/").pop());

        return {
          name: i.name,
          banner_static: `${BASE_URL}/api/banners/static/${staticFile}`,
          banner_animated: `${BASE_URL}/api/banners/animated/${animatedFile}`,
          url: `${BASE_URL}/api/html/${htmlName}`
        };
      });

      res.status(200).json(rewritten);
      return;
    }

    // ================= COVERS =================
    if (path.startsWith("/api/covers/")) {

      const file = path.replace("/api/covers/", "");
      const response = await fetch(ICON_BASE + file);

      if (!response.ok) {
        res.status(404).json({ error: "Cover not found" });
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      res.status(200).send(buffer);
      return;
    }

    // ================= HTML WITH INTRO =================
    if (path.startsWith("/api/html/")) {

      const file = path.replace("/api/html/", "");
      const response = await fetch(HTML_BASE + file);

      if (!response.ok) {
        res.status(404).send("<h1>Game not found</h1>");
        return;
      }

      const gameHTML = await response.text();

      const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Loading...</title>
<style>
html, body { margin:0; padding:0; height:100%; background:black; overflow:hidden; }
#intro { position:fixed; inset:0; display:flex; justify-content:center; align-items:center; background:black; z-index:9999; }
#intro img { width:100%; height:100%; object-fit:contain; }
#gameContainer { display:none; height:100%; width:100%; }
</style>
</head>
<body>

<div id="intro">
  <img src="${INTRO_GIF}">
</div>

<div id="gameContainer">
${gameHTML}
</div>

<script>
setTimeout(() => {
  document.getElementById("intro").remove();
  document.getElementById("gameContainer").style.display = "block";
  document.title = "Game";
}, 4000);
</script>

</body>
</html>
`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(wrappedHTML);
      return;
    }

    // ================= BANNERS =================
    if (path.startsWith("/api/banners/")) {

      const file = path.replace("/api/banners/static/", "")
                       .replace("/api/banners/animated/", "");

      const response = await fetch(RECO_BASE + file);

      if (!response.ok) {
        res.status(404).json({ error: "Banner not found" });
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      res.status(200).send(buffer);
      return;
    }

    // ================= FALLBACK =================
    res.status(404).json({
      error: "Route not found",
      path
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
