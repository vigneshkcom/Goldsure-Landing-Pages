// Battery leads use the Melbourne split system GHL webhook (tagged Battery) until a battery workflow exists.
var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/492746c9-4dde-417e-b78e-5a4d773a49a1';

var ALLOWED_ORIGINS = [
  'https://battery.goldsure.com.au',
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

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
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

  if (body.website) {
    // Silently accept honeypot submissions without forwarding.
    return json(res, 200, { ok: true });
  }

  var name = clean(body.name, 120);
  var phone = clean(body.phone, 40);
  var email = clean(body.email, 254);
  var postcode = clean(body.postcode, 20);
  var hasSolar = clean(body.has_solar, 10);

  if (!name || !phone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !postcode || !hasSolar) {
    return json(res, 400, { error: 'Missing required fields' });
  }

  var nameParts = name.split(/\s+/);
  var lead = Object.assign({}, body, {
    name: name,
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(' '),
    phone: phone,
    email: email,
    postcode: postcode,
    source: 'Home Battery Page',
    lead_type: 'Battery Lead',
    ghl_tags: ['Battery'],
    internal_note: [
      'New enquiry from Home Battery Page (battery.goldsure.com.au).',
      'Postcode: ' + postcode + '.',
      'Has solar: ' + hasSolar + '.',
      'Solar installed: ' + (clean(body.solar_installed, 60) || 'Not provided') + '.',
      'Phase: ' + (clean(body.phase, 20) || 'Not provided') + '.',
      'Customer message: ' + (clean(body.message, 1000) || 'None provided'),
      'Page: ' + clean(body.page_url, 500)
    ].join('\n')
  });

  try {
    var ghlRes = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });

    if (!ghlRes.ok) {
      return json(res, 502, { error: 'Webhook rejected: ' + ghlRes.status });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    return json(res, 500, { error: 'Failed to forward lead' });
  }
};
