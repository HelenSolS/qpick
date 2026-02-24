import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CityRow } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const result = await db.query<CityRow>("SELECT id, name FROM cities ORDER BY name");
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[cities]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
