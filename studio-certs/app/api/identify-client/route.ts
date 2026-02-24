import { NextRequest, NextResponse } from "next/server";
import { findOrCreateClient } from "@/lib/certificate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const telegram_id =
      typeof body?.telegram_id === "string" ? body.telegram_id.trim() : null;
    if (!telegram_id) {
      return NextResponse.json(
        { error: "telegram_id is required" },
        { status: 400 }
      );
    }
    const client = await findOrCreateClient(telegram_id);
    return NextResponse.json({
      client_id: client.id,
      id: client.id,
      telegram_id: client.telegram_id,
      created_at: client.created_at.toISOString(),
    });
  } catch (err) {
    console.error("[identify-client]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
