import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { computeFirstRunMissionState, extractProfileKeyFromAccount } from '../../domains/beta/index.ts'
import {
  markMissionStep,
  readMissionProgress,
  setMissionDismissed,
  trackBetaFunnelStep,
} from './betaClientAdapter'
import { InfoDisclosure } from '../ui/InfoDisclosure'

export function FirstRunMissionBar() {
  const { account } = useStore()
  const loc = useLocation()
  const profileKey = extractProfileKeyFromAccount(account)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => setRev((v) => v + 1)
    window.addEventListener('panacea:beta-mission-updated', bump)
    const onHealth = () => {
      markMissionStep(profileKey, 'sync_or_export')
      void trackBetaFunnelStep(account, 'completed_sync')
    }
    const onExport = () => {
      markMissionStep(profileKey, 'sync_or_export')
      void trackBetaFunnelStep(account, 'completed_export')
    }
    window.addEventListener('panacea:health-updated', onHealth)
    window.addEventListener('panacea:beta-export', onExport)
    return () => {
      window.removeEventListener('panacea:beta-mission-updated', bump)
      window.removeEventListener('panacea:health-updated', onHealth)
      window.removeEventListener('panacea:beta-export', onExport)
    }
  }, [account, profileKey])

  useEffect(() => {
    const p = loc.pathname
    if (p === '/profile') markMissionStep(profileKey, 'profile')
    if (p === '/body-exposure' || p === '/body-explorer') {
      markMissionStep(profileKey, 'body_or_scan')
      void trackBetaFunnelStep(account, 'opened_body_exposure')
    } else if (p === '/scan') {
      markMissionStep(profileKey, 'body_or_scan')
      void trackBetaFunnelStep(account, 'completed_scan')
    } else if (p === '/sync') {
      markMissionStep(profileKey, 'sync_or_export')
      void trackBetaFunnelStep(account, 'completed_sync')
    }
  }, [account, loc.pathname, profileKey])

  void rev
  const stored = readMissionProgress(profileKey)
  const mission = computeFirstRunMissionState(stored.completed, stored.dismissed)

  if (!account) return null

  if (!mission.visible) {
    return (
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setMissionDismissed(profileKey, false)}
          aria-label="Open 60-second beta guide"
          className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-black/10 bg-white/80 px-3 font-mono text-[10px] font-bold text-neutral-700 hover:border-brand dark:border-white/15 dark:bg-neutral-900/80 dark:text-slate-200"
        >
          <span>(i) Beta Guide</span>
          <span>{mission.completedCount}/3</span>
        </button>
      </div>
    )
  }

  return (
    <section
      aria-label="60-second guided mission"
      data-testid="first-run-mission-bar"
      className="dark mb-3 rounded-2xl border border-emerald-400/25 bg-[#060a10] p-3 text-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {mission.completedCount}/3 Ready
          </span>
          <h2 className="text-xs font-black tracking-tight text-white">
            60-Second Beta Start
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <InfoDisclosure title="Quick Beta Steps" badge="Guide">
            <p>Complete these 3 quick taps to verify your profile, scan, and export flow.</p>
          </InfoDisclosure>
          <button
            type="button"
            onClick={() => setMissionDismissed(profileKey, true)}
            aria-label="Dismiss guided mission"
            className="grid min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] place-items-center rounded-full border border-white/15 text-xs font-bold text-slate-300 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {mission.steps.map((step) => (
          <Link
            key={step.id}
            to={step.route}
            className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 text-xs font-bold transition ${
              step.done
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-400/50'
            }`}
          >
            <span className="truncate">{step.label}</span>
            <span className="font-mono text-[11px]">{step.done ? '✓' : '→'}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FirstRunMissionBar
