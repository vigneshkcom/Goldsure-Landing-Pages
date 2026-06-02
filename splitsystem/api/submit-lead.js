var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/492746c9-4dde-417e-b78e-5a4d773a49a1';

var ALLOWED_ORIGINS = [
  'https://splitsystem.goldsure.com.au',
  'https://offers.goldsure.com.au',
  'https://goldsure-landing-pages.vercel.app'
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

  if (!body.name || !body.phone || !body.email) {
    return json(res, 400, { error: 'Missing required fields' });
  }

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
    return json(res, 500, { error: 'Failed to forward lead' });
  }
};
