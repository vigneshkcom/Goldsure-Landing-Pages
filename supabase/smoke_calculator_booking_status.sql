alter table public.calculator_leads
  add column if not exists dataforce_job_id bigint,
  add column if not exists dataforce_appointment_id bigint,
  add column if not exists ghl_accepted_at timestamptz,
  add column if not exists booking_fee_paid_at timestamptz,
  add column if not exists booking_fee_amount numeric,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;
alter table public.calculator_leads add column if not exists booking_sync_pending boolean not null default false;
