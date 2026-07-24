import { useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Vocal Biomarker Analyzer — records a sustained vowel sound and computes
// real acoustic measures used in clinical voice analysis: fundamental
// frequency (F0, via autocorrelation pitch detection per short frame),
// jitter (cycle-to-cycle F0 variability, %) and shimmer (cycle-to-cycle
// amplitude variability, %). Reference thresholds (jitter <1.04%, shimmer
// <3.81%) are the commonly-cited MDVP (Multi-Dimensional Voice Program)
// normal-voice cutoffs from voice-science literature — not a diagnostic
// tool. Runs entirely client-side via Web Audio API, no server, no model.
// ─────────────────────────────────────────────────────────────────────────────

const RECORD_SECONDS = 5
const JITTER_NORMAL_MAX = 1.04
const SHIMMER_NORMAL_MAX = 3.81

interface Result { f0: number; jitterPct: number; shimmerPct: number; periods: number }

function autocorrelatePitch(buf: Float32Array, sampleRate: number): { f0: number; periodSamples: number } | null {
  const minF0 = 70, maxF0 = 400
  const maxLag = Math.floor(sampleRate / minF0)
  const minLag = Math.floor(sampleRate / maxF0)
  let bestLag = -1, bestCorr = 0
  for (let lag = minLag; lag <= maxLag && lag < buf.length; lag++) {
    let corr = 0
    for (let i = 0; i < buf.length - lag; i++) corr += buf[i] * buf[i + lag]
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag }
  }
  if (bestLag <= 0) return null
  return { f0: sampleRate / bestLag, periodSamples: bestLag }
}

export function VocalBiomarkers() {
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)

  const record = async () => {
    setError(''); setResult(null); setProgress(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      streamRef.current = stream
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const processorBufferSize = 4096
      const chunks: Float32Array[] = []
      const processor = ctx.createScriptProcessor(processorBufferSize, 1, 1)
      source.connect(processor)
      processor.connect(ctx.destination)
      setRecording(true)
      const start = performance.now()
      processor.onaudioprocess = (e) => {
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
        const elapsed = (performance.now() - start) / 1000
        setProgress(Math.min(1, elapsed / RECORD_SECONDS))
        if (elapsed >= RECORD_SECONDS) {
          processor.disconnect(); source.disconnect()
          stream.getTracks().forEach((t) => t.stop())
          setRecording(false)
          analyze(chunks, ctx.sampleRate)
          ctx.close()
        }
      }
    } catch {
      setError('Could not access the microphone — check browser permissions and try again.')
    }
  }

  const analyze = (chunks: Float32Array[], sampleRate: number) => {
    const total = chunks.reduce((n, c) => n + c.length, 0)
    const flat = new Float32Array(total)
    let off = 0
    for (const c of chunks) { flat.set(c, off); off += c.length }

    const frameSize = Math.round(sampleRate * 0.04) // 40ms frames
    const hop = Math.round(frameSize / 2)
    const f0s: number[] = []
    const amps: number[] = []
    for (let start = 0; start + frameSize < flat.length; start += hop) {
      const frame = flat.subarray(start, start + frameSize)
      let energy = 0
      for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i]
      const rms = Math.sqrt(energy / frame.length)
      if (rms < 0.005) continue // skip silence
      const pitch = autocorrelatePitch(frame, sampleRate)
      if (pitch && pitch.f0 >= 70 && pitch.f0 <= 400) { f0s.push(pitch.f0); amps.push(rms) }
    }

    if (f0s.length < 8) {
      setError('Not enough voiced signal captured — try holding a steady "aaaa" sound a bit louder for the full 5 seconds.')
      return
    }

    const meanF0 = f0s.reduce((a, b) => a + b, 0) / f0s.length
    let jitterSum = 0
    for (let i = 1; i < f0s.length; i++) jitterSum += Math.abs(1 / f0s[i] - 1 / f0s[i - 1])
    const avgPeriod = 1 / meanF0
    const jitterPct = (jitterSum / (f0s.length - 1) / avgPeriod) * 100

    const meanAmp = amps.reduce((a, b) => a + b, 0) / amps.length
    let shimmerSum = 0
    for (let i = 1; i < amps.length; i++) shimmerSum += Math.abs(amps[i] - amps[i - 1])
    const shimmerPct = (shimmerSum / (amps.length - 1) / meanAmp) * 100

    setResult({ f0: Math.round(meanF0), jitterPct: Math.round(jitterPct * 100) / 100, shimmerPct: Math.round(shimmerPct * 100) / 100, periods: f0s.length })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Vocal Biomarker Analyzer (experimental)" subtitle="Pitch, jitter & shimmer from a 5-second voice sample" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          <b>Experimental, not a diagnostic tool.</b> Jitter and shimmer are real acoustic measures used
          in clinical voice science, but this consumer-microphone estimate is far noisier than a lab
          setup — background noise, mic quality, and technique all affect the result. It cannot diagnose
          any neurological or vocal condition.
        </p>
      </Card>

      <Card className="!p-5 text-center">
        <p className="text-[13px] text-neutral-500">Hold a steady "aaaah" sound at a comfortable pitch and volume for 5 seconds.</p>
        {!recording && !result && <button onClick={record} className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">Start 5-second recording</button>}
        {recording && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
            <div className="h-full bg-brand transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        {result && (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-brand/10 p-3"><div className="text-lg font-black text-brand-dark">{result.f0}Hz</div><div className="text-[10px] text-neutral-500">Mean pitch (F0)</div></div>
              <div className="rounded-xl bg-brand/10 p-3">
                <div className="text-lg font-black text-brand-dark">{result.jitterPct}%</div>
                <div className="text-[10px] text-neutral-500">Jitter</div>
                <Badge tone={result.jitterPct <= JITTER_NORMAL_MAX ? 'brand' : 'low'}>{result.jitterPct <= JITTER_NORMAL_MAX ? 'Typical' : 'Elevated'}</Badge>
              </div>
              <div className="rounded-xl bg-brand/10 p-3">
                <div className="text-lg font-black text-brand-dark">{result.shimmerPct}%</div>
                <div className="text-[10px] text-neutral-500">Shimmer</div>
                <Badge tone={result.shimmerPct <= SHIMMER_NORMAL_MAX ? 'brand' : 'low'}>{result.shimmerPct <= SHIMMER_NORMAL_MAX ? 'Typical' : 'Elevated'}</Badge>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">Reference: MDVP-style normal-voice cutoffs (jitter ≤{JITTER_NORMAL_MAX}%, shimmer ≤{SHIMMER_NORMAL_MAX}%) — "elevated" here reflects this specific noisy recording more often than a real vocal issue.</p>
            <button onClick={record} className="w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">Record again</button>
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Autocorrelation-based pitch detection computed entirely in your browser — no audio is uploaded
        or stored anywhere. Educational/experimental use only, not a substitute for a clinical voice
        or neurological evaluation.
      </div>
    </div>
  )
}

export default VocalBiomarkers
