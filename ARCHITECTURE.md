# Architecture Notes

This project is a standalone Vercel site for the Goldsure smoke alarm funnel.

It uses static HTML pages for the frontend and simple serverless API routes for lead capture, email sending, and tracker actions.

## High-Level Shape

- Frontend pages live as static HTML files.
- API endpoints live under `api/smoke-alarm/`.
- Vercel rewrites friendly URLs to those static files and API handlers.
- Supabase stores lead and tracker data.
- Resend sends customer and internal emails.
- Google Maps powers address autocomplete on the calculator page.

## Main Pages

- `/smoke-alarm`
  - file: `smoke-alarm/index.html`
  - purpose: main landing page with embedded lead form

- `/thank-you/smoke-alarm`
  - file: `thank-you/smoke-alarm/index.html`
  - purpose: thank-you page after key actions

- `/smoke-alarm/calculator`
  - file: `smoke-alarm/calculator/index.html`
  - purpose: quote calculator and lead capture flow

- `/tracker/smoke-alarm`
  - file: `tracker/smoke-alarm/index.html`
  - purpose: internal lead tracker for reminders and status changes

## API Layer

All smoke alarm backend handlers live in `api/smoke-alarm/`.

- `save-lead.js`
  - saves a calculator lead in Supabase
  - generates the quote token
  - sends the customer quote email
  - sends the internal quote-download notification

- `accept-quote.js`
  - accepts a quote from the emailed token link
  - updates the lead to accepted
  - records `accepted_at`
  - sends the internal acceptance notification

- `send-reminder.js`
  - sends the reminder email to the customer
  - increments `reminder_count`
  - updates `last_reminder_at`

- `get-leads.js`
  - loads lead data for the internal tracker

- `update-lead-status.js`
  - updates tracker lead status values such as `downloaded`, `accepted`, and `won`

- `maps-config.js`
  - returns the Google Maps key to the calculator frontend

## Request Flow

### Lead capture flow

1. Customer visits the calculator page.
2. Calculator frontend posts to `/api/smoke-alarm/save-lead`.
3. `save-lead.js` stores the lead in Supabase.
4. `save-lead.js` sends:
   - customer quote email
   - internal quote-download notification
5. Tracker can later load that lead from Supabase.

### Quote acceptance flow

1. Customer clicks the accept link from the quote email.
2. Vercel rewrite routes `/accept-quote/smoke-alarm` to `api/smoke-alarm/accept-quote.js`.
3. `accept-quote.js` looks up the lead by `quote_token`.
4. It updates the lead status to `accepted`.
5. It records `accepted_at`.
6. It sends the internal acceptance email.
7. It returns an HTML confirmation page to the customer.

### Reminder flow

1. Internal team opens the tracker page.
2. Tracker calls `/api/smoke-alarm/get-leads` to load records.
3. User triggers reminder send from the tracker UI.
4. Tracker posts the lead id to `/api/smoke-alarm/send-reminder`.
5. `send-reminder.js` sends the reminder email and updates reminder tracking fields.

## Data Dependencies

Primary table:

- `public.calculator_leads`

Important fields used by the flow:

- `id`
- `full_name`
- `email`
- `phone`
- `property_address`
- `status`
- `quote_token`
- `accepted_at`
- `reminder_count`
- `last_reminder_at`

## Email Routing

Current default behavior in code:

- quote download internal notification
  - to `info@goldsure.com.au`
  - no bcc

- quote accepted internal notification
  - to `info@goldsure.com.au`

- customer quote email
  - sent to customer email
  - reply-to defaults to `info@goldsure.com.au`

- customer reminder email
  - sent to customer email
  - reply-to defaults to `info@goldsure.com.au`

## Route Configuration

Route rewrites are defined in `vercel.json`.

Important rewrite:

- `/accept-quote/smoke-alarm` -> `/api/smoke-alarm/accept-quote`

This keeps the customer-facing acceptance URL clean while still using a serverless handler.

## External Services

- Vercel
  - hosting and serverless function runtime

- Supabase
  - lead storage and tracker updates

- Resend
  - customer and internal email delivery

- Google Maps
  - address autocomplete support

## Environment Variables

Main variables used by this repo:

- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_TO`
- `EMAIL_FROM`
- `PUBLIC_SITE_URL`

Notes:

- `EMAIL_TO` controls the fallback reply-to address for customer quote emails and reminder emails
- `EMAIL_FROM` controls the sender address
- `PUBLIC_SITE_URL` controls the base URL used in customer accept links
- if `PUBLIC_SITE_URL` is not set, accept links fall back to `https://offers.goldsure.com.au`

## What Is Not In This Repo

- No framework app layer such as Next.js pages or React components
- No local skill files are needed for this repo
- No separate database migration files are stored here
- No separate email template files exist; the email HTML is built inside the API handlers
