#!/usr/bin/env bash
set -u

# Satu implementasi untuk jalur utama dan cadangan; jadwalnya tetap terpisah.
mode="${1:-once}"
case "$mode" in
  once|keepalive) ;;
  *) echo 'Usage: wake-server.sh [once|keepalive]' >&2; exit 2 ;;
esac

alamat="${SERVER_URL:-${SERVER_URL_SECRET:-${VITE_API_URL:-${VITE_API_URL_SECRET:-}}}}"
if [ -z "$alamat" ]; then
  echo 'Tidak ada VITE_API_URL maupun SERVER_URL di repositori ini; berhenti tanpa menjadi gagal.'
  exit 0
fi

# HTTP saja cukup untuk wake: URL konfigurasi dan isi respons tidak masuk log CI.
mulai=$(date +%s)
while :; do
  if ! kode=$(curl -s -o /dev/null -w '%{http_code}' --max-time 90 "${alamat%/}/api/health"); then
    kode=000
  fi
  echo "HTTP $kode"
  if [ "$kode" != '200' ]; then
    echo "::warning::Server belum menjawab 200 (kode $kode). Jalur utama/cadangan akan mencoba lagi."
  fi
  [ "$mode" = 'keepalive' ] || break
  # Batas lama: 340 menit, interval 9 menit, jam bangun 04.00–23.00 WIB.
  [ $(( $(date +%s) - mulai )) -lt $((340 * 60)) ] || break
  sleep 540
  jam=$((10#$(date -u +%H)))
  [ "$jam" -ge 21 ] || [ "$jam" -le 16 ] || break
done
