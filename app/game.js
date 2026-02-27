const SOURCE_JSON =
  "https://raw.githubusercontent.com/NOTAHACKER9999/Hypper-Drive/refs/heads/main/Games/zones.json";

let cache = null;
let lastFetch = 0;
const CACHE_TIME = 1000 * 60 * 5;

export async function getGames() {
  const now = Date.now();

  if (cache && now - lastFetch < CACHE_TIME) {
    return cache;
  }

  const res = await fetch(SOURCE_JSON, {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch zones.json");
  }

  const data = await res.json();

  const transformed = data.map((game) => {
    const coverName = game.cover.split("/").pop();
    const htmlName = game.url.split("/").pop();

    return {
      name: game.name,
      cover: `/api/games/covers/${coverName}`,
      html: `/api/games/html/${htmlName}`,
      _coverSrc: game.cover,
      _htmlSrc: game.url
    };
  });

  cache = transformed;
  lastFetch = now;

  return transformed;
}
