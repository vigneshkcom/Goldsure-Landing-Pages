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

async function sendInternalEmail(lead) {
  var resendApiKey = process.env.RESEND_API_KEY;
  var emailTo = process.env.EMAIL_TO || 'vignesh@goldsure.com.au';
  var emailBcc = process.env.EMAIL_BCC || '';
  var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';

  if (!resendApiKey) {
    return { ok: false, skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  var submittedAt = lead.created_at
    ? new Date(lead.created_at).toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Australia/Sydney'
      })
    : new Date().toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Australia/Sydney'
      });

  var html = [
    '<div style="margin:0;padding:32px 16px;background:#f8f6f1;font-family:Arial,sans-serif;color:#0d0d0d;">',
    '<div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid rgba(13,13,13,0.08);border-radius:22px;overflow:hidden;box-shadow:0 14px 40px rgba(13,13,13,0.08);">',
    '<div style="background:linear-gradient(135deg,#ffffff 0%,#fbf8f0 100%);padding:28px 32px 22px;border-top:4px solid #c9a84c;border-bottom:1px solid rgba(13,13,13,0.06);">',
    '<div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#a8892f;margin-bottom:10px;">Goldsure Internal Notification</div>',
    '<h1 style="margin:0 0 10px;font-size:30px;line-height:1.1;letter-spacing:-0.03em;color:#0d0d0d;">New Smoke Alarm Quote Download</h1>',
    '<p style="margin:0;font-size:15px;line-height:1.7;color:#5f5f5f;">A customer has completed the calculator flow and downloaded an itemised quote.</p>',
    '</div>',

    '<div style="padding:28px 32px 8px;">',
    '<div style="display:block;margin-bottom:22px;padding:18px 20px;background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.24);border-left:4px solid #c9a84c;border-radius:16px;">',
    '<div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a8892f;margin-bottom:8px;">Submitted</div>',
    '<div style="font-size:16px;font-weight:700;color:#0d0d0d;">' + escapeHtml(submittedAt) + '</div>',
    '<div style="margin-top:6px;font-size:13px;color:#6b7280;">Tracker route: ' + escapeHtml(lead.page_path || '-') + '</div>',
    '</div>',

    '<div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7180a6;margin:0 0 12px;">Customer Details</div>',
    '<div style="margin-bottom:24px;">',
    '<div style="padding:14px 0;border-bottom:1px solid rgba(13,13,13,0.08);"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:6px;">Full Name</div><div style="font-size:18px;font-weight:700;color:#0d0d0d;">' + escapeHtml(lead.full_name || '-') + '</div></div>',
    '<div style="padding:14px 0;border-bottom:1px solid rgba(13,13,13,0.08);"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:6px;">Phone</div><div style="font-size:16px;font-weight:700;color:#0d0d0d;">' + escapeHtml(lead.phone || '-') + '</div></div>',
    '<div style="padding:14px 0;border-bottom:1px solid rgba(13,13,13,0.08);"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:6px;">Email</div><div style="font-size:15px;color:#0d0d0d;">' + escapeHtml(lead.email || '-') + '</div></div>',
    '<div style="padding:14px 0;"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:6px;">Property Address</div><div style="font-size:15px;line-height:1.7;color:#0d0d0d;">' + escapeHtml(lead.property_address || '-') + '</div></div>',
    '</div>',

    '<div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7180a6;margin:0 0 12px;">Quote Summary</div>',
    '<div style="font-size:0;margin-bottom:24px;">',
    '<div style="display:inline-block;vertical-align:top;width:48%;margin:0 4% 12px 0;padding:16px 18px;background:#ffffff;border:1px solid rgba(13,13,13,0.08);border-radius:16px;"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px;">Property</div><div style="font-size:15px;line-height:1.8;color:#0d0d0d;">Bedrooms: ' + escapeHtml(lead.bedrooms ?? '-') + '<br>Storeys: ' + escapeHtml(lead.storeys ?? '-') + '<br>Hallways: ' + escapeHtml(lead.hallways ?? '-') + '</div></div>',
    '<div style="display:inline-block;vertical-align:top;width:48%;padding:16px 18px;background:#ffffff;border:1px solid rgba(13,13,13,0.08);border-radius:16px;"><div style="font-size:12px;color:#7180a6;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px;">Equipment</div><div style="font-size:15px;line-height:1.8;color:#0d0d0d;">Alarm Qty: ' + escapeHtml(lead.alarm_qty ?? '-') + '<br>Controller: ' + (lead.controller_selected ? 'Yes' : 'No') + '<br>Controller Qty: ' + escapeHtml(lead.controller_qty ?? '-') + '</div></div>',
    '</div>',

    '<div style="padding:20px 22px;background:#0d0d0d;border-radius:18px;margin-bottom:28px;">',
    '<div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:14px;">Pricing</div>',
    '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);font-size:15px;color:rgba(255,255,255,0.78);">Booking Fee <span style="float:right;color:#ffffff;font-weight:700;">' + escapeHtml(formatMoney(lead.booking_fee)) + '</span></div>',
    '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.10);font-size:15px;color:rgba(255,255,255,0.78);">Installation Balance <span style="float:right;color:#ffffff;font-weight:700;">' + escapeHtml(formatMoney(lead.installation_balance)) + '</span></div>',
    '<div style="padding:16px 0 4px;font-size:16px;color:rgba(255,255,255,0.88);font-weight:700;">Total Quote <span style="float:right;color:#c9a84c;font-size:28px;letter-spacing:-0.03em;">' + escapeHtml(formatMoney(lead.total_inc_gst)) + '</span></div>',
    '</div>',
    '</div>',

    '<div style="padding:18px 32px 28px;border-top:1px solid rgba(13,13,13,0.06);background:#fcfbf8;">',
    '<div style="font-size:13px;line-height:1.7;color:#6b7280;">This is an internal lead notification generated from the Goldsure smoke alarm calculator funnel.</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');

  var response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + resendApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [emailTo],
      bcc: emailBcc ? [emailBcc] : [],
      subject: 'New Smoke Alarm Quote Download - ' + (lead.full_name || 'Customer'),
      html: html
    })
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

async function sendCustomerQuoteEmail(lead) {
  var resendApiKey = process.env.RESEND_API_KEY;
  var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';
  var replyTo = process.env.EMAIL_TO || 'info@goldsure.com.au';

  if (!resendApiKey) {
    return { ok: false, skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  if (!lead.email) {
    return { ok: false, skipped: true, reason: 'Missing customer email' };
  }

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
    '<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;line-height:1.7;">Thank you for requesting a smoke alarm quote from Goldsure. Please find your quote summary below. Our team will review your requirements and contact you if needed.</p>',

    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border:1px solid #e0e0e0;">',
    '<tr bgcolor="#000000">',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Description</td>',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;text-align:center;">Qty</td>',
    '<td style="padding:8px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;text-align:right;">Amount</td>',
    '</tr>',
    '<tr bgcolor="#ffffff">',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;border-top:1px solid #f0f0f0;"><strong>Raptor Smoke Alarms</strong><br><span style="font-size:11px;color:#888888;">Photoelectric · Interconnected · 10-Year Warranty</span></td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;text-align:center;border-top:1px solid #f0f0f0;">' + escapeHtml(lead.alarm_qty ?? 0) + '</td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#000000;text-align:right;border-top:1px solid #f0f0f0;">' + escapeHtml(formatMoney((lead.alarm_qty || 0) * 98)) + '</td>',
    '</tr>',
    '<tr bgcolor="#f9f9f9">',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;border-top:1px solid #f0f0f0;"><strong>Smoke Alarm Controller</strong><br><span style="font-size:11px;color:#888888;">Remote control and status display</span></td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111111;text-align:center;border-top:1px solid #f0f0f0;">' + escapeHtml(lead.controller_qty ?? 0) + '</td>',
    '<td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#000000;text-align:right;border-top:1px solid #f0f0f0;">' + escapeHtml(formatMoney((lead.controller_qty || 0) * 49)) + '</td>',
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
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#333333;line-height:1.6;">Address: ' + escapeHtml(lead.property_address || '-') + '<br>Bedrooms: ' + escapeHtml(lead.bedrooms ?? '-') + ' · Storeys: ' + escapeHtml(lead.storeys ?? '-') + ' · Hallways: ' + escapeHtml(lead.hallways ?? '-') + '</p>',
    '</td></tr>',
    '</table>',

    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border-top:2px solid #b08d2e;">',
    '<tr><td style="padding-top:14px;">',
    '<p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#b08d2e;">Queensland Legislation</p>',
    '<p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#000000;line-height:1.2;">Important Compliance Notes</p>',
    '<p style="margin:0 0 15px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;line-height:1.6;">Final alarm placement and exact compliance requirements are confirmed by a licensed electrician on site.</p>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;">',
    '<tr><td colspan="2" bgcolor="#000000" style="padding:8px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Key Points</p></td></tr>',
    '<tr>',
    '<td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-right:1px solid #eeeeee;border-bottom:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">• Photoelectric and interconnected alarms</p></td>',
    '<td width="50%" valign="top" bgcolor="#ffffff" style="padding:10px 12px;border-bottom:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">• Alarms in bedrooms, hallways, and each storey</p></td>',
    '</tr>',
    '<tr>',
    '<td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;border-right:1px solid #eeeeee;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">• 10-year sealed battery backup where required</p></td>',
    '<td width="50%" valign="top" bgcolor="#f9f9f9" style="padding:10px 12px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#333333;line-height:1.6;">• Final compliance confirmed on site</p></td>',
    '</tr>',
    '</table>',
    '</td></tr>',
    '</table>',

    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;">',
    '<tr><td valign="middle">',
    '<p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#000000;">Goldsure Pty Ltd</p>',
    '<p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;color:#b08d2e;letter-spacing:1px;text-transform:uppercase;">Smoke Alarm Team</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;line-height:1.6;">p: 07 2145 5155<br>e: <a href="mailto:' + escapeHtml(replyTo) + '" style="color:#b08d2e;text-decoration:none;font-weight:bold;">' + escapeHtml(replyTo) + '</a><br>w: <a href="https://www.goldsure.com.au" style="color:#b08d2e;text-decoration:none;font-weight:bold;">www.goldsure.com.au</a></p>',
    '</td></tr>',
    '</table>',

    '<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#aaaaaa;font-style:italic;line-height:1.5;border-top:1px solid #eeeeee;padding-top:12px;">This quote is an estimate based on the property details provided. Final requirements may vary after on-site review by a licensed electrician.</p>',
    '</td></tr>',
    '<tr><td bgcolor="#000000" align="center" style="padding:15px 20px;">',
    '<p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#b08d2e;">Goldsure Pty Ltd</p>',
    '<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#888888;line-height:1.5;">Queensland, Australia</p>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  var response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + resendApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [lead.email],
      reply_to: replyTo,
      subject: 'Your Smoke Alarm Quote - Goldsure',
      html: html
    })
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
      error: 'Failed to send customer email',
      details: data
    };
  }

  return {
    ok: true,
    data: data
  };
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
    page_path: body.page_path ? String(body.page_path).trim() : null
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
      return json(res, 500, {
        error: 'Failed to save calculator lead',
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
