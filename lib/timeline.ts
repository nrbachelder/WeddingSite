import data from "@/content/timeline.json";

export type Moment = {
  id: string;
  date: string;
  title: string;
  caption: string;
  /** Path under /public, e.g. "/timeline/first-date.webp". null shows a placeholder tile. */
  image: string | null;
  /** CSS object-position, e.g. "50% 30%", to keep faces inside the hexagon */
  focal?: string;
  alt?: string;
};

export const timeline = data as Moment[];

// Wedding palette, ordered so neighboring tiles rarely repeat
const tints = ["#ffb7c5", "#c1d183", "#c82372", "#93a85c", "#ffb7c5", "#ff6b1a", "#c1d183", "#830c4f"];
export const tintFor = (i: number) => tints[i % tints.length];

// Filler tiles pick a random palette color; the seed changes on every page visit
const fillerTints = ["#ffb7c5", "#93a85c", "#ff6b1a", "#830c4f", "#c1d183", "#c82372"];
export const fillerTint = (k: number, seed = 0) => {
  // Small integer hash of (tile, seed) -> palette index
  let x = Math.imul(k + 1, 0x9e3779b1) ^ seed;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x ^= x >>> 13;
  return fillerTints[(x >>> 0) % fillerTints.length];
};

/*
  Our Story order: newest first. Sorted by year (descending); within a year, later in the doc
  means more recent. A moment with no year in its date takes the year of the moment before it.
*/
export function newestFirst(moments: Moment[]) {
  let last = "";
  return moments
    .map((m, idx) => {
      const year = m.date.match(/\b(19|20)\d{2}\b/)?.[0] ?? last;
      last = year;
      return { m, year, idx };
    })
    .sort((a, b) => b.year.localeCompare(a.year) || b.idx - a.idx)
    .map((d) => d.m);
}

// Text color that reads on each palette color
export const textOn = (tint: string) => (["#830c4f", "#c82372"].includes(tint) ? "#fff" : "#111");
