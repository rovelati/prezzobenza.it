#!/usr/bin/env node
/**
 * notify-indexnow.js — PrezzoBenza.it
 * Invia notifiche IndexNow (Bing, Yandex, motori partner) + Bing Webmaster Tools API
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

const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/pompe-bianche/`,
  `${SITE_URL}/prezzi-oggi/`,
  `${SITE_URL}/come-risparmiare/`,
  ...provincesSummary.map(p => `${SITE_URL}/provincia/${p.slug}/`),
];

async function main() {
  console.log(`[IndexNow] Notifica ${urls.length} URL per ${HOST}...`);
  console.log(`[IndexNow] Chiave attiva: ${INDEXNOW_KEY}`);
  console.log(`[IndexNow] KeyLocation: ${KEY_LOCATION}`);

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
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
        const batch = urls.slice(0, Math.min(dailyQuota, urls.length));
        const bingEndpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${BING_API_KEY}`;
        const bingRes = await fetch(bingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            siteUrl: `${SITE_URL}/`,
            urlList: batch,
          }),
        });
        console.log(`[BingAPI] SubmitUrlBatch inviati ${batch.length} URL (quota giornaliera disponibile: ${dailyQuota}) -> status ${bingRes.status}`);
      } else {
        console.log('[BingAPI] Quota giornaliera esaurita per oggi.');
      }
    } catch (err) {
      console.error('[BingAPI] Errore:', err.message);
    }
  }
}

main();
