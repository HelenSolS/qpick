import { getDb } from "./db";

export type AdminCertificateRow = {
  id: number;
  code: string;
  city_name: string;
  tariff_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
  payer_name: string | null;
  payer_phone: string;
  payer_telegram_id: string | null;
  payer_email: string | null;
  source: "telegram" | "web";
};

const SORT_FIELDS = ["created_at", "city_name", "code", "payer"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function mapSort(sort: string | null): SortField {
  if (sort === "city" || sort === "city_name") return "city_name";
  if (sort === "code") return "code";
  if (sort === "fio" || sort === "name" || sort === "payer") return "payer";
  return "created_at";
}

export async function getAdminCertificates(
  opts: { search?: string; sort?: string; order?: "asc" | "desc" }
): Promise<AdminCertificateRow[]> {
  const db = getDb();
  const search = opts.search?.trim() || null;
  const order = opts.order === "asc" ? "ASC" : "DESC";
  const sortField = mapSort(opts.sort ?? null);

  const orderBy =
    sortField === "created_at"
      ? "c.created_at"
      : sortField === "city_name"
        ? "ci.name"
        : sortField === "code"
          ? "c.code"
          : "COALESCE(cl.name, cl.phone, 'tg_' || cl.telegram_id)";

  const searchPattern = search ? `%${search}%` : "";
  const searchCondition = search
    ? `AND (
      c.code ILIKE $1 OR
      ci.name ILIKE $1 OR
      t.name ILIKE $1 OR
      cl.name ILIKE $1 OR
      cl.phone ILIKE $1 OR
      cl.email ILIKE $1 OR
      cl.telegram_id::TEXT ILIKE $1
    )`
    : "";

  const query = `
    SELECT c.id, c.code, c.status, c.created_at,
           ci.name AS city_name, t.name AS tariff_name, t.price_cents AS amount_cents,
           cl.name AS payer_name, cl.phone AS payer_phone, cl.telegram_id AS payer_telegram_id, cl.email AS payer_email
    FROM certificates c
    JOIN clients cl ON cl.id = c.buyer_client_id
    JOIN tariffs t ON t.id = c.tariff_id
    JOIN cities ci ON ci.id = c.city_id
    WHERE 1=1 ${searchCondition}
    ORDER BY ${orderBy} ${order}
  `;
  const finalParams = search ? [searchPattern] : [];
  const result = await db.query<{
    id: number;
    code: string;
    status: string;
    created_at: Date;
    city_name: string;
    tariff_name: string;
    amount_cents: number;
    payer_name: string | null;
    payer_phone: string;
    payer_telegram_id: string | null;
    payer_email: string | null;
  }>(query, finalParams);

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    city_name: row.city_name,
    tariff_name: row.tariff_name,
    amount_cents: row.amount_cents,
    status: row.status,
    created_at: row.created_at.toISOString(),
    payer_name: row.payer_name,
    payer_phone: row.payer_phone,
    payer_telegram_id: row.payer_telegram_id != null ? String(row.payer_telegram_id) : null,
    payer_email: row.payer_email,
    source: row.payer_telegram_id != null ? "telegram" as const : "web" as const,
  }));
}

export function checkAdminKey(key: string | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return key === secret;
}
