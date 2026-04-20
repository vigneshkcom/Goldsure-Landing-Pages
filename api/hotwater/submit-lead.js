var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/AOfC7QeiTk5m22pLkh8H/webhook-trigger/75acb356-a9c6-40b7-afcc-0ba5a87d5701';

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

  var body = req.body || {};

  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
  }

  if (!body.name || !body.phone || !body.email) {
    return json(res, 400, { error: 'Missing required fields' });
  }

  try {
    var ghlRes = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!ghlRes.ok) {
      return json(res, 502, { error: 'Webhook rejected: ' + ghlRes.status });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    return json(res, 500, { error: 'Failed to forward lead' });
  }
};
