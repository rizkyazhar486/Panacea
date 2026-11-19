import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOptionalStore } from '../lib/store'
import { readUnifiedLocalVitals } from '../domains/identity/localRecovery'
import { evaluateGtaCharacterPersonification } from '../domains/character/index.ts'
import type { CommandOperatingMode } from '../domains/spatial-os/index.ts'
import {
  buildLocalTelemetrySamples,
  persistCommandMode,
  readCommandMode,
  readNeonOutboxCount,
} from '../components/spatial/spatialStorage'
import { PanaceaRadialCommandDeck } from '../components/spatial/PanaceaRadialCommandDeck'
import { PanaceaAugmaDesktopDeck } from '../components/spatial/PanaceaAugmaDesktopDeck'
import '../styles/panaceaSpatialHud.css'

const HolographicTwinStage = lazy(() =>
  import('../components/spatial/HolographicTwinStage').then((m) => ({ default: m.HolographicTwinStage })),
)
const OmnicausalisHolotable = lazy(() =>
  import('../components/spatial/OmnicausalisHolotable').then((m) => ({ default: m.OmnicausalisHolotable })),
)

type SpatialView = 'deck' | 'twin' | 'holotable' | 'constellation'

function parseViewParam(raw: string | null): SpatialView {
  if (raw === 'twin' || raw === 'holotable' || raw === 'constellation') return raw
  return 'deck'
}

export function SpatialCommandOS() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null
  const [searchParams, setSearchParams] = useSearchParams()

  const activeView = parseViewParam(searchParams.get('view'))
  const [mode, setMode] = useState<CommandOperatingMode>(() => readCommandMode())
  const [outboxCount, setOutboxCount] = useState<number>(() => readNeonOutboxCount())
  const [spotlightOpen, setSpotlightOpen] = useState(false)

  const vitals = useMemo(
    () => readUnifiedLocalVitals(account, { patient }),
    [account, patient],
  )

  const profileKey = account?.email ? account.email.split('@')[0] : 'rizkyazhar486'
  const mrn = patient?.mrn || 'PMD-000486'
  const identityName =
    account?.isOwner || profileKey.toLowerCase().includes('rizky')
      ? 'dr. Rizky Muhammad Azrissal'
      : account?.name || 'dr. Rizky Muhammad Azrissal'
  const identityHandle = `@${profileKey.replace(/[^a-zA-Z0-9_]/g, '') || 'rizkyazhar486'}`

  const persona = useMemo(
    () =>
      evaluateGtaCharacterPersonification({
        profileKey,
        mrn,
        heightCm: vitals.heightCm ?? 173,
        weightKg: vitals.weightKg ?? 68,
        bodyFatPct: vitals.bodyFatPct,
        restingHrBpm: vitals.restingHr ?? vitals.heartRate,
        hrvMs: vitals.hrvMs,
        vo2max: vitals.vo2max,
        dailySteps: vitals.steps,
        sleepHours: vitals.sleepH,
      }),
    [profileKey, mrn, vitals],
  )

  const hasMeasuredVitals =
    vitals.restingHr !== undefined ||
    vitals.heartRate !== undefined ||
    vitals.hrvMs !== undefined ||
    vitals.sleepH !== undefined ||
    vitals.steps !== undefined ||
    vitals.vo2max !== undefined

  const readinessScore = hasMeasuredVitals && persona.ok ? persona.cores.readinessScore : null
  const readinessTruthClass = hasMeasuredVitals && persona.ok ? persona.truthClass : 'curated_physiology'

  const telemetrySamples = useMemo(
    () => buildLocalTelemetrySamples(vitals, readinessScore),
    [vitals, readinessScore],
  )

  const handleModeChange = (next: CommandOperatingMode) => {
    setMode(next)
    const count = persistCommandMode(next, profileKey)
    setOutboxCount(count)
  }

  const selectView = (view: SpatialView) => {
    if (view === 'deck') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ view }, { replace: true })
    }
  }

  // Sync outbox count when returning to tab
  useEffect(() => {
    setOutboxCount(readNeonOutboxCount())
  }, [activeView])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-8">
      {/* Top Spatial Surface Switcher Bar */}
      <nav
        aria-label="Panacea Spatial OS Surfaces"
        className="panacea-spatial-hud flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff2d46]" aria-hidden="true" />
          <span className="hud-micro-header text-white">
            PANACEA OCULUS / AUGMA SPATIAL OS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Spatial OS views">
          {(
            [
              { id: 'deck', label: '01 COMMAND DECK' },
              { id: 'twin', label: '02 3D DIGITAL TWIN' },
              { id: 'holotable', label: '03 HOLOTABLE' },
              { id: 'constellation', label: '04 CONSTELLATION' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeView === item.id}
              onClick={() => selectView(item.id)}
              className={`hud-btn min-h-[44px] px-3 text-[10px] ${
                activeView === item.id ? 'hud-btn-active' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Active View Projection */}
      {activeView === 'deck' && (
        <div className="space-y-4">
          {/* Mobile / Compact Tactile Radial Command Deck (always accessible; primary on mobile) */}
          <div className="lg:hidden">
            <PanaceaRadialCommandDeck
              mode={mode}
              onModeChange={handleModeChange}
              onOpenSpotlight={() => setSpotlightOpen(true)}
              identityName={identityName}
              identityHandle={identityHandle}
              outboxCount={outboxCount}
              readinessScore={readinessScore}
              readinessTruthClass={readinessTruthClass}
              vitals={vitals}
            />
          </div>

          {/* Desktop Tactical Command Center + Command Palette */}
          <PanaceaAugmaDesktopDeck
            mode={mode}
            onModeChange={handleModeChange}
            spotlightOpen={spotlightOpen}
            onSpotlightOpenChange={setSpotlightOpen}
            identityName={identityName}
            identityHandle={identityHandle}
            outboxCount={outboxCount}
            readinessScore={readinessScore}
            readinessTruthClass={readinessTruthClass}
            telemetrySamples={telemetrySamples}
            vitals={vitals}
            onSelectView={selectView}
          />

          {/* Compact Radial Controller disclosure on desktop so desktop users can also pilot the radial orb */}
          <details className="panacea-spatial-hud hidden p-3 lg:block">
            <summary className="hud-micro-header flex min-h-[44px] cursor-pointer list-none items-center justify-between text-cyan-300">
              <span>EXPAND AUGMA TACTILE RADIAL ORB &amp; 01–08 LAUNCHER</span>
              <span>OPEN DIAL ▾</span>
            </summary>
            <div className="mt-3">
              <PanaceaRadialCommandDeck
                mode={mode}
                onModeChange={handleModeChange}
                onOpenSpotlight={() => setSpotlightOpen(true)}
                identityName={identityName}
                identityHandle={identityHandle}
                outboxCount={outboxCount}
                readinessScore={readinessScore}
                readinessTruthClass={readinessTruthClass}
                vitals={vitals}
              />
            </div>
          </details>
        </div>
      )}

      {activeView === 'twin' && (
        <Suspense
          fallback={
            <div className="panacea-spatial-hud p-8 text-center font-mono text-xs text-cyan-200">
              INITIALIZING HOLOGRAPHIC DIGITAL TWIN STAGE…
            </div>
          }
        >
          <HolographicTwinStage profileKey={profileKey} mrn={mrn} vitals={vitals} />
        </Suspense>
      )}

      {(activeView === 'holotable' || activeView === 'constellation') && (
        <Suspense
          fallback={
            <div className="panacea-spatial-hud p-8 text-center font-mono text-xs text-amber-200">
              INITIALIZING OMNICAUSALIS HOLOTABLE…
            </div>
          }
        >
          <OmnicausalisHolotable
            initialTab={activeView}
            mode={mode}
            profileKey={profileKey}
            vitals={vitals}
            onOutboxUpdated={setOutboxCount}
          />
        </Suspense>
      )}
    </div>
  )
}

export default SpatialCommandOS
