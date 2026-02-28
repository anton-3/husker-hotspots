from __future__ import annotations

import csv
import math
from datetime import datetime
from pathlib import Path
from statistics import quantiles
from typing import Dict, List

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

DEFAULT_BOUNDS = {
    "southwest": [-96.708, 40.812],
    "northeast": [-96.69, 40.825],
}

LOCATIONS = [
    {
        "key": "chickfila_union",
        "name": "Chick-fil-A (Nebraska Union)",
        "csv_file": "wt_chick_fil_a.csv",
        "lat": 40.8176367,
        "lng": -96.7004306,
        "capacity": 80,
        "site_multiplier": 1.0,
    },
    {
        "key": "harper_dining",
        "name": "Harper Dining Hall",
        "csv_file": "wt_harper.csv",
        "lat": 40.8250535,
        "lng": -96.7003806,
        "capacity": 60,
        "site_multiplier": 1.85,
    },
    {
        "key": "qdoba_selleck",
        "name": "Selleck QDOBA",
        "csv_file": "wt_qdoba.csv",
        "lat": 40.8189919,
        "lng": -96.6994707,
        "capacity": 70,
        "site_multiplier": 1.7,
    },
    {
        "key": "slims_abel",
        "name": "Slim Chickens (Abel Hall)",
        "csv_file": "wt_slims.csv",
        "lat": 40.8221943,
        "lng": -96.6960561,
        "capacity": 60,
        "site_multiplier": 1.75,
    },
    {
        "key": "starbucks_union",
        "name": "Starbucks (Nebraska Union)",
        "csv_file": "wt_starbucks.csv",
        "lat": 40.8176367,
        "lng": -96.7004306,
        "capacity": 60,
        "site_multiplier": 1.0,
    },
]


def _time_label_to_slot(label: str) -> str:
    dt = datetime.strptime(label, "%I:%M:%S %p")
    return f"{dt.hour:02d}:{dt.minute:02d}"


def _normalize_requested_time(requested_time: str) -> str:
    hour, minute = [int(x) for x in requested_time.split(":")]
    snapped = int(round(minute / 15.0) * 15)
    if snapped == 60:
        hour = (hour + 1) % 24
        snapped = 0
    return f"{hour:02d}:{snapped:02d}"


def _slot_hour_fraction(slot: str) -> float:
    hour, minute = [int(x) for x in slot.split(":")]
    return hour + minute / 60.0


def _gaussian_peak(hour_fraction: float, center: float, width: float) -> float:
    delta = hour_fraction - center
    return math.exp(-(delta * delta) / (2 * width * width))


def _meal_multiplier(location_key: str, weekday: str, slot: str) -> float:
    t = _slot_hour_fraction(slot)
    is_weekend = weekday in {"Saturday", "Sunday"}

    if location_key == "starbucks_union":
        peak = 1.0 + 1.9 * _gaussian_peak(t, 8.5, 1.1) + 0.5 * _gaussian_peak(t, 14.0, 1.6)
    elif location_key == "qdoba_selleck":
        peak = 1.0 + 2.1 * _gaussian_peak(t, 12.2, 1.2) + 1.3 * _gaussian_peak(t, 18.0, 1.5)
    elif location_key == "chickfila_union":
        peak = (
            1.0
            + 1.7 * _gaussian_peak(t, 12.0, 1.3)
            + 0.9 * _gaussian_peak(t, 18.0, 1.6)
            + 0.7 * _gaussian_peak(t, 8.4, 1.1)
        )
    else:
        peak = (
            1.0
            + 0.9 * _gaussian_peak(t, 8.0, 1.3)
            + 1.5 * _gaussian_peak(t, 12.1, 1.4)
            + 1.8 * _gaussian_peak(t, 18.0, 1.6)
        )

    if is_weekend:
        peak *= 0.85

    return peak


def _load_wait_data(wait_times_dir: Path) -> tuple[Dict[str, Dict[str, Dict[str, int]]], Dict[str, float]]:
    data: Dict[str, Dict[str, Dict[str, int]]] = {}
    baseline_wait: Dict[str, float] = {}

    for location in LOCATIONS:
        by_day: Dict[str, Dict[str, int]] = {day: {} for day in WEEKDAYS}
        filepath = wait_times_dir / location["csv_file"]

        with filepath.open("r", newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                slot = _time_label_to_slot(row["Time"])
                for day in WEEKDAYS:
                    by_day[day][slot] = int(float(row[day]))

        data[location["key"]] = by_day

        open_waits = [
            wait
            for day_data in by_day.values()
            for wait in day_data.values()
            if wait > 0
        ]
        if open_waits:
            if len(open_waits) >= 4:
                q1 = quantiles(open_waits, n=4)[0]
                baseline_wait[location["key"]] = max(2.0, q1)
            else:
                baseline_wait[location["key"]] = max(2.0, min(open_waits))
        else:
            baseline_wait[location["key"]] = 5.0

    return data, baseline_wait


def _estimate_people(
    location: Dict[str, object],
    wait_minutes: int,
    baseline: float,
    weekday: str,
    slot: str,
) -> int:
    if wait_minutes <= 0:
        return 0

    capacity = int(location["capacity"])
    site_multiplier = float(location.get("site_multiplier", 1.0))
    effective_capacity = max(capacity, round(capacity * site_multiplier))
    baseline_people = max(4, round(capacity * 0.15))
    meal_mult = _meal_multiplier(str(location["key"]), weekday, slot)

    if wait_minutes <= baseline:
        low_ratio = wait_minutes / max(baseline, 1.0)
        estimated = max(1, round((low_ratio**0.9) * baseline_people * meal_mult))
    else:
        relative_wait = wait_minutes / max(baseline, 1.0)
        pressure_factor = 1.0 + 3.4 * math.tanh((relative_wait - 1.0) / 2.2)
        estimated = round(baseline_people * pressure_factor * meal_mult)

    return min(effective_capacity, max(0, estimated))


def generate_people_density_field(
    requested_time: str,
    weekday: str,
    southwest: List[float] | None = None,
    northeast: List[float] | None = None,
    cols: int = 120,
    rows: int = 90,
    spread: float = 0.3,
    peak_power: float = 1.28,
) -> Dict[str, object]:
    """
    Return a wave-like people density field over the requested bounds.

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
    if not (1.0 <= peak_power <= 2.5):
        raise ValueError("peak_power must be between 1.0 and 2.5")

    sw = southwest if southwest is not None else DEFAULT_BOUNDS["southwest"]
    ne = northeast if northeast is not None else DEFAULT_BOUNDS["northeast"]
    slot = _normalize_requested_time(requested_time)

    wait_times_dir = Path(__file__).resolve().parent
    wait_data, baselines = _load_wait_data(wait_times_dir)

    per_location = []
    for location in LOCATIONS:
        location_key = str(location["key"])
        wait = wait_data[location_key][weekday].get(slot, -1)
        estimated_people = _estimate_people(location, wait, baselines[location_key], weekday, slot)
        per_location.append(
            {
                "key": location_key,
                "lat": float(location["lat"]),
                "lng": float(location["lng"]),
                "wait_minutes": max(wait, 0),
                "estimated_people": estimated_people,
            }
        )

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
            for item in per_location:
                people = item["estimated_people"]
                if people <= 0:
                    continue

                dx = (lng - item["lng"]) / sigma_lng
                dy = (lat - item["lat"]) / sigma_lat
                source_weight = people**1.12
                density += source_weight * math.exp(-0.5 * (dx * dx + dy * dy))

            row_values.append(round(density**peak_power, 5))

        people_field.append(row_values)

    return {
        "requested_time": requested_time,
        "time_slot": slot,
        "weekday": weekday,
        "bounds": {"southwest": sw, "northeast": ne},
        "resolution": {"cols": cols, "rows": rows},
        "lng_axis": lng_axis,
        "lat_axis": lat_axis,
        "people_field": people_field,
    }
