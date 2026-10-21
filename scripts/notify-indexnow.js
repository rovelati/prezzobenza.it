#!/usr/bin/env node
/**
 * notify-indexnow.js — PrezzoBenza.it
 * Invia notifiche IndexNow a Bing e ai motori aderenti
 */

import provincesSummary from '../src/data/provinces-summary.json' with { type: 'json' };

const HOST = 'www.prezzobenza.it';
const SITE_URL = `https://${HOST}`;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'a3c7e48b19284cf5920d91827463510e';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
];

const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/pompe-bianche/`,
  `${SITE_URL}/prezzi-oggi/`,
  `${SITE_URL}/come-risparmiare/`,
  ...provincesSummary.slice(0, 30).map(p => `${SITE_URL}/provincia/${p.slug}/`),
];

async function main() {
  console.log(`[IndexNow] Invio notifica per ${urls.length} URL prioritari...`);
  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

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
}

main();
