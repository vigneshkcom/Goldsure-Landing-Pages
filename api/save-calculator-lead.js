function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
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

    return json(res, 200, {
      ok: true,
      lead: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    return json(res, 500, {
      error: 'Unexpected server error'
    });
  }
};
