import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { submitDailyAnamnesis, type ContinuousCarePlan, type DailyAnamnesisSubmissionInput } from '../lib/continuousCareOperatingSystem'

// Dokter menyusun cek harian untuk satu pasien (lewat izin yang sama dengan
// berbagi lab) dan membaca laporan. Prioritas/aturan terpicu DIHITUNG ULANG di
// sini oleh kernel dari jawaban mentah — bukan dipercaya dari pasien. Aturan
// hanya yang ditulis dokter sendiri; aplikasi tidak menambah red flag.
type Q = { id: string; prompt: string; kind: 'boolean' | 'number' | 'text'; required: boolean; tandai: boolean }
const LABEL_PRIORITAS = { routine: 'Routine', 'review-today': 'Review today', 'immediate-human-review': 'Review now' } as const

export function RencanaHarianDokter({ izinId }: { izinId: string }) {
  const [data, setData] = useState<{ plan: ContinuousCarePlan | null; reports: DailyAnamnesisSubmissionInput[] } | null>(null)
  const [dx, setDx] = useState({ code: '', display: '' })
  const [qs, setQs] = useState<Q[]>([{ id: 'q1', prompt: '', kind: 'boolean', required: true, tandai: false }])
  const [galat, setGalat] = useState<string | null>(null)
  const muat = () => api.clinicianCare(izinId).then(setData).catch((e) => setGalat((e as Error).message))
  useEffect(() => { void muat() }, [izinId])

  const simpan = () => api.createCarePlan(izinId, {
    diagnosisRefs: [{ system: 'local', code: dx.code || dx.display, display: dx.display, verificationStatus: 'provisional' }],
    questions: qs.map(({ id, prompt, kind, required }) => ({ id, prompt, kind, required })),
    patientReportedReviewRules: qs.filter((q) => q.kind === 'boolean' && q.tandai).map((q) => ({
      label: `Patient answered yes: ${q.prompt}`, questionId: q.id, operator: 'equals', value: true, priority: 'review-today',
      rationale: 'Clinician-authored: flag a "yes" answer for same-day review.',
    })),
  }).then(() => { setGalat(null); void muat() }).catch((e) => setGalat((e as Error).message))

  if (!data) return null
  const plan = data.plan
  return (
    <div className="mt-3 border-t border-white/10 pt-3" data-care-plan>
      <h3 className="text-[12px] font-black">Daily follow-up</h3>
      {!plan ? (
        <div className="mt-1.5 grid gap-1.5">
          <input value={dx.display} onChange={(e) => setDx({ ...dx, display: e.target.value })} placeholder="Diagnosis being followed" aria-label="Diagnosis being followed"
            className="rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-[12px] text-white" />
          {qs.map((q, i) => (
            <div key={q.id} className="grid gap-1 rounded-lg border border-white/10 p-2">
              <input value={q.prompt} onChange={(e) => setQs(qs.map((x, k) => (k === i ? { ...x, prompt: e.target.value } : x)))} placeholder={`Question ${i + 1}`} aria-label={`Question ${i + 1}`}
                className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-[12px] text-white" />
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                <select value={q.kind} aria-label={`Answer type ${i + 1}`} onChange={(e) => setQs(qs.map((x, k) => (k === i ? { ...x, kind: e.target.value as Q['kind'], tandai: false } : x)))}
                  className="rounded-md border border-white/15 bg-transparent px-1 py-0.5 text-white">
                  <option value="boolean">Yes / No</option><option value="number">Number</option><option value="text">Text</option>
                </select>
                <label><input type="checkbox" checked={q.required} onChange={(e) => setQs(qs.map((x, k) => (k === i ? { ...x, required: e.target.checked } : x)))} /> required</label>
                {q.kind === 'boolean' && <label><input type="checkbox" checked={q.tandai} onChange={(e) => setQs(qs.map((x, k) => (k === i ? { ...x, tandai: e.target.checked } : x)))} /> flag "yes" for review today</label>}
              </div>
            </div>
          ))}
          <div className="flex gap-1.5">
            {qs.length < 20 && <button type="button" className="min-h-9 rounded-full px-3 text-[11px] font-bold" onClick={() => setQs([...qs, { id: `q${qs.length + 1}`, prompt: '', kind: 'boolean', required: true, tandai: false }])}>+ Question</button>}
            <button type="button" className="ml-auto min-h-9 rounded-full px-3 text-[11px] font-black" onClick={() => void simpan()}>Start daily check-in</button>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <p className="text-[11px] text-white/55">{plan.diagnosisRefs.map((d) => d.display).join(', ')} · {plan.questions.length} question{plan.questions.length > 1 ? 's' : ''} daily</p>
          {data.reports.length === 0 && <p className="text-[11px] text-white/45">No check-ins yet.</p>}
          <ul className="mt-1 divide-y divide-white/10">
            {[...data.reports].reverse().slice(0, 7).map((r) => {
              let hasil: ReturnType<typeof submitDailyAnamnesis> | null = null
              try { hasil = submitDailyAnamnesis(plan, r) } catch { /* laporan tak cocok rencana: tampil sebagai tak terbaca */ }
              return (
                <li key={r.id} className="py-1.5 text-[11px]" data-care-report={hasil?.workflowPriority ?? 'invalid'}>
                  <span className="font-bold">{r.scheduledFor.slice(0, 10)}</span>{' · '}
                  {hasil ? (
                    <span className={hasil.workflowPriority === 'routine' ? 'text-white/60' : 'font-bold text-amber-300'}>
                      {LABEL_PRIORITAS[hasil.workflowPriority]}{hasil.completion === 'incomplete' ? ' · incomplete' : ''}
                    </span>
                  ) : <span className="text-rose-300">does not match the plan</span>}
                  <span className="block text-white/55">
                    {r.answers.map((a) => `${plan.questions.find((q) => q.id === a.questionId)?.prompt ?? a.questionId}: ${a.value === true ? 'Yes' : a.value === false ? 'No' : a.value}`).join(' · ')}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-[10px] text-white/40">Patient-reported, not verified; priority comes only from rules you wrote.</p>
        </div>
      )}
      {galat && <p role="alert" className="mt-1 text-[11px] font-bold text-amber-300">{galat}</p>}
    </div>
  )
}

export default RencanaHarianDokter
