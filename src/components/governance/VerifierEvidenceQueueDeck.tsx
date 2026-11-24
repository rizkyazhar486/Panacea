import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import {
  applyVerificationDecision,
  detectContradictionsAndDiff,
  runAutomatedContributionChecks,
  type ContributionSubmission,
  type EvidenceVerificationStatus,
} from '../../domains/human-review/knowledgeGovernanceEngine'

export default function VerifierEvidenceQueueDeck() {
  const { currentUser } = useStore()
  const [item, setItem] = useState<ContributionSubmission>({
    id: 'ver-q-1',
    kind: 'medication_formulary',
    title: 'Pembaruan Dosis Maksimal Ketorolac IGD',
    bodySummary: 'Ketorolac IV maksimal 5 hari penggunaan berturut-turut; pantau eGFR.',
    structuredFields: { dose: '30 mg IV/IM per 6–8 jam', durationMax: '5 hari', renalWarning: 'Hindari bila CrCl <30' },
    citation: 'ISO / MIMS Indonesia & PPK Manajemen Nyeri Akut',
    conflictOfInterest: 'Nihil',
    license: 'Pedoman Ringkas Klinis',
    authorName: 'dr. Kontributor',
    authorRole: 'kontributor',
    stage: 'Verification',
    verificationStatus: 'Automatically checked',
  })
  const [aiGuardMsg, setAiGuardMsg] = useState('')
  const [decisionNote, setDecisionNote] = useState('Diverifikasi sesuai batas maksimal 5 hari & risiko nefrotoksisitas.')
  const [credId, setCredId] = useState('STR-SP-VERIF-01')

  const diffReport = useMemo(
    () =>
      detectContradictionsAndDiff(item.structuredFields, {
        dose: '15–30 mg IV per 8 jam',
        durationMax: '3 hari',
        renalWarning: 'Hindari bila CrCl <30',
      }),
    [item.structuredFields],
  )
  const autoCheck = useMemo(() => runAutomatedContributionChecks(item), [item])

  function tryDecision(actorKind: 'ai' | 'human_specialist', targetStatus: EvidenceVerificationStatus) {
    const res = applyVerificationDecision(item, {
      actorKind,
      actorName: actorKind === 'ai' ? 'AI Copilot' : currentUser.name,
      credentialId: actorKind === 'human_specialist' ? credId : undefined,
      targetStatus,
      note: decisionNote,
      checksReport: autoCheck,
    })
    if (!res.ok) {
      setAiGuardMsg(`${res.code}: ${res.error}`)
      return
    }
    setAiGuardMsg('')
    setItem(res.updated)
  }

  return (
    <section
      aria-label="Verifier Evidence & Contradiction Queue"
      className="dark space-y-4 rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[11px] font-bold text-cyan-300">VERIFIER EVIDENCE OS · HUMAN SIGN-OFF REQUIRED</span>
          <h3 className="mt-1 text-base font-extrabold text-white">Diff Kanonik, Deteksi Kontradiksi &amp; Gerbang Clinically Reviewed</h3>
        </div>
        <span className="rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
          Status: {item.verificationStatus} ({item.stage})
        </span>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs">
        <div className="font-bold text-white">{item.title} · Sitasi: {item.citation}</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {diffReport.diffs.map((d) => (
            <div key={d.field} className="rounded-xl border border-white/10 bg-slate-950 p-2 font-mono text-[11px]">
              <div className="font-bold text-cyan-300">{d.field} ({d.change})</div>
              <div className="text-white/60">Kanonik: {d.existing}</div>
              <div className="text-amber-200">Usulan: {d.proposed}</div>
            </div>
          ))}
        </div>
        {diffReport.contradictions.map((c, i) => (
          <div key={i} className="rounded-lg bg-amber-500/15 px-2.5 py-1.5 font-mono text-[11px] text-amber-200">{c}</div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <input value={credId} onChange={(e) => setCredId(e.target.value)} placeholder="ID Kredensial Verifikator..." className="min-h-11 rounded-xl border border-white/15 bg-slate-900 px-3 font-mono text-white" />
        <input value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-white" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={() => tryDecision('ai', 'Clinically reviewed')} className="min-h-11 rounded-xl border border-amber-400/40 bg-slate-900 px-3 font-bold text-amber-200">Uji Tolak AI Auto-Approve</button>
        <button type="button" onClick={() => tryDecision('human_specialist', 'Evidence-supported')} className="min-h-11 rounded-xl bg-sky-600 px-3 font-bold text-white">Tandai Evidence-Supported</button>
        <button type="button" onClick={() => tryDecision('human_specialist', 'Clinically reviewed')} className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white">Approve Clinically Reviewed (Human)</button>
        <button type="button" onClick={() => tryDecision('human_specialist', 'Rejected')} className="min-h-11 rounded-xl bg-rose-700 px-3 font-bold text-white">Reject</button>
      </div>

      {aiGuardMsg && <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 font-mono text-xs text-rose-200">{aiGuardMsg}</div>}
    </section>
  )
}
