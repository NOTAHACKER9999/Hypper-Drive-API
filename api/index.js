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

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const BASE_URL = `${protocol}://${req.headers.host}`;
  const url = new URL(req.url, BASE_URL);
  const path = url.pathname;

  try {

    // ================= ROOT =================
    if (path === "/api" || path === "/api/") {
      return res.status(200).json({
        status: "running",
        version: "1.0.0",
        documentation: `${BASE_URL}/api/docs`,
        endpoints: [
          `${BASE_URL}/api/games`,
          `${BASE_URL}/api/recommendations`
        ]
      });
    }

    // ================= DOCS JSON =================
    if (path === "/api/docs/json") {
      return res.status(200).json({
        name: "Hypper Drive Game API",
        version: "1.0.0",
        base: BASE_URL,
        endpoints: {
          "/api/games": {
            method: "GET",
            description: "Returns all games",
            query: {
              search: "Filter games by name",
              sort: "asc | desc",
              page: "Page number",
              limit: "Results per page"
            }
          },
          "/api/recommendations": {
            method: "GET",
            description: "Returns recommended banner games"
          },
          "/api/covers/:file": {
            method: "GET",
            description: "Returns a game cover image"
          },
          "/api/html/:file": {
            method: "GET",
            description: "Returns game HTML wrapped with intro animation"
          },
          "/api/banners/static/:file": {
            method: "GET",
            description: "Returns static recommendation banner"
          },
          "/api/banners/animated/:file": {
            method: "GET",
            description: "Returns animated recommendation banner"
          }
        }
      });
    }

    // ================= DOCS PAGE =================
    if (path === "/api/docs") {

      const docsHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Hypper Drive API Docs</title>
<style>
body { font-family: Arial; background:#0f1117; color:#e6edf3; margin:40px; }
h1 { color:#ff3c3c; }
h2 { margin-top:40px; color:#58a6ff; }
h3 { margin-bottom:10px; }
code { background:#161b22; padding:4px 8px; border-radius:6px; display:inline-block; margin-top:5px; }
a { color:#58a6ff; text-decoration:none; }
.endpoint { background:#161b22; padding:20px; border-radius:10px; margin-top:20px; }
</style>
</head>
<body>

<h1>Hypper Drive Game API</h1>
<p><strong>Base URL:</strong> ${BASE_URL}</p>

<h2>Available Endpoints</h2>

<div class="endpoint">
<h3>GET /api/games</h3>
<p>Returns all games.</p>
<ul>
<li><code>?search=</code> Filter by name</li>
<li><code>?sort=asc|desc</code> Sort alphabetically</li>
<li><code>?page=</code> Pagination page</li>
<li><code>?limit=</code> Items per page</li>
</ul>
<code>${BASE_URL}/api/games?search=car&sort=asc&page=1&limit=5</code>
</div>

<div class="endpoint">
<h3>GET /api/recommendations</h3>
<p>Returns recommended banner games.</p>
<code>${BASE_URL}/api/recommendations</code>
</div>

<div class="endpoint">
<h3>GET /api/covers/:file</h3>
<p>Returns a cover image file.</p>
</div>

<div class="endpoint">
<h3>GET /api/html/:file</h3>
<p>Returns playable game HTML wrapped with intro animation.</p>
</div>

<div class="endpoint">
<h3>GET /api/banners/static/:file</h3>
<p>Returns static recommendation banner.</p>
</div>

<div class="endpoint">
<h3>GET /api/banners/animated/:file</h3>
<p>Returns animated recommendation banner.</p>
</div>

<h2>Machine Readable Documentation</h2>
<p><a href="${BASE_URL}/api/docs/json">View JSON Documentation</a></p>

</body>
</html>
`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(docsHTML);
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

      return res.status(200).json({
        total: original.length,
        returned: rewritten.length,
        page,
        data: rewritten
      });
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

      return res.status(200).json(rewritten);
    }

    // ================= COVERS =================
    if (path.startsWith("/api/covers/")) {

      const file = path.replace("/api/covers/", "");
      const response = await fetch(ICON_BASE + file);

      if (!response.ok)
        return res.status(404).json({ error: "Cover not found" });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(buffer);
    }

    // ================= HTML WITH INTRO =================
    if (path.startsWith("/api/html/")) {

      const file = path.replace("/api/html/", "");
      const response = await fetch(HTML_BASE + file);

      if (!response.ok)
        return res.status(404).send("<h1>Game not found</h1>");

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
      return res.status(200).send(wrappedHTML);
    }

    // ================= BANNERS =================
    if (path.startsWith("/api/banners/")) {

      const file = path
        .replace("/api/banners/static/", "")
        .replace("/api/banners/animated/", "");

      const response = await fetch(RECO_BASE + file);

      if (!response.ok)
        return res.status(404).json({ error: "Banner not found" });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(buffer);
    }

    // ================= FALLBACK =================
    return res.status(404).json({
      error: "Route not found",
      path
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
