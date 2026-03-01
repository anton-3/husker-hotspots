"""
Extensible density field aggregator.
Combines multiple density providers (classes, dining, etc.) into a single
grid, normalizes it, and converts to heatmap points for the frontend.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional, Tuple

# Lazy imports inside get_combined_density to avoid circular deps and allow
# running from backend dir with PYTHONPATH=..
def _get_classes_density():
    from backend.classes.density_field import generate_people_density_field
    return generate_people_density_field

def _get_wait_times_density():
    from backend.wait_times.density_field import generate_people_density_field
    return generate_people_density_field


def _get_classes_density_day():
    from backend.classes.density_field import generate_people_density_field_day
    return generate_people_density_field_day


def _get_wait_times_density_day():
    from backend.wait_times.density_field import generate_people_density_field_day
    return generate_people_density_field_day


# Registry: name -> getter() returning callable(time, weekday, southwest, northeast, cols, rows) -> dict
# Each dict must have: people_field (2D list), lng_axis, lat_axis, bounds, resolution
DENSITY_REGISTRY: List[Tuple[str, Callable[[], Callable[..., Dict[str, Any]]]]] = [
    ("classes", _get_classes_density),
    ("dining", _get_wait_times_density),
]

# Day registry: name -> getter() returning callable(weekday, southwest, northeast, cols, rows) -> dict
# Each dict must have: slot_fields (list of 96 2D grids), lng_axis, lat_axis, bounds, resolution;
# classes also has slot_buildings (list of 96 lists of { building_id, estimated_people }).
DENSITY_DAY_REGISTRY: List[Tuple[str, Callable[[], Callable[..., Dict[str, Any]]]]] = [
    ("classes", _get_classes_density_day),
    ("dining", _get_wait_times_density_day),
]


def get_combined_density(
    requested_time: str,
    weekday: str,
    southwest: Optional[List[float]] = None,
    northeast: Optional[List[float]] = None,
    cols: int = 120,
    rows: int = 90,
) -> Dict[str, Any]:
    """
    Call all registered density providers with the same bounds/resolution,
    sum their people_field grids, normalize to [0, 1], and convert to
    heatmap_points. Returns a payload ready for the API response.
    """
    combined_field: Optional[List[List[float]]] = None
    lng_axis: Optional[List[float]] = None
    lat_axis: Optional[List[float]] = None
    bounds: Optional[Dict[str, List[float]]] = None
    resolution: Optional[Dict[str, int]] = None
    time_slot: Optional[str] = None
    sources: List[str] = []
    buildings: List[Dict[str, Any]] = []

    for name, get_provider in DENSITY_REGISTRY:
        try:
            provider = get_provider()
            result = provider(
                requested_time=requested_time,
                weekday=weekday,
                southwest=southwest,
                northeast=northeast,
                cols=cols,
                rows=rows,
            )
        except Exception:
            continue

        pf = result.get("people_field")
        if not pf or not isinstance(pf, list):
            continue

        if name == "classes":
            active_buildings = result.get("active_buildings")
            if isinstance(active_buildings, list):
                buildings = [
                    {
                        "building_id": str(b.get("key", "")),
                        "estimated_people": float(b.get("estimated_people", 0)),
                        "active_sections": int(b.get("active_sections", 0)),
                        "classes": b.get("classes") if isinstance(b.get("classes"), list) else [],
                    }
                    for b in active_buildings
                    if isinstance(b, dict)
                ]

        lng_axis = result.get("lng_axis")
        lat_axis = result.get("lat_axis")
        bounds = result.get("bounds")
        resolution = result.get("resolution", {})
        time_slot = result.get("time_slot") or requested_time

        if combined_field is None:
            combined_field = [[float(v) for v in row] for row in pf]
        else:
            for r, row in enumerate(pf):
                for c, val in enumerate(row):
                    if r < len(combined_field) and c < len(combined_field[r]):
                        combined_field[r][c] += float(val)
        sources.append(name)

    if combined_field is None or lng_axis is None or lat_axis is None:
        combined_field = []
        lng_axis = []
        lat_axis = []
        bounds = {"southwest": [-96.708, 40.812], "northeast": [-96.69, 40.825]}
        resolution = {"cols": cols, "rows": rows}
        time_slot = requested_time

    # Normalize: scale so max = 1.0
    flat = [v for row in combined_field for v in row]
    max_val = max(flat) if flat else 1.0
    if max_val <= 0:
        max_val = 1.0
    scale = 1.0 / max_val
    normalized = [[v * scale for v in row] for row in combined_field]

    # Grid -> heatmap points: one point per cell
    heatmap_points: List[Dict[str, Any]] = []
    for r, lat in enumerate(lat_axis):
        for c, lng in enumerate(lng_axis):
            w = normalized[r][c]
            if w > 0:
                heatmap_points.append({
                    "coordinates": [lng, lat],
                    "weight": round(w, 6),
                })

    return {
        "bounds": bounds,
        "resolution": resolution,
        "lng_axis": lng_axis,
        "lat_axis": lat_axis,
        "heatmap_points": heatmap_points,
        "sources": sources,
        "requested_time": requested_time,
        "weekday": weekday,
        "time_slot": time_slot,
        "buildings": buildings,
    }


def _grid_to_sparse_weights(normalized_grid: List[List[float]], cols: int) -> List[List[float]]:
    """Flatten grid row-major and return [[index, weight], ...] for weight > 0."""
    out: List[List[float]] = []
    for r, row in enumerate(normalized_grid):
        for c, w in enumerate(row):
            if w > 0:
                idx = r * cols + c
                rounded = round(w, 6)
                if rounded > 0:
                    out.append([float(idx), rounded])
    return out


def get_combined_density_day(
    weekday: str,
    southwest: Optional[List[float]] = None,
    northeast: Optional[List[float]] = None,
    cols: int = 60,
    rows: int = 45,
) -> Dict[str, Any]:
    """
    Call each registered day provider once; merge 96 grids slot-by-slot,
    normalize globally (max=1 across all slots), output compact response:
    bounds, resolution, lng_axis, lat_axis, weekday, sources, slots: [{ time, w, b }].
    """
    combined_slot_fields: Optional[List[List[List[float]]]] = None
    lng_axis: Optional[List[float]] = None
    lat_axis: Optional[List[float]] = None
    bounds: Optional[Dict[str, List[float]]] = None
    resolution: Optional[Dict[str, int]] = None
    slot_buildings: List[List[Dict[str, Any]]] = [[] for _ in range(96)]
    sources: List[str] = []

    for name, get_provider in DENSITY_DAY_REGISTRY:
        try:
            provider = get_provider()
            result = provider(
                weekday=weekday,
                southwest=southwest,
                northeast=northeast,
                cols=cols,
                rows=rows,
            )
        except Exception:
            continue

        slot_fields = result.get("slot_fields")
        if not slot_fields or not isinstance(slot_fields, list) or len(slot_fields) != 96:
            continue

        if name == "classes":
            sb = result.get("slot_buildings")
            if isinstance(sb, list) and len(sb) == 96:
                slot_buildings = sb

        lng_axis = result.get("lng_axis")
        lat_axis = result.get("lat_axis")
        bounds = result.get("bounds")
        resolution = result.get("resolution", {})
        res_cols = int(resolution.get("cols", cols))

        if combined_slot_fields is None:
            combined_slot_fields = [[[float(v) for v in cell] for cell in row] for row in slot_fields]
        else:
            for slot_index in range(96):
                for r, row in enumerate(slot_fields[slot_index]):
                    for c, val in enumerate(row):
                        if r < len(combined_slot_fields[slot_index]) and c < len(combined_slot_fields[slot_index][r]):
                            combined_slot_fields[slot_index][r][c] += float(val)
        sources.append(name)

    if combined_slot_fields is None or lng_axis is None or lat_axis is None:
        combined_slot_fields = [[[0.0] * cols for _ in range(rows)] for _ in range(96)]
        lng_axis = []
        lat_axis = []
        bounds = {"southwest": [-96.708, 40.812], "northeast": [-96.69, 40.825]}
        resolution = {"cols": cols, "rows": rows}
        res_cols = cols

    # Global normalization: max across all 96 grids = 1.0
    global_max = 0.0
    for grid in combined_slot_fields:
        for row in grid:
            for v in row:
                if v > global_max:
                    global_max = v
    if global_max <= 0:
        global_max = 1.0
    scale = 1.0 / global_max
    normalized_slots = [
        [[v * scale for v in row] for row in grid]
        for grid in combined_slot_fields
    ]

    slots: List[Dict[str, Any]] = []
    for slot_index in range(96):
        hour = slot_index // 4
        minute = (slot_index % 4) * 15
        time_str = f"{hour:02d}:{minute:02d}"
        w = _grid_to_sparse_weights(normalized_slots[slot_index], res_cols)
        b = slot_buildings[slot_index] if slot_index < len(slot_buildings) else []
        slots.append({"time": time_str, "w": w, "b": b})

    return {
        "bounds": bounds,
        "resolution": resolution,
        "lng_axis": lng_axis,
        "lat_axis": lat_axis,
        "weekday": weekday,
        "sources": sources,
        "slots": slots,
    }
