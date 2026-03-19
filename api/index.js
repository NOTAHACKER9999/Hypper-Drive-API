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

const STRATUS_GIF =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Stratus%20Intro.gif";

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

  const isStratus = path.startsWith("/Stratus/api");
  const normalizedPath = isStratus ? path.replace("/Stratus", "") : path;

  try {
    // ================= ROOT =================
    if (normalizedPath === "/api" || normalizedPath === "/api/") {
      return res.status(200).json({
        status: "running",
        version: "1.0.0",
        endpoints: [
          `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/games`,
          `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/games/new`,
          `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/recommendations`
        ]
      });
    }

    // ================= GAMES =================
    if (normalizedPath === "/api/games") {
      const response = await fetch(JSON_SOURCE);
      const original = await response.json();

      const rewritten = original.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = decodeURIComponent(g.url.split("/").pop());

        return {
          name: g.name,
          cover: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/covers/${coverName}`,
          url: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/html/${htmlName}`
        };
      });

      return res.status(200).json(rewritten);
    }

    // ================= NEWEST GAMES =================
    if (normalizedPath === "/api/games/new") {
      const response = await fetch(JSON_SOURCE);
      const original = await response.json();

      // Get last 20 (newest)
      const latest = original.slice(-20).reverse();

      const rewritten = latest.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = decodeURIComponent(g.url.split("/").pop());

        return {
          name: g.name,
          cover: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/covers/${coverName}`,
          url: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/html/${htmlName}`
        };
      });

      return res.status(200).json(rewritten);
    }

    // ================= RECOMMENDATIONS =================
    if (normalizedPath === "/api/recommendations") {
      const response = await fetch(RECO_SOURCE);
      const original = await response.json();

      const rewritten = original.map(i => {
        const staticFile = i["banner-static"].split("/Recommendation/")[1];
        const animatedFile = i["banner-vid"].split("/Recommendation/")[1];
        const htmlName = decodeURIComponent(i.url.split("/").pop());

        return {
          name: i.name,
          banner_static: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/banners/static/${staticFile}`,
          banner_animated: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/banners/animated/${animatedFile}`,
          url: `${BASE_URL}${isStratus ? "/Stratus" : ""}/api/html/${htmlName}`
        };
      });

      return res.status(200).json(rewritten);
    }

    // ================= COVERS =================
    if (normalizedPath.startsWith("/api/covers/")) {
      const file = normalizedPath.replace("/api/covers/", "");
      const response = await fetch(ICON_BASE + file);

      if (!response.ok) return res.status(404).json({ error: "Cover not found" });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(buffer);
    }

    // ================= HTML (NO PROXY EFFECT ON CONTENT) =================
    if (normalizedPath.startsWith("/api/html/")) {
      const file = normalizedPath.replace("/api/html/", "");
      const response = await fetch(HTML_BASE + file);

      if (!response.ok) return res.status(404).send("<h1>Game not found</h1>");

      // IMPORTANT: send raw HTML directly (no injection, no rewriting)
      const gameHTML = await response.text();

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(gameHTML);
    }

    // ================= BANNERS =================
    if (normalizedPath.startsWith("/api/banners/")) {
      const file = normalizedPath
        .replace("/api/banners/static/", "")
        .replace("/api/banners/animated/", "");

      const response = await fetch(RECO_BASE + file);

      if (!response.ok) return res.status(404).json({ error: "Banner not found" });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(buffer);
    }

    // ================= FALLBACK =================
    return res.status(404).json({ error: "Route not found", path });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
