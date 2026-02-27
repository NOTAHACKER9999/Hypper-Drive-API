const JSON_SOURCE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

const ICON_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/ICONS/";

const HTML_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/HTML/";

export default async function handler(req, res) {
  const path = req.url.split("?")[0];

  try {

    // -------------------------
    // ROOT
    // -------------------------
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(`
        <h1>Game API Running</h1>
        <p>Available Routes:</p>
        <ul>
          <li>/games</li>
          <li>/games/covers/{filename}</li>
          <li>/games/html/{filename}</li>
        </ul>
      `);
    }

    // -------------------------
    // GAMES JSON
    // -------------------------
    if (path === "/games") {
      const response = await fetch(JSON_SOURCE);
      const data = await response.json();

      const rewritten = data.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = g.url.split("/").pop();

        return {
          name: g.name,
          cover: `/games/covers/${coverName}`,
          url: `/games/html/${htmlName}`
        };
      });

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(rewritten);
    }

    // -------------------------
    // COVERS
    // -------------------------
    if (path.startsWith("/games/covers/")) {
      const file = path.replace("/games/covers/", "");
      const response = await fetch(ICON_BASE + file);

      if (!response.ok) {
        res.setHeader("Content-Type", "text/html");
        return res.status(404).send(`<h2>Cover Not Found: ${file}</h2>`);
      }

      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", response.headers.get("content-type"));
      return res.status(200).send(Buffer.from(buffer));
    }

    // -------------------------
    // HTML GAMES
    // -------------------------
    if (path.startsWith("/games/html/")) {
      const file = path.replace("/games/html/", "");
      const response = await fetch(HTML_BASE + file);

      if (!response.ok) {
        res.setHeader("Content-Type", "text/html");
        return res.status(404).send(`<h2>Game Not Found: ${file}</h2>`);
      }

      const html = await response.text();

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }

    // -------------------------
    // UNKNOWN ROUTE
    // -------------------------
    res.setHeader("Content-Type", "text/html");
    return res.status(404).send(`
      <h1>404</h1>
      <p>Unknown route: ${path}</p>
      <p>Try /games</p>
    `);

  } catch (err) {
    res.setHeader("Content-Type", "text/html");
    return res.status(500).send(`
      <h1>Server Error</h1>
      <pre>${err.message}</pre>
    `);
  }
}
