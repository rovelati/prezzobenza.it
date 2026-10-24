#!/usr/bin/env node
/**
 * notify-indexnow.js — PrezzoBenza.it
 * Invia notifiche IndexNow (Bing, Yandex, motori partner) + Bing Webmaster Tools API
 * 
 * Regola: Massimo 100 URL per esecuzione, 2 esecuzioni al giorno da crontab (ore 04:00 e 18:00),
 * per un totale di esattamente 200 URL/giorno (rispettando il tetto di 200/giorno).
 * 
 * - Run mattina (ore 04:00 o batch 1): prime 100 URL (Home, sezioni chiave e 96 province principali)
 * - Run sera (ore 18:00 o batch 2): successive 100 URL (restanti 11 province + 89 pagine diesel)
 */

import provincesSummary from '../src/data/provinces-summary.json' with { type: 'json' };

const HOST = 'prezzobenza.it';
const SITE_URL = `https://${HOST}`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'c491fade6de847b39a3bfce7e3e018d9';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const BING_API_KEY = process.env.BING_API_KEY || '4f25c5dc3491468f8459b92c21bb3ac1';

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
];

// Tutte le pagine canoniche del sito
const allUrls = [
  `${SITE_URL}/`,
  `${SITE_URL}/pompe-bianche/`,
  `${SITE_URL}/prezzi-oggi/`,
  `${SITE_URL}/come-risparmiare/`,
  ...provincesSummary.map(p => `${SITE_URL}/provincia/${p.slug}/`),
  ...provincesSummary.map(p => `${SITE_URL}/provincia/${p.slug}/diesel/`),
  ...provincesSummary.map(p => `${SITE_URL}/provincia/${p.slug}/metano-gpl/`),
];

// Parsing argomenti CLI o selezione automatica in base all'ora
const args = process.argv.slice(2);
let limit = 100;
let offset = 0;

const limitArg = args.find(a => a.startsWith('--limit='));
const offsetArg = args.find(a => a.startsWith('--offset='));
const batchArg = args.find(a => a.startsWith('--batch='));

if (limitArg) limit = parseInt(limitArg.split('=')[1], 10) || 100;

if (batchArg) {
  const batchNum = parseInt(batchArg.split('=')[1], 10);
  offset = batchNum === 2 ? 100 : 0;
} else if (offsetArg) {
  offset = parseInt(offsetArg.split('=')[1], 10) || 0;
} else {
  // Rilevamento automatico orario europeo (04:00 -> batch 1, 18:00 -> batch 2)
  const currentHour = new Date().getHours();
  if (currentHour >= 12) {
    offset = 100; // Batch sera: successive 100 URL
  } else {
    offset = 0;   // Batch mattina: prime 100 URL
  }
}

// Estrazione delle 100 URL per questa esecuzione
const selectedUrls = allUrls.slice(offset, offset + limit);

async function main() {
  console.log(`[IndexNow] PrezzoBenza.it — Invio batch (${selectedUrls.length} URL, offset: ${offset}, limit: ${limit}, totale sito: ${allUrls.length})`);
  console.log(`[IndexNow] Range URL: da #${offset + 1} a #${offset + selectedUrls.length}`);
  console.log(`[IndexNow] Prima URL: ${selectedUrls[0]}`);
  console.log(`[IndexNow] Ultima URL: ${selectedUrls[selectedUrls.length - 1]}`);
  console.log(`[IndexNow] Chiave attiva: ${INDEXNOW_KEY}`);
  console.log(`[IndexNow] KeyLocation: ${KEY_LOCATION}`);

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: selectedUrls,
  };

  // 1. Invio a IndexNow standard (Bing, Yandex, motori partner)
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      console.log(`[IndexNow] ${endpoint} -> status ${res.status}`);
    } catch (err) {
      console.error(`[IndexNow] Errore su ${endpoint}:`, err.message);
    }
  }

  // 2. Invio diretto a Bing Webmaster Tools API rispettando la quota giornaliera
  if (BING_API_KEY) {
    try {
      const quotaRes = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetUrlSubmissionQuota?siteUrl=${encodeURIComponent(SITE_URL + '/')}&apikey=${BING_API_KEY}`);
      const quotaData = await quotaRes.json();
      const dailyQuota = quotaData?.d?.DailyQuota || 0;

      if (dailyQuota > 0) {
        const batchBing = selectedUrls.slice(0, Math.min(dailyQuota, selectedUrls.length));
        const bingEndpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${BING_API_KEY}`;
        const bingRes = await fetch(bingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            siteUrl: `${SITE_URL}/`,
            urlList: batchBing,
          }),
        });
        console.log(`[BingAPI] SubmitUrlBatch inviati ${batchBing.length} URL (quota giornaliera disponibile: ${dailyQuota}) -> status ${bingRes.status}`);
      } else {
        console.log('[BingAPI] Quota giornaliera esaurita per oggi (0 rimanenti).');
      }
    } catch (err) {
      console.error('[BingAPI] Errore:', err.message);
    }
  }
}

main();
