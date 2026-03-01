#!/usr/bin/env python3
"""
Read building codes from raw_buildings.html, fetch details from maps.unl.edu
for each building, and write the combined data to buildings.json.
"""
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
RAW_HTML_PATH = SCRIPT_DIR / "raw_buildings.html"
BUILDINGS_JSON_PATH = SCRIPT_DIR / "buildings.json"
BASE_URL = "https://maps.unl.edu/building/{}/info?format=partial"


def parse_buildings_from_html(filepath: Path) -> list[dict]:
    """Extract building code, display name, and campus from raw_buildings.html."""
    text = filepath.read_text(encoding="utf-8", errors="replace")
    buildings = []
    # Each <li class="ui-menu-item"> has three spans: buildingCode, format, campus
    for block in re.finditer(
        r'<li class="ui-menu-item">\s*'
        r'<span class="buildingCode[^"]*"[^>]*>([^<]*)</span>\s*'
        r'<span class="format[^"]*"[^>]*>([^<]*)</span>\s*'
        r'<span class="campus[^"]*"[^>]*>([^<]*)</span>\s*'
        r'</li>',
        text,
        re.DOTALL,
    ):
        code = html.unescape(block.group(1).strip())
        display_name = html.unescape(block.group(2).strip())
        campus = html.unescape(block.group(3).strip())
        buildings.append({
            "buildingCode": code,
            "displayName": display_name,
            "campus": campus,
        })
    return buildings


def fetch_building_info(building_code: str) -> dict:
    """Fetch name, address, and coordinates from maps.unl.edu (same as fetch_building_info.py)."""
    url = BASE_URL.format(urllib.parse.quote(building_code, safe=""))
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            html_content = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"error": str(e)}

    if "Building not found" in html_content:
        return {"error": "Building not found"}

    out = {}

    # Title: <h2 class="title ...">...Name...<span ...>(CODE)</span></h2>
    title_match = re.search(
        r'<h2[^>]*class="[^"]*title[^"]*"[^>]*>\s*(.+?)</h2>',
        html_content, re.DOTALL
    )
    if title_match:
        title_inner = title_match.group(1)
        code_span = re.search(r'<span[^>]*>\s*\(([A-Z0-9&]+)\)\s*</span>', title_inner)
        if code_span:
            out["shortName"] = code_span.group(1)
        name_part = re.sub(r'<span[^>]*>.*?</span>', '', title_inner)
        name_part = re.sub(r'\s+', ' ', name_part).strip()
        out["name"] = name_part

    # Address: <div class="street-address">...</div>
    addr_match = re.search(r'<div class="street-address">([^<]+)</div>', html_content)
    if addr_match:
        out["address"] = addr_match.group(1).strip()

    # Coords: data-destination-lat="..." data-destination-lng="..."
    lat_match = re.search(r'data-destination-lat="([^"]+)"', html_content)
    lng_match = re.search(r'data-destination-lng="([^"]+)"', html_content)
    if lat_match and lng_match:
        try:
            out["lat"] = float(lat_match.group(1))
            out["lng"] = float(lng_match.group(1))
        except ValueError:
            pass

    return out


def main():
    print("Reading building codes from raw_buildings.html...")
    from_html = parse_buildings_from_html(RAW_HTML_PATH)
    print(f"Found {len(from_html)} buildings in HTML.")

    results = []
    for i, row in enumerate(from_html):
        code = row["buildingCode"]
        print(f"[{i + 1}/{len(from_html)}] {code}...", flush=True)
        info = fetch_building_info(code)
        entry = {
            "buildingCode": code,
            "displayName": row["displayName"],
            "campus": row["campus"],
        }
        if "error" in info:
            entry["error"] = info["error"]
        else:
            if "name" in info:
                entry["name"] = info["name"]
            if "shortName" in info:
                entry["shortName"] = info["shortName"]
            if "address" in info:
                entry["address"] = info["address"]
            if "lat" in info:
                entry["lat"] = info["lat"]
            if "lng" in info:
                entry["lng"] = info["lng"]
        results.append(entry)

    print(f"Writing {len(results)} buildings to {BUILDINGS_JSON_PATH}...")
    BUILDINGS_JSON_PATH.write_text(
        json.dumps(results, indent=2),
        encoding="utf-8",
    )
    print("Done.")


if __name__ == "__main__":
    main()
