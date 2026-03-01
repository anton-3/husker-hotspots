"""
Flask API for combined campus density heatmap data.
Run from repo root: FLASK_APP=backend.app flask run
"""

from __future__ import annotations

import re
from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.density_aggregator import get_combined_density
from backend.classes.density_field import get_building_timeline

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Default campus bounds (same as density_field modules)
DEFAULT_SW = [-96.708, 40.812]
DEFAULT_NE = [-96.69, 40.825]


def _parse_bounds(s: str) -> tuple[list[float], list[float]] | None:
    """Parse 'sw_lng,sw_lat,ne_lng,ne_lat' into southwest, northeast."""
    parts = [p.strip() for p in s.split(",")]
    if len(parts) != 4:
        return None
    try:
        coords = [float(p) for p in parts]
        return [coords[0], coords[1]], [coords[2], coords[3]]
    except ValueError:
        return None


@app.route("/api/density", methods=["GET"])
def api_density():
    """
    GET /api/density?time=10:00&weekday=Wednesday&cols=120&rows=90&bounds=...
    Returns combined density heatmap points (normalized 0-1) and metadata.
    """
    time_str = request.args.get("time", "10:00").strip()
    weekday = request.args.get("weekday", "Wednesday").strip()
    cols = request.args.get("cols", type=int) or 120
    rows = request.args.get("rows", type=int) or 90
    bounds_arg = request.args.get("bounds")

    # Validate time (HH:MM or H:MM)
    if not re.match(r"^\d{1,2}:\d{2}$", time_str):
        return jsonify({"error": "Invalid time; use HH:MM"}), 400
    parts = time_str.split(":")
    hour, minute = int(parts[0]), int(parts[1])
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return jsonify({"error": "Time out of range"}), 400
    time_str = f"{hour:02d}:{minute:02d}"

    valid_weekdays = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ]
    if weekday not in valid_weekdays:
        return jsonify({"error": "Invalid weekday"}), 400

    if cols < 2 or cols > 300 or rows < 2 or rows > 300:
        return jsonify({"error": "cols and rows must be between 2 and 300"}), 400

    southwest = None
    northeast = None
    if bounds_arg:
        parsed = _parse_bounds(bounds_arg)
        if not parsed:
            return jsonify({"error": "Invalid bounds; use sw_lng,sw_lat,ne_lng,ne_lat"}), 400
        southwest, northeast = parsed

    try:
        payload = get_combined_density(
            requested_time=time_str,
            weekday=weekday,
            southwest=southwest,
            northeast=northeast,
            cols=cols,
            rows=rows,
        )
        return jsonify(payload)
    except Exception as e:
        app.logger.exception("density aggregation failed")
        return jsonify({"error": str(e)}), 503


VALID_WEEKDAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
]


@app.route("/api/density/building/<building_id>/timeline", methods=["GET"])
def api_building_timeline(building_id: str):
    """
    GET /api/density/building/<building_id>/timeline?weekday=Wednesday
    Returns 96 slots with estimated_people per slot for that building and day.
    """
    weekday = request.args.get("weekday", "").strip()
    if not weekday or weekday not in VALID_WEEKDAYS:
        return jsonify({"error": "Invalid or missing weekday"}), 400
    try:
        slots = get_building_timeline(building_id, weekday)
        return jsonify({
            "building_id": building_id,
            "weekday": weekday,
            "slots": slots,
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        app.logger.exception("building timeline failed")
        return jsonify({"error": str(e)}), 503


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})
