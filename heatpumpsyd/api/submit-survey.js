/* ===========================================================================
   HEAT PUMPS SYDNEY - thank-you page survey proxy
   Second POST for the same contact. GoHighLevel matches on email or phone, so
   this payload overwrites the "Didn't submit additional context" default the
   lead form sent a moment earlier.

   TODO: swap for the Sydney webhook. This is still the MELBOURNE hot water
   GoHighLevel webhook, used as a placeholder so the survey works end to end.
   Changing it is a one-line edit on the constant below.
   =========================================================================== */
var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/75acb356-a9c6-40b7-afcc-0ba5a87d5701';

var ALLOWED_ORIGINS = [
  'https://heatpumpsyd.goldsure.com.au',
  'https://offers.goldsure.com.au',
  'https://goldsure-heatpumpsyd.vercel.app'
];

function setCors(req, res) {
  var origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  var body = req.body || {};

  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  /* The survey carries its identity across from sessionStorage. Without an
     email or a phone there is no contact for GoHighLevel to match against, so
     there is nothing worth forwarding. */
  if (!body.email && !body.phone) {
    return json(res, 400, { error: 'Missing contact identity' });
  }

  if (!body.campaign) { body.campaign = 'heat-pumps-sydney'; }
  if (!body.additional_context) { body.additional_context = "Didn't submit additional context"; }

  try {
    var ghlRes = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!ghlRes.ok) {
      return json(res, 502, { error: 'Webhook rejected: ' + ghlRes.status });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    return json(res, 500, { error: 'Failed to forward survey' });
  }
};
