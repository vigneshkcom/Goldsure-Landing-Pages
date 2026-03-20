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
  var emailTo = process.env.EMAIL_TO || 'info@goldsure.com.au';
  var emailBcc = process.env.EMAIL_BCC || 'kanishka@webco.au';
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
      bcc: [emailBcc],
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
    var emailResult = await sendInternalEmail(savedLead || payload);

    return json(res, 200, {
      ok: true,
      lead: savedLead,
      email: emailResult
    });
  } catch (error) {
    return json(res, 500, {
      error: 'Unexpected server error'
    });
  }
};
