export default async function handler(req, res) {
  const { file } = req.query;

  const githubURL = `https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/HTML/${file}`;

  try {
    const response = await fetch(githubURL);

    if (!response.ok) {
      return res.status(404).send("Game not found");
    }

    const html = await response.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.status(200).send(html);

  } catch {
    res.status(500).send("Server error");
  }
}
