-- Migration 006: Migrate subscriptions schema from Flutterwave to Paystack
-- Run this in your Supabase SQL editor

-- 1. Add Paystack-specific columns (if they don't already exist)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_customer_id        TEXT;

-- 2. Remove Flutterwave-specific columns (safe to drop if migration 005 created them)
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS flutterwave_customer_id,
  DROP COLUMN IF EXISTS flutterwave_subscription_id;

-- 3. Update the process_subscription_payment RPC to use 'paystack' as gateway
CREATE OR REPLACE FUNCTION process_subscription_payment(
  p_user_id                UUID,
  p_subscription_id        UUID,
  p_amount                 NUMERIC,
  p_currency               TEXT,
  p_gateway_reference      TEXT,
  p_current_period_start   TIMESTAMPTZ,
  p_current_period_end     TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (user_id, subscription_id, amount, currency, gateway, gateway_reference, status)
  VALUES (p_user_id, p_subscription_id, p_amount, p_currency, 'paystack', p_gateway_reference, 'paid');

  UPDATE subscriptions
  SET status               = 'ACTIVE',
      current_period_start = p_current_period_start,
      current_period_end   = p_current_period_end,
      updated_at           = NOW()
  WHERE id = p_subscription_id;

  UPDATE public.users
  SET plan = 'PREMIUM'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the process_subscription_renewal RPC to use 'paystack' as gateway
CREATE OR REPLACE FUNCTION process_subscription_renewal(
  p_subscription_id        UUID,
  p_amount                 NUMERIC,
  p_currency               TEXT,
  p_gateway_reference      TEXT,
  p_current_period_start   TIMESTAMPTZ,
  p_current_period_end     TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO payments (user_id, subscription_id, amount, currency, gateway, gateway_reference, status)
  SELECT user_id, id, p_amount, p_currency, 'paystack', p_gateway_reference, 'paid'
  FROM subscriptions WHERE id = p_subscription_id;

  UPDATE subscriptions
  SET status               = 'ACTIVE',
      current_period_start = p_current_period_start,
      current_period_end   = p_current_period_end,
      updated_at           = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Update the mark_subscription_past_due RPC to use 'paystack' as gateway
CREATE OR REPLACE FUNCTION mark_subscription_past_due(
  p_subscription_id    UUID,
  p_gateway_reference  TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM subscriptions WHERE id = p_subscription_id;

  INSERT INTO payments (user_id, subscription_id, amount, currency, gateway, gateway_reference, status)
  VALUES (v_user_id, p_subscription_id, 0, 'USD', 'paystack', p_gateway_reference, 'failed');

  UPDATE subscriptions
  SET status     = 'PAST_DUE',
      updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;
