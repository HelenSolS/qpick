import pg from "pg";

const { Pool } = pg;

function getPool(): pg.Pool {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("POSTGRES_URL is not set");
  }
  return new Pool({
    connectionString: url,
    ssl: url.includes("pg4.sweb.ru") ? { rejectUnauthorized: false } : undefined,
  });
}

let pool: pg.Pool | null = null;

export function getDb(): pg.Pool {
  if (!pool) {
    pool = getPool();
  }
  return pool;
}

/** Quick Pic schema: clients have phone NOT NULL, telegram_id BIGINT UNIQUE */
export type ClientRow = {
  id: number;
  phone: string;
  telegram_id: string | null;
  created_at: Date;
};

/** Quick Pic: tariffs have city_id, price_cents */
export type TariffRow = {
  id: number;
  name: string;
  code: string;
  price_cents: number;
  city_id: number;
};

export type CityRow = {
  id: number;
  name: string;
};

/** Quick Pic: designs have city_id, preview_url, template_url, active */
export type DesignRow = {
  id: number;
  name: string;
  city_id: number | null;
};

/** Quick Pic certificates: buyer_client_id, status enum ACTIVE/REDEEMED/EXPIRED/CANCELLED; + migration: recipient_name, greeting, design_id */
export type CertificateRow = {
  id: number;
  buyer_client_id: number;
  tariff_id: number;
  design_id: number | null;
  city_id: number;
  code: string;
  recipient_name: string | null;
  greeting: string | null;
  status: string;
  expires_at: Date | null;
  created_at: Date;
  redeemed_at: Date | null;
};
