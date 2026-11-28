import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import {
  assertRoleDataBoundary,
  runAutomatedContributionChecks,
  type ContributionKind,
  type ContributionSubmission,
} from '../../domains/human-review/knowledgeGovernanceEngine'

const CONTRIB_KINDS: readonly { id: ContributionKind; label: string }[] = [
  { id: 'knowledge_note', label: 'Materi / Catatan Klinis' },
  { id: 'medication_formulary', label: 'Usulan Obat / Kardeks Formularium' },
  { id: 'vaccine_schedule', label: 'Jadwal Vaksinasi' },
  { id: 'calculator', label: 'Formula Kalkulator Klinis' },
  { id: 'emr_template', label: 'Template EMR' },
  { id: 'facility_template', label: 'Template Denah Fasilitas' },
]

export default function ContributorGovernanceDeck() {
  const { currentUser } = useStore()
  const [kind, setKind] = useState<ContributionKind>('medication_formulary')
  const [title, setTitle] = useState('Usulan Padanan Formularium Kardeks Diuretik')
  const [bodySummary, setBodySummary] = useState('Furosemide 20 mg/2 mL IV · pantau kalium serum & tekanan darah.')
  const [citation, setCitation] = useState('FORNAS Kemenkes RI & PPK Jantung PERKI')
  const [coi, setCoi] = useState('Tidak ada konflik kepentingan finansial.')
  const [license, setLicense] = useState('CC-BY-4.0 / Ringkasan Pedoman Resmi')
  const [submittedList, setSubmittedList] = useState<ContributionSubmission[]>([])

  const draftSubmission: ContributionSubmission = useMemo(
    () => ({
      id: `sub-${submittedList.length + 1}`,
      kind,
      title,
      bodySummary,
      structuredFields: { dose: '20–40 mg IV/PO', monitor: 'K+ & tekanan darah' },
      citation,
      conflictOfInterest: coi,
      license,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      stage: 'Submitted',
      verificationStatus: 'Automatically checked',
    }),
    [submittedList.length, kind, title, bodySummary, citation, coi, license, currentUser],
  )

  const checkReport = useMemo(() => runAutomatedContributionChecks(draftSubmission), [draftSubmission])
  const boundaryTest = useMemo(() => assertRoleDataBoundary('kontributor', 'patient_record'), [])

  return (
    <section
      aria-label="Contributor Knowledge Governance Pipeline"
      className="dark space-y-4 rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[11px] font-bold text-emerald-300">CONTRIBUTOR GOVERNANCE OS · ZERO PATIENT PHI ACCESS</span>
          <h3 className="mt-1 text-base font-extrabold text-white">Pengajuan Pengetahuan, Formularium &amp; Template Tervalidasi</h3>
        </div>
        <span className="rounded-lg border border-amber-400/35 bg-slate-900 px-3 py-1 font-mono text-[11px] text-amber-200">
          RBAC Kontributor → Rekam Pasien: {boundaryTest.statusCode} DENIED
        </span>
      </div>

      <div className="grid gap-3 text-xs sm:grid-cols-2">
        <label className="text-white/80">
          Jenis Kontribusi
          <select value={kind} onChange={(e) => setKind(e.target.value as ContributionKind)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-white">
            {CONTRIB_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-white/80">
          Judul Kontribusi
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-white" />
        </label>
        <label className="text-white/80 sm:col-span-2">
          Konten Terstruktur (otomatis dipindai guard PHI &amp; keselamatan)
          <textarea rows={2} value={bodySummary} onChange={(e) => setBodySummary(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 p-2.5 text-white" />
        </label>
        <label className="text-white/80">Sitasi / Sumber<input value={citation} onChange={(e) => setCitation(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-white" /></label>
        <label className="text-white/80">Conflict of Interest &amp; Lisensi<input value={`${coi} · ${license}`} onChange={(e) => { setCoi(e.target.value); setLicense('Tercatat') }} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-white" /></label>
      </div>

      <div className={`rounded-xl border p-3 text-xs ${checkReport.passedAll ? 'border-emerald-400/40 bg-slate-900 text-emerald-200' : 'border-rose-400/50 bg-slate-900 text-rose-200'}`}>
        <div className="font-mono font-bold">{checkReport.passedAll ? 'AUTOMATED CHECKS: LOLOS KE ANTREAN VERIFIER' : 'AUTOMATED CHECKS: PERLU REVISI'}</div>
        {checkReport.findings.map((f, i) => <div key={i} className="mt-1">{f}</div>)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-white/70">Antrean terkirim sesi ini: {submittedList.length}</span>
        <button
          type="button"
          disabled={!checkReport.passedAll}
          onClick={() => setSubmittedList((p) => [{ ...draftSubmission, stage: 'Verification' }, ...p])}
          className="min-h-11 rounded-xl bg-emerald-600 px-4 font-bold text-white disabled:opacity-40"
        >
          Kirim ke Antrean Verifikator
        </button>
      </div>
    </section>
  )
}
