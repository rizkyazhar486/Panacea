#!/bin/bash
# Smoke langsung ke backend Render: tunggu revisi yang benar ter-deploy, lalu uji kapabilitas genomik dan batas autentikasinya.
# Dipindah apa adanya dari .github/workflows/render-live-smoke.yml agar dapat diuji; satu tambahan: layanan yang DISUSPEND
# (header x-render-routing: suspend…) gagal SEGERA dengan alasan yang benar, bukan 45 kali "Render may still be deploying".
# Tetap gagal (fail-closed): deployment memang tidak dapat diverifikasi selama layanan disuspend.
#   bash scripts/ops/render-live-smoke.sh
set -euo pipefail
expected_sha="$(git rev-parse HEAD)"
if [ -z "$expected_sha" ]; then
  echo 'No canonical checkout revision could be resolved.' >&2
  exit 1
fi
echo "Canonical checkout revision: $expected_sha"
base="${SERVER_URL:-${SERVER_URL_SECRET:-${VITE_API_URL:-${VITE_API_URL_SECRET:-}}}}"
if [ -z "$base" ]; then
  echo 'VITE_API_URL/SERVER_URL is not configured.' >&2
  exit 1
fi
endpoint="${base%/}/api/genomics/compute/capabilities"
health_endpoint="${base%/}/api/health"
echo "Waiting for live Render endpoint: $endpoint"

ok=''
for attempt in $(seq 1 45); do
  code=$(curl -sS --max-time 90 -o /tmp/capabilities.json -w '%{http_code}' "$endpoint" || true)
  # Satu permintaan health: kode HTTP + header x-render-routing (curl >= 7.84, sama dengan scripts/ops/wake-server.sh).
  health_out=$(curl -sS --max-time 90 -o /tmp/health.json -w '%{http_code} %header{x-render-routing}' "$health_endpoint" || true)
  health_code="${health_out%% *}"
  routing=''
  case "$health_out" in *' '*) routing="${health_out#* }" ;; esac
  case "$routing" in
    suspend*)
      echo "::error::Render service is suspended (x-render-routing: $routing). The deployment cannot be verified until the service is resumed or the monthly quota resets; failing without further retries." >&2
      exit 1
      ;;
  esac
  if [ "$code" = '200' ] && [ "$health_code" = '200' ]; then
    if node scripts/qa/verify-render-revision.mjs /tmp/capabilities.json /tmp/health.json "$expected_sha"
    then
      ok='yes'
      break
    fi
  fi
  echo "Attempt $attempt: capability HTTP ${code:-000}, health HTTP ${health_code:-000}; Render may still be deploying."
  sleep 10
done

if [ "$ok" != 'yes' ]; then
  echo 'Live Render genomics capability check did not converge.' >&2
  cat /tmp/capabilities.json 2>/dev/null || true
  exit 1
fi

unauth_code=$(curl -sS --max-time 30 -o /tmp/unauth.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -d '{"kind":"ont-basecalling","input":{"uri":"https://example.test/input.pod5"}}' \
  "${base%/}/api/genomics/compute/jobs")
test "$unauth_code" = '401'
grep -q '"unauthorized"' /tmp/unauth.json
echo 'Live Render genomics control plane passed capability + auth-boundary smoke tests.'
