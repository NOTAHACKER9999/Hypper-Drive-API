import { getGames } from "@/lib/games";

export async function GET() {
  try {
    const games = await getGames();

    return new Response(JSON.stringify(games), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to load games" }),
      { status: 500 }
    );
  }
}
