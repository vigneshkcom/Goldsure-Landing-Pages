const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/battery/submit-lead.js');
const originalFetch = global.fetch;
const originalKey = process.env.GHL_API_KEY;
after(() => { global.fetch = originalFetch; if (originalKey === undefined) delete process.env.GHL_API_KEY; else process.env.GHL_API_KEY = originalKey; });
const pipeline = { id: 'vNOSzOo0pXEnGS38xuNw', name: 'Battery Customers', stages: [{ id: '5ecf91e1-3067-4a4e-be2a-641cd0027923', name: 'New Lead' }] };
const body = { name: 'Battery Test', phone: '0491 570 006', email: 'battery-test@example.com', postcode: '3000', has_solar: 'Yes', phase: 'Three', solar_installed: '5 to 10 years ago', message: 'Please quote', utm_campaign: 'battery-october' };
async function run(input = body, options = {}) {
  const calls = [];
  const webhookCalls = [];
  process.env.GHL_API_KEY = options.noKey ? '' : 'test-key';
  global.fetch = async (url, init) => {
    assert.ok(url.startsWith('https://services.leadconnectorhq.com/'));
    const data = init.body ? JSON.parse(init.body) : null;
    if (url.includes('/hooks/')) {
      assert.equal(url, 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/282cb68b-d749-4c5b-af30-856ebdd980aa');
      webhookCalls.push({ url, data });
      if (options.webhookAccepted) return { ok: true, json: async () => ({ status: 'Success: request sent to trigger execution server', id: 'execution-1' }) };
      if (options.webhookDraft) return { ok: true, json: async () => ({ status: 'Success: test request received' }) };
      return { ok: false, status: 503 };
    }
    calls.push({ url, method: init.method, data });
    if (options.failure && url.includes(options.failure)) return { ok: false, status: 503 };
    let payload;
    if (url.includes('/opportunities/pipelines')) payload = { pipelines: options.wrongPipeline ? [] : [pipeline] };
    else if (url.includes('/contacts/?')) payload = { contacts: options.contacts || [] };
    else if (url.endsWith('/contacts/')) payload = { contact: { id: 'contact-1' } };
    else if (url.includes('/opportunities/search')) payload = { opportunities: options.opportunities || [], meta: { total: (options.opportunities || []).length, nextPage: null } };
    else if (url.endsWith('/opportunities/')) payload = { opportunity: { id: 'opportunity-1' } };
    else payload = { success: true };
    return { ok: true, json: async () => payload };
  };
  const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(value) { this.body = value ? JSON.parse(value) : null; } };
  await handler({ method: options.method || 'POST', headers: { origin: 'https://battery.goldsure.com.au' }, body: input }, res);
  return { res, calls, webhookCalls };
}
test('new lead creates contact and exact Battery New Lead opportunity with form notes', async () => {
  const { res, calls } = await run();
  assert.equal(res.statusCode, 200);
  const contact = calls.find(c => c.url.endsWith('/contacts/')).data;
  assert.equal(contact.phone, '+61491570006');
  assert.equal(contact.postalCode, '3000');
  const opportunity = calls.find(c => c.url.endsWith('/opportunities/')).data;
  assert.equal(opportunity.pipelineId, pipeline.id);
  assert.equal(opportunity.pipelineStageId, pipeline.stages[0].id);
  assert.equal(opportunity.source, 'Direct inquiry');
  assert.equal(opportunity.name, body.name);
  const note = calls.find(c => c.url.endsWith('/notes')).data.body;
  for (const value of ['5 to 10 years ago', 'Three', 'Please quote', 'battery-october']) assert.ok(note.includes(value));
  assert.deepEqual(calls.find(c => c.url.endsWith('/tags')).data.tags, ['Battery']);
});
test('repeat enquiry reuses contact and preserves progressed Battery opportunity', async () => {
  const { res, calls } = await run(body, { contacts: [{ id: 'existing', phone: '+61491570006', email: body.email }], opportunities: [{ id: 'existing-deal', pipelineId: pipeline.id, pipelineStageId: 'quote-sent', status: 'open' }] });
  assert.equal(res.statusCode, 200);
  assert.ok(!calls.some(c => c.url.endsWith('/contacts/') || c.url.endsWith('/opportunities/') || c.method === 'PUT'));
  assert.ok(calls.some(c => c.url.endsWith('/contacts/existing/notes')));
});
test('aircon opportunities do not prevent a new Battery opportunity', async () => {
  const { calls, res } = await run(body, { opportunities: [{ id: 'aircon', pipelineId: 'aircon', status: 'open' }] });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.find(c => c.url.endsWith('/opportunities/')).data.pipelineId, pipeline.id);
});
test('conflicting contacts stop without modifying either record', async () => {
  const { res, calls } = await run(body, { contacts: [{ id: 'a', phone: '+61491570006' }, { id: 'b', email: body.email }] });
  assert.equal(res.statusCode, 502);
  assert.ok(calls.every(c => c.method === 'GET'));
});
test('wrong destination or failed opportunity never reports success', async () => {
  assert.equal((await run(body, { wrongPipeline: true })).res.statusCode, 502);
  assert.equal((await run(body, { failure: '/opportunities/' })).res.statusCode, 502);
});
test('invalid inputs, null JSON and honeypots never reach GHL', async () => {
  for (const input of [null, 'null', { ...body, phone: '123' }, { ...body, has_solar: 'maybe' }]) {
    const { res, calls } = await run(input);
    assert.equal(res.statusCode, 400);
    assert.equal(calls.length, 0);
  }
  const spam = await run({ website: 'spam' });
  assert.equal(spam.res.statusCode, 200);
  assert.equal(spam.calls.length, 0);
});
test('missing credentials, preflight and methods are handled without forwarding', async () => {
  assert.equal((await run(body, { noKey: true })).res.statusCode, 503);
  assert.equal((await run(body, { method: 'OPTIONS' })).res.statusCode, 204);
  assert.equal((await run(body, { method: 'GET' })).res.statusCode, 405);
});
test('suburb input stays in note instead of becoming an invalid postal code', async () => {
  const { res, calls } = await run({ ...body, postcode: 'Brunswick' });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.find(c => c.url.endsWith('/contacts/')).data.postalCode, undefined);
  assert.ok(calls.find(c => c.url.endsWith('/notes')).data.body.includes('Brunswick'));
});
test('published webhook receives mapped form fields without also running direct delivery', async () => {
  const { res, calls, webhookCalls } = await run({ ...body, source: 'Aircon', pipelineId: 'wrong-pipeline', secret: 'not-forwarded' }, { webhookAccepted: true });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.submissionId, 'execution-1');
  assert.equal(calls.length, 0);
  assert.equal(webhookCalls.length, 1);
  const lead = webhookCalls[0].data;
  assert.equal(lead.phone, '+61491570006');
  assert.equal(lead.source, 'Direct inquiry');
  assert.equal(lead.has_solar, 'Yes');
  assert.equal(lead.phase, 'Three');
  assert.equal(lead.utm_campaign, body.utm_campaign);
  assert.equal(lead.secret, undefined);
  assert.equal(lead.pipelineId, undefined);
});
test('a draft webhook HTTP 200 falls back to confirmed direct GHL delivery', async () => {
  const { res, calls } = await run(body, { webhookDraft: true });
  assert.equal(res.statusCode, 200);
  assert.ok(calls.some(c => c.url.endsWith('/opportunities/')));
  assert.ok(calls.some(c => c.url.endsWith('/notes')));
});
test('published webhook can save leads independently of fallback credentials', async () => {
  const { res, calls } = await run(body, { webhookAccepted: true, noKey: true });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 0);
});
test('UTM source aliases resolve to Facebook or Google before click-ID fallbacks', async () => {
  for (const [utm_source, expected] of [['facebook', 'Facebook'], ['fb', 'Facebook'], ['meta', 'Facebook'], ['instagram', 'Facebook'], ['Google', 'Google'], ['google_ads', 'Google']]) {
    const { webhookCalls } = await run({ ...body, utm_source }, { webhookAccepted: true });
    assert.equal(webhookCalls[0].data.source, expected);
    assert.ok(webhookCalls[0].data.internal_note.startsWith('Source: ' + expected + '\n'));
    assert.ok(webhookCalls[0].data.internal_note.includes('utm_source: ' + utm_source));
  }
  assert.equal((await run({ ...body, utm_source: 'facebook', gclid: 'old-id' }, { webhookAccepted: true })).webhookCalls[0].data.source, 'Facebook');
});
test('missing UTMs use ad click IDs or recognised referrers, otherwise direct inquiry', async () => {
  for (const [attribution, expected] of [[{fbclid:'fb-test'},'Facebook'],[{gclid:'google-test'},'Google'],[{gbraid:'ios-google-test'},'Google'],[{wbraid:'ios-google-test'},'Google'],[{referrer:'https://l.facebook.com/'} ,'Facebook'],[{referrer:'https://www.google.com.au/'} ,'Google'],[{},'Direct inquiry']]) {
    const { webhookCalls } = await run({ ...body, ...attribution }, { webhookAccepted: true });
    assert.equal(webhookCalls[0].data.source, expected);
  }
});
test('direct enquiry notes omit empty UTM and click-ID lines', async () => {
  const { webhookCalls } = await run({ ...body, utm_campaign:'', page_url:'https://battery.goldsure.com.au/#quote' }, { webhookAccepted: true });
  const note = webhookCalls[0].data.internal_note;
  assert.ok(note.startsWith('Source: Direct inquiry\n'));
  assert.ok(!note.includes('utm_'));
  assert.ok(!note.includes('fbclid:'));
  assert.ok(!note.includes('gclid:'));
  assert.ok(!note.split('\n').some(line=>/:\s*$/.test(line)));
});
test('fallback opportunity name uses the matched primary contact name exactly', async () => {
  const { calls } = await run(body, { contacts: [{ id:'primary', phone:'+61491570006', firstName:'Existing', lastName:'Customer' }] });
  assert.equal(calls.find(c=>c.url.endsWith('/opportunities/')).data.name, 'Existing Customer');
});
