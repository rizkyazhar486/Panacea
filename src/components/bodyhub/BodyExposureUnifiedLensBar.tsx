import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { useOptionalStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import {
  resolveBodyExposureRegionNode,
  UNIFIED_BODY_REGIONS,
  type UnifiedBodyRegionId,
} from '../../domains/body-exposure/bodyExposureUnifiedGraphEngine'
import type { LiteracyLensId } from '../../domains/education/hippocraticBridgeEngine'
import type { HealthContinuumPhase } from '../../domains/continuum/lifeHealthContinuumEngine'
import { InfoDisclosure } from '../ui/InfoDisclosure'

type SurfaceModePill = 'body' | 'cad_cae' | 'fascia' | 'twin' | 'explain'

export function BodyExposureUnifiedLensBar({
  selectedSystemId,
  onSelectSystem,
}: {
  readonly selectedSystemId: BodySystemId
  readonly onSelectSystem: (id: BodySystemId) => void
}) {
  const store = useOptionalStore()
  const vitals = useMemo(
    () => readUnifiedLocalVitals(store?.account ?? null, { patient: store?.activePatient ?? null }),
    [store?.account, store?.activePatient],
  )

  const [regionId, setRegionId] = useState<UnifiedBodyRegionId>('heart')
  const [surfaceMode, setSurfaceMode] = useState<SurfaceModePill>('body')
  const [lens, setLens] = useState<LiteracyLensId>('plain_universal')
  const [phase, setPhase] = useState<HealthContinuumPhase>('before_illness')
  const [scaleIndex, setScaleIndex] = useState<number>(1)
  const [speaking, setSpeaking] = useState(false)

  const resolved = useMemo(
    () =>
      resolveBodyExposureRegionNode(regionId, {
        language: 'id',
        spo2Pct: vitals.spo2Pct ?? null,
        systolicMmHg: vitals.systolic ?? null,
      }),
    [regionId, vitals.spo2Pct, vitals.systolic],
  )

  const pickRegion = (id: UnifiedBodyRegionId, bodySystemId: BodySystemId) => {
    setRegionId(id)
    if (bodySystemId !== selectedSystemId) onSelectSystem(bodySystemId)
  }

  const toggleVoice = () => {
    if (!resolved.ok || !resolved.lenses.ok || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      if (speaking) {
        setSpeaking(false)
        return
      }
      const utter = new SpeechSynthesisUtterance(resolved.lenses.plain_universal.speechSynthesisText)
      utter.lang = 'id-ID'
      utter.rate = 0.94
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utter)
    } catch {
      setSpeaking(false)
    }
  }

  if (!resolved.ok) return null
  const activeScale = resolved.scales[scaleIndex] ?? resolved.scales[0]

  return (
    <section
      aria-label="BodyExposure Unified Multiscale Command Bar"
      className="dark mt-3 rounded-[24px] border border-cyan-400/20 bg-[#05070b] p-3.5 text-white sm:p-4"
    >
      {/* Top Floating Pills: 5 Mode Views + 3 Literacy Lenses */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Twin lens mode">
          {(
            [
              { id: 'body', label: 'Body' },
              { id: 'cad_cae', label: 'CAD/CAE' },
              { id: 'fascia', label: 'Fascia' },
              { id: 'twin', label: 'Twin' },
              { id: 'explain', label: 'Explain' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={surfaceMode === m.id}
              onClick={() => {
                setSurfaceMode(m.id)
                if (m.id === 'cad_cae' || m.id === 'fascia') setScaleIndex(2)
                else if (m.id === 'twin') setScaleIndex(4)
                else setScaleIndex(1)
              }}
              className={`min-h-[44px] rounded-xl border px-3 text-[11px] font-bold transition ${
                surfaceMode === m.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-white'
                  : 'border-white/10 bg-[#090d14] text-slate-300 hover:border-white/25'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'plain_universal', label: 'Simple' },
              { id: 'patient_partner', label: 'Patient' },
              { id: 'clinician_brief', label: 'Doctor' },
            ] as const
          ).map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lens === l.id}
              onClick={() => setLens(l.id)}
              className={`min-h-[44px] rounded-xl border px-3 text-[11px] font-bold transition ${
                lens === l.id
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                  : 'border-white/10 bg-[#090d14] text-slate-300'
              }`}
            >
              {l.label}
            </button>
          ))}

          {resolved.lenses.ok && (
            <InfoDisclosure title={`${resolved.region.label} Anchors`} badge={resolved.truthClass}>
              <p>{resolved.epistemicNotice}</p>
              <p className="font-mono text-[10px] text-cyan-200">
                ICD-10 {resolved.region.icd10Anchor} · ICD-11 {resolved.region.icd11Anchor} · LOINC {resolved.region.loincAnchors.join(', ')}
              </p>
              <p className="text-[11px] text-slate-300">
                SOAP Plan Draft: {resolved.lenses.clinician_brief.soapSummary.planDraft}
              </p>
            </InfoDisclosure>
          )}
        </div>
      </div>

      {/* 10 Canonical 1-Tap Organ Focus Chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {UNIFIED_BODY_REGIONS.map((reg) => (
          <button
            key={reg.id}
            type="button"
            aria-pressed={regionId === reg.id}
            onClick={() => pickRegion(reg.id, reg.bodySystemId)}
            className={`min-h-[44px] rounded-xl border px-3 text-[11px] font-bold transition ${
              regionId === reg.id
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-white/10 bg-[#090d14] text-slate-300 hover:border-white/25'
            }`}
          >
            {reg.label}
          </button>
        ))}
      </div>

      {/* 5-Scale Zoom Strip + Synchronized 1-2 Line Output */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#090d14] p-3">
          <div className="flex flex-wrap gap-1">
            {resolved.scales.map((s, idx) => (
              <button
                key={s.scaleId}
                type="button"
                aria-pressed={scaleIndex === idx}
                onClick={() => setScaleIndex(idx)}
                className={`min-h-[44px] rounded-lg border px-2 font-mono text-[10px] font-bold ${
                  scaleIndex === idx
                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                    : 'border-white/10 bg-black/40 text-slate-300'
                }`}
              >
                {s.label} ({s.scaleMeters})
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs font-bold text-white">{activeScale.headline}</div>
          <div className="font-mono text-[10px] text-cyan-300">{activeScale.engineRef}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090d14] p-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex gap-1">
              {(['before_illness', 'during_illness', 'after_illness'] as const).map((ph) => (
                <button
                  key={ph}
                  type="button"
                  aria-pressed={phase === ph}
                  onClick={() => setPhase(ph)}
                  className={`min-h-[44px] rounded-lg border px-2 font-mono text-[10px] font-bold ${
                    phase === ph
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-black/40 text-slate-300'
                  }`}
                >
                  {ph === 'before_illness' ? 'Before' : ph === 'during_illness' ? 'During' : 'After'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleVoice}
              className="min-h-[44px] rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 font-mono text-[10px] font-bold text-cyan-200"
            >
              {speaking ? 'Stop' : '🔊 Voice'}
            </button>
          </div>

          <div className="mt-2 text-xs font-bold text-emerald-200">{resolved.continuum[phase]}</div>
          {resolved.lenses.ok && (
            <div className="mt-1 text-[11px] text-slate-200">
              {lens === 'plain_universal'
                ? resolved.lenses.plain_universal.summary
                : lens === 'patient_partner'
                  ? resolved.lenses.patient_partner.whyItWorks
                  : resolved.lenses.clinician_brief.soapSummary.assessment}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default BodyExposureUnifiedLensBar
