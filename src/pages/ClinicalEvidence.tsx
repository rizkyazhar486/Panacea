import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconSearch, IconShield, IconChartUp, IconStethoscope } from '../components/icons'
import { useStore } from '../lib/store'
import {
  askClinicalEvidence, verificationLinks, evidenceAvailable,
  STRENGTH_META, CERTAINTY_META, type EvidenceAnswer,
  claimFounderIfEligible, evidenceGate, recordFreeQuery,
  EVIDENCE_PRICE_PNC, EVIDENCE_FREE_ALLOWANCE, type EvidenceGate,
} from '../lib/evidence'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Evidence — ask a clinical question, get a structured, graded,
// source-aware answer (UpToDate / AMBOSS / OpenEvidence style). Works globally:
// no US-NPI or country license gate, synthesis via the app's server-side AI,
// and every answer ships with live PubMed/Cochrane/ClinicalTrials/NICE/WHO
// verification links so any clinician anywhere can check the primary sources.
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLES = [
  'First-line antihypertensive in an adult with type 2 diabetes and albuminuria?',
  'Is tranexamic acid beneficial in postpartum hemorrhage?',
  'Empiric antibiotics for community-acquired pneumonia in a healthy adult outpatient?',
  'Does tight glycemic control reduce cardiovascular events in type 2 diabetes?',
  'Anticoagulation choice in non-valvular atrial fibrillation with normal renal function?',
]

const POPULATIONS = ['', 'Adult', 'Pediatric', 'Pregnancy', 'Geriatric', 'Neonatal']

function CertaintyBar({ c }: { c: EvidenceAnswer['overallCertainty'] }) {
  const pct = c === 'high' ? 100 : c === 'moderate' ? 70 : c === 'low' ? 40 : 20
  const color = c === 'high' ? '#00BF63' : c === 'moderate' ? '#22c55e' : c === 'low' ? '#f59e0b' : '#ef4444'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function ClinicalEvidence() {
  const { state, spendPnc } = useStore()
  const wallet = state.wallet
  const [q, setQ] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [population, setPopulation] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [answer, setAnswer] = useState<EvidenceAnswer | null>(null)
  const [gate, setGate] = useState<EvidenceGate>(() => evidenceGate())
  const [topupNeeded, setTopupNeeded] = useState(false)

  // Grant one of the first-10 founder slots on first visit, then read the gate.
  useEffect(() => { claimFounderIfEligible(); setGate(evidenceGate()) }, [])

  async function ask(question?: string) {
    const text = (question ?? q).trim()
    if (!text) return
    if (question) setQ(question)
    setErr(''); setTopupNeeded(false)

    // Access control: founders are free; others use their free allowance, then
    // pay 150 PNC per query from the wallet.
    const g = evidenceGate()
    let paid = false
    if (!g.founder && g.needsPayment) {
      if (wallet.balance < EVIDENCE_PRICE_PNC) { setTopupNeeded(true); return }
      const res = spendPnc(EVIDENCE_PRICE_PNC, `Clinical Evidence query (${EVIDENCE_PRICE_PNC} PNC)`)
      if (!res.ok) { setTopupNeeded(true); return }
      paid = true
    }

    setLoading(true); setAnswer(null)
    try {
      const a = await askClinicalEvidence(text, { specialty, population, region })
      setAnswer(a)
      // Only consume a free-allowance credit on success and when not a founder/paid.
      if (!g.founder && !paid) recordFreeQuery()
      setGate(evidenceGate())
    } catch (e) {
      // Refund the free-allowance credit is automatic (we only record on success);
      // a paid query that failed to synthesize is not re-charged again.
      const msg = String(e instanceof Error ? e.message : e)
      if (msg.includes('backend_unavailable')) setErr('The AI service is not configured on this deployment yet. You can still use the verification links below to search the primary literature.')
      else if (msg.includes('parse_failed')) setErr('The evidence engine returned an unexpected format. Please rephrase the question and try again.')
      else setErr('Could not complete the evidence lookup. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  const links = q.trim() ? verificationLinks(q) : []

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {/* Header + ask box */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconStethoscope size={20} />}
          title="Clinical Evidence"
          subtitle="Ask a clinical question — get a structured, graded, source-aware answer. Works in any country; every answer links to the primary literature to verify."
        />
        {!evidenceAvailable() && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            AI synthesis isn't configured on this deployment — the verification links still work for searching the literature directly.
          </p>
        )}

        {/* Access status */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {gate.founder ? (
            <Badge tone="brand">🎉 Founding user — unlimited free forever</Badge>
          ) : gate.freeRemaining > 0 ? (
            <Badge tone="low">{gate.freeRemaining} of {EVIDENCE_FREE_ALLOWANCE} free questions left</Badge>
          ) : (
            <Badge tone="neutral">{EVIDENCE_PRICE_PNC} PNC (≈ Rp150,000) per question</Badge>
          )}
          <span className="text-neutral-400">Balance: {wallet.balance.toLocaleString()} PNC</span>
        </div>

        {topupNeeded && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
            <p className="font-bold text-rose-700 dark:text-rose-300">Insufficient PNC balance</p>
            <p className="mt-1 text-rose-600 dark:text-rose-200">You've used your {EVIDENCE_FREE_ALLOWANCE} free questions. Each further question costs {EVIDENCE_PRICE_PNC} PNC (≈ Rp150,000). Top up your balance to continue.</p>
            <a href="#/billing" className="mt-2 inline-block rounded-full bg-rose-500 px-4 py-1.5 font-bold text-white active:scale-95">Top up in Billing →</a>
          </div>
        )}
        <div className="mt-3">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask() }}
            placeholder="e.g. First-line antihypertensive in an adult with type 2 diabetes and albuminuria?"
            className="min-h-[80px] w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Specialty (optional)">
            <input className={inputClass} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Cardiology" />
          </Field>
          <Field label="Population">
            <select className={inputClass} value={population} onChange={(e) => setPopulation(e.target.value)}>
              {POPULATIONS.map((p) => <option key={p} value={p}>{p || 'Any'}</option>)}
            </select>
          </Field>
          <Field label="Region (optional)">
            <input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Indonesia" />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={() => ask()} disabled={loading || !q.trim()}>
            {loading ? 'Searching evidence…' : gate.needsPayment ? `🔎 Ask (${EVIDENCE_PRICE_PNC} PNC)` : '🔎 Ask'}
          </Button>
          <span className="text-[11px] text-neutral-400">⌘/Ctrl + Enter</span>
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>}
      </Card>

      {/* Example questions */}
      {!answer && !loading && (
        <Card className="!p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Try an example</div>
          <div className="mt-2 flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => ask(ex)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-sm text-neutral-600 transition hover:border-brand hover:text-brand-dark dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                {ex}
              </button>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <Card className="!p-8 text-center">
          <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-3 text-sm text-neutral-400">Synthesizing evidence and grading certainty…</p>
        </Card>
      )}

      {/* Answer */}
      {answer && (
        <>
          <Card className="!p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STRENGTH_META[answer.strength].tone}>{STRENGTH_META[answer.strength].label}</Badge>
              <Badge tone={CERTAINTY_META[answer.overallCertainty].tone}>{CERTAINTY_META[answer.overallCertainty].label}</Badge>
            </div>
            <h2 className="mt-3 text-lg font-black text-ink dark:text-white">Bottom line</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">{answer.bottomLine}</p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                <span>Overall certainty of evidence</span><span>{CERTAINTY_META[answer.overallCertainty].label}</span>
              </div>
              <CertaintyBar c={answer.overallCertainty} />
            </div>
          </Card>

          {answer.keyPoints.length > 0 && (
            <Card className="!p-5">
              <SectionTitle icon={<IconChartUp size={20} />} title="Key evidence points" />
              <div className="mt-3 space-y-2.5">
                {answer.keyPoints.map((p, i) => (
                  <div key={i} className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-ink dark:text-white">{p.claim}</span>
                      <Badge tone={CERTAINTY_META[p.certainty].tone}>{CERTAINTY_META[p.certainty].label}</Badge>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{p.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(answer.considerations.length > 0 || answer.redFlags.length > 0) && (
            <Card className="!p-5">
              {answer.considerations.length > 0 && (
                <>
                  <SectionTitle icon={<IconShield size={20} />} title="Considerations" subtitle="Populations, contraindications, monitoring & local variation" />
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {answer.considerations.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </>
              )}
              {answer.redFlags.length > 0 && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <div className="text-xs font-black uppercase tracking-wide text-rose-600 dark:text-rose-300">🚩 Red flags / when to escalate</div>
                  <ul className="mt-1.5 ml-4 list-disc space-y-1 text-[13px] leading-relaxed text-rose-700 dark:text-rose-200">
                    {answer.redFlags.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {answer.patientFriendly && (
            <Card className="!p-5">
              <SectionTitle icon={<IconStethoscope size={20} />} title="Plain-language version" subtitle="For explaining to a patient" />
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{answer.patientFriendly}</p>
            </Card>
          )}
        </>
      )}

      {/* Verification links — always available once a question is typed */}
      {links.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconSearch size={20} />} title="Verify in the primary literature" subtitle="Open the same question in the major evidence sources — no login, works worldwide" />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5 transition hover:border-brand dark:border-white/10 dark:bg-white/5">
                <span>
                  <span className="block text-sm font-bold text-ink dark:text-white">{l.label}</span>
                  <span className="block text-[11px] text-neutral-400">{l.note}</span>
                </span>
                <span className="text-brand-dark">↗</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {answer && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
          {answer.disclaimer}
        </div>
      )}
    </div>
  )
}

export default ClinicalEvidence
