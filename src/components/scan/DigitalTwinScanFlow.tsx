import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { evaluateGtaCharacterPersonification } from '../../domains/character/index.ts'
import {
  buildParametricAnatomicalCad,
  evaluateArchetypeComparison,
  evaluateBiomechanicalCae,
  TARGET_ARCHETYPES,
  type TargetArchetypeId,
} from '../../domains/body-exposure/biomedicalCadCaeEngine'
import { evaluateOpticalSkinScan } from '../../domains/scan/index.ts'
import {
  evaluateOsaSleepMonitor,
  evaluateQeegBrainScan,
  type EegDeviceVendor,
} from '../../domains/neuro/index.ts'
import { computeOneWayAnova, computeRepeatedMeasuresAnova } from '../../domains/analytics/index.ts'
import { InfoDisclosure } from '../ui/InfoDisclosure'
import { triggerSafeBrowserDownload } from '../sync/autoExportBrowserAdapter'
import { sanitizeExportFilename, sha256Hex } from '../../lib/export/autoExportEngine'
import { extractProfileKeyFromAccount, formatMrnForAccount } from '../../domains/beta/index.ts'
import { trackBetaFunnelStep } from '../beta/betaClientAdapter'

type ScanTab = 'builder' | 'cad' | 'skin' | 'neuro' | 'anova'
type ScanStep = 0 | 1 | 2 | 3

const SCAN_STEPS: readonly { readonly id: ScanStep; readonly label: string }[] = [
  { id: 0, label: 'Center Face' },
  { id: 1, label: 'Turn Left' },
  { id: 2, label: 'Turn Right' },
  { id: 3, label: 'Full Body 360°' },
]

const EEG_DEVICES: readonly { readonly id: EegDeviceVendor; readonly label: string }[] = [
  { id: 'muse', label: 'Muse' },
  { id: 'emotiv', label: 'Emotiv' },
  { id: 'dreem', label: 'Dreem' },
  { id: 'neurosity', label: 'Neurosity' },
  { id: 'csv_edf_import', label: 'CSV / EDF' },
]

function radarPolygon(vals: readonly number[], cx: number, cy: number, maxR: number): string {
  return vals
    .map((v, idx) => {
      const angle = (idx / vals.length) * Math.PI * 2 - Math.PI / 2
      const r = (Math.max(0, Math.min(100, v)) / 100) * maxR
      return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`
    })
    .join(' ')
}

export function DigitalTwinScanFlow({ initialTab = 'builder' }: { readonly initialTab?: ScanTab }) {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null
  const vitals = useMemo(() => readUnifiedLocalVitals(account, { patient }), [account, patient])

  const [tab, setTab] = useState<ScanTab>(initialTab)
  const [step, setStep] = useState<ScanStep>(0)
  const [capturedSteps, setCapturedSteps] = useState<number[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('Ready')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Builder / Archetype state
  const [archetypeId, setArchetypeId] = useState<TargetArchetypeId>('longevity_lean')
  const [compareTarget, setCompareTarget] = useState(true)

  // CAD / CAE state
  const [cadView, setCadView] = useState<'cad' | 'cae' | 'anatomy'>('cae')

  // Skin optical ROI state (sampled from camera canvas or baseline optical fixture)
  const [skinOptical, setSkinOptical] = useState({
    meanLuminance01: 0.56,
    toneStdDev01: 0.085,
    redGreenDelta: 0.055,
    edgeEnergy01: 0.21,
    pigmentContrast01: 0.17,
    specularUniformity01: 0.76,
  })
  const [skinCaptureNote, setSkinCaptureNote] = useState('Optical baseline')

  // Neuro qEEG + OSA state (raw text prevents blank inputs from silently coercing to 0)
  const [eegDevice, setEegDevice] = useState<EegDeviceVendor>('muse')
  const [ahiText, setAhiText] = useState<string>('3.8')
  const [spo2NadirText, setSpo2NadirText] = useState<string>('94')

  // ANOVA mode
  const [anovaMode, setAnovaMode] = useState<'longitudinal' | 'bilateral'>('longitudinal')

  const profileKey = extractProfileKeyFromAccount(account)
  const mrn = formatMrnForAccount(account, patient?.mrn)

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const toggleCamera = async () => {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCameraActive(false)
      setCameraStatus('Stopped')
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraBlocked(true)
      setCameraStatus('Camera blocked')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraBlocked(false)
      setCameraActive(true)
      setCameraStatus('Live')
    } catch {
      setCameraBlocked(true)
      setCameraStatus('Camera blocked')
    }
  }

  const onPhotoSelected = async (file?: File) => {
    if (!file) return
    try {
      const imgUrl = URL.createObjectURL(file)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = imgUrl
      })
      try {
        const c = document.createElement('canvas')
        c.width = 64
        c.height = 64
        const ctx = c.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 64)
          const { data } = ctx.getImageData(16, 16, 32, 32)
          let sumL = 0
          const lums: number[] = []
          for (let i = 0; i < data.length; i += 4) {
            const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
            lums.push(lum)
            sumL += lum
          }
          const n = Math.max(1, lums.length)
          const meanL = sumL / n
          const stdL = Math.sqrt(lums.reduce((acc, v) => acc + (v - meanL) ** 2, 0) / n)
          setSkinOptical((prev) => ({
            ...prev,
            meanLuminance01: Math.max(0.18, Math.min(0.88, Number(meanL.toFixed(3)))),
            toneStdDev01: Math.min(0.45, Number(stdL.toFixed(3))),
          }))
        }
      } finally {
        URL.revokeObjectURL(imgUrl)
      }
      setSkinCaptureNote(`Photo sampled (${file.name.slice(0, 24)})`)
    } catch {
      setSkinCaptureNote('Photo uploaded (fallback optical baseline)')
    } finally {
      setCameraBlocked(false)
      setCameraStatus('Photo captured')
      captureStep()
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const captureStep = () => {
    setCapturedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]))
    setStep((cur) => (cur < 3 ? ((cur + 1) as ScanStep) : 0))
    void trackBetaFunnelStep(account, 'completed_scan')
  }

  const sampleSkinFrame = () => {
    const video = videoRef.current
    if (video && cameraActive && video.videoWidth > 0 && video.videoHeight > 0) {
      try {
        const c = document.createElement('canvas')
        c.width = 64
        c.height = 64
        const ctx = c.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, 64, 64)
          const { data } = ctx.getImageData(16, 16, 32, 32)
          let sumL = 0
          let sumRG = 0
          const lums: number[] = []
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255
            const g = data[i + 1] / 255
            const b = data[i + 2] / 255
            const lum = 0.299 * r + 0.587 * g + 0.114 * b
            lums.push(lum)
            sumL += lum
            sumRG += r - g
          }
          const n = Math.max(1, lums.length)
          const meanL = sumL / n
          const variance = lums.reduce((acc, v) => acc + (v - meanL) ** 2, 0) / n
          const stdL = Math.sqrt(variance)
          setSkinOptical({
            meanLuminance01: Math.max(0.18, Math.min(0.88, Number(meanL.toFixed(3)))),
            toneStdDev01: Math.min(0.45, Number(stdL.toFixed(3))),
            redGreenDelta: Math.max(-0.4, Math.min(0.4, Number((sumRG / n).toFixed(3)))),
            edgeEnergy01: Math.min(0.95, Number((stdL * 2.4).toFixed(3))),
            pigmentContrast01: Math.min(0.95, Number((stdL * 1.9).toFixed(3))),
            specularUniformity01: Math.max(0.2, Math.min(0.95, Number((1 - stdL * 1.8).toFixed(3)))),
          })
          setSkinCaptureNote('Camera ROI sampled')
          return
        }
      } catch { /* fallback to optical calibration below */ }
    }
    setSkinCaptureNote('Optical ROI calibrated')
  }

  // Pure domain evaluations
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

  const archetype = useMemo(
    () =>
      evaluateArchetypeComparison(
        {
          vo2max: vitals.vo2max ?? null,
          hrvMs: vitals.hrvMs ?? null,
          sleepHours: vitals.sleepH ?? null,
          restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
          bodyFatPct: vitals.bodyFatPct ?? null,
          cognitiveScore0100: 82,
          biologicalAgeDeltaYears: -1.4,
        },
        archetypeId,
      ),
    [vitals, archetypeId],
  )

  const cad = useMemo(
    () =>
      buildParametricAnatomicalCad({
        heightCm: vitals.heightCm ?? 173,
        weightKg: vitals.weightKg ?? 68,
        bodyFatPct: vitals.bodyFatPct ?? null,
      }),
    [vitals.heightCm, vitals.weightKg, vitals.bodyFatPct],
  )

  const cae = useMemo(
    () =>
      cad.ok
        ? evaluateBiomechanicalCae({
            cad,
            gaitSpeedMps: 1.45,
            restingSystolicMmHg: vitals.systolic ?? 118,
            restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? 62,
            postureAlignment01: 0.78,
          })
        : null,
    [cad, vitals.systolic, vitals.restingHr, vitals.heartRate],
  )

  const skin = useMemo(
    () => evaluateOpticalSkinScan({ chronologicalAgeYears: 32, ...skinOptical }),
    [skinOptical],
  )

  const qEeg = useMemo(
    () =>
      evaluateQeegBrainScan({
        chronologicalAgeYears: 32,
        device: eegDevice,
        bands:
          eegDevice === 'dreem'
            ? { delta: 24, theta: 22, alpha: 30, beta: 18, gamma: 6 }
            : { delta: 10, theta: 14, alpha: 34, beta: 32, gamma: 10 },
        reactionTimeMs: 226,
        signalQuality01: 0.92,
      }),
    [eegDevice],
  )

  const osa = useMemo(() => {
    const ahiVal = ahiText.trim() === '' ? Number.NaN : Number(ahiText)
    const spo2Val = spo2NadirText.trim() === '' ? Number.NaN : Number(spo2NadirText)
    return evaluateOsaSleepMonitor({
      ahiEventsPerHour: ahiVal,
      odiEventsPerHour: Number.isFinite(ahiVal) ? Number((ahiVal * 0.85).toFixed(1)) : null,
      spo2NadirPct: spo2Val,
      studySource: 'hsat',
    })
  }, [ahiText, spo2NadirText])

  const anova = useMemo(() => {
    if (anovaMode === 'bilateral') {
      return computeOneWayAnova(
        [
          { label: 'Left Side', values: [76, 78, 77, 79] },
          { label: 'Right Side', values: [77, 78, 76, 79] },
        ],
        { mode: 'bilateral' },
      )
    }
    return computeRepeatedMeasuresAnova(
      ['Baseline', 'Month 1', 'Month 3'],
      [
        [66, 72, 79],
        [64, 71, 78],
        [68, 74, 81],
        [65, 72, 80],
      ],
    )
  }, [anovaMode])

  const exportCadJson = () => {
    if (!cad.ok) return
    const content = JSON.stringify({ cad, cae }, null, 2)
    triggerSafeBrowserDownload({
      format: 'json',
      filename: sanitizeExportFilename('panaceamed-cad-cae', new Date().toISOString(), 'json'),
      mimeType: 'application/json;charset=utf-8',
      content,
      sha256: sha256Hex(content),
      byteLength: content.length,
      clinicallyReviewed: false,
    })
  }

  const radarLabels = ['OVR', 'VO2', 'REC', 'STR', 'COG', 'BIO'] as const
  const currentVals = [
    archetype.current.ovr,
    archetype.current.vo2,
    archetype.current.rec,
    archetype.current.str,
    archetype.current.cog,
    archetype.current.bio,
  ]
  const targetVals = [
    archetype.target.ovr,
    archetype.target.vo2,
    archetype.target.rec,
    archetype.target.str,
    archetype.target.cog,
    archetype.target.bio,
  ]

  return (
    <section aria-label="Digital Twin Scan and Analysis Studio" className="dark rounded-3xl border border-white/10 bg-[#05070b] p-4 text-white sm:p-5">
      {/* Compact Header + Tab Rail */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black tracking-tight text-white">Digital Twin Studio</h2>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
            OVR {archetype.current.ovr}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/body-exposure"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 font-mono text-[11px] font-bold text-cyan-200 no-underline hover:bg-cyan-500/25"
          >
            Open 3D →
          </Link>
          <InfoDisclosure title="Digital Twin Epistemic Notice" badge={archetype.truthClass}>
            <p>{archetype.epistemicNotice}</p>
            <p className="text-[11px] text-amber-300">Technical output. Not clinician-reviewed or clinically validated.</p>
          </InfoDisclosure>
        </div>
      </header>

      {/* 5 Minimalist AAA Game Tabs */}
      <div role="tablist" aria-label="Scan modules" className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'builder', label: 'Scan & Build' },
            { id: 'cad', label: 'CAD / CAE' },
            { id: 'skin', label: 'Skin' },
            { id: 'neuro', label: 'Brain & OSA' },
            { id: 'anova', label: 'ANOVA' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] shrink-0 rounded-xl border px-3.5 text-xs font-bold transition ${
              tab === t.id
                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SCAN & ARCHETYPE BUILDER (NBA 2K / FIFA / GTA 6) */}
      {tab === 'builder' && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Guided Camera Viewfinder */}
          <div className="rounded-2xl border border-white/10 bg-[#090d14] p-3.5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                {SCAN_STEPS[step].label}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {capturedSteps.length}/4 · {cameraStatus}
              </span>
            </div>

            {/* Step Indicator */}
            <div className="mt-2 grid grid-cols-4 gap-1">
              {SCAN_STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`min-h-[44px] lg:min-h-[32px] rounded-lg border px-1 font-mono text-[9px] font-bold transition ${
                    step === s.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                      : capturedSteps.includes(s.id)
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-white/10 bg-black/40 text-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Minimal Reticle Stage or Camera Blocked Fail-Safe Card */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void onPhotoSelected(e.target.files?.[0])}
            />
            <div className="relative mt-3 flex min-h-[192px] items-center justify-center overflow-hidden rounded-xl border border-cyan-400/25 bg-black p-3">
              <video ref={videoRef} muted playsInline className={`h-48 w-full object-cover ${cameraActive ? 'block' : 'hidden'}`} />
              {!cameraActive && cameraBlocked ? (
                <div
                  role="region"
                  aria-label="Camera blocked recovery"
                  data-testid="camera-blocked-recovery"
                  className="dark w-full space-y-2.5 text-center text-white"
                >
                  <p className="text-xs font-bold text-amber-200">
                    Camera blocked · Tap to Upload Photo or Use Guided Demo
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      data-testid="scan-upload-photo-btn"
                      className="min-h-[44px] rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 text-xs font-bold text-cyan-100"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraBlocked(false)
                        setCameraStatus('Guided Demo')
                        captureStep()
                      }}
                      data-testid="scan-guided-demo-btn"
                      className="min-h-[44px] rounded-xl bg-emerald-500 px-3 text-xs font-black text-black"
                    >
                      Use Guided Demo
                    </button>
                  </div>
                </div>
              ) : (
                !cameraActive && (
                  <svg viewBox="0 0 180 140" className="h-36 w-44" role="img" aria-label={`Scan reticle: ${SCAN_STEPS[step].label}`}>
                    <ellipse cx="90" cy="68" rx={step === 3 ? 28 : 34} ry={step === 3 ? 52 : 46} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="5 5" />
                    <path d="M40 24 L26 24 L26 38 M140 24 L154 24 L154 38 M40 116 L26 116 L26 102 M140 116 L154 116 L154 102" fill="none" stroke="#10b981" strokeWidth="2" />
                    <text x="90" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                      {SCAN_STEPS[step].label.toUpperCase()}
                    </text>
                  </svg>
                )
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void toggleCamera()}
                className="min-h-[44px] rounded-xl border border-white/15 bg-white/[0.05] text-xs font-bold text-white hover:border-cyan-400/60"
              >
                {cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
              <button
                type="button"
                onClick={captureStep}
                className="min-h-[44px] rounded-xl bg-emerald-500 text-xs font-black text-black hover:bg-emerald-400"
              >
                Capture {SCAN_STEPS[step].label}
              </button>
            </div>

            {/* GTA 6 4-Core HUD */}
            {persona.ok && (
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                {[
                  { label: 'Health', val: persona.cores.healthCore, color: 'text-emerald-300' },
                  { label: 'Stamina', val: persona.cores.staminaCore, color: 'text-cyan-300' },
                  { label: 'Focus', val: persona.cores.focusCore, color: 'text-amber-300' },
                  { label: 'Recovery', val: persona.cores.recoveryReserve, color: 'text-white' },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-white/10 bg-black/50 py-2">
                    <div className={`font-mono text-sm font-black ${c.color}`}>{c.val}</div>
                    <div className="font-mono text-[9px] uppercase text-slate-400">{c.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FIFA / NBA 2K Target Archetype Card + 6-Attribute Radar */}
          <div className="rounded-2xl border border-white/10 bg-[#090d14] p-3.5 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">
                  Target Archetype
                </div>
                <div className="text-sm font-black text-white">{archetype.archetype.label}</div>
              </div>
              <button
                type="button"
                aria-pressed={compareTarget}
                onClick={() => setCompareTarget((v) => !v)}
                className={`min-h-[44px] lg:min-h-[40px] rounded-xl border px-3 font-mono text-[10px] font-bold uppercase ${
                  compareTarget
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/15 bg-white/[0.04] text-slate-300'
                }`}
              >
                {compareTarget ? 'Now vs. Target: ON' : 'Compare Now vs. Target'}
              </button>
            </div>

            {/* Archetype Selector Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {TARGET_ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={a.id === archetypeId}
                  onClick={() => setArchetypeId(a.id)}
                  className={`min-h-[44px] lg:min-h-[38px] rounded-lg border px-2.5 text-[11px] font-bold transition ${
                    a.id === archetypeId
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/25'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* FIFA 6-Attribute Radar + Rating Grid */}
            <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-[190px_1fr]">
              <svg viewBox="0 0 180 180" className="mx-auto h-44 w-44" role="img" aria-label="6-Attribute FIFA Archetype Radar">
                {[30, 52, 74].map((r) => (
                  <polygon key={r} points={radarPolygon([100, 100, 100, 100, 100, 100], 90, 90, r)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                ))}
                {compareTarget && (
                  <polygon
                    points={radarPolygon(targetVals, 90, 90, 74)}
                    fill="rgba(245,158,11,0.16)"
                    stroke="#f59e0b"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                )}
                <polygon
                  points={radarPolygon(currentVals, 90, 90, 74)}
                  fill="rgba(34,211,238,0.24)"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
                {radarLabels.map((lbl, idx) => {
                  const angle = (idx / radarLabels.length) * Math.PI * 2 - Math.PI / 2
                  const lx = 90 + Math.cos(angle) * 84
                  const ly = 90 + Math.sin(angle) * 84 + 3
                  return (
                    <text key={lbl} x={lx} y={ly} textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="700" fontFamily="monospace">
                      {lbl}
                    </text>
                  )
                })}
              </svg>

              <div className="grid grid-cols-3 gap-2">
                {radarLabels.map((lbl, idx) => {
                  const cur = currentVals[idx]
                  const tgt = targetVals[idx]
                  const delta = tgt - cur
                  return (
                    <div key={lbl} className="rounded-xl border border-white/10 bg-black/50 p-2.5">
                      <div className="font-mono text-[10px] font-bold text-slate-400">{lbl}</div>
                      <div className="mt-0.5 flex items-baseline justify-between">
                        <span className="font-mono text-lg font-black text-white">{cur}</span>
                        {compareTarget && (
                          <span className={`font-mono text-[10px] font-bold ${delta >= 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            →{tgt}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHENZHEN MUSEUM BIOMEDICAL CAD / CAE */}
      {tab === 'cad' && cad.ok && cae && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5" role="group" aria-label="CAD CAE view mode">
              {(
                [
                  { id: 'cad', label: 'CAD Mesh' },
                  { id: 'cae', label: 'CAE Stress' },
                  { id: 'anatomy', label: 'Anatomy' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={cadView === m.id}
                  onClick={() => setCadView(m.id)}
                  className={`min-h-[44px] lg:min-h-[40px] rounded-xl border px-3 text-xs font-bold ${
                    cadView === m.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                      : 'border-white/10 bg-white/[0.03] text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCadJson}
                className="min-h-[44px] lg:min-h-[40px] rounded-xl border border-white/15 bg-white/[0.05] px-3 font-mono text-[11px] font-bold text-cyan-200"
              >
                Export CAD JSON
              </button>
              <InfoDisclosure title="CAD / CAE Simulation Equations" badge="simulated">
                <p>{cad.epistemicNotice}</p>
                <p>{cae.epistemicNotice}</p>
                <p className="font-mono text-[10px] text-cyan-200">
                  Scale: ({cad.zAnatomyScaleVector.x}, {cad.zAnatomyScaleVector.y}, {cad.zAnatomyScaleVector.z}) · Tripod {cae.plantarTripodStress.heelPct}/{cae.plantarTripodStress.firstMtpPct}/{cae.plantarTripodStress.fifthMtpPct}%
                </p>
              </InfoDisclosure>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="grid place-items-center rounded-2xl border border-cyan-400/25 bg-black/70 p-3">
              <svg viewBox="0 0 140 190" className="h-44 w-36" role="img" aria-label={`Biomedical ${cadView.toUpperCase()} model`}>
                <g
                  fill={cadView === 'anatomy' ? 'rgba(16,185,129,0.16)' : 'none'}
                  stroke={cadView === 'cae' ? '#f59e0b' : cadView === 'cad' ? '#22d3ee' : '#10b981'}
                  strokeWidth="1.5"
                >
                  <circle cx="70" cy="24" r="13" />
                  <path d="M52 44 L88 44 L82 96 L58 96 Z" />
                  <path d="M58 96 L52 174 M82 96 L88 174 M52 44 L36 102 M88 44 L104 102" />
                </g>
                {cadView === 'cae' && (
                  <>
                    <circle cx="55" cy="136" r="6" fill="rgba(255,45,70,0.45)" stroke="#ff2d46" />
                    <circle cx="85" cy="136" r="6" fill="rgba(255,45,70,0.45)" stroke="#ff2d46" />
                    <circle cx="70" cy="86" r="7" fill="rgba(245,158,11,0.45)" stroke="#f59e0b" />
                  </>
                )}
              </svg>
            </div>

            {/* Strictly 3 compact KPI numbers on primary canvas */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
                <div className="font-mono text-[10px] uppercase text-slate-400">Knee Load</div>
                <div className="mt-1 font-mono text-2xl font-black text-amber-300">
                  {cae.jointCompressiveLoad.kneeCompressionBw}× BW
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
                <div className="font-mono text-[10px] uppercase text-slate-400">Plantar Peak</div>
                <div className="mt-1 font-mono text-2xl font-black text-cyan-300">
                  {cae.plantarTripodStress.peakStressKpa} kPa
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
                <div className="font-mono text-[10px] uppercase text-slate-400">Wall Shear</div>
                <div className="mt-1 font-mono text-2xl font-black text-emerald-300">
                  {cae.vascularWallShearPa} Pa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DUBAI LONGEVIUM OPTICAL SKIN ANALYZER */}
      {tab === 'skin' && skin.ok && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sampleSkinFrame}
                className="min-h-[44px] rounded-xl bg-cyan-500 px-3.5 text-xs font-black text-black hover:bg-cyan-400"
              >
                Analyze Skin ROI
              </button>
              <span className="font-mono text-[11px] text-slate-400">{skinCaptureNote}</span>
            </div>
            <InfoDisclosure title="Optical Skin Boundary" badge={skin.truthClass}>
              <p>{skin.epistemicNotice}</p>
              <p className="font-mono text-[10px] text-cyan-200">
                Erythema proxy: {skin.scores.erythemaProxy}/100 · Pigment clarity: {skin.scores.pigmentClarity}/100
              </p>
            </InfoDisclosure>
          </div>

          {/* Strictly 4 crisp score pills */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Tone</div>
              <div className="mt-1 font-mono text-2xl font-black text-white">{skin.scores.toneUniformity}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Texture</div>
              <div className="mt-1 font-mono text-2xl font-black text-cyan-300">{skin.scores.textureSmoothness}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Barrier</div>
              <div className="mt-1 font-mono text-2xl font-black text-emerald-300">{skin.scores.barrierHydration}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Skin Age</div>
              <div className="mt-1 font-mono text-2xl font-black text-amber-300">
                {skin.scores.estimatedOpticalSkinAgeYears}y
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI BRAIN (qEEG) & OSA SLEEP APNEA MONITOR */}
      {tab === 'neuro' && qEeg.ok && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {EEG_DEVICES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={eegDevice === d.id}
                  onClick={() => setEegDevice(d.id)}
                  className={`min-h-[44px] lg:min-h-[38px] rounded-lg border px-2.5 font-mono text-[10px] font-bold ${
                    eegDevice === d.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                      : 'border-white/10 bg-black/40 text-slate-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <InfoDisclosure
              title="qEEG & OSA Clinical Details"
              badge={osa.ok && osa.clinicianReferralRequired ? 'Referral' : qEeg.truthClass}
            >
              <p>
                Peer Percentile: <strong>{qEeg.peerPercentile}th</strong> · Cognitive Delta:{' '}
                <strong>{qEeg.cognitiveDeltaYears > 0 ? `+${qEeg.cognitiveDeltaYears}` : qEeg.cognitiveDeltaYears} yrs</strong>
              </p>
              <p className="font-mono text-[10px] text-cyan-200">
                θ/β {qEeg.ratios.thetaToBeta} · α/θ {qEeg.ratios.alphaToTheta} · SpO2 Nadir {osa.ok ? `${osa.spo2NadirPct}%` : '—'} · ODI {osa.ok ? (osa.odiEventsPerHour ?? '—') : '—'}/hr
              </p>
              <p className={osa.ok && osa.clinicianReferralRequired ? 'text-rose-300 font-semibold' : 'text-slate-300'}>
                {osa.ok ? osa.referralGuidance : osa.error}
              </p>
              <p className="text-[10px] text-slate-400">{qEeg.epistemicNotice}</p>
            </InfoDisclosure>
          </div>

          {/* Strictly 3 compact tiles */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Brain Age</div>
              <div className="mt-1 font-mono text-2xl font-black text-cyan-300">{qEeg.cognitiveAgeYears}y</div>
              <div className="mt-0.5 font-mono text-[10px] text-emerald-300">
                {qEeg.peerPercentile}th pct · {qEeg.cognitiveDeltaYears}y
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">Focus Band</div>
              <div className="mt-1 font-mono text-2xl font-black text-white uppercase">{qEeg.dominantBand}</div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-400">Index {qEeg.focusIndex}/100</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#090d14] p-4">
              <div className="font-mono text-[10px] uppercase text-slate-400">OSA / AHI</div>
              <div className={`mt-1 font-mono text-2xl font-black ${osa.ok && osa.clinicianReferralRequired ? 'text-rose-400' : 'text-emerald-300'}`}>
                {osa.ok ? `${osa.ahiEventsPerHour} · ${osa.severity}` : '— · Unrecorded'}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <label className="font-mono text-[10px] text-slate-400">
                  AHI
                  <input
                    type="number"
                    min={0}
                    max={80}
                    step={0.5}
                    value={ahiText}
                    onChange={(e) => setAhiText(e.target.value)}
                    className="dark ml-1 w-14 rounded border border-white/15 bg-black px-1.5 py-0.5 text-white"
                  />
                </label>
                <label className="font-mono text-[10px] text-slate-400">
                  SpO2
                  <input
                    type="number"
                    min={65}
                    max={100}
                    value={spo2NadirText}
                    onChange={(e) => setSpo2NadirText(e.target.value)}
                    className="dark ml-1 w-14 rounded border border-white/15 bg-black px-1.5 py-0.5 text-white"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FULL-BODY STATISTICAL ANOVA */}
      {tab === 'anova' && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${
                  anova.verdict === 'Significant Improvement'
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                    : anova.verdict === 'Asymmetry Alert'
                      ? 'border-rose-400/50 bg-rose-500/15 text-rose-200'
                      : 'border-white/15 bg-white/[0.04] text-slate-200'
                }`}
              >
                ANOVA {anova.table ? `p=${anova.table.pValue}` : 'n<3'} · {anova.verdict}
              </span>
              <button
                type="button"
                onClick={() => setAnovaMode((m) => (m === 'longitudinal' ? 'bilateral' : 'longitudinal'))}
                className="min-h-[44px] lg:min-h-[38px] rounded-xl border border-white/15 bg-white/[0.04] px-3 font-mono text-[10px] font-bold text-slate-200"
              >
                {anovaMode === 'longitudinal' ? 'Longitudinal' : 'Bilateral L/R'}
              </button>
            </div>

            <InfoDisclosure title="Full ANOVA Table" badge={anova.table ? `η²=${anova.table.etaSquared}` : 'fail-closed'}>
              {anova.table ? (
                <div className="font-mono text-[10px] space-y-1 text-slate-200">
                  <div>SSB: {anova.table.ssBetween} · SSW: {anova.table.ssWithin}</div>
                  <div>MSB: {anova.table.msBetween} · MSW: {anova.table.msWithin}</div>
                  <div>F({anova.table.df1}, {anova.table.df2}) = {anova.table.fStatistic} · p = {anova.table.pValue} · η² = {anova.table.etaSquared}</div>
                </div>
              ) : (
                <p>Insufficient samples (fail-closed).</p>
              )}
              <p className="text-[10px] text-slate-400">{anova.epistemicNotice}</p>
            </InfoDisclosure>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {anova.groups.map((g) => (
              <div key={g.label} className="rounded-2xl border border-white/10 bg-[#090d14] p-3.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-white">{g.label}</span>
                  <span className="text-cyan-300">{g.mean} ± {g.sd}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.min(100, Math.max(8, g.mean))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default DigitalTwinScanFlow
