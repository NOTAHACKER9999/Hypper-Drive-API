const ZONES =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

export async function GET(req, { params }) {
  const file = params.file;

  const res = await fetch(ZONES, { cache: "no-store" });
  if (!res.ok) return new Response("Failed", { status: 500 });

  const data = await res.json();
  const game = data.find((g) => g.cover.endsWith(file));

  if (!game) return new Response("Not found", { status: 404 });

  const imgRes = await fetch(game.cover, { cache: "no-store" });
  const buffer = await imgRes.arrayBuffer();

  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}
