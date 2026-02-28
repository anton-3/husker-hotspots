import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export interface ApiBuilding {
  buildingCode: string;
  inferredName: string;
  sampleLat: number | null;
  sampleLng: number | null;
  sectionCount?: number;
  nameVariants?: number;
}

export async function GET() {
  try {
    const base = process.cwd();
    const paths = [
      path.join(base, "..", "backend", "scripts", "buildings.json"),
      path.join(base, "backend", "scripts", "buildings.json"),
    ];
    let raw: string | null = null;
    for (const p of paths) {
      if (fs.existsSync(p)) {
        raw = fs.readFileSync(p, "utf-8");
        break;
      }
    }
    if (!raw) {
      return NextResponse.json(
        { error: "Buildings file not found" },
        { status: 404 }
      );
    }
    const data = JSON.parse(raw) as ApiBuilding[];
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/buildings]", err);
    return NextResponse.json(
      { error: "Failed to load buildings" },
      { status: 500 }
    );
  }
}
