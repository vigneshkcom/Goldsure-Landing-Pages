# Tracking Notes

This file exists so future edits do not accidentally break or duplicate tracking.

## Purpose

This project contains marketing tracking, internal lead tracking, Supabase lead storage, and internal email notifications.

If someone updates the design later, they should leave these items alone unless they are specifically asked to change tracking.

## Marketing tracking in page files

These pages include Google Tag Manager and Meta Pixel code:

- `smoke-alarm/index.html`
- `thank-you/smoke-alarm/index.html`
- `smoke-alarm/calculator/index.html`

Current tracking IDs:

- Google Tag Manager: `GTM-PSTXFKJL`
- Meta Pixel: `1482683390150721`

What is included on those pages:

- GTM script in the `<head>`
- GTM `noscript` iframe after `<body>`
- Meta Pixel script in the `<head>`
- Meta Pixel `noscript` image after `<body>`

Do not paste these a second time.

If duplicated, pageviews and events may fire twice.

## Custom frontend event tracking

The pages also fire custom events for GTM / Meta Pixel.

### Landing page

File:

- `smoke-alarm/index.html`

Examples of events:

- `phone_click_header`
- `phone_click_hero`
- `book_installation_click`
- `placement_guide_open`
- `form_loaded`
- `form_visible`

### Thank-you page

File:

- `thank-you/smoke-alarm/index.html`

Examples of events:

- `thank_you_page_view`
- `thank_you_phone_click`
- `thank_you_calculate_click`

### Calculator page

File:

- `smoke-alarm/calculator/index.html`

Examples of events:

- `calculator_page_view`
- `calculator_download_quote_click`
- `calculator_address_selected`
- `calculator_lead_saved`
- `calculator_lead_save_failed`

## Google Maps tracking-related setup

File:

- `api/maps-config.js`

Purpose:

- provides the Google Maps browser key to the calculator page

Related env var:

- `GOOGLE_MAPS_API_KEY`

## Supabase lead storage

File:

- `api/save-calculator-lead.js`

Purpose:

- saves calculator lead details into Supabase

Supabase table:

- `public.calculator_leads`

Related env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Internal tracker page

Files:

- `api/calculator-leads.js`
- `tracker/smoke-alarm/index.html`

Purpose:

- reads Supabase lead data
- shows internal tracker page
- supports search, date filtering, numeric age column, and CSV export

Tracker route:

- `/tracker/smoke-alarm`

## Internal email notifications

File:

- `api/save-calculator-lead.js`

Purpose:

- sends internal email after a calculator lead is saved

Email defaults:

- To: `info@goldsure.com.au`
- BCC: `kanishka@webco.au`

Related env vars:

- `RESEND_API_KEY`
- `EMAIL_TO`
- `EMAIL_BCC`
- `EMAIL_FROM`

## If asked to remove tracking

If someone says:

- "remove tracking"
- "remove GTM"
- "remove Meta Pixel"
- "remove Supabase lead tracking"
- "remove internal email notifications"

then remove only the relevant parts below.

### Remove GTM and Meta Pixel

Remove from:

- `smoke-alarm/index.html`
- `thank-you/smoke-alarm/index.html`
- `smoke-alarm/calculator/index.html`

Remove:

- GTM head script
- GTM `noscript` iframe
- Meta Pixel script
- Meta Pixel `noscript` image
- custom event push code only if marketing event tracking is also meant to be removed

### Remove calculator lead tracking

Remove:

- `api/save-calculator-lead.js`
- frontend call from `smoke-alarm/calculator/index.html` that posts to `/api/save-calculator-lead`
- Supabase lead save logic

### Remove tracker page

Remove:

- `api/calculator-leads.js`
- `tracker/smoke-alarm/index.html`
- route entries in `vercel.json` for `/tracker/smoke-alarm`

### Remove internal email notification

Remove:

- Resend email logic inside `api/save-calculator-lead.js`
- related env vars:
  - `RESEND_API_KEY`
  - `EMAIL_TO`
  - `EMAIL_BCC`
  - `EMAIL_FROM`

## Safe editing rule

Unless the task is specifically about tracking, analytics, lead storage, or notifications:

- do not remove these items
- do not duplicate these items
- do not change the tracking IDs
- do not rename event names without a good reason
