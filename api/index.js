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

module.exports = async (req, res) => {
  // ---------------- CORS ----------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // ---------------- ROOT ----------------
    if (path === "/api" || path === "/api/") {
      res.status(200).send("Game API Running");
      return;
    }

    // ---------------- GAMES ----------------
    if (path === "/api/games") {
      const response = await fetch(JSON_SOURCE);
      if (!response.ok) {
        res.status(500).send("Failed to fetch games JSON");
        return;
      }

      const original = await response.json();
      const search = url.searchParams.get("search");
      const limit = parseInt(url.searchParams.get("limit"));
      const page = parseInt(url.searchParams.get("page")) || 1;
      const sort = url.searchParams.get("sort");
      const raw = url.searchParams.get("raw");

      let games = [...original];

      if (raw === "true") {
        res.status(200).json(games);
        return;
      }

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
          cover: `/api/covers/${coverName}`,
          url: `/api/html/${htmlName}`
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

    // ---------------- RECOMMENDATIONS ----------------
    if (path === "/api/recommendations") {
      const response = await fetch(RECO_SOURCE);
      if (!response.ok) {
        res.status(500).send("Failed to fetch recommendations JSON");
        return;
      }

      const original = await response.json();
      const search = url.searchParams.get("search");
      const limit = parseInt(url.searchParams.get("limit"));
      const page = parseInt(url.searchParams.get("page")) || 1;
      const sort = url.searchParams.get("sort");
      const raw = url.searchParams.get("raw");

      let items = [...original];

      if (raw === "true") {
        res.status(200).json(items);
        return;
      }

      if (search) {
        items = items.filter(i =>
          i.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (sort === "asc") items.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === "desc") items.sort((a, b) => b.name.localeCompare(a.name));

      const perPage = limit && limit > 0 ? limit : items.length;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      items = items.slice(start, end);

      const rewritten = items.map(i => {
        const staticFile = i["banner-static"].split("/Recommendation/")[1];
        const animatedFile = i["banner-vid"].split("/Recommendation/")[1];
        const htmlName = decodeURIComponent(i.url.split("/").pop());
        return {
          name: i.name,
          banner_static: `/api/banners/static/${staticFile}`,
          banner_static_size: i["banner-static-size"],
          banner_animated: `/api/banners/animated/${animatedFile}`,
          banner_animated_size: i["banner-vid-size"],
          url: `/api/html/${htmlName}`
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

    // ---------------- COVERS ----------------
    if (path.startsWith("/api/covers/")) {
      const file = path.replace("/api/covers/", "");
      const response = await fetch(ICON_BASE + file);
      if (!response.ok) {
        res.status(404).send("Cover not found");
        return;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      res.status(200).send(buffer);
      return;
    }

    // ---------------- HTML ----------------
    if (path.startsWith("/api/html/")) {
      const file = path.replace("/api/html/", "");
      const response = await fetch(HTML_BASE + file);
      if (!response.ok) {
        res.status(404).send("Game not found");
        return;
      }
      const html = await response.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
      return;
    }

    // ---------------- BANNERS STATIC ----------------
    if (path.startsWith("/api/banners/static/")) {
      const file = path.replace("/api/banners/static/", "");
      const response = await fetch(RECO_BASE + file);
      if (!response.ok) {
        res.status(404).send("Banner not found");
        return;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      res.status(200).send(buffer);
      return;
    }

    // ---------------- BANNERS ANIMATED ----------------
    if (path.startsWith("/api/banners/animated/")) {
      const file = path.replace("/api/banners/animated/", "");
      const response = await fetch(RECO_BASE + file);
      if (!response.ok) {
        res.status(404).send("Banner not found");
        return;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", response.headers.get("content-type"));
      res.status(200).send(buffer);
      return;
    }

    // ---------------- FALLBACK ----------------
    res.status(404).send("Route not found");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
