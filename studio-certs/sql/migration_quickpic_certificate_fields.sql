-- Run this on the Quick Pic database (e.g. pg4.sweb.ru) to support
-- the certificate purchase flow: recipient name, greeting, design.
-- Safe to run once (IF NOT EXISTS / do not fail if column exists).

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS greeting TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS design_id INTEGER REFERENCES designs(id);

COMMENT ON COLUMN certificates.recipient_name IS 'Имя получателя подарка (из формы покупки)';
COMMENT ON COLUMN certificates.greeting IS 'Поздравление (из формы покупки)';
COMMENT ON COLUMN certificates.design_id IS 'Выбранный дизайн сертификата';
