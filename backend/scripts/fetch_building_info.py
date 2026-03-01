#!/usr/bin/env python3
"""Fetch building name, coordinates, and address from maps.unl.edu for each building ID."""
import json
import re
import urllib.request
import urllib.parse

BUILDING_IDS = [
    "ACB", "ANDN", "ANDR", "ANSC", "ARCH", "AVH", "BEAD", "BESY", "BKC", "BL",
    "BURN", "CEMA", "CHA", "CPEH", "CREC", "DINS", "ENTO", "ERC", "FIC", "FOOD",
    "FYH", "GNHS", "HAH", "HARH", "HENZ", "HLH", "JH", "KAUF", "KEIM", "KH",
    "KRH", "LAW", "LLS", "LPH", "M&N", "MANT", "MOLR", "MORR", "NH", "NU",
    "OAC", "OLDH", "OTHM", "PLSH", "RH", "RVB", "SEC", "TEAC", "TEMP", "WAB", "WMB",
]

BASE = "https://maps.unl.edu/building/{}/info?format=partial"

def fetch_building(bid: str) -> dict | None:
    url = BASE.format(urllib.parse.quote(bid, safe=""))
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"id": bid, "error": str(e)}

    if "Building not found" in html:
        return {"id": bid, "error": "Building not found"}

    out = {"id": bid}

    # Title: <h2 class="title ...">...Name...<span ...>(CODE)</span></h2>
    title_match = re.search(
        r'<h2[^>]*class="[^"]*title[^"]*"[^>]*>\s*(.+?)</h2>',
        html, re.DOTALL
    )
    if title_match:
        title_inner = title_match.group(1)
        # Strip span with (CODE)
        code_span = re.search(r'<span[^>]*>\s*\(([A-Z0-9&]+)\)\s*</span>', title_inner)
        if code_span:
            out["shortName"] = code_span.group(1)
        name_part = re.sub(r'<span[^>]*>.*?</span>', '', title_inner)
        name_part = re.sub(r'\s+', ' ', name_part).strip()
        out["name"] = name_part

    # Address: <div class="street-address">...</div>
    addr_match = re.search(r'<div class="street-address">([^<]+)</div>', html)
    if addr_match:
        out["address"] = addr_match.group(1).strip()

    # Coords: data-destination-lat="..." data-destination-lng="..."
    lat_match = re.search(r'data-destination-lat="([^"]+)"', html)
    lng_match = re.search(r'data-destination-lng="([^"]+)"', html)
    if lat_match and lng_match:
        try:
            out["lat"] = float(lat_match.group(1))
            out["lng"] = float(lng_match.group(1))
        except ValueError:
            pass

    return out

def main():
    results = []
    for i, bid in enumerate(BUILDING_IDS):
        print(f"[{i+1}/{len(BUILDING_IDS)}] {bid}...", flush=True)
        results.append(fetch_building(bid))
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
