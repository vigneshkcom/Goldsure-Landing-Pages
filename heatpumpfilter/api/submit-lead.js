var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/75acb356-a9c6-40b7-afcc-0ba5a87d5701';
var { renderCustomerEnquiryEmail } = require('../lib/lead-email');
var { hasHostingerMailConfig, sendHostingerMail } = require('../lib/hostinger-mail');

var ALLOWED_ORIGINS = [
  'https://heatpumps.goldsure.com.au',
  'https://offers.goldsure.com.au',
  'https://goldsure-landing-pages.vercel.app',
  'https://heatpumpfilter.goldsure.com.au',
  'https://goldsure-heatpumpfilter.vercel.app'
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

  if (body.website) {
    // Silently accept honeypot submissions without forwarding or sending email.
    return json(res, 200, { ok: true });
  }

  var name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  var phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
  var email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
  var interest = typeof body.interest === 'string' ? body.interest.trim() : '';
  var allowedInterests = ['The $2,999 bundle', 'Just the heat pump'];

  if (!name || !phone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedInterests.includes(interest)) {
    return json(res, 400, { error: 'Missing required fields' });
  }

  var isBundle = interest === 'The $2,999 bundle';
  var lead = Object.assign({}, body, {
    name: name,
    phone: phone,
    email: email,
    interest: interest,
    lead_type: isBundle ? 'Water Filter Lead' : 'Heat Pump Lead',
    ghl_tags: isBundle ? ['Water Filter Lead'] : [],
    internal_note: [
      'New enquiry from Heat Pump + Water Filter Bundle Page.',
      'Requested offer: ' + interest + '.',
      'Postcode: ' + String(body.postcode || 'Not provided').trim().slice(0, 20) + '.',
      'Preferred call time: ' + String(body.preferred_time_of_call || 'Not provided').trim().slice(0, 80) + '.',
      'Customer message: ' + String(body.message || 'None provided').trim().slice(0, 1000),
      'Page: ' + String(body.page_url || '').trim().slice(0, 500)
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

    var emailStatus = 'not_configured';
    if (hasHostingerMailConfig()) {
      try {
        var emailContent = renderCustomerEnquiryEmail({ name: name, interest: interest });
        await sendHostingerMail({
          to: email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
        emailStatus = 'sent';
      } catch (mailError) {
        // The GHL lead is already accepted; do not make the form retry and create a duplicate lead.
        console.error('Customer enquiry email was not sent:', mailError.code || mailError.status || 'Hostinger error');
        emailStatus = 'failed';
      }
    }

    return json(res, 200, { ok: true, emailStatus: emailStatus });
  } catch (err) {
    return json(res, 500, { error: 'Failed to forward lead' });
  }
};
