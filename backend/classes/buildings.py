import json
import os
from typing import Any, Dict, List

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARSED_PATH = os.path.join(ROOT, "backend", "classes", "parsed_sections.json")
CAP_PATH = os.path.join(ROOT, "building_capacity.json")
OUT_PATH = os.path.join(ROOT, "frontend", "lib", "map", "generated-buildings.json")


def load_data() -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    with open(PARSED_PATH, "r") as f:
        sections = json.load(f)
    with open(CAP_PATH, "r") as f:
        caps = json.load(f)
    return sections, caps


def build_index(sections: List[Dict[str, Any]], caps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    caps_by_code: Dict[str, Dict[str, Any]] = {
        b.get("buildingCode"): b for b in caps if b.get("buildingCode")
    }

    buildings: Dict[str, Dict[str, Any]] = {}

    for sec in sections:
        code = sec.get("buildingCode")
        if not code or code == "ARR":
            continue
        lat = sec.get("latitude")
        lon = sec.get("longitude")

        if code not in buildings:
            buildings[code] = {
                "id": code,
                "buildingCode": code,
                "name": None,
                "shortName": code,
                "type": "academic",
                "_coords": [],
                "courses": [],
            }

        b = buildings[code]

        # Derive building name (strip trailing room token if it matches)
        bname = sec.get("building")
        room = (sec.get("room") or "").strip()
        if bname and not b["name"]:
            base = bname.strip()
            parts = base.split()
            if room and parts and parts[-1].upper() == room.upper():
                base = " ".join(parts[:-1]) or base
            b["name"] = base

        if lat is not None and lon is not None:
            try:
                b["_coords"].append([float(lon), float(lat)])
            except (TypeError, ValueError):
                pass

        # Append course info
        b["courses"].append(
            {
                "courseLabel": sec.get("courseLabel"),
                "subjectId": sec.get("subjectId"),
                "courseNumber": sec.get("courseNumber"),
                "sectionNumber": sec.get("sectionNumber"),
                "title": sec.get("title"),
                "room": sec.get("room"),
                "capacity": sec.get("capacity"),
                "enrolled": sec.get("enrolled"),
                "classTimes": sec.get("classTimes") or [],
            }
        )

    result: List[Dict[str, Any]] = []
    for code, b in buildings.items():
        coords = b.pop("_coords")
        if not coords:
            # Skip buildings with no geocoded sections
            continue

        lngs = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        center = [sum(lngs) / len(lngs), sum(lats) / len(lats)]

        west, east = min(lngs), max(lngs)
        south, north = min(lats), max(lats)
        buffer = 0.0003
        west -= buffer
        east += buffer
        south -= buffer
        north += buffer

        b["coordinates"] = center
        b["polygon"] = [
            [west, north],
            [east, north],
            [east, south],
            [west, south],
            [west, north],
        ]

        cap_entry = caps_by_code.get(code)
        if cap_entry and isinstance(cap_entry.get("totalBuildingCapacity"), (int, float)):
            b["capacity"] = cap_entry["totalBuildingCapacity"]
        else:
            b["capacity"] = 0

        if not b["name"]:
            b["name"] = code

        b["hours"] = "See schedule"
        b["description"] = f"Aggregated activity for {b['name']} ({code})"

        result.append(b)

    return result


def main() -> None:
    sections, caps = load_data()
    buildings = build_index(sections, caps)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(buildings, f, indent=2)
    print(f"Wrote {len(buildings)} buildings to {OUT_PATH}")


if __name__ == "__main__":
    main()
