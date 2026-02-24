import { NextRequest, NextResponse } from "next/server";
import { createCertificate, getTariffPriceCents, recordCertificatePayment } from "@/lib/certificate";
import type { CreateCertificateInput } from "@/lib/certificate";
import { notifyAdminSale } from "@/lib/notify";

function parseBody(body: unknown): CreateCertificateInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const telegram_id = typeof o.telegram_id === "string" ? o.telegram_id.trim() : null;
  const tariff_id = typeof o.tariff_id === "number" ? o.tariff_id : Number(o.tariff_id);
  const design_id = typeof o.design_id === "number" ? o.design_id : Number(o.design_id);
  const city_id = typeof o.city_id === "number" ? o.city_id : Number(o.city_id);
  if (!telegram_id || !Number.isInteger(tariff_id) || !Number.isInteger(design_id) || !Number.isInteger(city_id)) {
    return null;
  }
  const recipient_name =
    typeof o.recipient_name === "string" ? o.recipient_name.trim() || null : null;
  const greeting =
    o.greeting === undefined || o.greeting === null
      ? null
      : typeof o.greeting === "string"
        ? o.greeting.trim() || null
        : null;
  const pd_consent = o.pd_consent === true || o.pd_consent === "true";
  return {
    telegram_id,
    tariff_id,
    design_id,
    city_id,
    recipient_name: recipient_name ?? undefined,
    greeting: greeting ?? undefined,
    pd_consent,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parseBody(body);
    if (!input) {
      return NextResponse.json(
        { error: "Invalid body: telegram_id, tariff_id, design_id, city_id required" },
        { status: 400 }
      );
    }
    const cert = await createCertificate(input);
    const amount_cents = await getTariffPriceCents(input.tariff_id);
    if (amount_cents != null) {
      recordCertificatePayment(cert.id, amount_cents, "STUB", "succeeded").catch((e) =>
        console.error("[create-certificate] recordCertificatePayment failed", e)
      );
    }
    notifyAdminSale({
      code: cert.code,
      recipient_name: cert.recipient_name ?? undefined,
      tariff_id: input.tariff_id,
      design_id: input.design_id,
      city_id: input.city_id,
      telegram_id: input.telegram_id,
      created_at: cert.created_at.toISOString(),
      amount_cents: amount_cents ?? undefined,
    }).catch((e) => console.error("[create-certificate] notify failed", e));
    return NextResponse.json({
      id: cert.id,
      code: cert.code,
      recipient_name: cert.recipient_name,
      greeting: cert.greeting,
      status: cert.status,
      expires_at: cert.expires_at.toISOString(),
      created_at: cert.created_at.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "INVALID_TARIFF" || message === "INVALID_DESIGN" || message === "INVALID_CITY") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "CODE_GENERATION_FAILED") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    console.error("[create-certificate]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
