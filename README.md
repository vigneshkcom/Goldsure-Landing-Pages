# Goldsure Landing Pages Workflow

This repository contains the standalone, conversion-optimised landing pages and unified calculator funnel for Goldsure. 

**Live Domain:** [https://offers.goldsure.com.au](https://offers.goldsure.com.au)  
**Hosting Environment:** Vercel (Serverless)

---

## 1. The Funnel Workflow

The user journey is strategically split into distinct lead-capture phases to maximise conversions and generate immediate quoting data.

### Step 1: The Opt-In (Landing Page)
- **URL:** [https://offers.goldsure.com.au/smoke-alarm](https://offers.goldsure.com.au/smoke-alarm)
- **Action:** Users fill out the Hero section form to request a quote.
- **System:** This form is a **GoHighLevel (LeadConnector) iframe**. Leads submitted here are instantly captured directly into the Goldsure GHL CRM.
- **Routing:** Upon successful submission, the GHL form automatically redirects the user's browser to the custom Thank You Page.

### Step 2: The Soft-Upsell (Thank You Page)
- **URL:** [https://offers.goldsure.com.au/thank-you/smoke-alarm](https://offers.goldsure.com.au/thank-you/smoke-alarm)
- **Action:** Users are thanked for their enquiry and prompted to click the primary CTA: "Calculate My Requirements" to get an instant breakdown of the hardware they need.
- **System:** Clicking this button is natively tracked via our data layer and routes the user into the internal quote calculator flow.

### Step 3: The Calculator Flow & Backend Execution
- **URL:** [https://offers.goldsure.com.au/smoke-alarm/calculator](https://offers.goldsure.com.au/smoke-alarm/calculator)
- **Action:** The user inputs their specific property details (number of bedrooms, levels, etc.) to receive an instant on-screen quote.
- **System:** When the user completes the calculator, it triggers a background Vercel serverless function (`/api/smoke-alarm/save-lead.js`).
  - **Data Routing:** 
  - The finalised quote data is securely saved to a **Supabase** PostgreSQL database.
  - **Resend** (the transactional email API) automatically emails an internal notification to the Goldsure team AND simultaneously sends a stylised HTML quote PDF/email directly to the customer.

### Hot Water Landing Page (Static)
- **URL:** [https://offers.goldsure.com.au/hotwater](https://offers.goldsure.com.au/hotwater)
- **System:** This route is a static HTML page served by Vercel rewrite rules.
- **Current Scope:** Frontend-only page flow (no dedicated hot water backend API handlers in this repo yet).
- **Related Thank You URL:** [https://offers.goldsure.com.au/thank-you/hotwater](https://offers.goldsure.com.au/thank-you/hotwater)

---

## 2. Tracking Architecture & Analytics

This landing page is hardcoded with specific tags to ensure seamless attribution for advertising campaigns.

### Hardcoded Tags
1. **Google Tag Manager**
   - **ID:** `GTM-PSTXFKJL`
   - **Placement:** Base script inside the `<head>`, fallback `<noscript>` directly inside the `<body>`.

2. **Meta (Facebook) Pixel**
   - **ID:** `1482683390150721`
   - **Placement:** Base pageview initialization inside the `<head>`, immediately following GTM.

### Custom Conversion Events (`dataLayer`)
The application intercepts specific user interactions across the funnel and instantly pushes them to both `window.dataLayer.push()` and `fbq('trackCustom')`. 

**Key Events Tracked:**
- `book_installation_click`: Triggered when users click secondary anchor links on the landing page to jump back up to the primary Hero form.
- `phone_click_hero` / `phone_click_header`: Triggered on direct `tel:` link clicks on desktop and mobile.
- `thank_you_calculate_click`: Triggered on the Thank You page when a user proceeds to the calculator.
- `thank_you_page_view`: Fired automatically upon landing on the Thank You page (This is the primary Lead conversion metric post-GoHighLevel submission).

---

## 3. Database & Services Overview

If you need to query leads, test deliverability, or understand where the data lives post-capture:
- **Hosting / Routing:** Vercel handles all URL rewrites (e.g., rewriting `/smoke-alarm` directly to the static `smoke-alarm/index.html` file) via `vercel.json` and powers the backend API logic.
- **Database:** Supabase (Queries are stored in the `public.calculator_leads` table).
- **Email Delivery:** Resend triggers the dynamic HTML quote notifications.

*(Note for Developers: Deep-dive API maps, serverless routing architectures, and internal tracking payloads are preserved in `ARCHITECTURE.md` and `TRACKING_NOTES.md`)*
