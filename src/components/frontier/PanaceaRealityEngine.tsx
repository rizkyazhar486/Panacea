import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  INITIAL_REALITY_STATE,
  REALITY_COMMANDS,
  REALITY_DEMO_SEQUENCE,
  interpretRealityCommand,
  realityCausalPath,
  realityLayerLabel,
  type RealityState,
} from '../../lib/panaceaRealityEngine'

const spectralBackground = {
  backgroundImage:
    'radial-gradient(circle at 18% 20%, rgba(77,231,255,.16), transparent 25%), radial-gradient(circle at 82% 18%, rgba(156,124,255,.16), transparent 24%), radial-gradient(circle at 52% 82%, rgba(255,99,216,.12), transparent 28%), linear-gradient(180deg, #020305 0%, #050712 55%, #020308 100%)',
}

function AnatomyOverlay({ state }: { state: RealityState }) {
  const reduceMotion = useReducedMotion()
  const isLad = state.pathology === 'lad-occlusion'
  const isC5 = state.pathology === 'c5-radiculopathy'

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      animate={{
        scale: state.view === 'intracardiac' ? 1.85 : state.view === 'thorax' ? 1.2 : 1,
        y: state.view === 'intracardiac' ? 84 : state.view === 'thorax' ? 34 : 0,
      }}
      transition={{ type: 'spring', stiffness: 130, damping: 22 }}
    >
      <svg viewBox="0 0 240 440" className="h-[82%] max-h-[610px] w-auto overflow-visible drop-shadow-[0_0_24px_rgba(77,231,255,.18)]" aria-label="Synthetic anatomy visualization">
        <defs>
          <linearGradient id="realityMuscle" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ff63d8" stopOpacity=".9" />
            <stop offset=".48" stopColor="#9c7cff" stopOpacity=".78" />
            <stop offset="1" stopColor="#4de7ff" stopOpacity=".55" />
          </linearGradient>
          <linearGradient id="realityVessel" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fffbff" />
            <stop offset=".4" stopColor="#ff63d8" />
            <stop offset="1" stopColor="#ff385c" />
          </linearGradient>
          <filter id="realityGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g opacity={state.layer === 'surface' ? 0.9 : 0.24} fill="none" stroke="#dffcff" strokeWidth="1.2">
          <circle cx="120" cy="46" r="31" fill="rgba(255,255,255,.035)" />
          <path d="M88 84 C72 107 70 150 80 190 L67 279 L84 283 L99 203 L101 421 L118 421 L121 251 L124 421 L141 421 L141 204 L157 283 L174 279 L160 190 C170 150 168 107 152 84 C137 76 103 76 88 84Z" fill="rgba(255,255,255,.028)" />
        </g>

        {state.layer === 'muscle' && (
          <g fill="url(#realityMuscle)" stroke="#ffb5ec" strokeOpacity=".45" strokeWidth=".8">
            <ellipse cx="103" cy="103" rx="17" ry="24" transform="rotate(24 103 103)" />
            <ellipse cx="137" cy="103" rx="17" ry="24" transform="rotate(-24 137 103)" />
            <path d="M94 128 C103 117 112 116 120 125 C128 116 137 117 146 128 L139 186 C132 195 108 195 101 186Z" />
            <path d="M83 108 C69 128 70 164 79 188 L91 181 L96 119Z" />
            <path d="M157 108 C171 128 170 164 161 188 L149 181 L144 119Z" />
            <path d="M99 196 L117 197 L115 323 L100 323Z" />
            <path d="M123 197 L141 196 L140 323 L125 323Z" />
            <path d="M101 329 L115 329 L112 417 L100 417Z" />
            <path d="M125 329 L139 329 L140 417 L128 417Z" />
          </g>
        )}

        {state.layer === 'vascular' && (
          <g fill="none" stroke="url(#realityVessel)" strokeLinecap="round" filter="url(#realityGlow)">
            <path d="M120 78 L120 395" strokeWidth="3" />
            <path d="M120 111 L89 130 L78 185 L70 260" strokeWidth="2" />
            <path d="M120 111 L151 130 L162 185 L170 260" strokeWidth="2" />
            <path d="M120 199 L104 247 L105 330 L104 410" strokeWidth="2.2" />
            <path d="M120 199 L136 247 L135 330 L136 410" strokeWidth="2.2" />
            <path d="M120 82 C102 86 101 105 115 117 C131 122 143 107 137 93 C133 85 126 81 120 82Z" fill="rgba(255,56,92,.28)" strokeWidth="1.4" />
            {!reduceMotion && <animate attributeName="stroke-opacity" values=".42;1;.42" dur="1.15s" repeatCount="indefinite" />}
          </g>
        )}

        {state.layer === 'neural' && (
          <g fill="none" stroke="#9c7cff" strokeLinecap="round" filter="url(#realityGlow)">
            <path d="M101 43 Q120 26 139 43 Q140 63 120 70 Q100 63 101 43Z" fill="rgba(156,124,255,.28)" stroke="#d9cdff" strokeWidth="1.4" />
            <path d="M120 70 L120 308" strokeWidth="3.2" />
            <path d="M120 111 L91 134 L79 178 L71 250" strokeWidth="1.6" />
            <path d="M120 111 L149 134 L161 178 L169 250" strokeWidth="1.6" />
            <path d="M120 204 L104 252 L105 330 L103 411" strokeWidth="1.5" />
            <path d="M120 204 L136 252 L135 330 L137 411" strokeWidth="1.5" />
            {isC5 && <path d="M119 102 L91 126 L73 145" stroke="#ffcc66" strokeWidth="6" opacity=".9" />}
            {!reduceMotion && <animate attributeName="stroke-opacity" values=".5;1;.5" dur="1.7s" repeatCount="indefinite" />}
          </g>
        )}

        {state.layer === 'cardiac' && (
          <g filter="url(#realityGlow)">
            <motion.g
              animate={reduceMotion ? undefined : { scale: [1, 1.07, 1], opacity: [0.88, 1, 0.88] }}
              transition={{ duration: 0.82, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '120px 132px' }}
            >
              <path d="M120 174 C111 159 81 146 83 119 C85 94 111 91 121 111 C132 91 158 95 159 120 C161 146 132 160 120 174Z" fill="rgba(255,56,92,.68)" stroke="#ffd6e6" strokeWidth="1.7" />
              <path d="M122 111 C129 105 135 105 141 109" fill="none" stroke="#fffbff" strokeWidth="2" />
              <path d="M124 112 C117 124 115 139 113 153" fill="none" stroke={isLad ? '#ffcc66' : '#4de7ff'} strokeWidth={isLad ? 5 : 2.4} strokeLinecap="round" />
              {isLad && <circle cx="115" cy="136" r="5" fill="#020305" stroke="#ffcc66" strokeWidth="2" />}
            </motion.g>
            {state.exploded && (
              <g>
                <circle cx="62" cy="126" r="24" fill="rgba(77,231,255,.08)" stroke="#4de7ff" strokeDasharray="3 4" />
                <circle cx="178" cy="126" r="24" fill="rgba(156,124,255,.08)" stroke="#9c7cff" strokeDasharray="3 4" />
                <circle cx="120" cy="70" r="20" fill="rgba(255,99,216,.08)" stroke="#ff63d8" strokeDasharray="3 4" />
                <path d="M83 126 H104 M136 126 H157 M120 91 V109" stroke="rgba(255,255,255,.45)" strokeDasharray="2 4" />
              </g>
            )}
          </g>
        )}
      </svg>
    </motion.div>
  )
}

function SyntheticSignal({ pathology }: { pathology: RealityState['pathology'] }) {
  const altered = pathology === 'lad-occlusion'
  const path = altered
    ? 'M0 30 L18 30 L23 23 L29 37 L36 8 L42 48 L49 25 L58 30 L76 30 L86 18 L104 18 L116 30 L135 30 L141 24 L147 36 L154 9 L160 47 L168 24 L177 30 L200 30'
    : 'M0 30 L20 30 L26 25 L31 36 L38 10 L44 46 L51 25 L59 30 L82 30 Q94 16 109 30 L134 30 L140 25 L145 36 L152 10 L158 46 L165 25 L173 30 L200 30'
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/45">
        <span>Synthetic teaching signal</span>
        <span className={altered ? 'text-amber-300' : 'text-cyan-300'}>{altered ? 'perturbed' : 'baseline'}</span>
      </div>
      <svg viewBox="0 0 200 60" className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30 H200" stroke="rgba(255,255,255,.08)" />
        <path d={path} fill="none" stroke={altered ? '#ffcc66' : '#4de7ff'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

export function PanaceaRealityEngine() {
  const [reality, setReality] = useState<RealityState>(INITIAL_REALITY_STATE)
  const stateRef = useRef(reality)
  const [command, setCommand] = useState('')
  const [cameraState, setCameraState] = useState<'off' | 'starting' | 'live' | 'error'>('off')
  const [cameraMessage, setCameraMessage] = useState('Camera is optional. The simulation works without it.')
  const [voiceMessage, setVoiceMessage] = useState('Voice optional')
  const [demoRunning, setDemoRunning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    stateRef.current = reality
  }, [reality])

  const captureFreezeFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.setTransform(1, 0, 0, 1, 0, 0)
  }, [])

  const runCommand = useCallback((nextCommand: string) => {
    const previous = stateRef.current
    const next = interpretRealityCommand(nextCommand, previous)
    stateRef.current = next
    setReality(next)
    if (next.frozen && !previous.frozen) requestAnimationFrame(captureFreezeFrame)
  }, [captureFreezeFrame])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraState('off')
    setCameraMessage('Camera stopped. No video is uploaded by this prototype.')
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setCameraMessage('Camera API is unavailable in this browser/context.')
      return
    }
    try {
      setCameraState('starting')
      setCameraMessage('Waiting for explicit browser camera permission…')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState('live')
      setCameraMessage('Live camera stays in this browser view; this prototype adds no upload path.')
    } catch {
      setCameraState('error')
      setCameraMessage('Camera permission was denied or camera startup failed.')
    }
  }, [])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    timersRef.current.forEach(clearTimeout)
  }, [])

  const startVoice = useCallback(() => {
    const Recognition = (window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition
    if (!Recognition) {
      setVoiceMessage('Speech recognition unavailable — use command chips/text.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setVoiceMessage('Listening for one Reality command…')
    recognition.onerror = () => setVoiceMessage('Voice command failed — text/chips remain available.')
    recognition.onend = () => setVoiceMessage('Voice optional')
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? '')
      if (transcript) runCommand(transcript)
    }
    recognition.start()
  }, [runCommand])

  const runViralDemo = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setDemoRunning(true)
    REALITY_DEMO_SEQUENCE.forEach((item, index) => {
      timersRef.current.push(setTimeout(() => runCommand(item), index * 1250))
    })
    timersRef.current.push(setTimeout(() => setDemoRunning(false), REALITY_DEMO_SEQUENCE.length * 1250 + 150))
  }, [runCommand])

  const submitCommand = (event: FormEvent) => {
    event.preventDefault()
    if (!command.trim()) return
    runCommand(command)
    setCommand('')
  }

  const causalPath = realityCausalPath(reality)

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#020305] text-white shadow-[0_24px_80px_rgba(0,0,0,.42)]" aria-labelledby="panacea-reality-heading">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Panacea Reality Engine · executable medicine prototype</div>
            <h2 id="panacea-reality-heading" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Freeze the visible world. Keep synthetic physiology alive.</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/55 sm:text-sm">
              A browser-native spatial demo that turns commands into deterministic anatomy, pathology and viewpoint transformations. Optional camera registration is visual only — this is not X-ray vision, diagnosis, patient-specific anatomy or a physiological measurement device.
            </p>
          </div>
          <button type="button" onClick={runViralDemo} disabled={demoRunning} className="min-h-11 rounded-full border border-fuchsia-300/30 bg-gradient-to-r from-cyan-300/15 via-violet-400/15 to-fuchsia-400/15 px-4 text-xs font-black text-white transition hover:border-cyan-200/50 disabled:opacity-50">
            {demoRunning ? 'Reality sequence running…' : '▶ Run 10-second reality demo'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="relative min-h-[560px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r" style={spectralBackground}>
          <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.55) 0 1px, transparent 1.2px)', backgroundSize: '42px 42px' }} />
          <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity [transform:scaleX(-1)] ${cameraState === 'live' && !reality.frozen ? 'block' : 'hidden'}`} />
          <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity ${cameraState === 'live' && reality.frozen ? 'block' : 'hidden'}`} />

          <div className="absolute left-3 top-3 z-30 flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${reality.frozen ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200'}`}>World frame · {reality.frozen ? 'frozen' : 'live'}</span>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-200">Biology sim · running</span>
            <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-violet-200">{realityLayerLabel(reality.layer)}</span>
          </div>

          <AnatomyOverlay state={reality} />

          <AnimatePresence>
            {reality.pathology !== 'none' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-24 left-3 right-3 z-30 rounded-2xl border border-amber-300/20 bg-black/55 p-3 backdrop-blur-xl sm:left-5 sm:right-auto sm:w-[360px]">
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-amber-300">Synthetic perturbation · education only</div>
                <div className="mt-1 text-sm font-black">{reality.pathology === 'lad-occlusion' ? 'LAD occlusion world-state' : 'C5 radiculopathy world-state'}</div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/55">Deterministic visualization, not a patient diagnosis, risk estimate, treatment recommendation or outcome prediction.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-3 left-3 right-3 z-30 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl sm:left-5 sm:right-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/40">Last semantic transformation</div>
                <div className="truncate text-sm font-black text-white">“{reality.lastCommand}”</div>
              </div>
              <div className="shrink-0 text-right text-[9px] uppercase tracking-wider text-white/35">{reality.view.replace('-', ' ')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white/[.025] p-4 sm:p-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">Reality controls</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REALITY_COMMANDS.map((item) => (
                <button key={item} type="button" onClick={() => runCommand(item)} className="min-h-10 rounded-full border border-white/10 bg-white/[.045] px-3 text-[10px] font-bold text-white/72 transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-white">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submitCommand} className="rounded-2xl border border-white/10 bg-black/20 p-2">
            <div className="flex gap-2">
              <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Type: ‘freeze reality’…" aria-label="Reality command" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40" />
              <button className="min-h-10 rounded-xl bg-white px-3 text-[10px] font-black text-black">Run</button>
              <button type="button" onClick={startVoice} aria-label="Speak one Reality command" className="min-h-10 min-w-10 rounded-xl border border-white/10 bg-white/[.05] text-sm">◉</button>
            </div>
            <div className="mt-1.5 px-1 text-[9px] text-white/35">{voiceMessage}</div>
          </form>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/40">Optional reality registration</div>
                <div className="mt-1 text-xs font-bold">Camera backdrop</div>
              </div>
              {cameraState === 'live' ? (
                <button type="button" onClick={stopCamera} className="min-h-10 rounded-full border border-rose-300/20 bg-rose-300/10 px-3 text-[10px] font-black text-rose-200">Stop camera</button>
              ) : (
                <button type="button" onClick={startCamera} disabled={cameraState === 'starting'} className="min-h-10 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 text-[10px] font-black text-cyan-200 disabled:opacity-50">{cameraState === 'starting' ? 'Starting…' : 'Enable camera'}</button>
              )}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/40">{cameraMessage}</p>
          </div>

          <SyntheticSignal pathology={reality.pathology} />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/40">Causal zoom path</div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {causalPath.map((node, index) => (
                <span key={`${node}-${index}`} className="contents">
                  <span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${index === causalPath.length - 1 ? 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-200' : 'border-white/10 bg-white/[.04] text-white/60'}`}>{node}</span>
                  {index < causalPath.length - 1 && <span className="text-[9px] text-white/25">→</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-3">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-amber-300">Truth boundary</div>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-100/65">Generic schematic anatomy is registered as an educational overlay only. Camera frames are not used to infer internal anatomy, disease, vital signs or treatment. “LAD occlusion” and “C5 radiculopathy” are authored simulation states.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PanaceaRealityEngine
