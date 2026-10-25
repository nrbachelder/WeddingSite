import { fillerTint } from "./timeline";

export type Cell = { x: number; y: number; col: number; mx?: number; my?: number } & (
  | { kind: "item"; i: number }
  | { kind: "filler"; k: number; tint: string }
);

/*
  Flat-top hexes in interlocking columns, filled row by row so items read left to right
  (zigzagging up/down within each row), then wrap. Columns are added until the whole grid
  fits in maxHeight, so it can stay pinned on screen while scrolling.

  withFillers: every third hex (one class of the hex grid's 3-coloring) becomes a colored
  filler tile, so color tiles are spread evenly in every direction and never touch each other.
  Without it, only the items themselves are drawn and the last row is simply left short.
*/
export function buildLayout(
  n: number,
  width: number,
  maxHeight: number,
  target: number,
  withFillers = false,
  columns?: number[],
  seed = 0,
) {
  if (columns) return columnLayout(columns, width, maxHeight, target);
  let cols = Math.max(3, Math.round((width / target - 1) / 0.75 + 1));
  let w = 0;
  let h = 0;
  let rows = 0;
  for (; ; cols++) {
    w = width / (0.75 * (cols - 1) + 1);
    h = w * 0.866;
    rows = withFillers ? rowsFor(n, cols) : Math.ceil(n / cols);
    if ((rows + 0.5) * h <= maxHeight || cols >= 16) break;
  }

  const slots = withFillers ? rows * cols : n;
  // Fewer items than columns (e.g. Info): center the short row instead of leaving it left-aligned
  const used = Math.min(cols, slots);
  const offsetX = (width - ((used - 1) * 0.75 * w + w)) / 2;
  const cells = fillRows({ n, cols, rows, w, h, offsetX, offsetY: 0, firstItem: 0, firstFiller: 0, seed, withFillers });
  return { cells, w, height: rows * h + h / 2 };
}

type FillOptions = {
  n: number;
  cols: number;
  rows: number;
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
  firstItem: number;
  firstFiller: number;
  seed: number;
  withFillers: boolean;
};

// Lays n items (plus filler tiles, when enabled) into rows x cols slots starting at offsetY
function fillRows({ n, cols, rows, w, h, offsetX, offsetY, firstItem, firstFiller, seed, withFillers }: FillOptions) {
  const slots = withFillers ? rows * cols : n;
  const lattice = (s: number) => withFillers && isLatticeFiller(s % cols, Math.floor(s / cols));
  // Spare non-lattice slots (grid capacity beyond n) also become fillers, spread evenly
  const open = Array.from({ length: slots }, (_, s) => s).filter((s) => !lattice(s));
  const spare = open.length - n;
  const spareAt = new Set(Array.from({ length: Math.max(0, spare) }, (_, k) => open[Math.floor(((k + 0.5) * open.length) / spare)]));

  const cells: Cell[] = [];
  let i = 0;
  let k = firstFiller;
  for (let s = 0; s < slots; s++) {
    const c = s % cols;
    const pos = { x: offsetX + c * 0.75 * w, y: offsetY + Math.floor(s / cols) * h + (c % 2) * (h / 2), col: c };
    if (lattice(s) || spareAt.has(s) || i >= n) {
      cells.push({ ...pos, kind: "filler", k, tint: fillerTint(k, seed) });
      k++;
    } else cells.push({ ...pos, kind: "item", i: firstItem + i++ });
  }
  return cells;
}

/*
  Desktop Our Story timeline: a path winding down the page, perRow photos per row, running left
  to right and then right to left. Every other row is shifted half a step, so each turn steps
  diagonally down into the next row. Rows hold as many photos of about PATH_PHOTO width as fit
  (at least 3). The gap under each row holds the zoomed photo's caption box: the photo's growth
  below its edge, the dot + line (CAPTION_LEAD) and the box (CAPTION_ROOM). A row and its caption
  (one pitch) are kept to half the screen height, so a row stays fully in view the whole time its
  photos are being stepped through.
*/
const PATH_PHOTO = 230;
const CAPTION_LEAD = 38;
const CAPTION_ROOM = 84;

export function windingLayout(n: number, width: number, vh: number, zoom = 1.35) {
  // Row footprint: perRow photos `step` apart plus the half-step shift = (perRow - 0.5) * step + w
  const gapX = 0.3;
  const below = 1 + (zoom - 1) / 2;
  const fitHeight = (vh / 2 - CAPTION_LEAD - CAPTION_ROOM) / below / 0.866;
  const perRow = Math.max(3, Math.floor((width / PATH_PHOTO - 1) / (1 + gapX) + 1));
  const w = Math.max(160, Math.min(fitHeight, width / ((perRow - 0.5) * (1 + gapX) + 1)));
  const h = w * 0.866;
  const step = w * (1 + gapX);
  const pitch = h * below + CAPTION_LEAD + CAPTION_ROOM;
  const left = (width - ((perRow - 0.5) * step + w)) / 2;
  const cells: Cell[] = Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow);
    const k = i % perRow;
    const col = row % 2 ? perRow - 1 - k : k;
    return { kind: "item", i, col, x: left + (col + (row % 2) * 0.5) * step, y: row * pitch };
  });
  return { cells, w, height: Math.ceil(n / perRow) * pitch, pitch, perRow };
}

/*
  Desktop intro: every photo in one compact flat-top honeycomb, as wide as the page and short
  enough to fit maxHeight. The short last row is centered by whole columns, which is exact when
  its spare slots split evenly; one more column is used when that makes them split evenly.
*/
export function introLayout(n: number, width: number, maxHeight: number) {
  const fit = (cols: number) => {
    const w = width / (0.75 * (cols - 1) + 1);
    const rows = Math.ceil(n / cols);
    return { cols, w, rows, last: n - (rows - 1) * cols, fits: (rows + 0.5) * w * 0.866 <= maxHeight };
  };
  let g = fit(3);
  for (let cols = 3; cols < 16 && !g.fits; ) g = fit(++cols);
  const wider = fit(g.cols + 1);
  if ((g.cols - g.last) % 2 === 1 && (wider.cols - wider.last) % 2 === 0) g = wider;

  const h = g.w * 0.866;
  const cells: Cell[] = Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / g.cols);
    const c = (i % g.cols) + (row === g.rows - 1 ? Math.floor((g.cols - g.last) / 2) : 0);
    return { kind: "item", i, col: c, x: c * 0.75 * g.w, y: row * h + (c % 2) * (h / 2) };
  });
  return { cells, w: g.w };
}

// Odd columns sit half a hex lower ("odd-q" layout). In axial coordinates every neighbor
// differs in (q - r) mod 3, so one residue class is a set of evenly spaced, non-touching hexes.
function isLatticeFiller(col: number, row: number) {
  const r = row - (col - (col & 1)) / 2;
  return (((col - r) % 3) + 3) % 3 === 0;
}

function rowsFor(n: number, cols: number) {
  let rows = 1;
  for (; ; rows++) {
    let capacity = 0;
    for (let s = 0; s < rows * cols; s++) if (!isLatticeFiller(s % cols, Math.floor(s / cols))) capacity++;
    if (capacity >= n) return rows;
  }
}

/*
  Fixed cluster, e.g. [1, 2, 1]: column c holds columns[c] hexes stacked and centered,
  so neighbors interlock (1-2-1 = left, top+bottom, right).
  mx/my describe the same cluster turned sideways for mobile: row r holds columns[r]
  pointy-top hexes, centered (mx in hex widths, my in rows).
*/
function columnLayout(columns: number[], width: number, maxHeight: number, target: number) {
  const tallest = Math.max(...columns);
  const w = Math.min(target, width / (0.75 * (columns.length - 1) + 1), maxHeight / (tallest * 0.866));
  const h = w * 0.866;
  const offset = (width - ((columns.length - 1) * 0.75 * w + w)) / 2;

  const cells: Cell[] = [];
  let i = 0;
  columns.forEach((count, c) => {
    for (let j = 0; j < count; j++) {
      cells.push({
        kind: "item",
        i: i++,
        col: c,
        x: offset + c * 0.75 * w,
        y: ((tallest - count) * h) / 2 + j * h,
        mx: (tallest - count) / 2 + j,
        my: c,
      });
    }
  });
  return { cells, w, height: tallest * h };
}

/*
  Mobile intro honeycomb: every photo packed into pointy-top rows alternating 5 and 4 hexes,
  narrow rows shifted half a hex. The last (partial) row is centered. Rows must keep their
  half-hex offset to interlock, so a partial row can only sit exactly centered when its spare
  slots split evenly; if the usual wide-first pattern can't do that, start with a narrow row.
*/
export const INTRO_WIDE = 5;

export function mobileIntroLayout(count: number) {
  const build = (narrowFirst: boolean) => {
    const rows: { narrow: boolean; n: number }[] = [];
    for (let left = count, r = 0; left > 0; r++) {
      const narrow = (r % 2 === 1) !== narrowFirst;
      const n = Math.min(left, INTRO_WIDE - (narrow ? 1 : 0));
      rows.push({ narrow, n });
      left -= n;
    }
    return rows;
  };
  const spare = (rows: { narrow: boolean; n: number }[]) => {
    const last = rows[rows.length - 1];
    return INTRO_WIDE - (last.narrow ? 1 : 0) - last.n;
  };
  let rows = build(false);
  if (spare(rows) % 2 === 1 && spare(build(true)) % 2 === 0) rows = build(true);

  const photos: { ix: number; iy: number }[] = [];
  rows.forEach(({ narrow, n }, iy) => {
    const offset = iy === rows.length - 1 ? Math.floor(spare(rows) / 2) : 0;
    for (let j = 0; j < n; j++) photos.push({ ix: offset + j + (narrow ? 0.5 : 0), iy });
  });
  return { photos, rows: rows.length };
}
