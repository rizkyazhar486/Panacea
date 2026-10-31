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
  # Satu permintaan: kode HTTP + header x-render-routing (curl >= 7.84; versi lama mencetak teks literal dan tidak pernah cocok di bawah).
  if ! hasil=$(curl -s -o /dev/null -w '%{http_code} %header{x-render-routing}' --max-time 90 "${alamat%/}/api/health"); then
    hasil=000
  fi
  kode=${hasil%% *}
  routing=${hasil#"$kode"}; routing=${routing# }
  echo "HTTP $kode"
  # Layanan yang DISUSPEND pemiliknya tidak bisa dibangunkan oleh ping: sebut penyebabnya dan hentikan loop alih-alih mem-ping berjam-jam
  # sambil tampak "berhasil". Tetap exit 0 (kebijakan tanpa spam galat tiap 10 menit); pemeriksa produksi yang menjadi sinyal gagalnya.
  if [ "$routing" = 'suspend-by-user' ]; then
    echo '::warning::Render: layanan DISUSPEND oleh pemiliknya (x-render-routing: suspend-by-user). Ping tidak dapat membangunkannya; lanjutkan (resume) layanan di dashboard Render. Loop dihentikan.'
    break
  fi
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
