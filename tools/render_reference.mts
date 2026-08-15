/**
 * Reference renderer — proves the layout maths against the real artwork.
 *
 * Drives ffmpeg from the SAME `planSlots()` output the Skia and Canvas adapters
 * consume. If the composed image looks right, the shared geometry is right, and
 * the platform adapters only have to honour a plan that is already correct.
 *
 * This is deliberately not the production path (ffmpeg ships in neither app).
 * It exists so the geometry can be verified on a laptop, before a device build,
 * against the actual PXLPOD overlays rather than a synthetic fixture.
 *
 *   node tools/render_reference.mts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { planSlots, outputSize, type RenderTarget } from "@poplab/template-spec/layout";
import type { Template } from "@poplab/template-spec/schema";

const detected = JSON.parse(
  readFileSync(resolve("packages/template-spec/fixtures/detected-slots.json"), "utf8"),
);

const PHOTOS = [1, 2, 3, 4].map((i) => `packages/render/fixtures/photos/shot-${i}.jpg`);
const PHOTO = { width: 1126, height: 1500 };

const CASES = [
  { key: "single strip/SS-White.png", overlay: "templates/single strip/SS-White.png", out: "single-strip", dup: false },
  { key: "double strip/DS-White.png", overlay: "templates/double strip/DS-White.png", out: "double-strip", dup: true },
  { key: "fish eye/2026-FS-SS-White.png", overlay: "templates/fish eye/2026-FS-SS-White.png", out: "fish-eye", dup: false },
];

const target: RenderTarget = "print";
mkdirSync("packages/render/fixtures/out", { recursive: true });

for (const c of CASES) {
  const src = detected[c.key];
  const slots = src.slots.map((s: Record<string, number | string>, i: number) => ({
    id: s.id as string,
    photoIndex: c.dup ? Math.floor(i / 2) : i,
    x: s.x as number, y: s.y as number, w: s.w as number, h: s.h as number,
    shape: s.shape as "rect" | "circle",
    cornerRadius: 0, rotation: 0, fit: "cover" as const, mirror: false,
  }));

  const template = {
    canvas: { width: src.canvas.width, height: src.canvas.height, dpi: 300, background: "#FFFFFF" },
    slots,
  } as unknown as Template;

  const plan = planSlots(template, slots.map(() => PHOTO), target);
  const size = outputSize(template.canvas, target);

  // Inputs: white base, then each photo, then the overlay last (on top).
  const args: string[] = ["-v", "error",
    "-f", "lavfi", "-i", `color=c=white:s=${size.width}x${size.height}`];
  for (const p of PHOTOS) args.push("-i", p);
  args.push("-i", c.overlay);

  // One chain per window: crop the source rect, scale to the dest rect,
  // horizontally flip if the slot mirrors. Straight from the plan.
  const chains: string[] = [];
  plan.forEach((d, i) => {
    const { src: s, dest } = d;
    chains.push(
      `[${d.slot.photoIndex + 1}:v]` +
        `crop=${Math.round(s.w)}:${Math.round(s.h)}:${Math.round(s.x)}:${Math.round(s.y)},` +
        `scale=${Math.round(dest.w)}:${Math.round(dest.h)}` +
        (d.mirror ? ",hflip" : "") +
        `[p${i}]`,
    );
  });

  let last = "[0:v]";
  const overlays: string[] = [];
  plan.forEach((d, i) => {
    const tag = i === plan.length - 1 ? "[stack]" : `[s${i}]`;
    overlays.push(`${last}[p${i}]overlay=${Math.round(d.dest.x)}:${Math.round(d.dest.y)}${tag}`);
    last = tag;
  });
  // Overlay artwork last — its punched-through alpha is what masks each window,
  // which is why circular slots need no explicit clip in this path.
  overlays.push(`[stack][${PHOTOS.length + 1}:v]overlay=0:0[out]`);

  const filter = [...chains, ...overlays].join(";");
  const outPath = `packages/render/fixtures/out/${c.out}.jpg`;
  args.push("-filter_complex", filter, "-map", "[out]", "-frames:v", "1", "-q:v", "3", "-y", outPath);

  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });

  const shots = new Set(plan.map((d) => d.slot.photoIndex)).size;
  console.log(
    `${c.out.padEnd(13)} ${size.width}x${size.height}  ` +
      `${plan.length} windows / ${shots} shots  -> ${outPath}`,
  );
  for (const d of plan.slice(0, 2)) {
    console.log(
      `    ${d.slot.id} photo${d.slot.photoIndex} ` +
        `dest ${Math.round(d.dest.x)},${Math.round(d.dest.y)} ${Math.round(d.dest.w)}x${Math.round(d.dest.h)} ` +
        `src ${Math.round(d.src.x)},${Math.round(d.src.y)} ${Math.round(d.src.w)}x${Math.round(d.src.h)}`,
    );
  }
}
