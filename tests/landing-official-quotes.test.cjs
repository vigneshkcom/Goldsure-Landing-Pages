const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const saveLead = require('../smoke-alarm/api/smoke-alarm/save-lead.js');
const acceptQuote = require('../smoke-alarm/api/smoke-alarm/accept-quote.js');

const token = '1234567890abcdef1234567890abcdef123456';
function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = value; } };
}
function fixture(t, overrides = {}) {
  const originalFetch = global.fetch;
  const before = { ...process.env };
  Object.assign(process.env, { SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture', RESEND_API_KEY: 'fixture', PUBLIC_SITE_URL: 'https://smokealarms.goldsure.com.au' });
  t.after(() => { global.fetch = originalFetch; for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key]; Object.assign(process.env, before); });
  const state = {
    lead: { id: 123, full_name: 'Example Customer', phone: '0400000000', email: null, property_address: '12 Example Street, Brisbane QLD 4000', alarm_qty: 4, controller_qty: 0, booking_fee: 33, installation_balance: 392, total_inc_gst: 425, quote_token: token, status: 'downloaded', accepted_at: null, created_at: new Date().toISOString(), ...overrides },
    emails: [], writes: [], failEmail: false,
  };
  global.fetch = async (url, init = {}) => {
    if (String(url).startsWith('https://api.resend.com/emails')) {
      state.emails.push({ payload: JSON.parse(init.body), key: init.headers['Idempotency-Key'] });
      return new Response('{}', { status: state.failEmail ? 503 : 200 });
    }
    assert.match(String(url), /^https:\/\/fixture.supabase.co\/rest\/v1\/calculator_leads/);
    if (init.method === 'POST') {
      const body = JSON.parse(init.body); state.writes.push(body); Object.assign(state.lead, body);
      return new Response(JSON.stringify([state.lead]));
    }
    if (init.method === 'PATCH') {
      if (String(url).includes('accepted_at=is.null') && state.lead.accepted_at) return new Response('[]');
      const body = JSON.parse(init.body); state.writes.push(body); Object.assign(state.lead, body);
      return new Response(JSON.stringify([state.lead]));
    }
    return new Response(JSON.stringify([state.lead]));
  };
  return state;
}

test('free download creates a saved official quote with server-calculated amounts and an acceptance link', async t => {
  const state = fixture(t); const res = response();
  await saveLead({ method: 'POST', body: { ...state.lead, alarm_qty: 4, controller_selected: true, controller_qty: 1, booking_fee: 0, total_inc_gst: 1 } }, res);
  assert.equal(res.statusCode, 200);
  const result = JSON.parse(res.body);
  assert.equal(result.quoteReference, 'GS-SA-000123');
  assert.equal(result.lead.total_inc_gst, 474);
  assert.equal(result.lead.booking_fee, 33);
  assert.match(result.quoteUrl, /^https:\/\/smokealarms.goldsure.com.au\/accept-quote\/smoke-alarm\?token=/);
  assert.equal(result.lead.status, 'downloaded');
  assert.equal(result.lead.accepted_at, null);
  assert.equal(state.emails.length, 1, 'download notification only when no customer email supplied');
  assert.match(state.emails[0].payload.html, /Downloaded only, not accepted/);
});

test('customer email includes the official reference and explains acceptance is free', async t => {
  const state = fixture(t, { email: 'example@example.com' }); const res = response();
  await saveLead({ method: 'POST', body: { ...state.lead, controller_selected: false } }, res);
  const email = state.emails.find(item => item.payload.to.includes('example@example.com')).payload;
  assert.match(email.subject, /Official Smoke Alarm Quote GS-SA-000123/);
  assert.match(email.html, /No online payment is required/);
  assert.match(email.html, /Accept This Quote/);
});

test('opening an official quote never accepts it or sends an acceptance notification', async t => {
  const state = fixture(t); const res = response();
  await acceptQuote({ method: 'GET', url: '/api/smoke-alarm/accept-quote?token=' + token }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.writes.length, 0); assert.equal(state.emails.length, 0);
  assert.match(res.body, /Official Goldsure Quote/);
  assert.match(res.body, /GS-SA-000123/);
  assert.match(res.body, /method="POST"/);
  assert.match(res.body, /Accept quote and request a call/);
  assert.match(res.body, /No online payment is required/);
  assert.doesNotMatch(res.body, /checkout\.stripe|pay online|card number/i);
});

test('explicit acceptance records the quote and sends one call-to-book notification without payment', async t => {
  const state = fixture(t); const res = response();
  const req = { method: 'POST', url: '/api/smoke-alarm/accept-quote', body: { action: 'accept-quote', token } };
  await acceptQuote(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.lead.status, 'accepted'); assert.ok(state.lead.accepted_at);
  assert.equal(state.emails.length, 1);
  assert.match(state.emails[0].payload.subject, /Quote Accepted \| CALL TO BOOK \| GS-SA-000123/);
  assert.match(state.emails[0].payload.html, /No online payment was requested or collected/);
  assert.equal(state.emails[0].key, 'landing-quote-accepted-' + token);
  const repeated = response(); await acceptQuote(req, repeated);
  assert.equal(state.emails.length, 1); assert.match(repeated.body, /already accepted/i);
});

test('expired quotes cannot be accepted', async t => {
  const state = fixture(t, { created_at: new Date(Date.now() - 22 * 86400000).toISOString() }); const res = response();
  await acceptQuote({ method: 'POST', url: '/api/smoke-alarm/accept-quote', body: { action: 'accept-quote', token } }, res);
  assert.equal(res.statusCode, 410); assert.equal(state.writes.length, 0); assert.equal(state.emails.length, 0);
});

test('failed booking-team notification does not claim the acceptance is confirmed', async t => {
  const state = fixture(t); state.failEmail = true; const res = response();
  await acceptQuote({ method: 'POST', url: '/api/smoke-alarm/accept-quote', body: 'action=accept-quote&token=' + token }, res);
  assert.equal(res.statusCode, 503); assert.equal(state.lead.accepted_at, null);
  assert.match(res.body, /Please try again/);
});

function calculatorContext(action, failSave = false) {
  const source = fs.readFileSync(require.resolve('../smoke-alarm/calculator/index.html'), 'utf8');
  const start = source.indexOf('async function generatePDF()');
  const end = source.lastIndexOf('\ncalculate();');
  const elements = { 'm-name': { value: 'Example Customer' }, 'm-phone': { value: '0400000000' }, 'm-email': { value: '' }, 'm-address': { value: '12 Example Street, Brisbane QLD 4000' }, 'bedrooms': { value: '4' }, 'hallways': { value: '0' }, 'levels': { value: '1' }, 'quoteSubmitButton': { disabled: false }, 'savedQuoteLink': { style: {}, replaceChildren() {}, appendChild() {} } };
  const pdf = { texts: [], links: [], pages: 1, setFillColor() {}, setFont() {}, setTextColor() {}, setFontSize() {}, rect() {}, roundedRect() {}, addImage() {}, setDrawColor() {}, setLineWidth() {}, line() {}, circle() {}, text(value, x, y) { this.texts.push({ value, x, y }); }, splitTextToSize(value) { return [value]; }, addPage() { this.pages++; }, setPage() {}, link(x, y, width, height, value) { this.links.push(value); }, save(name) { this.saved = name; } };
  const result = { pdf, assigned: null, source, elements };
  const context = vm.createContext({ console: { warn() {} }, document: { getElementById: id => elements[id], createElement: () => ({}) }, addressMeta: { selected: true, qldValid: true, postcodeValid: true }, setAddressStatus() {}, toast() {}, pushMarketingEvent() {}, quoteAction: action, getCalculatorSnapshot: () => ({}), saveLead: async () => { if (failSave) throw Error('offline'); return { lead: { quote_token: token, alarm_qty: 4, controller_qty: 0, total_inc_gst: 425 }, quoteReference: 'GS-SA-000123', quoteUrl: 'https://smokealarms.goldsure.com.au/accept-quote/smoke-alarm?token=' + token }; }, fetch: async () => { throw Error('Asset unavailable in fixture'); }, closeModal() {}, window: { jspdf: { jsPDF: function() { return pdf; } }, location: { assign(url) { result.assigned = url; } } } });
  vm.runInContext(source.slice(start, end), context);
  result.run = () => vm.runInContext('generatePDF()', context);
  return result;
}

test('official PDF has the saved reference and clickable acceptance link without an online payment request', async () => {
  const state = calculatorContext('download'); await state.run();
  assert.equal(state.pdf.saved, 'Goldsure_Official_Quote_GS-SA-000123.pdf');
  assert.equal(state.pdf.links.length, 1); assert.match(state.pdf.links[0].url, /token=/);
  assert.ok(state.pdf.texts.some(item => item.value === 'Official quote GS-SA-000123'));
  assert.ok(state.pdf.texts.some(item => item.value === 'NO ONLINE PAYMENT REQUIRED'));
  assert.ok(state.pdf.texts.filter(item => item.value === 'View and accept this quote')[0].y < 270);
});

test('accept choice opens the official review page without downloading or charging', async () => {
  const state = calculatorContext('accept'); await state.run();
  assert.match(state.assigned, /accept-quote\/smoke-alarm\?token=/); assert.equal(state.pdf.saved, undefined);
});

test('an unsaved quote cannot be downloaded as an official PDF', async () => {
  const state = calculatorContext('download', true); await state.run();
  assert.equal(state.pdf.saved, undefined); assert.equal(state.elements.quoteSubmitButton.disabled, false);
});

test('root and project API copies remain identical', () => {
  for (const file of ['save-lead.js', 'accept-quote.js']) assert.equal(fs.readFileSync(require.resolve('../api/smoke-alarm/' + file), 'utf8'), fs.readFileSync(require.resolve('../smoke-alarm/api/smoke-alarm/' + file), 'utf8'));
});

test('official quote links resolve in the dedicated smoke-alarm deployment', () => {
  const config = JSON.parse(fs.readFileSync(require.resolve('../smoke-alarm/vercel.json'), 'utf8'));
  for (const pathname of ['/accept-quote/smoke-alarm', '/accept-quote/smoke-alarm/', '/accept-quote']) {
    const match = config.routes.find(route => route.src && new RegExp(route.src).test(pathname));
    assert.equal(match?.dest, '/api/smoke-alarm/accept-quote');
  }
});
