module.exports = function handler(req, res) {
  var key = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_naSoCXktG1v18VS08tH4mIb0OtGLl34';

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    googleMapsApiKey: key
  });
};
