-- Migration: remove subscriptions, plans and Asaas-related columns
-- Run once against the existing database before deploying the new backend version.

BEGIN;

-- Drop FK columns from users first to avoid constraint violations
ALTER TABLE users DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS external_id;

-- Drop subscription tables (order matters: events → subscriptions → plans)
DROP TABLE IF EXISTS subscriptions_events;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;

COMMIT;
