function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Missing Supabase configuration' });
  }

  try {
    var response = await fetch(
      supabaseUrl.replace(/\/$/, '') +
        '/rest/v1/calculator_leads?select=*&order=created_at.desc',
      {
        method: 'GET',
        headers: {
          apikey: serviceRoleKey,
          Authorization: 'Bearer ' + serviceRoleKey,
          'Content-Type': 'application/json'
        }
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
        error: 'Failed to fetch calculator leads',
        details: data
      });
    }

    return json(res, 200, {
      ok: true,
      leads: Array.isArray(data) ? data : []
    });
  } catch (error) {
    return json(res, 500, {
      error: 'Unexpected server error'
    });
  }
};
