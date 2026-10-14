'use strict';

var BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/udRwQGz9i7JY4zRYRQyc';
var IMG_BASE = 'https://heatpumpfilter.goldsure.com.au/assets/email/';
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
  var ticks = [
    ['Econova all-in-one heat pump', 'Our top unit and biggest all-in-one tank, supplied and installed.'],
    ['EcoPure water filter, fitted at your mains', 'Filtered water from every tap and shower in the house.'],
    ['Our own licensed plumbers', 'No subbies. And we still answer the phone after install day.']
  ];
  var tickRows = ticks.map(function (t) {
    return '<tr><td width="28" valign="top" style="padding:0 0 14px;color:#B58A3A;font-size:18px;line-height:22px;font-weight:bold">&#10003;</td>' +
      '<td valign="top" style="padding:0 0 14px"><p style="margin:0;font-size:15px;line-height:22px;font-weight:bold;color:#161D2B">' + escapeHtml(t[0]) + '</p>' +
      '<p style="margin:0;font-size:14px;line-height:21px;color:#475061">' + escapeHtml(t[1]) + '</p></td></tr>';
  }).join('');
  var bundleImage = isBundle
    ? '<tr><td style="padding:0"><img src="' + IMG_BASE + 'email-bundle.jpg" width="600" alt="Econova all-in-one heat pump plus EcoPure whole-home water filter" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>'
    : '';
  var html = '<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>' +
    '<body style="margin:0;padding:24px 10px;background:#EDF2F9;font-family:Arial,Helvetica,sans-serif;color:#161D2B;line-height:1.6">' +
    '<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse">' +
    // header
    '<tr><td align="center" bgcolor="#142F72" style="padding:20px 30px"><img src="' + IMG_BASE + 'email-logo.png" width="170" alt="Goldsure" style="display:block;width:170px;height:auto;border:0"></td></tr>' +
    // promo strip
    '<tr><td align="center" bgcolor="#CC272E" style="padding:8px 20px;border-top:2px solid #E1B75C;border-bottom:2px solid #E1B75C;color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Limited time promotion &middot; Melbourne homeowners</td></tr>' +
    // headline
    '<tr><td bgcolor="#142F72" style="padding:28px 35px 30px;color:#ffffff"><p style="margin:0;font-size:28px;line-height:1.2;font-weight:bold">Thanks for getting in touch.</p>' +
    '<p style="margin:10px 0 0;color:#E1B75C;font-size:15px;line-height:1.4;font-weight:bold">A member of our Melbourne team will follow up within 24 hours.</p></td></tr>' +
    bundleImage +
    // body
    '<tr><td style="padding:32px 35px 8px"><p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#161D2B">Hi ' + escapeHtml(name) + ',</p>' +
    '<p style="margin:0 0 20px;font-size:15px">Thanks for your enquiry with Goldsure. We have your details and one of our team members will be in touch within 24 hours.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#FBF8F2;border:1px solid #E5DCC8;border-left:4px solid #E1B75C"><tr><td style="padding:16px 20px"><p style="margin:0 0 6px;color:#B58A3A;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">' + escapeHtml(offerHeading) + '</p><p style="margin:0;color:#475061;font-size:14px;line-height:21px">' + escapeHtml(offerCopy) + '</p></td></tr></table>' +
    (isBundle ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td>' + '<table role="presentation" cellpadding="0" cellspacing="0" style="background:#142F72;border-radius:8px"><tr><td style="padding:12px 20px"><span style="font-size:30px;line-height:30px;font-weight:bold;color:#E1B75C">$2,999</span> <span style="font-size:13px;color:#ffffff">&nbsp;both installed &middot; valued at $5,500 &middot; one fixed price</span></td></tr></table></td></tr></table>' : '') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">' + tickRows + '</table></td></tr>' +
    // photos
    '<tr><td style="padding:8px 35px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td width="50%" valign="top" style="padding:0 6px 0 0"><img src="' + IMG_BASE + 'email-install-1.jpg" width="255" alt="Goldsure plumber installing a system" style="display:block;width:100%;height:auto;border:0;border-radius:8px"></td>' +
    '<td width="50%" valign="top" style="padding:0 0 0 6px"><img src="' + IMG_BASE + 'email-install-2.jpg" width="255" alt="Goldsure installation in progress" style="display:block;width:100%;height:auto;border:0;border-radius:8px"></td>' +
    '</tr></table><p style="margin:8px 0 0;font-size:12px;color:#7A808D">Real Goldsure installs by our own licensed team.</p></td></tr>' +
    // CTA
    '<tr><td align="center" style="padding:28px 35px 8px"><p style="margin:0 0 14px;font-size:15px;color:#161D2B">Want to speak at a time that suits you?</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#E1B75C" style="border-radius:999px"><a href="' + BOOKING_URL + '" style="display:inline-block;padding:15px 34px;color:#161D2B;font-size:16px;font-weight:bold;text-decoration:none;border-radius:999px">Book a Quick Call &rarr;</a></td></tr></table>' +
    '<p style="margin:16px 0 0;font-size:14px">Or call us directly on <a href="tel:0370502846" style="color:#2256BB;font-weight:bold;text-decoration:none">03 7050 2846</a>.</p></td></tr>' +
    // team photo
    '<tr><td style="padding:28px 0 0"><img src="' + IMG_BASE + 'email-hero-team.jpg" width="600" alt="The Goldsure team" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>' +
    // signature
    '<tr><td style="padding:26px 35px 32px"><p style="margin:0 0 12px;font-size:15px">Regards,</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="110" valign="middle" style="padding-right:15px"><img src="' + SIGNATURE_LOGO_URL + '" width="110" alt="Goldsure" style="display:block;width:110px;height:auto"></td><td valign="middle" style="padding-left:15px;border-left:2px solid #E1B75C"><p style="margin:0 0 3px;font-size:16px;font-weight:bold;color:#161D2B">Sales &amp; Scheduling Team</p><p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#B58A3A">Goldsure Pty Ltd</p><p style="margin:0;font-size:13px;color:#475061">e: <a href="mailto:info@goldsure.com.au" style="color:#2256BB">info@goldsure.com.au</a><br>p: 03 7050 2846<br>w: <a href="https://heatpumpfilter.goldsure.com.au/" style="color:#2256BB">heatpumpfilter.goldsure.com.au</a></p></td></tr></table></td></tr>' +
    '<tr><td align="center" bgcolor="#161D2B" style="padding:22px 28px;font-size:11px;line-height:18px;color:#9EA3AE">&copy; Goldsure Pty Ltd<br>Suite 4, Level 1, 293 High Street, Preston VIC 3072<br><br>To stop receiving promotional emails, <a href="' + UNSUBSCRIBE_URL + '" style="color:#C9CDD5;text-decoration:underline">reply with “unsubscribe” in the subject line</a>.</td></tr>' +
    '</table></body></html>';

  return {
    subject: 'Thanks for your Goldsure heat pump enquiry',
    text: text,
    html: html
  };
}

module.exports = { renderCustomerEnquiryEmail: renderCustomerEnquiryEmail };
