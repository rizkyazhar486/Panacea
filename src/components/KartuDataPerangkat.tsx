import { useEffect, useState } from 'react'
import { getVitals, vitalsAge, type Vitals } from '../lib/healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Kartu Data Perangkat — angka Anda sendiri, ditampilkan tanpa diisikan.
//
// Halaman kalkulator klinis dipakai untuk MENGHITUNG ORANG LAIN. Mengisi kolom
// berat, tinggi dan umur secara diam-diam dari jam tangan pemilik akun berarti
// dosis atau skor risiko seorang pasien dihitung memakai tubuh dokternya. Jadi
// di halaman itu data perangkat ditampilkan sebagai rujukan yang bisa dibaca
// dan disalin, bukan sebagai isian otomatis.
//
// Di halaman yang jelas-jelas tentang diri sendiri (Performance Lab, Recovery,
// VitaPulse, Body Composition) pengisian otomatis tetap berlaku seperti biasa.
// ─────────────────────────────────────────────────────────────────────────────

const BARIS: { kunci: keyof Vitals; label: string; satuan: string; bulat?: boolean }[] = [
  { kunci: 'weightKg', label: 'Berat', satuan: 'kg' },
  { kunci: 'heightCm', label: 'Height', satuan: 'cm', bulat: true },
  { kunci: 'restingHr', label: 'Denyut istirahat', satuan: 'bpm', bulat: true },
  { kunci: 'spo2Pct', label: 'SpO₂', satuan: '%', bulat: true },
  { kunci: 'respRate', label: 'Napas', satuan: '/mnt', bulat: true },
  { kunci: 'bodyTempC', label: 'Suhu', satuan: '°C' },
  { kunci: 'systolic', label: 'Sistolik', satuan: 'mmHg', bulat: true },
  { kunci: 'diastolic', label: 'Diastolik', satuan: 'mmHg', bulat: true },
  { kunci: 'vo2max', label: 'VO₂max', satuan: '' },
]

export function KartuDataPerangkat() {
  const [vitals, setVitals] = useState<Vitals>(getVitals)
  useEffect(() => {
    const segarkan = () => setVitals(getVitals())
    window.addEventListener('panacea:health-updated', segarkan)
    window.addEventListener('focus', segarkan)
    return () => {
      window.removeEventListener('panacea:health-updated', segarkan)
      window.removeEventListener('focus', segarkan)
    }
  }, [])

  const ada = BARIS.filter((b) => {
    const v = vitals[b.kunci]
    return typeof v === 'number' && Number.isFinite(v) && v > 0
  })
  if (!ada.length) return null

  const umur = vitalsAge(vitals)

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">⌚ Your device data</div>
        {umur && <div className="text-[10px] text-neutral-500">{umur}</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ada.map((b) => {
          const v = vitals[b.kunci] as number
          return (
            <span key={String(b.kunci)} className="rounded-lg bg-neutral-50 px-2 py-1 text-[11px] dark:bg-white/5">
              <span className="text-neutral-500">{b.label} </span>
              <b className="text-ink dark:text-white">{b.bulat ? Math.round(v) : v}</b>
              {b.satuan && <span className="text-neutral-500"> {b.satuan}</span>}
            </span>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
        Sengaja tidak diisikan otomatis ke kolom di bawah: kalkulator ini dipakai untuk menghitung
        pasien, dan angka tubuh Anda bukan angka mereka. Salin manual bila memang untuk diri sendiri.
      </p>
    </div>
  )
}

export default KartuDataPerangkat
