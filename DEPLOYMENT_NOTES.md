# Deployment Notes

Use this file as a simple checklist for getting the project live.

## What this project needs

This project uses:

- Vercel for hosting
- GitHub for the code
- Google Maps for address autocomplete
- Supabase for storing calculator leads
- Resend for internal email notifications

## Pages in this project

These are the main routes:

- `/hotwater`
- `/smoke-alarm`
- `/thank-you/smoke-alarm`
- `/thank-you/hotwater`
- `/smoke-alarm/calculator`
- `/tracker/smoke-alarm`

## Step 1. Push the code to GitHub

Put this project in its own GitHub repo.

Suggested repo name:

- `Goldsure Landing Pages`

## Step 2. Create the Vercel project

In Vercel:

1. Create a new project.
2. Import this GitHub repo.
3. Use:
   - Framework Preset: `Other`
   - Root Directory: `.`
4. Do not add a build command unless you really need one.

## Step 3. Add environment variables in Vercel

Add these environment variables:

- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `PUBLIC_SITE_URL`
- `EMAIL_TO`
- `EMAIL_FROM`

Example email values:

- `EMAIL_TO=info@goldsure.com.au`
- `EMAIL_FROM=info@goldsure.com.au`
- `PUBLIC_SITE_URL=https://offers.goldsure.com.au`

Notes:

- `EMAIL_TO`, `EMAIL_FROM`, and `PUBLIC_SITE_URL` are optional right now
- the code already has fallback email addresses
- quote download notification fallback:
  - to `info@goldsure.com.au`
  - no bcc
- quote accepted notification fallback:
  - to `info@goldsure.com.au`
- customer quote email reply-to fallback:
  - `info@goldsure.com.au`
- customer reminder email reply-to fallback:
  - `info@goldsure.com.au`
- accept link base URL fallback:
  - `https://offers.goldsure.com.au`
- adding them in Vercel is still recommended if you want to manage email recipients without changing code

## Step 4. Add the custom domain

Use this domain:

- `offers.goldsure.com.au`

In Vercel:

1. Open the project.
2. Go to `Settings -> Domains`.
3. Add `offers.goldsure.com.au`.

## Step 5. Update DNS

At your DNS provider, point the `offers` subdomain to Vercel.

Usually this means:

- Type: `CNAME`
- Name: `offers`
- Value: the target Vercel gives you

Important:

- Use the exact value Vercel shows
- Remove any old conflicting DNS records for `offers`
- If Vercel asks for a TXT verification record, add that too

## Step 6. Deploy

Once the repo is connected and environment variables are added, deploy the project.

If the project is already connected to GitHub, pushing to `main` should trigger a new deployment automatically.

## Step 7. Check everything works

Open these pages:

- `https://offers.goldsure.com.au/hotwater`
- `https://offers.goldsure.com.au/smoke-alarm`
- `https://offers.goldsure.com.au/thank-you/hotwater`
- `https://offers.goldsure.com.au/thank-you/smoke-alarm`
- `https://offers.goldsure.com.au/smoke-alarm/calculator`
- `https://offers.goldsure.com.au/tracker/smoke-alarm`

Check these things:

- the hot water landing page loads
- the landing page loads
- the hot water thank-you page loads
- the thank-you page loads
- the calculator loads
- the tracker loads
- the calculator address field shows Google suggestions
- only Queensland addresses with postcodes starting with `4` are accepted
- downloading a quote saves a lead into Supabase
- an internal quote-download email is sent after a quote download
- a customer quote email is sent automatically
- accepting the quote sends an internal accepted notification
- the new lead appears in the tracker

## Final reminder

This project is meant to work by itself.

It should not need anything from another repo to deploy or run.
