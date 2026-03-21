const crypto = require('crypto');

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function formatSydneyDateTime(value) {
  var date = value ? new Date(value) : new Date();
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Australia/Sydney'
  });
}

function getBaseUrl() {
  return (process.env.PUBLIC_SITE_URL || 'https://offers.goldsure.com.au').replace(/\/$/, '');
}

function buildAcceptUrl(lead) {
  return getBaseUrl() + '/accept-quote/smoke-alarm?token=' + encodeURIComponent(lead.quote_token || '');
}

function generateQuoteToken() {
  return crypto.randomBytes(18).toString('hex');
}

async function sendResendEmail(payload) {
  var resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return { ok: false, skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  var response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + resendApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  var text = await response.text();
  var data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: 'Failed to send email',
      details: data
    };
  }

  return {
    ok: true,
    data: data
  };
}

async function sendInternalEmail(lead) {
  var emailTo = process.env.EMAIL_TO || 'vignesh@goldsure.com.au';
  var emailBcc = process.env.EMAIL_BCC || '';
  var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';
  var submittedAt = formatSydneyDateTime(lead.created_at);
  var status = String(lead.status || 'sent').toLowerCase() === 'accepted' ? 'accepted' : 'sent';
  var acceptUrl = buildAcceptUrl(lead);

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Smoke Alarm Quote Download</title></head>',
    '<body style="margin:0;padding:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif;color:#111827;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f4f2ec">',
    '<tr><td align="center" style="padding:22px 12px;">',
    '<table width="640" border="0" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#ffffff;border:1px solid #e6e2d9;border-radius:14px;overflow:hidden;">',
    '<tr><td style="padding:18px 22px;background:#111111;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>',
    '<td valign="top"><div style="font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#c9a84c;margin-bottom:8px;">Internal Notification</div><div style="font-size:28px;line-height:1.1;font-weight:700;color:#ffffff;">New Quote Download</div></td>',
    '<td align="right" valign="top"><div style="display:inline-block;padding:7px 10px;border-radius:999px;background:' + (status === 'accepted' ? 'rgba(65,170,132,0.18);color:#76d3af;' : 'rgba(107,127,215,0.18);color:#b8c4ff;') + 'font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">' + escapeHtml(status) + '</div></td>',
    '</tr></table>',
    '</td></tr>',
    '<tr><td style="height:3px;background:#c9a84c;font-size:1px;line-height:1px;">&nbsp;</td></tr>',
    '<tr><td style="padding:18px 22px 20px;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:14px;background:#faf6ec;border-left:4px solid #c9a84c;">',
    '<tr>',
    '<td style="padding:12px 14px;"><div style="font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#a8892f;margin-bottom:6px;">Submitted</div><div style="font-size:16px;font-weight:700;color:#111827;">' + escapeHtml(submittedAt) + '</div></td>',
    '<td style="padding:12px 14px;"><div style="font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#a8892f;margin-bottom:6px;">Customer</div><div style="font-size:16px;font-weight:700;color:#111827;">' + escapeHtml(lead.full_name || '-') + '</div></td>',
    '<td style="padding:12px 14px;"><div style="font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#a8892f;margin-bottom:6px;">Total Quote</div><div style="font-size:20px;font-weight:700;color:#a8892f;">' + escapeHtml(formatMoney(lead.total_inc_gst)) + '</div></td>',
    '</tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;margin-bottom:14px;">',
    '<tr bgcolor="#f8fafc"><td colspan="4" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#5f6f94;border-bottom:1px solid #e5e7eb;">Lead Summary</td></tr>',
    '<tr>',
    '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;border-bottom:1px solid #e5e7eb;width:18%;">Phone</td><td style="padding:10px 14px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;width:32%;">' + escapeHtml(lead.phone || '-') + '</td>',
    '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;border-bottom:1px solid #e5e7eb;width:18%;">Email</td><td style="padding:10px 14px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;width:32%;">' + escapeHtml(lead.email || '-') + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;border-bottom:1px solid #e5e7eb;">Property</td><td colspan="3" style="padding:10px 14px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">' + escapeHtml(lead.property_address || '-') + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;">Property Details</td><td style="padding:10px 14px;font-size:14px;color:#111827;">Beds ' + escapeHtml(lead.bedrooms ?? '-') + ' | Storeys ' + escapeHtml(lead.storeys ?? '-') + ' | Hallways ' + escapeHtml(lead.hallways ?? '-') + '</td>',
    '<td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;">Equipment</td><td style="padding:10px 14px;font-size:14px;color:#111827;">' + escapeHtml(lead.alarm_qty ?? '-') + ' alarms' + (lead.controller_selected ? ' | ' + escapeHtml(lead.controller_qty ?? 0) + ' controller' : ' | no controller') + '</td>',
    '</tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;margin-bottom:14px;">',
    '<tr bgcolor="#f8fafc"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#5f6f94;border-bottom:1px solid #e5e7eb;">Quote Breakdown</td></tr>',
    '<tr><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;border-bottom:1px solid #e5e7eb;">Booking Fee</td><td style="padding:10px 14px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">' + escapeHtml(formatMoney(lead.booking_fee)) + '</td></tr>',
    '<tr><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#475467;border-bottom:1px solid #e5e7eb;">Installation Balance</td><td style="padding:10px 14px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">' + escapeHtml(formatMoney(lead.installation_balance)) + '</td></tr>',
    '<tr><td style="padding:12px 14px;font-size:12px;font-weight:700;color:#111827;background:#f8fafc;">Total Quote</td><td style="padding:12px 14px;font-size:22px;font-weight:700;color:#a8892f;background:#f8fafc;">' + escapeHtml(formatMoney(lead.total_inc_gst)) + '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#fcfbf8;border:1px solid #ece8df;"><tr>',
    '<td style="padding:12px 14px;font-size:12px;line-height:1.7;color:#5f6980;">Tracker route: ' + escapeHtml(lead.page_path || '-') + '</td>',
    '<td align="right" style="padding:12px 14px;font-size:12px;line-height:1.7;color:#5f6980;"><a href="' + escapeHtml(acceptUrl) + '" style="color:#a8892f;text-decoration:none;font-weight:700;">Acceptance link</a></td>',
    '</tr></table>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  return sendResendEmail({
    from: emailFrom,
    to: [emailTo],
    bcc: emailBcc ? [emailBcc] : [],
    subject: 'New Smoke Alarm Quote Download - ' + (lead.full_name || 'Customer'),
    html: html
  });
}

async function sendCustomerQuoteEmail(lead) {
  var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';
  var replyTo = process.env.EMAIL_TO || 'vignesh@goldsure.com.au';

  if (!lead.email) {
    return { ok: false, skipped: true, reason: 'Missing customer email' };
  }

  var acceptUrl = buildAcceptUrl(lead);
  var alarmTotal = Number(lead.alarm_qty || 0) * 98;
  var controllerTotal = Number(lead.controller_qty || 0) * 49;

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Smoke Alarm Quote</title></head>',
    '<body style="margin:0;padding:0;background-color:#ebebeb;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ebebeb">',
    '<tr><td align="center" style="padding:20px 16px;">',
    '<table width="600" border="0" cellpadding="0" cellspacing="0" style="background:#ffffff;overflow:hidden;">',
    '<tr><td bgcolor="#000000" align="center" style="padding:20px 32px 5px;">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699a73ab3a2afd85cbdb392f.jpg" alt="Goldsure" width="180" style="display:block;width:180px;height:auto;margin:0 auto;" />',
    '</td></tr>',
    '<tr><td bgcolor="#000000" align="center" style="padding:0 32px 16px;">',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#b08d2e;">Smoke Alarm Quote</p>',
    '</td></tr>',
    '<tr><td bgcolor="#b08d2e" style="height:2px;font-size:1px;line-height:1px;">&nbsp;</td></tr>',
    '<tr><td style="padding:24px 30px;background:#ffffff;">',
    '<p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#000000;">Hi ' + escapeHtml(lead.full_name || 'there') + ',</p>',
    '<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;line-height:1.7;">Thank you for requesting a smoke alarm quote from Goldsure. Your estimate is below, and you can accept this quote online when you are ready.</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border:1px solid #e0e0e0;">',
    '<tr bgcolor="#000000">',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Description</td>',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;text-align:center;">Qty</td>',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;text-align:right;">Amount</td>',
    '</tr>',
    '<tr bgcolor="#ffffff">',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;border-top:1px solid #f0f0f0;"><strong>Raptor Smoke Alarms</strong><br><span style="font-size:11px;color:#888888;">Photoelectric | Interconnected | 10-Year Warranty</span></td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;text-align:center;border-top:1px solid #f0f0f0;">' + escapeHtml(lead.alarm_qty ?? 0) + '</td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#000000;text-align:right;border-top:1px solid #f0f0f0;">' + escapeHtml(formatMoney(alarmTotal)) + '</td>',
    '</tr>',
    '<tr bgcolor="#f9f9f9">',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;border-top:1px solid #f0f0f0;"><strong>Smoke Alarm Controller</strong><br><span style="font-size:11px;color:#888888;">Remote control and status display</span></td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;text-align:center;border-top:1px solid #f0f0f0;">' + escapeHtml(lead.controller_qty ?? 0) + '</td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#000000;text-align:right;border-top:1px solid #f0f0f0;">' + escapeHtml(formatMoney(controllerTotal)) + '</td>',
    '</tr>',
    '<tr bgcolor="#ffffff">',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;border-top:1px solid #f0f0f0;"><strong>Booking Fee</strong><br><span style="font-size:11px;color:#888888;">Payable upfront to secure your booking</span></td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;text-align:center;border-top:1px solid #f0f0f0;">1</td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#000000;text-align:right;border-top:1px solid #f0f0f0;">' + escapeHtml(formatMoney(lead.booking_fee || 0)) + '</td>',
    '</tr>',
    '<tr bgcolor="#000000">',
    '<td colspan="2" style="padding:12px 12px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;color:#ffffff;text-transform:uppercase;letter-spacing:2px;">Grand Total (Incl. GST)</td>',
    '<td style="padding:12px 12px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#b08d2e;text-align:right;">' + escapeHtml(formatMoney(lead.total_inc_gst || 0)) + '</td>',
    '</tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;background:#faf6ec;border-left:3px solid #b08d2e;">',
    '<tr><td style="padding:10px 14px;">',
    '<p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Property Details</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;line-height:1.6;">Address: ' + escapeHtml(lead.property_address || '-') + '<br>Bedrooms: ' + escapeHtml(lead.bedrooms ?? '-') + ' | Storeys: ' + escapeHtml(lead.storeys ?? '-') + ' | Hallways: ' + escapeHtml(lead.hallways ?? '-') + '</p>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;background:#faf6ec;border-left:3px solid #b08d2e;">',
    '<tr><td style="padding:10px 14px;">',
    '<p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Payment Structure</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;line-height:1.6;">' + escapeHtml(formatMoney(lead.booking_fee || 0)) + ' booking fee is payable upfront to secure your installation. The remaining balance of ' + escapeHtml(formatMoney(lead.installation_balance || 0)) + ' is payable on the day of installation.</p>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;background:#111111;border-radius:10px;">',
    '<tr><td style="padding:20px 22px;text-align:center;">',
    '<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Ready To Move Forward?</p>',
    '<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#ffffff;">If you are happy with this quote, you can accept it online now and our team will contact you to arrange the next step.</p>',
    '<a href="' + escapeHtml(acceptUrl) + '" style="display:inline-block;padding:14px 24px;background:#b08d2e;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Accept This Quote</a>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border-top:2px solid #b08d2e;">',
    '<tr><td style="padding-top:14px;">',
    '<p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#b08d2e;">Queensland Legislation</p>',
    '<p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#000000;line-height:1.2;">Important Compliance Notes</p>',
    '<p style="margin:0 0 15px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;line-height:1.6;">Final alarm placement and exact compliance requirements are confirmed by a licensed electrician on site.</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;">',
    '<tr><td colspan="2" bgcolor="#000000" style="padding:8px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Key Points</p></td></tr>',
    '<tr><td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-right:1px solid #eeeeee;border-bottom:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">- Photoelectric and interconnected alarms</p></td><td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-bottom:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">- Alarms in bedrooms, hallways, and each storey</p></td></tr>',
    '<tr><td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;border-right:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">- 10-year sealed battery backup where required</p></td><td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">- Final compliance confirmed on site</p></td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border-top:2px solid #b08d2e;">',
    '<tr><td style="padding-top:14px;">',
    '<p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#b08d2e;">Raptor Alarms</p>',
    '<p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#000000;line-height:1.2;">The Raptor Smoke Alarm</p>',
    '<p style="margin:0 0 15px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;line-height:1.5;">Purpose-built for Australian Standards and approved for Queensland fire safety regulatory requirements.</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:15px;">',
    '<tr><td width="48%" align="center"><img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699aaa9d08245e3a7a8f790d.png" alt="Raptor Front View" width="160" style="display:block;width:160px;height:auto;margin:0 auto;" /><p style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#999999;margin:4px 0 0;font-style:italic;text-align:center;">Front View</p></td><td width="4%"></td><td width="48%" align="center"><img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699aaa9ddf9bdf6826e81b7c.png" alt="Raptor Installed View" width="160" style="display:block;width:160px;height:auto;margin:0 auto;" /><p style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#999999;margin:4px 0 0;font-style:italic;text-align:center;">Installed View</p></td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;">',
    '<tr><td colspan="2" bgcolor="#000000" style="padding:8px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Key Features</p></td></tr>',
    '<tr><td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-right:1px solid #eeeeee;border-bottom:1px solid #eeeeee;"><p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#b08d2e;">Photoelectric Sensing</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;line-height:1.4;">Reduces nuisance alarms from cooking while ensuring reliable early detection.</p></td><td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-bottom:1px solid #eeeeee;"><p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#b08d2e;">RF Wireless Interconnect</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;line-height:1.4;">When one alarm sounds, all connected alarms sound. Up to 40 units per network.</p></td></tr>',
    '<tr><td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;border-right:1px solid #eeeeee;"><p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#b08d2e;">Alarm Memory</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;line-height:1.4;">Visual indication of prior activations and end-of-life warning for easy management.</p></td><td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;"><p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:#b08d2e;">10-Year Warranty</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;line-height:1.4;">Backed by a full 10-year manufacturer warranty for complete peace of mind.</p></td></tr>',
    '<tr><td colspan="2" bgcolor="#000000" align="center" style="padding:8px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#ffffff;">Certified to <strong style="color:#b08d2e;">AS3786 2023</strong> | Approved for All Australian States</p></td></tr>',
    '</table>',
    '<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-align:center;"><a href="https://workdrive.zohopublic.com.au/external/77cc4e8b9e29aef78d17e9bde90d3e9718972cbe212a0bc0446effb7292cf0e6" style="color:#b08d2e;text-decoration:none;font-weight:bold;">View the Raptor Smoke Alarm Datasheet -></a></p>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;">',
    '<tr>',
    '<td width="96" valign="middle" style="padding-right:16px;">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/68bebcb0db3e00c50ec25a0c.png" alt="Goldsure" width="84" style="display:block;width:84px;height:auto;">',
    '</td>',
    '<td valign="middle" style="border-left:2px solid #b08d2e;padding-left:18px;">',
    '<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:700;line-height:1;color:#111111;">Customer Service</p>',
    '<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b08d2e;">Goldsure Pty Ltd</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;line-height:1.6;">p: 07 2145 5155<br>e: <a href="mailto:' + escapeHtml(replyTo) + '" style="color:#b08d2e;text-decoration:none;font-weight:bold;">' + escapeHtml(replyTo) + '</a><br>w: <a href="https://www.goldsure.com.au" style="color:#b08d2e;text-decoration:none;font-weight:bold;">www.goldsure.com.au</a></p>',
    '</td>',
    '</tr>',
    '</table>',
    '<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#aaaaaa;font-style:italic;line-height:1.5;border-top:1px solid #eeeeee;padding-top:12px;">This quote is an estimate based on the property details provided. Final requirements may vary after on-site review by a licensed electrician.</p>',
    '</td></tr>',
    '<tr><td bgcolor="#000000" align="center" style="padding:15px 20px;">',
    '<p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Goldsure Pty Ltd</p>',
    '<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#888888;line-height:1.5;">ABN: 66 683 305 106</p>',
    '<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#888888;line-height:1.5;">Queensland, Australia</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#555555;line-height:1.5;">CONFIDENTIAL: This email and any attachments are intended solely for the named recipient. Unauthorised use is prohibited.</p>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  return sendResendEmail({
    from: emailFrom,
    to: [lead.email],
    reply_to: replyTo,
    subject: 'Your Smoke Alarm Quote - Goldsure',
    html: html
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Missing Supabase configuration' });
  }

  var body = req.body || {};

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  if (!body.full_name || !body.phone || !body.property_address) {
    return json(res, 400, { error: 'Missing required fields' });
  }

  var payload = {
    full_name: String(body.full_name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: body.email ? String(body.email).trim() : null,
    property_address: String(body.property_address || '').trim(),
    bedrooms: Number.isFinite(body.bedrooms) ? body.bedrooms : null,
    storeys: Number.isFinite(body.storeys) ? body.storeys : null,
    hallways: Number.isFinite(body.hallways) ? body.hallways : null,
    controller_selected: !!body.controller_selected,
    controller_qty: Number.isFinite(body.controller_qty) ? body.controller_qty : null,
    alarm_qty: Number.isFinite(body.alarm_qty) ? body.alarm_qty : null,
    booking_fee: Number.isFinite(body.booking_fee) ? body.booking_fee : null,
    installation_balance: Number.isFinite(body.installation_balance) ? body.installation_balance : null,
    total_inc_gst: Number.isFinite(body.total_inc_gst) ? body.total_inc_gst : null,
    page_path: body.page_path ? String(body.page_path).trim() : null,
    status: 'sent',
    quote_token: generateQuoteToken(),
    accepted_at: null
  };

  try {
    var response = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/calculator_leads', {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: 'Bearer ' + serviceRoleKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    var text = await response.text();
    var data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = text;
    }

    if (!response.ok) {
      var missingColumns = JSON.stringify(data || '').toLowerCase();
      return json(res, 500, {
        error: missingColumns.indexOf('quote_token') !== -1 || missingColumns.indexOf('accepted_at') !== -1 || missingColumns.indexOf('status') !== -1
          ? 'Supabase table needs the accept-quote columns first.'
          : 'Failed to save calculator lead',
        details: data
      });
    }

    var savedLead = Array.isArray(data) ? data[0] : data;
    var finalLead = savedLead || payload;
    var emailResult = await sendInternalEmail(finalLead);
    var customerEmailResult = await sendCustomerQuoteEmail(finalLead);

    return json(res, 200, {
      ok: true,
      lead: savedLead,
      email: emailResult,
      customerEmail: customerEmailResult
    });
  } catch (error) {
    return json(res, 500, {
      error: 'Unexpected server error'
    });
  }
};
