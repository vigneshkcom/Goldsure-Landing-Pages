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

function getBaseUrl() {
  return (process.env.PUBLIC_SITE_URL || 'https://offers.goldsure.com.au').replace(/\/$/, '');
}

function buildAcceptUrl(lead) {
  return getBaseUrl() + '/accept-quote/smoke-alarm?token=' + encodeURIComponent(lead.quote_token || '');
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

function buildCustomerReminderHtml(lead) {
  var acceptUrl = buildAcceptUrl(lead);
  var alarmTotal = Number(lead.alarm_qty || 0) * 98;
  var controllerTotal = Number(lead.controller_qty || 0) * 49;
  var footerEmail = 'info@goldsure.com.au';

  return [
    '<!DOCTYPE html>',
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Smoke Alarm Quote Reminder</title></head>',
    '<body style="margin:0;padding:0;background-color:#ebebeb;">',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ebebeb">',
    '<tr><td align="center" style="padding:20px 16px;">',
    '<table width="600" border="0" cellpadding="0" cellspacing="0" style="background:#ffffff;overflow:hidden;">',
    '<tr><td bgcolor="#000000" align="center" style="padding:20px 32px 5px;">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/699a73ab3a2afd85cbdb392f.jpg" alt="Goldsure" width="180" style="display:block;width:180px;height:auto;margin:0 auto;" />',
    '</td></tr>',
    '<tr><td bgcolor="#000000" align="center" style="padding:0 32px 16px;">',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#b08d2e;">Smoke Alarm Quote Reminder</p>',
    '</td></tr>',
    '<tr><td bgcolor="#b08d2e" style="height:2px;font-size:1px;line-height:1px;">&nbsp;</td></tr>',
    '<tr><td style="padding:24px 30px;background:#ffffff;">',
    '<p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#000000;">Hi ' + escapeHtml(lead.full_name || 'there') + ',</p>',
    '<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#444444;line-height:1.7;">We noticed you have not gone ahead with your smoke alarm booking yet. If your property still needs to be brought into compliance, your quote is below and you can accept it online when you are ready.</p>',
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
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:18px;background:#111111;border-radius:10px;">',
    '<tr><td style="padding:20px 22px;text-align:center;">',
    '<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#b08d2e;">Ready To Move Forward?</p>',
    '<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#ffffff;">If you are ready, you can accept this quote now and our team will contact you to arrange the next step.</p>',
    '<a href="' + escapeHtml(acceptUrl) + '" style="display:inline-block;padding:14px 24px;background:#b08d2e;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Accept This Quote</a>',
    '</td></tr>',
    '</table>',
    '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;">',
    '<tr>',
    '<td width="136" valign="middle" style="padding-right:4px;">',
    '<img src="https://assets.cdn.filesafe.space/11epCbQAg9B4rQt5yHjw/media/68bebcb0db3e00c50ec25a0c.png" alt="Goldsure" width="112" style="display:block;width:112px;height:auto;">',
    '</td>',
    '<td valign="middle" style="border-left:2px solid #b08d2e;padding-left:12px;">',
    '<p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:1.2;color:#111111;">Customer Service</p>',
    '<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b08d2e;">Goldsure Pty Ltd</p>',
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#555555;line-height:1.6;">p: 07 2145 5155<br>e: <a href="mailto:' + escapeHtml(footerEmail) + '" style="color:#b08d2e;text-decoration:none;font-weight:bold;">' + escapeHtml(footerEmail) + '</a><br>w: <a href="https://www.goldsure.com.au" style="color:#b08d2e;text-decoration:none;font-weight:bold;">www.goldsure.com.au</a></p>',
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

  var leadId = String(body.id || '').trim();

  if (!leadId) {
    return json(res, 400, { error: 'Missing lead id' });
  }

  try {
    var leadResponse = await fetch(
      supabaseUrl.replace(/\/$/, '') + '/rest/v1/calculator_leads?select=*&id=eq.' + encodeURIComponent(leadId) + '&limit=1',
      {
        method: 'GET',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    var leadText = await leadResponse.text();
    var leadData;

    try {
      leadData = leadText ? JSON.parse(leadText) : [];
    } catch (error) {
      leadData = [];
    }

    if (!leadResponse.ok) {
      return json(res, 500, { error: 'Failed to load lead', details: leadData });
    }

    var lead = Array.isArray(leadData) ? leadData[0] : null;

    if (!lead) {
      return json(res, 404, { error: 'Lead not found' });
    }

    if (!lead.email) {
      return json(res, 400, { error: 'Lead has no customer email' });
    }

    if (String(lead.status || '').toLowerCase() === 'won') {
      return json(res, 400, { error: 'Won leads do not need reminders' });
    }

    var emailFrom = process.env.EMAIL_FROM || 'info@goldsure.com.au';
    var replyTo = process.env.EMAIL_TO || 'vignesh@goldsure.com.au';
    var emailResult = await sendResendEmail({
      from: formatFromAddress(emailFrom, 'Goldsure Pty Ltd'),
      to: [lead.email],
      reply_to: replyTo,
      subject: 'Reminder: Your Smoke Alarm Quote - Goldsure',
      html: buildCustomerReminderHtml(lead)
    });

    if (!emailResult.ok) {
      return json(res, 500, { error: 'Failed to send reminder email', details: emailResult.details || emailResult.reason || null });
    }

    var reminderCount = Number(lead.reminder_count || 0) + 1;
    var lastReminderAt = new Date().toISOString();
    var patchResponse = await fetch(
      supabaseUrl.replace(/\/$/, '') + '/rest/v1/calculator_leads?id=eq.' + encodeURIComponent(leadId),
      {
        method: 'PATCH',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          reminder_count: reminderCount,
          last_reminder_at: lastReminderAt
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
      return json(res, 500, { error: 'Reminder sent but tracker update failed', details: patchData });
    }

    return json(res, 200, {
      ok: true,
      lead: Array.isArray(patchData) ? patchData[0] : null,
      email: emailResult
    });
  } catch (error) {
    return json(res, 500, { error: 'Unexpected server error' });
  }
};
