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

  var leadId = String(body.id || '').trim();
  var status = String(body.status || '').trim().toLowerCase();

  if (!leadId) {
    return json(res, 400, { error: 'Missing lead id' });
  }

  if (['downloaded', 'accepted', 'won'].indexOf(status) === -1) {
    return json(res, 400, { error: 'Invalid status' });
  }

  var patch = {
    status: status
  };

  try {
    var response = await fetch(
      supabaseUrl.replace(/\/$/, '') + '/rest/v1/calculator_leads?id=eq.' + encodeURIComponent(leadId),
      {
        method: 'PATCH',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(patch)
      }
    );

    var text = await response.text();
    var data;

    try {
      data = text ? JSON.parse(text) : [];
    } catch (error) {
      data = [];
    }

    if (!response.ok) {
      return json(res, 500, {
        error: 'Failed to update lead status',
        details: data
      });
    }

    return json(res, 200, {
      ok: true,
      lead: Array.isArray(data) ? data[0] : null
    });
  } catch (error) {
    return json(res, 500, { error: 'Unexpected server error' });
  }
};
