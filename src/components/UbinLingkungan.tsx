import { useEffect, useMemo, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { muatSetelan } from '../lib/adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Udara dan sinar ultraviolet di kota pemakainya.
//
// KOTANYA DIAMBIL DARI YANG SUDAH DIPILIH SENDIRI di halaman Adzan, bukan dari
// GPS. Sama seperti keputusan yang sudah berlaku di seluruh aplikasi: fitur
// yang menyimpan koordinat presisi menciptakan bahaya yang tidak sepadan dengan
// manfaatnya, dan untuk pertanyaan "apakah udara di kota saya buruk hari ini"
// pusat kota sudah cukup.
//
// AMBANGNYA MILIK LEMBAGA, BUKAN MILIK APLIKASI INI:
//   · European AQI (Open-Meteo): ≤20 baik, ≤40 lumayan, ≤60 sedang, ≤80 buruk,
//     ≤100 sangat buruk, di atas itu amat sangat buruk.
//   · Indeks UV (WHO): 1-2 rendah, 3-5 sedang, 6-7 tinggi, 8-10 sangat tinggi,
//     11+ ekstrem. Perlindungan dianjurkan mulai indeks 3.
// Keduanya disebut namanya supaya dapat diperiksa, dan tidak diterjemahkan
// menjadi "skor kesehatan" apa pun.
// ─────────────────────────────────────────────────────────────────────────────

interface Data {
  kota: string
  aqi?: number
  pm25?: number
  pm10?: number
  uv?: number
  uvMaks?: number
  suhuC?: number
  terasaC?: number
  lembapPct?: number
  terbit?: string
  terbenam?: string
  sumber: string
  error?: string
}

/**
 * Keterangan risiko panas saat berlatih, dari suhu yang DIRASAKAN.
 *
 * Ambangnya mengikuti bentuk peringatan panas yang lazim dipakai layanan
 * cuaca (indeks panas): di bawah 27 °C tidak ada peringatan khusus, 27-32 °C
 * kelelahan panas mungkin terjadi pada aktivitas lama, 32-41 °C kram dan
 * kelelahan panas semakin mungkin, di atas itu sengatan panas menjadi
 * ancaman nyata. Yang dipakai suhu terasa, bukan suhu udara, karena pada
 * kelembapan tinggi keringat menguap lebih lambat.
 */
function risikoPanas(terasa: number): { label: string; kelas: string; saran: string } | null {
  if (terasa < 27) return null
  if (terasa < 32) return { label: 'Caution', kelas: 'bg-amber-500', saran: 'Long sessions outdoors: drink more and pick a shadier hour.' }
  if (terasa < 41) return { label: 'Extreme caution', kelas: 'bg-orange-500', saran: 'Cramps and heat exhaustion become more likely. Lower the intensity and take more drink breaks.' }
  return { label: 'Dangerous', kelas: 'bg-rose-500', saran: 'Heatstroke becomes a real threat. Move the session indoors or to the very early morning.' }
}

const TINGKAT_AQI: { batas: number; label: string; kelas: string }[] = [
  { batas: 20, label: 'Good', kelas: 'bg-emerald-500' },
  { batas: 40, label: 'Fair', kelas: 'bg-lime-500' },
  { batas: 60, label: 'Moderate', kelas: 'bg-amber-500' },
  { batas: 80, label: 'Poor', kelas: 'bg-orange-500' },
  { batas: 100, label: 'Very poor', kelas: 'bg-rose-500' },
  { batas: Infinity, label: 'Extremely poor', kelas: 'bg-purple-600' },
]

function tingkatUv(uv: number): { label: string; kelas: string; saran: string } {
  if (uv < 3) return { label: 'Low', kelas: 'bg-emerald-500', saran: 'Sunscreen is not yet needed for brief exposure.' }
  if (uv < 6) return { label: 'Moderate', kelas: 'bg-amber-500', saran: 'Seek shade around midday; use sunscreen if you are outside for long.' }
  if (uv < 8) return { label: 'High', kelas: 'bg-orange-500', saran: 'Sunscreen, a hat, and shade around midday.' }
  if (uv < 11) return { label: 'Very high', kelas: 'bg-rose-500', saran: 'Avoid the sun between 10:00 and 16:00; skin can burn within about fifteen minutes.' }
  return { label: 'Extreme', kelas: 'bg-purple-600', saran: 'Stay indoors around midday wherever possible.' }
}

export function UbinLingkungan() {
  const kota = useMemo(() => muatSetelan().kota || 'Jakarta', [])
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    void api.lingkungan(kota)
      .then((d) => { if (hidup) setData(d as Data) })
      .catch(() => { if (hidup) setData({ kota, sumber: 'Open-Meteo', error: 'gagal' }) })
    return () => { hidup = false }
  }, [kota])

  // Tanpa server tidak ada sumbernya sama sekali, dan angka udara yang dikarang
  // jauh lebih berbahaya daripada widget yang tidak digambar: orang mengatur
  // apakah anaknya boleh bermain di luar berdasarkan angka itu.
  if (!backendEnabled || !data || (data.error && data.aqi == null && data.uv == null)) return null

  const aqi = data.aqi
  const tingkat = aqi != null ? TINGKAT_AQI.find((t) => aqi <= t.batas) ?? TINGKAT_AQI[TINGKAT_AQI.length - 1] : null
  const uv = data.uv
  const u = uv != null ? tingkatUv(uv) : null

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Air & UV</h2>
        <span className="t-mikro truncate text-neutral-400">{data.kota}</span>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="flex items-stretch gap-3">
          {tingkat && (
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(aqi!)}</span>
                <span className="t-mikro font-bold text-neutral-400">AQI</span>
              </div>
              <span className={`t-mikro mt-1 inline-block rounded-full px-2 py-0.5 font-black text-white ${tingkat.kelas}`}>
                {tingkat.label}
              </span>
              {data.pm25 != null && (
                <span className="t-mikro mt-1 block tabular-nums text-neutral-400">PM2,5 {data.pm25.toFixed(1)} µg/m³</span>
              )}
            </div>
          )}

          {u && (
            <div className="min-w-0 flex-1 border-l border-neutral-100 pl-3 dark:border-white/10">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{uv!.toFixed(1)}</span>
                <span className="t-mikro font-bold text-neutral-400">UV</span>
              </div>
              <span className={`t-mikro mt-1 inline-block rounded-full px-2 py-0.5 font-black text-white ${u.kelas}`}>
                {u.label}
              </span>
              {data.uvMaks != null && (
                <span className="t-mikro mt-1 block tabular-nums text-neutral-400">Peak today {data.uvMaks.toFixed(1)}</span>
              )}
            </div>
          )}
        </div>

        {/* Cuaca latihan: suhu terasa, kelembapan, dan jendela matahari.
            Ketiganya dari permintaan yang sama, jadi tidak menambah beban
            jaringan sama sekali. */}
        {(data.terasaC != null || data.terbit) && (
          <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-white/10">
            <div className="flex items-baseline gap-2">
              {data.terasaC != null && (
                <>
                  <span className="text-[20px] font-black leading-none tabular-nums text-ink dark:text-white">{Math.round(data.terasaC)}°</span>
                  <span className="t-mikro font-bold text-neutral-400">
                    feels like{data.suhuC != null ? ` · air ${Math.round(data.suhuC)}°` : ''}{data.lembapPct != null ? ` · humidity ${Math.round(data.lembapPct)}%` : ''}
                  </span>
                </>
              )}
              {data.terbit && data.terbenam && (
                <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">
                  ☀ {data.terbit.slice(11, 16)}–{data.terbenam.slice(11, 16)}
                </span>
              )}
            </div>
            {data.terasaC != null && (() => {
              const r = risikoPanas(data.terasaC)
              return r ? (
                <p className="t-mikro mt-1 leading-snug text-neutral-500 dark:text-neutral-400">
                  <span className={`mr-1 inline-block rounded-full px-1.5 py-0.5 font-black text-white ${r.kelas}`}>{r.label}</span>
                  {r.saran}
                </p>
              ) : null
            })()}
          </div>
        )}

        {u && <p className="t-mikro mt-2 leading-snug text-neutral-500 dark:text-neutral-400">{u.saran}</p>}
        <p className="t-mikro mt-1 text-neutral-400">
          Thresholds: European AQI and the WHO UV index · source {data.sumber}, city-centre point (not your GPS)
        </p>
      </div>
    </section>
  )
}

export default UbinLingkungan
