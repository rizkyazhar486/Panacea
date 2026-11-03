import { useEffect, useMemo, useRef, useState } from 'react'
import { AtlasViewer3D } from '../../components/AtlasViewer3D'
import { WORKOUT_MUSCLE_GROUPS } from '../../lib/workoutMuscles'
import {
  calculateSagittalKinematics,
  calculateVerticalGrf,
  evaluateGaitSymmetry,
  classifyPathologicalGaitCycle,
  GAIT_LIBRARY_DISCLAIMER,
  GAIT_BIOMECHANICS_SOURCE,
  type GaitCycleKinematicsInput,
  type GaitSymmetryInput,
  type PathologicalGaitPatternId,
} from '../../domains/body-exposure'

const MUSCLE_PARTS = WORKOUT_MUSCLE_GROUPS.flatMap((group) =>
  group.nodeNames.map((name) => ({ name, kind: 'muscle', group: group.key })),
).filter((part, index, all) => all.findIndex((candidate) => candidate.name === part.name) === index)

interface PathologicalPreset {
  id: PathologicalGaitPatternId
  label: string
  associatedMuscleGroup: string
  kinematics: GaitCycleKinematicsInput
  symmetry: GaitSymmetryInput
}

const PATHOLOGICAL_PRESETS: PathologicalPreset[] = [
  {
    id: 'normal-physiological-gait',
    label: 'Normal Physiological 60/40',
    associatedMuscleGroup: 'quads',
    kinematics: {
      stancePhasePercent: 60,
      swingPhasePercent: 40,
      cadenceStepsPerMin: 110,
      stepWidthCm: 9,
      swingAnkleDorsiflexionDeg: 2,
      swingKneeFlexionPeakDeg: 60,
      contralateralPelvicDropDeg: 1.5,
      stepTimingVariabilityCvPercent: 2.5,
    },
    symmetry: {
      leftStrideLengthM: 1.40,
      rightStrideLengthM: 1.40,
      leftStancePercent: 60,
      rightStancePercent: 60,
      leftPeakGrfBw: 1.18,
      rightPeakGrfBw: 1.18,
      cadenceStepsPerMin: 110,
    },
  },
  {
    id: 'steppage-foot-drop-gait',
    label: 'Steppage Foot-Drop (Common Fibular L5)',
    associatedMuscleGroup: 'calves',
    kinematics: {
      stancePhasePercent: 60,
      swingPhasePercent: 40,
      cadenceStepsPerMin: 95,
      stepWidthCm: 10,
      swingAnkleDorsiflexionDeg: -12,
      swingKneeFlexionPeakDeg: 75,
      contralateralPelvicDropDeg: 2,
      stepTimingVariabilityCvPercent: 3.5,
    },
    symmetry: {
      leftStrideLengthM: 1.35,
      rightStrideLengthM: 1.20,
      leftStancePercent: 60,
      rightStancePercent: 55,
      leftPeakGrfBw: 1.15,
      rightPeakGrfBw: 1.05,
      cadenceStepsPerMin: 95,
    },
  },
  {
    id: 'trendelenburg-abductor-gait',
    label: 'Trendelenburg Lurch (Gluteus Medius L4-S1)',
    associatedMuscleGroup: 'glutes',
    kinematics: {
      stancePhasePercent: 60,
      swingPhasePercent: 40,
      cadenceStepsPerMin: 100,
      stepWidthCm: 11,
      swingAnkleDorsiflexionDeg: 1,
      swingKneeFlexionPeakDeg: 60,
      contralateralPelvicDropDeg: 6.5,
      stepTimingVariabilityCvPercent: 3.0,
    },
    symmetry: {
      leftStrideLengthM: 1.38,
      rightStrideLengthM: 1.30,
      leftStancePercent: 62,
      rightStancePercent: 56,
      leftPeakGrfBw: 1.20,
      rightPeakGrfBw: 1.08,
      cadenceStepsPerMin: 100,
    },
  },
  {
    id: 'hemiplegic-circumduction-gait',
    label: 'Hemiplegic Stiff-Knee (UMN Synergy)',
    associatedMuscleGroup: 'quads',
    kinematics: {
      stancePhasePercent: 65,
      swingPhasePercent: 35,
      cadenceStepsPerMin: 80,
      stepWidthCm: 12,
      swingAnkleDorsiflexionDeg: -10,
      swingKneeFlexionPeakDeg: 30,
      contralateralPelvicDropDeg: 2,
      stepTimingVariabilityCvPercent: 4.0,
    },
    symmetry: {
      leftStrideLengthM: 1.40,
      rightStrideLengthM: 1.05,
      leftStancePercent: 68,
      rightStancePercent: 48,
      leftPeakGrfBw: 1.25,
      rightPeakGrfBw: 0.90,
      cadenceStepsPerMin: 80,
    },
  },
  {
    id: 'parkinsonian-festinating-gait',
    label: 'Parkinsonian Festinating (Basal Ganglia)',
    associatedMuscleGroup: 'calves',
    kinematics: {
      stancePhasePercent: 62,
      swingPhasePercent: 38,
      cadenceStepsPerMin: 142,
      stepWidthCm: 8,
      swingAnkleDorsiflexionDeg: 0,
      swingKneeFlexionPeakDeg: 42,
      contralateralPelvicDropDeg: 1,
      stepTimingVariabilityCvPercent: 5.5,
    },
    symmetry: {
      leftStrideLengthM: 0.85,
      rightStrideLengthM: 0.82,
      leftStancePercent: 62,
      rightStancePercent: 60,
      leftPeakGrfBw: 1.05,
      rightPeakGrfBw: 1.02,
      cadenceStepsPerMin: 142,
    },
  },
  {
    id: 'cerebellar-ataxic-gait',
    label: 'Cerebellar Ataxic (Wide-Base Support)',
    associatedMuscleGroup: 'hamstrings',
    kinematics: {
      stancePhasePercent: 64,
      swingPhasePercent: 36,
      cadenceStepsPerMin: 88,
      stepWidthCm: 22,
      swingAnkleDorsiflexionDeg: 1,
      swingKneeFlexionPeakDeg: 55,
      contralateralPelvicDropDeg: 2.5,
      stepTimingVariabilityCvPercent: 12.0,
    },
    symmetry: {
      leftStrideLengthM: 1.15,
      rightStrideLengthM: 1.08,
      leftStancePercent: 65,
      rightStancePercent: 62,
      leftPeakGrfBw: 1.10,
      rightPeakGrfBw: 1.06,
      cadenceStepsPerMin: 88,
    },
  },
  {
    id: 'antalgic-limping-gait',
    label: 'Antalgic Limp (Pain Avoidance / Shortened Stance)',
    associatedMuscleGroup: 'glutes',
    kinematics: {
      stancePhasePercent: 48,
      swingPhasePercent: 52,
      cadenceStepsPerMin: 90,
      stepWidthCm: 11,
      swingAnkleDorsiflexionDeg: 2,
      swingKneeFlexionPeakDeg: 58,
      contralateralPelvicDropDeg: 2.0,
      stepTimingVariabilityCvPercent: 4.5,
    },
    symmetry: {
      leftStrideLengthM: 1.42,
      rightStrideLengthM: 1.12,
      leftStancePercent: 64,
      rightStancePercent: 48,
      leftPeakGrfBw: 1.22,
      rightPeakGrfBw: 0.82,
      cadenceStepsPerMin: 90,
    },
  },
]

export default function BiomechanicsMotionLab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoName, setVideoName] = useState('')
  const [videoError, setVideoError] = useState('')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [groupKey, setGroupKey] = useState('quads')
  const [activeTab, setActiveTab] = useState<'atlas' | 'sensorium'>('sensorium')
  const [manualCyclePercent, setManualCyclePercent] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState<PathologicalGaitPatternId>('normal-physiological-gait')
  const [bodyMassKg, setBodyMassKg] = useState(70)

  const group = WORKOUT_MUSCLE_GROUPS.find((item) => item.key === groupKey) ?? WORKOUT_MUSCLE_GROUPS[0]
  const preset = PATHOLOGICAL_PRESETS.find((p) => p.id === selectedPresetId) ?? PATHOLOGICAL_PRESETS[0]

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const progress = duration > 0 ? Math.min(1, time / duration) : 0
  const phase = useMemo(() => {
    if (!duration) return 'No motion loaded'
    if (progress < 0.2) return 'Setup'
    if (progress < 0.5) return 'Loading / eccentric window'
    if (progress < 0.8) return 'Propulsion / concentric window'
    return 'Recovery'
  }, [duration, progress])

  // Effective gait cycle percent (syncs with video if loaded, else manual scrub)
  const effectiveCyclePercent = duration > 0 ? Math.round(progress * 100) : manualCyclePercent

  // Kinematics and GRF evaluations
  const sagittal = useMemo(() => calculateSagittalKinematics(effectiveCyclePercent), [effectiveCyclePercent])
  const grf = useMemo(
    () => calculateVerticalGrf(effectiveCyclePercent, bodyMassKg, preset.kinematics.stancePhasePercent),
    [effectiveCyclePercent, bodyMassKg, preset.kinematics.stancePhasePercent],
  )
  const symmetry = useMemo(() => evaluateGaitSymmetry(preset.symmetry), [preset])
  const pathologyEvaluation = useMemo(() => classifyPathologicalGaitCycle(preset.kinematics), [preset])

  function loadVideo(file: File | undefined) {
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setVideoUrl(url)
    setVideoName(file.name)
    setVideoError('')
    setTime(0)
    setDuration(0)
  }

  function seek(value: number) {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    video.currentTime = value * video.duration
    setTime(video.currentTime)
  }

  function handleSelectPreset(p: PathologicalPreset) {
    setSelectedPresetId(p.id)
    setGroupKey(p.associatedMuscleGroup)
  }

  const videoStatus = videoError
    ? videoError
    : videoUrl
      ? duration > 0
        ? `${videoName || 'Motion video'} ready. Duration ${duration.toFixed(1)} seconds.`
        : `${videoName || 'Motion video'} loading.`
      : 'No motion video loaded. The source-backed 3D atlas remains available.'

  return (
    <section
      data-biomechanics-motion-lab="v1"
      aria-label="Biomechanics motion lab"
      className="dark overflow-hidden rounded-2xl border border-emerald-900/30 bg-[#07110f] text-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Biomechanics & Sensorium Lab</div>
          <h3 className="mt-1 text-sm font-black">Original Motion ↔ 3D Anatomical Atlas ↔ Kinematics Pipeline</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/55">
            Pillar V multi-scale biomechanics: scrub real exercise footage or simulate physiological and pathological gait cycles.
            Computes sagittal joint excursion (Hip, Knee, Ankle, 1st MTP Windlass), bimodal vertical Ground Reaction Force (GRF),
            and bilateral Robinson Symmetry Index.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '2px', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('sensorium')}
              style={{
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: activeTab === 'sensorium' ? '#6ee7b7' : 'transparent',
                color: activeTab === 'sensorium' ? '#000000' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Kinematics Telemetry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('atlas')}
              style={{
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: activeTab === 'atlas' ? '#6ee7b7' : 'transparent',
                color: activeTab === 'atlas' ? '#000000' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Muscle Atlas
            </button>
          </div>
          <label className="min-h-11 cursor-pointer rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-[10px] font-black text-emerald-200">
            Load motion video
            <input className="sr-only" type="file" accept="video/*" onChange={(event) => loadVideo(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{videoStatus}</p>

      <div className="grid min-h-0 grid-cols-1 md:min-h-[430px] md:grid-cols-2">
        <div className="relative min-h-[300px] border-b border-white/10 bg-black sm:min-h-[340px] md:min-h-[430px] md:border-b-0 md:border-r">
          <div className="absolute left-3 top-3 z-10 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold backdrop-blur">
            {videoUrl ? `Video Time: ${time.toFixed(2)}s` : `Synthetic Cycle: ${effectiveCyclePercent}%`}
          </div>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={videoName ? `Motion video: ${videoName}` : 'Loaded motion video'}
              className="h-full min-h-[300px] w-full object-contain sm:min-h-[340px] md:min-h-[430px]"
              onLoadedMetadata={(event) => {
                setDuration(event.currentTarget.duration || 0)
                setVideoError('')
              }}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              onError={() => {
                setDuration(0)
                setVideoError('The selected video could not be decoded in this browser. The 3D atlas remains available.')
              }}
            />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center sm:min-h-[340px] md:min-h-[430px]">
              <div className="text-3xl" aria-hidden="true">＋</div>
              <div className="mt-2 text-xs font-black">Load exercise clip or scrub synthetic gait</div>
              <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-white/45">
                The video stays local in your browser. With or without video, the 3D Kinematics and Sensorium pipeline computes real-time joint telemetry and ground reaction forces.
              </p>
            </div>
          )}
          {videoError && (
            <div className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-amber-300/30 bg-black/80 p-2 text-[10px] leading-relaxed text-amber-100" role="alert">
              {videoError}
            </div>
          )}
          {videoName && !videoError && <div className="absolute bottom-12 left-3 max-w-[80%] truncate rounded bg-black/60 px-2 py-1 text-[9px] text-white/60">{videoName}</div>}
        </div>

        <div
          className="relative min-h-[390px] bg-[#091613] sm:min-h-[430px]"
          role="region"
          aria-label={`Source-backed rotatable muscle atlas. Current target: ${group.label}.`}
          aria-describedby="biomechanics-atlas-help biomechanics-atlas-state"
        >
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold backdrop-blur">
            Source atlas · drag or touch to rotate
          </div>
          <p id="biomechanics-atlas-help" className="sr-only">Interactive 3D anatomy remains the primary visualization. Drag with a pointer or use touch gestures supported by the atlas viewer to inspect the model.</p>
          <p id="biomechanics-atlas-state" className="sr-only" role="status" aria-live="polite">{group.label} selected. {group.nodeNames.length} source atlas nodes are requested for highlighting.</p>
          <AtlasViewer3D
            berkas="anatomy/muscular.glb"
            bagian={MUSCLE_PARTS}
            lesi={group.nodeNames}
            tinggi={430}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-white/10 bg-black/65 p-2 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-emerald-200">{group.label}</span>
              <span className="text-[9px] text-white/45">{group.nodeNames.length} source nodes</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/55">{group.penjelasan.aksi}</p>
          </div>
        </div>
      </div>

      {/* Main Controls & Telemetry Dashboard */}
      <div className="space-y-3 border-t border-white/10 p-3 sm:p-4">
        {/* Timeline Slider */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="text-[9px] font-black uppercase tracking-wide text-white/50">
            {duration > 0
              ? `Synchronized video timeline · ${phase}`
              : `Gait cycle phase · ${sagittal.phaseLabel} (${effectiveCyclePercent}%)`}
            <input
              aria-label="Motion timeline"
              type="range"
              min="0"
              max={duration > 0 ? 1 : 100}
              step={duration > 0 ? 0.001 : 1}
              value={duration > 0 ? progress : manualCyclePercent}
              onChange={(event) => {
                const val = Number(event.target.value)
                if (duration > 0) {
                  seek(val)
                } else {
                  setManualCyclePercent(val)
                }
              }}
              className="mt-2 block min-h-11 w-full accent-emerald-400"
            />
          </label>
          <div className="text-right font-mono text-[10px] text-white/50">
            {duration > 0 ? `${time.toFixed(2)} / ${duration.toFixed(2)} s` : `Cycle: ${effectiveCyclePercent}%`}
          </div>
        </div>

        {activeTab === 'sensorium' ? (
          <div className="space-y-3">
            {/* Real-time Kinematic Telemetry Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {/* Sagittal Hip Excursion */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Hip Flexion / Extension</span>
                  <span className="font-mono text-xs font-bold text-white">{sagittal.hipDeg}°</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  Envelope: +25° to -15° (Δθ ≈ 40°)
                </div>
                <div style={{ marginTop: '4px', height: '6px', width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#34d399',
                      width: `${Math.min(100, Math.max(0, ((sagittal.hipDeg + 15) / 40) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sagittal Knee Flexion */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Knee Flexion</span>
                  <span className="font-mono text-xs font-bold text-white">{sagittal.kneeDeg}°</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  Peak swing clearance: 60°
                </div>
                <div style={{ marginTop: '4px', height: '6px', width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#34d399',
                      width: `${Math.min(100, Math.max(0, (sagittal.kneeDeg / 60) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sagittal Ankle Dorsi/Plantarflexion */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Ankle Joint</span>
                  <span className="font-mono text-xs font-bold text-white">{sagittal.ankleDeg}°</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  {sagittal.ankleDeg >= 0 ? `Dorsiflexion (+${sagittal.ankleDeg}°)` : `Plantarflexion (${sagittal.ankleDeg}°)`}
                </div>
                <div style={{ marginTop: '4px', height: '6px', width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#34d399',
                      width: `${Math.min(100, Math.max(0, ((sagittal.ankleDeg + 20) / 35) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* 1st MTP Windlass Mechanism */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-[9px] font-black uppercase tracking-wide text-emerald-300">1st MTP Joint (Hallux)</span>
                  <span className="font-mono text-xs font-bold text-white">{sagittal.mtpDeg}°</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Excursion: 0° - 65°</span>
                  {sagittal.windlassActive && (
                    <span style={{ borderRadius: '4px', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold', backgroundColor: '#6ee7b7', color: '#000000' }}>
                      Windlass Active
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '4px', height: '6px', width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#34d399',
                      width: `${Math.min(100, Math.max(0, (sagittal.mtpDeg / 65) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* GRF & Symmetry Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {/* Ground Reaction Force (GRF) */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Vertical Ground Reaction Force (Fz)</div>
                    <div className="mt-1 text-xs font-black text-white">
                      {grf.normalizedBw} BW · <span className="font-mono font-normal text-white/70">{grf.forceN} N</span>
                    </div>
                  </div>
                  <span style={{ borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    {grf.phase}
                  </span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  <span>Loading rate: {grf.loadingRateBwPerSec} BW/s</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Mass:</span>
                    <input
                      type="number"
                      min="40"
                      max="150"
                      value={bodyMassKg}
                      onChange={(e) => setBodyMassKg(Number(e.target.value) || 70)}
                      style={{ width: '48px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 4px', textAlign: 'right', fontFamily: 'monospace', fontSize: '9px', color: '#ffffff' }}
                    />
                    <span>kg</span>
                  </label>
                </div>
                <div style={{ marginTop: '8px', height: '8px', width: '100%', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (grf.normalizedBw / 1.3) * 100)}%`,
                      backgroundColor: grf.normalizedBw > 1.1 ? '#34d399' : grf.normalizedBw > 0 ? '#6ee7b7' : 'transparent',
                    }}
                  />
                </div>
              </div>

              {/* Bilateral Gait Symmetry */}
              <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Bilateral Symmetry (Robinson SI)</div>
                    <div className="mt-1 text-xs font-black text-white">
                      GSS Composite: {symmetry.compositeSymmetryScore}%
                    </div>
                  </div>
                  <span
                    style={{
                      borderRadius: '9999px',
                      border: '1px solid',
                      padding: '2px 8px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      borderColor:
                        symmetry.symmetryClass === 'normal-symmetric'
                          ? 'rgba(110, 231, 183, 0.4)'
                          : symmetry.symmetryClass === 'mild-asymmetry'
                            ? 'rgba(252, 211, 77, 0.4)'
                            : 'rgba(251, 113, 133, 0.4)',
                      backgroundColor:
                        symmetry.symmetryClass === 'normal-symmetric'
                          ? 'rgba(110, 231, 183, 0.1)'
                          : symmetry.symmetryClass === 'mild-asymmetry'
                            ? 'rgba(252, 211, 77, 0.1)'
                            : 'rgba(251, 113, 133, 0.1)',
                      color:
                        symmetry.symmetryClass === 'normal-symmetric'
                          ? '#a7f3d0'
                          : symmetry.symmetryClass === 'mild-asymmetry'
                            ? '#fde68a'
                            : '#fecdd3',
                    }}
                  >
                    {symmetry.symmetryClass}
                  </span>
                </div>
                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
                  <div>Stride SI: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{symmetry.strideLengthSymmetryIndexPercent}%</span></div>
                  <div>Stance SI: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{symmetry.stancePercentSymmetryIndexPercent}%</span></div>
                  <div>GRF Peak SI: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{symmetry.peakGrfSymmetryIndexPercent}%</span></div>
                </div>
              </div>
            </div>

            {/* Pathological Gait Abnormality Explorer */}
            <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', padding: '12px' }}>
              <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Pathological Gait Abnormality Classification (Perry 2010)</div>
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PATHOLOGICAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      borderRadius: '8px',
                      border: selectedPresetId === p.id ? '1px solid #6ee7b7' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: selectedPresetId === p.id ? '#6ee7b7' : 'transparent',
                      color: selectedPresetId === p.id ? '#000000' : 'rgba(255,255,255,0.6)',
                      padding: '4px 10px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Evaluation findings */}
              {pathologyEvaluation.ok && (
                <div style={{ marginTop: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)', padding: '8px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: '#a7f3d0' }}>{pathologyEvaluation.primaryPattern}</span>
                    <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>Stance:Swing = {pathologyEvaluation.stanceToSwingRatio}</span>
                  </div>
                  <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Correlate: </span>
                    {pathologyEvaluation.anatomicalCorrelate}
                  </div>
                  <div style={{ marginTop: '2px', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Signatures: </span>
                    {pathologyEvaluation.matchedSignatures.join('; ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Muscle & Tendon Target Selector (Original Mode) */
          <div>
            <div className="mb-1.5 text-[9px] font-black uppercase tracking-wide text-white/45">Muscle / tendon target</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Muscle and tendon targets">
              {WORKOUT_MUSCLE_GROUPS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={group.key === item.key}
                  onClick={() => setGroupKey(item.key)}
                  className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-bold ${
                    group.key === item.key ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 text-white/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preserved Engineering Disclosures */}
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Pose</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">BLOCKED until validated per-frame landmark inference is connected. No synthetic skeleton is drawn over the user video.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Force vectors</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">BLOCKED until subject scale, external load, segment kinematics and a validated inverse-dynamics model are available. Muscle highlighting is not a force estimate.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Atlas provenance</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">Only named nodes already bound to the shipped muscular atlas are highlighted. Missing tendons or structures are never substituted with neighbouring geometry.</p></div>
        </div>

        {/* Clinical Disclaimer & Citations */}
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-[9px] text-white/45 space-y-1">
          <div className="font-bold text-white/60">{GAIT_LIBRARY_DISCLAIMER}</div>
          <div>Citations: {GAIT_BIOMECHANICS_SOURCE.citation} (PMID: {GAIT_BIOMECHANICS_SOURCE.pmid}); Hicks JH. J Anat. 1954 (PMID: 13129168).</div>
        </div>
      </div>
    </section>
  )
}
