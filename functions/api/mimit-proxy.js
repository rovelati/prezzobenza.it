export async function onRequest(context) {
  const url = new URL(context.request.url);
  const file = url.searchParams.get('file');

  if (file !== 'prezzo_alle_8.csv' && file !== 'anagrafica_impianti_attivi.csv') {
    return new Response('File non valido. Usa ?file=prezzo_alle_8.csv o ?file=anagrafica_impianti_attivi.csv', { status: 400 });
  }

  const targetUrl = `https://www.mimit.gov.it/images/exportCSV/${file}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      return new Response(`Errore MIMIT HTTP ${res.status}`, { status: res.status });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(`Errore proxy MIMIT: ${err.message || String(err)}`, { status: 502 });
  }
}
