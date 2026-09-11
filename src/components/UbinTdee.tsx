import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDemo } from '../lib/profile'
import { useVitalField } from '../lib/useVitals'
import {
  hitungTdee,
  TUJUAN_GIZI,
  AKTIVITAS_GIZI,
  type TujuanGizi,
  type TingkatAktivitas,
} from '../lib/tdee'
import '../styles/widget-concepts-v6.css'

const KUNCI = 'pmd_tdee_pilihan_v1'

interface Pilihan {
  tujuan: TujuanGizi
  aktivitas: TingkatAktivitas
}

function muatPilihan(): Pilihan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pilihan>
      const tujuan = TUJUAN_GIZI.some((t) => t.id === p.tujuan) ? (p.tujuan as TujuanGizi) : 'rawat'
      const aktivitas = AKTIVITAS_GIZI.some((a) => a.id === p.aktivitas)
        ? (p.aktivitas as TingkatAktivitas)
        : 'sedang'
      return { tujuan, aktivitas }
    }
  } catch {
    /* storage unavailable */
  }
  return { tujuan: 'rawat', aktivitas: 'sedang' }
}

function simpanPilihan(p: Pilihan) {
  try { localStorage.setItem(KUNCI, JSON.stringify(p)) } catch { /* ignore */ }
}

export function UbinTdee() {
  const demo = useMemo(() => getDemo(), [])
  const [berat] = useVitalField('weightKg', demo.weightKg || 0)
  const [tinggi] = useVitalField('heightCm', demo.heightCm || 0)
  const [pilihan, setPilihan] = useState<Pilihan>(muatPilihan)
  const umur = demo.age || 0
  const lengkap = berat > 0 && tinggi > 0 && umur > 0

  const h = useMemo(
    () => hitungTdee({
      beratKg: berat,
      tinggiCm: tinggi,
      umur,
      sex: demo.sex,
      tujuan: pilihan.tujuan,
      aktivitas: pilihan.aktivitas,
    }),
    [berat, tinggi, umur, demo.sex, pilihan],
  )

  function ubah(p: Partial<Pilihan>) {
    const baru = { ...pilihan, ...p }
    setPilihan(baru)
    simpanPilihan(baru)
  }

  if (!lengkap) {
    return (
      <section className="pw-concept">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Metabolic compass</h2>
          <Link to="/profil" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Complete profile →</Link>
        </div>
        <p className="t-kecil leading-snug text-neutral-500">Weight, height and age are needed before Panacea can build your energy compass.</p>
      </section>
    )
  }

  const makro = [
    { l: 'Protein', g: h.proteinG, pct: h.pctP, color: '#10b981' },
    { l: 'Carbs', g: h.karboG, pct: h.pctK, color: '#38bdf8' },
    { l: 'Fat', g: h.lemakG, pct: h.pctL, color: '#f59e0b' },
  ]
  const ringPct = Math.max(0, Math.min(100, Math.round((h.target / Math.max(1, h.tdee)) * 100)))

  return (
    <section className="pw-concept pw-metabolic">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="t-mikro font-black uppercase tracking-[.15em] text-teal-500">Metabolic compass</div>
          <div className="t-kecil mt-1 font-bold text-neutral-500">Daily energy direction, not a calorie verdict</div>
        </div>
        <Link to="/macro-lab" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Open →</Link>
      </div>

      <div className="pw-metabolic-top">
        <div>
          <div className="pw-metabolic-target text-ink dark:text-white">{h.target.toLocaleString()}</div>
          <div className="pw-metabolic-sub">kcal target today</div>
        </div>
        <div className="pw-metabolic-ring" style={{ '--p': ringPct } as React.CSSProperties} aria-label={`${ringPct}% of maintenance energy`}>
          <div className="pw-metabolic-ring-center">
            <span className="pw-metabolic-ring-big text-ink dark:text-white">{ringPct}%</span>
            <span className="pw-metabolic-ring-small">of TDEE</span>
          </div>
        </div>
      </div>

      <div className="pw-metabolic-baseline">
        <div>
          <div className="pw-metabolic-key">Resting engine</div>
          <div className="pw-metabolic-value text-ink dark:text-white">{h.bmr.toLocaleString()} kcal</div>
        </div>
        <div>
          <div className="pw-metabolic-key">Maintenance field</div>
          <div className="pw-metabolic-value text-ink dark:text-white">{h.tdee.toLocaleString()} kcal</div>
        </div>
      </div>

      <div>
        <div className="pw-macro-road" aria-hidden>
          {makro.map((m) => <span key={m.l} style={{ width: `${m.pct}%`, background: m.color }} />)}
        </div>
        <div className="pw-macro-legend mt-2">
          {makro.map((m) => (
            <div key={m.l} className="pw-macro-item">
              <span className="pw-macro-name">{m.l}</span>
              <span className="pw-macro-grams text-ink dark:text-white">{m.g} g</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[9px] font-bold text-neutral-500">
        <span>Fibre {h.seratG} g</span>
        <span>Water {h.airL} L</span>
        <span>Protein range {h.proteinLo}-{h.proteinHi} g</span>
      </div>

      <div className="pw-metabolic-controls">
        {TUJUAN_GIZI.map((t) => (
          <button key={t.id} onClick={() => ubah({ tujuan: t.id })} aria-pressed={pilihan.tujuan === t.id} className="pw-metabolic-chip">
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {AKTIVITAS_GIZI.map((a) => (
          <button key={a.id} onClick={() => ubah({ aktivitas: a.id })} aria-pressed={pilihan.aktivitas === a.id} className="pw-metabolic-chip flex-1">
            {a.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default UbinTdee
