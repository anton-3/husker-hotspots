from __future__ import annotations

import json
import math
from functools import lru_cache
from datetime import datetime
from pathlib import Path
from typing import Dict, List

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
WEEKDAY_TO_CODE = {
    "Sunday": "U",
    "Monday": "M",
    "Tuesday": "T",
    "Wednesday": "W",
    "Thursday": "R",
    "Friday": "F",
    "Saturday": "S",
}

DEFAULT_BOUNDS = {
    "southwest": [-96.708, 40.812],
    "northeast": [-96.69, 40.825],
}

PRE_ARRIVAL_MINUTES = 20.0
POST_CLASS_LINGER_MINUTES = 55.0
POST_CLASS_HALF_LIFE_MINUTES = 20.0
POST_CLASS_MAX_SPREAD_MULTIPLIER = 1.65
TIME_INTERPOLATION_OFFSETS = (-7.5, 0.0, 7.5)
TIME_INTERPOLATION_WEIGHTS = (0.2, 0.6, 0.2)


def _normalize_requested_time(requested_time: str) -> str:
    hour, minute = [int(x) for x in requested_time.split(":")]
    snapped = int(round(minute / 15.0) * 15)
    if snapped == 60:
        hour = (hour + 1) % 24
        snapped = 0
    return f"{hour:02d}:{snapped:02d}"


def _minutes_from_hhmm(hhmm: str) -> int:
    parsed = datetime.strptime(hhmm, "%H:%M")
    return parsed.hour * 60 + parsed.minute


def _load_sections(classes_dir: Path) -> List[Dict[str, object]]:
    filepath = classes_dir / "parsed_sections.json"
    with filepath.open("r", encoding="utf-8") as file:
        return json.load(file)


def _normalize_days(days: str) -> str:
    return "".join(ch for ch in days.upper().strip() if ch in {"U", "M", "T", "W", "R", "F", "S"})


@lru_cache(maxsize=1)
def _load_section_index(classes_dir_str: str) -> Dict[str, object]:
    classes_dir = Path(classes_dir_str)
    sections = _load_sections(classes_dir)

    indexed_sections: List[Dict[str, object]] = []
    geocoded_sections = 0
    scheduled_sections = 0

    for section in sections:
        if not isinstance(section, dict):
            continue

        lat = section.get("latitude")
        lng = section.get("longitude")
        if not isinstance(lat, (float, int)) or not isinstance(lng, (float, int)):
            continue
        geocoded_sections += 1

        class_times = section.get("classTimes")
        if not isinstance(class_times, list):
            continue

        meetings: List[Dict[str, object]] = []
        for class_time in class_times:
            if not isinstance(class_time, dict):
                continue

            days = class_time.get("days")
            start_time = class_time.get("startTime")
            end_time = class_time.get("endTime")
            if not isinstance(days, str) or not isinstance(start_time, str) or not isinstance(end_time, str):
                continue

            normalized_days = _normalize_days(days)
            if not normalized_days:
                continue

            start_minutes = _minutes_from_hhmm(start_time)
            end_minutes = _minutes_from_hhmm(end_time)
            if end_minutes <= start_minutes:
                continue

            meetings.append(
                {
                    "days": normalized_days,
                    "start": start_minutes,
                    "end": end_minutes,
                }
            )

        if not meetings:
            continue

        scheduled_sections += 1
        indexed_sections.append(
            {
                "lat": float(lat),
                "lng": float(lng),
                "building_key": str(section.get("buildingCode") or section.get("location") or "UNKNOWN"),
                "enrolled": section.get("enrolled"),
                "capacity": section.get("capacity"),
                "meetings": meetings,
            }
        )

    return {
        "sections": indexed_sections,
        "stats": {
            "total_sections": len(sections),
            "geocoded_sections": geocoded_sections,
            "scheduled_geocoded_sections": scheduled_sections,
        },
    }


def _estimate_section_people(enrolled: object, capacity: object, attendance_ratio: float) -> int:
    if isinstance(enrolled, int) and enrolled > 0:
        return max(1, round(enrolled * attendance_ratio))
    if isinstance(capacity, int) and capacity > 0:
        return max(1, round(capacity * 0.6 * attendance_ratio))
    return 0


def _meeting_presence_weight(
    meeting: Dict[str, object],
    weekday_code: str,
    query_minutes: float,
) -> tuple[float, float]:
    days = str(meeting["days"])
    if weekday_code not in days:
        return 0.0, 1.0

    start_minutes = float(meeting["start"])
    end_minutes = float(meeting["end"])

    if query_minutes < start_minutes - PRE_ARRIVAL_MINUTES:
        return 0.0, 1.0

    if start_minutes - PRE_ARRIVAL_MINUTES <= query_minutes < start_minutes:
        ramp_fraction = (query_minutes - (start_minutes - PRE_ARRIVAL_MINUTES)) / max(PRE_ARRIVAL_MINUTES, 1e-9)
        return max(0.0, min(1.0, 0.22 + 0.78 * ramp_fraction)), 1.0

    if start_minutes <= query_minutes < end_minutes:
        return 1.0, 1.0

    minutes_after_end = query_minutes - end_minutes
    if 0.0 <= minutes_after_end <= POST_CLASS_LINGER_MINUTES:
        decay = 0.5 ** (minutes_after_end / max(POST_CLASS_HALF_LIFE_MINUTES, 1e-9))
        spread_gain = (POST_CLASS_MAX_SPREAD_MULTIPLIER - 1.0) * (1.0 - decay)
        return decay, 1.0 + spread_gain

    return 0.0, 1.0


def _section_presence_and_spread(
    meetings: List[Dict[str, object]],
    weekday_code: str,
    slot_minutes: int,
) -> tuple[float, float]:
    smoothed_presence = 0.0
    smoothed_spread = 0.0
    total_weight = 0.0

    for offset, interp_weight in zip(TIME_INTERPOLATION_OFFSETS, TIME_INTERPOLATION_WEIGHTS):
        query_minutes = slot_minutes + offset
        best_presence = 0.0
        best_spread = 1.0

        for meeting in meetings:
            presence, spread_mult = _meeting_presence_weight(meeting, weekday_code, query_minutes)
            if presence > best_presence:
                best_presence = presence
                best_spread = spread_mult

        smoothed_presence += best_presence * interp_weight
        smoothed_spread += best_spread * interp_weight
        total_weight += interp_weight

    if total_weight <= 0:
        return 0.0, 1.0

    return smoothed_presence / total_weight, smoothed_spread / total_weight


def generate_people_density_field(
    requested_time: str,
    weekday: str,
    southwest: List[float] | None = None,
    northeast: List[float] | None = None,
    cols: int = 120,
    rows: int = 90,
    spread: float = 0.32,
    attendance_ratio: float = 0.82,
) -> Dict[str, object]:
    """
    Return estimated people density from active classes over the requested bounds.

    Output fields:
      - bounds: southwest/northeast
      - resolution: cols/rows
      - lng_axis: longitude per column
      - lat_axis: latitude per row
      - people_field: 2D array (rows x cols) with estimated people density values
    """
    if weekday not in WEEKDAYS:
        raise ValueError(f"weekday must be one of: {', '.join(WEEKDAYS)}")
    if cols < 2 or rows < 2:
        raise ValueError("cols and rows must be >= 2")
    if not (0.015 <= spread <= 1.0):
        raise ValueError("spread must be between 0.015 and 1.0")
    if not (0.2 <= attendance_ratio <= 1.0):
        raise ValueError("attendance_ratio must be between 0.2 and 1.0")

    sw = southwest if southwest is not None else DEFAULT_BOUNDS["southwest"]
    ne = northeast if northeast is not None else DEFAULT_BOUNDS["northeast"]
    slot = _normalize_requested_time(requested_time)
    slot_minutes = _minutes_from_hhmm(slot)
    weekday_code = WEEKDAY_TO_CODE[weekday]

    classes_dir = Path(__file__).resolve().parent
    section_index = _load_section_index(str(classes_dir))
    sections = section_index["sections"]
    parse_stats = section_index["stats"]

    by_building: Dict[str, Dict[str, object]] = {}
    for section in sections:
        if not isinstance(section, dict):
            continue

        meetings = section.get("meetings")
        if not isinstance(meetings, list):
            continue
        section_presence, section_spread_mult = _section_presence_and_spread(meetings, weekday_code, slot_minutes)
        if section_presence <= 0.01:
            continue

        estimated_people = _estimate_section_people(
            section["enrolled"],
            section["capacity"],
            attendance_ratio,
        )
        adjusted_people = estimated_people * section_presence
        if adjusted_people <= 0.05:
            continue

        building_key = str(section["building_key"])

        if building_key not in by_building:
            by_building[building_key] = {
                "key": building_key,
                "lat": float(section["lat"]),
                "lng": float(section["lng"]),
                "estimated_people": 0.0,
                "active_sections": 0,
                "avg_spread_multiplier": 1.0,
                "_spread_weight": 0.0,
            }

        by_building[building_key]["estimated_people"] = float(by_building[building_key]["estimated_people"]) + adjusted_people
        by_building[building_key]["active_sections"] = int(by_building[building_key]["active_sections"]) + 1
        by_building[building_key]["avg_spread_multiplier"] = (
            float(by_building[building_key]["avg_spread_multiplier"])
            + section_spread_mult * adjusted_people
        )
        by_building[building_key]["_spread_weight"] = float(by_building[building_key]["_spread_weight"]) + adjusted_people

    for building in by_building.values():
        spread_weight = float(building["_spread_weight"])
        if spread_weight > 0:
            building["avg_spread_multiplier"] = round(float(building["avg_spread_multiplier"]) / spread_weight, 4)
        else:
            building["avg_spread_multiplier"] = 1.0
        building["estimated_people"] = round(float(building["estimated_people"]), 3)
        del building["_spread_weight"]

    per_building = list(by_building.values())

    sw_lng, sw_lat = sw
    ne_lng, ne_lat = ne

    lng_step = (ne_lng - sw_lng) / (cols - 1)
    lat_step = (ne_lat - sw_lat) / (rows - 1)

    lng_axis = [round(sw_lng + c * lng_step, 7) for c in range(cols)]
    lat_axis = [round(sw_lat + r * lat_step, 7) for r in range(rows)]

    sigma_lng = max((ne_lng - sw_lng) * spread / 12.0, 1e-9)
    sigma_lat = max((ne_lat - sw_lat) * spread / 12.0, 1e-9)

    people_field: List[List[float]] = []

    for lat in lat_axis:
        row_values: List[float] = []
        for lng in lng_axis:
            density = 0.0
            for building in per_building:
                people = float(building["estimated_people"])
                if people <= 0:
                    continue

                spread_multiplier = float(building.get("avg_spread_multiplier", 1.0))
                local_sigma_lng = sigma_lng * spread_multiplier
                local_sigma_lat = sigma_lat * spread_multiplier

                dx = (lng - float(building["lng"])) / local_sigma_lng
                dy = (lat - float(building["lat"])) / local_sigma_lat
                density += people * math.exp(-0.5 * (dx * dx + dy * dy))

            row_values.append(round(density, 5))

        people_field.append(row_values)

    return {
        "requested_time": requested_time,
        "time_slot": slot,
        "weekday": weekday,
        "bounds": {"southwest": sw, "northeast": ne},
        "resolution": {"cols": cols, "rows": rows},
        "lng_axis": lng_axis,
        "lat_axis": lat_axis,
        "parse_stats": parse_stats,
        "active_buildings": per_building,
        "people_field": people_field,
    }
