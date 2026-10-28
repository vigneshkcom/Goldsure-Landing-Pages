// Serve the battery page directly at battery.goldsure.com.au/ (no script loader).
// Static index.html wins over vercel.json rewrites for "/", so this runs first.
// Every other host and path passes straight through.
export const config = { matcher: '/' };

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname !== 'battery.goldsure.com.au') return;
  url.pathname = '/battery';
  return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
}
