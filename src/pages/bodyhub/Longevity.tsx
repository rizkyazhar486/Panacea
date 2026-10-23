import { useEffect, useMemo, useState } from 'react'
import { KolomAngka } from '../../components/KolomAngka'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../components/ui'
import { IconHeart, IconActivity, IconChartUp, IconTimer } from '../../components/icons'
import { PrefillBadge } from '../../components/HealthSnapshot'
import { pushBiometrics, mergeHealthCache } from '../../lib/profile'
import { mergeVitals, getVitals } from '../../lib/healthVitals'
import { useVitals } from '../../lib/useVitals'
import { ShareStatCard } from '../../components/ShareStatCard'
import { PanelKebugaranIlmiah } from '../../components/PanelKebugaranIlmiah'
import { bahanOtomatis } from '../../lib/bugarOtomatis'
import { Fold } from '../../shared/ui/Fold'
import { DEF, bacaIsi, hitungSkor, pillarsOf, tandai, type Isi, type LongevityData } from './longevityScoring'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

// ─────────────────────────────────────────────────────────────────────────────
// Pusat Longevity — the layer wearables DON'T have. Apple Watch & WHOOP score
// your DAY; this scores your DECADES:
//   • Composite Longevity Score from validated long-term mortality/healthspan
//     predictors (VO₂max, grip, leg strength, balance, body comp, RHR, sleep,
//     lifestyle) with evidence-based weights.
//   • Biological-age estimate (heuristic, optionally sharpened by lab values).
//   • Decade projection: where each capacity lands at 60 & 80 on the current
//     path vs the trained path — "train the you at 80".
//   • Testing protocol: quarterly field tests + yearly labs with due dates.
// Auto-prefills from data already entered elsewhere in the app (Body
// Composition, Athlete). Manual, offline, device-agnostic — a complement to any watch.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'pmd_longevity_v1'

interface KeadaanLongevity { d: LongevityData; isi: Isi }

function load(): KeadaanLongevity {
  let mentah: unknown = null
  try { mentah = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { /* ignore */ }
  let isi = bacaIsi(mentah)
  const d: LongevityData = { ...DEF }
  if (mentah && typeof mentah === 'object' && !Array.isArray(mentah)) {
    const { isi: _penanda, ...sisa } = mentah as Record<string, unknown>
    Object.assign(d, sisa)
  }
  // Prefill once from sibling pages if empty — the "aggregator" behavior. Usia, jenis kelamin dan tidur
  // ditandai diisi hanya bila sumbernya memang punya nilainya.
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (!d.vo2 && bc.vo2) d.vo2 = bc.vo2
    if (!d.rhr && bc.rhr) d.rhr = bc.rhr
    if (!d.whr && bc.waist && bc.hip) d.whr = +(bc.waist / bc.hip).toFixed(2)
    if (!isi.age && bc.age > 0) { d.age = bc.age; isi = tandai(isi, { age: bc.age }) }
    if (!isi.g && (bc.g === 'M' || bc.g === 'F')) { d.g = bc.g; isi = tandai(isi, { g: bc.g }) }
    if (!isi.sleepH && bc.sleepH > 0) { d.sleepH = bc.sleepH; isi = tandai(isi, { sleepH: bc.sleepH }) }
  } catch { /* ignore */ }
  // Then from the central Health Profile (manual/wearable) — highest priority source.
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (!d.vo2 && hp.vo2max) d.vo2 = hp.vo2max
    if (!d.rhr && hp.restingHr) d.rhr = hp.restingHr
    if (!isi.sleepH && hp.sleepH > 0) { d.sleepH = hp.sleepH; isi = tandai(isi, { sleepH: hp.sleepH }) }
    if (!isi.age && hp.age > 0) { d.age = hp.age; isi = tandai(isi, { age: hp.age }) }
    if (hp.sex === 'M' || hp.sex === 'F') { d.g = hp.sex; isi = tandai(isi, { g: hp.sex }) }
  } catch { /* ignore */ }
  return { d, isi }
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
  { id: 'cooper', label: '🏃 Cooper Test 12 min (VO₂max)', freqM: 3, where: 'Field / treadmill — results to Physical Test' },
  { id: 'grip', label: '✊ Handgrip dynamometer', freqM: 3, where: 'Gym / Performance Lab' },
  { id: 'chair', label: '🦵 Chair-stand 30 seconds', freqM: 3, where: 'Home — armless chair' },
  { id: 'balance', label: '🦩 One-leg stand (eyes open & closed)', freqM: 3, where: 'Home' },
  { id: 'body', label: '📏 Waist-hip circumference + weight', freqM: 1, where: 'Home — to Body Composition' },
  { id: 'bp', label: '🩺 Blood pressure', freqM: 1, where: 'Home / pharmacy — to VitaPulse' },
  { id: 'lab', label: '🧪 Annual labs: HbA1c, lipids, hsCRP, kidney', freqM: 12, where: 'Clinical laboratory' },
  { id: 'dental', label: '🦷 Dental checkup', freqM: 6, where: 'Dentist — gum inflammation ↔ heart' },
  { id: 'skin', label: '🔎 Age-appropriate skin (cancer) screening', freqM: 12, where: 'Doctor — per national screening schedule' },
]

// Pull the latest device-synced values (Health Profile ← Apple Health/WHOOP
// imports, plus Body Composition measurements) OVER the saved local values, so
// the Longevity Score is always computed from current data, not a stale copy
// from the first visit. Returns which fields changed for the sync note.
function syncFromDevices(keadaan: KeadaanLongevity, overrideZeroSleep = false): { next: KeadaanLongevity; changed: string[] } {
  const cur = keadaan.d
  // The shared cache accepts positive biometrics only. Its previous positive
  // sleep value must not silently replace a zero explicitly entered here.
  const retainZeroSleep = !overrideZeroSleep && keadaan.isi.sleepH && cur.sleepH === 0
  const patch: Partial<LongevityData> = {}
  const changed: string[] = []
  try {
    const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}')
    if (hp.vo2max > 0 && hp.vo2max !== cur.vo2) { patch.vo2 = hp.vo2max; changed.push('VO₂max') }
    if (hp.restingHr > 0 && hp.restingHr !== cur.rhr) { patch.rhr = hp.restingHr; changed.push('Resting HR') }
    if (!retainZeroSleep && hp.sleepH > 0 && hp.sleepH !== cur.sleepH) { patch.sleepH = hp.sleepH; changed.push('Sleep') }
    if (hp.age > 0 && hp.age !== cur.age) { patch.age = hp.age; changed.push('Age') }
    if ((hp.sex === 'M' || hp.sex === 'F') && hp.sex !== cur.g) { patch.g = hp.sex; changed.push('Sex') }
  } catch { /* ignore */ }
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    if (bc.waist > 0 && bc.hip > 0) {
      const whr = +(bc.waist / bc.hip).toFixed(2)
      if (whr !== cur.whr) { patch.whr = whr; changed.push('Waist-Hip Ratio') }
    }
  } catch { /* ignore */ }
  // Data alat yang diimpor tersimpan di vitals — sumber ini sebelumnya
  // terlewat, sehingga angka yang sudah ada tetap harus diketik ulang.
  const v = getVitals()
  const pakai = (nilai: unknown, kini: number, ke: keyof LongevityData, nama: string) => {
    if (typeof nilai === 'number' && nilai > 0 && nilai !== kini) {
      ;(patch as Record<string, number>)[ke as string] = nilai
      changed.push(nama)
    }
  }
  pakai(v.vo2max, patch.vo2 ?? cur.vo2, 'vo2', 'VO₂max')
  pakai(v.restingHr, patch.rhr ?? cur.rhr, 'rhr', 'Resting heart rate')
  if (!retainZeroSleep) pakai(v.sleepH, patch.sleepH ?? cur.sleepH, 'sleepH', 'Sleep')
  pakai(v.systolic, cur.sbp, 'sbp', 'Systolic pressure')
  pakai(v.waistHipRatio, patch.whr ?? cur.whr, 'whr', 'Waist-to-hip ratio')
  return { next: { d: { ...cur, ...patch }, isi: tandai(keadaan.isi, patch) }, changed }
}

export function Longevity() {
  // Sync device data in the initializer (before first render) so the
  // push-back effect below can never overwrite fresher cache values with a
  // stale localStorage copy — same race fixed on the Body Composition page.
  const [st, setSt] = useState<KeadaanLongevity>(() => syncFromDevices(load()).next)
  const { d, isi } = st
  // Diambil dari data tersimpan, bukan diisi ulang dengan tangan.
  const otomatis = useMemo(() => bahanOtomatis(), [])
  const vitals = useVitals()
  const [baruDisimpan, setBaruDisimpan] = useState<string | null>(null)
  const [syncNote, setSyncNote] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ ...d, isi })) } catch { /* ignore */ } }, [st])
  // Sync edited biometrics back to the central Health Profile so the whole app agrees.
  // Tidur bawaan (7 jam) bukan data pengguna: hanya yang diisi yang dibagikan ke profil bersama.
  useEffect(() => { pushBiometrics({ vo2max: d.vo2, restingHr: d.rhr, sleepH: isi.sleepH ? d.sleepH : undefined }) }, [d.vo2, d.rhr, d.sleepH, isi.sleepH])
  const u = (p: Partial<LongevityData>) => setSt((x) => ({ d: { ...x.d, ...p }, isi: tandai(x.isi, p) }))

  function syncNow(silent = false) {
    setSt((cur) => {
      const { next, changed } = syncFromDevices(cur, !silent)
      if (!silent) setSyncNote(changed.length ? `Updated from your devices: ${changed.join(', ')}.` : 'Already up to date with your device data.')
      return changed.length ? next : cur
    })
  }
  // Re-sync when the tab regains focus (data pushed from a phone or edited on
  // another page shows up without a manual refresh).
  useEffect(() => {
    const onFocus = () => syncNow(true)
    window.addEventListener('focus', onFocus)
    window.addEventListener('panacea:health-updated', onFocus)
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('panacea:health-updated', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pillars = useMemo(() => pillarsOf(d, isi), [d, isi])
  const { score, bAge, kurang: kurangDasar } = useMemo(() => hitungSkor(d, isi), [d, isi])
  const delta = bAge != null ? bAge - d.age : null

  const vo2Proj60 = isi.age && d.vo2 > 0 ? project(d.vo2, d.age, 60, 0.10, 0.05) : null
  const vo2Proj80 = isi.age && d.vo2 > 0 ? project(d.vo2, d.age, 80, 0.10, 0.05) : null
  const gripProj80 = isi.age && d.grip > 0 ? project(d.grip, Math.max(d.age, 30), 80, 0.15, 0.07) : null

  const scoreColor = score == null ? '#a3a3a3' : score >= 75 ? '#00BF63' : score >= 55 ? '#f59e0b' : '#ef4444'

  // Kunci di sini dipetakan ke penyimpanan vitals bersama, bukan hanya ke tiga
  // kolom seperti sebelumnya — tekanan darah sistolik dan rasio pinggang-pinggul
  // juga sudah diketahui perangkat/timbangan dan tidak perlu diketik ulang.
  const KE_VITAL: Partial<Record<keyof LongevityData, string>> = {
    vo2: 'vo2max', rhr: 'restingHr', sleepH: 'sleepH', sbp: 'systolic', whr: 'waistHipRatio',
  }
  const num = (label: string, key: keyof LongevityData, step = 1, ph = '') => {
    const kv = KE_VITAL[key]
    const nilai = (key === 'sleepH' && !isi.sleepH ? undefined : d[key]) as number | undefined
    const perangkat = kv ? vitals[kv] : undefined
    const dariPerangkat = typeof nilai === 'number' && typeof perangkat === 'number'
      && Math.abs(nilai - perangkat) < 0.05
    const kirim = () => {
      if (!kv || typeof nilai !== 'number' || !(nilai > 0) || dariPerangkat) return
      mergeVitals({ [kv]: nilai, source: 'Manual', measuredAt: new Date().toISOString() })
      mergeHealthCache({ [kv]: nilai })
      setBaruDisimpan(String(key))
      setTimeout(() => setBaruDisimpan(null), 1800)
    }
    const perluSimpan = !!kv && typeof nilai === 'number' && nilai > 0 && !dariPerangkat
    return (
      <Field label={<>{label}<PrefillBadge show={dariPerangkat} /></>}>
        <div className="flex items-center gap-1"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); kirim() } }}>
          <KolomAngka step={step} placeholder={ph} ariaLabel={label}
            nilai={nilai}
            onNilai={(n) => u({ [key]: n } as Partial<LongevityData>)} />
          {perluSimpan && baruDisimpan !== String(key) && (
            <button type="button" onClick={kirim} aria-label={`Save ${label}`}
              title="Save this value across the whole app (or press Enter)"
              className="shrink-0 rounded-lg bg-brand px-2 py-1.5 text-[12px] font-black text-ink">↵</button>
          )}
          {baruDisimpan === String(key) && <span className="shrink-0 text-[10px] font-bold text-emerald-600" role="status">✓</span>}
        </div>
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero */}
      {score != null && bAge != null && (
        <div className="flex justify-end">
          <ShareStatCard
            activity="❤️ Longevity Center"
            metricLabel="Longevity Score"
            metricValue={String(score)}
            badge={delta != null ? (delta <= 0 ? `${Math.abs(delta).toFixed(1)} yrs younger` : `${delta.toFixed(1)} yrs older`) : undefined}
            secondary={`Biological Age (est.) ${bAge} yrs vs chronological age ${d.age}`}
          />
        </div>
      )}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconHeart size={20} />}
          title="Longevity Center"
          info="Your watch judges your day — this page judges your decade. VO₂max, resting heart rate, sleep & waist-to-hip ratio update themselves from Health Profile (Apple Health / WHOOP) and Body Composition."
          right={<button onClick={() => syncNow(false)} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">🔄 Sync devices</button>}
        />
        {syncNote && <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">{syncNote}</p>}
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
                  <div className="tinta-aksen text-4xl font-extrabold" style={{ ["--aksen" as string]: scoreColor }}>{score ?? '—'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Longevity Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Biological Age (est.)</div>
            <div className="text-4xl font-extrabold text-ink">{bAge ?? '—'}<span className="text-sm text-neutral-500"> yrs</span></div>
            {delta != null && (
              <Badge tone={delta <= 0 ? 'brand' : 'critical'}>
                {delta <= 0 ? `${Math.abs(delta).toFixed(1)} yrs younger 🎉` : `${delta.toFixed(1)} yrs older`}
              </Badge>
            )}
            <div className="mt-1 text-[10px] text-neutral-500">vs chronological age {isi.age ? d.age : '—'}</div>
          </div>
        </div>
        <BatasKlaimKesehatan permukaan="longevity.score" />
        {score == null && <p className="mt-3 text-center text-[11px] text-neutral-500" role="status">Fill in at least 4 pillars below{kurangDasar.length ? ` and enter your ${kurangDasar.join(' and ')}` : ''} to activate your score & biological age.</p>}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age"><KolomAngka ariaLabel="Age" nilai={isi.age ? d.age : undefined} onNilai={(n) => u({ age: n as number })} /></Field>
          <Field label="Sex">
            <select className={inputClass} value={isi.g ? d.g : ''} onChange={(e) => u({ g: e.target.value as 'M' | 'F' })}>
              <option value="" disabled>Select</option>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Pillars */}
      {/* ── Lapisan bukti ────────────────────────────────────────────────
          Ditaruh SEBELUM kartu skor komposit, dan itu disengaja. Skor
          komposit di bawah memakai bobot yang dikarang (0,22 untuk VO2max,
          0,13 untuk grip) dan rumus usia biologis yang tidak berasal dari
          penelitian mana pun. Kartu ini menampilkan besaran yang benar-benar
          dilaporkan penelitian beserta sumbernya, sehingga pembacanya dapat
          membedakan keduanya — dan itu tidak mungkin bila yang berdasar bukti
          diletakkan di bawah yang berdasar tebakan. */}
      <Fold label="Evidence">
      <Card className="!p-5">
        <SectionTitle
          icon={<span className="text-lg">🔬</span>}
          title="Numbers traceable to their source"
          subtitle="Only quantities research actually reports, each with its citation, cohort size, and uncertainty bounds"
        />
        <div className="mt-3">
          <PanelKebugaranIlmiah
            usia={isi.age && isi.g ? d.age : 0}
            jk={d.g === 'M' ? 'L' : 'P'}
            vo2={d.vo2 || otomatis.vo2}
            denyutIstirahat={d.rhr || otomatis.denyutIstirahat}
            denyutMaksTerukur={otomatis.denyutMaksTerukur}
            genggamKg={isi.g ? d.grip || undefined : undefined}
            langkahHarian={otomatis.langkahHarian}
            menitZona={otomatis.menitZona}
          />
          {otomatis.asal.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[10.5px] leading-snug text-neutral-500">
              {otomatis.asal.map((a) => <li key={a}>• {a}</li>)}
            </ul>
          )}
        </div>
      </Card>
      </Fold>

      <Fold label="Pillars">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="8 Longevity Pillars" subtitle="Long-term predictors that are genuinely established — BUT the weights combining them are the author’s choice, not a research finding" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          {num('VO₂max (ml/kg/min)', 'vo2', 0.1)}
          {num('Best grip (kg)', 'grip', 0.5)}
          {num('Chair-stand 30 sec (x)', 'chair30')}
          {num('One-leg balance (sec)', 'balance')}
          {num('Waist-Hip Ratio', 'whr', 0.01, 'e.g. 0.85')}
          {num('Resting HR (bpm)', 'rhr')}
          {num('Average sleep (hrs)', 'sleepH', 0.1)}
          <Field label="Smoking">
            <select className={inputClass} value={isi.smoke ? d.smoke : ''} onChange={(e) => u({ smoke: e.target.value as LongevityData['smoke'] })}>
              <option value="" disabled>Select</option>
              <option value="never">Never</option><option value="former">Quit</option><option value="current">Still smoking</option>
            </select>
          </Field>
          <Field label="Alcohol">
            <select className={inputClass} value={isi.alcohol ? d.alcohol : ''} onChange={(e) => u({ alcohol: +e.target.value as LongevityData['alcohol'] })}>
              <option value="" disabled>Select</option>
              <option value={0}>None</option><option value={1}>Occasional</option><option value={2}>Frequent</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {([['protein', '🥩 Protein ≥1.6 g/kg/day'], ['social', '🫂 Regular social connection'], ['purpose', '🎯 Has a sense of purpose (ikigai)']] as const).map(([k, l]) => (
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
              <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
                <span>{p.why}</span>
                <span className="shrink-0 font-bold">target {p.target}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </Fold>

      {/* Decade projection */}
      <Fold label="Projection">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Decade Projection — Train Your 80-Year-Old Self" subtitle="Untrained: VO₂max −10% per decade, muscle −8% per decade after age 30. Trained: half that." />
        {vo2Proj60 && vo2Proj80 ? (
          <div className="mt-2 space-y-3">
            <div className="rounded-2xl bg-ink p-4 text-white">
              <div className="text-xs font-bold text-ink/60">Your VO₂max is {d.vo2} now →</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase text-ink/50">Age 60</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-600">{vo2Proj60.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj60.trained.toFixed(0)}</span></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-ink/50">Age 80</div>
                  <div className="text-lg font-extrabold"><span className="text-rose-600">{vo2Proj80.untrained.toFixed(0)}</span> vs <span className="text-brand">{vo2Proj80.trained.toFixed(0)}</span></div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-ink/70">
                Independence threshold ≈18 (climbing stairs, carrying groceries). {vo2Proj80.untrained < 18 ? '⚠️ Without training, you are projected to fall BELOW the independence threshold by age 80 — the trained path keeps you above it.' : 'Both paths stay above the threshold — keep it up.'}
                {' '}Red = untrained · Green = trained regularly.
              </p>
            </div>
            {gripProj80 && (
              <div className="rounded-xl border border-neutral-100 p-3 text-[11px] text-neutral-600">
                ✊ Grip {d.grip}kg → age 80: <b className="text-rose-500">{gripProj80.untrained.toFixed(0)}kg</b> untrained vs <b className="text-brand-dark">{gripProj80.trained.toFixed(0)}kg</b> trained.
                Safe jar-opening/grip threshold ≈16-20kg.
              </div>
            )}
          </div>
        ) : <p className="mt-2 text-[11px] text-neutral-500">Fill in VO₂max (and grip) to see your projection at ages 60 & 80.</p>}
      </Card>
      </Fold>

      {/* Lab sharpening */}
      <Fold label="Labs">
      <Card className="!p-5">
        <SectionTitle icon={<span className="text-lg">🧪</span>} title="Lab markers (optional)" subtitle="Annual lab values can move this estimate. They do not validate it." />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('HbA1c (%)', 'hba1c', 0.1, '<5.4')}
          {num('LDL (mg/dL)', 'ldl', 1, '<115')}
          {num('hsCRP (mg/L)', 'crp', 0.1, '<1')}
          {num('Systolic (mmHg)', 'sbp', 1, '<118')}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          Markers above target add to your biological age (a heuristic inspired by PhenoAge — not a substitute for medical judgment).
          Discuss your lab results with your doctor; the <a href="#/chatbot" className="font-bold text-brand-dark underline">AI Consultation</a> feature can help you prepare questions.
        </p>
      </Card>
      </Fold>

      {/* Testing protocol */}
      <Fold label="Testing">
      <Card className="!p-5">
        <SectionTitle icon={<IconTimer size={20} />} title="Periodic Testing Protocol" subtitle="What gets measured improves — tick each item once it is done" />
        <div className="mt-2 space-y-2">
          {PROTOCOL.map((p) => {
            const last = d.tests[p.id]
            const dueMs = last ? new Date(last).getTime() + p.freqM * 30.4 * 86400000 : 0
            const overdue = !last || Date.now() > dueMs
            const dueTxt = last
              ? overdue ? 'OVERDUE' : `next ${new Date(dueMs).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
              : 'never done'
            return (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-neutral-100 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-neutral-500">every {p.freqM} mo · {p.where}</div>
                </div>
                <Badge tone={overdue ? 'critical' : 'brand'}>{dueTxt}</Badge>
                <button onClick={() => u({ tests: { ...d.tests, [p.id]: new Date().toISOString() } })}
                  className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-[10px] font-bold text-ink active:scale-95">✓ Done</button>
              </div>
            )
          })}
        </div>
      </Card>
      </Fold>

      <Fold label="Sources">
      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-xs leading-relaxed text-brand-dark">
        This page is a <b>complement</b> to your watch: Apple Watch/WHOOP answers "how was today?" —
        the Longevity Center answers "how will 30 years from now be?". Daily execution:
        {' '}<a href="#/readiness" className="font-bold underline">Recovery & Strain</a> ·
        {' '}<a href="#/training-plan" className="font-bold underline">AI Program</a> ·
        {' '}<a href="#/body" className="font-bold underline">Body Composition</a>.
        <br /><span className="text-[10px] opacity-70">References: Mandsager 2018 (JAMA), PURE study (grip), BMJ 2022 (flamingo balance), Rikli & Jones, Attia — Outlive. Educational estimate, not a diagnosis.</span>
      </div>
      </Fold>
    </div>
  )
}

export default Longevity
