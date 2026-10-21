#!/bin/bash
# rebuild-and-deploy-vps.sh — PrezzoBenza.it
# Eseguito ogni notte via crontab sul server Contabo VPS
set -euo pipefail

LOG="/var/log/prezzobenza-rebuild.log"
APP_DIR="/var/www/prezzobenza.it"
CF_PROJECT="prezzobenza"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
if [ -d "${HOME:-/root}/.nvm" ]; then
  export NVM_DIR="${HOME:-/root}/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

log "============================================================"
log "Starting PrezzoBenza.it Daily MIMIT Ingestion & Deploy..."

cd "$APP_DIR"

# 1. Aggiorna codice da GitHub
if [ -d .git ]; then
  log "Fetching latest code from GitHub..."
  git fetch origin main
  git reset --hard origin/main
fi

# 2. Installa dipendenze se necessario
if [ ! -d "node_modules" ]; then
  log "Installing npm dependencies..."
  npm install --legacy-peer-deps 2>&1 | tee -a "$LOG"
fi

# 3. Scarica ed elabora Open Data MIMIT ufficiali
log "Fetching latest official fuel prices from MIMIT..."
node scripts/fetch-mimit-data.js 2>&1 | tee -a "$LOG"

# 4. Build Astro SSG
log "Building Astro static site (107 programmatic provinces)..."
npm run build 2>&1 | tee -a "$LOG"

# 5. Deploy Cloudflare Pages
log "Deploying to Cloudflare Pages project=$CF_PROJECT ..."
export CLOUDFLARE_API_KEY="${CLOUDFLARE_API_KEY:-9578b8b72ddb8947067606c42533c784203b6}"
export CLOUDFLARE_EMAIL="${CLOUDFLARE_EMAIL:-romolo.velati@gmail.com}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-383050c9ba92a1ab1144bc18d44f586c}"

npx --yes wrangler@4 pages deploy dist \
  --project-name="$CF_PROJECT" \
  --branch=main \
  --commit-dirty=true 2>&1 | tee -a "$LOG"

# 6. Notifica IndexNow a Bing e Yandex
log "Pinging IndexNow for Bing..."
node scripts/notify-indexnow.js 2>&1 | tee -a "$LOG" || true

log "PrezzoBenza.it Rebuild & Deploy SUCCESS!"
log "============================================================"
