// Published GHL workflow: Goldsure Battery Website Leads.
// Keep direct GHL delivery as a fallback if the inbound webhook rejects a lead.
var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/282cb68b-d749-4c5b-af30-856ebdd980aa';
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

function enquirySource(body) {
  var source = clean(body.utm_source, 100).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(facebook|fb|meta|instagram|ig)(ads|paid|cpc)?$/.test(source)) return 'Facebook';
  if (/^(google|googleads|googleadwords|adwords|youtube)$/.test(source)) return 'Google';
  if (clean(body.gclid, 500) || clean(body.gbraid, 500) || clean(body.wbraid, 500)) return 'Google';
  if (clean(body.fbclid, 500)) return 'Facebook';
  try {
    var host = new URL(clean(body.referrer, 1000)).hostname.toLowerCase();
    if (/(^|\.)(facebook\.com|instagram\.com|fb\.com)$/.test(host)) return 'Facebook';
    if (/(^|\.)(google\.[a-z.]+|youtube\.com)$/.test(host)) return 'Google';
  } catch (_) {}
  return 'Direct inquiry';
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
  var source = enquirySource(body);
  var trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'gbraid', 'wbraid'];
  var lead = {
    name: name,
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(' '),
    phone: phone,
    email: email,
    postcode: postcode,
    has_solar: hasSolar,
    solar_installed: clean(body.solar_installed, 60),
    phase: clean(body.phase, 20),
    message: clean(body.message, 1000),
    page_url: clean(body.page_url, 500),
    referrer: clean(body.referrer, 1000),
    ...Object.fromEntries(trackingKeys
      .map(function (key) { return [key, clean(body[key], 500)]; })),
    source: source,
    lead_type: 'Battery Lead',
    internal_note: [
      'Source: ' + source,
      'Submitted name: ' + name,
      'Submitted phone: ' + phone,
      'Submitted email: ' + email,
      'Postcode: ' + postcode + '.',
      'Has solar: ' + hasSolar + '.',
      'Solar installed: ' + (clean(body.solar_installed, 60) || 'Not provided') + '.',
      'Phase: ' + (clean(body.phase, 20) || 'Not provided') + '.',
      'Customer message: ' + (clean(body.message, 1000) || 'None provided'),
      clean(body.page_url, 500) ? 'Page: ' + clean(body.page_url, 500) : '',
      clean(body.referrer, 1000) ? 'Referrer: ' + clean(body.referrer, 1000) : '',
      ...trackingKeys.filter(function (key) { return clean(body[key], 500); })
        .map(function (key) { return key + ': ' + clean(body[key], 500); })
    ].filter(Boolean).join('\n')
  };

  try {
    var webhookResponse = await fetch(GHL_WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead), signal: AbortSignal.timeout(12000)
    });
    if (!webhookResponse.ok) throw new Error('Webhook rejected (' + webhookResponse.status + ')');
    var acknowledgement = await webhookResponse.json();
    // A draft trigger returns HTTP 200 with "test request received" but runs no actions.
    if (acknowledgement.status !== 'Success: request sent to trigger execution server' || !acknowledgement.id) {
      throw new Error('Webhook did not confirm a live workflow execution');
    }
    console.info('[Battery lead] Webhook execution accepted:', acknowledgement.id);
    return json(res, 200, { ok: true, submissionId: acknowledgement.id });
  } catch (error) {
    console.warn('[Battery lead] Webhook unavailable; using direct GHL delivery:', error.message);
  }

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
    var primaryContact = Array.from(matches.values())[0];
    if (!contactId) {
      var created = await ghl('/contacts/', 'POST', {
        locationId: LOCATION_ID, firstName: lead.first_name, lastName: lead.last_name,
        phone: phone, email: email, country: 'AU', source: lead.source,
        // The form also accepts suburbs; only put actual postcodes in postalCode.
        ...(/^\d{4}$/.test(postcode) ? { postalCode: postcode } : {})
      });
      contactId = created.contact?.id || created.id;
      primaryContact = created.contact;
    }
    if (!contactId) throw new Error('GHL did not confirm a contact');
    var primaryName = primaryContact?.name || [primaryContact?.firstName, primaryContact?.lastName].filter(Boolean).join(' ') || name;

    var opportunities = await ghl('/opportunities/search?location_id=' + LOCATION_ID + '&contact_id=' + encodeURIComponent(contactId) + '&limit=100');
    if (opportunities.meta?.nextPage || opportunities.meta?.total > 100) throw new Error('Opportunity search needs review');
    var existing = (opportunities.opportunities || []).find(function (o) {
      return o.pipelineId === PIPELINE_ID && o.status === 'open';
    });
    if (!existing) {
      var opportunity = await ghl('/opportunities/', 'POST', {
        locationId: LOCATION_ID, pipelineId: PIPELINE_ID, pipelineStageId: NEW_LEAD_STAGE_ID,
        contactId: contactId, name: primaryName, status: 'open', source: lead.source
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
