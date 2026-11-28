import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'

type DoctorModeId = 'IGD' | 'Ward' | 'Outpatient' | 'Specialist' | 'Surgeon' | 'ICU' | 'Research' | 'On-Call' | 'Telemedicine'

const DOCTOR_MODES: readonly {
  readonly id: DoctorModeId
  readonly focusLabel: string
  readonly primaryRoute: string
  readonly secondaryRoute: string
}[] = [
  { id: 'IGD', focusLabel: 'Triase cepat, Denah 16-Bed IGD, Quick Consult DPJP & Checklist Rujukan', primaryRoute: '/hospitals', secondaryRoute: '/emr' },
  { id: 'Ward', focusLabel: 'Visite Bangsal, Kardeks DPJP <-> SIMRS, CPPT SOAP & Balance Cairan', primaryRoute: '/emr', secondaryRoute: '/med-study?bagian=invictus-hub' },
  { id: 'Outpatient', focusLabel: 'Poli RJTL, Analisis Codemax Klaim, Kontrol & E-Edukasi Pasien', primaryRoute: '/emr', secondaryRoute: '/planning' },
  { id: 'Specialist', focusLabel: 'Pengkajian Subspesialis (§19 A–K), Penunjang & Antropometri', primaryRoute: '/emr', secondaryRoute: '/med-study?bagian=invictus-hub' },
  { id: 'Surgeon', focusLabel: 'Jadwal Kamar Operasi (OK), Konflik Multi-Sumber & WHO Checklist', primaryRoute: '/planning', secondaryRoute: '/hospitals' },
  { id: 'ICU', focusLabel: 'Pemantauan Kritis, Ventilator 96.71/96.72 Guard & Group J Claim Shield', primaryRoute: '/emr', secondaryRoute: '/hospitals' },
  { id: 'Research', focusLabel: 'Studi Validasi, Evidence Registry & Kontribusi Pengetahuan Terkurasi', primaryRoute: '/med-study', secondaryRoute: '/frontier-health' },
  { id: 'On-Call', focusLabel: 'Keep Tugas Jaga, Handover SBAR/ISBAR & Alarm TTV Kritis', primaryRoute: '/planning', secondaryRoute: '/emr' },
  { id: 'Telemedicine', focusLabel: 'Konsultasi Jarak Jauh & Ringkasan Pasien Terstandar (Draft)', primaryRoute: '/visit-os', secondaryRoute: '/emr' },
]

export default function DoctorModeSwitcherDock() {
  const { activePatient, state } = useStore()
  const [activeMode, setActiveMode] = useState<DoctorModeId>('IGD')
  const modeMeta = DOCTOR_MODES.find((m) => m.id === activeMode) ?? DOCTOR_MODES[0]
  const rec = state.records[activePatient.id]

  return (
    <section
      aria-label="Doctor Contextual Mode Switcher"
      className="dark space-y-3 rounded-2xl border border-white/15 bg-[#070d18] p-4 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            ONE CANONICAL PATIENT STATE · CONTEXTUAL DOCTOR MODES
          </span>
          <h3 className="text-sm font-extrabold text-white">
            Pasien Aktif: {activePatient.name} {rec?.primaryDiagnosis?.code ? `(${rec.primaryDiagnosis.code})` : ''}
          </h3>
        </div>
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-emerald-300">Mode: {activeMode}</span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist">
        {DOCTOR_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={activeMode === m.id}
            onClick={() => setActiveMode(m.id)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
              activeMode === m.id ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-white/75'
            }`}
          >
            {m.id}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900 p-3 text-xs">
        <p className="text-white/85">{modeMeta.focusLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Link to={modeMeta.primaryRoute} className="inline-flex min-h-11 items-center rounded-xl bg-cyan-600 px-3 font-bold text-white">Buka Ruang Utama →</Link>
          <Link to={modeMeta.secondaryRoute} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">Alur Terkait ↗</Link>
        </div>
      </div>
    </section>
  )
}
