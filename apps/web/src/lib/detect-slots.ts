/**
 * Detect photo windows in an overlay by its transparent holes.
 *
 * A browser port of tools/detect_slots.py: load the overlay, read its alpha with
 * getImageData, label connected transparent regions, and emit slot rectangles in
 * canvas coordinates. Powers the console's "Auto-detect slots" button so an
 * operator drops in artwork and gets a mapped template in seconds.
 *
 * Geometry cannot tell a 2x2 sheet of four distinct photos from a cut-apart
 * 4x2 strip, so photoIndex is assigned sequentially here; the operator confirms
 * duplicate columns in the editor.
 */

export interface DetectedSlot {
  id: string;
  photoIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "circle";
}

const ALPHA_HOLE = 16;
const MIN_AREA_FRAC = 0.002;
const CIRCLE_FILL = 0.85; // area/bbox below this reads as a circle (pi/4 = .785)

export async function detectSlots(imageUrl: string): Promise<{ width: number; height: number; slots: DetectedSlot[] }> {
  const img = await loadImage(imageUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Row-run union-find over transparent pixels (4-connectivity).
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (parent.get(x) !== root) {
      const next = parent.get(x)!;
      parent.set(x, root);
      x = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  };

  type Run = { s: number; e: number; id: number };
  let prevRow: Run[] = [];
  let nextId = 0;
  const comps = new Map<number, { x0: number; x1: number; y0: number; y1: number; area: number }>();

  for (let y = 0; y < h; y++) {
    const row: Run[] = [];
    const base = y * w * 4;
    let x = 0;
    while (x < w) {
      if (data[base + x * 4 + 3] <= ALPHA_HOLE) {
        const start = x;
        while (x < w && data[base + x * 4 + 3] <= ALPHA_HOLE) x++;
        const id = nextId++;
        parent.set(id, id);
        row.push({ s: start, e: x - 1, id });
      } else x++;
    }
    for (const run of row) {
      for (const pr of prevRow) {
        if (pr.s <= run.e && run.s <= pr.e) union(run.id, pr.id);
      }
    }
    // accumulate into components
    for (const run of row) {
      const root = find(run.id);
      const c = comps.get(root);
      if (!c) comps.set(root, { x0: run.s, x1: run.e, y0: y, y1: y, area: run.e - run.s + 1 });
      else {
        c.x0 = Math.min(c.x0, run.s);
        c.x1 = Math.max(c.x1, run.e);
        c.y0 = Math.min(c.y0, y);
        c.y1 = y;
        c.area += run.e - run.s + 1;
      }
    }
    prevRow = row;
  }

  const minArea = w * h * MIN_AREA_FRAC;
  const kept = [...comps.values()].filter((c) => c.area >= minArea);
  kept.sort((a, b) => {
    const rowA = Math.round(a.y0 / (h * 0.05));
    const rowB = Math.round(b.y0 / (h * 0.05));
    return rowA !== rowB ? rowA - rowB : a.x0 - b.x0;
  });

  const slots: DetectedSlot[] = kept.map((c, i) => {
    const bw = c.x1 - c.x0 + 1;
    const bh = c.y1 - c.y0 + 1;
    const fill = c.area / (bw * bh);
    return {
      id: `s${i + 1}`,
      photoIndex: i,
      x: c.x0,
      y: c.y0,
      w: bw,
      h: bh,
      shape: fill < CIRCLE_FILL ? "circle" : "rect",
    };
  });

  return { width: w, height: h, slots };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}
