# Goldsure Landing Pages

This is a standalone website project for the Goldsure smoke alarm funnel.

It is designed to be deployed on Vercel by itself.

## What this project does

This project contains:

- a smoke alarm landing page
- a thank-you page
- a calculator page
- a simple internal tracker page

Main live routes:

- `/smoke-alarm`
- `/thank-you/smoke-alarm`
- `/smoke-alarm/calculator`
- `/tracker/smoke-alarm`

## Folder structure

```text
/
|-- api/
|   |-- accept-calculator-quote.js
|   |-- calculator-leads.js
|   |-- maps-config.js
|   `-- save-calculator-lead.js
|-- smoke-alarm/
|   |-- calculator/
|   |   `-- index.html
|   `-- index.html
|-- thank-you/
|   `-- smoke-alarm/
|       `-- index.html
|-- tracker/
|   `-- smoke-alarm/
|       `-- index.html
|-- .gitignore
|-- DEPLOYMENT_NOTES.md
|-- README.md
|-- TRACKING_NOTES.md
`-- vercel.json
```

## Which file serves which page

- `/smoke-alarm` -> `smoke-alarm/index.html`
- `/thank-you/smoke-alarm` -> `thank-you/smoke-alarm/index.html`
- `/smoke-alarm/calculator` -> `smoke-alarm/calculator/index.html`
- `/tracker/smoke-alarm` -> `tracker/smoke-alarm/index.html`

The route rules are handled in `vercel.json`.

## What the API files do

- `api/maps-config.js`
  Gives the calculator access to the Google Maps key for address autocomplete.

- `api/save-calculator-lead.js`
  Saves calculator leads to Supabase, sends the quote-download notification, and sends the customer quote email.

- `api/calculator-leads.js`
  Loads lead data from Supabase for the tracker page.

- `api/accept-calculator-quote.js`
  Marks a quote as accepted and sends the accepted-quote internal notification.

## Environment variables needed in Vercel

Add these in your Vercel project settings:

- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_TO`
- `EMAIL_BCC`
- `EMAIL_FROM`

Example email values:

- `EMAIL_TO=info@goldsure.com.au`
- `EMAIL_BCC=kanishka@webco.au`
- `EMAIL_FROM=info@goldsure.com.au`

Notes:

- `EMAIL_TO`, `EMAIL_BCC`, and `EMAIL_FROM` are optional right now
- the project already has fallback email addresses in code
- current fallback behavior is:
- quote download notification goes to `info@goldsure.com.au` and BCCs `kanishka@webco.au`
- quote accepted notification goes to `info@goldsure.com.au`
- customer quote email sends from `Goldsure Pty Ltd <info@goldsure.com.au>`
- adding env vars in Vercel is still better if you want to change recipients later without editing code

## How to deploy

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Choose:
   - Framework Preset: `Other`
   - Root Directory: `.`
4. Add the environment variables listed above.
5. Deploy.

## What to check after deploy

Check these pages:

- `/smoke-alarm`
- `/thank-you/smoke-alarm`
- `/smoke-alarm/calculator`
- `/tracker/smoke-alarm`

Check these features:

- the landing page loads correctly
- the thank-you page loads correctly
- the calculator works
- Google address autocomplete works
- only Queensland addresses with postcodes starting with `4` are accepted
- a quote download saves the lead to Supabase
- the internal quote-download email is sent
- the customer quote email is sent
- clicking accept in the customer quote email updates the lead status
- the tracker page shows the saved lead

## Deployment notes

For the full deployment checklist, see [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md).

## Tracking notes

For tracking, analytics, lead capture, and notification details, see [TRACKING_NOTES.md](./TRACKING_NOTES.md).
