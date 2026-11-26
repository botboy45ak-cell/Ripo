#!/usr/bin/env python3
"""Verify the generated Cueframe prototype without extra Python packages."""
from __future__ import annotations

import json
import struct
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "catalog.json"
ZIP_PATH = ROOT / "downloads" / "cueframe-visual-kit-v0.1-prototype.zip"
EXPECTED_STYLES = {"clear", "pulse", "warm"}
EXPECTED_RATIOS = {"vertical": (1080, 1920), "wide": (1920, 1080)}
REQUIRED_PAGES = {"START-HERE.md", "LICENSE-DRAFT.txt", "ASSET-CATALOG.json", "preview.html", "planner.html"}


def png_info(path: Path) -> tuple[int, int, int]:
    raw = path.read_bytes()
    if raw[:8] != b"\x89PNG\r\n\x1a\n" or raw[12:16] != b"IHDR":
        raise AssertionError(f"Invalid PNG signature/header: {path}")
    width, height = struct.unpack(">II", raw[16:24])
    color_type = raw[25]
    # PNG color types 4 (gray+alpha) and 6 (RGBA) carry alpha. Type 3 may also
    # carry transparency via tRNS, but this generator currently emits RGBA.
    if color_type not in (4, 6):
        raise AssertionError(f"PNG is not alpha-capable (color type {color_type}): {path}")
    return width, height, color_type


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    assets = catalog["assets"]
    if len(assets) != 96:
        raise AssertionError(f"Expected 96 asset exports, got {len(assets)}")
    if set(catalog["styles"]) != EXPECTED_STYLES:
        raise AssertionError("Unexpected style set")
    seen = set()
    for asset in assets:
        key = (asset["ratio"], asset["style"], asset["id"])
        if key in seen:
            raise AssertionError(f"Duplicate catalog entry: {key}")
        seen.add(key)
        if asset["ratio"] not in EXPECTED_RATIOS:
            raise AssertionError(f"Unknown ratio: {asset['ratio']}")
        expected = EXPECTED_RATIOS[asset["ratio"]]
        png = ROOT / asset["png"]
        svg = ROOT / asset["svg_source"]
        if not png.is_file() or not svg.is_file():
            raise AssertionError(f"Missing file for {key}")
        width, height, _ = png_info(png)
        if (width, height) != expected:
            raise AssertionError(f"Unexpected dimensions for {png}: {width}x{height}")
        if (asset["width"], asset["height"]) != expected:
            raise AssertionError(f"Catalog dimensions mismatch for {key}")
    if len({asset["id"] for asset in assets}) != 16:
        raise AssertionError("Expected 16 unique cue types")
    if not ZIP_PATH.is_file():
        raise AssertionError(f"Missing product ZIP: {ZIP_PATH}")
    with zipfile.ZipFile(ZIP_PATH) as archive:
        bad = archive.testzip()
        if bad:
            raise AssertionError(f"Corrupt ZIP member: {bad}")
        names = set(archive.namelist())
        missing = REQUIRED_PAGES - names
        if missing:
            raise AssertionError(f"ZIP missing pages: {sorted(missing)}")
        if sum(name.endswith(".png") for name in names) != 96:
            raise AssertionError("ZIP should contain 96 PNG exports")
        if sum(name.endswith(".svg") for name in names) != 96:
            raise AssertionError("ZIP should contain 96 SVG sources")
        for asset in assets:
            if asset["png"] not in names or asset["svg_source"] not in names:
                raise AssertionError(f"ZIP missing catalog path for {asset['id']}")
    print("Cueframe checks passed: 16 cue types × 3 styles × 2 ratios; 96 transparent PNGs; 96 SVG sources; ZIP integrity and catalog paths valid.")


if __name__ == "__main__":
    main()
