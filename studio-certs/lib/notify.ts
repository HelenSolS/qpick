/**
 * Отправка уведомления о продаже сертификата в Telegram-чат админу.
 * Если TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID не заданы — ничего не делаем.
 */

export interface SalePayload {
  code: string;
  recipient_name?: string | null;
  tariff_id: number;
  design_id: number;
  city_id: number;
  telegram_id: string;
  created_at: string;
  amount_cents?: number;
}

export async function notifyAdminSale(payload: SalePayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    return;
  }
  const lines = [
    "🛒 Продажа сертификата",
    `Код: ${payload.code}`,
    `Оплатил (Telegram ID): ${payload.telegram_id}`,
    `Дата оплаты: ${payload.created_at}`,
  ];
  if (payload.amount_cents != null) {
    lines.push(`Сумма: ${(payload.amount_cents / 100).toFixed(0)} ₽`);
  }
  if (payload.recipient_name) {
    lines.push(`Получатель: ${payload.recipient_name}`);
  }
  const text = lines.join("\n");
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
  if (!res.ok) {
    console.error("[notify] Telegram send failed:", res.status, await res.text());
  }
}
