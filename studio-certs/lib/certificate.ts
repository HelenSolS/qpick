import { getDb } from "./db";
import type { ClientRow, CertificateRow } from "./db";
import { generateCertificateCode } from "./code";

const CERT_EXPIRY_MONTHS = 6;
const MAX_CODE_RETRIES = 10;

/** Quick Pic: certificate_status enum values */
const CERT_ACTIVE = "ACTIVE";
const CERT_REDEEMED = "REDEEMED";

export interface CreateCertificateInput {
  telegram_id: string;
  tariff_id: number;
  design_id: number;
  city_id: number;
  recipient_name?: string | null;
  greeting?: string | null;
  /** При покупке: согласие на обработку ПД — сохраняем pd_consent_at в БД */
  pd_consent?: boolean;
}

export interface CertificateWithDetails {
  id: number;
  code: string;
  recipient_name: string;
  greeting: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  tariff_name: string;
  city_name: string;
  design_name: string;
}

/** Quick Pic: clients have phone NOT NULL; we use phone = 'tg_<id>' for Telegram-only users */
export async function findOrCreateClient(telegramId: string): Promise<ClientRow> {
  const db = getDb();
  const tid = String(telegramId).trim();
  const existing = await db.query<ClientRow>(
    "SELECT id, phone, telegram_id, created_at FROM clients WHERE telegram_id = $1::BIGINT",
    [tid]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  const phone = `tg_${tid}`;
  const inserted = await db.query<ClientRow>(
    `INSERT INTO clients (phone, telegram_id) VALUES ($1, $2::BIGINT)
     ON CONFLICT (phone) DO UPDATE SET telegram_id = EXCLUDED.telegram_id
     RETURNING id, phone, telegram_id, created_at`,
    [phone, tid]
  );
  return inserted.rows[0];
}

export async function validateTariffId(tariffId: number, cityId?: number): Promise<boolean> {
  const db = getDb();
  if (cityId != null) {
    const r = await db.query("SELECT 1 FROM tariffs WHERE id = $1 AND city_id = $2 AND active = TRUE", [tariffId, cityId]);
    return r.rows.length > 0;
  }
  const r = await db.query("SELECT 1 FROM tariffs WHERE id = $1 AND active = TRUE", [tariffId]);
  return r.rows.length > 0;
}

export async function getTariffPriceCents(tariffId: number): Promise<number | null> {
  const db = getDb();
  const r = await db.query<{ price_cents: number }>("SELECT price_cents FROM tariffs WHERE id = $1", [tariffId]);
  return r.rows.length > 0 ? r.rows[0].price_cents : null;
}

export async function validateDesignId(designId: number, cityId?: number): Promise<boolean> {
  const db = getDb();
  if (cityId != null) {
    const r = await db.query("SELECT 1 FROM designs WHERE id = $1 AND (city_id IS NULL OR city_id = $2) AND active = TRUE", [designId, cityId]);
    return r.rows.length > 0;
  }
  const r = await db.query("SELECT 1 FROM designs WHERE id = $1 AND active = TRUE", [designId]);
  return r.rows.length > 0;
}

export async function validateCityId(cityId: number): Promise<boolean> {
  const db = getDb();
  const r = await db.query("SELECT 1 FROM cities WHERE id = $1", [cityId]);
  return r.rows.length > 0;
}

export async function createCertificate(
  input: CreateCertificateInput
): Promise<CertificateRow> {
  const tariffOk = await validateTariffId(input.tariff_id, input.city_id);
  if (!tariffOk) {
    throw new Error("INVALID_TARIFF");
  }
  const designOk = await validateDesignId(input.design_id, input.city_id);
  if (!designOk) {
    throw new Error("INVALID_DESIGN");
  }
  const cityOk = await validateCityId(input.city_id);
  if (!cityOk) {
    throw new Error("INVALID_CITY");
  }

  const client = await findOrCreateClient(input.telegram_id);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + CERT_EXPIRY_MONTHS);

  const pdConsentAt = input.pd_consent ? new Date() : null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = generateCertificateCode();
    try {
      const db = getDb();
      const result = await db.query<CertificateRow>(
        `INSERT INTO certificates (
          buyer_client_id, tariff_id, design_id, city_id, code,
          recipient_name, greeting, status, expires_at, pd_consent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, buyer_client_id, tariff_id, design_id, city_id, code,
          recipient_name, greeting, status, expires_at, created_at, redeemed_at`,
        [
          client.id,
          input.tariff_id,
          input.design_id,
          input.city_id,
          code,
          input.recipient_name ?? null,
          input.greeting ?? null,
          CERT_ACTIVE,
          expiresAt,
          pdConsentAt,
        ]
      );
      return result.rows[0];
    } catch (err) {
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505") {
        continue;
      }
      throw err;
    }
  }
  throw new Error("CODE_GENERATION_FAILED");
}

/** Сохранить в БД запись о платеже по сертификату (заглушка или ЮKassa). */
export async function recordCertificatePayment(
  certificateId: number,
  amountCents: number,
  provider: "STUB" | "YOOKASSA",
  status: "succeeded" | "pending" | "failed",
  externalId?: string | null
): Promise<void> {
  const db = getDb();
  await db.query(
    `INSERT INTO certificate_payments (certificate_id, amount_cents, provider, external_id, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [certificateId, amountCents, provider, externalId ?? null, status]
  );
}

export async function redeemCertificate(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, error: "INVALID_CODE" };
  }
  const found = await db.query<CertificateRow>(
    "SELECT id, status, expires_at FROM certificates WHERE UPPER(TRIM(code)) = $1",
    [normalizedCode]
  );
  if (found.rows.length === 0) {
    return { ok: false, error: "NOT_FOUND" };
  }
  const row = found.rows[0];
  if (row.status !== CERT_ACTIVE) {
    return { ok: false, error: "ALREADY_REDEEMED" };
  }
  const now = new Date();
  if (row.expires_at != null && row.expires_at < now) {
    return { ok: false, error: "EXPIRED" };
  }
  await db.query(
    "UPDATE certificates SET status = $1, redeemed_at = NOW() WHERE id = $2",
    [CERT_REDEEMED, row.id]
  );
  return { ok: true };
}

/** Quick Pic: certificates use buyer_client_id; design_id can be NULL (LEFT JOIN) */
export async function getVault(telegramId: string): Promise<CertificateWithDetails[]> {
  const db = getDb();
  const result = await db.query<{
    id: number;
    code: string;
    recipient_name: string | null;
    greeting: string | null;
    status: string;
    expires_at: Date | null;
    created_at: Date;
    tariff_name: string;
    city_name: string;
    design_name: string | null;
  }>(
    `SELECT c.id, c.code, c.recipient_name, c.greeting, c.status,
            c.expires_at, c.created_at,
            t.name AS tariff_name, ci.name AS city_name, d.name AS design_name
     FROM certificates c
     JOIN clients cl ON cl.id = c.buyer_client_id
     JOIN tariffs t ON t.id = c.tariff_id
     JOIN cities ci ON ci.id = c.city_id
     LEFT JOIN designs d ON d.id = c.design_id
     WHERE cl.telegram_id = $1::BIGINT
     ORDER BY c.created_at DESC`,
    [String(telegramId).trim()]
  );
  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    recipient_name: row.recipient_name ?? "",
    greeting: row.greeting,
    status: row.status,
    expires_at: row.expires_at?.toISOString() ?? "",
    created_at: row.created_at.toISOString(),
    tariff_name: row.tariff_name,
    city_name: row.city_name,
    design_name: row.design_name ?? "",
  }));
}

/** Данные сертификата для PDF: подпись по городу, кто оплатил, дата оплаты, сумма */
export interface CertificateForPdf {
  code: string;
  city_name: string;
  tariff_name: string;
  amount_cents: number;
  payer_telegram_id: string;
  paid_at: string;
}

export async function getCertificateForPdf(code: string): Promise<CertificateForPdf | null> {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const result = await db.query<{
    code: string;
    city_name: string;
    tariff_name: string;
    price_cents: number;
    telegram_id: string | null;
    created_at: Date;
  }>(
    `SELECT c.code, ci.name AS city_name, t.name AS tariff_name, t.price_cents,
            cl.telegram_id, c.created_at
     FROM certificates c
     JOIN clients cl ON cl.id = c.buyer_client_id
     JOIN tariffs t ON t.id = c.tariff_id
     JOIN cities ci ON ci.id = c.city_id
     WHERE UPPER(TRIM(c.code)) = $1`,
    [normalized]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    code: row.code,
    city_name: row.city_name,
    tariff_name: row.tariff_name,
    amount_cents: row.price_cents,
    payer_telegram_id: row.telegram_id ?? "",
    paid_at: row.created_at.toISOString(),
  };
}
