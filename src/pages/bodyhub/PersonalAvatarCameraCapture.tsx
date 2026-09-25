import { useEffect, useRef, useState } from 'react'
import {
  PERSONAL_AVATAR_CAPTURE_VIEWS,
  PERSONAL_AVATAR_TRUTH_BOUNDARY,
  type PersonalAvatarCaptureViewId,
} from '../../lib/personalAvatar'

export interface CapturedPersonalAvatarFrame {
  viewId: PersonalAvatarCaptureViewId
  blob: Blob
  previewUrl: string
  capturedAt: string
  width: number
  height: number
}

interface PersonalAvatarCameraCaptureProps {
  subjectId?: string
  onScanReady?: (input: {
    subjectId: string | null
    frames: CapturedPersonalAvatarFrame[]
    source: 'monocular-rgb-multiframe'
  }) => void
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export default function PersonalAvatarCameraCapture({
  subjectId,
  onScanReady,
}: PersonalAvatarCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cancelledRef = useRef(false)
  const previewsRef = useRef<CapturedPersonalAvatarFrame[]>([])

  const [frames, setFrames] = useState<CapturedPersonalAvatarFrame[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'permission' | 'capturing' | 'ready' | 'error'>('idle')
  const [message, setMessage] = useState('One RGB camera · guided multi-view scan')
  const [error, setError] = useState('')

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function clearPreviews() {
    for (const frame of previewsRef.current) URL.revokeObjectURL(frame.previewUrl)
    previewsRef.current = []
    setFrames([])
  }

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      stopCamera()
      for (const frame of previewsRef.current) URL.revokeObjectURL(frame.previewUrl)
      previewsRef.current = []
    }
  }, [])

  async function ensureCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera capture is not supported in this browser.')
    if (streamRef.current) return
    setPhase('permission')
    setMessage('Allow camera access to begin the private scan.')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    if (cancelledRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    streamRef.current = stream
    const video = videoRef.current
    if (!video) throw new Error('Camera preview is unavailable.')
    video.srcObject = stream
    await video.play()
  }

  async function captureFrame(viewId: PersonalAvatarCaptureViewId): Promise<CapturedPersonalAvatarFrame> {
    const video = videoRef.current
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) throw new Error('Camera frame is not ready.')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Camera frame renderer is unavailable.')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Unable to capture camera frame.')), 'image/jpeg', 0.92)
    })
    return {
      viewId,
      blob,
      previewUrl: URL.createObjectURL(blob),
      capturedAt: new Date().toISOString(),
      width: canvas.width,
      height: canvas.height,
    }
  }

  async function runGuidedScan() {
    if (phase === 'capturing' || phase === 'permission') return
    setError('')
    clearPreviews()
    try {
      await ensureCamera()
      if (cancelledRef.current) return
      setPhase('capturing')
      const collected: CapturedPersonalAvatarFrame[] = []
      for (let index = 0; index < PERSONAL_AVATAR_CAPTURE_VIEWS.length; index += 1) {
        if (cancelledRef.current) return
        const view = PERSONAL_AVATAR_CAPTURE_VIEWS[index]
        setActiveIndex(index)
        setMessage(view.instruction)
        await sleep(index === 0 ? 1800 : 1450)
        if (cancelledRef.current) return
        const frame = await captureFrame(view.id)
        collected.push(frame)
        previewsRef.current = collected
        setFrames([...collected])
      }
      stopCamera()
      setPhase('ready')
      setMessage('9-view camera capture ready · reconstruction adapter is the next boundary')
      onScanReady?.({
        subjectId: subjectId?.trim() || null,
        frames: collected,
        source: 'monocular-rgb-multiframe',
      })
    } catch (cause) {
      stopCamera()
      setPhase('error')
      const text = cause instanceof Error ? cause.message : 'Unable to complete the camera scan.'
      setError(text)
      setMessage('Camera scan unavailable')
    }
  }

  const current = PERSONAL_AVATAR_CAPTURE_VIEWS[activeIndex] ?? PERSONAL_AVATAR_CAPTURE_VIEWS[0]
  const progress = frames.length / PERSONAL_AVATAR_CAPTURE_VIEWS.length

  return (
    <section
      data-personal-avatar-camera="v1"
      data-avatar-truth-layer="camera-surface-avatar"
      data-patient-specific-internal-anatomy="not-inferred"
      data-raw-frame-persistence="ephemeral"
      className="dark overflow-hidden rounded-[28px] border border-white/[.08] bg-[#030506] text-white"
      aria-labelledby="personal-avatar-camera-title"
    >
      <header className="flex items-end justify-between gap-3 border-b border-white/[.08] p-3 sm:p-4">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/65">My Body · camera import</div>
          <h3 id="personal-avatar-camera-title" className="mt-1 truncate text-base font-black sm:text-lg">Scan once. Build your personal surface avatar.</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black">{frames.length}/9</div>
          <div className="text-[8px] font-bold text-white/35">RGB views</div>
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className="relative min-h-[360px] overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-[420px] w-full scale-x-[-1] object-cover"
            aria-label="Personal avatar camera preview"
          />
          {phase !== 'capturing' && phase !== 'permission' ? (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,.09),transparent_42%),linear-gradient(180deg,rgba(2,5,8,.1),rgba(2,5,8,.72))] p-5">
              <button
                type="button"
                onClick={() => void runGuidedScan()}
                className="min-h-12 rounded-full bg-white px-6 text-xs font-black text-black transition active:scale-[.98]"
              >
                {phase === 'ready' ? 'Scan again' : 'Scan with camera'}
              </button>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-3">
            <div className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[9px] font-black backdrop-blur-xl">
              {phase === 'capturing' ? current.label : 'Camera only'}
            </div>
            <div className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[9px] font-bold text-white/70 backdrop-blur-xl">
              raw frames stay ephemeral
            </div>
          </div>

          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-xl">
            <div className="truncate text-[10px] font-black text-white/85">{message}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-1.5" aria-label="3 by 3 personal avatar capture QA grid">
            {PERSONAL_AVATAR_CAPTURE_VIEWS.map((view) => {
              const frame = frames.find((item) => item.viewId === view.id)
              return (
                <div key={view.id} className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/[.08] bg-white/[.025]">
                  {frame ? <img src={frame.previewUrl} alt={view.label} className="h-full w-full object-cover" /> : null}
                  <div className="absolute inset-x-1 bottom-1 truncate rounded-md bg-black/55 px-1.5 py-1 text-center text-[7px] font-black text-white/75 backdrop-blur">{view.label}</div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[.045] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-100/55">Reconstruction boundary</div>
            <div className="mt-1 text-[10px] font-bold text-white/75">
              Camera capture is live; game-quality rigged mesh reconstruction requires a verified reconstruction adapter before it may be called complete.
            </div>
          </div>

          <details className="mt-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-3">
            <summary className="cursor-pointer text-[9px] font-black text-white/60">Medical truth boundary</summary>
            <p className="mt-2 text-[9px] leading-relaxed text-white/40">{PERSONAL_AVATAR_TRUTH_BOUNDARY}</p>
          </details>

          {error ? <div className="mt-3 rounded-xl border border-red-300/15 bg-red-500/[.08] p-2 text-[9px] font-bold text-red-100/75">{error}</div> : null}
        </div>
      </div>
    </section>
  )
}
