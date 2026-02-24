-- Сохранение при покупке: согласие на ПД и запись о платеже.
-- Выполнить на БД Quick Pic после migration_quickpic_certificate_fields.sql.

-- Согласие на обработку ПД (дата/время)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pd_consent_at TIMESTAMPTZ;
COMMENT ON COLUMN certificates.pd_consent_at IS 'Момент согласия на обработку персональных данных при покупке';

-- Платежи по сертификатам (заглушка и позже ЮKassa)
CREATE TABLE IF NOT EXISTS certificate_payments (
  id                BIGSERIAL PRIMARY KEY,
  certificate_id    BIGINT NOT NULL REFERENCES certificates(id),
  amount_cents      INTEGER NOT NULL,
  provider          TEXT NOT NULL,   -- 'STUB' | 'YOOKASSA'
  external_id       TEXT,           -- id платежа у провайдера
  status            TEXT NOT NULL,  -- 'succeeded' | 'pending' | 'failed'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_payments_certificate_id ON certificate_payments(certificate_id);
