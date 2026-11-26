#!/usr/bin/env python3
"""Build Cueframe's original, transparent PNG/SVG overlay assets and delivery ZIP.

All artwork is drawn from local SVG primitives; no stock assets or external fonts.
Requires @resvg/resvg-js for PNG rendering: npm ci --prefix products/cueframe/tools
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import zipfile
from pathlib import Path

RENDER_JOBS: list[dict] = []

ROOT = Path(__file__).resolve().parents[1]
PNG_ROOT = ROOT / "assets" / "png"
SVG_ROOT = ROOT / "assets" / "svg"
DOWNLOADS = ROOT / "downloads"

STYLES = {
    "clear": {
        "label": "Clear",
        "audience": "Tutorials, explainers, learning, product demos",
        "description": "Quiet structure, high contrast, and cool accents.",
        "surface": "#101B2B",
        "surface2": "#17283D",
        "accent": "#63D9F4",
        "accent2": "#C6F17B",
        "ink": "#F6FBFF",
        "muted": "#B9D1DF",
        "line": "#E9F7FF",
        "radius": 28,
        "cut": False,
    },
    "pulse": {
        "label": "Pulse",
        "audience": "Gaming, tech, reactions, energetic edits",
        "description": "Angular framing, electric color, and punchy markers.",
        "surface": "#160E2A",
        "surface2": "#26163F",
        "accent": "#FF5F9E",
        "accent2": "#69F4D2",
        "ink": "#FFF7FC",
        "muted": "#D7C5E8",
        "line": "#FFF7FC",
        "radius": 16,
        "cut": True,
    },
    "warm": {
        "label": "Warm",
        "audience": "Lifestyle, food, travel, personal stories",
        "description": "Soft corners, warm highlights, and calm contrast.",
        "surface": "#251916",
        "surface2": "#39241F",
        "accent": "#FFC66B",
        "accent2": "#FF806D",
        "ink": "#FFF6E8",
        "muted": "#E7CDBA",
        "line": "#FFF6E8",
        "radius": 34,
        "cut": False,
    },
}

ASSETS = [
    ("hook-frame", "Hook frame", "Opening", "Frame a short opening line or visual hook without baking in language."),
    ("chapter-tag", "Chapter tag", "Structure", "Mark a new section, location, or topic; add your own label above it."),
    ("step-1", "Step rail · 1", "Structure", "Show the first stage of a three-part tutorial or process."),
    ("step-2", "Step rail · 2", "Structure", "Show the second stage of a three-part tutorial or process."),
    ("step-3", "Step rail · 3", "Structure", "Show the final stage of a three-part tutorial or process."),
    ("focus-frame", "Focus frame", "Emphasis", "Direct attention to a detail in footage or a screen recording."),
    ("highlight-swipe", "Highlight swipe", "Emphasis", "Place a bright underline or marker behind a key detail."),
    ("pointer-callout", "Pointer callout", "Emphasis", "Point from a compact cue to a product, interface, or object."),
    ("compare-pair", "Compare pair", "Compare", "Set up a before/after, option A/B, or two-part comparison."),
    ("question-card", "Question cue", "Explain", "Introduce a question, quiz, or viewer prompt."),
    ("answer-card", "Answer cue", "Explain", "Signal a reveal, solution, or completed step."),
    ("recap-stack", "Recap stack", "Explain", "Create a visual wrap-up for a short list of takeaways."),
    ("progress-dots", "Progress dots", "Structure", "Show progress through a short sequence or explanation."),
    ("rank-bars", "Rank bars", "Compare", "Support a simple ranking, rating, or quick comparison."),
    ("location-tag", "Location tag", "Story", "Label a place, scene, or chapter in a vlog or demo."),
    ("end-card", "End card", "Closing", "Give a closing line or next-step prompt a consistent frame."),
]

USE_CASES = {
    "tutorial": {
        "label": "Tutorial / learning",
        "headline": "Make the steps easy to follow",
        "copy": "A cue for the opening, step order, key detail, and recap.",
        "steps": ["hook-frame", "step-1", "focus-frame", "recap-stack"],
    },
    "demo": {
        "label": "Product / app demo",
        "headline": "Point out what matters",
        "copy": "Frame a feature, guide the eye, then compare or close.",
        "steps": ["chapter-tag", "pointer-callout", "compare-pair", "end-card"],
    },
    "story": {
        "label": "Lifestyle / story",
        "headline": "Add rhythm without a preset",
        "copy": "Mark a location, make a reveal, and keep the ending clean.",
        "steps": ["location-tag", "question-card", "answer-card", "end-card"],
    },
}


def f(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")


def svg_start(w: int, h: int) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        '<defs>',
        '<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">',
        '<stop offset="0" stop-color="var(--a)"/>',
        '<stop offset="1" stop-color="var(--b)"/>',
        '</linearGradient>',
        '</defs>',
    ]


def rect(x: float, y: float, w: float, h: float, fill: str, rx: float = 0,
         opacity: float = 1, stroke: str | None = None, sw: float = 1) -> str:
    attr = f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{fill}"'
    if rx:
        attr += f' rx="{f(rx)}"'
    if opacity < 1:
        attr += f' fill-opacity="{f(opacity)}"'
    if stroke:
        attr += f' stroke="{stroke}" stroke-width="{f(sw)}" stroke-linejoin="round"'
    return f'<rect {attr}/>'


def circle(cx: float, cy: float, r: float, fill: str, opacity: float = 1,
           stroke: str | None = None, sw: float = 1) -> str:
    attr = f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}"'
    if opacity < 1:
        attr += f' fill-opacity="{f(opacity)}"'
    if stroke:
        attr += f' stroke="{stroke}" stroke-width="{f(sw)}"'
    return f'<circle {attr}/>'


def path(d: str, stroke: str, sw: float, fill: str = "none", opacity: float = 1,
         cap: str = "round", join: str = "round") -> str:
    return (f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{f(sw)}" '
            f'stroke-linecap="{cap}" stroke-linejoin="{join}" opacity="{f(opacity)}"/>')


def polygon(points: list[tuple[float, float]], fill: str, opacity: float = 1) -> str:
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in points)
    return f'<polygon points="{pts}" fill="{fill}" fill-opacity="{f(opacity)}"/>'


def add_panel(parts: list[str], x: float, y: float, w: float, h: float,
              theme: dict, accent: str | None = None, variant: int = 0) -> None:
    a = accent or theme["accent"]
    radius = theme["radius"]
    if theme["cut"]:
        c = min(24, min(w, h) * 0.11)
        d = (f"M {f(x+c)} {f(y)} H {f(x+w-c)} L {f(x+w)} {f(y+c)} "
             f"V {f(y+h-c)} L {f(x+w-c)} {f(y+h)} H {f(x+c)} "
             f"L {f(x)} {f(y+h-c)} V {f(y+c)} Z")
        parts.append(f'<path d="{d}" fill="{theme["surface"]}" fill-opacity="0.96" stroke="{a}" stroke-width="4"/>')
        parts.append(f'<path d="M {f(x+18)} {f(y+8)} H {f(x+w*0.28)}" stroke="{theme["accent2"]}" stroke-width="7" stroke-linecap="square"/>')
    else:
        parts.append(rect(x, y, w, h, theme["surface"], radius, 0.96, a, 4))
        parts.append(rect(x+18, y+18, min(14, w*0.025), max(24, h-36), theme["accent2"], min(7, radius/3), 0.98))
    # Tiny corner signals make the panel feel like a finished edit element, not an empty card.
    dot_r = max(5, min(w, h) * 0.018)
    if variant % 2 == 0:
        parts.append(circle(x+w-28, y+27, dot_r, theme["accent2"]))
    else:
        parts.append(circle(x+w-28, y+27, dot_r, a))


def icon_check(parts: list[str], cx: float, cy: float, r: float, theme: dict) -> None:
    parts.append(circle(cx, cy, r, theme["accent2"], 1))
    parts.append(path(f"M {f(cx-r*.45)} {f(cy)} l {f(r*.3)} {f(r*.32)} l {f(r*.65)} {f(-r*.72)}",
                      theme["surface"], max(4, r*.19)))


def icon_question(parts: list[str], cx: float, cy: float, r: float, theme: dict) -> None:
    parts.append(circle(cx, cy, r, theme["accent"], 1))
    # A geometric question symbol, deliberately not tied to a font.
    parts.append(path(
        f"M {f(cx-r*.35)} {f(cy-r*.2)} C {f(cx-r*.25)} {f(cy-r*.63)}, {f(cx+r*.38)} {f(cy-r*.62)}, {f(cx+r*.38)} {f(cy-r*.16)} "
        f"C {f(cx+r*.38)} {f(cy+r*.10)}, {f(cx+r*.02)} {f(cy+r*.12)}, {f(cx+r*.02)} {f(cy+r*.42)}",
        theme["surface"], max(4, r*.15)))
    parts.append(circle(cx+r*.02, cy+r*.68, max(3, r*.08), theme["surface"]))


def icon_arrow(parts: list[str], cx: float, cy: float, r: float, theme: dict, color: str | None = None) -> None:
    c = color or theme["ink"]
    parts.append(path(f"M {f(cx-r*.55)} {f(cy)} H {f(cx+r*.45)} M {f(cx+r*.05)} {f(cy-r*.4)} L {f(cx+r*.48)} {f(cy)} L {f(cx+r*.05)} {f(cy+r*.4)}",
                      c, max(4, r*.14)))


def icon_pin(parts: list[str], cx: float, cy: float, r: float, theme: dict) -> None:
    d = (f"M {f(cx)} {f(cy+r)} C {f(cx-r*.18)} {f(cy+r*.55)}, {f(cx-r*.72)} {f(cy+r*.08)}, {f(cx-r*.72)} {f(cy-r*.24)} "
         f"A {f(r*.72)} {f(r*.72)} 0 1 1 {f(cx+r*.72)} {f(cy-r*.24)} "
         f"C {f(cx+r*.72)} {f(cy+r*.08)}, {f(cx+r*.18)} {f(cy+r*.55)}, {f(cx)} {f(cy+r)} Z")
    parts.append(f'<path d="{d}" fill="{theme["accent"]}"/>')
    parts.append(circle(cx, cy-r*.24, r*.21, theme["surface"]))


def icon_play(parts: list[str], cx: float, cy: float, r: float, theme: dict) -> None:
    parts.append(circle(cx, cy, r, theme["accent"], 1))
    parts.append(polygon([(cx-r*.18, cy-r*.38), (cx+r*.42, cy), (cx-r*.18, cy+r*.38)], theme["surface"]))


def canvas_meta(w: int, h: int) -> dict:
    short = min(w, h)
    # Common content-safe margins; these are design margins, not platform UI guarantees.
    margin = short * (0.075 if h > w else 0.055)
    return {"w": w, "h": h, "s": short, "mx": margin, "my": margin}


def compose_asset(asset_id: str, theme_key: str, w: int, h: int) -> str:
    theme = STYLES[theme_key]
    m = canvas_meta(w, h)
    W, H, s, mx, my = m["w"], m["h"], m["s"], m["mx"], m["my"]
    parts = svg_start(w, h)
    a, b = theme["accent"], theme["accent2"]
    sw = max(5, s * 0.006)

    if asset_id == "hook-frame":
        x, y, bw, bh = W*.09, H*.12, W*.82, H*.17
        add_panel(parts, x, y, bw, bh, theme, a, 0)
        # Four open corner brackets leave the center clean for the buyer's own title.
        c = min(bw, bh) * .18
        inset = 22
        for px, py, dx, dy in [
            (x+inset, y+inset, 1, 1), (x+bw-inset, y+inset, -1, 1),
            (x+inset, y+bh-inset, 1, -1), (x+bw-inset, y+bh-inset, -1, -1),
        ]:
            parts.append(path(f"M {f(px)} {f(py+dy*c)} V {f(py)} H {f(px+dx*c)}", b, sw*1.5))
        parts.append(circle(x+bw*.86, y+bh*.72, sw*1.8, a))

    elif asset_id == "chapter-tag":
        x, y, bw, bh = W*.075, H*.105, W*.54, H*.105
        add_panel(parts, x, y, bw, bh, theme, a, 1)
        # Keep the label zone clear; the accent notch is a cue, not fake sample text.
        parts.append(rect(x+bw*.69, y+bh*.38, bw*.055, bh*.24, a, bh*.10, .95))
        parts.append(circle(x+bw*.86, y+bh*.5, bh*.17, b))

    elif asset_id.startswith("step-"):
        active = int(asset_id[-1]) - 1
        x, y, bw, bh = W*.09, H*.73, W*.82, H*.12
        add_panel(parts, x, y, bw, bh, theme, a, active)
        cy = y + bh*.5
        left = x + bw*.22
        right = x + bw*.80
        spacing = (right-left)/2
        parts.append(path(f"M {f(left)} {f(cy)} H {f(right)}", theme["muted"], sw*1.35, opacity=.65))
        for i in range(3):
            cx = left + spacing*i
            if i == active:
                parts.append(circle(cx, cy, bh*.19, b))
                parts.append(circle(cx, cy, bh*.29, "none", 1, b, sw*.9))
            else:
                parts.append(circle(cx, cy, bh*.12, theme["surface2"], 1, theme["muted"], sw*.8))
            parts.append(circle(cx, cy+bh*.31, max(4, sw*.55), a if i <= active else theme["muted"], .95))

    elif asset_id == "focus-frame":
        x, y, bw, bh = W*.10, H*.29, W*.80, H*.34
        c = min(bw, bh)*.15
        # Crisp corner marks; no opaque center, so footage stays visible.
        for px, py, dx, dy in [
            (x, y, 1, 1), (x+bw, y, -1, 1), (x, y+bh, 1, -1), (x+bw, y+bh, -1, -1),
        ]:
            parts.append(path(f"M {f(px+dx*c)} {f(py)} H {f(px)} V {f(py+dy*c)}", a, sw*1.8))
        # Offset secondary marks create a clear visual system and remain visible on bright footage.
        for px, py, dx, dy in [
            (x+sw*2, y+sw*2, 1, 1), (x+bw-sw*2, y+sw*2, -1, 1),
            (x+sw*2, y+bh-sw*2, 1, -1), (x+bw-sw*2, y+bh-sw*2, -1, -1),
        ]:
            parts.append(path(f"M {f(px+dx*c*.45)} {f(py)} H {f(px)} V {f(py+dy*c*.45)}", b, sw*.72, opacity=.95))
        parts.append(circle(x+bw*.5, y+bh*.5, sw*1.2, a, .95))

    elif asset_id == "highlight-swipe":
        bw, bh = W*.76, H*.082
        x, y = (W-bw)/2, H*.485
        # Text-free, semi-transparent marker stroke for a key word or small detail.
        if theme["cut"]:
            points = [(x, y+bh*.28), (x+bw*.10, y), (x+bw, y+bh*.14), (x+bw*.95, y+bh*.82), (x+bw*.08, y+bh), (x, y+bh*.28)]
            parts.append(polygon(points, a, .72))
            parts.append(path(f"M {f(x+bw*.12)} {f(y+bh*.78)} Q {f(x+bw*.45)} {f(y+bh*.9)} {f(x+bw*.86)} {f(y+bh*.67)}", b, sw*.85, opacity=.9))
        else:
            parts.append(rect(x, y+bh*.16, bw, bh*.60, a, bh*.3, .60))
            parts.append(path(f"M {f(x+bw*.06)} {f(y+bh*.84)} Q {f(x+bw*.42)} {f(y+bh*.96)} {f(x+bw*.93)} {f(y+bh*.78)}", b, sw*.75, opacity=.96))
            parts.append(circle(x+bw*.93, y+bh*.14, sw*1.1, b))

    elif asset_id == "pointer-callout":
        x, y, bw, bh = W*.11, H*.35, W*.78, H*.27
        # Compact label anchor and a clean arrow toward a detail in the shot.
        px, py, pw, ph = x, y+bh*.37, bw*.43, bh*.44
        add_panel(parts, px, py, pw, ph, theme, a, 2)
        # A compact target icon marks the cue; keep the label area empty for localized text.
        parts.append(circle(px+pw*.24, py+ph*.5, ph*.14, a, .95))
        parts.append(circle(px+pw*.24, py+ph*.5, ph*.055, theme["surface"]))
        start_x, start_y = px+pw, py+ph*.52
        end_x, end_y = W*.79, y+bh*.05
        parts.append(path(f"M {f(start_x)} {f(start_y)} C {f(start_x+bw*.18)} {f(start_y-bh*.2)}, {f(end_x-bw*.12)} {f(end_y+bh*.20)}, {f(end_x)} {f(end_y)}", b, sw*1.45))
        parts.append(circle(end_x, end_y, sw*2.2, theme["surface"], 1, a, sw*.8))
        parts.append(circle(end_x, end_y, sw*.8, a))
        parts.append(path(f"M {f(end_x-sw*1.8)} {f(end_y-sw*2.6)} L {f(end_x)} {f(end_y)} L {f(end_x+sw*3.2)} {f(end_y-sw*1.2)}", b, sw*.9))

    elif asset_id == "compare-pair":
        y, bh = H*.71, H*.145
        gap = W*.035
        bw = (W*.84-gap)/2
        x1, x2 = W*.08, W*.08+bw+gap
        add_panel(parts, x1, y, bw, bh, theme, a, 0)
        add_panel(parts, x2, y, bw, bh, theme, b, 1)
        cy = y+bh*.5
        r = bh*.19
        parts.append(circle(x1+bw*.25, cy, r, a))
        # Small comparison spark inside the first badge.
        parts.append(path(f"M {f(x1+bw*.25-r*.4)} {f(cy)} H {f(x1+bw*.25+r*.4)}", theme["surface"], sw*.8))
        parts.append(circle(x2+bw*.25, cy, r, b))
        icon_check(parts, x2+bw*.25, cy, r*.53, theme)
        parts.append(path(f"M {f(x1+bw*.48)} {f(cy)} H {f(x2+bw*.06)}", theme["muted"], sw*.9))
        parts.append(circle(W*.5, cy, bh*.18, theme["surface2"], 1, theme["ink"], sw*.7))
        icon_arrow(parts, W*.5, cy, bh*.12, theme, theme["ink"])

    elif asset_id == "question-card":
        x, y, bw, bh = W*.08, H*.16, W*.84, H*.18
        add_panel(parts, x, y, bw, bh, theme, a, 1)
        r = bh*.27
        icon_question(parts, x+bw*.18, y+bh*.5, r, theme)
        # The open panel area is intentionally left clear for the user's own words.

    elif asset_id == "answer-card":
        x, y, bw, bh = W*.08, H*.72, W*.84, H*.16
        add_panel(parts, x, y, bw, bh, theme, b, 0)
        r = bh*.27
        icon_check(parts, x+bw*.18, y+bh*.5, r, theme)
        # The right side is open for a short, editable answer.)

    elif asset_id == "recap-stack":
        x, y, bw, bh = W*.08, H*.61, W*.84, H*.245
        add_panel(parts, x, y, bw, bh, theme, a, 2)
        for i in range(3):
            cy = y+bh*(.27+i*.235)
            r = bh*.065
            parts.append(circle(x+bw*.18, cy, r, b if i == 0 else a, .98))
            if i == 0:
                parts.append(path(f"M {f(x+bw*.18-r*.45)} {f(cy)} l {f(r*.3)} {f(r*.32)} l {f(r*.65)} {f(-r*.72)}", theme["surface"], sw*.52))
            # Leave the row to the right open for the editor's own recap text.

    elif asset_id == "progress-dots":
        x, y, bw, bh = W*.12, H*.885, W*.76, max(H*.025, s*.035)
        cy = y+bh*.5
        parts.append(path(f"M {f(x)} {f(cy)} H {f(x+bw)}", theme["muted"], sw*.9, opacity=.45))
        for i in range(5):
            cx = x+bw*i/4
            r = bh*.34 if i in (0, 4) else bh*.25
            color = b if i == 2 else theme["surface"]
            parts.append(circle(cx, cy, r, color, 1, a if i == 2 else theme["muted"], sw*.55))
        parts.append(rect(x+bw*.39, y+bh*1.2, bw*.22, max(4, sw*.6), a, sw*.3, .75))

    elif asset_id == "rank-bars":
        x, y, bw, bh = W*.13, H*.72, W*.74, H*.17
        add_panel(parts, x, y, bw, bh, theme, a, 0)
        base_y = y+bh*.77
        bar_w = bw*.11
        positions = [x+bw*.31, x+bw*.50, x+bw*.69]
        heights = [bh*.31, bh*.52, bh*.76]
        for i, (cx, height) in enumerate(zip(positions, heights)):
            parts.append(rect(cx-bar_w/2, base_y-height, bar_w, height, b if i == 2 else a, bar_w*.28, .88))
            parts.append(circle(cx, base_y-height-sw, sw*1.15, theme["ink"], .95))
        parts.append(path(f"M {f(x+bw*.17)} {f(base_y)} H {f(x+bw*.83)}", theme["muted"], sw*.6, opacity=.6))

    elif asset_id == "location-tag":
        x, y, bw, bh = W*.075, H*.105, W*.62, H*.11
        add_panel(parts, x, y, bw, bh, theme, b, 2)
        icon_pin(parts, x+bw*.18, y+bh*.5, bh*.25, theme)
        # Keep the label plate empty so the creator can localize it.)

    elif asset_id == "end-card":
        x, y, bw, bh = W*.08, H*.73, W*.84, H*.16
        add_panel(parts, x, y, bw, bh, theme, b, 1)
        r = bh*.30
        icon_play(parts, x+bw*.19, y+bh*.5, r, theme)
        parts.append(circle(x+bw*.86, y+bh*.5, bh*.045, a))
        # The open center is left clear for the creator's editable closing line.

    else:
        raise KeyError(asset_id)

    parts.append("</svg>")
    # Convert theme tokens in the shared gradient definition into concrete color stops.
    return "\n".join(parts).replace('var(--a)', a).replace('var(--b)', b)


def write_asset(asset_id: str, style_key: str, ratio_key: str, w: int, h: int) -> dict:
    svg = compose_asset(asset_id, style_key, w, h)
    svg_path = SVG_ROOT / ratio_key / style_key / f"{asset_id}.svg"
    png_path = PNG_ROOT / ratio_key / style_key / f"{asset_id}.png"
    svg_path.parent.mkdir(parents=True, exist_ok=True)
    png_path.parent.mkdir(parents=True, exist_ok=True)
    svg_path.write_text(svg, encoding="utf-8")
    RENDER_JOBS.append({"svg": str(svg_path), "png": str(png_path), "width": w, "height": h})
    return {
        "id": asset_id,
        "title": next(item[1] for item in ASSETS if item[0] == asset_id),
        "category": next(item[2] for item in ASSETS if item[0] == asset_id),
        "description": next(item[3] for item in ASSETS if item[0] == asset_id),
        "style": style_key,
        "style_label": STYLES[style_key]["label"],
        "ratio": ratio_key,
        "width": w,
        "height": h,
        "png": f"assets/png/{ratio_key}/{style_key}/{asset_id}.png",
        "svg_source": f"assets/svg/{ratio_key}/{style_key}/{asset_id}.svg",
    }


def build_catalog() -> dict:
    records = []
    RENDER_JOBS.clear()
    for ratio_key, w, h in [("vertical", 1080, 1920), ("wide", 1920, 1080)]:
        for style_key in STYLES:
            for asset_id, *_ in ASSETS:
                records.append(write_asset(asset_id, style_key, ratio_key, w, h))
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False) as job_file:
        json.dump(RENDER_JOBS, job_file)
        jobs_path = Path(job_file.name)
    try:
        subprocess.run(["node", str(ROOT / "tools" / "render_svg.cjs"), str(jobs_path)], cwd=ROOT / "tools", check=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        raise SystemExit("PNG export failed. Run `npm ci --prefix products/cueframe/tools` first.") from exc
    finally:
        jobs_path.unlink(missing_ok=True)
    catalog = {
        "product": "Cueframe: Cross-Device Short-Form Visual Cue Kit",
        "version": "0.1 prototype",
        "generated": "2026-11-26",
        "formats": ["transparent PNG", "editable SVG source"],
        "ratios": {"vertical": "9:16 · 1080×1920", "wide": "16:9 · 1920×1080"},
        "styles": STYLES,
        "assets": records,
        "use_cases": USE_CASES,
    }
    (ROOT / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    return catalog


def build_download(catalog: dict) -> Path:
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    output = DOWNLOADS / "cueframe-visual-kit-v0.1-prototype.zip"
    packaged = ROOT / "package-staging"
    if packaged.exists():
        import shutil
        shutil.rmtree(packaged)
    packaged.mkdir(parents=True)
    (packaged / "START-HERE.md").write_text((ROOT / "docs" / "START-HERE.md").read_text(encoding="utf-8"), encoding="utf-8")
    (packaged / "LICENSE-DRAFT.txt").write_text((ROOT / "docs" / "LICENSE-DRAFT.txt").read_text(encoding="utf-8"), encoding="utf-8")
    (packaged / "ASSET-CATALOG.json").write_text((ROOT / "catalog.json").read_text(encoding="utf-8"), encoding="utf-8")
    for folder_name in ["mobile", "desktop", "universal"]:
        target = packaged / "guides" / folder_name
        target.mkdir(parents=True, exist_ok=True)
        guide = ROOT / "docs" / f"{folder_name}.md"
        (target / "README.md").write_text(guide.read_text(encoding="utf-8"), encoding="utf-8")
    if (ROOT / "preview.html").exists():
        (packaged / "preview.html").write_text((ROOT / "preview.html").read_text(encoding="utf-8"), encoding="utf-8")
    if (ROOT / "planner.html").exists():
        (packaged / "planner.html").write_text((ROOT / "planner.html").read_text(encoding="utf-8"), encoding="utf-8")
    # Buyers receive PNGs in easy-to-find aspect-ratio/style folders plus optional editable SVG source.
    for source_root, dest_name in [(PNG_ROOT, "assets/png"), (SVG_ROOT, "assets/svg")]:
        dest_root = packaged / dest_name
        for path_obj in source_root.rglob("*"):
            if path_obj.is_file():
                rel = path_obj.relative_to(source_root)
                dest = dest_root / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(path_obj.read_bytes())
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=8) as zf:
        for path_obj in sorted(packaged.rglob("*")):
            if path_obj.is_file():
                zf.write(path_obj, path_obj.relative_to(packaged))
    import shutil
    shutil.rmtree(packaged)
    return output


def main() -> None:
    catalog = build_catalog()
    if (ROOT / "docs" / "START-HERE.md").exists():
        archive = build_download(catalog)
        print(f"Generated {len(catalog['assets'])} PNGs and SVG sources")
        print(f"Delivery ZIP: {archive} ({archive.stat().st_size:,} bytes)")
    else:
        print(f"Generated {len(catalog['assets'])} PNGs and SVG sources; add docs/START-HERE.md before packaging.")


if __name__ == "__main__":
    main()
