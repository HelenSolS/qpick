import { NextRequest, NextResponse } from "next/server";

/**
 * Заглушка оплаты ЮKassa.
 * Принимает сумму и параметры, возвращает успех без реального платежа.
 * Позже заменить на интеграцию с ЮKassa: создание платежа, редирект, webhook.
 */
function parseBody(body: unknown): { amount_cents: number; tariff_id: number; telegram_id?: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const amount_cents = typeof o.amount_cents === "number" ? o.amount_cents : Number(o.amount_cents);
  const tariff_id = typeof o.tariff_id === "number" ? o.tariff_id : Number(o.tariff_id);
  if (!Number.isInteger(amount_cents) || amount_cents <= 0 || !Number.isInteger(tariff_id)) return null;
  const telegram_id = typeof o.telegram_id === "string" ? o.telegram_id.trim() : undefined;
  return { amount_cents, tariff_id, telegram_id };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parseBody(body);
    if (!input) {
      return NextResponse.json(
        { error: "Invalid body: amount_cents, tariff_id required" },
        { status: 400 }
      );
    }
    // Заглушка: всегда успех. Позже: создать платёж в ЮKassa, вернуть confirmation_url и payment_id
    const paymentId = `stub-${Date.now()}`;
    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      status: "succeeded",
      amount_cents: input.amount_cents,
      receipt_url: null, // заглушка чека; позже — ссылка на чек ЮKassa
    });
  } catch (err) {
    console.error("[create-payment]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
