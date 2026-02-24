-- Run this against your PostgreSQL if tables do not exist.
-- Indexes are included for identify-client, get-vault, and unique code lookups.

-- Clients (by telegram_id for Mini App)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_telegram_id ON clients(telegram_id);

-- Reference data: cities
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL
);

-- Reference data: tariffs
CREATE TABLE IF NOT EXISTS tariffs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  amount_cents INTEGER NOT NULL
);

-- Reference data: designs
CREATE TABLE IF NOT EXISTS designs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  tariff_id INTEGER NOT NULL REFERENCES tariffs(id),
  design_id INTEGER NOT NULL REFERENCES designs(id),
  city_id INTEGER NOT NULL REFERENCES cities(id),
  code VARCHAR(32) NOT NULL UNIQUE,
  recipient_name VARCHAR(256) NOT NULL,
  greeting TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_code ON certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_client_id ON certificates(client_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expires_at ON certificates(expires_at);
