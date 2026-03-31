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
|   `-- smoke-alarm/
|       |-- accept-quote.js
|       |-- get-leads.js
|       |-- maps-config.js
|       |-- save-lead.js
|       |-- send-reminder.js
|       `-- update-lead-status.js
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

- `api/smoke-alarm/maps-config.js`
  Gives the calculator access to the Google Maps key for address autocomplete.

- `api/smoke-alarm/save-lead.js`
  Saves calculator leads to Supabase, sends the quote-download notification, and sends the customer quote email.

- `api/smoke-alarm/get-leads.js`
  Loads lead data from Supabase for the tracker page.

- `api/smoke-alarm/accept-quote.js`
  Marks a quote as accepted and sends the accepted-quote internal notification.

- `api/smoke-alarm/send-reminder.js`
  Sends a reminder email with the quote back to the customer and increases the reminder count.

- `api/smoke-alarm/update-lead-status.js`
  Updates a lead status from the tracker, for example marking it as won.

## Email map

Use this section if you need to change who gets which email.

- Quote download internal notification
  - File: `api/smoke-alarm/save-lead.js`
  - Subject: `New Smoke Alarm Quote Downloaded From Landing Page - Customer Name`
  - Sent to: `info@goldsure.com.au`
  - BCC: none
  - What it is: internal alert when someone downloads a quote from the calculator

- Customer quote email
  - File: `api/smoke-alarm/save-lead.js`
  - Subject: `Your Smoke Alarm Quote - Goldsure`
  - Sent to: the customer email they entered in the calculator
  - Sender name: `Goldsure Pty Ltd`
  - Reply-to: `info@goldsure.com.au` by default, or `EMAIL_TO` if that env var is set
  - What it is: the actual quote email the customer receives

- Quote accepted internal notification
  - File: `api/smoke-alarm/accept-quote.js`
  - Subject: `Quote Accepted (Landing Page download) - Customer Name - $Amount`
  - Sent to: `info@goldsure.com.au`
  - What it is: internal alert after the customer clicks the accept button in the quote email

- Customer reminder email
  - File: `api/smoke-alarm/send-reminder.js`
  - Subject: `Reminder: Your Smoke Alarm Quote - Goldsure`
  - Sent to: the customer email they entered in the calculator
  - Reply-to: `info@goldsure.com.au` by default, or `EMAIL_TO` if that env var is set
  - What it is: a follow-up email that re-sends the quote and accept button

## Where to change email settings

- To change the quote download internal recipients:
  - edit `api/smoke-alarm/save-lead.js`

- To change the customer email sender name, footer details, or reply-to:
  - edit `api/smoke-alarm/save-lead.js`

- To change the accepted-quote internal recipients:
  - edit `api/smoke-alarm/accept-quote.js`

- To change the reminder email wording or who it sends to:
  - edit `api/smoke-alarm/send-reminder.js`

- To change the sender email address for all emails:
  - change `EMAIL_FROM` in Vercel

- To change the reply-to address used in the customer quote email:
  - change `EMAIL_TO` in Vercel

## Environment variables needed in Vercel

Add these in your Vercel project settings:

- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_TO`
- `EMAIL_FROM`

Example email values:

- `EMAIL_TO=info@goldsure.com.au`
- `EMAIL_FROM=info@goldsure.com.au`

Notes:

- `EMAIL_TO` and `EMAIL_FROM` are optional right now
- the project already has fallback email addresses in code
- current fallback behavior is:
- quote download notification goes to `info@goldsure.com.au` with no BCC
- quote accepted notification goes to `info@goldsure.com.au`
- customer quote email replies go to `info@goldsure.com.au`
- customer reminder email replies go to `info@goldsure.com.au`
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
- the tracker can mark a lead as won
- the tracker can send a reminder email to a customer
- the tracker shows how many reminders have been sent

## Deployment notes

For the full deployment checklist, see [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md).

## Architecture notes

For the repo structure, request flow, API responsibilities, and service dependencies, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tracking notes

For tracking, analytics, lead capture, and notification details, see [TRACKING_NOTES.md](./TRACKING_NOTES.md).
