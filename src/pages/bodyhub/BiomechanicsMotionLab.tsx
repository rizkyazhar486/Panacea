import { useEffect, useMemo, useRef, useState } from 'react'
import { AtlasViewer3D } from '../../components/AtlasViewer3D'
import { WORKOUT_MUSCLE_GROUPS } from '../../lib/workoutMuscles'

const MUSCLE_PARTS = WORKOUT_MUSCLE_GROUPS.flatMap((group) =>
  group.nodeNames.map((name) => ({ name, kind: 'muscle', group: group.key })),
).filter((part, index, all) => all.findIndex((candidate) => candidate.name === part.name) === index)

export default function BiomechanicsMotionLab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoName, setVideoName] = useState('')
  const [videoError, setVideoError] = useState('')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [groupKey, setGroupKey] = useState('quads')
  const group = WORKOUT_MUSCLE_GROUPS.find((item) => item.key === groupKey) ?? WORKOUT_MUSCLE_GROUPS[0]

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
      className="overflow-hidden border-y border-emerald-900/30 bg-transparent text-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1 py-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Biomechanics motion lab</div>
          <h3 className="truncate text-sm font-black">Motion ↔ source-backed atlas</h3>
        </div>
        <label className="grid min-h-11 shrink-0 cursor-pointer place-items-center border-b border-emerald-300/50 px-1 text-[10px] font-black text-emerald-200">
          Load video
          <input className="sr-only" type="file" accept="video/*" onChange={(event) => loadVideo(event.target.files?.[0])} />
        </label>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{videoStatus}</p>

      <div className="grid min-h-0 grid-cols-1 md:min-h-[430px] md:grid-cols-2">
        <div className="relative order-2 min-h-[300px] border-b border-white/10 bg-black sm:min-h-[340px] md:order-1 md:min-h-[430px] md:border-b-0 md:border-r">
          <div className="absolute left-3 top-3 z-10 border-b border-white/20 bg-black/70 px-2 py-1 text-[10px] font-bold">Original · {time.toFixed(2)}s</div>
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
              <div className="mt-2 text-xs font-black">Load your exercise clip</div>
              <p className="mt-1 max-w-xs truncate text-[10px] text-white/45">Local video · no unvalidated pose inference</p>
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
          className="relative order-1 min-h-[390px] bg-[#091613] sm:min-h-[430px] md:order-2"
          role="region"
          aria-label={`Source-backed rotatable muscle atlas. Current target: ${group.label}.`}
          aria-describedby="biomechanics-atlas-help biomechanics-atlas-state"
        >
          <div className="pointer-events-none absolute left-3 top-3 z-10 border-b border-white/20 bg-black/70 px-2 py-1 text-[10px] font-bold">Source atlas · drag or touch to rotate</div>
          <p id="biomechanics-atlas-help" className="sr-only">Interactive 3D anatomy remains the primary visualization. Drag with a pointer or use touch gestures supported by the atlas viewer to inspect the model.</p>
          <p id="biomechanics-atlas-state" className="sr-only" role="status" aria-live="polite">{group.label} selected. {group.nodeNames.length} source atlas nodes are requested for highlighting.</p>
          <AtlasViewer3D
            berkas="anatomy/muscular.glb"
            bagian={MUSCLE_PARTS}
            lesi={group.nodeNames}
            tinggi={430}
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/76 px-3 py-2">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[10px] font-black text-emerald-200">{group.label}</span><span className="shrink-0 text-[9px] text-white/45">{group.nodeNames.length} nodes</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 py-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="text-[9px] font-black uppercase tracking-wide text-white/50">Synchronized timeline · {phase}
            <input aria-label="Motion timeline" type="range" min="0" max="1" step="0.001" value={progress} disabled={!duration} onChange={(event) => seek(Number(event.target.value))} className="mt-2 block min-h-11 w-full accent-emerald-400" />
          </label>
          <div className="text-right font-mono text-[10px] text-white/50">{time.toFixed(2)} / {duration.toFixed(2)} s</div>
        </div>

        <div>
          <div className="mb-1.5 text-[9px] font-black uppercase tracking-wide text-white/45">Muscle / tendon target</div>
          <div className="flex gap-5 overflow-x-auto border-b border-white/10 pb-0" role="group" aria-label="Muscle and tendon targets">
            {WORKOUT_MUSCLE_GROUPS.map((item) => (
              <button key={item.key} type="button" aria-pressed={group.key === item.key} onClick={() => setGroupKey(item.key)} className={`min-h-11 shrink-0 border-0 border-b-2 bg-transparent px-0 text-[10px] font-bold ${group.key === item.key ? 'border-emerald-300 text-white' : 'border-transparent text-white/45'}`}>{item.label}</button>
            ))}
          </div>
        </div>

        <details className="border-t border-white/10 pt-2">
          <summary className="cursor-pointer text-[10px] font-black text-white/55">Validation boundaries & atlas provenance</summary>
          <div className="mt-2 grid gap-3 text-[10px] leading-relaxed text-white/55 sm:grid-cols-3">
            <p><span className="font-black text-emerald-300">Pose · </span>BLOCKED until validated per-frame landmark inference is connected. No synthetic skeleton is drawn over the user video.</p>
            <p><span className="font-black text-emerald-300">Force vectors · </span>BLOCKED until subject scale, external load, segment kinematics and a validated inverse-dynamics model are available. Muscle highlighting is not a force estimate.</p>
            <p><span className="font-black text-emerald-300">Atlas provenance · </span>Only named nodes already bound to the shipped muscular atlas are highlighted. Missing tendons or structures are never substituted with neighbouring geometry.</p>
          </div>
        </details>
      </div>
    </section>
  )
}
