const JSON_SOURCE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

const ICON_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/ICONS/";

const HTML_BASE =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/HTML/";

module.exports = async (req, res) => {
  const path = req.url.split("?")[0];

  try {
    if (path === "/") {
      res.status(200).send("Game API Running");
      return;
    }

    if (path === "/games") {
      const response = await fetch(JSON_SOURCE);
      const data = await response.json();

      const rewritten = data.map(g => {
        const coverName = g.cover.split("/").pop();
        const htmlName = g.url.split("/").pop();

        return {
          name: g.name,
          cover: `/api/covers/${coverName}`,
          url: `/api/html/${htmlName}`
        };
      });

      res.status(200).json(rewritten);
      return;
    }

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

    res.status(404).send("Route not found");

  } catch (err) {
    res.status(500).send("Server error");
  }
};
