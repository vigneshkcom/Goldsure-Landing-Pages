module.exports = function handler(req, res) {
  var key = process.env.GOOGLE_MAPS_API_KEY || '';

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    googleMapsApiKey: key
  });
};
