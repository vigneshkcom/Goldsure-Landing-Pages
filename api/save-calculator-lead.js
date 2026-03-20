function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
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
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  var html = [
    '<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">',
    '<h2 style="margin:0 0 12px;">New Smoke Alarm Quote Download</h2>',
    '<p style="margin:0 0 16px;">A customer downloaded a smoke alarm calculator quote.</p>',
    '<table style="border-collapse:collapse;width:100%;max-width:760px;">',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Submitted</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + submittedAt + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Full Name</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.full_name || '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Phone</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.phone || '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.email || '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Property Address</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.property_address || '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Bedrooms</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.bedrooms ?? '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Storeys</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.storeys ?? '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Hallways</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.hallways ?? '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Alarm Qty</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.alarm_qty ?? '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Controller Selected</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.controller_selected ? 'Yes' : 'No') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Controller Qty</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.controller_qty ?? '-') + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Booking Fee</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">$' + Number(lead.booking_fee || 0).toFixed(2) + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Installation Balance</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">$' + Number(lead.installation_balance || 0).toFixed(2) + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Total Quote</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">$' + Number(lead.total_inc_gst || 0).toFixed(2) + '</td></tr>',
    '<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;">Page Path</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">' + (lead.page_path || '-') + '</td></tr>',
    '</table>',
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
