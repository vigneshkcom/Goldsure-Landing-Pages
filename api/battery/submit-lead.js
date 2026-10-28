// Battery enquiries go directly to their own pipeline, never the aircon workflow.
var LOCATION_ID = 'AOfC7QeiTk5m22pLkh8H';
var PIPELINE_ID = 'vNOSzOo0pXEnGS38xuNw';
var NEW_LEAD_STAGE_ID = '5ecf91e1-3067-4a4e-be2a-641cd0027923';

async function ghl(path, method, body) {
  var response = await fetch('https://services.leadconnectorhq.com' + path, {
    method: method || 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.GHL_API_KEY,
      Version: '2021-07-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('GHL request failed (' + response.status + ')');
  return response.json();
}

function normalisePhone(value) {
  var digits = String(value || '').replace(/\D/g, '');
  if (/^0[2378]\d{8}$/.test(digits) || /^04\d{8}$/.test(digits)) return '+61' + digits.slice(1);
  if (/^61[23478]\d{8}$/.test(digits)) return '+' + digits;
  return '';
}

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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(res, 400, { error: 'Invalid request body' });
  }

  if (body.website) {
    // Silently accept honeypot submissions without forwarding.
    return json(res, 200, { ok: true });
  }

  var name = clean(body.name, 120);
  var phone = normalisePhone(clean(body.phone, 40));
  var email = clean(body.email, 254).toLowerCase();
  var postcode = clean(body.postcode, 40);
  var hasSolar = clean(body.has_solar, 10);

  if (!name || !phone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || postcode.length < 3 || !['Yes', 'No'].includes(hasSolar)) {
    return json(res, 400, { error: 'Missing required fields' });
  }

  var nameParts = name.split(/\s+/);
  var lead = {
    name: name,
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(' '),
    phone: phone,
    email: email,
    postcode: postcode,
    source: 'Home Battery Page',
    lead_type: 'Battery Lead',
    internal_note: [
      'New enquiry from Home Battery Page (battery.goldsure.com.au).',
      'Submitted name: ' + name,
      'Submitted phone: ' + phone,
      'Submitted email: ' + email,
      'Postcode: ' + postcode + '.',
      'Has solar: ' + hasSolar + '.',
      'Solar installed: ' + (clean(body.solar_installed, 60) || 'Not provided') + '.',
      'Phase: ' + (clean(body.phase, 20) || 'Not provided') + '.',
      'Customer message: ' + (clean(body.message, 1000) || 'None provided'),
      'Page: ' + clean(body.page_url, 500),
      ...['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
        .map(function (key) { return key + ': ' + clean(body[key], 500); })
    ].join('\n')
  };

  try {
    if (!process.env.GHL_API_KEY) return json(res, 503, { error: 'Battery lead connection is unavailable. Please call us.' });

    // Fail closed if the live destination changes. Never fall back to another product.
    var pipelines = await ghl('/opportunities/pipelines?locationId=' + LOCATION_ID);
    var pipeline = (pipelines.pipelines || []).find(function (p) { return p.id === PIPELINE_ID && p.name === 'Battery Customers'; });
    if (!pipeline || !pipeline.stages.some(function (s) { return s.id === NEW_LEAD_STAGE_ID && s.name === 'New Lead'; })) {
      throw new Error('Battery pipeline or New Lead stage changed');
    }

    // Exact email/phone matching prevents duplicate contacts and ambiguous merges.
    var matches = new Map();
    for (var query of [phone, email]) {
      var result = await ghl('/contacts/?locationId=' + LOCATION_ID + '&query=' + encodeURIComponent(query) + '&limit=100');
      for (var candidate of result.contacts || []) {
        if (normalisePhone(candidate.phone) === phone || String(candidate.email || '').toLowerCase() === email) matches.set(candidate.id, candidate);
      }
    }
    if (matches.size > 1) throw new Error('Conflicting contact matches require review');
    var contactId = Array.from(matches.keys())[0];
    if (!contactId) {
      var created = await ghl('/contacts/', 'POST', {
        locationId: LOCATION_ID, firstName: lead.first_name, lastName: lead.last_name,
        phone: phone, email: email, country: 'AU', source: lead.source,
        // The form also accepts suburbs; only put actual postcodes in postalCode.
        ...(/^\d{4}$/.test(postcode) ? { postalCode: postcode } : {})
      });
      contactId = created.contact?.id || created.id;
    }
    if (!contactId) throw new Error('GHL did not confirm a contact');

    var opportunities = await ghl('/opportunities/search?location_id=' + LOCATION_ID + '&contact_id=' + encodeURIComponent(contactId) + '&limit=100');
    if (opportunities.meta?.nextPage || opportunities.meta?.total > 100) throw new Error('Opportunity search needs review');
    var existing = (opportunities.opportunities || []).find(function (o) {
      return o.pipelineId === PIPELINE_ID && o.status === 'open';
    });
    if (!existing) {
      var opportunity = await ghl('/opportunities/', 'POST', {
        locationId: LOCATION_ID, pipelineId: PIPELINE_ID, pipelineStageId: NEW_LEAD_STAGE_ID,
        contactId: contactId, name: name + ' - Battery enquiry', status: 'open', source: lead.source
      });
      if (!(opportunity.opportunity?.id || opportunity.id)) throw new Error('GHL did not confirm a Battery opportunity');
    }
    // Re-enquiries preserve an existing opportunity's progress and contact details.
    await ghl('/contacts/' + encodeURIComponent(contactId) + '/tags', 'POST', { tags: ['Battery'] });
    await ghl('/contacts/' + encodeURIComponent(contactId) + '/notes', 'POST', { body: lead.internal_note });
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error('[Battery lead]', err.message);
    return json(res, 502, { error: 'Unable to save your battery enquiry. Please try again or call us.' });
  }
};
