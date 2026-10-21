export async function onRequest(context) {
  const cf = context.request.cf || {};
  const lat = cf.latitude ? parseFloat(cf.latitude) : null;
  const lng = cf.longitude ? parseFloat(cf.longitude) : null;

  return new Response(
    JSON.stringify({
      city: cf.city || null,
      region: cf.region || null,
      regionCode: cf.regionCode || null,
      country: cf.country || null,
      postalCode: cf.postalCode || null,
      latitude: lat,
      longitude: lng,
    }),
    {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
    }
  );
}
