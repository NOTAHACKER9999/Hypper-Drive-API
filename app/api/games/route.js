import { getGames } from "../../games.js";

export async function GET() {
  try {
    const games = await getGames();

    return new Response(JSON.stringify(games), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to load games" }),
      { status: 500 }
    );
  }
}
