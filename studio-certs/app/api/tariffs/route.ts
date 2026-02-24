import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { TariffRow } from "@/lib/db";

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
      result = await db.query<TariffRow>(
        "SELECT id, name, code, price_cents, city_id FROM tariffs WHERE city_id = $1 AND active = TRUE ORDER BY price_cents",
        [id]
      );
    } else {
      result = await db.query<TariffRow>(
        "SELECT id, name, code, price_cents, city_id FROM tariffs WHERE active = TRUE ORDER BY price_cents"
      );
    }
    return NextResponse.json(
      result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        amount_cents: r.price_cents,
      }))
    );
  } catch (err) {
    console.error("[tariffs]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
