#!/usr/bin/env python3
"""Excalidraw plumbing: build a scene, assert its invariants, rasterise it.

Split from the layout on purpose. This file knows the .excalidraw wire format
and nothing about ACP; `gen_acp.py` knows about ACP and nothing about the wire
format. Adapted from content/kirocrew-ci-velocity/diagrams/.

Three responsibilities, all of them "format", hence one module:

  Scene     - element builder. The scene format needs ~25 mandatory keys per
              element plus TWO-WAY binding records between a shape, its label
              and every arrow touching it. Hand-editing that JSON is how you
              get labels that drift out of their boxes.
  validate  - the invariants Excalidraw repairs silently on load. A malformed
              file looks fine until you drag something and lose a label.
  render    - dependency-free SVG with hand-drawn jitter, for inline display
              without booting a browser.

Deterministic: fixed seeds and a fixed `updated` stamp, so an unchanged layout
regenerates byte-identically and a changed one produces a readable diff.
"""

from __future__ import annotations

import json
import math
import pathlib
from xml.sax.saxutils import escape

# Excalidraw only uses `updated` for collaborative conflict resolution, so
# pinning it costs nothing and buys reproducible output.
STAMP = 1786000000000

# Darko's deck palette (in-defence-of-mcps / kiro-crew-intro), with the two
# light brand colours darkened enough to survive being used as strokes.
INK = "#1e1e1e"
TEAL = "#0f8b7e"
TEAL_FILL = "#e6fcf5"
DEEP = "#008295"
DEEP_FILL = "#e3f6fa"
AMBER = "#b07500"
AMBER_FILL = "#fff9db"
RED = "#c92a2a"
RED_FILL = "#ffe8e8"
GREY = "#6c757d"
GREY_FILL = "#f1f3f5"
WHITE = "transparent"

HAND = 1  # Virgil / Excalifont
SANS = 2  # Helvetica / Nunito
CODE = 3  # Cascadia

CHAR_W = {HAND: 0.55, SANS: 0.52, CODE: 0.60}
LINE_H = 1.25


def wrap(text: str, width_px: float, size: int, family: int) -> list[str]:
    """Greedy wrap honouring explicit newlines, mirroring how Excalidraw bounds
    text so the stored `text` matches what the app would compute itself."""
    limit = max(1, int(width_px / (size * CHAR_W[family])))
    lines: list[str] = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        cur = ""
        for word in para.split(" "):
            cand = f"{cur} {word}".strip()
            if len(cand) <= limit or not cur:
                cur = cand
            else:
                lines.append(cur)
                cur = word
        lines.append(cur)
    return lines


def text_width(body: str, size: int, family: int) -> float:
    lines = body.split("\n")
    return max((len(l) for l in lines), default=0) * size * CHAR_W[family]


def bounds(el: dict) -> tuple[float, float, float, float]:
    """True (x1, y1, x2, y2) of an element.

    For a rectangle or text, x/y is the top-left. For a line or arrow it is the
    FIRST POINT, and the remaining points are relative offsets that may be
    negative - so a right-to-left arrow has its x at its right edge and
    `x + width` lands a full width past it. Excalidraw derives bounds from the
    points, so the stored file is fine; anything that reasons about geometry
    has to do the same or it will over-measure the canvas.
    """
    if el["type"] in ("line", "arrow"):
        xs = [el["x"] + px for px, _ in el["points"]]
        ys = [el["y"] + py for _, py in el["points"]]
        return min(xs), min(ys), max(xs), max(ys)
    return el["x"], el["y"], el["x"] + el["width"], el["y"] + el["height"]


# ---------------------------------------------------------------------------
# builder
# ---------------------------------------------------------------------------


class Scene:
    def __init__(self, name: str, background: str = "#ffffff") -> None:
        self.name = name
        self.background = background
        self.elements: list[dict] = []
        self._n = 0

    def _next(self, prefix: str) -> tuple[str, int]:
        self._n += 1
        return f"{prefix}-{self._n:04d}", 100000 + self._n * 7919

    def _index(self) -> str:
        # Fractional indices only need to sort lexicographically in base62.
        # Zero-padded digits satisfy that.
        return f"a{len(self.elements):04d}"

    def _base(self, kind: str, x, y, w, h, stroke, fill, **kw) -> dict:
        eid, seed = self._next(kind[:4])
        el = {
            "id": eid,
            "type": kind,
            "x": float(x),
            "y": float(y),
            "width": float(w),
            "height": float(h),
            "angle": 0,
            "strokeColor": stroke,
            "backgroundColor": fill,
            "fillStyle": "solid",
            "strokeWidth": 2,
            "strokeStyle": "solid",
            "roughness": 1,
            "opacity": 100,
            "groupIds": [],
            "frameId": None,
            "index": self._index(),
            "roundness": {"type": 3},
            "seed": seed,
            "version": 1,
            "versionNonce": seed + 13,
            "isDeleted": False,
            "boundElements": [],
            "updated": STAMP,
            "link": None,
            "locked": False,
        }
        el.update(kw)
        self.elements.append(el)
        return el

    def text(self, x, y, body: str, size: int = 16, family: int = HAND,
             colour: str = INK, align: str = "left",
             width: float | None = None) -> dict:
        lines = wrap(body, width, size, family) if width else body.split("\n")
        w = width or max((len(l) for l in lines), default=1) * size * CHAR_W[family]
        h = len(lines) * size * LINE_H
        return self._base(
            "text", x, y, w, h, colour, WHITE,
            roundness=None,
            text="\n".join(lines),
            originalText=body,
            fontSize=size,
            fontFamily=family,
            textAlign=align,
            verticalAlign="top",
            containerId=None,
            lineHeight=LINE_H,
            autoResize=True,
        )

    def box(self, x, y, w, h, label: str = "", stroke: str = INK,
            fill: str = WHITE, size: int = 15, family: int = HAND,
            dashed: bool = False, sharp: bool = False,
            label_colour: str | None = None) -> dict:
        rect = self._base(
            "rectangle", x, y, w, h, stroke, fill,
            strokeStyle="dashed" if dashed else "solid",
            roundness=None if sharp else {"type": 3},
        )
        if label:
            self.label(rect, label, size=size, family=family,
                       colour=label_colour or stroke)
        return rect

    def label(self, container: dict, body: str, size: int = 15,
              family: int = HAND, colour: str = INK) -> dict:
        """Bind a centred text element inside a container, the way the app does."""
        pad = 10
        inner = container["width"] - 2 * pad
        lines = wrap(body, inner, size, family)
        h = len(lines) * size * LINE_H
        el = self._base(
            "text",
            container["x"] + pad,
            container["y"] + (container["height"] - h) / 2,
            inner, h, colour, WHITE,
            roundness=None,
            text="\n".join(lines),
            originalText=body,
            fontSize=size,
            fontFamily=family,
            textAlign="center",
            verticalAlign="middle",
            containerId=container["id"],
            lineHeight=LINE_H,
            autoResize=False,
        )
        container["boundElements"].append({"type": "text", "id": el["id"]})
        return el

    def _poly(self, kind: str, pts, stroke, dashed, width, **kw) -> dict:
        x0, y0 = pts[0]
        rel = [(px - x0, py - y0) for px, py in pts]
        w = max(p[0] for p in rel) - min(p[0] for p in rel)
        h = max(p[1] for p in rel) - min(p[1] for p in rel)
        return self._base(
            kind, x0, y0, w, h, stroke, WHITE,
            strokeWidth=width,
            strokeStyle="dashed" if dashed else "solid",
            roundness={"type": 2},
            points=[[float(a), float(b)] for a, b in rel],
            lastCommittedPoint=None,
            **kw,
        )

    def line(self, pts, stroke: str = GREY, dashed: bool = False,
             width: int = 2) -> dict:
        return self._poly("line", pts, stroke, dashed, width,
                          startBinding=None, endBinding=None,
                          startArrowhead=None, endArrowhead=None)

    def arrow(self, pts, start: dict | None = None, end: dict | None = None,
              stroke: str = INK, dashed: bool = False, width: int = 2,
              both: bool = False, gap: int = 6) -> dict:
        el = self._poly(
            "arrow", pts, stroke, dashed, width,
            startBinding=({"elementId": start["id"], "focus": 0, "gap": gap}
                          if start else None),
            endBinding=({"elementId": end["id"], "focus": 0, "gap": gap}
                        if end else None),
            startArrowhead="arrow" if both else None,
            endArrowhead="arrow",
            elbowed=False,
        )
        for node in (start, end):
            if node is not None:
                node["boundElements"].append({"type": "arrow", "id": el["id"]})
        return el

    def title(self, x, y, head: str, sub: str = "") -> None:
        self.text(x, y, head, size=30, family=SANS)
        if sub:
            self.text(x, y + 42, sub, size=16, family=HAND, colour=GREY)

    def note(self, x, y, w, body: str, stroke: str = AMBER,
             fill: str = AMBER_FILL, size: int = 13) -> dict:
        lines = wrap(body, w - 24, size, HAND)
        h = len(lines) * size * LINE_H + 22
        rect = self.box(x, y, w, h, stroke=stroke, fill=fill, dashed=True)
        self.label(rect, body, size=size, colour=stroke)
        return rect

    def right_of(self, el: dict) -> tuple[float, float]:
        return el["x"] + el["width"], el["y"] + el["height"] / 2

    def left_of(self, el: dict) -> tuple[float, float]:
        return el["x"], el["y"] + el["height"] / 2

    def below(self, el: dict) -> tuple[float, float]:
        return el["x"] + el["width"] / 2, el["y"] + el["height"]

    def above(self, el: dict) -> tuple[float, float]:
        return el["x"] + el["width"] / 2, el["y"]

    def doc(self) -> dict:
        return {
            "type": "excalidraw",
            "version": 2,
            "source": "gen_acp.py",
            "elements": self.elements,
            "appState": {
                "gridSize": None,
                "gridStep": 5,
                "gridModeEnabled": False,
                "viewBackgroundColor": self.background,
            },
            "files": {},
        }

    def save(self, out: pathlib.Path) -> pathlib.Path:
        path = out / f"{self.name}.excalidraw"
        path.write_text(json.dumps(self.doc(), indent=2) + "\n")
        return path


# ---------------------------------------------------------------------------
# validation
# ---------------------------------------------------------------------------

COMMON = {
    "id", "type", "x", "y", "width", "height", "angle", "strokeColor",
    "backgroundColor", "fillStyle", "strokeWidth", "strokeStyle", "roughness",
    "opacity", "groupIds", "frameId", "index", "roundness", "seed", "version",
    "versionNonce", "isDeleted", "boundElements", "updated", "link", "locked",
}
PER_TYPE = {
    "text": {"text", "originalText", "fontSize", "fontFamily", "textAlign",
             "verticalAlign", "containerId", "lineHeight"},
    "arrow": {"points", "startBinding", "endBinding", "startArrowhead",
              "endArrowhead", "lastCommittedPoint"},
    "line": {"points", "lastCommittedPoint"},
    "rectangle": set(),
}


def _overlaps(a: dict, b: dict, slack: float = 1.0) -> bool:
    return (
        a["x"] + a["width"] - slack > b["x"]
        and b["x"] + b["width"] - slack > a["x"]
        and a["y"] + a["height"] - slack > b["y"]
        and b["y"] + b["height"] - slack > a["y"]
    )


def validate(doc: dict) -> list[str]:
    bad: list[str] = []

    for key in ("type", "version", "elements", "appState", "files"):
        if key not in doc:
            bad.append(f"envelope is missing {key!r}")
    if doc.get("type") != "excalidraw":
        bad.append(f"type is {doc.get('type')!r}, expected 'excalidraw'")
    if doc.get("version") != 2:
        bad.append(f"version is {doc.get('version')!r}, expected 2")

    els = doc.get("elements", [])
    by_id = {e["id"]: e for e in els}
    if len(by_id) != len(els):
        bad.append("duplicate element ids")

    idx = [e.get("index") for e in els]
    if any(i is None for i in idx):
        bad.append("an element has no fractional index")
    elif idx != sorted(idx) or len(set(idx)) != len(idx):
        bad.append("fractional indices are not strictly increasing")

    for e in els:
        missing = (COMMON | PER_TYPE.get(e["type"], set())) - set(e)
        if missing:
            bad.append(f"{e['id']} ({e['type']}) missing keys: {sorted(missing)}")

        if e["type"] == "text" and e.get("containerId"):
            box = by_id.get(e["containerId"])
            if box is None:
                bad.append(f"{e['id']} containerId points at a missing element")
            else:
                if not any(r.get("type") == "text" and r.get("id") == e["id"]
                           for r in box.get("boundElements") or []):
                    bad.append(
                        f"{box['id']} does not list bound text {e['id']} "
                        "(one-way binding, the app will drop the label)")
                if e["height"] > box["height"] + 1:
                    bad.append(
                        f"label {e['id']} is {e['height']:.0f}px tall but its "
                        f"container {box['id']} is only {box['height']:.0f}px")
                widest = text_width(e["text"], e["fontSize"], e["fontFamily"])
                if widest > box["width"] + 1:
                    bad.append(
                        f"label {e['id']} needs ~{widest:.0f}px of width but "
                        f"container {box['id']} is {box['width']:.0f}px")

        if e["type"] == "arrow":
            for side in ("startBinding", "endBinding"):
                binding = e.get(side)
                if not binding:
                    continue
                target = by_id.get(binding["elementId"])
                if target is None:
                    bad.append(f"{e['id']} {side} points at a missing element")
                    continue
                if not any(r.get("type") == "arrow" and r.get("id") == e["id"]
                           for r in target.get("boundElements") or []):
                    bad.append(
                        f"{target['id']} does not list bound arrow {e['id']} "
                        f"({side}) - the arrow will not follow the shape")

        if e["type"] in ("arrow", "line"):
            if len(e["points"]) < 2:
                bad.append(f"{e['id']} has fewer than 2 points")
            elif e["points"][0] != [0, 0]:
                bad.append(f"{e['id']} first point is not [0,0]")

    # Partial overlap hides labels. Full containment is legitimate nesting.
    rects = [e for e in els if e["type"] == "rectangle"]
    for i, a in enumerate(rects):
        for b in rects[i + 1:]:
            if not _overlaps(a, b):
                continue
            inner, outer = sorted((a, b), key=lambda r: r["width"] * r["height"])
            contained = (
                outer["x"] - 1 <= inner["x"]
                and outer["y"] - 1 <= inner["y"]
                and outer["x"] + outer["width"] + 1 >= inner["x"] + inner["width"]
                and outer["y"] + outer["height"] + 1 >= inner["y"] + inner["height"]
            )
            if not contained:
                bad.append(
                    f"rectangles {a['id']} and {b['id']} partially overlap at "
                    f"({a['x']:.0f},{a['y']:.0f}) / ({b['x']:.0f},{b['y']:.0f})")

    # Unbound text may sit INSIDE a rectangle (panel titles), but text that
    # straddles a border is a layout bug that hides half a word.
    free = [e for e in els if e["type"] == "text" and not e.get("containerId")]
    for t in free:
        for r in rects:
            if not _overlaps(t, r, slack=4.0):
                continue
            inside = (
                r["x"] - 1 <= t["x"]
                and r["y"] - 1 <= t["y"]
                and r["x"] + r["width"] + 1 >= t["x"] + t["width"]
                and r["y"] + r["height"] + 1 >= t["y"] + t["height"]
            )
            if not inside:
                bad.append(
                    f"free text {t['id']} ({t['text'].splitlines()[0][:32]!r}) "
                    f"straddles the border of rectangle {r['id']}")
                break

    return bad


# ---------------------------------------------------------------------------
# rendering
# ---------------------------------------------------------------------------

# SVGs shown via <img> cannot reach page webfonts, so system fonts only. Family
# 1 stays hand-drawn on purpose - the sketchy look is the point of the diagram.
FONT = {
    1: "Chalkboard, 'Comic Sans MS', 'Segoe Print', cursive",
    2: "'Amazon Ember', Inter, system-ui, Helvetica, Arial, sans-serif",
    3: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
}


def _rand(seed: int):
    """Tiny deterministic LCG. Jitter must be stable across runs or every
    regeneration produces a different-looking diagram."""
    state = (seed * 2654435761) & 0x7FFFFFFF

    def nxt() -> float:
        nonlocal state
        state = (state * 1103515245 + 12345) & 0x7FFFFFFF
        return state / 0x7FFFFFFF

    return nxt


def _wobble(x1, y1, x2, y2, rnd, amp=1.5) -> str:
    """One hand-drawn stroke: jittered endpoints plus a bowed midpoint."""
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / length, dx / length
    j = lambda: (rnd() - 0.5) * 2 * amp  # noqa: E731
    ax, ay = x1 + j(), y1 + j()
    bx, by = x2 + j(), y2 + j()
    bow = (rnd() - 0.5) * 2 * amp * 1.4
    cx = (x1 + x2) / 2 + nx * bow
    cy = (y1 + y2) / 2 + ny * bow
    return f"M{ax:.1f},{ay:.1f} Q{cx:.1f},{cy:.1f} {bx:.1f},{by:.1f}"


def _rough_rect(x, y, w, h, r, rnd, amp: float = 1.2) -> str:
    """One continuous hand-drawn rounded-rect outline.

    Straight edges get a jittered endpoint and a bowed midpoint; corners are
    true quadratic arcs whose control point is the geometric corner. Because a
    Q command only names a control and an end point, jittering ends keeps the
    path continuous for free - no gaps to chase.
    """
    x2, y2 = x + w, y + h
    j = lambda: (rnd() - 0.5) * 2 * amp  # noqa: E731

    def edge(x1, y1, ex, ey) -> str:
        dx, dy = ex - x1, ey - y1
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        bow = (rnd() - 0.5) * 2 * amp * 1.2
        cx = (x1 + ex) / 2 + nx * bow
        cy = (y1 + ey) / 2 + ny * bow
        return f" Q{cx:.1f},{cy:.1f} {ex + j():.1f},{ey + j():.1f}"

    def corner(kx, ky, ex, ey) -> str:
        return f" Q{kx + j():.1f},{ky + j():.1f} {ex + j():.1f},{ey + j():.1f}"

    d = [f"M{x + r + j():.1f},{y + j():.1f}"]
    d.append(edge(x + r, y, x2 - r, y))
    d.append(corner(x2, y, x2, y + r))
    d.append(edge(x2, y + r, x2, y2 - r))
    d.append(corner(x2, y2, x2 - r, y2))
    d.append(edge(x2 - r, y2, x + r, y2))
    d.append(corner(x, y2, x, y2 - r))
    d.append(edge(x, y2 - r, x, y + r))
    d.append(corner(x, y, x + r, y))
    return "".join(d)


def _arrowhead(x1, y1, x2, y2) -> str:
    """A V at (x2,y2) pointing along (x1,y1)->(x2,y2), as a path `d`.

    Explicit geometry rather than an SVG <marker>: markers that inherit
    context-stroke are rejected by some rasterisers, geometry works anywhere.
    """
    ang = math.atan2(y2 - y1, x2 - x1)
    size, spread = 12.0, math.radians(23)
    pts = [(x2 + size * math.cos(ang + math.pi + s * spread),
            y2 + size * math.sin(ang + math.pi + s * spread))
           for s in (1, -1)]
    return (f"M{pts[0][0]:.1f},{pts[0][1]:.1f} L{x2:.1f},{y2:.1f} "
            f"L{pts[1][0]:.1f},{pts[1][1]:.1f}")


class _Styles:
    """Interns (stroke, width, dash) and text style tuples into CSS classes.

    Every path in a rough render repeats the same ~70 characters of stroke
    attributes. There are only a handful of distinct styles in a scene, so
    interning them cuts the file by roughly a third and makes the markup
    readable. Classes, not <g> groups, because grouping would force us to
    reorder elements and z-order carries meaning here.
    """

    def __init__(self) -> None:
        self._seen: dict[tuple, str] = {}
        self._rules: list[str] = []

    def stroke(self, colour: str, width: float, dashed: bool) -> str:
        key = ("s", colour, width, dashed)
        if key not in self._seen:
            name = f"s{len(self._seen)}"
            self._seen[key] = name
            dash = "stroke-dasharray:9 7;" if dashed else ""
            self._rules.append(
                f".{name}{{fill:none;stroke:{colour};stroke-width:{width};"
                f"stroke-linecap:round;{dash}}}")
        return self._seen[key]

    def text(self, size: int, family: int, colour: str, anchor: str) -> str:
        key = ("t", size, family, colour, anchor)
        if key not in self._seen:
            name = f"t{len(self._seen)}"
            self._seen[key] = name
            # The weight has to be a shorthand TOKEN ("600 30px family"), not a
            # nested declaration, or the whole `font` rule is thrown away.
            # white-space:pre is the SVG2 replacement for xml:space and is what
            # keeps the spaces that set an annotation apart from its method name.
            weight = "600 " if size >= 24 else ""
            self._rules.append(
                f".{name}{{font:{weight}{size}px {FONT.get(family, FONT[2])};"
                f"fill:{colour};text-anchor:{anchor};white-space:pre;}}")
        return self._seen[key]

    def css(self) -> str:
        return "<style>" + "".join(self._rules) + "</style>"


def render(doc: dict, pad: int = 40) -> tuple[str, int, int]:
    els = [e for e in doc["elements"] if not e.get("isDeleted")]
    boxes = [bounds(e) for e in els]
    minx = min(b[0] for b in boxes) - pad
    miny = min(b[1] for b in boxes) - pad
    w = max(b[2] for b in boxes) - minx + pad
    h = max(b[3] for b in boxes) - miny + pad

    st = _Styles()
    body: list[str] = []

    def path(d: str, colour: str, width: float, dashed: bool) -> None:
        body.append(f'<path class="{st.stroke(colour, width, dashed)}" d="{d}"/>')

    bg = doc["appState"].get("viewBackgroundColor", "#ffffff")
    if bg and bg != "transparent":
        body.append(f'<rect width="100%" height="100%" fill="{bg}"/>')

    for e in els:
        x, y = e["x"] - minx, e["y"] - miny
        colour = e["strokeColor"]
        fill = e["backgroundColor"]
        sw = e["strokeWidth"]
        rnd = _rand(e["seed"])
        dashed = e["strokeStyle"] == "dashed"

        if e["type"] == "rectangle":
            r = min(14 if e.get("roundness") else 0,
                    e["width"] / 2, e["height"] / 2)
            if fill != "transparent":
                body.append(f'<rect x="{x:.0f}" y="{y:.0f}" '
                            f'width="{e["width"]:.0f}" '
                            f'height="{e["height"]:.0f}" '
                            f'rx="{r:.0f}" fill="{fill}"/>')
            # Two passes over the same outline is what reads as hand-drawn.
            for amp in (1.0, 1.5):
                path(_rough_rect(x, y, e["width"], e["height"], r, rnd, amp),
                     colour, sw, dashed)

        elif e["type"] == "text":
            size = e["fontSize"]
            anchor = {"left": "start", "center": "middle",
                      "right": "end"}[e["textAlign"]]
            tx = {"start": x, "middle": x + e["width"] / 2,
                  "end": x + e["width"]}[anchor]
            cls = st.text(size, e["fontFamily"], colour, anchor)
            for i, ln in enumerate(e["text"].split("\n")):
                by = y + size * LINE_H * i + size * 0.95
                body.append(f'<text class="{cls}" x="{tx:.0f}" y="{by:.1f}">'
                            f'{escape(ln)}</text>')

        elif e["type"] in ("line", "arrow"):
            pts = [(x + px, y + py) for px, py in e["points"]]
            for a, b in zip(pts, pts[1:]):
                path(_wobble(*a, *b, rnd, amp=1.2), colour, sw, dashed)
            if len(pts) >= 2:
                if e.get("endArrowhead"):
                    path(_arrowhead(*pts[-2], *pts[-1]), colour, sw, False)
                if e.get("startArrowhead"):
                    path(_arrowhead(*pts[1], *pts[0]), colour, sw, False)

    # xml:space on the root is belt-and-braces for rasterisers that predate
    # SVG2; Chrome ignores it and honours white-space:pre from the CSS classes
    # instead, which is why both are set. Whitespace between tags is never
    # rendered in SVG, so preserving it here is harmless.
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" '
            f'height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}" '
            f'xml:space="preserve" role="img" '
            f'aria-label="{escape(doc.get("source", "diagram"))}">')
    return head + st.css() + "".join(body) + "</svg>", int(w), int(h)
