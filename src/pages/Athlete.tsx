import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconRun, IconActivity, IconHeart, IconX } from '../components/icons'
import { ShareToFeed } from '../components/ShareToFeed'

// Motivational quotes from legendary athletes (Olympic/medal/award winners &
// globally followed icons) — shown as a welcome popup on the Athlete page.
const ATHLETE_QUOTES: { quote: string; author: string; feat: string }[] = [
  { quote: 'Kamu kalah 100% dari tembakan yang tidak kamu coba.', author: 'Michael Jordan', feat: '6× Juara NBA · Emas Olimpiade' },
  { quote: 'Saya tidak menghitung sit-up. Saya baru mulai menghitung saat mulai sakit.', author: 'Muhammad Ali', feat: 'Legenda Tinju · Emas Olimpiade 1960' },
  { quote: 'Bakat memenangkan pertandingan, tapi kerja sama & otak memenangkan kejuaraan.', author: 'Michael Jordan', feat: '14× NBA All-Star' },
  { quote: 'Tubuh saya bisa menahan apa pun. Yang harus saya yakinkan adalah pikiran saya.', author: 'Usain Bolt', feat: '8× Emas Olimpiade · Rekor Dunia 100m' },
  { quote: 'Keras kepala terhadap mimpi, fleksibel terhadap cara mencapainya.', author: 'Cristiano Ronaldo', feat: '5× Ballon d’Or · 600jt+ pengikut IG' },
  { quote: 'Saya selalu percaya: jika kamu menempatkan kerja keras, hasil akan datang.', author: 'Lionel Messi', feat: '8× Ballon d’Or · Juara Dunia 2022' },
  { quote: 'Juara terus bermain sampai mereka melakukannya dengan benar.', author: 'Serena Williams', feat: '23× Grand Slam · 4× Emas Olimpiade' },
  { quote: 'Tekanan adalah hak istimewa — ia datang pada mereka yang berhasil.', author: 'Billie Jean King', feat: '39× Grand Slam · Presidential Medal of Freedom' },
  { quote: 'Setiap orang punya batas. Yang membedakan adalah siapa yang berani melewatinya.', author: 'Eliud Kipchoge', feat: 'Maraton <2 jam · 2× Emas Olimpiade' },
  { quote: 'Emas bukan tentang medali — tapi tentang menjadi versi terbaik dirimu.', author: 'Michael Phelps', feat: '23× Emas Olimpiade (terbanyak sepanjang masa)' },
]

function AthleteQuotePopup() {
  const [q] = useState(() => ATHLETE_QUOTES[Math.floor(Math.random() * ATHLETE_QUOTES.length)])
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} aria-label="Tutup" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
        <div className="mb-3 text-4xl">🏅</div>
        <p className="text-lg font-bold leading-snug text-ink">“{q.quote}”</p>
        <div className="mt-4 text-sm font-black text-brand-dark">{q.author}</div>
        <div className="text-xs text-neutral-400">{q.feat}</div>
        <button onClick={() => setOpen(false)} className="mt-5 w-full rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Ayo Latihan! 💪
        </button>
      </div>
    </div>
  )
}

interface AthleteProfile {
  age: number; g: 'M' | 'F'; weight: number; hrRest: number; hrMax: number
  // Garmin-style indicators, entered manually from a watch/device.
  acuteLoad: number     // beban 7 hari terakhir (Training Load akut)
  chronicLoad: number   // rata-rata beban mingguan 28 hari (Training Load kronis)
  vo2Trend: 'up' | 'flat' | 'down' // tren VO₂max 4 minggu terakhir
  hrv: number           // HRV malam (ms, rMSSD/SDNN dari jam)
  hrvBaseline: number   // baseline HRV personal (ms)
  recoveryHrs: number   // Recovery Time tersisa (jam) dari jam
  ltHr: number          // Lactate Threshold heart rate (bpm)
  ltPace: string        // Lactate Threshold pace (mm:ss /km)
  teAerobic: number     // Aerobic Training Effect sesi terakhir (0–5)
  teAnaerobic: number   // Anaerobic Training Effect sesi terakhir (0–5)
  sleepScore: number    // skor tidur jam (0–100)
}

const KEY = 'pm_athlete_profile'
const def: AthleteProfile = {
  age: 24, g: 'M', weight: 70, hrRest: 55, hrMax: 0,
  acuteLoad: 0, chronicLoad: 0, vo2Trend: 'flat', hrv: 0, hrvBaseline: 0,
  recoveryHrs: 0, ltHr: 0, ltPace: '', teAerobic: 0, teAnaerobic: 0, sleepScore: 0,
}
function load(): AthleteProfile {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return d.age ? { ...def, ...d } : def } catch { return def }
}
function save(p: AthleteProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

// Jackson non-exercise VO2max (uses resting HR) — same formula used in HealthTrends.
function vo2max(age: number, g: 'M' | 'F', hrRest: number) {
  return g === 'M' ? (15.3 * (220 - age)) / hrRest : (15.3 * (226 - age)) / hrRest
}

const ZONES = [
  { z: 'Z1', label: 'Recovery', pct: [0.5, 0.6], desc: 'Pemulihan aktif, percakapan nyaman' },
  { z: 'Z2', label: 'Aerobik Dasar', pct: [0.6, 0.7], desc: 'Membangun fondasi daya tahan' },
  { z: 'Z3', label: 'Tempo', pct: [0.7, 0.8], desc: 'Ambang aerobik, masih bisa bicara singkat' },
  { z: 'Z4', label: 'Ambang Laktat', pct: [0.8, 0.9], desc: 'Berat, interval 4-8 menit' },
  { z: 'Z5', label: 'VO₂max / Anaerobik', pct: [0.9, 1.0], desc: 'Maksimal, interval pendek 30s-3 menit' },
] as const

function vo2Tier(v: number, g: 'M' | 'F') {
  const t = g === 'M'
    ? [[60, 'Elit'], [52, 'Sangat Baik'], [45, 'Baik'], [38, 'Cukup'], [0, 'Perlu Ditingkatkan']] as const
    : [[54, 'Elit'], [46, 'Sangat Baik'], [39, 'Baik'], [32, 'Cukup'], [0, 'Perlu Ditingkatkan']] as const
  return t.find(([min]) => v >= min)?.[1] ?? 'Perlu Ditingkatkan'
}

// Acute:Chronic Workload Ratio (Gabbett 2016) — primary injury-risk indicator.
// "Sweet spot" 0.8–1.3; >1.5 sharply raises soft-tissue injury risk; <0.8 =
// undertraining/detraining (also raises risk when load later spikes).
function acwrZone(ratio: number): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral'; advice: string } {
  if (!isFinite(ratio) || ratio <= 0) return { label: 'Data belum cukup', tone: 'neutral', advice: 'Isi beban akut (7 hari) & kronis (rata-rata mingguan 28 hari) dari jam Anda.' }
  if (ratio < 0.8) return { label: 'Undertraining / Detraining', tone: 'low', advice: 'Beban terlalu rendah dibanding kebiasaan. Tingkatkan bertahap (maks +10%/minggu) agar kebugaran tak menurun.' }
  if (ratio <= 1.3) return { label: 'Sweet Spot (Optimal)', tone: 'brand', advice: 'Zona aman & adaptif. Pertahankan progresi bertahap; ini fase membangun kebugaran terbaik.' }
  if (ratio <= 1.5) return { label: 'Waspada (Beban Naik Cepat)', tone: 'low', advice: 'Lonjakan beban. Tahan intensitas 1–2 hari, perbanyak Z1–Z2 & pemulihan sebelum menambah beban.' }
  return { label: 'Risiko Cedera Tinggi', tone: 'critical', advice: 'Lonjakan berbahaya (>1.5). Kurangi volume/intensitas segera, prioritaskan tidur, mobilitas & recovery untuk cegah cedera jaringan lunak.' }
}

// Garmin-style Training Status from load ratio + VO₂max trend.
function trainingStatus(ratio: number, trend: 'up' | 'flat' | 'down'): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral'; desc: string } {
  if (!isFinite(ratio) || ratio <= 0) return { label: '—', tone: 'neutral', desc: 'Lengkapi beban latihan untuk menilai status.' }
  if (ratio > 1.5) return { label: 'Overreaching', tone: 'critical', desc: 'Beban di atas kemampuan pulih. Butuh deload/pemulihan agar tidak overtraining.' }
  if (trend === 'up' && ratio >= 0.8) return { label: 'Productive', tone: 'brand', desc: 'Kebugaran meningkat dengan beban seimbang — pertahankan.' }
  if (trend === 'flat' && ratio >= 0.8 && ratio <= 1.3) return { label: 'Maintaining', tone: 'brand', desc: 'Mempertahankan kebugaran. Tambahkan stimulus untuk berkembang.' }
  if (ratio < 0.8 && trend !== 'down') return { label: 'Recovery', tone: 'low', desc: 'Beban ringan — cocok untuk taper/pemulihan terkontrol.' }
  if (trend === 'down') return { label: 'Detraining', tone: 'low', desc: 'Kebugaran menurun. Naikkan beban bertahap untuk membalik tren.' }
  return { label: 'Unproductive', tone: 'low', desc: 'Beban ada tapi kebugaran tak naik — cek tidur, nutrisi & stres.' }
}

// HRV status vs personal baseline (readiness/autonomic recovery).
function hrvStatus(hrv: number, base: number): { label: string; tone: 'brand' | 'low' | 'critical' | 'neutral' } {
  if (!hrv || !base) return { label: 'Isi HRV & baseline', tone: 'neutral' }
  const d = (hrv - base) / base
  if (d >= -0.05) return { label: 'Seimbang — siap latihan', tone: 'brand' }
  if (d >= -0.15) return { label: 'Sedikit tertekan — latihan ringan', tone: 'low' }
  return { label: 'Tertekan — prioritaskan pemulihan', tone: 'critical' }
}

export function Athlete() {
  const [p, setP] = useState<AthleteProfile>(load)
  const hrMax = p.hrMax > 0 ? p.hrMax : 220 - p.age
  const v = vo2max(p.age, p.g, p.hrRest)
  const tier = vo2Tier(v, p.g)
  const acwr = p.chronicLoad > 0 ? p.acuteLoad / p.chronicLoad : 0
  const acwrZ = acwrZone(acwr)
  const status = trainingStatus(acwr, p.vo2Trend)
  const hrvZ = hrvStatus(p.hrv, p.hrvBaseline)

  function upd(next: Partial<AthleteProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <AthleteQuotePopup />
      <div className="flex justify-end">
        <ShareToFeed activity="🏃 Performa Atlet" defaultCaption="Update latihan & performa saya hari ini 💪" />
      </div>
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Performa Atlet" subtitle="VO₂max, zona latihan & target beban mingguan" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Usia"><input className={inputClass} type="number" value={p.age} onChange={(e) => upd({ age: +e.target.value })} /></Field>
          <Field label="Jenis Kelamin">
            <select className={inputClass} value={p.g} onChange={(e) => upd({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Laki-laki</option><option value="F">Perempuan</option>
            </select>
          </Field>
          <Field label="Berat (kg)"><input className={inputClass} type="number" value={p.weight} onChange={(e) => upd({ weight: +e.target.value })} /></Field>
          <Field label="Nadi Istirahat"><input className={inputClass} type="number" value={p.hrRest} onChange={(e) => upd({ hrRest: +e.target.value })} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Nadi Maks Terukur (opsional, kosongkan untuk estimasi 220-usia)">
            <input className={inputClass} type="number" value={p.hrMax || ''} placeholder={String(220 - p.age)} onChange={(e) => upd({ hrMax: +e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">VO₂max Estimasi</div>
            <div className="text-3xl font-extrabold text-brand">{v.toFixed(1)}<span className="ml-1 text-sm font-medium text-white/50">ml/kg/min</span></div>
            <Badge tone="brand">{tier}</Badge>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Nadi Maks</div>
            <div className="text-3xl font-extrabold text-ink">{hrMax}<span className="ml-1 text-sm font-medium text-neutral-400">bpm</span></div>
            <div className="mt-1 text-[11px] text-neutral-400">Dasar perhitungan 5 zona latihan</div>
          </div>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Zona Latihan" subtitle="Persentase dari nadi maksimal" />
        <div className="mt-3 space-y-2">
          {ZONES.map((z) => {
            const lo = Math.round(hrMax * z.pct[0]); const hi = Math.round(hrMax * z.pct[1])
            return (
              <div key={z.z} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
                <div>
                  <div className="text-sm font-bold">{z.z} — {z.label}</div>
                  <div className="text-[11px] text-neutral-400">{z.desc}</div>
                </div>
                <div className="text-right text-sm font-extrabold text-brand-dark">{lo}–{hi} bpm</div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Target Beban Mingguan" subtitle="Rekomendasi umum berdasarkan tingkat VO₂max" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>• Total volume: {tier === 'Elit' || tier === 'Sangat Baik' ? '8-12 jam' : tier === 'Baik' ? '5-8 jam' : '3-5 jam'} / minggu</li>
          <li>• Z1-Z2 (basis aerobik): 70-80% dari total volume</li>
          <li>• Z4-Z5 (interval intensitas tinggi): maksimal 1-2 sesi/minggu</li>
          <li>• Latihan kekuatan/resistensi: 2-3x/minggu untuk mencegah cedera</li>
          <li>• Hari pemulihan penuh (Z1 atau istirahat total): minimal 1-2 hari/minggu</li>
        </ul>
      </Card>

      {/* ── Beban Latihan & Risiko Cedera (ACWR) ─────────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Beban Latihan & Risiko Cedera" subtitle="Acute:Chronic Workload Ratio — diisi dari Training Load di jam (Garmin/Polar/Coros/Apple)" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Beban Akut — 7 hari (Load)"><input className={inputClass} type="number" value={p.acuteLoad || ''} placeholder="mis. 420" onChange={(e) => upd({ acuteLoad: +e.target.value })} /></Field>
          <Field label="Beban Kronis — rata-rata mingguan 28 hari"><input className={inputClass} type="number" value={p.chronicLoad || ''} placeholder="mis. 380" onChange={(e) => upd({ chronicLoad: +e.target.value })} /></Field>
        </div>
        <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Rasio ACWR</div>
              <div className="text-3xl font-extrabold text-brand">{acwr > 0 ? acwr.toFixed(2) : '—'}</div>
            </div>
            <Badge tone={acwrZ.tone}>{acwrZ.label}</Badge>
          </div>
          {/* Risk bar: 0 .. 2.0 with sweet-spot band */}
          <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 bg-emerald-400/30" style={{ left: `${(0.8 / 2) * 100}%`, width: `${((1.3 - 0.8) / 2) * 100}%` }} />
            {acwr > 0 && <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white" style={{ left: `${Math.min(acwr / 2, 1) * 100}%` }} />}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-white/40"><span>0.8</span><span>Sweet spot</span><span>1.3</span><span>1.5+</span></div>
          <p className="mt-3 text-xs leading-relaxed text-white/80">{acwrZ.advice}</p>
        </div>
        <details className="mt-2 text-[11px] text-neutral-500">
          <summary className="cursor-pointer font-semibold text-brand-dark">Tidak punya angka Load? Hitung sRPE manual</summary>
          <p className="mt-1.5 leading-relaxed">Metode Foster (sRPE): <b>Beban sesi = durasi (menit) × RPE (1–10)</b>. Jumlahkan semua sesi 7 hari → Beban Akut. Rata-rata beban mingguan 4 minggu → Beban Kronis. Contoh: lari 60 menit RPE 7 = 420 unit beban.</p>
        </details>
      </Card>

      {/* ── Status Latihan + Pemulihan (Garmin-style) ────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Status Latihan & Kesiapan" subtitle="Training Status, HRV & Recovery Time dari perangkat Anda" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Tren VO₂max (4 mgg)">
            <select className={inputClass} value={p.vo2Trend} onChange={(e) => upd({ vo2Trend: e.target.value as AthleteProfile['vo2Trend'] })}>
              <option value="up">Naik ↑</option><option value="flat">Stabil →</option><option value="down">Turun ↓</option>
            </select>
          </Field>
          <Field label="HRV malam (ms)"><input className={inputClass} type="number" value={p.hrv || ''} placeholder="mis. 65" onChange={(e) => upd({ hrv: +e.target.value })} /></Field>
          <Field label="Baseline HRV (ms)"><input className={inputClass} type="number" value={p.hrvBaseline || ''} placeholder="mis. 68" onChange={(e) => upd({ hrvBaseline: +e.target.value })} /></Field>
          <Field label="Recovery Time (jam)"><input className={inputClass} type="number" value={p.recoveryHrs || ''} placeholder="mis. 18" onChange={(e) => upd({ recoveryHrs: +e.target.value })} /></Field>
          <Field label="Skor Tidur (0–100)"><input className={inputClass} type="number" value={p.sleepScore || ''} placeholder="mis. 82" onChange={(e) => upd({ sleepScore: +e.target.value })} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Status Latihan</div>
            <div className="mt-1"><Badge tone={status.tone}>{status.label}</Badge></div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{status.desc}</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Status HRV / Kesiapan</div>
            <div className="mt-1"><Badge tone={hrvZ.tone}>{hrvZ.label}</Badge></div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              {p.recoveryHrs > 0 ? `Recovery Time tersisa ${p.recoveryHrs} jam. ` : ''}
              {p.sleepScore > 0 ? (p.sleepScore >= 75 ? 'Tidur baik — siap beban penuh.' : 'Tidur kurang — turunkan intensitas.') : 'Isi data untuk rekomendasi kesiapan.'}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Ambang Laktat & Training Effect ──────────────────────── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={20} />} title="Ambang Laktat & Training Effect" subtitle="Penanda intensitas — diukur lewat tes lapangan / jam" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="LT Heart Rate (bpm)"><input className={inputClass} type="number" value={p.ltHr || ''} placeholder="mis. 168" onChange={(e) => upd({ ltHr: +e.target.value })} /></Field>
          <Field label="LT Pace (mm:ss /km)"><input className={inputClass} value={p.ltPace} placeholder="mis. 4:35" onChange={(e) => upd({ ltPace: e.target.value })} /></Field>
          <Field label="Aerobic TE (0–5)"><input className={inputClass} type="number" step="0.1" value={p.teAerobic || ''} placeholder="mis. 3.4" onChange={(e) => upd({ teAerobic: +e.target.value })} /></Field>
          <Field label="Anaerobic TE (0–5)"><input className={inputClass} type="number" step="0.1" value={p.teAnaerobic || ''} placeholder="mis. 1.8" onChange={(e) => upd({ teAnaerobic: +e.target.value })} /></Field>
        </div>
        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-neutral-500">
          <li>• <b>LT HR</b> ≈ batas atas Zona 4. Latihan tempo tepat di sekitar nilai ini menaikkan ambang laktat — kunci performa endurance.</li>
          <li>• <b>Training Effect</b>: 1.0–1.9 pemulihan · 2.0–2.9 mempertahankan · 3.0–3.9 meningkatkan · 4.0–4.9 sangat meningkatkan · 5.0 berlebih (butuh pemulihan ekstra).</li>
          {p.ltHr > 0 && <li>• Zona tempo Anda: <b>{Math.round(p.ltHr * 0.95)}–{p.ltHr} bpm</b> (interval ambang 4–8 menit).</li>}
        </ul>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs text-brand-dark">
        📚 Pelajari indikator ini lebih dalam di <a href="#/sports-science" className="font-bold underline">Sains Olahraga & KPI</a> — referensi jurnal, metode tim juara & kalender aktivitas per cabang.
      </div>
    </div>
  )
}

export default Athlete
