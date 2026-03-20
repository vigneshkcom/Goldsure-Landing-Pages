# Deployment Notes

These steps assume:

- this folder will become a brand-new GitHub repository
- the repository name will be `Goldsure Landing Pages`
- the Vercel project will also be brand new
- the required public URLs are:
  - `https://offers.goldsure.com.au/smoke-alarm`
  - `https://offers.goldsure.com.au/thank-you/smoke-alarm`
  - `https://offers.goldsure.com.au/smoke-alarm/calculator`
  - `https://offers.goldsure.com.au/tracker/smoke-alarm`

## 1. Create the new GitHub repository

Create a new GitHub repository named:

- `Goldsure Landing Pages`

Then push this folder into that repository.

Suggested commands:

```powershell
git init
git add .
git commit -m "Initial smoke alarm landing page"
git branch -M main
git remote add origin <YOUR_NEW_GITHUB_REPO_URL>
git push -u origin main
```

## 2. Create the new Vercel project

In Vercel:

1. Click `Add New... -> Project`
2. Import the new GitHub repository
3. Use these settings:
   - Framework Preset: `Other`
   - Root Directory: `.`
   - Build Command: leave blank
   - Output Directory: leave blank
   - Install Command: leave blank
4. Add environment variables:
   - `GOOGLE_MAPS_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_TO`
   - `EMAIL_BCC`
   - `EMAIL_FROM`
5. Deploy

## 3. Add the custom domain

After the first deploy finishes:

1. Open the project in Vercel
2. Go to `Settings -> Domains`
3. Add `offers.goldsure.com.au`

Because `offers.goldsure.com.au` is a subdomain, Vercel will require a `CNAME` record.

Use the exact target shown in the Vercel domain setup screen. Vercel's current documentation says subdomains use a `CNAME` record, and the value may be either:

- a generic Vercel target such as `cname.vercel-dns.com`
- or a project-specific Vercel target shown in the dashboard

If the domain has already been connected to another Vercel project or account, Vercel may also require a temporary `TXT` verification record before the domain can be assigned here.

## 4. DNS record to create

At your DNS provider for `goldsure.com.au`, create or update:

- Type: `CNAME`
- Name/Host: `offers`
- Value/Target: use the exact Vercel-provided target from the new project's domain screen
- TTL: `Auto` or `300`

Important:

- Remove any existing `A`, `AAAA`, or conflicting `CNAME` record for `offers` before adding the new one
- If Vercel asks for a verification `TXT` record, add that exactly as shown and wait for verification to complete

## 5. Verify in Vercel

After DNS updates:

1. Return to the Vercel domain screen
2. Wait until the domain shows as valid/assigned
3. Wait for the SSL certificate to finish provisioning
4. Confirm these routes load:
   - `https://offers.goldsure.com.au/smoke-alarm`
   - `https://offers.goldsure.com.au/thank-you/smoke-alarm`
   - `https://offers.goldsure.com.au/smoke-alarm/calculator`
   - `https://offers.goldsure.com.au/tracker/smoke-alarm`

## 6. Final checks

Confirm all of the following after deployment:

- `https://offers.goldsure.com.au/smoke-alarm` loads successfully
- `https://offers.goldsure.com.au/thank-you/smoke-alarm` loads successfully
- `https://offers.goldsure.com.au/smoke-alarm/calculator` loads successfully
- `https://offers.goldsure.com.au/tracker/smoke-alarm` loads successfully
- the page shows the expected Goldsure smoke alarm content
- the embedded forms load correctly
- phone links still work
- external images still load
- Google address autocomplete works in the calculator modal
- only Queensland addresses with postcodes starting with `4` are accepted in the calculator
- calculator leads are saved into Supabase
- internal notification emails are sent through Resend
- the tracker page lists saved calculator leads
- no unrelated routes or APIs exist in the deployment

## Source references

These DNS notes are based on current Vercel documentation for custom domains and subdomains:

- [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
