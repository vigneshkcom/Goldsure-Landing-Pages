'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var handler = require('./submit-lead');
var { renderCustomerEnquiryEmail } = require('../lib/lead-email');

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: '',
    setHeader: function (name, value) { this.headers[name] = value; },
    end: function (body) { this.body = body || ''; }
  };
}

test('customer email personalizes the name and presents only the selected offer', function () {
  var bundle = renderCustomerEnquiryEmail({ name: 'Mia Chen', interest: 'The $2,999 bundle' });
  var heatPump = renderCustomerEnquiryEmail({ name: 'Omar Test', interest: 'Just the heat pump' });

  assert.match(bundle.html, /Hi Mia,/);
  assert.match(bundle.html, /EcoPure whole-home water filter/);
  assert.match(bundle.html, /\$2,999/);
  assert.doesNotMatch(heatPump.html, /EcoPure whole-home water filter/);
  assert.match(heatPump.html, /Your heat pump enquiry/);
  assert.match(bundle.html, /subject=unsubscribe/);
  assert.equal(bundle.subject, heatPump.subject);
});

test('email template escapes customer-provided names', function () {
  var result = renderCustomerEnquiryEmail({ name: '<img src=x onerror=alert(1)>', interest: 'Just the heat pump' });
  assert.doesNotMatch(result.html, /<img src=x onerror=alert\(1\)>/);
  assert.match(result.html, /&lt;img,/);
});

test('form lead is forwarded to GHL and a personalized Hostinger email is sent when configured', async function () {
  var originalFetch = global.fetch;
  var originalMailboxId = process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
  var originalApiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  var forwarded;
  var sentMessage;
  var calls = [];
  try {
    process.env.HOSTINGER_MAILBOX_RESOURCE_ID = 'mailbox-test-id';
    process.env.HOSTINGER_MAIL_API_TOKEN = 'test-token';
    global.fetch = async function (url, options) {
      calls.push(url);
      if (url.indexOf('leadconnectorhq.com') !== -1) {
        forwarded = JSON.parse(options.body);
      } else {
        sentMessage = JSON.parse(options.body);
        assert.equal(options.headers.Authorization, 'Bearer test-token');
      }
      return { ok: true, status: 200 };
    };
    var res = mockResponse();
    await handler({ method: 'POST', headers: {}, body: {
      name: 'Mia Chen', phone: '0400000000', email: 'mia@example.com', postcode: '3072',
      preferred_time_of_call: 'AM', interest: 'The $2,999 bundle', message: 'Call me', page_url: 'https://heatpumpfilter.goldsure.com.au/'
    } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { ok: true, emailStatus: 'sent' });
    assert.equal(calls.length, 2);
    assert.equal(forwarded.lead_type, 'Water Filter Lead');
    assert.deepEqual(forwarded.ghl_tags, ['Water Filter']);
    assert.equal(forwarded.first_name, 'Mia');
    assert.equal(forwarded.last_name, 'Chen');
    assert.match(forwarded.internal_note, /Requested offer: The \$2,999 bundle/);
    assert.match(forwarded.internal_note, /Requested offer: The \$2,999 bundle/);
    assert.match(forwarded.internal_note, /Customer message: Call me/);
    assert.deepEqual(sentMessage.to, ['mia@example.com']);
    assert.match(sentMessage.html, /Hi Mia,/);
    assert.match(sentMessage.html, /EcoPure whole-home water filter/);
  } finally {
    global.fetch = originalFetch;
    if (originalMailboxId === undefined) delete process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
    else process.env.HOSTINGER_MAILBOX_RESOURCE_ID = originalMailboxId;
    if (originalApiToken === undefined) delete process.env.HOSTINGER_MAIL_API_TOKEN;
    else process.env.HOSTINGER_MAIL_API_TOKEN = originalApiToken;
  }
});

test('form lead still succeeds but reports email as not configured when Hostinger credentials are missing', async function () {
  var originalFetch = global.fetch;
  var originalMailboxId = process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
  var originalApiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  try {
    delete process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
    delete process.env.HOSTINGER_MAIL_API_TOKEN;
    global.fetch = async function () { return { ok: true, status: 200 }; };
    var res = mockResponse();
    await handler({ method: 'POST', headers: {}, body: {
      name: 'Mia Chen', phone: '0400000000', email: 'mia@example.com',
      interest: 'Just the heat pump'
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { ok: true, emailStatus: 'not_configured' });
  } finally {
    global.fetch = originalFetch;
    if (originalMailboxId === undefined) delete process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
    else process.env.HOSTINGER_MAILBOX_RESOURCE_ID = originalMailboxId;
    if (originalApiToken === undefined) delete process.env.HOSTINGER_MAIL_API_TOKEN;
    else process.env.HOSTINGER_MAIL_API_TOKEN = originalApiToken;
  }
});

test('honeypot submissions do not contact GHL or send email', async function () {
  var originalFetch = global.fetch;
  var calls = 0;
  try {
    global.fetch = async function () { calls += 1; throw new Error('must not be called'); };
    var res = mockResponse();
    await handler({ method: 'POST', headers: {}, body: { website: 'filled by bot' } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { ok: true });
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
