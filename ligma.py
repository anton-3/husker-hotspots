import json
import csv


def main() -> None:
    with open("building_capacity.json", "r") as f:
        buildings = json.load(f)

    with open("building_people.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["buildingCode", "building", "day", "time", "people"])

        for b in buildings:
            bcode = b.get("buildingCode")
            bname = b.get("building")
            series = b.get("timeSeries") or []

            for point in series:
                day = point.get("day")
                time_str = point.get("time")
                people = point.get("filledSeats", 0)
                writer.writerow([bcode, bname, day, time_str, people])

    print("Wrote building_people.csv with total people per building/time slot")


if __name__ == "__main__":
    main()
