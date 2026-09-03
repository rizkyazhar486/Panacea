import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { deretMetrik } from '../lib/riwayatVitals'
import {
  ambilSuplemen, tambahSuplemen, hapusSuplemen, sudahDiminum, alihkanMinum,
  ambilSesiSuhu, catatSesiSuhu, hariSejak, tanggalHariIni,
} from '../lib/kebiasaanHarian'

// ─────────────────────────────────────────────────────────────────────────────
// Delapan widget harian dari data yang sudah dicatat aplikasi ini, ditambah dua
// catatan baru (suplemen dan sesi panas/dingin) yang sengaja dibuat NETRAL:
// mencatat apa yang sudah diputuskan pemakainya, tanpa menganjurkan apa pun.
//
// Aturan yang sama seperti berkas ubin lain: menggambar diri hanya bila
// datanya ada, membandingkan dengan kebiasaan sendiri, dan menyebut asal
// angkanya.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

function Kepala({ judul, ke, kanan }: { judul: string; ke?: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? (ke ? <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link> : null)}
    </div>
  )
}

function median(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const t = Math.floor(s.length / 2)
  return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2
}

function kunciHari(n: number): string {
  const d = new Date(Date.now() - n * HARI)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── Tenaga yang dirasakan ──────────────────────────────────────────────────
//
// Nilai yang DILAPORKAN SENDIRI, dan sengaja tidak pernah dicampur ke model
// beban latihan mana pun: mencampur yang dirasakan dengan yang terukur membuat
// angka model tampak lebih pasti daripada yang sebenarnya. Justru ketika
// keduanya berselisih — merasa lelah padahal HRV baik — perselisihannya itulah
// keterangannya.
export function UbinTenaga() {
  const { state, logWellness } = useStore()
  const hariIni = tanggalHariIni()

  const deret = useMemo(() => {
    const out: number[] = []
    for (let i = 13; i >= 0; i--) {
      const w = (state.wellness ?? {})[kunciHari(i)]
      out.push(typeof w?.tenaga === 'number' ? w.tenaga : 0)
    }
    return out
  }, [state.wellness])

  const kini = (state.wellness ?? {})[hariIni]?.tenaga ?? 0
  const terisi = deret.filter((x) => x > 0)
  const biasa = median(terisi)
  const LABEL = ['Empty', 'Low', 'Normal', 'Fresh', 'Full']

  return (
    <section>
      <Kepala judul="Energy today" ke="/harian" />
      <div className="kaca rounded-3xl p-3">
        <div className="grid grid-cols-5 gap-1">
          {LABEL.map((l, i) => (
            <button
              key={l}
              onClick={() => logWellness(hariIni, { tenaga: i + 1 })}
              className={`t-mikro min-h-[40px] rounded-xl font-black transition ${
                kini === i + 1 ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {terisi.length >= 3 && (
          <>
            <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
              {deret.map((v, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-sm ${v === 0 ? 'bg-neutral-300 dark:bg-white/15' : v >= 4 ? 'bg-brand' : v === 3 ? 'bg-sky-400' : 'bg-amber-400'}`}
                  style={{ height: v === 0 ? '3px' : `${(v / 5) * 100}%` }}
                />
              ))}
            </span>
            <p className="t-mikro mt-1.5 text-neutral-400">
              14 hari · kebiasaan Anda {biasa.toFixed(1)} dari 5 · dilaporkan sendiri, tidak dipakai model mana pun
            </p>
          </>
        )}
      </div>
    </section>
  )
}

// ── Hidrasi ────────────────────────────────────────────────────────────────
export function UbinHidrasi() {
  const { state, logWellness } = useStore()
  const hariIni = tanggalHariIni()
  const ml = (state.wellness ?? {})[hariIni]?.waterMl ?? 0

  const biasa = useMemo(() => {
    const nilai: number[] = []
    for (let i = 1; i <= 14; i++) {
      const v = (state.wellness ?? {})[kunciHari(i)]?.waterMl
      if (typeof v === 'number' && v > 0) nilai.push(v)
    }
    return median(nilai)
  }, [state.wellness])

  const tambah = (n: number) => logWellness(hariIni, { waterMl: Math.max(0, ml + n) })

  return (
    <section>
      <Kepala
        judul="Fluids today"
        kanan={
          <span className="flex items-center gap-1">
            {[250, 500].map((n) => (
              <button key={n} onClick={() => tambah(n)} className="t-mikro min-h-[40px] rounded-lg bg-brand px-2 font-black text-white">
                +{n}
              </button>
            ))}
            {ml > 0 && (
              <button onClick={() => tambah(-250)} aria-label="Subtract 250 mL" className="t-mikro min-h-[40px] px-1 font-black text-neutral-400">−</button>
            )}
          </span>
        }
      />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{(ml / 1000).toFixed(1)}</span>
          <span className="t-mikro font-bold text-neutral-400">liter</span>
          {biasa > 0 && <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">usually {(biasa / 1000).toFixed(1)} L</span>}
        </div>
        <span className="mt-2 block h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
          <span className="block h-full rounded-full bg-sky-400" style={{ width: `${Math.min(100, (ml / Math.max(2000, biasa)) * 100)}%` }} />
        </span>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          There is no single correct amount for everyone: needs shift with temperature, sweat, and food. What is compared here is your own usual intake.</p>
      </div>
    </section>
  )
}

// ── Cahaya pagi ────────────────────────────────────────────────────────────
export function UbinCahaya() {
  const { state, logWellness } = useStore()
  const hariIni = tanggalHariIni()
  const w = (state.wellness ?? {})[hariIni]
  const sudah = Boolean(w?.sunDone)

  const rangkaian = useMemo(() => {
    let n = 0
    for (let i = sudah ? 0 : 1; i < 60; i++) {
      if (!(state.wellness ?? {})[kunciHari(i)]?.sunDone) break
      n += 1
    }
    return n
  }, [state.wellness, sudah])

  // Menit cahaya dari perangkat bila ada — Apple mencatat "waktu di luar".
  const menitPerangkat = typeof getVitals().daylightMin === 'number' ? (getVitals().daylightMin as number) : null

  return (
    <section>
      <Kepala
        judul="Morning light"
        kanan={
          <button
            onClick={() => logWellness(hariIni, { sunDone: !sudah })}
            className={`t-kecil flex min-h-[40px] items-center font-bold ${sudah ? 'text-neutral-500' : 'text-brand'}`}
          >
            {sudah ? 'Undo' : 'Done ✓'}
          </button>
        }
      />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{rangkaian}</span>
          <span className="t-mikro font-bold text-neutral-400">days in a row</span>
          {menitPerangkat != null && (
            <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">{Math.round(menitPerangkat)} min outside (device)</span>
          )}
        </div>
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Bright morning light is the strongest time cue for the body clock. What is logged here is your own decision, not a light measurement.</p>
      </div>
    </section>
  )
}

// ── Tangga ─────────────────────────────────────────────────────────────────
export function UbinTangga() {
  const kini = typeof getVitals().flightsClimbed === 'number' ? (getVitals().flightsClimbed as number) : 0
  const deret = useMemo(() => deretMetrik('flightsClimbed').slice(-14).map((t) => t.nilai), [])
  if (!(kini > 0) && deret.length < 3) return null
  const biasa = median(deret)
  const maks = Math.max(...deret, kini, 1)

  return (
    <section>
      <Kepala judul="Floors climbed" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(kini)}</span>
          <span className="t-mikro font-bold text-neutral-400">floors today</span>
          {biasa > 0 && <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">usually {Math.round(biasa)}</span>}
        </div>
        {deret.length >= 3 && (
          <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
            {deret.map((v, i) => (
              <span key={i} className="flex-1 rounded-sm bg-teal-400" style={{ height: `${Math.max(6, (v / maks) * 100)}%` }} />
            ))}
          </span>
        )}
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Climbing stairs loads the legs and hips while raising the heart rate — two things that walking on the flat does not deliver together.</p>
      </div>
    </section>
  )
}

// ── VO2max ─────────────────────────────────────────────────────────────────
export function UbinVo2Tren() {
  const { state } = useStore()
  const daftar = useMemo(() => {
    const dariLog = (state.vo2maxLog ?? [])
      .filter((e) => e?.at && typeof e.value === 'number' && e.value > 0)
      .map((e) => ({ t: Date.parse(e.at), v: e.value, cara: e.method }))
    const dariPerangkat = deretMetrik('vo2max').map((x) => ({ t: Date.parse(x.tanggal), v: x.nilai, cara: 'Device' }))
    return [...dariLog, ...dariPerangkat].filter((x) => Number.isFinite(x.t)).sort((a, b) => a.t - b.t).slice(-12)
  }, [state.vo2maxLog])

  if (daftar.length < 2) return null
  const akhir = daftar[daftar.length - 1]
  const awal = daftar[0]
  const selisih = akhir.v - awal.v
  const min = Math.min(...daftar.map((d) => d.v))
  const maks = Math.max(...daftar.map((d) => d.v))
  const y = (v: number) => 34 - ((v - min) / Math.max(1, maks - min)) * 30
  const titik = daftar.map((d, i) => `${(i / (daftar.length - 1)) * 100},${y(d.v).toFixed(2)}`).join(' ')

  return (
    <section>
      <Kepala judul="VO₂max" ke="/longevity" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{akhir.v.toFixed(1)}</span>
          <span className="t-mikro font-bold text-neutral-400">mL/kg/mnt</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
            {selisih >= 0 ? '+' : '−'}{Math.abs(selisih).toFixed(1)} since the first reading
          </span>
        </div>
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-2 h-11 w-full" role="img" aria-label={`${daftar.length} VO2max readings`}>
          <polyline points={titik} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="text-brand" />
        </svg>
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          Last measured by: {akhir.cara ?? 'not logged'}. Watch estimates and field tests are not always comparable — what matters is the direction, not one reading's difference.
        </p>
      </div>
    </section>
  )
}

// ── Komposisi tubuh ────────────────────────────────────────────────────────
export function UbinKomposisi() {
  const v = getVitals()
  const berat = typeof v.weightKg === 'number' ? v.weightKg : 0
  const lemak = typeof v.bodyFatPct === 'number' ? v.bodyFatPct : 0
  const otot = typeof v.skeletalMuscleKg === 'number' ? v.skeletalMuscleKg : (typeof v.leanMassKg === 'number' ? v.leanMassKg : 0)

  const deretBerat = useMemo(() => deretMetrik('weightKg').slice(-30).map((t) => t.nilai), [])
  if (!(berat > 0)) return null

  const massaLemak = lemak > 0 ? (berat * lemak) / 100 : 0
  const sisa = berat - massaLemak

  return (
    <section>
      <Kepala judul="Body composition" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{berat.toFixed(1)}</span>
          <span className="t-mikro font-bold text-neutral-400">kg</span>
          {deretBerat.length >= 5 && (
            <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
              {(berat - deretBerat[0] >= 0 ? '+' : '−')}{Math.abs(berat - deretBerat[0]).toFixed(1)} kg over {deretBerat.length} readings
            </span>
          )}
        </div>

        {massaLemak > 0 && (
          <>
            <span className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
              <span className="h-full bg-amber-400" style={{ width: `${(massaLemak / berat) * 100}%` }} />
              <span className="h-full bg-brand" style={{ width: `${(sisa / berat) * 100}%` }} />
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="t-mikro text-neutral-500">Fat <b className="text-ink dark:text-white">{massaLemak.toFixed(1)} kg</b> ({lemak.toFixed(1)}%)</span>
              <span className="t-mikro text-neutral-500">
                {otot > 0 ? <>Skeletal muscle <b className="text-ink dark:text-white">{otot.toFixed(1)} kg</b></> : <>Remainder <b className="text-ink dark:text-white">{sisa.toFixed(1)} kg</b></>}
              </span>
            </div>
          </>
        )}
        <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
          Bioimpedance scales estimate fat from electrical resistance, and the estimate moves with body water — measure under the same conditions each time.</p>
      </div>
    </section>
  )
}

// ── Suplemen ───────────────────────────────────────────────────────────────
export function UbinSuplemen() {
  const [versi, setVersi] = useState(0)
  const [buka, setBuka] = useState(false)
  const [nama, setNama] = useState('')
  const [waktu, setWaktu] = useState<'pagi' | 'siang' | 'malam'>('pagi')

  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:suplemen', on)
    return () => window.removeEventListener('panacea:suplemen', on)
  }, [])

  const daftar = useMemo(ambilSuplemen, [versi])
  const diminum = useMemo(sudahDiminum, [versi])

  return (
    <section>
      <Kepala
        judul="Supplements today"
        kanan={
          <button onClick={() => setBuka((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            {buka ? 'Close' : '+ Add'}
          </button>
        }
      />
      <div className="kaca rounded-3xl p-3">
        {buka && (
          <div className="mb-2 flex gap-1.5 border-b border-neutral-100 pb-2 dark:border-white/10">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Supplement name"
              aria-label="Supplement name"
              className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white"
            />
            <select
              value={waktu}
              onChange={(e) => setWaktu(e.target.value as 'pagi' | 'siang' | 'malam')}
              aria-label="Time to take"
              className="t-kecil shrink-0 rounded-xl border border-neutral-200 bg-transparent px-1.5 text-ink dark:border-white/12 dark:text-white"
            >
              <option value="pagi">Morning</option>
              <option value="siang">Afternoon</option>
              <option value="malam">Evening</option>
            </select>
            <button
              onClick={() => { tambahSuplemen(nama, waktu); setNama(''); setBuka(false) }}
              className="t-kecil shrink-0 rounded-xl bg-brand px-3 font-bold text-white"
            >
              Save
            </button>
          </div>
        )}

        {!daftar.length ? (
          <p className="t-kecil text-neutral-500">
            No list yet. This app recommends no supplement at all — it only remembers what you have already decided for yourself.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {daftar.map((s) => {
                const sudah = diminum.includes(s.id)
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <button
                      onClick={() => { alihkanMinum(s.id); setVersi((v) => v + 1) }}
                      className={`t-kecil flex min-h-[40px] flex-1 items-center gap-2 rounded-xl px-2 text-left font-bold transition ${
                        sudah ? 'bg-brand/10 text-brand-dark dark:text-brand' : 'text-ink dark:text-white'
                      }`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${sudah ? 'border-brand bg-brand text-white' : 'border-neutral-300 dark:border-white/25'}`}>
                        {sudah ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{s.nama}</span>
                      <span className="t-mikro shrink-0 text-neutral-400">{s.waktu}</span>
                    </button>
                    <button
                      onClick={() => { hapusSuplemen(s.id); setVersi((v) => v + 1) }}
                      aria-label={`Hapus ${s.nama}`}
                      className="t-mikro shrink-0 px-1 font-black text-neutral-400"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="t-mikro mt-2 leading-snug text-neutral-400">
              {diminum.length} of {daftar.length} marked today. The list and its doses are between you and your doctor; this app only remembers them.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

// ── Panas & dingin ─────────────────────────────────────────────────────────
export function UbinSuhuEkstrem() {
  const [versi, setVersi] = useState(0)
  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:suhu-sesi', on)
    return () => window.removeEventListener('panacea:suhu-sesi', on)
  }, [])

  const { panas, dingin, pekanIni } = useMemo(() => {
    const semua = ambilSesiSuhu()
    const batas = Date.now() - 7 * HARI
    return {
      panas: hariSejak('panas'),
      dingin: hariSejak('dingin'),
      pekanIni: semua.filter((s) => Date.parse(`${s.tanggal}T00:00:00`) >= batas).length,
    }
  }, [versi])

  return (
    <section>
      <Kepala
        judul="Heat & cold"
        kanan={
          <span className="flex items-center gap-1">
            <button onClick={() => { catatSesiSuhu('panas', 15); setVersi((v) => v + 1) }} className="t-mikro min-h-[40px] rounded-lg bg-orange-500 px-2 font-black text-white">+ Sauna</button>
            <button onClick={() => { catatSesiSuhu('dingin', 3); setVersi((v) => v + 1) }} className="t-mikro min-h-[40px] rounded-lg bg-sky-500 px-2 font-black text-white">+ Cold</button>
          </span>
        }
      />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-3">
          <span className="min-w-0">
            <span className="t-mikro block text-neutral-400">Last sauna</span>
            <span className="text-[20px] font-black leading-none tabular-nums text-ink dark:text-white">
              {panas == null ? '—' : panas === 0 ? 'today' : `${panas} d`}
            </span>
          </span>
          <span className="min-w-0">
            <span className="t-mikro block text-neutral-400">Last cold</span>
            <span className="text-[20px] font-black leading-none tabular-nums text-ink dark:text-white">
              {dingin == null ? '—' : dingin === 0 ? 'today' : `${dingin} d`}
            </span>
          </span>
          <span className="t-mikro ml-auto shrink-0 text-neutral-400">{pekanIni} sessions this week</span>
        </div>
        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Logged as an activity, not as therapy: the strongest human evidence for sauna use is observational, not large randomised trials.</p>
      </div>
    </section>
  )
}
