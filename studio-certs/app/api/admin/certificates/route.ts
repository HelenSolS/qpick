import { NextRequest, NextResponse } from "next/server";
import { getAdminCertificates, checkAdminKey } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const key =
    request.headers.get("x-admin-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;
  if (!checkAdminKey(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const sort = request.nextUrl.searchParams.get("sort") ?? undefined;
    const order =
      request.nextUrl.searchParams.get("order") === "asc" ? "asc" : "desc";
    const list = await getAdminCertificates({ search, sort, order });
    return NextResponse.json(list);
  } catch (err) {
    console.error("[admin/certificates]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
