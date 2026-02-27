import { getGames } from "../../../../games.js";

export async function GET(req, { params }) {
  const games = await getGames();
  const file = params.file;

  const game = games.find(g =>
    g._coverSrc.endsWith(file)
  );

  if (!game) {
    return new Response("Not found", { status: 404 });
  }

  const imageRes = await fetch(game._coverSrc);

  return new Response(imageRes.body, {
    headers: {
      "Content-Type": imageRes.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=86400"
    }
  });
}
