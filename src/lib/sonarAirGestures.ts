export type SonarPhase = 'idle' | 'requesting' | 'calibrating' | 'active' | 'unsupported' | 'error'
export type SonarMotion = 'idle' | 'approaching' | 'receding'

export type SonarSnapshot = {
  phase: SonarPhase
  motion: SonarMotion
  carrierHz: number | null
  shiftHz: number
  confidence: number
  signalRatio: number
  sensitivity: number
  inverted: boolean
  doubleTapInvert: boolean
  error: string | null
}

type Listener = (snapshot: SonarSnapshot) => void

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

type Runtime = {
  context: AudioContext
  analyser: AnalyserNode
  oscillator: OscillatorNode
  outputGain: GainNode
  stream: MediaStream
  frame: number
  spectrum: Float32Array<ArrayBuffer>
}

const SPEED_OF_SOUND_MPS = 343
const MIN_SAFE_CARRIER_HZ = 18_000
const PREFERRED_CARRIER_HZ = 20_000
const INNER_HZ = 16
const OUTER_HZ = 140
const CALIBRATION_MS = 1_400
const SAMPLE_INTERVAL_MS = 45
const STORAGE_KEY = 'panacea.sonar-air-gestures.v1'
const DOCK_ID = 'panacea-sonar-air-gesture-dock'

export function dopplerShiftHz(velocityMps: number, carrierHz = PREFERRED_CARRIER_HZ) {
  return (2 * velocityMps * carrierHz) / SPEED_OF_SOUND_MPS
}

export function chooseSonarCarrierHz(sampleRate: number): number | null {
  const carrier = Math.min(PREFERRED_CARRIER_HZ, sampleRate / 2 - 700)
  return carrier >= MIN_SAFE_CARRIER_HZ ? carrier : null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function dbToPower(db: number) {
  return !Number.isFinite(db) || db <= -150 ? 0 : 10 ** (db / 10)
}

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext ?? null
}

function editingText() {
  if (typeof document === 'undefined') return false
  const target = document.activeElement
  if (!target) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  return target instanceof HTMLElement && target.isContentEditable
}

class SonarAirGestureService {
  private listeners = new Set<Listener>()
  private runtime: Runtime | null = null
  private baselineSamples: number[] = []
  private asymmetrySamples: number[] = []
  private baselineEnergy = 0
  private baselineAsymmetry = 0
  private calibrationStartedAt = 0
  private smoothedScore = 0
  private lastSampleAt = 0
  private previousMotion: SonarMotion = 'idle'
  private lastApproachPulseAt = 0
  private dockStatus: HTMLElement | null = null
  private snapshot: SonarSnapshot = {
    phase: 'idle',
    motion: 'idle',
    carrierHz: null,
    shiftHz: 0,
    confidence: 0,
    signalRatio: 0,
    sensitivity: 0.62,
    inverted: false,
    doubleTapInvert: true,
    error: null,
  }

  constructor() {
    this.restorePreferences()
  }

  getSnapshot() {
    return this.snapshot
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => { this.listeners.delete(listener) }
  }

  isSupported() {
    return Boolean(
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      audioContextCtor() &&
      navigator.mediaDevices?.getUserMedia,
    )
  }

  setSensitivity(value: number) {
    this.patch({ sensitivity: clamp(value, 0, 1) })
    this.persistPreferences()
  }

  setInverted(value: boolean) {
    this.patch({ inverted: value })
    this.persistPreferences()
  }

  setDoubleTapInvert(value: boolean) {
    this.patch({ doubleTapInvert: value })
    this.persistPreferences()
  }

  async start() {
    if (this.runtime || this.snapshot.phase === 'requesting') return
    if (!this.isSupported()) {
      this.patch({
        phase: 'unsupported',
        error: typeof window !== 'undefined' && !window.isSecureContext
          ? 'Touchless audio control requires HTTPS or localhost.'
          : 'This browser does not expose the required microphone/Web Audio APIs.',
      })
      return
    }

    const Ctor = audioContextCtor()
    if (!Ctor) return
    this.patch({ phase: 'requesting', motion: 'idle', error: null, confidence: 0, signalRatio: 0, shiftHz: 0 })

    let context: AudioContext | null = null
    let stream: MediaStream | null = null
    try {
      context = new Ctor({ latencyHint: 'interactive' })
      await context.resume()
      const carrierHz = chooseSonarCarrierHz(context.sampleRate)
      if (!carrierHz) {
        const sampleRate = context.sampleRate
        await context.close()
        this.patch({
          phase: 'unsupported',
          carrierHz: null,
          error: `Audio sample rate ${sampleRate} Hz cannot keep the carrier above ${MIN_SAFE_CARRIER_HZ} Hz.`,
        })
        return
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          channelCount: { ideal: 1 },
          echoCancellation: { ideal: false },
          noiseSuppression: { ideal: false },
          autoGainControl: { ideal: false },
        },
      })

      const analyser = context.createAnalyser()
      analyser.fftSize = 32_768
      analyser.smoothingTimeConstant = 0
      analyser.minDecibels = -120
      analyser.maxDecibels = -10

      const highPass = context.createBiquadFilter()
      highPass.type = 'highpass'
      highPass.frequency.value = Math.max(14_000, carrierHz - 3_000)
      highPass.Q.value = 0.45
      context.createMediaStreamSource(stream).connect(highPass).connect(analyser)

      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = carrierHz
      const outputGain = context.createGain()
      outputGain.gain.setValueAtTime(0, context.currentTime)
      outputGain.gain.linearRampToValueAtTime(0.016, context.currentTime + 0.08)
      oscillator.connect(outputGain).connect(context.destination)
      oscillator.start()

      this.baselineSamples = []
      this.asymmetrySamples = []
      this.baselineEnergy = 0
      this.baselineAsymmetry = 0
      this.calibrationStartedAt = performance.now()
      this.smoothedScore = 0
      this.lastSampleAt = 0
      this.previousMotion = 'idle'
      this.lastApproachPulseAt = 0
      this.runtime = {
        context,
        analyser,
        oscillator,
        outputGain,
        stream,
        frame: 0,
        spectrum: new Float32Array(new ArrayBuffer(analyser.frequencyBinCount * Float32Array.BYTES_PER_ELEMENT)),
      }
      this.patch({ phase: 'calibrating', carrierHz, error: null })
      this.mountDock()
      this.runtime.frame = requestAnimationFrame(this.loop)
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop())
      if (context && context.state !== 'closed') await context.close().catch(() => undefined)
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Allow microphone access, then try again.'
        : error instanceof Error ? error.message : 'Could not start touchless audio control.'
      this.runtime = null
      this.removeDock()
      this.patch({ phase: 'error', motion: 'idle', error: message })
    }
  }

  async stop() {
    const runtime = this.runtime
    this.runtime = null
    if (runtime) {
      cancelAnimationFrame(runtime.frame)
      try {
        const now = runtime.context.currentTime
        runtime.outputGain.gain.cancelScheduledValues(now)
        runtime.outputGain.gain.setTargetAtTime(0, now, 0.01)
        runtime.oscillator.stop(now + 0.05)
      } catch {
        // The graph may already be closing.
      }
      runtime.stream.getTracks().forEach((track) => track.stop())
      if (runtime.context.state !== 'closed') await runtime.context.close().catch(() => undefined)
    }
    this.previousMotion = 'idle'
    this.removeDock()
    this.patch({ phase: 'idle', motion: 'idle', confidence: 0, signalRatio: 0, shiftHz: 0, error: null })
  }

  private loop = (timestamp: number) => {
    const runtime = this.runtime
    if (!runtime) return
    runtime.frame = requestAnimationFrame(this.loop)
    if (timestamp - this.lastSampleAt < SAMPLE_INTERVAL_MS) return
    this.lastSampleAt = timestamp
    const carrierHz = this.snapshot.carrierHz
    if (!carrierHz) return

    runtime.analyser.getFloatFrequencyData(runtime.spectrum)
    const spectral = this.measureSpectrum(runtime, carrierHz)

    if (this.snapshot.phase === 'calibrating') {
      this.baselineSamples.push(spectral.totalPower)
      this.asymmetrySamples.push(spectral.asymmetry)
      if (timestamp - this.calibrationStartedAt >= CALIBRATION_MS && this.baselineSamples.length >= 12) {
        this.baselineEnergy = Math.max(median(this.baselineSamples), 1e-15)
        this.baselineAsymmetry = median(this.asymmetrySamples)
        this.patch({ phase: 'active', signalRatio: 1, confidence: 0, motion: 'idle' })
      }
      return
    }
    if (this.snapshot.phase !== 'active') return

    const corrected = spectral.asymmetry - this.baselineAsymmetry
    this.smoothedScore = this.smoothedScore * 0.76 + corrected * 0.24
    const threshold = 0.145 - this.snapshot.sensitivity * 0.105
    const absoluteScore = Math.abs(this.smoothedScore)
    const signalRatio = clamp(spectral.totalPower / Math.max(this.baselineEnergy, 1e-15), 0, 8)
    const activeMotion = spectral.totalPower >= this.baselineEnergy * 0.58 && absoluteScore >= threshold
    const motion: SonarMotion = !activeMotion
      ? 'idle'
      : this.smoothedScore > 0 ? 'approaching' : 'receding'
    const confidence = activeMotion
      ? clamp((absoluteScore - threshold) / Math.max(0.035, 0.24 - threshold), 0, 1)
      : 0
    const shiftHz = activeMotion
      ? spectral.dominantShiftHz * (motion === 'approaching' ? 1 : -1)
      : 0

    if (motion !== this.previousMotion) this.onMotionTransition(motion, timestamp)
    this.previousMotion = motion
    this.patch({ motion, confidence, signalRatio, shiftHz })
    if (activeMotion) this.applyDefaultScroll(motion, confidence)
  }

  private measureSpectrum(runtime: Runtime, carrierHz: number) {
    const hzPerBin = runtime.context.sampleRate / runtime.analyser.fftSize
    const { spectrum } = runtime
    const windowPower = (fromHz: number, toHz: number) => {
      const from = clamp(Math.floor(fromHz / hzPerBin), 0, spectrum.length - 1)
      const to = clamp(Math.ceil(toHz / hzPerBin), from, spectrum.length - 1)
      let total = 0
      for (let i = from; i <= to; i += 1) total += dbToPower(spectrum[i])
      return total / Math.max(1, to - from + 1)
    }
    const peakOffset = (fromHz: number, toHz: number) => {
      const from = clamp(Math.floor(fromHz / hzPerBin), 0, spectrum.length - 1)
      const to = clamp(Math.ceil(toHz / hzPerBin), from, spectrum.length - 1)
      let bestIndex = from
      for (let i = from + 1; i <= to; i += 1) if (spectrum[i] > spectrum[bestIndex]) bestIndex = i
      return Math.abs(bestIndex * hzPerBin - carrierHz)
    }

    const lower = windowPower(carrierHz - OUTER_HZ, carrierHz - INNER_HZ)
    const upper = windowPower(carrierHz + INNER_HZ, carrierHz + OUTER_HZ)
    const totalPower = lower + upper
    const asymmetry = (upper - lower) / Math.max(totalPower, 1e-18)
    const dominantShiftHz = upper >= lower
      ? peakOffset(carrierHz + INNER_HZ, carrierHz + OUTER_HZ)
      : peakOffset(carrierHz - OUTER_HZ, carrierHz - INNER_HZ)
    return { totalPower, asymmetry, dominantShiftHz }
  }

  private onMotionTransition(motion: SonarMotion, timestamp: number) {
    if (motion !== 'approaching' || !this.snapshot.doubleTapInvert) return
    const gap = timestamp - this.lastApproachPulseAt
    if (gap >= 120 && gap <= 560) {
      this.lastApproachPulseAt = 0
      this.setInverted(!this.snapshot.inverted)
      this.flashDock(`Direction ${this.snapshot.inverted ? 'reversed' : 'normal'}`)
    } else {
      this.lastApproachPulseAt = timestamp
    }
  }

  private applyDefaultScroll(motion: SonarMotion, confidence: number) {
    if (editingText()) return
    const baseDirection = motion === 'approaching' ? -1 : 1
    const direction = this.snapshot.inverted ? -baseDirection : baseDirection
    window.scrollBy({ top: direction * (10 + confidence * 58), left: 0, behavior: 'auto' })
  }

  private patch(next: Partial<SonarSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next }
    this.listeners.forEach((listener) => listener(this.snapshot))
    this.updateDock()
  }

  private restorePreferences() {
    if (typeof localStorage === 'undefined') return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<SonarSnapshot>
      if (typeof saved.sensitivity === 'number') this.snapshot.sensitivity = clamp(saved.sensitivity, 0, 1)
      if (typeof saved.inverted === 'boolean') this.snapshot.inverted = saved.inverted
      if (typeof saved.doubleTapInvert === 'boolean') this.snapshot.doubleTapInvert = saved.doubleTapInvert
    } catch {
      // Preference corruption should never block the app.
    }
  }

  private persistPreferences() {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sensitivity: this.snapshot.sensitivity,
        inverted: this.snapshot.inverted,
        doubleTapInvert: this.snapshot.doubleTapInvert,
      }))
    } catch {
      // Persistence is optional.
    }
  }

  private mountDock() {
    if (typeof document === 'undefined' || document.getElementById(DOCK_ID)) return
    const dock = document.createElement('div')
    dock.id = DOCK_ID
    dock.setAttribute('role', 'status')
    dock.setAttribute('aria-live', 'polite')
    Object.assign(dock.style, {
      position: 'fixed', right: '12px', bottom: 'calc(82px + env(safe-area-inset-bottom, 0px))', zIndex: '2147483000',
      display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 9px 8px 12px',
      border: '1px solid rgba(123,238,255,.28)', borderRadius: '999px', background: 'rgba(4,9,18,.84)',
      color: '#f7fbff', boxShadow: '0 12px 34px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.08)',
      backdropFilter: 'blur(18px) saturate(150%)', font: '600 11px/1.2 Montserrat,ui-sans-serif,system-ui,sans-serif',
      maxWidth: 'min(86vw,320px)',
    })
    const dot = document.createElement('span')
    Object.assign(dot.style, { width: '8px', height: '8px', borderRadius: '50%', background: '#4de7ff', boxShadow: '0 0 14px rgba(77,231,255,.9)' })
    const status = document.createElement('span')
    const stop = document.createElement('button')
    stop.type = 'button'
    stop.textContent = 'Stop'
    stop.setAttribute('aria-label', 'Stop touchless air gestures')
    Object.assign(stop.style, { border: '0', borderRadius: '999px', padding: '6px 9px', cursor: 'pointer', background: 'rgba(255,255,255,.10)', color: 'inherit', font: 'inherit' })
    stop.addEventListener('click', () => { void this.stop() })
    dock.append(dot, status, stop)
    document.body.appendChild(dock)
    this.dockStatus = status
    this.updateDock()
  }

  private updateDock() {
    if (!this.dockStatus) return
    this.dockStatus.textContent = this.snapshot.phase === 'calibrating'
      ? 'Air gesture calibrating…'
      : this.snapshot.phase === 'active'
        ? this.snapshot.motion === 'idle'
          ? 'Air gesture ready'
          : `${this.snapshot.motion === 'approaching' ? 'Hand approaching' : 'Hand receding'} · ${Math.round(this.snapshot.confidence * 100)}%`
        : 'Air gesture active'
  }

  private flashDock(message: string) {
    if (!this.dockStatus) return
    this.dockStatus.textContent = message
    window.setTimeout(() => this.updateDock(), 900)
  }

  private removeDock() {
    if (typeof document === 'undefined') return
    document.getElementById(DOCK_ID)?.remove()
    this.dockStatus = null
  }
}

export const sonarAirGestures = new SonarAirGestureService()
