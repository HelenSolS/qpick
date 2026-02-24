import { NextRequest, NextResponse } from "next/server";
import { getVault } from "@/lib/certificate";

export async function GET(request: NextRequest) {
  try {
    const telegram_id = request.nextUrl.searchParams.get("telegram_id");
    if (!telegram_id || !telegram_id.trim()) {
      return NextResponse.json(
        { error: "telegram_id is required" },
        { status: 400 }
      );
    }
    const list = await getVault(telegram_id.trim());
    return NextResponse.json(list);
  } catch (err) {
    console.error("[get-vault]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
