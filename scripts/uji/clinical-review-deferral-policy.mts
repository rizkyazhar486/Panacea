// Keputusan pemilik 2026-10-17: tinjauan klinis formal (C6) di luar lingkup Alpha. Gerbang ini menjaga agar kebijakan DIWARISI semua agen
// (AGENTS.md, CLAUDE.md, GEMINI.md, kebijakan governance, catatan docs/alpha) dan agar invarian keselamatan tidak ikut hilang.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const MANDATORY = 'C6 formal clinical review is outside the active Alpha engineering scope. Do not count it as unfinished Alpha work, do not let it block Alpha engineering completion, and do not reintroduce it into the active denominator without an explicit Product Owner decision.'
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
const flat = (t: string) => t.replace(/[>*\s]+/g, ' ')

// 1. Setiap pintu masuk agen membawa kalimat wajib persis, dan menunjuk ke kebijakan.
for (const f of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'governance/doctrine/PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md'])
  assert.ok(flat(read(f)).includes(flat(MANDATORY)), `${f} must carry the mandatory C6 instruction verbatim`)
for (const f of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) assert.ok(read(f).includes('PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md'), `${f} must point to the policy`)
assert.ok(existsSync(new URL('../../docs/alpha/CLINICAL_REVIEW_DEFERRAL.md', import.meta.url)), 'the decision record exists')

// 2. Kebijakan dan catatan keputusan memuat invarian keselamatan (bukan pelonggaran).
const policy = flat(read('governance/doctrine/PANACEA_ALPHA_CLINICAL_REVIEW_PHASE_POLICY.md')), record = flat(read('docs/alpha/CLINICAL_REVIEW_DEFERRAL.md'))
for (const phrase of ['clinically_reviewed=false', 'Never set C6 to `VERIFIED`', 'DEFERRED_TO_CLINICAL_VALIDATION', 'not VERIFIED', 'fail-closed', 'not authorisation for clinical use', 'Do not reintroduce C6 into the active denominator']) assert.ok(policy.includes(phrase), `policy keeps: ${phrase}`)
for (const phrase of ['not VERIFIED', 'not clinically validated', 'clinically_reviewed', 'fail-closed', 'restricted to non-clinical testing', 'before deployment for real clinical decision-making']) assert.ok(record.includes(phrase), `decision record keeps: ${phrase}`)

// 3. Ledger: C6 ditunda dengan catatan mesin, tidak VERIFIED, syarat asli dan dossier dipertahankan, 45 catatan tetap.
const ledger = JSON.parse(read('governance/ALPHA_ACCEPTANCE_LEDGER.json')) as { statuses: string[]; criteria: { id: string; status: string; evidence: string[]; deferral?: Record<string, string> }[] }
const c6 = ledger.criteria.find((c) => c.id === 'C6')!
assert.equal(c6.status, 'DEFERRED_TO_CLINICAL_VALIDATION'); assert.ok(ledger.statuses.includes('DEFERRED_TO_CLINICAL_VALIDATION'))
assert.ok(c6.deferral && c6.deferral.decidedOn === '2026-10-17' && c6.deferral.originalAcceptance.includes('Peninjau berwenang menandatangani rentang tiap kalkulator') && c6.deferral.reference === 'docs/alpha/CLINICAL_REVIEW_DEFERRAL.md')
assert.ok(c6.evidence.includes('docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md'), 'the review dossier stays referenced')
assert.ok(existsSync(new URL('../../docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md', import.meta.url)), 'the dossier file is preserved')
assert.equal(ledger.criteria.length, 45, 'all 45 historical criteria stay recorded'); assert.deepEqual(ledger.criteria.filter((c) => c.status === 'DEFERRED_TO_CLINICAL_VALIDATION').map((c) => c.id), ['C6'], 'only C6 is deferred')

// 4. Tidak ada tanda tinjauan klinis palsu pada registri kalkulator (clinically_reviewed tidak pernah true tanpa tinjauan nyata).
const registry = JSON.parse(read('governance/CALCULATOR_REVIEW_REGISTRY.json')) as { entries: { review_status: string; clinically_reviewed: boolean; reviewer: unknown; reviewed_at: unknown }[] }
assert.ok(registry.entries.length > 0)
for (const [i, e] of registry.entries.entries()) assert.deepEqual([e.review_status, e.clinically_reviewed, e.reviewer, e.reviewed_at], ['PENDING_CLINICAL_REVIEW', false, null, null], `calculator entry ${i}: the deferral invents no review and erases no pending state`)
console.log('clinical-review-deferral-policy: mandatory C6 instruction in AGENTS/CLAUDE/GEMINI/policy, decision record keeps every safety invariant, C6 deferred (not VERIFIED) with the original acceptance and dossier preserved, 45 records kept')
