import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useLongitudinalClinicalBridge } from '../lib/useLongitudinalClinicalBridge'
import {
  persistLongitudinalHandoff,
  readLongitudinalSignals,
  subscribeLongitudinalState,
  summarizeLongitudinalState,
  type LongitudinalDomain,
  type LongitudinalSignal,
} from '../lib/longitudinalPatientState'

type LongitudinalStateRibbonProps = {
  className?: string
  title?: string
  showHandoffs?: boolean
}

const DOMAIN_LABEL: Record<LongitudinalDomain, string> = {
  vitals: 'Vitals',
  activity: 'Move',
  sleep: 'Sleep',
  recovery: 'Recovery',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  mind: 'Mind',
  clinical: 'Clinical',
}

function timeLabel(value: string | null) {
  if (!value) return 'No signals'
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return 'Unknown time'
  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (deltaMinutes < 1) return 'Now'
  if (deltaMinutes < 60) return `${deltaMinutes}m`
  const hours = Math.round(deltaMinutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function Handoff({ to, target, subjectId, children }: { to: string; target: 'chatbot' | 'emr' | 'care'; subjectId: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      onClick={() => persistLongitudinalHandoff(target, subjectId)}
      className="grid min-h-[40px] place-items-center rounded-[13px] border border-white/[.08] bg-white/[.025] px-3 text-[9px] font-black text-white/58 transition hover:border-cyan-200/25 hover:bg-cyan-200/[.06] hover:text-white"
    >
      {children}
    </Link>
  )
}

export function LongitudinalStateRibbon({ className = '', title = 'Longitudinal state', showHandoffs = true }: LongitudinalStateRibbonProps) {
  const { activePatient } = useStore()
  useLongitudinalClinicalBridge()
  const [signals, setSignals] = useState<LongitudinalSignal[]>(() => readLongitudinalSignals(activePatient.id))

  useEffect(() => {
    const refresh = () => setSignals(readLongitudinalSignals(activePatient.id))
    refresh()
    return subscribeLongitudinalState(refresh)
  }, [activePatient.id])

  const summary = useMemo(() => summarizeLongitudinalState(signals), [signals])
  const maxCount = Math.max(1, ...summary.domains.map((domain) => domain.count))
  const confidence = Math.round(summary.meanConfidence * 100)
  const consentCoverage = summary.signalCount ? Math.round((summary.consentedCount / summary.signalCount) * 100) : 0

  return (
    <section className={`relative overflow-hidden rounded-[24px] border border-white/[.08] bg-white/[.03] p-4 backdrop-blur-xl ${className}`} aria-label="Longitudinal patient state">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.08),transparent_36%),radial-gradient(circle_at_86%_110%,rgba(139,92,246,.09),transparent_38%)]" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/42">Patient state · {activePatient.name}</div>
          <strong className="mt-1 block truncate text-sm">{title}</strong>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black tabular-nums">{summary.signalCount}</div>
          <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">signals</div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2.5"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Domains</div><strong className="mt-1 block text-lg tabular-nums">{summary.domainCount}/8</strong></div>
        <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2.5"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Sources</div><strong className="mt-1 block text-lg tabular-nums">{summary.sourceCount}</strong></div>
        <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2.5"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Fidelity</div><strong className="mt-1 block text-lg tabular-nums">{confidence}%</strong></div>
        <div className="rounded-[14px] border border-white/[.06] bg-black/20 px-2.5 py-2.5"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Updated</div><strong className="mt-1 block text-lg tabular-nums">{timeLabel(summary.lastMeasuredAt)}</strong></div>
      </div>

      <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(DOMAIN_LABEL) as LongitudinalDomain[]).map((domain) => {
          const state = summary.domains.find((item) => item.domain === domain)
          const width = state ? Math.max(14, Math.round((state.count / maxCount) * 100)) : 0
          return (
            <div key={domain} className="w-[78px] shrink-0">
              <div className="mb-1.5 truncate text-[8px] font-black uppercase tracking-[.1em] text-white/32">{DOMAIN_LABEL[domain]}</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                <motion.div initial={false} animate={{ width: `${width}%` }} transition={{ duration: .28 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 text-[8px] font-black uppercase tracking-[.1em] text-white/28">
        <span className="truncate">24h {summary.recentCount} · consent {consentCoverage}%</span>
        <span className="shrink-0">patient-scoped · provenance · time</span>
      </div>

      {showHandoffs ? (
        <div className="relative mt-3 grid grid-cols-3 gap-2">
          <Handoff to="/chatbot" target="chatbot" subjectId={activePatient.id}>Ask with context</Handoff>
          <Handoff to="/emr" target="emr" subjectId={activePatient.id}>Open AI-EMR</Handoff>
          <Handoff to="/care-episode" target="care" subjectId={activePatient.id}>Open Care</Handoff>
        </div>
      ) : null}
    </section>
  )
}

export default LongitudinalStateRibbon
