import { useEffect, useRef, useState } from 'react'
import type { HopeDomainKey } from '../../lib/hopeStack'
import {
  HopeEvidenceRequestError,
  loadHopeEvidence,
  type HopeEvidenceBundle,
} from '../../lib/hopeEvidence'

type LoadState = 'idle' | 'loading' | 'ready' | 'auth-required' | 'error'

function SourceStamp({ source, fetchedAt }: { source: string; fetchedAt: string }) {
  const date = new Date(fetchedAt)
  const shown = Number.isNaN(date.getTime()) ? fetchedAt : date.toLocaleString()
  return (
    <div className="rounded-xl border border-neutral-200 px-3 py-2 text-[10px] dark:border-white/10">
      <div className="font-black text-ink dark:text-white">{source}</div>
      <div className="mt-0.5 text-neutral-400">Retrieved {shown}</div>
    </div>
  )
}

export function HopeEvidencePanel({ domain }: { domain: HopeDomainKey }) {
  const [state, setState] = useState<LoadState>('idle')
  const [bundle, setBundle] = useState<HopeEvidenceBundle | null>(null)
  const [message, setMessage] = useState('')
  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    controllerRef.current?.abort()
    requestIdRef.current += 1
    setState('idle')
    setBundle(null)
    setMessage('')
    return () => controllerRef.current?.abort()
  }, [domain])

  async function load() {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const requestId = ++requestIdRef.current
    setState('loading')
    setMessage('')

    try {
      const result = await loadHopeEvidence(domain, controller.signal)
      if (requestId !== requestIdRef.current || controller.signal.aborted) return
      setBundle(result)
      setState('ready')
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      if (error instanceof HopeEvidenceRequestError && (error.status === 401 || error.status === 403)) {
        setState('auth-required')
        setMessage('Sign in to retrieve live literature and trial records through Panacea’s protected evidence gateway.')
      } else {
        setState('error')
        setMessage('Live evidence is unavailable right now. Panacea will not substitute remembered, generated, or mock records.')
      }
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.025]" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-brand">Live evidence gateway</div>
          <h4 className="mt-1 text-base font-black text-ink dark:text-white">Retrieve records, not generated citations.</h4>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
            Results come through Panacea’s existing PubMed and ClinicalTrials.gov server adapters. Retrieval is manual so opening this page never creates a request storm.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state === 'loading'}
          className="min-h-11 rounded-full bg-neutral-950 px-4 text-xs font-black text-white disabled:cursor-wait disabled:opacity-50 dark:bg-white dark:text-neutral-950"
        >
          {state === 'loading' ? 'Retrieving…' : state === 'ready' ? 'Refresh evidence' : 'Load live evidence'}
        </button>
      </div>

      {domain === 'mental-health' && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Literature retrieval is not crisis response. If there is immediate danger, use the Safety Plan and contact trusted people, local emergency services, or qualified human care.
        </div>
      )}

      {state === 'idle' && (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 text-xs text-neutral-400 dark:border-white/10">
          No live request has been made yet. Nothing shown here is silently generated as a substitute for external evidence.
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-4 rounded-2xl border border-neutral-200 p-4 text-xs font-bold text-neutral-500 dark:border-white/10">
          Retrieving current indexed records…
        </div>
      )}

      {(state === 'auth-required' || state === 'error') && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {message}
        </div>
      )}

      {state === 'ready' && bundle && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Search query</div>
            <div className="mt-1 font-mono text-[11px] leading-relaxed text-ink dark:text-white">{bundle.query}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {bundle.provenance.map((row) => (
              <SourceStamp key={row.provenanceId} source={row.source} fetchedAt={row.fetchedAt} />
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h5 className="text-xs font-black text-ink dark:text-white">PubMed literature</h5>
              <span className="text-[10px] font-bold text-neutral-400">{bundle.articles.length} records</span>
            </div>
            {bundle.articles.length ? (
              <div className="space-y-2">
                {bundle.articles.map((article) => (
                  <a
                    key={article.pmid}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-2xl border border-neutral-200 p-3 transition hover:border-brand/40 dark:border-white/10"
                  >
                    <div className="text-[9px] font-black uppercase tracking-wide text-brand">PMID {article.pmid} · {article.year || 'Year unavailable'}</div>
                    <div className="mt-1 text-xs font-black leading-snug text-ink dark:text-white">{article.title}</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{article.authors} · {article.journal}</div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-neutral-200 p-3 text-xs text-neutral-400 dark:border-white/10">No indexed articles were returned for this query.</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h5 className="text-xs font-black text-ink dark:text-white">Registered studies</h5>
              <span className="text-[10px] font-bold text-neutral-400">{bundle.trialSearchSupported ? `${bundle.trials.length} records` : 'Not queried for this domain'}</span>
            </div>
            {bundle.trialSearchSupported ? (
              bundle.trials.length ? (
                <div className="space-y-2">
                  {bundle.trials.map((trial) => (
                    <a
                      key={trial.nctId}
                      href={trial.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block rounded-2xl border border-neutral-200 p-3 transition hover:border-brand/40 dark:border-white/10"
                    >
                      <div className="text-[9px] font-black uppercase tracking-wide text-brand">{trial.nctId} · {trial.status || 'Status unavailable'} · {trial.phase || 'Phase N/A'}</div>
                      <div className="mt-1 text-xs font-black leading-snug text-ink dark:text-white">{trial.title}</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{trial.conditions || 'Conditions unavailable'} · {trial.locations || 'Location unavailable'}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-neutral-200 p-3 text-xs text-neutral-400 dark:border-white/10">No registered studies were returned for this query.</p>
              )
            ) : (
              <p className="rounded-2xl border border-neutral-200 p-3 text-xs text-neutral-400 dark:border-white/10">
                Trial search is intentionally disabled here because registered interventional studies are not the most appropriate primary evidence surface for this domain.
              </p>
            )}
          </div>

          <p className="text-[10px] leading-relaxed text-neutral-400">
            A publication or registered study is evidence provenance, not proof that an intervention is effective, appropriate, approved, or safe for an individual patient.
          </p>
        </div>
      )}
    </section>
  )
}

export default HopeEvidencePanel
