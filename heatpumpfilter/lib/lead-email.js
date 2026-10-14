'use strict';

var BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/udRwQGz9i7JY4zRYRQyc';
var LOGO_URL = 'https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699a73ab3a2afd85cbdb392f.jpg';
var SIGNATURE_LOGO_URL = 'https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/6941477dca729831ab339932.jpg';
var UNSUBSCRIBE_URL = 'mailto:info@goldsure.com.au?subject=unsubscribe';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'there';
}

function renderCustomerEnquiryEmail(lead) {
  var name = firstName(lead.name);
  var isBundle = lead.interest === 'The $2,999 bundle';
  var offerHeading = isBundle ? 'Your $2,999 heat pump + water filter bundle' : 'Your heat pump enquiry';
  var offerCopy = isBundle
    ? 'You asked us about the Econova all-in-one heat pump together with the EcoPure whole-home water filter, supplied and installed for $2,999, as shown on our promotion page.'
    : 'Thanks for asking about a heat pump. A member of our team will talk through the system and installation options with you.';
  var text = [
    'Hi ' + name + ',',
    '',
    'Thanks for your enquiry with Goldsure. One of our team will be in touch within 24 hours.',
    '',
    offerHeading,
    offerCopy,
    '',
    'If you would prefer to choose a time for a quick call, book here: ' + BOOKING_URL,
    'Or call us on 03 7050 2846.',
    '',
    'Regards,',
    'Sales & Scheduling Team',
    'Goldsure Pty Ltd',
    'info@goldsure.com.au | 03 7050 2846',
    '',
    'To stop receiving promotional emails from us, reply to info@goldsure.com.au with “unsubscribe” in the subject line.'
  ].join('\n');
  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:24px 10px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.6">' +
    '<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-collapse:collapse">' +
    '<tr><td align="center" bgcolor="#000" style="padding:18px 30px"><img src="' + LOGO_URL + '" width="180" alt="Goldsure" style="display:block;width:180px;height:auto;border:0"></td></tr>' +
    '<tr><td bgcolor="#000" style="padding:22px 35px 24px;color:#fff"><p style="margin:0 0 7px;color:#d4af37;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase">Heat Pump + Water Filter Promotion</p><p style="margin:0;font-size:24px;line-height:1.25;font-weight:bold">Thanks for getting in touch.</p><p style="margin:8px 0 0;color:#bbb;font-size:13px">A member of our Melbourne team will follow up within 24 hours.</p></td></tr>' +
    '<tr><td style="padding:34px 35px 30px"><p style="margin:0 0 18px;font-size:18px;font-weight:bold;color:#111">Hi ' + escapeHtml(name) + ',</p>' +
    '<p style="margin:0 0 18px">Thanks for your enquiry with Goldsure. We have your details and one of our team members will be in touch within 24 hours.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e5e5e5"><tr><td style="padding:18px 20px"><p style="margin:0 0 7px;color:#b18c27;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">' + escapeHtml(offerHeading) + '</p><p style="margin:0;color:#444;font-size:14px">' + escapeHtml(offerCopy) + '</p></td></tr></table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 12px"><tr><td align="center" style="padding:0 0 12px;font-size:14px">Want to speak at a time that suits you? Book a quick call:</td></tr><tr><td align="center"><a href="' + BOOKING_URL + '" style="display:inline-block;padding:14px 28px;background:#d4af37;color:#000;text-decoration:none;font-weight:bold">Book a Quick Call</a></td></tr></table>' +
    '<p style="text-align:center;margin:0 0 32px">Or call us directly on <a href="tel:0370502846" style="color:#b18c27;font-weight:bold;text-decoration:none">03 7050 2846</a>.</p>' +
    '<p style="margin:0 0 12px">Regards,</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="110" valign="middle" style="padding-right:15px"><img src="' + SIGNATURE_LOGO_URL + '" width="110" alt="Goldsure" style="display:block;width:110px;height:auto"></td><td valign="middle" style="padding-left:15px;border-left:1px solid #d4af37"><p style="margin:0 0 3px;font-size:16px;font-weight:bold;color:#111">Sales &amp; Scheduling Team</p><p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#b18c27">Goldsure Pty Ltd</p><p style="margin:0;font-size:13px;color:#555">e: <a href="mailto:info@goldsure.com.au" style="color:#b18c27">info@goldsure.com.au</a><br>p: 03 7050 2846<br>w: <a href="https://heatpumpfilter.goldsure.com.au/" style="color:#b18c27">heatpumpfilter.goldsure.com.au</a></p></td></tr></table></td></tr>' +
    '<tr><td align="center" bgcolor="#f4f4f4" style="padding:22px 28px;font-size:11px;color:#888">&copy; Goldsure Pty Ltd<br>Suite 4, Level 1, 293 High Street, Preston VIC 3072<br><br>To stop receiving promotional emails, <a href="' + UNSUBSCRIBE_URL + '" style="color:#777;text-decoration:underline">reply with “unsubscribe” in the subject line</a>.</td></tr>' +
    '</table></body></html>';

  return {
    subject: 'Thanks for your Goldsure heat pump enquiry',
    text: text,
    html: html
  };
}

module.exports = { renderCustomerEnquiryEmail: renderCustomerEnquiryEmail };
