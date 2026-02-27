import { getGames } from "@/lib/games";

export async function GET(req, { params }) {
  const games = await getGames();
  const file = params.file;

  const game = games.find((g) =>
    g.originalUrl.endsWith(file)
  );

  if (!game) {
    return new Response("Not found", { status: 404 });
  }

  const htmlRes = await fetch(game.originalUrl);

  let html = await htmlRes.text();

  // Remove restrictive headers and add base support
  html = `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="${game.originalUrl.replace(file, "")}">
        <meta charset="UTF-8">
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "X-Frame-Options": "ALLOWALL",
      "Cache-Control": "public, max-age=300"
    }
  });
}
