-- Quick Pic Platform - Canonical PostgreSQL Schema (reference)
-- Source: quickpic_postgres_schema_v1
-- Use this as reference; the actual DB is created at pg4.sweb.ru

-- ENUMs: booking_status, payment_type, payment_status, certificate_status
-- Tables: cities, tariffs, designs, clients, photographers, bookings, certificates, payments, media_links, admin_users, notifications_log
-- Certificates: code, city_id, tariff_id, buyer_client_id, status (ACTIVE/REDEEMED/EXPIRED/CANCELLED), expires_at, redeemed_at, redeemed_booking_id
-- Clients: phone NOT NULL UNIQUE, telegram_id BIGINT UNIQUE
