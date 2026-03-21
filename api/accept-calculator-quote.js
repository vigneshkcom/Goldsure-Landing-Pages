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

function formatFromAddress(value, displayName) {
  var raw = String(value || '').trim();

  if (!raw) {
    return displayName + ' <info@goldsure.com.au>';
  }

  if (raw.indexOf('<') !== -1 && raw.indexOf('>') !== -1) {
    return raw;
  }

  return displayName + ' <' + raw + '>';
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

function renderPage(title, message, tone, lead) {
  var accent = tone === 'success' ? '#41aa84' : tone === 'repeat' ? '#6b7fd7' : '#c94c4c';
  var badge = tone === 'success' ? 'Quote Accepted' : tone === 'repeat' ? 'Already Accepted' : 'Invalid Link';
  var details = lead
    ? '<div style="margin-top:18px;padding:16px;background:#faf6ec;border-left:4px solid #c9a84c;text-align:left;">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#a8892f;margin-bottom:8px;">Accepted Quote</div>' +
        '<div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;">' + escapeHtml(lead.full_name || '-') + '</div>' +
        '<div style="font-size:14px;color:#475467;line-height:1.7;">' +
          'Property: ' + escapeHtml(lead.property_address || '-') + '<br>' +
          'Total: ' + escapeHtml(formatMoney(lead.total_inc_gst || 0)) +
        '</div>' +
      '</div>'
    : '';

  return [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHtml(title) + '</title></head>',
    '<body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#111827;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f6f4ef">',
    '<tr><td align="center" style="padding:40px 16px;">',
    '<table width="560" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e9e4da;border-radius:20px;overflow:hidden;">',
    '<tr><td style="padding:28px 30px 10px;text-align:center;background:#ffffff;">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/68bebcb0db3e00c50ec25a0c.png" alt="Goldsure" width="170" style="display:block;margin:0 auto 14px;width:170px;height:auto;">',
    '<div style="display:inline-block;padding:6px 12px;border-radius:999px;background:' + accent + '1a;color:' + accent + ';font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">' + badge + '</div>',
    '<h1 style="margin:18px 0 10px;font-size:34px;line-height:1.08;letter-spacing:-0.03em;color:#111827;">' + escapeHtml(title) + '</h1>',
    '<p style="margin:0 auto;max-width:420px;font-size:16px;line-height:1.7;color:#475467;">' + escapeHtml(message) + '</p>',
    details,
    '<div style="margin-top:24px;font-size:14px;line-height:1.7;color:#475467;">A member of the Goldsure team will be in touch to confirm the next steps.</div>',
    '<div style="margin-top:8px;font-size:14px;line-height:1.7;color:#475467;">If you need anything urgently, call <strong>(07) 2145 5155</strong>.</div>',
    '</td></tr>',
    '<tr><td style="padding:18px 28px;background:#111111;text-align:center;">',
    '<div style="font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#c9a84c;">Goldsure Pty Ltd</div>',
    '<div style="margin-top:6px;font-size:12px;color:#9ca3af;">Smoke alarm compliance support from licensed professionals.</div>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');
}

async function sendAcceptedInternalEmail(lead) {
  var resendApiKey = process.env.RESEND_API_KEY;
  var emailTo = 'info@goldsure.com.au';
  var emailBcc = '';
  var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';
  var trackerUrl = 'https://offers.goldsure.com.au/tracker/smoke-alarm';

  if (!resendApiKey) {
    return { ok: false, skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  var acceptedAt = formatSydneyDateTime(lead.accepted_at);
  var hasControllers = Number(lead.controller_qty || 0) > 0;
  var alarmTotal = formatMoney(Number(lead.alarm_qty || 0) * 98);
  var controllerTotal = formatMoney(Number(lead.controller_qty || 0) * 49);

  var html = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Quote Accepted</title></head>',
    '<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;color:#141c2e;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f2f5"><tr><td align="center" style="padding:36px 16px 48px;">',
    '<table width="560" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;">',
    '<tr><td style="background:#000000;padding:20px 28px;border-radius:4px 4px 0 0;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td valign="middle">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699a73ab3a2afd85cbdb392f.jpg" alt="Goldsure" width="130" style="display:block;width:130px;height:auto;" />',
    '</td><td align="right" valign="middle"><span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Internal Notification</span></td></tr></table>',
    '</td></tr>',
    '<tr><td style="height:3px;background:#b08d2e;font-size:1px;line-height:1px;">&nbsp;</td></tr>',
    '<tr><td style="background:#ffffff;padding:28px 28px 32px;border-radius:0 0 4px 4px;border:1px solid #e3e7ef;border-top:none;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td>',
    '<p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7899;">Quote Accepted</p>',
    '<p style="margin:0;font-size:22px;font-weight:700;color:#141c2e;line-height:1.2;">' + escapeHtml(lead.full_name || '-') + '</p>',
    '</td><td align="right" valign="top">',
    '<p style="margin:0;font-size:11px;color:#6b7899;">' + escapeHtml(acceptedAt) + '</p>',
    '<p style="margin:4px 0 0;font-size:11px;color:#6b7899;">Status: <strong style="color:#141c2e;">Accepted</strong></p>',
    '</td></tr></table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="height:1px;background:#e3e7ef;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>',
    '<p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7899;">Customer Details</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e3e7ef;border-radius:4px;">',
    '<tr><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;width:30%;background:#f0f2f5;"><p style="margin:0;font-size:11px;color:#6b7899;">Email</p></td><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;color:#141c2e;"><a href="mailto:' + escapeHtml(lead.email || '') + '" style="color:#b08d2e;text-decoration:none;font-weight:600;">' + escapeHtml(lead.email || '-') + '</a></p></td></tr>',
    '<tr><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;background:#f0f2f5;"><p style="margin:0;font-size:11px;color:#6b7899;">Phone</p></td><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;font-weight:600;color:#141c2e;">' + escapeHtml(lead.phone || '-') + '</p></td></tr>',
    '<tr><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;background:#f0f2f5;"><p style="margin:0;font-size:11px;color:#6b7899;">Address</p></td><td style="padding:10px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;color:#141c2e;">' + escapeHtml(lead.property_address || '-') + '</p></td></tr>',
    '<tr><td style="padding:10px 14px;background:#f0f2f5;"><p style="margin:0;font-size:11px;color:#6b7899;">Service</p></td><td style="padding:10px 14px;"><p style="margin:0;font-size:13px;font-weight:600;color:#141c2e;">Smoke Alarm Installation</p></td></tr>',
    '</table>',
    '<p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7899;">Quote Breakdown</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e3e7ef;border-radius:4px;">',
    '<tr style="background:#f0f2f5;"><td style="padding:8px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7899;">Description</p></td><td align="right" style="padding:8px 14px;border-bottom:1px solid #e3e7ef;white-space:nowrap;"><p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7899;">Amount</p></td></tr>',
    '<tr><td style="padding:12px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;color:#141c2e;">Raptor Smoke Alarms</p><p style="margin:2px 0 0;font-size:11px;color:#6b7899;">' + escapeHtml(lead.alarm_qty || 0) + ' x $98.00</p></td><td align="right" style="padding:12px 14px;border-bottom:1px solid #e3e7ef;white-space:nowrap;"><p style="margin:0;font-size:13px;font-weight:600;color:#141c2e;">' + escapeHtml(alarmTotal) + '</p></td></tr>',
    hasControllers ? '<tr><td style="padding:12px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;color:#141c2e;">Smoke Alarm Controllers</p><p style="margin:2px 0 0;font-size:11px;color:#6b7899;">' + escapeHtml(lead.controller_qty || 0) + ' x $49.00</p></td><td align="right" style="padding:12px 14px;border-bottom:1px solid #e3e7ef;white-space:nowrap;"><p style="margin:0;font-size:13px;font-weight:600;color:#141c2e;">' + escapeHtml(controllerTotal) + '</p></td></tr>' : '',
    '<tr><td style="padding:12px 14px;border-bottom:1px solid #e3e7ef;"><p style="margin:0;font-size:13px;color:#141c2e;">Booking Fee</p></td><td align="right" style="padding:12px 14px;border-bottom:1px solid #e3e7ef;white-space:nowrap;"><p style="margin:0;font-size:13px;font-weight:600;color:#141c2e;">' + escapeHtml(formatMoney(lead.booking_fee || 0)) + '</p></td></tr>',
    '<tr style="background:#000000;"><td style="padding:14px 14px;"><p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.5);">Grand Total</p></td><td align="right" style="padding:14px 14px;white-space:nowrap;"><p style="margin:0;font-size:18px;font-weight:700;color:#b08d2e;">' + escapeHtml(formatMoney(lead.total_inc_gst || 0)) + '</p></td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background:#fef7e7;border-left:3px solid #b08d2e;border-radius:0 4px 4px 0;">',
    '<p style="margin:0 0 12px;font-size:13px;color:#7a6020;line-height:1.6;"><strong style="color:#141c2e;">Next step:</strong> Follow up with ' + escapeHtml(lead.full_name || 'this customer') + ' to confirm the booking date and collect the booking fee.</p>',
    '<a href="' + trackerUrl + '" style="display:inline-block;padding:12px 18px;background:#111111;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.04em;text-decoration:none;border-radius:6px;">Open Lead Tracker</a>',
    '</td></tr></table>',
    '</td></tr>',
    '<tr><td align="center" style="padding:20px 0 0;"><p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6b7899;">Goldsure Pty Ltd</p><p style="margin:0;font-size:11px;color:#9aa5b8;">Queensland, Australia</p></td></tr>',
    '</table>',
    '</td></tr></table>',
    '</body></html>'
  ].join('');

  return sendResendEmail({
    from: formatFromAddress(emailFrom, 'Goldsure Pty Ltd'),
    to: [emailTo],
    bcc: emailBcc ? [emailBcc] : [],
    subject: 'Quote Accepted - ' + (lead.full_name || 'Customer') + ' - ' + formatMoney(lead.total_inc_gst || 0),
    html: html
  });
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

  return { ok: true, data: data };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderPage('Configuration missing', 'The acceptance page is not configured correctly yet.', 'error'));
    return;
  }

  var url = new URL(req.url, 'http://localhost');
  var token = (url.searchParams.get('token') || '').trim();

  if (!token) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderPage('Invalid quote link', 'This acceptance link is missing the quote token.', 'error'));
    return;
  }

  try {
    var selectResponse = await fetch(
      supabaseUrl.replace(/\/$/, '') +
        '/rest/v1/calculator_leads?select=*&quote_token=eq.' + encodeURIComponent(token) + '&limit=1',
      {
        method: 'GET',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    var selectText = await selectResponse.text();
    var selectData;

    try {
      selectData = selectText ? JSON.parse(selectText) : [];
    } catch (error) {
      selectData = [];
    }

    if (!selectResponse.ok) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderPage('Unable to process quote', 'We could not look up this quote right now.', 'error'));
      return;
    }

    var lead = Array.isArray(selectData) ? selectData[0] : null;

    if (!lead) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderPage('Quote not found', 'This quote link is invalid or has expired.', 'error'));
      return;
    }

    if ((lead.status || '').toLowerCase() === 'accepted') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderPage('Quote already accepted', 'This quote has already been accepted. Our team will be in touch shortly.', 'repeat', lead));
      return;
    }

    var acceptedAt = new Date().toISOString();
    var patchResponse = await fetch(
      supabaseUrl.replace(/\/$/, '') +
        '/rest/v1/calculator_leads?quote_token=eq.' + encodeURIComponent(token),
      {
        method: 'PATCH',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          status: 'accepted',
          accepted_at: acceptedAt
        })
      }
    );

    var patchText = await patchResponse.text();
    var patchData;

    try {
      patchData = patchText ? JSON.parse(patchText) : [];
    } catch (error) {
      patchData = [];
    }

    if (!patchResponse.ok) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderPage('Unable to update quote', 'We found your quote, but could not mark it as accepted.', 'error'));
      return;
    }

    var updatedLead = Array.isArray(patchData) ? patchData[0] : lead;
    await sendAcceptedInternalEmail(updatedLead);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderPage('Quote accepted', 'Thank you. Your quote has been accepted successfully.', 'success', updatedLead));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderPage('Unexpected error', 'Something went wrong while processing your acceptance. Please contact Goldsure and we will help you directly.', 'error'));
  }
};
