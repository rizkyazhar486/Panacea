import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { ScoreTrend } from '../../../components/ScoreTrend'
import { getHealthCache, hasHealth } from '../../../lib/profile'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { news2, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// NEWS2 (National Early Warning Score 2) — Royal College of Physicians (2017).
// Standard ward-based physiological deterioration score, aggregating 7 vital
// signs into a single trigger for escalation. Pure threshold scoring, no
// external API. Uses SpO2 Scale 1 (normal target range) — a separate Scale 2
// exists for patients with hypercapnic respiratory failure on a lower target
// range, not implemented here.
// ─────────────────────────────────────────────────────────────────────────────

export function News2Score() {
  // NEWS2 adalah pemicu eskalasi di samping tempat tidur. Sebelum ini halaman
  // itu terbuka pada RR 16, SpO2 98, TD 120, nadi 75, sadar penuh dan suhu
  // 37,0 -- keenam angka yang kebetulan berjumlah NOL -- lalu menampilkan
  // "Low risk" beserta anjuran "Routine monitoring per ward protocol", dan
  // menyimpan skor itu sebagai satu titik tren di perangkat. Ketenangan itu
  // dikarang untuk pasien yang belum diperiksa siapa pun.
  //
  // Nadi masih boleh terisi dari cache kesehatan, karena itu memang bacaan
  // yang benar-benar ada; hanya nilai bawaan 75-nya yang dihapus.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [rrText, setRr] = useState('')
  const [spo2Text, setSpo2] = useState('')
  const [onOxygen, setOnOxygen] = useState(false)
  const [sbpText, setSbp] = useState('')
  const [hrText, setHr] = useState(() => {
    const v = getHealthCache().restingHr
    return typeof v === 'number' && v > 0 ? String(v) : ''
  })
  const hrFromDevice = hasHealth('restingHr')
  const [alert, setAlert] = useState(true)
  const [tempText, setTemp] = useState('')

  const rr = parseNumberField(rrText)
  const spo2 = parseNumberField(spo2Text)
  const sbp = parseNumberField(sbpText)
  const hr = parseNumberField(hrText)
  const temp = parseNumberField(tempText)
  const hasil = news2({ rr, spo2, sbp, hr, temp, onOxygen, alert })
  const belum = hasil.missing
  const lengkap = hasil.total !== null
  const rows = hasil.rows
  const total = hasil.total ?? 0
  const result = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="NEWS2 Score" subtitle="National Early Warning Score — ward deterioration risk (RCP 2017)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Combines 7 routine vital signs into a single escalation trigger. Widely used across UK and international hospital wards to standardize the response to acute deterioration.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Respiration rate (/min)">
            <input className={inputClass} type="number" min={0} value={rrText} onChange={(e) => setRr(e.target.value)} />
          </Field>
          <Field label="SpO₂ (%)">
            <input className={inputClass} type="number" min={0} max={100} value={spo2Text} onChange={(e) => setSpo2(e.target.value)} />
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbpText} onChange={(e) => setSbp(e.target.value)} />
          </Field>
          <Field label={hrFromDevice ? 'Pulse (bpm) — prefilled from Health Profile' : 'Pulse (bpm)'}>
            <input className={inputClass} type="number" min={0} value={hrText} onChange={(e) => setHr(e.target.value)} />
          </Field>
          <Field label="Temperature (°C)">
            <input className={inputClass} type="number" step="0.1" value={tempText} onChange={(e) => setTemp(e.target.value)} />
          </Field>
        </div>
        {hrFromDevice && (
          <Prosa kelas="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">Pulse is pre-filled from your synced resting heart rate — for assessing someone else (or an acute assessment), replace it with a pulse measured at the time.</Prosa>
        )}
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={onOxygen} onChange={(e) => setOnOxygen(e.target.checked)} className="h-4 w-4 rounded" />
          Requires supplemental oxygen
        </label>
        <label className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="h-4 w-4 rounded" />
          Alert (uncheck if confused, responds only to voice/pain, or unresponsive — AVPU)
        </label>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
      </Card>

      {lengkap && (
      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Per-parameter breakdown</div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div className="text-sm font-bold text-ink dark:text-ink">{r.name}</div>
              <div className="text-lg font-black text-brand-dark">{r.pts}</div>
            </div>
          ))}
        </div>
      </Card>
      )}

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Total NEWS2 Score</div>
        {lengkap && result !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{total}</span>
              <Badge tone={result.tone}>{result.label}</Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">{result.action}</p>
            <CopyNote text={`NEWS2 ${total} (RR ${rr}, SpO2 ${spo2}%${onOxygen ? ' on supplemental O2' : ' on air'}, SBP ${sbp}, HR ${hr}, ${alert ? 'alert' : 'AVPU<A'}, T ${temp.toFixed(1)}°C) — ${result.label.toLowerCase()}: ${result.action} [RCP 2017]`} />
          </>
        ) : hasil.invalid.length > 0 ? null : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. Still needed: {belum.join(', ')}.
            {' '}NEWS2 is an escalation trigger, so an unmeasured observation is left blank rather than assumed normal —
            a full set of normal-looking defaults scores 0 and reads as "low risk, routine monitoring" for a patient
            nobody has assessed.
          </p>
        )}
      </Card>

      {lengkap && (
        <ScoreTrend
          storageKey="pmd_news2_trend_v1"
          scoreName="NEWS2"
          total={total}
          maxScore={20}
          detail={`RR ${rr}, SpO₂ ${spo2}%${onOxygen ? ' on O₂' : ''}, SBP ${sbp}, HR ${hr}, ${alert ? 'alert' : 'not alert'}, T ${temp.toFixed(1)}°C`}
        />
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Royal College of Physicians (2017). National Early Warning Score (NEWS) 2. Decision-support
        estimate — uses SpO₂ Scale 1 (not the alternate Scale 2 for hypercapnic respiratory failure);
        always follow your institution's escalation protocol.
      </div>
    </div>
  )
}

export default News2Score
