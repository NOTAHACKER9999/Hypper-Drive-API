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
    return res.status(200).end();
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const BASE_URL = `${protocol}://${req.headers.host}`;
  const url = new URL(req.url, BASE_URL);
  const path = url.pathname;

  const isStratus = path.startsWith("/Stratus/api");
  const normalizedPath = isStratus ? path.replace("/Stratus", "") : path;
  const prefix = isStratus ? "/Stratus" : "";

  // 🔥 GLOBAL FLAG (applies everywhere)
  const noIntroMode =
    path.includes("43982") &&
    path.indexOf("43982") < path.indexOf("/api/");

  try {
    // ================= ROOT =================
    if (normalizedPath === "/api" || normalizedPath === "/api/") {
      return res.status(200).json({
        status: "running",
        version: "3.1.0",
        mode: noIntroMode ? "no-intro" : "normal",
        endpoints: [
          `${BASE_URL}${prefix}/api/games`,
          `${BASE_URL}${prefix}/api/games/new`,
          `${BASE_URL}${prefix}/api/recommendations`
        ]
      });
    }

    // ================= GAMES =================
    if (normalizedPath === "/api/games") {
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

      if (sort === "asc") {
        games.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === "desc") {
        games.sort((a, b) => b.name.localeCompare(a.name));
      }

      const perPage = limit && limit > 0 ? limit : games.length;
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const paginated = games.slice(start, end);

      const rewritten = paginated.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = decodeURIComponent(g.url.split("/").pop());

        return {
          ...g,
          cover: `${BASE_URL}${prefix}/api/covers/${coverName}`,
          url: `${BASE_URL}${prefix}/api/html/${htmlName}`
        };
      });

      return res.status(200).json({
        total: original.length,
        returned: rewritten.length,
        page,
        mode: noIntroMode ? "no-intro" : "normal",
        data: rewritten
      });
    }

    // ================= NEWEST =================
    if (normalizedPath === "/api/games/new") {
      const response = await fetch(JSON_SOURCE);
      const original = await response.json();

      const latest = original.slice(-20).reverse();

      const rewritten = latest.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = decodeURIComponent(g.url.split("/").pop());

        return {
          ...g,
          cover: `${BASE_URL}${prefix}/api/covers/${coverName}`,
          url: `${BASE_URL}${prefix}/api/html/${htmlName}`
        };
      });

      return res.status(200).json({
        total: original.length,
        returned: rewritten.length,
        page: 1,
        mode: noIntroMode ? "no-intro" : "normal",
        data: rewritten
      });
    }

    // ================= RECOMMENDATIONS =================
    if (normalizedPath === "/api/recommendations") {
      const response = await fetch(RECO_SOURCE);
      const original = await response.json();

      return res.status(200).json({
        mode: noIntroMode ? "no-intro" : "normal",
        data: original
      });
    }

    // ================= COVERS =================
    if (normalizedPath.startsWith("/api/covers/")) {
      const file = normalizedPath.replace("/api/covers/", "");
      const response = await fetch(ICON_BASE + file);

      if (!response.ok) {
        return res.status(404).json({ error: "Cover not found" });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(buffer);
    }

    // ================= HTML =================
    if (normalizedPath.startsWith("/api/html/")) {
      const file = normalizedPath.replace("/api/html/", "");
      const response = await fetch(HTML_BASE + file);

      if (!response.ok) {
        return res.status(404).send("<h1>Game not found</h1>");
      }

      const gameHTML = await response.text();

      // 🚫 GLOBAL NO INTRO MODE
      if (noIntroMode) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(gameHTML);
      }

      const gifToUse = isStratus ? STRATUS_GIF : INTRO_GIF;
      const introDuration = isStratus ? 3700 : 4000;

      const injectedHTML = `
<script>
(function(){
  const intro = document.createElement("div");
  intro.style.position = "fixed";
  intro.style.top = "0";
  intro.style.left = "0";
  intro.style.width = "100vw";
  intro.style.height = "100vh";
  intro.style.background = "black";
  intro.style.display = "flex";
  intro.style.justifyContent = "center";
  intro.style.alignItems = "center";
  intro.style.zIndex = "999999";

  const img = document.createElement("img");
  img.src = "${gifToUse}";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";

  intro.appendChild(img);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(intro);
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      intro.remove();
    }, ${introDuration});
  });
})();
</script>
${gameHTML}
`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(injectedHTML);
    }

    // ================= BANNERS =================
    if (normalizedPath.startsWith("/api/banners/")) {
      const file = normalizedPath
        .replace("/api/banners/static/", "")
        .replace("/api/banners/animated/", "");

      const response = await fetch(RECO_BASE + file);

      if (!response.ok) {
        return res.status(404).json({ error: "Banner not found" });
      }

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
