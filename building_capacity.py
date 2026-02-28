import json
from collections import defaultdict


SLOT_MINUTES = 15


def time_to_minutes(t: str | None) -> int | None:
    if not t:
        return None
    try:
        h, m = t.split(":", 1)
        return int(h) * 60 + int(m)
    except Exception:
        return None


def minutes_to_time_str(minutes: int) -> str:
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def main() -> None:
    with open("parsed_sections.json", "r") as f:
        sections = json.load(f)

    # Determine a capacity per room (assume physical room capacity is
    # the maximum section capacity observed for that room).
    room_capacity: dict[tuple[str, str], int] = {}
    building_name: dict[str, str | None] = {}

    for sec in sections:
        bcode = sec.get("buildingCode")
        room = sec.get("room")
        cap = sec.get("capacity")
        if not bcode or not room or cap is None:
            continue
        key = (bcode, room)
        current = room_capacity.get(key)
        if current is None or cap > current:
            room_capacity[key] = cap
        if bcode not in building_name:
            building_name[bcode] = sec.get("building")

    # Group rooms per building and compute total building capacity.
    building_rooms: dict[str, list[dict]] = defaultdict(list)
    for (bcode, room), cap in room_capacity.items():
        building_rooms[bcode].append({"room": room, "capacity": cap})

    building_total_capacity: dict[str, int] = {
        bcode: sum(r["capacity"] for r in rooms)
        for bcode, rooms in building_rooms.items()
    }

    # For each 15-minute slot, accumulate filled seats and occupied-room capacity.
    # Keyed by (buildingCode, dayLetter, slotStartMinutes).
    filled_seats: dict[tuple[str, str, int], float] = defaultdict(float)
    occupied_capacity: dict[tuple[str, str, int], float] = defaultdict(float)

    for sec in sections:
        bcode = sec.get("buildingCode")
        room = sec.get("room")
        enrolled = sec.get("enrolled")
        cap = sec.get("capacity")
        if not bcode or not room or enrolled is None or cap is None:
            continue

        room_key = (bcode, room)
        room_cap = room_capacity.get(room_key)
        if room_cap is None:
            # Fallback: treat the section capacity as room capacity if not seen before.
            room_cap = cap
            room_capacity[room_key] = cap
            building_rooms[bcode].append({"room": room, "capacity": cap})
            building_total_capacity[bcode] = building_total_capacity.get(bcode, 0) + cap

        class_times = sec.get("classTimes") or []
        for ct in class_times:
            days = (ct.get("days") or "").strip()
            start_min = time_to_minutes(ct.get("startTime"))
            end_min = time_to_minutes(ct.get("endTime"))
            if start_min is None or end_min is None or end_min <= start_min:
                continue

            # Iterate each day letter (e.g., 'M', 'W', 'F' in 'MWF').
            for day in days:
                if day not in "MTWRF":
                    continue

                # Snap to 15-minute slots covering [start_min, end_min).
                slot = (start_min // SLOT_MINUTES) * SLOT_MINUTES
                while slot < end_min:
                    key = (bcode, day, slot)
                    # Filled seats are capped by the physical room capacity.
                    filled_seats[key] += min(enrolled, room_cap)
                    # Occupied capacity counts the room once per slot.
                    occupied_capacity[key] += room_cap
                    slot += SLOT_MINUTES

    # Build output per building.
    output: list[dict] = []

    for bcode, rooms in building_rooms.items():
        total_cap = building_total_capacity.get(bcode, 0)
        if total_cap <= 0:
            continue

        series: list[dict] = []

        # Collect all keys for this building.
        relevant_keys = [k for k in filled_seats.keys() if k[0] == bcode]
        # Sort by day then time.
        relevant_keys.sort(key=lambda k: ("MTWRF".find(k[1]), k[2]))

        seen = set()
        for key in relevant_keys:
            if key in seen:
                continue
            seen.add(key)
            _, day, slot = key
            filled = filled_seats.get(key, 0.0)
            occ_cap = occupied_capacity.get(key, 0.0)
            time_str = minutes_to_time_str(slot)

            util_all = filled / total_cap if total_cap > 0 else None
            util_occ = filled / occ_cap if occ_cap > 0 else None

            series.append(
                {
                    "day": day,
                    "time": time_str,
                    "filledSeats": int(round(filled)),
                    "occupiedRoomCapacity": int(round(occ_cap)),
                    "totalBuildingCapacity": int(total_cap),
                    "utilizationAllRooms": util_all,
                    "utilizationOccupiedRoomsOnly": util_occ,
                }
            )

        output.append(
            {
                "buildingCode": bcode,
                "building": building_name.get(bcode),
                "totalBuildingCapacity": int(total_cap),
                "rooms": rooms,
                "timeSeries": series,
            }
        )

    with open("building_capacity.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote capacity time series for {len(output)} buildings to building_capacity.json")


if __name__ == "__main__":
    main()
