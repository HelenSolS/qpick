import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { DesignRow } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const cityId = request.nextUrl.searchParams.get("city");
    let result;
    if (cityId != null && cityId !== "") {
      const id = Number(cityId);
      if (!Number.isInteger(id)) {
        return NextResponse.json({ error: "Invalid city" }, { status: 400 });
      }
      result = await db.query<DesignRow>(
        "SELECT id, name, city_id FROM designs WHERE (city_id IS NULL OR city_id = $1) AND active = TRUE ORDER BY name",
        [id]
      );
    } else {
      result = await db.query<DesignRow>(
        "SELECT id, name, city_id FROM designs WHERE active = TRUE ORDER BY name"
      );
    }
    return NextResponse.json(
      result.rows.map((r) => ({ id: r.id, name: r.name }))
    );
  } catch (err) {
    console.error("[designs]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
