# Goldsure Landing Pages

Standalone static Vercel project for the Goldsure smoke alarm landing page.

## Project purpose

This repository is intended to be pushed as a new GitHub repository and deployed as a new, isolated Vercel project for:

- `https://offers.goldsure.com.au/smoke-alarm`

It does not depend on any other Goldsure repository or Vercel configuration.

## Folder structure

```text
/
|-- smoke-alarm/
|   `-- index.html
|-- .gitignore
|-- DEPLOYMENT_NOTES.md
|-- README.md
`-- vercel.json
```

## Route mapping

- `/smoke-alarm` is served by `smoke-alarm/index.html`
- `vercel.json` rewrites `/smoke-alarm` and `/smoke-alarm/` to that file

## Notes about forms and assets

- The page is a static HTML file with inline CSS and JavaScript
- No local `assets/` folder is required for the current version because the page references external hosted images and embedded LeadConnector forms
- No `/api` folder is included because there is no local backend handler in this landing page

## How to deploy to Vercel

1. Create a new GitHub repository named `Goldsure Landing Pages`.
2. Push the contents of this folder to that new repository.
3. In Vercel, create a new project by importing that repository.
4. Keep the project as a static site:
   - Framework Preset: `Other`
   - Root Directory: `.`
   - Build Command: leave empty
   - Output Directory: leave empty
5. Deploy the project.

## How to connect the custom domain

1. Open the new Vercel project.
2. Go to `Settings -> Domains`.
3. Add `offers.goldsure.com.au`.
4. Update DNS at your DNS provider using the exact record Vercel shows for that subdomain.
5. Wait for verification and SSL issuance to complete.
6. Test `https://offers.goldsure.com.au/smoke-alarm`.

For the full step-by-step flow, including DNS checks, use [DEPLOYMENT_NOTES.md](C:\Users\vigne\Downloads\Landing Page\DEPLOYMENT_NOTES.md).
