export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If request hits Cloudflare Pages *.pages.dev domain
  if (url.hostname.endsWith('.pages.dev')) {
    // 1. Robots.txt on pages.dev explicitly disallows everything
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 2. Allow API routes with noindex header
    if (url.pathname.startsWith('/api/')) {
      const response = await context.next();
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // 3. Permanent 301 Redirect to canonical custom domain with noindex tag
    const targetUrl = `https://www.prezzobenza.it${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: {
        'Location': targetUrl,
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Normal request on custom domain (prezzobenza.it)
  return await context.next();
}
