const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../battery/index.html'), 'utf8');
const capture = html.split('/* ---- Attribution capture (kept for the visit) ---- */')[1].split('/* ---- Form ---- */')[0];
function visit(search, referrer = '', initial = {}) {
  const saved = new Map(Object.entries(initial));
  const context = { URL, URLSearchParams, location: { search, hostname:'battery.goldsure.com.au' }, document: { referrer }, sessionStorage: { getItem:k=>saved.get(k), setItem:(k,v)=>saved.set(k,v), removeItem:k=>saved.delete(k) } };
  vm.createContext(context);
  vm.runInContext(capture, context);
  return { context, saved };
}
test('a new Facebook campaign replaces stale Google attribution as a whole', () => {
  const { context } = visit('?utm_source=facebook&utm_campaign=battery-live', '', { gs_utm_source:'google',gs_gclid:'old-google-id',gs_utm_term:'old-keyword' });
  assert.equal(context.attr('utm_source'), 'facebook');
  assert.equal(context.attr('utm_campaign'), 'battery-live');
  assert.equal(context.attr('gclid'), '');
  assert.equal(context.attr('utm_term'), '');
});
test('campaign and modern Google click IDs survive navigation within the visit', () => {
  const first = visit('?utm_source=google&wbraid=google-ios&utm_campaign=battery');
  const next = visit('', 'https://battery.goldsure.com.au/', Object.fromEntries(first.saved));
  assert.equal(next.context.attr('utm_source'), 'google');
  assert.equal(next.context.attr('wbraid'), 'google-ios');
  assert.equal(next.context.attr('utm_campaign'), 'battery');
});
test('a direct fresh visit has no invented UTMs, while external referrers replace prior campaigns', () => {
  assert.equal(visit('').context.attr('utm_source'), '');
  const { context, saved } = visit('', 'https://www.google.com.au/', { gs_fbclid:'old-facebook' });
  assert.equal(context.attr('fbclid'), '');
  assert.equal(saved.get('gs_referrer'), 'https://www.google.com.au/');
});
