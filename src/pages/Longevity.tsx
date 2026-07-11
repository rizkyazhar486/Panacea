import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp, IconTimer } from '../components/icons'
import { PrefillBadge } from '../components/HealthSnapshot'
import { hasHealth, pushBiometrics } from '../lib/profile'
import { ShareStatCard } from '../components/ShareStatCard'

// ─────────────────────────────────────────────────────────────────────────────
// Pusat Longevity — the layer wearables DON'T have. Apple Watch & WHOOP score
// your DAY; this scores your DECADES:
//   • Composite Longevity Score from validated long-term mortality/healthspan
//     predictors (VO₂max, grip, leg strength, balance, body comp, RHR, sleep,
//     lifestyle) with evidence-based weights.
//   • Biological-age estimate (heuristic, optionally sharpened by lab values).
//   • Decade projection: where each capacity lands at 60 & 80 on the current
//     path vs the trained path — "latih dirimu yang berusia 80".
//   • Testing protocol: quarterly field tests + yearly labs with due dates.
// Auto-prefills from data already entered elsewhere in the app (Komposisi
// Tubuh, Atlet). Manual, offline, device-agnostic — a complement to any watch.
// ─────────────────────────────────────────────────────────────────────────────

interface LongevityData {
  age: number; g: 'M' | 'F'
  vo2: number; grip: number; chair30: number; balance: number
  whr: number; rhr: number; sleepH: number
  smoke: 'never' | 'former' | 'current'; alcohol: 0 | 1 | 2 // none/moderate/heavy
  protein: boolean; social: boolean; purpose: boolean
  hba1c: number; ldl: number; crp: number; sbp: number
  tests: Record<string, string> // test id -> last done ISO date
}
const DEF: LongevityData = {
  age: 30, g: 'M', vo2: 0, grip: 0, chair30: 0, balance: 0,
  whr: 0, rhr: 0, sleepH: 7, smoke: 'never', alcohol: 0,
  protein: false, social: false, purpose: false,
  hba1c: 0, ldl: 0, crp: 0, sbp: 0, tests: {},
}
const KEY = 'pmd_longevity_v1'

function load(): LongevityData {
  let d: LongevityData = { ...DEF }
  try { d = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* ignore */ }
  // Prefill once from sibling pages if empty — the "aggregator" behavior.
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (!d.vo2 && bc.vo2) d.vo2 = bc.vo2
    if (!d.rhr && bc.rhr) d.rhr = bc.rhr
    if (!d.whr && bc.waist && bc.hip) d.whr = +(bc.waist / bc.hip).toFixed(2)
    if (d.age === DEF.age && bc.age) d.age = bc.age
    if (bc.g) d.g = bc.g
    if (!d.sleepH && bc.sleepH) d.sleepH = bc.sleepH
  } catch { /* ignore */ }
  // Then from the central Health Profile (manual/wearable) — highest priority source.
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (!d.vo2 && hp.vo2max) d.vo2 = hp.vo2max
    if (!d.rhr && hp.restingHr) d.rhr = hp.restingHr
    if (!d.sleepH && hp.sleepH) d.sleepH = hp.sleepH
    if (d.age === DEF.age && hp.age) d.age = hp.age
    if (hp.sex) d.g = hp.sex
  } catch { /* ignore */ }
  return d
}

// ── Pillar scoring (0-100 each). Age-adjusted where the evidence says so. ────
interface Pillar {
  id: string; emoji: string; name: string; why: string
  value: number; unit: string; score: number
  target: string; weight: number
}
function pillarsOf(d: LongevityData): Pillar[] {
  const M = d.g === 'M'
  // VO2max: strongest single predictor (Mandsager 2018). Age-adjusted "good".
  const vo2Good = (M ? 46 : 40) - Math.max(0, d.age - 25) * 0.35
  const vo2Score = d.vo2 > 0 ? Math.min(100, (d.vo2 / vo2Good) * 75) : 0
  // Grip: PURE study. Norm ≈ 46kg M / 29kg F young adult.
  const gripNorm = (M ? 46 : 29) - Math.max(0, d.age - 30) * 0.25
  const gripScore = d.grip > 0 ? Math.min(100, (d.grip / gripNorm) * 80) : 0
  // Chair stand 30s (Rikli & Jones): ~25 young, decreasing.
  const chairNorm = 25 - Math.max(0, d.age - 25) * 0.22
  const chairScore = d.chair30 > 0 ? Math.min(100, (d.chair30 / chairNorm) * 80) : 0
  // One-leg balance: 30s+ full marks; <10s red flag (BMJ 2022 flamingo study).
  const balScore = d.balance > 0 ? Math.min(100, (d.balance / 30) * 100) : 0
  // WHR: cardiometabolic shape.
  const whrScore = d.whr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.whr - (M ? 0.85 : 0.75)) * 400)) : 0
  // RHR: 50-60 optimal.
  const rhrScore = d.rhr > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, d.rhr - 58) * 3.2 - Math.max(0, 42 - d.rhr) * 3)) : 0
  // Sleep: 7-8.5h sweet spot.
  const sleepScore = d.sleepH > 0 ? Math.max(0, 100 - Math.abs(d.sleepH - 7.75) * 28) : 0
  // Lifestyle bundle.
  let life = 40
  if (d.smoke === 'never') life += 30; else if (d.smoke === 'former') life += 15
  if (d.alcohol === 0) life += 10; else if (d.alcohol === 2) life -= 20
  if (d.protein) life += 7
  if (d.social) life += 7
  if (d.purpose) life += 6
  const lifeScore = Math.max(0, Math.min(100, life))
  return [
    { id: 'vo2', emoji: '🫀', name: 'VO₂max', why: 'Prediktor mortalitas #1 — elit vs rendah ≈ 5x beda risiko', value: d.vo2, unit: 'ml/kg/mnt', score: vo2Score, target: `≥${vo2Good.toFixed(0)} utk usia Anda`, weight: 0.22 },
    { id: 'grip', emoji: '✊', name: 'Grip Strength', why: 'Tiap −5kg ≈ +16% risiko kematian (PURE)', value: d.grip, unit: 'kg', score: gripScore, target: `≥${gripNorm.toFixed(0)} kg`, weight: 0.13 },
    { id: 'chair', emoji: '🦵', name: 'Kekuatan Kaki (Chair Stand 30s)', why: 'Prediktor mobilitas & kemandirian usia tua', value: d.chair30, unit: 'x', score: chairScore, target: `≥${chairNorm.toFixed(0)}x`, weight: 0.13 },
    { id: 'bal', emoji: '🦩', name: 'Keseimbangan Satu Kaki', why: '<10 dtk usia 50+ ≈ 2x risiko kematian 7 thn (BMJ)', value: d.balance, unit: 'dtk', score: balScore, target: '≥30 dtk', weight: 0.1 },
    { id: 'whr', emoji: '📏', name: 'Waist-Hip Ratio', why: 'Lemak visceral > BMI utk risiko kardiometabolik', value: d.whr, unit: '', score: whrScore, target: M ? '≤0.90' : '≤0.85', weight: 0.1 },
    { id: 'rhr', emoji: '❤️', name: 'Resting HR', why: 'Efisiensi jantung; turun dgn latihan Zone 2', value: d.rhr, unit: 'bpm', score: rhrScore, target: '50-60 bpm', weight: 0.1 },
    { id: 'sleep', emoji: '😴', name: 'Tidur', why: 'Fondasi perbaikan sel & hormon', value: d.sleepH, unit: 'jam', score: sleepScore, target: '7-8.5 jam', weight: 0.11 },
    { id: 'life', emoji: '🌱', name: 'Gaya Hidup & Sosial', why: 'Rokok, alkohol, protein, koneksi sosial, tujuan hidup', value: lifeScore, unit: '/100', score: lifeScore, target: 'tanpa rokok + sosial aktif', weight: 0.11 },
  ]
}

function bioAge(d: LongevityData, score: number): number {
  // Heuristic: composite score 75 ≈ chronological. Each ±10 pts ≈ ∓2.5 yrs.
  let b = d.age - (score - 72) * 0.25
  // Lab sharpening (optional): each marker off-target adds years.
  if (d.hba1c > 0) b += Math.max(0, d.hba1c - 5.4) * 3
  if (d.ldl > 0) b += Math.max(0, d.ldl - 115) * 0.03
  if (d.crp > 0) b += Math.max(0, d.crp - 1) * 1.2
  if (d.sbp > 0) b += Math.max(0, d.sbp - 118) * 0.1
  return Math.max(15, Math.round(b * 10) / 10)
}

// Decade projection: decline per decade untrained vs trained.
function project(current: number, age: number, targetAge: number, declineUntrained: number, declineTrained: number) {
  const decades = Math.max(0, (targetAge - age) / 10)
  return {
    untrained: current * Math.pow(1 - declineUntrained, decades),
    trained: current * Math.pow(1 - declineTrained, decades),
  }
}

// Testing protocol (quarterly field tests + yearly checks).
const PROTOCOL = [
  { id: 'cooper', label: '🏃 Cooper Test 12 mnt (VO₂max)', freqM: 3, where: 'Lapangan / treadmill — hasil ke Tes Fisik' },
  { id: 'grip', label: '✊ Handgrip dynamometer', freqM: 3, where: 'Gym / Lab Performa' },
  { id: 'chair', label: '🦵 Chair-stand 30 detik', freqM: 3, where: 'Rumah — kursi tanpa lengan' },
  { id: 'balance', label: '🦩 One-leg stand (buka & tutup mata)', freqM: 3, where: 'Rumah' },
  { id: 'body', label: '📏 Lingkar pinggang-pinggul + berat', freqM: 1, where: 'Rumah — ke Komposisi Tubuh' },
  { id: 'bp', label: '🩺 Tekanan darah', freqM: 1, where: 'Rumah / apotek — ke VitaPulse' },
  { id: 'lab', label: '🧪 Lab tahunan: HbA1c, lipid, hsCRP, ginjal', freqM: 12, where: 'Laboratorium klinik' },
  { id: 'dental', label: '🦷 Kontrol gigi', freqM: 6, where: 'Dokter gigi — inflamasi gusi ↔ jantung' },
  { id: 'skin', label: '🔎 Skrining kulit & sesuai usia (kanker)', freqM: 12, where: 'Dokter — jadwal skrining nasional' },
]

export function Longevity() {
  const [d, setD] = useState<LongevityData>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  // Sync edited biometrics back to the central Health Profile so the whole app agrees.
  useEffect(() => { pushBiometrics({ vo2max: d.vo2, restingHr: d.rhr, sleepH: d.sleepH }) }, [d.vo2, d.rhr, d.sleepH])
  const u = (p: Partial<LongevityData>) => setD((x) => ({ ...x, ...p }))

  const pillars = useMemo(() => pillarsOf(d), [d])
  const filled = pillars.filter((p) => p.score > 0)
  const score = filled.length >= 4
    ? Math.round(filled.reduce((s, p) => s + p.score * p.weight, 0) / filled.reduce((s, p) => s + p.weight, 0))
    : null
  const bAge = score != null ? bioAge(d, score) : null
  const delta = bAge != null ? bAge - d.age : null

  const vo2Proj60 = d.vo2 > 0 ? project(d.vo2, d.age, 60, 0.10, 0.05) : null
  const vo2Proj80 = d.vo2 > 0 ? project(d.vo2, d.age, 80, 0.10, 0.05) : null
  const gripProj80 = d.grip > 0 ? project(d.grip, Math.max(d.age, 30), 80, 0.15, 0.07) : null

  const scoreColor = score == null ? '#a3a3a3' : score >= 75 ? '#00BF63' : score >= 55 ? '#f59e0b' : '#ef4444'

  const HEALTH_FIELD: Partial<Record<keyof LongevityData, 'vo2max' | 'restingHr' | 'sleepH'>> = { vo2: 'vo2max', rhr: 'restingHr', sleepH: 'sleepH' }
  const num = (label: string, key: keyof LongevityData, step = 1, ph = '') => {
    const hf = HEALTH_FIELD[key]
    return (
      <Field label={<>{label}<PrefillBadge show={!!hf && hasHealth(hf)} /></>}>
        <input className={inputClass} type="number" step={step} placeholder={ph}
          value={(d[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<LongevityData>)} />
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero */}
      {score != null && bAge != null && (
        <div className="flex justify-end">
          <ShareStatCard
            activity="❤️ Pusat Longevity"
            metricLabel="Longevity Score"
            metricValue={String(score)}
            badge={delta != null ? (delta <= 0 ? `${Math.abs(delta).toFixed(1)} thn lebih muda` : `${delta.toFixed(1)} thn lebih tua`) : undefined}
            secondary={`Usia Biologis (est.) ${bAge} thn vs usia kronologis ${d.age}`}
          />
        </div>
      )}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Pusat Longevity" subtitle="Jam tangan menilai harimu — halaman ini menilai dekademu" />
        <div className="mt-2 flex items-center justify-around">
          <div className="text-center">
            <div className="relative mx-auto" style={{ width: 130, height: 130 }}>
              <svg width="130" height="130" className="-rotate-90">
                <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                <circle cx="65" cy="65" r="56" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 * (1 - (score ?? 0) / 100)}
                  style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${scoreColor}55)` }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <div className="text-4xl font-extrabold" style={{ color: scoreColor }}>{score ?? '—'}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Longevity Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Usia Biologis (est.)</div>
            <div className="text-4xl font-extrabold text-ink">{bAge ?? '—'}<span className="text-sm text-neutral-400"> thn</span></div>
            {delta != null && (
              <Badge tone={delta <= 0 ? 'brand' : 'critical'}>
                {delta <= 0 ? `${Math.abs(delta).toFixed(1)} thn lebih muda 🎉` : `${delta.toFixed(1)} thn lebih tua`}
              </Badge>
            )}
            <div className="mt-1 text-[9px] text-neutral-400">vs usia kronologis {d.age}</div>
          </div>
        </div>
        {score == null && <p className="mt-3 text-center text-[11px] text-neutral-400">Isi minimal 4 pilar di bawah untuk mengaktifkan skor & usia biologis.</p>}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Usia"><input className={inputClass} type="number" value={d.age} onChange={(e) => u({ age: +e.target.value })} /></Field>
          <Field label="Jenis Kelamin">
            <select className={inputClass} value={d.g} onChange={(e) => u({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Laki-laki</option><option value="F">Perempuan</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Pillars */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="8 Pilar Longevity" subtitle="Prediktor jangka panjang tervalidasi — bobot sesuai kekuatan bukti" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          {num('VO₂max (ml/kg/mnt)', 'vo2', 0.1)}
          {num('Grip terbaik (kg)', 'grip', 0.5)}
          {num('Chair-stand 30 dtk (x)', 'chair30')}
          {num('Keseimbangan 1 kaki (dtk)', 'balance')}
          {num('Waist-Hip Ratio', 'whr', 0.01, 'mis. 0.85')}
          {num('Resting HR (bpm)', 'rhr')}
          {num('Rata-rata tidur (jam)', 'sleepH', 0.1)}
          <Field label="Merokok">
            <select className={inputClass} value={d.smoke} onChange={(e) => u({ smoke: e.target.value as LongevityData['smoke'] })}>
              <option value="never">Tidak pernah</option><option value="former">Berhenti</option><option value="current">Masih</option>
            </select>
          </Field>
          <Field label="Alkohol">
            <select className={inputClass} value={d.alcohol} onChange={(e) => u({ alcohol: +e.target.value as LongevityData['alcohol'] })}>
              <option value={0}>Tidak</option><option value={1}>Sesekali</option><option value={2}>Sering</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {([['protein', '🥩 Protein ≥1.6 g/kg/hari'], ['social', '🫂 Koneksi sosial rutin'], ['purpose', '🎯 Punya tujuan hidup (ikigai)']] as const).map(([k, l]) => (
            <button key={k} onClick={() => u({ [k]: !d[k] } as Partial<LongevityData>)}
              className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (d[k] ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {pillars.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{p.emoji} {p.name}</span>
                <span className={'text-sm font-extrabold ' + (p.score >= 75 ? 'text-brand-dark' : p.score >= 50 ? 'text-amber-600' : p.score > 0 ? 'text-rose-500' : 'text-neutral-300')}>
                  {p.score > 0 ? Math.round(p.score) : '—'}
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${p.score}%`, background: p.score >= 75 ? '#00BF63' : p.score >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
                <span>{p.why}</span>
                <span className="shrink-0 font-bold">target {p.target}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Decade projection */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Proyeksi Dekade — Latih Dirimu yang 80 Tahun" subtitle="Tanpa latihan: VO₂max −10%/dekade, otot −8%/dekade setelah 30. Terlatih: separuhnya." />
        {vo2Proj60 && vo2Proj80 ? (
          <div className="mt-2 space-y-3">
            <div className="rounded-2xl bg-ink p-4 text-white">
              <div className="text-xs font-bold text-white/60">VO₂max Anda {d.vo2} sekarang →</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase text-white/50">Usia 60</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-400">{vo2Proj60.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj60.trained.toFixed(0)}</span></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/50">Usia 80</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-400">{vo2Proj80.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj80.trained.toFixed(0)}</span></div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/70">
                Ambang kemandirian ≈18 (naik tangga, belanja sendiri). {vo2Proj80.untrained < 18 ? '⚠️ Tanpa latihan, Anda diproyeksikan di BAWAH ambang mandiri di usia 80 — jalur terlatih menjaga Anda tetap di atasnya.' : 'Kedua jalur masih di atas ambang — pertahankan.'}
                {' '}Merah = tanpa latihan · Hijau = terlatih rutin.
              </p>
            </div>
            {gripProj80 && (
              <div className="rounded-xl border border-neutral-100 p-3 text-[11px] text-neutral-600">
                ✊ Grip {d.grip}kg → usia 80: <b className="text-rose-500">{gripProj80.untrained.toFixed(0)}kg</b> tanpa latihan vs <b className="text-brand-dark">{gripProj80.trained.toFixed(0)}kg</b> terlatih.
                Ambang buka toples/pegangan aman ≈16-20kg.
              </div>
            )}
          </div>
        ) : <p className="mt-2 text-[11px] text-neutral-400">Isi VO₂max (dan grip) untuk melihat proyeksi Anda di usia 60 & 80.</p>}
      </Card>

      {/* Lab sharpening */}
      <Card className="!p-5">
        <SectionTitle icon={<span className="text-lg">🧪</span>} title="Penajaman Lab (opsional)" subtitle="Isi dari hasil lab tahunan — usia biologis makin akurat" />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('HbA1c (%)', 'hba1c', 0.1, '<5.4')}
          {num('LDL (mg/dL)', 'ldl', 1, '<115')}
          {num('hsCRP (mg/L)', 'crp', 0.1, '<1')}
          {num('Sistolik (mmHg)', 'sbp', 1, '<118')}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
          Marker di atas target menambah usia biologis (heuristik terinspirasi PhenoAge — bukan pengganti penilaian dokter).
          Diskusikan hasil lab dengan dokter Anda; fitur <a href="#/chatbot" className="font-bold text-brand-dark underline">Konsultasi AI</a> bisa membantu menyiapkan pertanyaan.
        </p>
      </Card>

      {/* Testing protocol */}
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Protokol Tes Berkala" subtitle="Yang diukur akan membaik — tandai tiap kali selesai" />
        <div className="mt-2 space-y-2">
          {PROTOCOL.map((p) => {
            const last = d.tests[p.id]
            const dueMs = last ? new Date(last).getTime() + p.freqM * 30.4 * 86400000 : 0
            const overdue = !last || Date.now() > dueMs
            const dueTxt = last
              ? overdue ? 'JATUH TEMPO' : `berikutnya ${new Date(dueMs).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
              : 'belum pernah'
            return (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-neutral-100 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-neutral-400">tiap {p.freqM} bln · {p.where}</div>
                </div>
                <Badge tone={overdue ? 'critical' : 'brand'}>{dueTxt}</Badge>
                <button onClick={() => u({ tests: { ...d.tests, [p.id]: new Date().toISOString() } })}
                  className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-[10px] font-bold text-white active:scale-95">✓ Selesai</button>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs leading-relaxed text-brand-dark">
        Halaman ini adalah <b>pelengkap</b> jam Anda: Apple Watch/WHOOP menjawab "bagaimana hari ini?" —
        Pusat Longevity menjawab "bagaimana 30 tahun lagi?". Eksekusi hariannya:
        {' '}<a href="#/readiness" className="font-bold underline">Recovery & Strain</a> ·
        {' '}<a href="#/training-plan" className="font-bold underline">Program AI</a> ·
        {' '}<a href="#/body" className="font-bold underline">Komposisi Tubuh</a>.
        <br /><span className="text-[10px] opacity-70">Referensi: Mandsager 2018 (JAMA), PURE study (grip), BMJ 2022 (flamingo balance), Rikli & Jones, Attia — Outlive. Estimasi edukatif, bukan diagnosis.</span>
      </div>
    </div>
  )
}

export default Longevity
