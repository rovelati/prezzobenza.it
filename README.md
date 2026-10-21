# PrezzoBenza.it ⛽🇮🇹

**Il pieno intelligente — Trova la benzina e il diesel più economici vicino a te.**

Piattaforma web ultra-veloce (Astro 5 + Tailwind CSS v4) per il monitoraggio in tempo reale dei prezzi carburanti in Italia basata sugli **Open Data ufficiali del Ministero delle Imprese e del Made in Italy (MIMIT)**.

---

## 🚀 Caratteristiche Principali

1. **📍 Killer Feature GEO "Vicino a Me"**:
   - Rilevamento posizione GPS a 1 click (senza app native, senza login).
   - Calcolo raggio chilometrico reale (formula Haversine) tra i distributori attivi.
   - Ordinamento dinamico per **Prezzo più basso** o **Distanza**.
   - Integrazione deep-link con **Google Maps / Apple Maps / Waze** ("Portami qui").
   - Filtro carburante: **Benzina (Verde)**, **Diesel (Gasolio)**, **GPL**, **Metano** (Self vs Servito).

2. **⚡ Performance & PWA**:
   - Build statica Astro 5: **113 pagine compilate in < 1 secondo**.
   - Bundle client compresso in appena **3 kB gzip**.
   - Lighthouse Score 100/100, Core Web Vitals perfetti.

3. **🏆 Programmatic SEO Dominance**:
   - **Tutte le 107 Province Italiane** indicizzate con landing page dedicate (`/provincia/[slug]`).
   - Hub nazionale **Pompe Bianche No-Logo** (`/pompe-bianche/`) per i distributori indipendenti.
   - **Osservatorio Prezzi Oggi** (`/prezzi-oggi/`) con medie regionali e composizione accise/IVA.
   - **Guida al Risparmio** (`/come-risparmiare/`).
   - Dati strutturati **Schema.org** completi:
     - `@type: GasStation` con coordinate `geo` e `priceRange`.
     - `@type: FAQPage` ottimizzato per i Rich Snippets Google PAA (People Also Ask).
     - `@type: BreadcrumbList`.

4. **🔄 Pipeline Automatica Dati MIMIT**:
   - `scripts/fetch-mimit-data.js` scarica ed elabora i due CSV ministeriali in **3 secondi** netti:
     - `anagrafica_impianti_attivi.csv` (~24.000 impianti)
     - `prezzo_alle_8.csv` (~75.000 prezzi)
   - Genera automaticamente file JSON provinciali leggeri (`/public/data/provinces/[code].json`) caricati on-demand dal browser solo quando necessario.

---

## 🛠️ Comandi Utili

```bash
# Scarica e aggiorna i dati ufficiali dal MIMIT
npm run fetch:data

# Avvia server di sviluppo locale
npm run dev

# Compila il sito statico pronto per il deploy
npm run build

# Invia notifica IndexNow a Bing e Yandex
node scripts/notify-indexnow.js
```
