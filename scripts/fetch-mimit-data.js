#!/usr/bin/env node
/**
 * fetch-mimit-data.js — PrezzoBenza.it
 * Scarica e analizza gli Open Data ufficiali MIMIT:
 *  - anagrafica_impianti_attivi.csv
 *  - prezzo_alle_8.csv
 * 
 * Genera dati aggregati, statistiche nazionali, indice delle 107 province
 * e file JSON geolocalizzati per ogni provincia.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ANAGRAFICA_URL = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
const PREZZI_URL = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';

const PROVINCE_MAP = {
  AG: { name: 'Agrigento', region: 'Sicilia', slug: 'agrigento' },
  AL: { name: 'Alessandria', region: 'Piemonte', slug: 'alessandria' },
  AN: { name: 'Ancona', region: 'Marche', slug: 'ancona' },
  AO: { name: 'Aosta', region: "Valle d'Aosta", slug: 'aosta' },
  AR: { name: 'Arezzo', region: 'Toscana', slug: 'arezzo' },
  AP: { name: 'Ascoli Piceno', region: 'Marche', slug: 'ascoli-piceno' },
  AT: { name: 'Asti', region: 'Piemonte', slug: 'asti' },
  AV: { name: 'Avellino', region: 'Campania', slug: 'avellino' },
  BA: { name: 'Bari', region: 'Puglia', slug: 'bari' },
  BT: { name: 'Barletta-Andria-Trani', region: 'Puglia', slug: 'barletta-andria-trani' },
  BL: { name: 'Belluno', region: 'Veneto', slug: 'belluno' },
  BN: { name: 'Benevento', region: 'Campania', slug: 'benevento' },
  BG: { name: 'Bergamo', region: 'Lombardia', slug: 'bergamo' },
  BI: { name: 'Biella', region: 'Piemonte', slug: 'biella' },
  BO: { name: 'Bologna', region: 'Emilia-Romagna', slug: 'bologna' },
  BZ: { name: 'Bolzano', region: 'Trentino-Alto Adige', slug: 'bolzano' },
  BS: { name: 'Brescia', region: 'Lombardia', slug: 'brescia' },
  BR: { name: 'Brindisi', region: 'Puglia', slug: 'brindisi' },
  CA: { name: 'Cagliari', region: 'Sardegna', slug: 'cagliari' },
  CL: { name: 'Caltanissetta', region: 'Sicilia', slug: 'caltanissetta' },
  CB: { name: 'Campobasso', region: 'Molise', slug: 'campobasso' },
  CE: { name: 'Caserta', region: 'Campania', slug: 'caserta' },
  CT: { name: 'Catania', region: 'Sicilia', slug: 'catania' },
  CZ: { name: 'Catanzaro', region: 'Calabria', slug: 'catanzaro' },
  CH: { name: 'Chieti', region: 'Abruzzo', slug: 'chieti' },
  CO: { name: 'Como', region: 'Lombardia', slug: 'como' },
  CS: { name: 'Cosenza', region: 'Calabria', slug: 'cosenza' },
  CR: { name: 'Cremona', region: 'Lombardia', slug: 'cremona' },
  KR: { name: 'Crotone', region: 'Calabria', slug: 'crotone' },
  CN: { name: 'Cuneo', region: 'Piemonte', slug: 'cuneo' },
  EN: { name: 'Enna', region: 'Sicilia', slug: 'enna' },
  FM: { name: 'Fermo', region: 'Marche', slug: 'fermo' },
  FE: { name: 'Ferrara', region: 'Emilia-Romagna', slug: 'ferrara' },
  FI: { name: 'Firenze', region: 'Toscana', slug: 'firenze' },
  FG: { name: 'Foggia', region: 'Puglia', slug: 'foggia' },
  FC: { name: 'Forlì-Cesena', region: 'Emilia-Romagna', slug: 'forli-cesena' },
  FR: { name: 'Frosinone', region: 'Lazio', slug: 'frosinone' },
  GE: { name: 'Genova', region: 'Liguria', slug: 'genova' },
  GO: { name: 'Gorizia', region: 'Friuli Venezia Giulia', slug: 'gorizia' },
  GR: { name: 'Grosseto', region: 'Toscana', slug: 'grosseto' },
  IM: { name: 'Imperia', region: 'Liguria', slug: 'imperia' },
  IS: { name: 'Isernia', region: 'Molise', slug: 'isernia' },
  AQ: { name: "L'Aquila", region: 'Abruzzo', slug: 'laquila' },
  SP: { name: 'La Spezia', region: 'Liguria', slug: 'la-spezia' },
  LT: { name: 'Latina', region: 'Lazio', slug: 'latina' },
  LE: { name: 'Lecce', region: 'Puglia', slug: 'lecce' },
  LC: { name: 'Lecco', region: 'Lombardia', slug: 'lecco' },
  LI: { name: 'Livorno', region: 'Toscana', slug: 'livorno' },
  LO: { name: 'Lodi', region: 'Lombardia', slug: 'lodi' },
  LU: { name: 'Lucca', region: 'Toscana', slug: 'lucca' },
  MC: { name: 'Macerata', region: 'Marche', slug: 'macerata' },
  MN: { name: 'Mantova', region: 'Lombardia', slug: 'mantova' },
  MS: { name: 'Massa-Carrara', region: 'Toscana', slug: 'massa-carrara' },
  MT: { name: 'Matera', region: 'Basilicata', slug: 'matera' },
  ME: { name: 'Messina', region: 'Sicilia', slug: 'messina' },
  MI: { name: 'Milano', region: 'Lombardia', slug: 'milano' },
  MO: { name: 'Modena', region: 'Emilia-Romagna', slug: 'modena' },
  MB: { name: 'Monza e Brianza', region: 'Lombardia', slug: 'monza-e-brianza' },
  NA: { name: 'Napoli', region: 'Campania', slug: 'napoli' },
  NO: { name: 'Novara', region: 'Piemonte', slug: 'novara' },
  NU: { name: 'Nuoro', region: 'Sardegna', slug: 'nuoro' },
  OR: { name: 'Oristano', region: 'Sardegna', slug: 'oristano' },
  PD: { name: 'Padova', region: 'Veneto', slug: 'padova' },
  PA: { name: 'Palermo', region: 'Sicilia', slug: 'palermo' },
  PR: { name: 'Parma', region: 'Emilia-Romagna', slug: 'parma' },
  PV: { name: 'Pavia', region: 'Lombardia', slug: 'pavia' },
  PG: { name: 'Perugia', region: 'Umbria', slug: 'perugia' },
  PU: { name: 'Pesaro e Urbino', region: 'Marche', slug: 'pesaro-e-urbino' },
  PE: { name: 'Pescara', region: 'Abruzzo', slug: 'pescara' },
  PC: { name: 'Piacenza', region: 'Emilia-Romagna', slug: 'piacenza' },
  PI: { name: 'Pisa', region: 'Toscana', slug: 'pisa' },
  PT: { name: 'Pistoia', region: 'Toscana', slug: 'pistoia' },
  PN: { name: 'Pordenone', region: 'Friuli Venezia Giulia', slug: 'pordenone' },
  PZ: { name: 'Potenza', region: 'Basilicata', slug: 'potenza' },
  PO: { name: 'Prato', region: 'Toscana', slug: 'prato' },
  RG: { name: 'Ragusa', region: 'Sicilia', slug: 'ragusa' },
  RA: { name: 'Ravenna', region: 'Emilia-Romagna', slug: 'ravenna' },
  RC: { name: 'Reggio Calabria', region: 'Calabria', slug: 'reggio-calabria' },
  RE: { name: 'Reggio Emilia', region: 'Emilia-Romagna', slug: 'reggio-emilia' },
  RI: { name: 'Rieti', region: 'Lazio', slug: 'rieti' },
  RN: { name: 'Rimini', region: 'Emilia-Romagna', slug: 'rimini' },
  RM: { name: 'Roma', region: 'Lazio', slug: 'roma' },
  RO: { name: 'Rovigo', region: 'Veneto', slug: 'rovigo' },
  SA: { name: 'Salerno', region: 'Campania', slug: 'salerno' },
  SS: { name: 'Sassari', region: 'Sardegna', slug: 'sassari' },
  SV: { name: 'Savona', region: 'Liguria', slug: 'savona' },
  SI: { name: 'Siena', region: 'Toscana', slug: 'siena' },
  SR: { name: 'Siracusa', region: 'Sicilia', slug: 'siracusa' },
  SO: { name: 'Sondrio', region: 'Lombardia', slug: 'sondrio' },
  SU: { name: 'Sud Sardegna', region: 'Sardegna', slug: 'sud-sardegna' },
  TA: { name: 'Taranto', region: 'Puglia', slug: 'taranto' },
  TE: { name: 'Teramo', region: 'Abruzzo', slug: 'teramo' },
  TR: { name: 'Terni', region: 'Umbria', slug: 'terni' },
  TO: { name: 'Torino', region: 'Piemonte', slug: 'torino' },
  TP: { name: 'Trapani', region: 'Sicilia', slug: 'trapani' },
  TN: { name: 'Trento', region: 'Trentino-Alto Adige', slug: 'trento' },
  TV: { name: 'Treviso', region: 'Veneto', slug: 'treviso' },
  TS: { name: 'Trieste', region: 'Friuli Venezia Giulia', slug: 'trieste' },
  UD: { name: 'Udine', region: 'Friuli Venezia Giulia', slug: 'udine' },
  VA: { name: 'Varese', region: 'Lombardia', slug: 'varese' },
  VE: { name: 'Venezia', region: 'Veneto', slug: 'venezia' },
  VB: { name: 'Verbano-Cusio-Ossola', region: 'Piemonte', slug: 'verbano-cusio-ossola' },
  VC: { name: 'Vercelli', region: 'Piemonte', slug: 'vercelli' },
  VR: { name: 'Verona', region: 'Veneto', slug: 'verona' },
  VV: { name: 'Vibo Valentia', region: 'Calabria', slug: 'vibo-valentia' },
  VI: { name: 'Vicenza', region: 'Veneto', slug: 'vicenza' },
  VT: { name: 'Viterbo', region: 'Lazio', slug: 'viterbo' },
};

function normalizeBrand(brandRaw) {
  if (!brandRaw) return 'Pompa Bianca';
  const b = brandRaw.trim().toUpperCase();
  if (b.includes('ENI') || b.includes('AGIP')) return 'Eni';
  if (b.includes('Q8')) return 'Q8';
  if (b.includes('IP') || b.includes('ITALIANA PETROLI') || b.includes('API')) return 'IP';
  if (b.includes('ESSO')) return 'Esso';
  if (b.includes('TAMOIL')) return 'Tamoil';
  if (b.includes('CONAD')) return 'Conad';
  if (b.includes('COOP') || b.includes('ENERCOOP')) return 'Enercoop';
  if (b.includes('COSTANTIN')) return 'Costantin';
  if (b.includes('RETE ITALIA') || b.includes('RETITALIA')) return 'Retitalia';
  if (b.includes('BEYFIN')) return 'Beyfin';
  if (b.includes('REPSOL')) return 'Repsol';
  if (b.includes('SAN MARCO')) return 'San Marco';
  if (b.includes('EG') || b.includes('EURO GARAGES')) return 'EG Italia';
  if (b.includes('POMPE BIANCHE') || b.includes('NO LOGO') || b.includes('SENZA MARCHIO') || b.includes('ALTRO')) return 'Pompa Bianca';
  return brandRaw.trim();
}

async function fetchCsv(url) {
  const fileName = url.split('/').pop();
  const proxyUrl = `https://www.prezzobenza.it/api/mimit-proxy?file=${fileName}`;

  // Tenta prima tramite il proxy Cloudflare edge (che non subisce i blocchi IP di datacenter esteri/Contabo),
  // e in caso di anomalia prova l'endpoint diretto ministeriale.
  const urlsToTry = [proxyUrl, url];

  for (const target of urlsToTry) {
    console.log(`[MIMIT] Scarico da: ${target}...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(target, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,*/*',
        },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 1000) {
          console.log(`[MIMIT] Successo: scaricati ${(text.length / 1024 / 1024).toFixed(2)} MB da ${target}`);
          return text;
        }
      }
      console.warn(`[MIMIT] Risposta non valida da ${target} (HTTP ${res.status})`);
    } catch (err) {
      clearTimeout(timeout);
      console.warn(`[MIMIT] Tentativo fallito su ${target}: ${err.message}`);
    }
  }

  throw new Error(`Impossibile scaricare ${fileName} da tutte le sorgenti disponibili`);
}

async function main() {
  const startTime = Date.now();
  console.log('=== Inizio aggiornamento dati MIMIT per PrezzoBenza.it ===');

  mkdirSync(path.join(ROOT, 'src', 'data'), { recursive: true });
  mkdirSync(path.join(ROOT, 'public', 'data', 'provinces'), { recursive: true });

  const [anagraficaRaw, prezziRaw] = await Promise.all([
    fetchCsv(ANAGRAFICA_URL),
    fetchCsv(PREZZI_URL),
  ]);

  console.log('[MIMIT] CSV scaricati con successo. Avvio elaborazione...');

  // 1. Parsing Anagrafica
  const anagraficaLines = anagraficaRaw.split(/\r?\n/);
  let extractionDate = '';
  if (anagraficaLines[0]?.startsWith('Estrazione del')) {
    extractionDate = anagraficaLines[0].replace('Estrazione del', '').trim();
  }

  const stations = new Map();

  for (let i = 2; i < anagraficaLines.length; i++) {
    const line = anagraficaLines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length < 10) continue;

    const id = parts[0].trim();
    const gestore = parts[1]?.trim() || '';
    const bandieraRaw = parts[2]?.trim() || '';
    const tipoImpianto = parts[3]?.trim() || 'Stradale';
    const nomeImpianto = parts[4]?.trim() || '';
    const indirizzo = parts[5]?.trim() || '';
    const comune = parts[6]?.trim() || '';
    const provincia = (parts[7]?.trim() || '').toUpperCase();
    const lat = parseFloat(parts[8]);
    const lng = parseFloat(parts[9]);

    // Filtra coordinate non plausibili per l'Italia
    const validCoords = !isNaN(lat) && !isNaN(lng) && lat >= 35.0 && lat <= 47.5 && lng >= 6.5 && lng <= 19.0;

    stations.set(id, {
      id,
      gestore,
      brand: normalizeBrand(bandieraRaw),
      bandieraRaw,
      tipo: tipoImpianto,
      nome: nomeImpianto,
      indirizzo,
      comune,
      provincia,
      lat: validCoords ? Number(lat.toFixed(6)) : null,
      lng: validCoords ? Number(lng.toFixed(6)) : null,
      prices: {},
    });
  }

  console.log(`[MIMIT] Impianti mappati: ${stations.size}`);

  // 2. Parsing Prezzi
  const prezziLines = prezziRaw.split(/\r?\n/);
  let totalPricesCount = 0;

  for (let i = 2; i < prezziLines.length; i++) {
    const line = prezziLines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length < 5) continue;

    const id = parts[0].trim();
    const descCarburante = parts[1]?.trim().toLowerCase() || '';
    const prezzo = parseFloat(parts[2]);
    const isSelf = parts[3]?.trim() === '1';
    const dtComu = parts[4]?.trim() || '';

    if (isNaN(prezzo)) continue;
    // Sanity check contro placeholder errati inseriti dai gestori
    if (descCarburante.includes('benzina') && (prezzo < 1.35 || prezzo > 2.80)) continue;
    if (descCarburante.includes('gasolio') && (prezzo < 1.30 || prezzo > 2.80)) continue;
    if (descCarburante.includes('gpl') && (prezzo < 0.50 || prezzo > 1.35)) continue;
    if (descCarburante.includes('metano') && (prezzo < 0.90 || prezzo > 2.60)) continue;

    const st = stations.get(id);
    if (!st) continue;

    let fuelKey = '';
    if (descCarburante.includes('benzina') && !descCarburante.includes('speciale') && !descCarburante.includes('100')) {
      fuelKey = isSelf ? 'benzina_self' : 'benzina_servito';
    } else if (descCarburante.includes('gasolio') && !descCarburante.includes('speciale') && !descCarburante.includes('hvo')) {
      fuelKey = isSelf ? 'diesel_self' : 'diesel_servito';
    } else if (descCarburante.includes('gpl')) {
      fuelKey = 'gpl';
    } else if (descCarburante.includes('metano')) {
      fuelKey = 'metano';
    }

    if (fuelKey) {
      // Se c'è già un prezzo, teniamo il più recente o più basso valido
      if (!st.prices[fuelKey] || prezzo < st.prices[fuelKey].prezzo) {
        st.prices[fuelKey] = {
          prezzo: Number(prezzo.toFixed(3)),
          isSelf,
          dt: dtComu,
        };
        totalPricesCount++;
      }
    }
  }

  console.log(`[MIMIT] Prezzi elaborati: ${totalPricesCount}`);

  // 3. Statistiche Nazionali & Raggruppamento per Provincia
  const allBenzinaSelf = [];
  const allDieselSelf = [];
  const allGpl = [];
  const allMetano = [];

  const stationsByProv = {};
  for (const provCode of Object.keys(PROVINCE_MAP)) {
    stationsByProv[provCode] = [];
  }

  const allActiveStationsWithPrices = [];

  for (const st of stations.values()) {
    const hasAnyPrice = Object.keys(st.prices).length > 0;
    if (!hasAnyPrice) continue;

    if (st.prices.benzina_self) allBenzinaSelf.push(st.prices.benzina_self.prezzo);
    if (st.prices.diesel_self) allDieselSelf.push(st.prices.diesel_self.prezzo);
    if (st.prices.gpl) allGpl.push(st.prices.gpl.prezzo);
    if (st.prices.metano) allMetano.push(st.prices.metano.prezzo);

    if (stationsByProv[st.provincia]) {
      stationsByProv[st.provincia].push(st);
    }
    allActiveStationsWithPrices.push(st);
  }

  const calcAvg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3)) : null);
  const calcMin = (arr) => (arr.length ? Math.min(...arr) : null);
  const calcMax = (arr) => (arr.length ? Math.max(...arr) : null);

  const nationalStats = {
    extractionDate: extractionDate || new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    totalStations: stations.size,
    totalActiveWithPrices: allActiveStationsWithPrices.length,
    averages: {
      benzina_self: calcAvg(allBenzinaSelf),
      diesel_self: calcAvg(allDieselSelf),
      gpl: calcAvg(allGpl),
      metano: calcAvg(allMetano),
    },
    min: {
      benzina_self: calcMin(allBenzinaSelf),
      diesel_self: calcMin(allDieselSelf),
      gpl: calcMin(allGpl),
      metano: calcMin(allMetano),
    },
    max: {
      benzina_self: calcMax(allBenzinaSelf),
      diesel_self: calcMax(allDieselSelf),
      gpl: calcMax(allGpl),
      metano: calcMax(allMetano),
    },
  };

  writeFileSync(
    path.join(ROOT, 'src', 'data', 'national-stats.json'),
    JSON.stringify(nationalStats, null, 2),
    'utf8'
  );

  console.log('[MIMIT] Statistiche Nazionali calcolate:', nationalStats.averages);

  // 4. Generazione Dati per Ciascuna Provincia
  const provincesSummary = [];

  for (const [code, info] of Object.entries(PROVINCE_MAP)) {
    const provStations = stationsByProv[code] || [];

    const bSelf = provStations.map((s) => s.prices.benzina_self?.prezzo).filter(Boolean);
    const dSelf = provStations.map((s) => s.prices.diesel_self?.prezzo).filter(Boolean);

    // Ordina per benzina più economica
    const sortedByBenzina = [...provStations]
      .filter((s) => s.prices.benzina_self)
      .sort((a, b) => a.prices.benzina_self.prezzo - b.prices.benzina_self.prezzo);

    const sortedByDiesel = [...provStations]
      .filter((s) => s.prices.diesel_self)
      .sort((a, b) => a.prices.diesel_self.prezzo - b.prices.diesel_self.prezzo);

    const cheapestBenzina = sortedByBenzina[0] || null;
    const cheapestDiesel = sortedByDiesel[0] || null;

    const validLats = provStations.map((s) => s.lat).filter(Boolean);
    const validLngs = provStations.map((s) => s.lng).filter(Boolean);
    const centerLat = validLats.length ? Number((validLats.reduce((a, b) => a + b, 0) / validLats.length).toFixed(4)) : null;
    const centerLng = validLngs.length ? Number((validLngs.reduce((a, b) => a + b, 0) / validLngs.length).toFixed(4)) : null;

    provincesSummary.push({
      code,
      name: info.name,
      region: info.region,
      slug: info.slug,
      lat: centerLat,
      lng: centerLng,
      stationsCount: provStations.length,
      avgBenzina: calcAvg(bSelf),
      avgDiesel: calcAvg(dSelf),
      minBenzina: calcMin(bSelf),
      minDiesel: calcMin(dSelf),
      cheapestBenzina: cheapestBenzina
        ? {
            nome: cheapestBenzina.nome,
            brand: cheapestBenzina.brand,
            comune: cheapestBenzina.comune,
            prezzo: cheapestBenzina.prices.benzina_self.prezzo,
          }
        : null,
      cheapestDiesel: cheapestDiesel
        ? {
            nome: cheapestDiesel.nome,
            brand: cheapestDiesel.brand,
            comune: cheapestDiesel.comune,
            prezzo: cheapestDiesel.prices.diesel_self.prezzo,
          }
        : null,
    });

    // Salva file JSON provinciale leggero in public/data/provinces/[code].json
    // Contiene i distributori della provincia con coordinate e prezzi
    const provPayload = {
      code,
      name: info.name,
      region: info.region,
      slug: info.slug,
      lastUpdated: nationalStats.lastUpdated,
      stations: provStations.map((s) => ({
        id: s.id,
        nome: s.nome,
        brand: s.brand,
        tipo: s.tipo,
        indirizzo: s.indirizzo,
        comune: s.comune,
        lat: s.lat,
        lng: s.lng,
        prices: s.prices,
      })),
    };

    writeFileSync(
      path.join(ROOT, 'public', 'data', 'provinces', `${code.toLowerCase()}.json`),
      JSON.stringify(provPayload),
      'utf8'
    );
  }

  // Ordina province per nome
  provincesSummary.sort((a, b) => a.name.localeCompare(b.name, 'it'));

  writeFileSync(
    path.join(ROOT, 'src', 'data', 'provinces-summary.json'),
    JSON.stringify(provincesSummary, null, 2),
    'utf8'
  );

  // 5. Top 50 più economici in tutta Italia
  const topBenzinaItaly = [...allActiveStationsWithPrices]
    .filter((s) => s.prices.benzina_self)
    .sort((a, b) => a.prices.benzina_self.prezzo - b.prices.benzina_self.prezzo)
    .slice(0, 30);

  const topDieselItaly = [...allActiveStationsWithPrices]
    .filter((s) => s.prices.diesel_self)
    .sort((a, b) => a.prices.diesel_self.prezzo - b.prices.diesel_self.prezzo)
    .slice(0, 30);

  const pompeBiancheItaly = [...allActiveStationsWithPrices]
    .filter((s) => s.brand === 'Pompa Bianca' && s.prices.benzina_self)
    .sort((a, b) => a.prices.benzina_self.prezzo - b.prices.benzina_self.prezzo)
    .slice(0, 30);

  writeFileSync(
    path.join(ROOT, 'src', 'data', 'cheapest-italy.json'),
    JSON.stringify({
      topBenzina: topBenzinaItaly,
      topDiesel: topDieselItaly,
      pompeBianche: pompeBiancheItaly,
    }, null, 2),
    'utf8'
  );

  // Calcola i più cari d'Italia (Hall of Fame del Salasso)
  const expensiveBenzina = [...allActiveStationsWithPrices]
    .map(s => {
      const p = s.prices.benzina_servito?.prezzo || s.prices.benzina_self?.prezzo;
      const serv = s.prices.benzina_servito?.prezzo ? 'servito' : 'self';
      return p && p < 3.5 ? { ...s, prezzo: p, service: serv, fuel: 'Benzina', fullTankCost: Number((p * 50).toFixed(2)) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.prezzo - a.prezzo)
    .slice(0, 10);

  const expensiveDiesel = [...allActiveStationsWithPrices]
    .map(s => {
      const p = s.prices.diesel_servito?.prezzo || s.prices.diesel_self?.prezzo;
      const serv = s.prices.diesel_servito?.prezzo ? 'servito' : 'self';
      return p && p < 3.5 ? { ...s, prezzo: p, service: serv, fuel: 'Diesel', fullTankCost: Number((p * 50).toFixed(2)) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.prezzo - a.prezzo)
    .slice(0, 10);

  writeFileSync(
    path.join(ROOT, 'src', 'data', 'most-expensive-italy.json'),
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      topExpensiveBenzina: expensiveBenzina,
      topExpensiveDiesel: expensiveDiesel,
    }, null, 2),
    'utf8'
  );

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`[MIMIT] Elaborazione completata in ${durationSec}s!`);
}

main().catch((err) => {
  console.warn('[MIMIT] Download fallito o timeout:', err.message);
  if (existsSync(path.join(ROOT, 'src', 'data', 'national-stats.json'))) {
    console.log('[MIMIT] Utilizzo snapshot dati esistente e procedo con la build.');
    process.exit(0);
  } else {
    console.error('[MIMIT] Errore critico: nessun dato precedente disponibile.');
    process.exit(1);
  }
});
