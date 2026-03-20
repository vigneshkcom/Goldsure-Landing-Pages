module.exports = function handler(req, res) {
  var key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    googleMapsApiKey: key
  });
};
