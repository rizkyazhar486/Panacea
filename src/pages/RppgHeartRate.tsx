import { useEffect, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// rPPG (remote photoplethysmography) heart rate — a real, well-published
// technique: blood flow causes microscopic periodic changes in facial skin
// color (mostly in the green channel, which is most sensitive to hemoglobin
// absorption). We sample the mean green-channel value of a fixed central
// region of the webcam feed over ~20 seconds, detrend it, and find the
// dominant frequency in the 40-180 bpm band via autocorrelation. Runs
// entirely client-side (getUserMedia + canvas), no ML model, no server.
//
// This is a SIMPLE rPPG implementation (fixed ROI, no face tracking, no
// CHROM/POS chrominance-based algorithms real research pipelines use) — it
// is measurably less accurate than a real pulse oximeter or ECG, and is
// sensitive to lighting, motion, and skin tone contrast. It's presented
// honestly as an experimental estimate, not a medical measurement.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_SECONDS = 20
const MIN_BPM = 40
const MAX_BPM = 180

export function RppgHeartRate() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [bpm, setBpm] = useState<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const samplesRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const startRef = useRef(0)
  const fpsRef = useRef<{ t: number; n: number }>({ t: 0, n: 0 })

  const stop = () => {
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => () => stop(), [])

  const start = async () => {
    setError('')
    setBpm(null)
    samplesRef.current = []
    setProgress(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      startRef.current = performance.now()
      fpsRef.current = { t: startRef.current, n: 0 }
      setRunning(true)
      tick()
    } catch {
      setError('Could not access the camera — check browser permissions and try again.')
    }
  }

  const tick = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx && video.readyState >= 2) {
      canvas.width = 64; canvas.height = 64
      // Fixed central ROI — user is instructed to center their face there.
      ctx.drawImage(video, video.videoWidth * 0.35, video.videoHeight * 0.2, video.videoWidth * 0.3, video.videoHeight * 0.3, 0, 0, 64, 64)
      const frame = ctx.getImageData(0, 0, 64, 64).data
      let sumG = 0
      for (let i = 1; i < frame.length; i += 4) sumG += frame[i]
      const meanG = sumG / (frame.length / 4)
      samplesRef.current.push(meanG)
      fpsRef.current.n++
    }
    const elapsed = (performance.now() - startRef.current) / 1000
    setProgress(Math.min(1, elapsed / SAMPLE_SECONDS))
    if (elapsed >= SAMPLE_SECONDS) {
      finish()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const finish = () => {
    const samples = samplesRef.current
    const fps = fpsRef.current.n / SAMPLE_SECONDS
    stop()
    if (samples.length < fps * 5 || fps < 5) {
      setError('Not enough signal captured — try again with better, steady lighting on your face.')
      return
    }
    // Detrend: subtract a simple moving average (removes lighting drift).
    const win = Math.max(3, Math.round(fps * 1.5))
    const detrended = samples.map((v, i) => {
      const lo = Math.max(0, i - win), hi = Math.min(samples.length, i + win)
      const slice = samples.slice(lo, hi)
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length
      return v - avg
    })
    // Autocorrelation across lags corresponding to 40-180 bpm at this fps.
    const minLag = Math.round((60 / MAX_BPM) * fps)
    const maxLag = Math.round((60 / MIN_BPM) * fps)
    let bestLag = minLag, bestScore = -Infinity
    for (let lag = minLag; lag <= maxLag && lag < detrended.length / 2; lag++) {
      let sum = 0
      for (let i = 0; i < detrended.length - lag; i++) sum += detrended[i] * detrended[i + lag]
      if (sum > bestScore) { bestScore = sum; bestLag = lag }
    }
    const estimatedBpm = Math.round(60 / (bestLag / fps))
    if (estimatedBpm < MIN_BPM || estimatedBpm > MAX_BPM) {
      setError("Signal wasn't clear enough to estimate a heart rate — try again, keeping still with even lighting.")
      return
    }
    setBpm(estimatedBpm)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="rPPG Heart Rate (experimental)" subtitle="Estimate your pulse from your webcam — no wearable needed" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          <b>Experimental, not a medical device.</b> This estimates heart rate from subtle color changes
          in your face caused by blood flow (remote photoplethysmography) — accuracy depends heavily on
          lighting, stillness, and skin tone contrast, and it is measurably less accurate than a real
          pulse oximeter or ECG. Don't use it for any medical decision.
        </p>
      </Card>

      <Card className="!p-5 text-center">
        <video ref={videoRef} className="mx-auto w-full max-w-xs rounded-2xl bg-black" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {!running && bpm === null && (
          <button onClick={start} className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">Start 20-second scan</button>
        )}
        {running && (
          <>
            <p className="mt-3 text-[12px] text-neutral-500">Keep your face centered, still, and evenly lit.</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        {bpm !== null && (
          <div className="mt-4 rounded-xl bg-brand/10 p-4">
            <div className="text-4xl font-black text-brand-dark">{bpm} bpm</div>
            <div className="text-[11px] text-neutral-500">Estimated from a 20-second scan</div>
            <button onClick={start} className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white">Scan again</button>
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Green-channel rPPG with autocorrelation-based frequency detection, computed entirely in your
        browser — no video is uploaded or stored anywhere. Educational/experimental use only.
      </div>
    </div>
  )
}

export default RppgHeartRate
