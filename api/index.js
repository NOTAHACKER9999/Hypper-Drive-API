export const config = {
  runtime: "nodejs"
};

const BASE_URL = "https://hypper-drive-api.vercel.app";

/* =========================
   Utility: Fetch JSON Safe
========================= */
async function safeFetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (err) {
    return null;
  }
}

/* =========================
   Utility: Make All Links Absolute
========================= */
function makeAbsolute(data) {
  if (Array.isArray(data)) {
    return data.map(makeAbsolute);
  }

  if (typeof data === "object" && data !== null) {
    const newObj = {};
    for (const key in data) {
      const value = data[key];

      if (typeof value === "string" && value.startsWith("/")) {
        newObj[key] = BASE_URL + value;
      } else {
        newObj[key] = makeAbsolute(value);
      }
    }
    return newObj;
  }

  return data;
}

/* =========================
   HTML DOCS PAGE
========================= */
function docsHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Hypper Drive API Docs</title>
<style>
body {
  background:#0f0f0f;
  color:#fff;
  font-family:Arial, sans-serif;
  margin:0;
}
header {
  background:#1a1a1a;
  padding:20px;
  text-align:center;
  border-bottom:2px solid red;
}
section {
  padding:20px;
  border-bottom:1px solid #222;
}
h2 {
  color:red;
}
code {
  background:#111;
  padding:4px 8px;
  border-radius:4px;
  display:inline-block;
}
.endpoint {
  margin:10px 0;
  padding:10px;
  background:#161616;
  border-left:4px solid red;
}
</style>
</head>
<body>

<header>
  <h1>Hypper Drive API</h1>
  <p>Base URL: ${BASE_URL}</p>
</header>

<section>
  <h2>Endpoints</h2>

  <div class="endpoint">
    <strong>GET /</strong><br/>
    Basic API info.
  </div>

  <div class="endpoint">
    <strong>GET /docs</strong><br/>
    This documentation page.
  </div>

  <div class="endpoint">
    <strong>GET /api/games</strong><br/>
    Returns all games.
  </div>

  <div class="endpoint">
    <strong>GET /api/games?search=NAME</strong><br/>
    Search games by name.
  </div>

  <div class="endpoint">
    <strong>GET /api/recommendations</strong><br/>
    Returns reco.zone.json formatted data.
  </div>
</section>

<section>
  <h2>Games JSON Structure</h2>
  <code>
{
  "name": "Game Name",
  "icon": "url",
  "banner": "url",
  "url": "game html url"
}
  </code>
</section>

<section>
  <h2>Recommendation JSON Structure</h2>
  <code>
{
  "name": "Hollow Knight",
  "banner-static": "png",
  "banner-vid": "gif",
  "url": "html page"
}
  </code>
</section>

<section>
  <h2>Status</h2>
  <p>API Running ✔</p>
</section>

</body>
</html>
`;
}

/* =========================
   Main Handler
========================= */
export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, BASE_URL);

  /* ROOT */
  if (pathname === "/") {
    return res.status(200).json({
      name: "Hypper Drive API",
      status: "running",
      docs: BASE_URL + "/docs",
      endpoints: [
        BASE_URL + "/api/games",
        BASE_URL + "/api/recommendations"
      ]
    });
  }

  /* DOCS */
  if (pathname === "/docs") {
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(docsHTML());
  }

  /* GAMES */
  if (pathname === "/api/games") {
    const games = await safeFetchJSON(
      "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/games.json"
    );

    if (!games) {
      return res.status(500).json({
        error: "Failed to load games.json"
      });
    }

    const search = searchParams.get("search");

    let result = games;

    if (search) {
      result = games.filter(game =>
        game.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return res.status(200).json(makeAbsolute(result));
  }

  /* RECOMMENDATIONS */
  if (pathname === "/api/recommendations") {
    const reco = await safeFetchJSON(
      "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/Banners/Recommendation/reco.zone.json"
    );

    if (!reco) {
      return res.status(500).json({
        error: "Failed to load reco.zone.json"
      });
    }

    return res.status(200).json(makeAbsolute(reco));
  }

  /* FALLBACK */
  return res.status(404).json({
    error: "Route not found",
    docs: BASE_URL + "/docs"
  });
}
