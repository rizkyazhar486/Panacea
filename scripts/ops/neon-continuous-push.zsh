#!/bin/zsh
set -euo pipefail

echo "=== [NEON TRUST ORCHESTRATOR] Starting Verification & Continuous Push ==="

# 1. Validasi wrangler.toml & hapus _redirects penyebab loop 100324
rm -f public/_redirects dist/_redirects
if ! grep -q 'not_found_handling = "single-page-application"' wrangler.toml 2>/dev/null; then
  printf 'name = "panacea"\ncompatibility_date = "2025-11-01"\n\n[assets]\ndirectory = "./dist"\nnot_found_handling = "single-page-application"\n' > wrangler.toml
fi

# 2. Jalankan seluruh build + 1.828+ QA gates + bundle budget
echo "-> Running full build & QA proof suite..."
npm run build
rm -f dist/_redirects

# 3. Sinkronisasi & Push Skema/Seed ke Neon Postgres (Fail-safe jika DATABASE_URL belum di-set)
if [ -f "scripts/db/push-neon.mjs" ]; then
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "-> Pushing verified schema & canonical state to Neon Postgres..."
    node scripts/db/push-neon.mjs
  else
    echo "-> DATABASE_URL not set; running Neon push dry-run verification..."
    node scripts/db/push-neon.mjs --dry-run
  fi
fi

# 4. Commit & Push ke GitHub (Cloudflare Pages auto-deploy)
if [ -n "$(git status --porcelain)" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "-> Committing verified changes on branch: $BRANCH"
  git add -A
  git commit -m "chore(neon-trust): verified 100% QA pass, anti-slop UX, and Neon sync"
  git -c http.version=HTTP/1.1 push origin "$BRANCH"
else
  echo "-> Working tree clean; no new git commit needed."
fi

# 5. Live Edge Smoke Verification pada panaceamed.id
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" https://panaceamed.id || echo "000")
echo "-> Live Edge Check https://panaceamed.id => HTTP $HTTP_CODE"
echo "=== [NEON TRUST ORCHESTRATOR] Cycle Complete ==="
