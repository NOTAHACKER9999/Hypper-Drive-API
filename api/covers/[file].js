export default async function handler(req, res) {
  const { file } = req.query;

  const githubURL = `https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/ICONS/${file}`;

  try {
    const response = await fetch(githubURL);

    if (!response.ok) {
      return res.status(404).send("Cover not found");
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.status(200).send(Buffer.from(buffer));

  } catch {
    res.status(500).send("Server error");
  }
}
