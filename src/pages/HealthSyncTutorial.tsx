import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import {
  IconHeart, IconActivity, IconDownload, IconKey, IconShield, IconCheck,
  IconTimer, IconGauge, IconChevronRight,
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Public-facing, step-by-step guide for connecting Apple Watch / Apple Health
// to Panaceamed. Apple doesn't let any website read HealthKit directly, so
// this walks users through the "Health Auto Export" app + webhook bridge that
// /health-data exposes. Written so any user (not just the account owner) can
// follow it end to end without prior context.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    icon: <IconDownload size={22} />,
    title: '1. Unduh aplikasi "Health Auto Export"',
    body: 'Buka App Store di iPhone yang terpasang dengan Apple Watch Anda, cari "Health Auto Export - JSON+CSV" (oleh HealthyApps), lalu unduh. Aplikasi berbayar sekali beli — tidak ada langganan.',
  },
  {
    icon: <IconKey size={22} />,
    title: '2. Salin Tautan Sinkron Pribadi Anda',
    body: 'Kembali ke Panaceamed, buka Data Kesehatan → kartu "Sinkron Otomatis dari Apple Watch" → tekan Salin pada Tautan Sinkron Pribadi. Tautan ini unik untuk akun Anda — jangan dibagikan ke orang lain.',
  },
  {
    icon: <IconActivity size={22} />,
    title: '3. Buat automation REST API',
    body: 'Di aplikasi Health Auto Export: buka tab Automations → tekan "+" → pilih jenis REST API. Beri nama bebas, misalnya "Panaceamed".',
  },
  {
    icon: <IconGauge size={22} />,
    title: '4. Tempel tautan & pilih format JSON',
    body: 'Tempel Tautan Sinkron Pribadi dari langkah 2 ke kolom URL. Pastikan format ekspor diset ke JSON (bukan CSV) — server Panaceamed hanya membaca format ini.',
  },
  {
    icon: <IconHeart size={22} />,
    title: '5. Pilih metrik yang disinkron',
    body: 'Centang: VO2 Max, Resting Heart Rate, Heart Rate Variability, Sleep Analysis, Weight Body Mass, Body Fat Percentage. Metrik lain boleh dicentang juga, tapi hanya enam ini yang dibaca Panaceamed saat ini.',
  },
  {
    icon: <IconTimer size={22} />,
    title: '6. Aktifkan jadwal otomatis',
    body: 'Nyalakan "Automatically Export" dan atur jadwal (disarankan: setiap pagi). Health Auto Export akan mengirim data terbaru ke Panaceamed tanpa Anda buka aplikasi apa pun.',
  },
  {
    icon: <IconCheck size={22} />,
    title: '7. Uji coba sekali secara manual',
    body: 'Tekan tombol "Export" di aplikasi untuk mengirim data pertama kali. Buka kembali Data Kesehatan di Panaceamed — VO2max, HRV, dan HR istirahat Anda akan terisi otomatis dalam beberapa detik.',
  },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Kenapa tidak bisa langsung tanpa aplikasi tambahan?',
    a: 'Apple sengaja membatasi HealthKit (data Apple Health) hanya bisa dibaca oleh aplikasi native di perangkat itu sendiri — bukan oleh website/browser mana pun, termasuk Panaceamed. Health Auto Export bertindak sebagai jembatan resmi yang sudah banyak dipakai untuk kasus seperti ini.',
  },
  {
    q: 'Apakah aman membagikan Tautan Sinkron Pribadi ke aplikasi itu?',
    a: 'Ya — tautan hanya dipakai satu arah (Health Auto Export → server Panaceamed) dan hanya bisa menulis data ke akun Anda sendiri, tidak bisa membaca data lain. Tetap jangan sebarkan tautan itu ke orang lain; jika bocor, buat ulang lewat tombol "Buat ulang tautan" di halaman Data Kesehatan.',
  },
  {
    q: 'Datanya lewat mana? Apakah Panaceamed menyimpan file mentah saya?',
    a: 'Tidak. Server hanya mengekstrak enam angka (VO2max, HR istirahat, HRV, tidur, berat, lemak tubuh) dari kiriman aplikasi, lalu membuang sisanya. Tidak ada file HealthKit mentah yang disimpan.',
  },
  {
    q: 'Bisa pakai Android / Garmin / Samsung Health?',
    a: 'Untuk saat ini jalur otomatis ini khusus Apple Health (iPhone + Apple Watch). Untuk perangkat lain, gunakan impor manual file export atau isi datanya langsung di formulir — keduanya ada di halaman Data Kesehatan.',
  },
  {
    q: 'Kenapa data saya tidak muncul setelah setup?',
    a: 'Periksa: (1) format ekspor di aplikasi harus JSON bukan CSV, (2) tautan tertempel lengkap tanpa terpotong, (3) minimal satu metrik yang didukung sudah dicentang, (4) coba tekan Export manual sekali untuk memicu pengiriman pertama.',
  },
]

export function HealthSyncTutorial() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!backendEnabled) return
    api.getHealthWebhookToken()
      .then((token) => setUrl(`${(import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') || ''}/api/health-webhook/${token}`))
      .catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Sambungkan Apple Watch ke Panaceamed"
          subtitle="Panduan lengkap — bisa diikuti siapa saja" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          Website tidak bisa membaca Apple Health secara langsung — ini batasan resmi dari Apple, bukan keterbatasan Panaceamed. Solusinya: aplikasi jembatan gratis-fitur-utama bernama <b>Health Auto Export</b> yang mengirim data HealthKit Anda ke server Panaceamed secara terjadwal. Ikuti 7 langkah di bawah — sekali setup, selanjutnya berjalan otomatis.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="brand">Sekali setup</Badge>
          <Badge tone="normal">±5 menit</Badge>
          <Badge tone="neutral">Butuh iPhone + Apple Watch</Badge>
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-dark">
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-ink">{s.title}</div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Live link preview, if logged in with backend enabled */}
      {backendEnabled && (
        <Card className="!p-5">
          <SectionTitle icon={<IconKey size={20} />} title="Tautan Sinkron Pribadi Anda" subtitle="Untuk langkah 2 — salin ke aplikasi" />
          <div className="mt-2 rounded-xl bg-neutral-50 p-3 font-mono text-[11px] text-neutral-600 break-all">
            {url ?? 'Memuat…'}
          </div>
          <Link to="/health-data">
            <Button className="mt-3 w-full">Buka Halaman Data Kesehatan <IconChevronRight size={16} /></Button>
          </Link>
        </Card>
      )}

      {/* Privacy note */}
      <Card className="!p-5 !bg-brand-50/60 !border-brand/20">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <IconShield size={18} />
          </div>
          <p className="text-[12px] leading-relaxed text-brand-dark">
            <b>Privasi:</b> tautan sinkron Anda unik dan hanya bisa <i>menulis</i> data ke akun Anda sendiri — tidak bisa dipakai membaca data siapa pun. Server hanya menyimpan enam angka ringkasan, bukan riwayat HealthKit mentah. Bocor tautan? Buat ulang kapan saja di halaman Data Kesehatan.
          </p>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Pertanyaan Umum" subtitle="Troubleshooting cepat" />
        <div className="mt-2 divide-y divide-neutral-100">
          {FAQ.map((f, i) => (
            <details key={i} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {f.q}
                  <IconChevronRight size={16} className="shrink-0 text-neutral-400 transition group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <Link to="/health-data" className="text-xs font-semibold text-brand-dark hover:underline">
          ← Kembali ke Data Kesehatan
        </Link>
      </div>
    </div>
  )
}

export default HealthSyncTutorial
