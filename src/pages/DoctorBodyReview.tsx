import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Prosa } from '../components/Prosa'
import { STRUCTURE_REVIEW_CHECKLIST, buildReviewRecord, recordApproves, reviewReadiness, type ReviewDecision, type StructureMethod, type StructureReviewRecord } from '../domains/body-exposure'

const BASE = `${import.meta.env.BASE_URL}bodyexposure/`
const PAGE = 40

interface MatrixBody { body_id: string; variants?: Array<{ body_id: string; label?: string }> }
interface Matrix { bodies: MatrixBody[]; files: string[] }
interface Registry { body_id: string; tag: string; sources: string[]; rows: Array<[string, string, string, string, string, StructureMethod, string, number]> }
interface Ledger { records: unknown[] }
interface Authorizations { authorized_reviewers: string[] }

const fileTag = (bodyId: string) => bodyId.replace('HUMAN.', '').replaceAll('.', '_').toLowerCase()
const METHOD_LABEL: Record<StructureMethod, string> = {
  manual_segmentation: 'Manual segmentation',
  model_segmented: 'Machine segmentation',
  reference_stand_in: 'Borrowed reference geometry',
  other: 'Source mesh (atlas or phantom)',
}
const DECISIONS: Array<{ id: ReviewDecision; label: string; hint: string }> = [
  { id: 'confirmed', label: 'Anatomy confirmed', hint: 'Every required check passed for this exact asset version.' },
  { id: 'corrections_needed', label: 'Corrections needed', hint: 'Describe what is wrong in the notes.' },
  { id: 'cannot_assess', label: 'Cannot assess', hint: 'Not enough information to judge; say what is missing.' },
]

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  return (await r.json()) as T
}

export function DoctorBodyReview() {
  const { account } = useStore()
  const authorized = account?.role === 'dokter' || Boolean(account?.isOwner)
  const [matrix, setMatrix] = useState<Matrix | null>(null)
  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [auth, setAuth] = useState<Authorizations | null>(null)
  const [tag, setTag] = useState<string>('')
  const [registry, setRegistry] = useState<Registry | null>(null)
  const [error, setError] = useState('')
  const [system, setSystem] = useState('all')
  const [filter, setFilter] = useState<'all' | 'open' | 'reviewed' | 'model'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [decision, setDecision] = useState<ReviewDecision>('cannot_assess')
  const [reviewerId, setReviewerId] = useState('')
  const [notes, setNotes] = useState('')
  const [record, setRecord] = useState<StructureReviewRecord | null>(null)
  const [formError, setFormError] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (!authorized) return
    Promise.all([getJson<Matrix>(`${BASE}body_matrix.json`), getJson<Ledger>(`${BASE}clinical_reviews.json`), getJson<Authorizations>(`${BASE}clinical_review_authorizations.json`)])
      .then(([m, l, a]) => { setMatrix(m); setLedger(l); setAuth(a) })
      .catch((e: Error) => setError(`Could not load the review data: ${e.message}`))
  }, [authorized])

  const bodies = useMemo(() => {
    if (!matrix) return [] as Array<{ tag: string; label: string }>
    const out: Array<{ tag: string; label: string }> = []
    for (const b of matrix.bodies) {
      for (const v of [{ body_id: b.body_id, label: undefined as string | undefined }, ...(b.variants ?? [])]) {
        const t = fileTag(v.body_id)
        if (matrix.files.some((f) => f.startsWith(`${t}.`)) && !out.some((o) => o.tag === t)) out.push({ tag: t, label: v.label ? `${v.body_id} · ${v.label}` : v.body_id })
      }
    }
    return out
  }, [matrix])

  useEffect(() => { if (!tag && bodies.length) setTag(bodies[0].tag) }, [bodies, tag])
  useEffect(() => {
    if (!tag) return
    setRegistry(null); setPicked(null); setPage(0); setRecord(null)
    getJson<Registry>(`${BASE}${tag}.review.json`).then(setRegistry).catch((e: Error) => setError(`Could not load the structure registry: ${e.message}`))
  }, [tag])

  const nowIso = useMemo(() => new Date().toISOString(), [registry, ledger])
  // status "ditinjau" dihitung dari buku besar dengan aturan yang sama dengan uji; tanpa catatan sah → tidak ditinjau
  const reviewedIds = useMemo(() => {
    const s = new Set<string>()
    if (!registry || !ledger || !auth) return s
    const version = new Map(registry.rows.map((r) => [r[0], r[6]]))
    for (const rec of ledger.records) {
      const sid = (rec as { structure_id?: string } | null)?.structure_id
      if (sid && version.has(sid) && recordApproves(rec, { authorizedReviewers: auth.authorized_reviewers, currentAssetVersion: version.get(sid) as string, nowIso }).approved) s.add(sid)
    }
    return s
  }, [registry, ledger, auth, nowIso])

  const systems = useMemo(() => ['all', ...Array.from(new Set((registry?.rows ?? []).map((r) => r[3]))).sort()], [registry])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (registry?.rows ?? []).filter((r) =>
      (system === 'all' || r[3] === system) &&
      (filter === 'all' || (filter === 'reviewed' && reviewedIds.has(r[0])) || (filter === 'open' && !reviewedIds.has(r[0])) || (filter === 'model' && r[5] === 'model_segmented')) &&
      (!q || r[0].toLowerCase().includes(q) || r[1].toLowerCase().includes(q)))
  }, [registry, system, filter, query, reviewedIds])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE)
  const row = registry?.rows.find((r) => r[0] === picked) ?? null
  const method = row?.[5] ?? 'other'
  const required = STRUCTURE_REVIEW_CHECKLIST.filter((c) => !c.methods || c.methods.includes(method))
  const readiness = reviewReadiness(checks, method)

  const pick = (id: string) => { setPicked(id); setChecks({}); setDecision('cannot_assess'); setNotes(''); setRecord(null); setFormError(''); setCopyState('idle') }
  const create = () => {
    if (!row || !registry) return
    const r = buildReviewRecord({ body_id: registry.body_id, structure_id: row[0], asset_version: row[6], method, decision, checks, reviewer_id: reviewerId, notes }, new Date().toISOString())
    if (!r.ok) { setRecord(null); setFormError(r.error); return }
    setFormError(''); setRecord(r.record); setCopyState('idle')
  }
  const preview = record && row && auth ? recordApproves(record, { authorizedReviewers: auth.authorized_reviewers, currentAssetVersion: row[6], nowIso: new Date().toISOString() }) : null
  const json = record ? JSON.stringify(record, null, 2) : ''
  const copy = async () => { try { await navigator.clipboard.writeText(json); setCopyState('copied') } catch { setCopyState('failed') } }
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `review-${record?.structure_id ?? 'structure'}.json`; a.click(); URL.revokeObjectURL(url)
  }

  if (!authorized) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 py-10">
        <p className="text-xs font-black uppercase tracking-[.14em] text-white/45">Doctor surface</p>
        <h1 className="text-3xl font-black tracking-[-.04em]">Body structure review</h1>
        <Prosa kelas="max-w-2xl text-sm leading-6 text-white/60">{'This workspace is reserved for the doctor team. Engineering and automated validation continue independently of this human-review surface.'}</Prosa>
        <Link to="/clinical-hub" className="inline-flex min-h-[44px] items-center border-b border-white/30 text-sm font-black">Back to Clinical →</Link>
      </main>
    )
  }

  return (
    <main className="dark mx-auto w-full max-w-5xl space-y-6 pb-24 text-white">
      <header className="border-b border-white/10 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-200/65">Doctor workspace · Body Exposure</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-[-.05em] sm:text-4xl">Structure review checklist</h1>
          <div className="flex gap-4 text-xs font-black text-white/50"><Link to="/doctor-review" className="hover:text-white">General checklist →</Link><Link to="/body-exposure/canonical" className="hover:text-white">Viewer →</Link></div>
        </div>
        <Prosa kelas="mt-3 max-w-3xl text-sm leading-6 text-white/55">{"Check one anatomical structure at a time against the data it came from. A record you create here is a proposal: it changes nothing by itself. A structure counts as clinically reviewed only when a confirmed record for its exact asset version, from a reviewer on the owner's authorised list, is merged into the review ledger."}</Prosa>
      </header>

      {error && <p role="alert" className="border-l-2 border-amber-300/60 pl-4 text-sm text-amber-100/80">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-4" aria-label="Review status">
        <label className="sm:col-span-2"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Body</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="mt-2 min-h-[44px] w-full rounded-lg border border-white/10 bg-white/[.04] px-3 text-sm font-bold">
            {bodies.map((b) => <option key={b.tag} value={b.tag} className="text-black">{b.label}</option>)}
          </select></label>
        <div className="border-b border-white/10 pb-3"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Structures</span><strong className="mt-2 block text-xl tabular-nums">{registry?.rows.length ?? '…'}</strong></div>
        <div className="border-b border-white/10 pb-3"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Clinically reviewed</span><strong data-testid="reviewed-count" className="mt-2 block text-xl tabular-nums">{reviewedIds.size}</strong></div>
      </section>

      <section className="space-y-3" aria-label="Structure list">
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} placeholder="Find a structure by name or ID" aria-label="Find a structure"
            className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[.04] px-3 text-sm outline-none focus:border-white/25" />
          <select value={system} onChange={(e) => { setSystem(e.target.value); setPage(0) }} aria-label="System" className="min-h-[44px] rounded-lg border border-white/10 bg-white/[.04] px-3 text-sm capitalize">
            {systems.map((s) => <option key={s} value={s} className="text-black">{s === 'all' ? 'All systems' : s}</option>)}
          </select>
          <select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(0) }} aria-label="Status" className="min-h-[44px] rounded-lg border border-white/10 bg-white/[.04] px-3 text-sm">
            <option value="all" className="text-black">All structures</option><option value="open" className="text-black">Not reviewed</option><option value="reviewed" className="text-black">Reviewed</option><option value="model" className="text-black">Machine-segmented</option>
          </select>
        </div>
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {shown.map((r) => (
            <li key={r[0]}>
              <button type="button" onClick={() => pick(r[0])} aria-pressed={picked === r[0]} className={`flex min-h-[48px] w-full flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 text-left text-sm ${picked === r[0] ? 'bg-white/[.06]' : 'hover:bg-white/[.03]'}`}>
                <strong className="capitalize">{r[1]}</strong><span className="text-white/45">{r[2] === 'unpaired' ? '' : r[2]}</span><span className="text-white/45">· {r[3]}</span>
                <span className="ml-auto text-[10px] font-black uppercase tracking-[.1em] text-white/45">{reviewedIds.has(r[0]) ? 'reviewed' : 'not reviewed'}{r[5] === 'model_segmented' ? ' · machine' : ''}</span>
              </button>
            </li>
          ))}
          {!shown.length && <li className="px-2 py-6 text-sm text-white/45">{registry ? 'No structure matches.' : 'Loading…'}</li>}
        </ul>
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{filtered.length.toLocaleString('en')} structures · page {page + 1} of {pages}</span>
          <span className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="min-h-[40px] rounded-full border border-white/15 px-4 font-black disabled:opacity-30">Previous</button>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="min-h-[40px] rounded-full border border-white/15 px-4 font-black disabled:opacity-30">Next</button>
          </span>
        </div>
      </section>

      {row && registry && (
        <section className="space-y-5 border-t border-white/10 pt-6" aria-label="Review this structure">
          <div>
            <h2 className="text-xl font-black capitalize">{row[1]} <span className="text-sm font-bold text-white/45">{row[2] === 'unpaired' ? '' : row[2]}</span></h2>
            <p className="mt-1 break-all font-mono text-xs text-white/50">{row[0]}</p>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">System</dt><dd className="capitalize">{row[3]}</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">Method</dt><dd>{METHOD_LABEL[method]}</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">Accuracy status in the data</dt><dd>{row[4].replaceAll('_', ' ')}</dd></div>
              <div><dt className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">Asset version</dt><dd className="font-mono text-xs">{row[6]}</dd></div>
              <div className="sm:col-span-2"><dt className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">Source on the structure</dt><dd className="break-words text-white/70">{registry.sources[row[7]] || 'not stated'}</dd></div>
            </dl>
            {method === 'model_segmented' && <p className="mt-3 border-l-2 border-amber-300/60 pl-4 text-xs leading-5 text-amber-100/80">Machine segmentation: accuracy is unmeasured unless PROVENANCE.md says otherwise; check it against the images.</p>}
          </div>

          <fieldset className="divide-y divide-white/10 border-y border-white/10">
            <legend className="sr-only">Checklist</legend>
            {required.map((c) => (
              <label key={c.id} className="grid cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-3 py-3">
                <input type="checkbox" checked={checks[c.id] === true} onChange={() => { setRecord(null); setChecks((cur) => ({ ...cur, [c.id]: !(cur[c.id] === true) })) }} className="mt-1 h-4 w-4 accent-emerald-400" />
                <span><strong className="text-sm">{c.label}</strong><span className="mt-1 block text-xs leading-5 text-white/45">{c.detail}</span></span>
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-white/50">{required.length - readiness.missing.length} of {required.length} required checks done.</p>

          <div role="radiogroup" aria-label="Decision" className="grid gap-2 sm:grid-cols-3">
            {DECISIONS.map((d) => (
              <button key={d.id} type="button" role="radio" aria-checked={decision === d.id} onClick={() => { setDecision(d.id); setRecord(null) }}
                className={`min-h-[56px] rounded-lg border px-3 py-2 text-left text-sm ${decision === d.id ? 'border-emerald-300/60 bg-emerald-300/10' : 'border-white/10'}`}>
                <strong className="block">{d.label}</strong><span className="text-xs text-white/45">{d.hint}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-[260px_minmax(0,1fr)]">
            <label><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Reviewer identifier</span>
              <input value={reviewerId} onChange={(e) => { setReviewerId(e.target.value); setRecord(null) }} placeholder="Reviewer ID" className="mt-2 min-h-[44px] w-full rounded-lg border border-white/10 bg-white/[.04] px-3 text-sm outline-none" /></label>
            <label><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/35">Notes</span>
              <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setRecord(null) }} rows={3} placeholder="What you checked, what is wrong, what is missing. Avoid patient identifiers."
                className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/[.04] p-3 text-sm leading-6 outline-none" /></label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={create} className="min-h-[46px] rounded-full bg-white px-5 text-xs font-black text-black">Create review record</button>
            {record && <>
              <button type="button" onClick={copy} className="min-h-[46px] rounded-full border border-white/15 px-5 text-xs font-black">Copy record</button>
              <button type="button" onClick={download} className="min-h-[46px] rounded-full border border-white/15 px-5 text-xs font-black">Download .json</button>
            </>}
          </div>
          {formError && <p role="alert" className="border-l-2 border-amber-300/60 pl-4 text-sm text-amber-100/80">{formError}</p>}
          {record && (
            <div className="space-y-3">
              <output aria-live="polite" className="block border-l-2 border-emerald-300/40 pl-4 text-xs leading-5 text-white/60">
                {preview?.approved
                  ? 'If merged into the ledger this record would mark the structure as reviewed.'
                  : `If merged into the ledger this record would NOT mark the structure as reviewed: ${preview?.reason ?? 'unknown'}.`}
                {copyState === 'copied' ? ' Copied.' : copyState === 'failed' ? ' Clipboard copy failed.' : ''}
              </output>
              <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-white/[.03] p-3 text-xs">{json}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default DoctorBodyReview
