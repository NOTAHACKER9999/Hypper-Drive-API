const ZONES =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

export async function GET() {
  const res = await fetch(ZONES, { cache: "no-store" });
  if (!res.ok) return new Response("Failed", { status: 500 });

  const data = await res.json();

  const rewritten = data.map((g) => {
    const cover = g.cover.split("/").pop();
    const html = g.url.split("/").pop();

    return {
      name: g.name,
      cover: `/api/games/covers/${cover}`,
      url: `/api/games/html/${html}`,
    };
  });

  return Response.json(rewritten);
}
