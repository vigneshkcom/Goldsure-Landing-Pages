# Goldsure Landing Pages

Standalone static Vercel project for the Goldsure smoke alarm landing page funnel.

## Project purpose

This repository is intended to be pushed as a new GitHub repository and deployed as a new, isolated Vercel project for:

- `https://offers.goldsure.com.au/smoke-alarm`

It does not depend on any other Goldsure repository or Vercel configuration.

## Folder structure

```text
/
|-- api/
|   `-- maps-config.js
|-- smoke-alarm/
|   |-- calculator/
|   |   `-- index.html
|   |-- thank-you/
|   |   `-- index.html
|   `-- index.html
|-- .gitignore
|-- DEPLOYMENT_NOTES.md
|-- README.md
`-- vercel.json
```

## Route mapping

- `/smoke-alarm` is served by `smoke-alarm/index.html`
- `/smoke-alarm/thank-you` is served by `smoke-alarm/thank-you/index.html`
- `/smoke-alarm/calculator` is served by `smoke-alarm/calculator/index.html`
- `vercel.json` contains explicit rewrites for all three clean URLs

## Funnel flow

- Main landing page: `/smoke-alarm`
- Thank-you page: `/smoke-alarm/thank-you`
- Calculator page: `/smoke-alarm/calculator`

## Notes about forms and assets

- The pages are static HTML files with inline CSS and JavaScript
- No local `assets/` folder is required for the current version because the page references external hosted images and embedded LeadConnector forms
- A minimal `/api/maps-config.js` endpoint is included so the calculator can load the Google Maps browser key in this standalone Vercel project

## Environment variables

The calculator address autocomplete requires a Google Maps browser key in this Vercel project.

Supported variable names:

- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

`GOOGLE_MAPS_API_KEY` is preferred for this static setup.

## How to deploy to Vercel

1. Create a new GitHub repository named `Goldsure Landing Pages`.
2. Push the contents of this folder to that new repository.
3. In Vercel, create a new project by importing that repository.
4. Keep the project as a static site:
   - Framework Preset: `Other`
   - Root Directory: `.`
   - Build Command: leave empty
   - Output Directory: leave empty
5. Add the Google Maps environment variable if you want the calculator address autocomplete enabled.
6. Deploy the project.

## How to connect the custom domain

1. Open the new Vercel project.
2. Go to `Settings -> Domains`.
3. Add `offers.goldsure.com.au`.
4. Update DNS at your DNS provider using the exact record Vercel shows for that subdomain.
5. Wait for verification and SSL issuance to complete.
6. Test:
   - `https://offers.goldsure.com.au/smoke-alarm`
   - `https://offers.goldsure.com.au/smoke-alarm/thank-you`
   - `https://offers.goldsure.com.au/smoke-alarm/calculator`

For the full step-by-step flow, including DNS checks, use [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md).
