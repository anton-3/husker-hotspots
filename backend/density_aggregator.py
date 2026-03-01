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


# Registry: name -> getter() returning callable(time, weekday, southwest, northeast, cols, rows) -> dict
# Each dict must have: people_field (2D list), lng_axis, lat_axis, bounds, resolution
DENSITY_REGISTRY: List[Tuple[str, Callable[[], Callable[..., Dict[str, Any]]]]] = [
    ("classes", _get_classes_density),
    ("dining", _get_wait_times_density),
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
    }
