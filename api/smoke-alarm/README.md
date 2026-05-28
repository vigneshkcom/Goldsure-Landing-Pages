# Smoke Alarm API Folder Guide

This folder contains the backend files that run the smoke alarm quote system.

In plain English, these files handle:

- saving a new lead when someone fills in the calculator
- emailing the customer their quote
- emailing the Goldsure team about new quote downloads and accepted quotes
- sending reminder emails to customers
- updating the lead status in the tracker
- loading leads into the tracker
- giving the website the Google Maps key it needs

## Simple Flow

1. A customer fills in the smoke alarm calculator.
2. `save-lead.js` saves that lead and sends the first emails.
3. If the customer clicks the accept link in their quote email, `accept-quote.js` marks the quote as accepted and emails the team.
4. If the customer has not accepted yet, `send-reminder.js` can send them a reminder email.
5. The tracker uses `get-leads.js` to show all leads and `update-lead-status.js` to change their status.

## What Each File Does

### `save-lead.js`

This is the main starting point.

When someone submits the calculator:

- it saves their details into Supabase
- it creates their quote record
- it sends the customer their quote email
- it sends an internal notification email to the Goldsure team

Current email behaviour:

- customer quote email goes to the customer's email address
- internal quote-download email goes to `info@goldsure.com.au`
- that internal email has no BCC
- customer replies go to `info@goldsure.com.au`

### `accept-quote.js`

This handles the customer clicking the quote acceptance link.

It:

- finds the matching quote using the secure token in the link
- marks the quote as accepted in Supabase
- records when it was accepted
- sends an internal acceptance email to `info@goldsure.com.au`
- shows the customer a confirmation page in their browser

### `send-reminder.js`

This sends a reminder email to a customer who has not accepted yet.

It:

- loads the lead from Supabase
- sends the reminder email to the customer's email address
- increases the reminder count
- records the last reminder date and time

Customer replies from this reminder email also go to `info@goldsure.com.au`.

### `update-lead-status.js`

This is a small helper file for the tracker.

It lets the system manually change a lead status to one of these:

- `downloaded`
- `accepted`
- `won`

In simple terms, this is how the tracker can move a lead along its pipeline.

### `get-leads.js`

This loads the smoke alarm leads from Supabase.

The tracker uses it to show the list of leads, usually with the newest ones first.

### `maps-config.js`

This gives the website the Google Maps API key.

That key is usually needed for address lookup or address autocomplete in the calculator form.

## Non-Technical Summary

If you want the shortest possible explanation:

- `save-lead.js` = new quote request comes in
- `accept-quote.js` = customer accepts the quote
- `send-reminder.js` = send a follow-up reminder
- `update-lead-status.js` = change the lead stage in the tracker
- `get-leads.js` = show all leads in the tracker
- `maps-config.js` = lets the form use Google Maps address search
