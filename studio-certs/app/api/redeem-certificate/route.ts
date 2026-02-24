import { NextRequest, NextResponse } from "next/server";
import { redeemCertificate } from "@/lib/certificate";

export async function POST(request: NextRequest) {
  try {
    let code: string | null = null;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body && typeof body.code === "string") {
        code = body.code.trim();
      }
    }
    if (!code) {
      const url = new URL(request.url);
      code = url.searchParams.get("code");
    }
    if (!code) {
      return NextResponse.json(
        { error: "code required (body.code or query ?code=)" },
        { status: 400 }
      );
    }
    const result = await redeemCertificate(code);
    if (!result.ok) {
      const status =
        result.error === "NOT_FOUND"
          ? 404
          : result.error === "ALREADY_REDEEMED" || result.error === "EXPIRED"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, message: "redeemed" });
  } catch (err) {
    console.error("[redeem-certificate]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
