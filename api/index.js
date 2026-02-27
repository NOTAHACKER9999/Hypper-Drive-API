const JSON_SOURCE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

const ICON_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/ICONS/";

const HTML_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/HTML/";

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {

    // ---------------- ROOT ----------------
    if (path === "/api" || path === "/api/") {
      res.status(200).send("Game API Running");
      return;
    }

    // ---------------- GAMES JSON WITH QUERY ----------------
    if (path === "/api/games") {

      const response = await fetch(JSON_SOURCE);
      const original = await response.json();

      // Query params
      const search = url.searchParams.get("search");
      const limit = parseInt(url.searchParams.get("limit"));
      const page = parseInt(url.searchParams.get("page")) || 1;
      const sort = url.searchParams.get("sort");
      const raw = url.searchParams.get("raw");

      let games = [...original];

      // Raw mode (no rewriting)
      if (raw === "true") {
        res.status(200).json(games);
        return;
      }

      // Search filter
      if (search) {
        games = games.filter(g =>
          g.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sorting
      if (sort === "asc") {
        games.sort((a, b) => a.name.localeCompare(b.name));
      }
      if (sort === "desc") {
        games.sort((a, b) => b.name.localeCompare(a.name));
      }

      // Pagination
      const perPage = limit && limit > 0 ? limit : games.length;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      games = games.slice(start, end);

      // Rewrite URLs
      const rewritten = games.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = g.url.split("/").pop();

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

    // ---------------- FALLBACK ----------------
    res.status(404).send("Route not found");

  } catch (err) {
    res.status(500).send("Server error");
  }
};
