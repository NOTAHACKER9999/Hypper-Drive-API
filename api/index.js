export const config = {
  runtime: "nodejs"
};

/* ===============================
   CONFIG: GitHub JSON Locations
================================ */
const GAMES_JSON_URL =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/main/Games/games.json";

const RECO_JSON_URL =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/main/Games/Banners/Recommendation/reco.zone.json";

/* ===============================
   Utility: Get Dynamic Base URL
================================ */
function getBaseURL(req) {
  const protocol =
    req.headers["x-forwarded-proto"] ||
    (req.connection && req.connection.encrypted ? "https" : "http");

  const host = req.headers.host;
  return `${protocol}://${host}`;
}

/* ===============================
   Safe JSON Fetch
================================ */
async function fetchJSON(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "HypperDriveAPI" }
    });

    if (!response.ok) {
      return {
        error: true,
        status: response.status,
        statusText: response.statusText
      };
    }

    const text = await response.text();

    if (!text || text.trim() === "") {
      return { error: true, message: "Empty response body" };
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      return {
        error: true,
        message: "Invalid JSON",
        preview: text.substring(0, 500)
      };
    }
  } catch (err) {
    return {
      error: true,
      message: err.message
    };
  }
}

/* ===============================
   Convert Relative Paths
================================ */
function makeAbsolute(obj, baseURL) {
  if (Array.isArray(obj)) {
    return obj.map(item => makeAbsolute(item, baseURL));
  }

  if (obj && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string" && value.startsWith("/")) {
        newObj[key] = baseURL + value;
      } else {
        newObj[key] = makeAbsolute(value, baseURL);
      }
    }
    return newObj;
  }

  return obj;
}

/* ===============================
   Render Docs Page
================================ */
function renderDocs(baseURL) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Hypper Drive API Docs</title>
<style>
body { background:#0f0f0f; color:#fff; font-family:Arial; margin:0; }
header { background:#1a1a1a; padding:20px; border-bottom:2px solid red; }
section { padding:20px; border-bottom:1px solid #222; }
h1,h2 { color:red; }
code { background:#111; padding:6px 10px; display:block; margin:10px 0; }
.endpoint { margin-bottom:15px; padding:10px; background:#161616; border-left:4px solid red; }
</style>
</head>
<body>

<header>
<h1>Hypper Drive API</h1>
<p>Base URL: ${baseURL}</p>
</header>

<section>
<h2>Endpoints</h2>

<div class="endpoint">
GET /
<code>Returns API status.</code>
</div>

<div class="endpoint">
GET /docs
<code>API documentation page.</code>
</div>

<div class="endpoint">
GET /api/games
<code>Returns all games.</code>
</div>

<div class="endpoint">
GET /api/games?search=name
<code>Search games by name.</code>
</div>

<div class="endpoint">
GET /api/recommendations
<code>Returns recommendation banners.</code>
</div>

</section>

<section>
<h2>Games JSON Structure</h2>
<code>
[
  {
    "name": "Game Name",
    "icon": "icon-url",
    "banner": "banner-url",
    "url": "game-html-url"
  }
]
</code>
</section>

<section>
<h2>Status</h2>
<p>Operational</p>
</section>

</body>
</html>
`;
}

/* ===============================
   MAIN HANDLER
================================ */
export default async function handler(req, res) {
  const baseURL = getBaseURL(req);
  const url = new URL(req.url, baseURL);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  /* ROOT */
  if (pathname === "/") {
    return res.status(200).json({
      name: "Hypper Drive API",
      status: "running",
      docs: `${baseURL}/docs`,
      endpoints: {
        games: `${baseURL}/api/games`,
        recommendations: `${baseURL}/api/recommendations`
      }
    });
  }

  /* DOCS */
  if (pathname === "/docs") {
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(renderDocs(baseURL));
  }

  /* GAMES */
  if (pathname === "/api/games") {
    const data = await fetchJSON(GAMES_JSON_URL);

    if (data.error) {
      return res.status(500).json({
        error: "Failed to load games.json",
        debug: data
      });
    }

    let games = data;

    const search = searchParams.get("search");
    if (search) {
      games = games.filter(game =>
        game.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return res.status(200).json(makeAbsolute(games, baseURL));
  }

  /* RECOMMENDATIONS */
  if (pathname === "/api/recommendations") {
    const data = await fetchJSON(RECO_JSON_URL);

    if (data.error) {
      return res.status(500).json({
        error: "Failed to load reco.zone.json",
        debug: data
      });
    }

    return res.status(200).json(makeAbsolute(data, baseURL));
  }

  /* 404 */
  return res.status(404).json({
    error: "Route not found",
    availableRoutes: [
      `${baseURL}/`,
      `${baseURL}/docs`,
      `${baseURL}/api/games`,
      `${baseURL}/api/recommendations`
    ]
  });
}
