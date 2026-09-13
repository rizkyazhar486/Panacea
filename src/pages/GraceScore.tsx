import { useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { getDemoTersimpan } from '../lib/profile'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// GRACE Score (in-hospital mortality) — Granger, C.B., et al. (2003),
// Arch Intern Med, 163(19):2345-2353. Risk of in-hospital death across the
// full ACS spectrum (STEMI, NSTEMI, UA) from 8 admission variables, using
// the original published point table. Risk categories (registry convention):
//   ≤108 low (<1%), 109-140 intermediate (1-3%), >140 high (>3%).
// Complements the TIMI UA/NSTEMI score elsewhere in this app — GRACE covers
// all ACS and is preferred in ESC guidance for invasive-timing decisions.
// Pure lookup-table arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function agePts(v: number): number {
  if (v < 30) return 0
  if (v < 40) return 8
  if (v < 50) return 25
  if (v < 60) return 41
  if (v < 70) return 58
  if (v < 80) return 75
  if (v < 90) return 91
  return 100
}
function hrPts(v: number): number {
  if (v < 50) return 0
  if (v < 70) return 3
  if (v < 90) return 9
  if (v < 110) return 15
  if (v < 150) return 24
  if (v < 200) return 38
  return 46
}
function sbpPts(v: number): number {
  if (v < 80) return 58
  if (v < 100) return 53
  if (v < 120) return 43
  if (v < 140) return 34
  if (v < 160) return 24
  if (v < 200) return 10
  return 0
}
function creatPts(v: number): number {
  if (v < 0.4) return 1
  if (v < 0.8) return 4
  if (v < 1.2) return 7
  if (v < 1.6) return 10
  if (v < 2.0) return 13
  if (v < 4.0) return 21
  return 28
}
const KILLIP_PTS = [0, 20, 39, 59] // class I-IV

function band(score: number): { label: string; tone: 'brand' | 'low' | 'critical'; mortality: string } {
  if (score <= 108) return { label: 'Low risk', tone: 'brand', mortality: '<1% in-hospital mortality' }
  if (score <= 140) return { label: 'Intermediate risk', tone: 'low', mortality: '1-3% in-hospital mortality' }
  return { label: 'High risk', tone: 'critical', mortality: '>3% in-hospital mortality' }
}

export function GraceScore() {
  // GRACE menentukan waktu strategi invasif pada sindrom koroner akut.
  // Halaman ini dahulu terbuka pada usia 60 (atau 30 dari getDemo()), nadi
  // 75, TD 130 dan kreatinin 1,0 -- empat pengukuran yang tidak pernah
  // diambil -- lalu mencetak skor, pita risiko, angka kematian di rumah
  // sakit, dan kalimat siap salin untuk pasien yang tidak ada.
  //
  // Killip I, tanpa henti jantung, tanpa deviasi ST dan tanpa penanda adalah
  // jawaban yang SAH dan bernilai nol; keempatnya tetap seperti semula.
  // Yang dihapus hanya keempat pengukurannya.
  const tersimpan = getDemoTersimpan()
  const [age, setAge] = useState(() => (tersimpan.age && tersimpan.age > 0 ? tersimpan.age : 0))
  const [hr, setHr] = useState(0)
  const [sbp, setSbp] = useState(0)
  const [creat, setCreat] = useState(0)
  const [killip, setKillip] = useState(0)
  const [arrest, setArrest] = useState(false)
  const [stDev, setStDev] = useState(false)
  const [markers, setMarkers] = useState(false)

  const belum: string[] = []
  if (!(age > 0)) belum.push('age')
  if (!(hr > 0)) belum.push('heart rate')
  if (!(sbp > 0)) belum.push('systolic BP')
  if (!(creat > 0)) belum.push('creatinine')
  const lengkap = belum.length === 0

  const score =
    agePts(age) + hrPts(hr) + sbpPts(sbp) + creatPts(creat) + KILLIP_PTS[killip] +
    (arrest ? 39 : 0) + (stDev ? 28 : 0) + (markers ? 14 : 0)
  const result = lengkap ? band(score) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="GRACE Score" subtitle="ACS in-hospital mortality (Granger et al. 2003)" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Mencakup seluruh rentang sindrom koroner akut (STEMI, NSTEMI, angina tidak stabil) dan lebih dianjurkan dalam panduan ESC untuk menentukan waktu strategi invasif — melengkapi skor TIMI yang khusus untuk UA/NSTEMI.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={18} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Heart rate (bpm)">
            <input className={inputClass} type="number" min={0} value={hr || ''} onChange={(e) => setHr(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbp || ''} onChange={(e) => setSbp(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Creatinine (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={creat || ''} onChange={(e) => setCreat(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Killip class">
            <select className={inputClass} value={killip} onChange={(e) => setKillip(Number(e.target.value))}>
              <option value={0}>I — no heart failure (0 pt)</option>
              <option value={1}>II — rales / elevated JVP (20 pt)</option>
              <option value={2}>III — pulmonary edema (39 pt)</option>
              <option value={3}>IV — cardiogenic shock (59 pt)</option>
            </select>
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={arrest} onChange={(e) => setArrest(e.target.checked)} className="h-4 w-4 rounded" />
            Cardiac arrest at admission (+39)
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={stDev} onChange={(e) => setStDev(e.target.checked)} className="h-4 w-4 rounded" />
            ST-segment deviation (+28)
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} className="h-4 w-4 rounded" />
            Elevated cardiac biomarkers (+14)
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">GRACE Score</div>
        {lengkap && result !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{score}</span>
              <Badge tone={result.tone}>{result.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              {result.mortality}. Categories: ≤108 low · 109-140 intermediate · {'>'}140 high. In NSTE-ACS,
              higher GRACE risk supports an earlier invasive strategy per ESC guidance.
            </p>
            <CopyNote text={`GRACE ${score} (age ${age}, HR ${hr}, SBP ${sbp}, Cr ${creat}, Killip ${['I', 'II', 'III', 'IV'][killip]}${arrest ? ', cardiac arrest at admission' : ''}${stDev ? ', ST deviation' : ''}${markers ? ', elevated biomarkers' : ''}) — ${result.label.toLowerCase()}, ${result.mortality} [Granger 2003]`} />
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. Still needed: {belum.join(', ')}.
            {' '}Killip I with no arrest, no ST deviation and no raised biomarkers is a real answer worth zero points
            and stays as it is — but the four measurements are not answers until someone takes them, and this score
            can move the timing of an invasive strategy.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Granger, C.B., et al. (2003). Predictors of hospital mortality in the Global Registry of
        Acute Coronary Events. <i>Arch Intern Med</i>, 163(19), 2345-2353. Decision-support estimate
        using the original in-hospital mortality point table (GRACE 2.0 uses a continuous online model).
      </div>
    </div>
  )
}

export default GraceScore
