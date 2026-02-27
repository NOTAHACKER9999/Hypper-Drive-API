const ZONES =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

export async function GET(req, { params }) {
  const file = params.file;

  const res = await fetch(ZONES, { cache: "no-store" });
  if (!res.ok) return new Response("Failed", { status: 500 });

  const data = await res.json();
  const game = data.find((g) => g.url.endsWith(file));

  if (!game) return new Response("Not found", { status: 404 });

  const htmlRes = await fetch(game.url, { cache: "no-store" });
  const html = await htmlRes.text();

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
