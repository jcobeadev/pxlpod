#!/usr/bin/env python3
"""
Slot detection spike — Phase 00.

Reads a template overlay PNG, finds the fully-transparent windows punched
through its alpha channel, and emits them as template-spec slot rectangles.

This is the reference implementation of what the console's Slot Mapper (W-09)
does in the browser with Canvas 2D getImageData. Proving it here on the real
PXLPOD artwork gives us both the algorithm and the fixture data.

No third-party deps: ffmpeg decodes the PNG to raw RGBA, stdlib does the rest.
Connected components use per-row runs + union-find rather than per-pixel flood
fill, which keeps 2.16M pixels well under a second.
"""

import json
import subprocess
import sys
from pathlib import Path

ALPHA_HOLE = 16       # alpha at or below this counts as "punched through"
MIN_AREA_FRAC = 0.002  # ignore specks smaller than 0.2% of the canvas
CIRCLE_FILL = 0.85     # area/bbox ratio below this reads as a circle (pi/4 = .785)


def decode_rgba(path: Path):
    """Return (width, height, rgba_bytes) using ffmpeg."""
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", str(path)],
        capture_output=True, text=True, check=True,
    )
    w, h = (int(v) for v in probe.stdout.strip().split("x"))
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path),
         "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
        capture_output=True, check=True,
    ).stdout
    if len(raw) != w * h * 4:
        raise RuntimeError(f"{path.name}: expected {w*h*4} bytes, got {len(raw)}")
    return w, h, raw


def find_components(w: int, h: int, rgba: bytes):
    """Connected components of transparent pixels, 4-connectivity."""
    parent = {}

    def find(x):
        root = x
        while parent[root] != root:
            root = parent[root]
        while parent[x] != root:      # path compression
            parent[x], x = root, parent[x]
        return root

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)

    runs_by_row = []
    next_id = 0

    for y in range(h):
        base = y * w * 4
        row_runs = []
        x = 0
        while x < w:
            if rgba[base + x * 4 + 3] <= ALPHA_HOLE:
                start = x
                while x < w and rgba[base + x * 4 + 3] <= ALPHA_HOLE:
                    x += 1
                rid = next_id
                next_id += 1
                parent[rid] = rid
                row_runs.append((start, x - 1, rid))   # inclusive end
            else:
                x += 1
        runs_by_row.append(row_runs)

        # merge with the row above where spans overlap
        if y > 0:
            for s, e, rid in row_runs:
                for ps, pe, prid in runs_by_row[y - 1]:
                    if ps <= e and s <= pe:
                        union(rid, prid)

    # collapse runs into component bounding boxes + areas
    comps = {}
    for y, row_runs in enumerate(runs_by_row):
        for s, e, rid in row_runs:
            root = find(rid)
            c = comps.get(root)
            if c is None:
                comps[root] = {"x0": s, "x1": e, "y0": y, "y1": y, "area": e - s + 1}
            else:
                c["x0"] = min(c["x0"], s)
                c["x1"] = max(c["x1"], e)
                c["y0"] = min(c["y0"], y)
                c["y1"] = max(c["y1"], y)
                c["area"] += e - s + 1
    return comps


def to_slots(w: int, h: int, comps: dict):
    min_area = w * h * MIN_AREA_FRAC
    kept = [c for c in comps.values() if c["area"] >= min_area]
    # reading order: top-to-bottom, then left-to-right, with a row tolerance
    kept.sort(key=lambda c: (round(c["y0"] / (h * 0.05)), c["x0"]))

    slots = []
    for i, c in enumerate(kept):
        bw = c["x1"] - c["x0"] + 1
        bh = c["y1"] - c["y0"] + 1
        fill = c["area"] / (bw * bh)
        slots.append({
            "id": f"s{i + 1}",
            "photoIndex": i,          # provisional — duplicates get remapped below
            "x": c["x0"], "y": c["y0"], "w": bw, "h": bh,
            "shape": "circle" if fill < CIRCLE_FILL else "rect",
            "rotation": 0,
            "fit": "cover",
            "mirror": True,
            "_fill": round(fill, 3),
        })
    return slots


def analyse_layout(slots, w):
    """
    Describe the grid, and flag whether the columns *could* be a cut-apart
    duplicate (a double strip) — without deciding it.

    Geometry cannot distinguish a 2x2 sheet of four distinct photos from a
    4x2 strip that repeats four photos in two columns: both mirror perfectly
    left-to-right. So the detector proposes sequential photoIndex values and
    hands the question to the operator in the Slot Mapper, which offers a
    one-click "same photos in both columns" toggle.
    """
    rows = []
    for s in sorted(slots, key=lambda s: s["y"]):
        for r in rows:
            if abs(r[0]["y"] - s["y"]) <= r[0]["h"] * 0.25:
                r.append(s)
                break
        else:
            rows.append([s])

    cols = max((len(r) for r in rows), default=0)
    uniform = len({len(r) for r in rows}) == 1

    mirrored = False
    if uniform and cols == 2 and len(rows) >= 2:
        mid = w / 2
        left = sorted([s for s in slots if s["x"] + s["w"] / 2 < mid], key=lambda s: s["y"])
        right = sorted([s for s in slots if s["x"] + s["w"] / 2 >= mid], key=lambda s: s["y"])
        mirrored = len(left) == len(right) and all(
            abs(l["y"] - r["y"]) <= l["h"] * 0.25 and abs(l["h"] - r["h"]) <= l["h"] * 0.1
            for l, r in zip(left, right)
        )

    return {"rows": len(rows), "cols": cols, "mayBeDuplicateColumns": mirrored}


def main(paths):
    out = {}
    for p in paths:
        path = Path(p)
        w, h, rgba = decode_rgba(path)
        comps = find_components(w, h, rgba)
        slots = to_slots(w, h, comps)
        layout = analyse_layout(slots, w)
        out[path.parent.name + "/" + path.name] = {
            "canvas": {"width": w, "height": h},
            "windows": len(slots),
            "layout": layout,
            "slots": slots,
        }
        hint = " · may be duplicate columns (operator confirms)" if layout["mayBeDuplicateColumns"] else ""
        print(f"{path.parent.name}/{path.name}: {w}x{h} — {len(slots)} windows, "
              f"{layout['rows']}x{layout['cols']} grid{hint}", file=sys.stderr)
        for s in slots:
            print(f"    {s['id']} photo{s['photoIndex']} {s['shape']:<6} "
                  f"x={s['x']:<5} y={s['y']:<5} w={s['w']:<5} h={s['h']:<5} "
                  f"fill={s['_fill']}", file=sys.stderr)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main(sys.argv[1:])
