export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json"
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch remote JSON" });
    }

    const games = await response.json();

    const rewritten = games.map(game => {
      const coverName = game.cover.split("/").pop();
      const htmlName = game.url.split("/").pop();

      return {
        name: game.name,
        cover: `/games/covers/${coverName}`,
        url: `/games/html/${htmlName}`
      };
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(rewritten);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
