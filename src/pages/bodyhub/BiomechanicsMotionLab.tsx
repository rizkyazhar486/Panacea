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
    setTime(0)
    setDuration(0)
  }

  function seek(value: number) {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    video.currentTime = value * video.duration
    setTime(video.currentTime)
  }

  return (
    <section data-biomechanics-motion-lab="v1" className="overflow-hidden rounded-2xl border border-emerald-900/30 bg-[#07110f] text-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Biomechanics motion lab</div>
          <h3 className="mt-1 text-sm font-black">Original motion ↔ source-backed anatomical atlas</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/55">A side-by-side workspace inspired by the supplied reference: scrub a real exercise video while inspecting the corresponding source-backed muscle atlas. The atlas remains rotatable and the same timeline stays visible on mobile.</p>
        </div>
        <label className="min-h-10 cursor-pointer rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-[10px] font-black text-emerald-200 focus-within:ring-2 focus-within:ring-emerald-300 focus-within:ring-offset-2 focus-within:ring-offset-[#07110f]">
          Load motion video
          <input className="sr-only" type="file" accept="video/*" onChange={(event) => loadVideo(event.target.files?.[0])} />
        </label>
      </div>

      <div className="grid min-h-[430px] grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[360px] border-b border-white/10 bg-black md:border-b-0 md:border-r">
          <div className="absolute left-3 top-3 z-10 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold backdrop-blur">Original · {time.toFixed(2)}s</div>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="h-full min-h-[360px] w-full object-contain"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            />
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="text-3xl">＋</div>
              <div className="mt-2 text-xs font-black">Load your exercise clip</div>
              <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-white/45">The video stays local in this browser session. Panacea does not claim pose tracking until a validated pose-estimation pipeline is connected.</p>
            </div>
          )}
          {videoName && <div className="absolute bottom-12 left-3 max-w-[80%] truncate rounded bg-black/60 px-2 py-1 text-[9px] text-white/60">{videoName}</div>}
        </div>

        <div className="relative min-h-[430px] bg-[#091613]">
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold backdrop-blur">Source atlas · drag to rotate</div>
          <AtlasViewer3D
            berkas="anatomy/muscular.glb"
            bagian={MUSCLE_PARTS}
            lesi={group.nodeNames}
            tinggi={430}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-white/10 bg-black/65 p-2 backdrop-blur">
            <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-emerald-200">{group.label}</span><span className="text-[9px] text-white/45">{group.nodeNames.length} source nodes</span></div>
            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/55">{group.penjelasan.aksi}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="text-[9px] font-black uppercase tracking-wide text-white/50">Synchronized timeline · <span aria-live="polite">{phase}</span>
            <input aria-label="Motion timeline" type="range" min="0" max="1" step="0.001" value={progress} disabled={!duration} onChange={(event) => seek(Number(event.target.value))} className="mt-2 block w-full accent-emerald-400" />
          </label>
          <div className="text-right font-mono text-[10px] text-white/50">{time.toFixed(2)} / {duration.toFixed(2)} s</div>
        </div>

        <div>
          <div className="mb-1.5 text-[9px] font-black uppercase tracking-wide text-white/45">Muscle / tendon target</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {WORKOUT_MUSCLE_GROUPS.map((item) => (
              <button key={item.key} type="button" aria-pressed={group.key === item.key} onClick={() => setGroupKey(item.key)} className={`min-h-9 shrink-0 rounded-full border px-3 text-[10px] font-bold ${group.key === item.key ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 text-white/60'}`}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Pose</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">BLOCKED until validated per-frame landmark inference is connected. No synthetic skeleton is drawn over the user video.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Force vectors</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">BLOCKED until subject scale, external load, segment kinematics and a validated inverse-dynamics model are available. Muscle highlighting is not a force estimate.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Atlas provenance</div><p className="mt-1 text-[10px] leading-relaxed text-white/55">Only named nodes already bound to the shipped muscular atlas are highlighted. Missing tendons or structures are never substituted with neighbouring geometry.</p></div>
        </div>
      </div>
    </section>
  )
}
