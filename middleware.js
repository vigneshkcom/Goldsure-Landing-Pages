// Serve the battery page directly at battery.goldsure.com.au/ (no script loader),
// and send the old /battery address there permanently.
// Static index.html wins over vercel.json rewrites for "/", so this runs first.
// Every other host passes straight through.
export const config = { matcher: ['/', '/battery', '/battery/'] };

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname !== 'battery.goldsure.com.au') return;
  if (url.pathname === '/') {
    url.pathname = '/battery';
    return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
  }
  url.pathname = '/';
  return Response.redirect(url.toString(), 308);
}
