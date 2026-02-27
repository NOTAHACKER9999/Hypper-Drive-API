import { getGames } from "../../../../games.js";

export async function GET(req, { params }) {
  const games = await getGames();
  const file = params.file;

  const game = games.find(g =>
    g._htmlSrc.endsWith(file)
  );

  if (!game) {
    return new Response("Not found", { status: 404 });
  }

  const res = await fetch(game._htmlSrc);
  const html = await res.text();
  const baseUrl = game._htmlSrc.replace(file, "");

  const wrapped = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <base href="${baseUrl}">
</head>
<body>
${html}
</body>
</html>
`;

  return new Response(wrapped, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=300"
    }
  });
}
