import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { NAV_UNTUK_PENGATURAN } from '../../data/navPengaturan'
import { readUnifiedLocalVitals } from '../../domains/identity/bootVitals'
import {
  BODY_MEDIATOR_PORTALS,
  WORKFLOW_LENSES,
  buildAstralCatalog,
  filterAstralCatalog,
  focusedIndexForYaw,
  normalizeAngleDeg,
  projectOrbit360,
  stepOrbitPhysics,
  targetYawForIndex,
  type WorkflowLensId,
} from '../../domains/navigation'
import { FITUR_DARI_HUB } from '../../lib/katalogFitur'
import { gabungKatalog } from '../../lib/katalogLengkap'
import { useStore } from '../../lib/store'
import type { SuperPageId } from '../../lib/superPages'
import '../../styles/astral-orbit-360.css'

const AstralLive3DBodyCore = lazy(() => import('./AstralLive3DBodyCore'))

type IconComponent = ComponentType<{ size?: number }>

export interface AstralOrbit360HubProps {
  icons: Readonly<Record<SuperPageId, IconComponent>>
}

export type AstralChartKind =
  | 'gauge'
  | 'area'
  | 'stacked-column'
  | 'radar'
  | 'donut'
  | 'waterfall'
  | 'comparison'
  | 'vein'
  | 'heatmap'
  | 'bubble'
  | 'diverging'

const CHART_KINDS: readonly AstralChartKind[] = [
  'gauge',
  'area',
  'stacked-column',
  'radar',
  'donut',
  'waterfall',
  'comparison',
  'vein',
  'heatmap',
  'bubble',
  'diverging',
] as const

const PITCH_DEG = -18
const COLLAPSED_FEATURE_LIMIT = 12

/** Custom bespoke SVG emblem logos for each workflow lens. */
function LensLogoSvg({ id }: { id: WorkflowLensId }) {
  switch (id) {
    case 'healthcare':
      return (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M10 5.5v9M5.5 10h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'sport-medicine':
      return (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.5 13.5A7 7 0 1 1 16.5 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M10 10l4-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        </svg>
      )
    case 'education':
      return (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 4c3 3 7 3 10 0M5 16c3-3 7-3 10 0M6.5 7.5h7M6.5 12.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <ellipse cx="10" cy="10" rx="8" ry="3.6" stroke="currentColor" strokeWidth="1.5" transform="rotate(-28 10 10)" />
          <ellipse cx="10" cy="10" rx="8" ry="3.6" stroke="currentColor" strokeWidth="1.5" transform="rotate(28 10 10)" />
          <circle cx="10" cy="10" r="2" fill="currentColor" />
        </svg>
      )
  }
}

/** Custom bespoke SVG emblem logos for each of the 7 canonical realms. */
function RealmLogoSvg({ realm }: { realm: SuperPageId }) {
  switch (realm) {
    case 'human':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="#34d399" strokeWidth="1.4" strokeDasharray="3 2" />
          <circle cx="12" cy="7" r="2.2" stroke="#6ee7b7" strokeWidth="1.6" />
          <path d="M7.5 11.5h9M12 9.5v6.5M9 20l3-4 3 4" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'health':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 12h4l2.2-4.5 3.6 9 2.2-4.5H21" stroke="#a3e635" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'clinical':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke="#22d3ee" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'explore':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <polygon points="12,3.5 20,8 20,16 12,20.5 4,16 4,8" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.12)" />
          <circle cx="12" cy="12" r="2.6" fill="#c4b5fd" />
        </svg>
      )
    case 'simulate':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="#2dd4bf" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="8.5" ry="3.5" stroke="#5eead4" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="2.2" fill="#99f6e4" />
        </svg>
      )
    case 'records':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 17V9M10 17V6M15 17v-5M20 17v-8" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3.5l2.4 5.6 6.1.5-4.6 4 1.4 5.9-5.3-3.1-5.3 3.1 1.4-5.9-4.6-4 6.1-.5L12 3.5z" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.15)" />
        </svg>
      )
  }
}

/** 11-family Mini SVG data visualization per feature widget card. */
function FeatureMiniVizSvg({ seed, accent }: { seed: string; accent: string }) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const kind = CHART_KINDS[hash % CHART_KINDS.length]
  const color =
    accent === 'cyan'
      ? '#22d3ee'
      : accent === 'lime'
        ? '#a3e635'
        : accent === 'violet'
          ? '#a78bfa'
          : accent === 'amber'
            ? '#fbbf24'
            : '#34d399'

  switch (kind) {
    case 'donut':
      return (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" data-mini-chart="donut">
          <circle cx="13" cy="13" r="9" stroke="rgba(148,163,184,0.22)" strokeWidth="3.2" />
          <circle cx="13" cy="13" r="9" stroke={color} strokeWidth="3.2" strokeDasharray="34 56" strokeLinecap="round" transform="rotate(-90 13 13)" />
          <circle cx="13" cy="13" r="9" stroke="#38bdf8" strokeWidth="3.2" strokeDasharray="12 56" strokeDashoffset="-38" strokeLinecap="round" transform="rotate(-90 13 13)" />
        </svg>
      )
    case 'gauge':
      return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none" aria-hidden="true" data-mini-chart="gauge">
          <path d="M4 18 A 14 14 0 0 1 32 18" stroke="rgba(148,163,184,0.25)" strokeWidth="2.8" strokeDasharray="2 2" />
          <path d="M4 18 A 14 14 0 0 1 27 8" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
          <line x1="18" y1="18" x2="25" y2="9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2" fill={color} />
        </svg>
      )
    case 'waterfall':
      return (
        <svg width="42" height="22" viewBox="0 0 42 22" fill="none" aria-hidden="true" data-mini-chart="waterfall">
          <rect x="3" y="12" width="5" height="7" rx="1.5" fill={color} />
          <rect x="11" y="7" width="5" height="6" rx="1.5" fill="#34d399" />
          <rect x="19" y="4" width="5" height="5" rx="1.5" fill="#22d3ee" />
          <rect x="27" y="6" width="5" height="6" rx="1.5" fill="#fb7185" />
          <rect x="35" y="3" width="5" height="16" rx="1.5" fill="#fbbf24" />
        </svg>
      )
    case 'comparison':
      return (
        <svg width="44" height="22" viewBox="0 0 44 22" fill="none" aria-hidden="true" data-mini-chart="comparison">
          <path d="M2 16c6-8 12 4 18-5s12 6 22-5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M2 19c6-4 12-7 18-3s12-8 22-3" stroke="#f472b6" strokeWidth="1.4" strokeDasharray="2 2" strokeLinecap="round" />
        </svg>
      )
    case 'vein':
      return (
        <svg width="44" height="22" viewBox="0 0 44 22" fill="none" aria-hidden="true" data-mini-chart="vein">
          <path d="M2 4c10 0 14 7 22 7h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M2 11c10 0 14 0 22 0" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 18c10 0 14-7 22-7" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="24" cy="11" r="2.2" fill="#ffffff" />
        </svg>
      )
    case 'heatmap':
      return (
        <svg width="38" height="22" viewBox="0 0 38 22" fill="none" aria-hidden="true" data-mini-chart="heatmap">
          {[0, 1, 2, 3, 4].map((col) =>
            [0, 1, 2].map((row) => {
              const active = (col + row + (hash % 3)) % 2 === 0
              return (
                <rect
                  key={`${col}-${row}`}
                  x={3 + col * 7}
                  y={3 + row * 6}
                  width="5"
                  height="4.5"
                  rx="1.2"
                  fill={active ? color : 'rgba(148,163,184,0.22)'}
                  fillOpacity={active ? 0.9 : 0.4}
                />
              )
            }),
          )}
        </svg>
      )
    case 'stacked-column':
      return (
        <svg width="40" height="22" viewBox="0 0 40 22" fill="none" aria-hidden="true" data-mini-chart="stacked-column">
          {[4, 12, 20, 28, 35].map((x, idx) => (
            <g key={x}>
              <rect x={x} y={4 + (idx % 2) * 2} width="4" height="7" rx="1.5" fill={color} />
              <rect x={x} y="13" width="4" height="6" rx="1.5" fill="#38bdf8" fillOpacity="0.65" />
            </g>
          ))}
        </svg>
      )
    case 'bubble':
      return (
        <svg width="42" height="22" viewBox="0 0 42 22" fill="none" aria-hidden="true" data-mini-chart="bubble">
          <circle cx="9" cy="13" r="4" fill={color} fillOpacity="0.55" />
          <circle cx="19" cy="9" r="5.5" fill={color} fillOpacity="0.88" />
          <circle cx="29" cy="14" r="3.5" fill="#38bdf8" fillOpacity="0.8" />
          <circle cx="36" cy="7" r="2.5" fill="#fbbf24" />
        </svg>
      )
    case 'radar':
      return (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" data-mini-chart="radar">
          <polygon points="13,2 23,8 23,18 13,24 3,18 3,8" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
          <polygon points="13,4 21,9 19,17 13,21 6,16 7,9" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.24" />
        </svg>
      )
    case 'diverging':
      return (
        <svg width="42" height="22" viewBox="0 0 42 22" fill="none" aria-hidden="true" data-mini-chart="diverging">
          <line x1="21" y1="2" x2="21" y2="20" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
          <rect x="9" y="4" width="12" height="3.5" rx="1.5" fill="#fb7185" />
          <rect x="21" y="9" width="15" height="3.5" rx="1.5" fill={color} />
          <rect x="13" y="14" width="8" height="3.5" rx="1.5" fill="#fbbf24" />
        </svg>
      )
    default:
      return (
        <svg width="44" height="22" viewBox="0 0 44 22" fill="none" aria-hidden="true" data-mini-chart="area">
          <path d="M2 17C10 15 14 6 22 8s12-5 20-3v14H2Z" fill={color} fillOpacity="0.22" />
          <path d="M2 17C10 15 14 6 22 8s12-5 20-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="8" r="2.2" fill="#ffffff" />
        </svg>
      )
  }
}

/** 3D-shaded Human Pedestal & Spatial Organ Callout Core (Pinterest Images 1-3 & 7). */
function Human3DPedestalCoreSvg({ accent }: { accent: string }) {
  const glow =
    accent === 'cyan'
      ? '#22d3ee'
      : accent === 'lime'
        ? '#a3e635'
        : accent === 'violet'
          ? '#a78bfa'
          : '#34d399'
  return (
    <svg viewBox="0 0 140 140" className="h-[84%] w-[84%]" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="pmd-pedestal-aura" cx="50%" cy="44%" r="52%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.38" />
          <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.12" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pmd-body-mesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" stopOpacity="0.95" />
          <stop offset="50%" stopColor={glow} stopOpacity="0.75" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <circle cx="70" cy="64" r="56" fill="url(#pmd-pedestal-aura)" />
      <circle cx="70" cy="64" r="50" fill="none" stroke={glow} strokeOpacity="0.28" strokeWidth="0.9" strokeDasharray="2.5 3" />

      {/* 3D Concentric Glowing Standing Pedestal */}
      <ellipse cx="70" cy="111" rx="32" ry="7.5" fill="rgba(16, 185, 129, 0.16)" stroke={glow} strokeWidth="1.2" />
      <ellipse cx="70" cy="108" rx="23" ry="5" fill="rgba(34, 211, 238, 0.24)" stroke="#a5f3fc" strokeWidth="1" />

      {/* Volumetric Human Anatomical Figure on Pedestal */}
      <circle cx="70" cy="24" r="8.2" fill="url(#pmd-body-mesh)" stroke="#ffffff" strokeWidth="0.9" />
      <path
        d="M56 36c4-2.2 24-2.2 28 0l5 22c-3 1.5-8 1-8-3l-2-10v23l5 36h-6.5L70 76l-7.5 28H56l5-36V45l-2 10c0 4-5 4.5-8 3l5-22z"
        fill="url(#pmd-body-mesh)"
        stroke="#e0f2fe"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
      <line x1="70" y1="33" x2="70" y2="70" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.2" />
      <circle cx="73" cy="48" r="3.6" fill="#fb7185" stroke="#ffe4e6" strokeWidth="0.9" />
      <circle cx="70" cy="23" r="2.6" fill="#38bdf8" />

      {/* Floating Spatial Organ Callout Pins */}
      <g>
        <line x1="70" y1="23" x2="34" y2="21" stroke="#67e8f9" strokeWidth="0.9" />
        <rect x="8" y="13" width="28" height="14" rx="5" fill="rgba(4,18,26,0.9)" stroke="#22d3ee" strokeWidth="0.8" />
        <circle cx="14" cy="20" r="2" fill="#22d3ee" />
        <path d="M19 22l3-4 3 3 4-3" stroke="#a5f3fc" strokeWidth="1.1" fill="none" />
      </g>
      <g>
        <line x1="73" y1="48" x2="104" y2="43" stroke="#fb7185" strokeWidth="0.9" />
        <rect x="102" y="35" width="30" height="14" rx="5" fill="rgba(4,18,26,0.9)" stroke="#fb7185" strokeWidth="0.8" />
        <path d="M106 43h4l2-4 2.5 7 2-3h4" stroke="#fda4af" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function AstralOrbit360Hub({ icons }: AstralOrbit360HubProps) {
  const { state, account, activePatient } = useStore()
  const role = account?.role ?? 'pasien'

  const [lens, setLens] = useState<WorkflowLensId>('all')
  const [chartBank, setChartBank] = useState<'core' | 'flow' | 'matrix'>('core')
  const [query, setQuery] = useState('')
  const [yawDeg, setYawDeg] = useState(0)
  const [autoSpin, setAutoSpin] = useState(true)
  const [live3D, setLive3D] = useState(false)
  const [pickedStructure, setPickedStructure] = useState<string | null>(null)
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const [navLength] = useState(() => NAV_UNTUK_PENGATURAN.length)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const isVisibleRef = useRef(true)

  const physicsRef = useRef<{
    yawDeg: number
    velocityDegPerSec: number
    targetYawDeg: number | null
  }>({
    yawDeg: 0,
    velocityDegPerSec: 0,
    targetYawDeg: null,
  })

  const dragRef = useRef<{
    active: boolean
    pointerId: number | null
    startX: number
    lastX: number
    lastTime: number
    captured: boolean
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    captured: false,
  })

  const vitals = useMemo(
    () =>
      readUnifiedLocalVitals(state.account, {
        patient: activePatient,
        patientVitals: activePatient ? state.vitals[activePatient.id] : undefined,
        sleepLogs: state.sleepLogs,
      }),
    [state.account, activePatient, state.vitals, state.sleepLogs],
  )
  const hrLabel = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? `${Math.round(vitals.restingHr)} bpm` : '— bpm'
  const vo2Label = typeof vitals.vo2max === 'number' && vitals.vo2max > 0 ? `${vitals.vo2max.toFixed(1)}` : '360°'
  const stepsLabel = typeof vitals.steps === 'number' && vitals.steps >= 0 ? Math.round(vitals.steps).toLocaleString() : '—'

  const catalog = useMemo(
    () => buildAstralCatalog(gabungKatalog(FITUR_DARI_HUB, NAV_UNTUK_PENGATURAN), role),
    [role, navLength],
  )

  const filtered = useMemo(() => filterAstralCatalog(catalog, lens, query), [catalog, lens, query])
  const activeLensDef = useMemo(
    () => WORKFLOW_LENSES.find((item) => item.id === lens) ?? WORKFLOW_LENSES[0],
    [lens],
  )

  const projected = useMemo(
    () => projectOrbit360(filtered.realms.length, yawDeg, PITCH_DEG),
    [filtered.realms.length, yawDeg],
  )
  const focusedIdx = useMemo(
    () => focusedIndexForYaw(filtered.realms.length, yawDeg),
    [filtered.realms.length, yawDeg],
  )
  const focusedRealm = filtered.realms[focusedIdx] ?? filtered.realms[0] ?? null

  useEffect(() => {
    setShowAllFeatures(false)
  }, [lens, query, focusedIdx])

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting)
      },
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = containerRef.current
    if (!canvas || !host || typeof window === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const width = Math.max(300, host.clientWidth || 640)
    const height = Math.max(300, host.clientHeight || 480)
    canvas.width = width
    canvas.height = height

    const count = 42
    const nodes = Array.from({ length: count }, (_, idx) => {
      const golden = (idx * 137.508 * Math.PI) / 180
      const radial = Math.sqrt((idx + 0.5) / count)
      return {
        x: width * (0.5 + 0.44 * radial * Math.cos(golden)),
        y: height * (0.5 + 0.44 * radial * Math.sin(golden)),
        vx: Math.cos(idx * 1.7) * 0.18,
        vy: Math.sin(idx * 2.3) * 0.18,
        r: idx % 3 === 0 ? 2 : 1.3,
        hue: idx % 2 === 0 ? 'rgba(52, 211, 153,' : 'rgba(56, 189, 248,',
      }
    })

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 98) {
            const alpha = ((1 - dist / 98) * 0.18).toFixed(3)
            ctx.strokeStyle = `rgba(103, 232, 249, ${alpha})`
            ctx.lineWidth = 0.75
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `${n.hue} 0.78)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    renderFrame()
    if (reducedMotion) return

    let rafId = 0
    const tick = () => {
      if (isVisibleRef.current) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 8 || n.x > canvas.width - 8) n.vx *= -1
          if (n.y < 8 || n.y > canvas.height - 8) n.vy *= -1
        }
        renderFrame()
      }
      rafId = window.requestAnimationFrame(tick)
    }
    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reducedMotion =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    let rafId = 0
    let lastTs = performance.now()

    const loop = (now: number) => {
      const dtSec = Math.max(0, (now - lastTs) / 1000)
      lastTs = now
      if (isVisibleRef.current && !dragRef.current.active) {
        const next = stepOrbitPhysics(physicsRef.current, dtSec, {
          autoDriftDegPerSec: autoSpin && physicsRef.current.targetYawDeg === null ? 6.5 : 0,
        })
        if (Math.abs(next.yawDeg - physicsRef.current.yawDeg) > 0.01 || next.settled) {
          physicsRef.current.yawDeg = next.yawDeg
          physicsRef.current.velocityDegPerSec = next.velocityDegPerSec
          if (next.settled) physicsRef.current.targetYawDeg = null
          setYawDeg(next.yawDeg)
        }
      }
      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(rafId)
  }, [autoSpin])

  const snapToRealmIndex = useCallback(
    (index: number) => {
      const target = targetYawForIndex(filtered.realms.length, index)
      physicsRef.current.targetYawDeg = target
      physicsRef.current.velocityDegPerSec = 0
      setAutoSpin(false)
      if (
        typeof window !== 'undefined' &&
        (document.documentElement.classList.contains('reduce-motion') ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ) {
        physicsRef.current.yawDeg = target
        physicsRef.current.targetYawDeg = null
        setYawDeg(target)
      }
    },
    [filtered.realms.length],
  )

  const rotateByStep = useCallback(
    (deltaSteps: number) => {
      const count = filtered.realms.length || 1
      const currentIdx = focusedIndexForYaw(count, physicsRef.current.yawDeg)
      const nextIdx = ((currentIdx + deltaSteps) % count + count) % count
      snapToRealmIndex(nextIdx)
    },
    [filtered.realms.length, snapToRealmIndex],
  )

  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a, input')) return
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastTime: performance.now(),
      captured: false,
    }
    physicsRef.current.targetYawDeg = null
    setAutoSpin(false)
  }

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    const dxFromStart = e.clientX - drag.startX
    if (!drag.captured && Math.abs(dxFromStart) > 6) {
      drag.captured = true
      try {
        stageRef.current?.setPointerCapture(e.pointerId)
      } catch {
        // Ignore if pointer capture is unavailable cleanly.
      }
    }
    if (!drag.captured) return

    const now = performance.now()
    const dx = e.clientX - drag.lastX
    const dt = Math.max(0.008, (now - drag.lastTime) / 1000)
    const nextYaw = normalizeAngleDeg(physicsRef.current.yawDeg + dx * 0.48)
    physicsRef.current.yawDeg = nextYaw
    physicsRef.current.velocityDegPerSec = (dx * 0.48) / dt
    drag.lastX = e.clientX
    drag.lastTime = now
    setYawDeg(nextYaw)
  }

  const handleStagePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== e.pointerId) return
    if (drag.captured) {
      try {
        stageRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore if already released.
      }
    }
    drag.active = false
    drag.pointerId = null
    drag.captured = false
  }

  const handleStageWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    const nextYaw = normalizeAngleDeg(physicsRef.current.yawDeg - e.deltaX * 0.25)
    physicsRef.current.yawDeg = nextYaw
    physicsRef.current.targetYawDeg = null
    setAutoSpin(false)
    setYawDeg(nextYaw)
  }

  const isSearching = query.trim().length > 0
  const displayedPool = useMemo(() => {
    if (isSearching) return filtered.matchingFeatures
    return focusedRealm?.features ?? []
  }, [isSearching, filtered.matchingFeatures, focusedRealm])

  const visibleFeatures = showAllFeatures
    ? displayedPool
    : displayedPool.slice(0, COLLAPSED_FEATURE_LIMIT)

  return (
    <div ref={containerRef} className="dark pmd-astral-360" data-astral-360-hub>
      <canvas ref={canvasRef} className="pmd-astral-backdrop" aria-hidden="true" />

      <div className="pmd-astral-content">
        {/* 1. Top Visual Icon Navigator & Telemetry HUD */}
        <div className="pmd-astral-hud">
          <div className="pmd-astral-hud-row">
            <div role="radiogroup" aria-label="Workflow lens" className="pmd-astral-lenses">
              {WORKFLOW_LENSES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={lens === item.id}
                  title={item.cue}
                  className="pmd-astral-lens-btn"
                  onClick={() => setLens(item.id)}
                >
                  <LensLogoSvg id={item.id} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="pmd-astral-telemetry">
              <span className="pmd-astral-badge" data-testid="astral-feature-count">
                {filtered.matchingTotal} fitur
              </span>
              <span className="pmd-astral-badge" data-testid="astral-yaw-readout">
                YAW {String(Math.round(yawDeg)).padStart(3, '0')}°
              </span>
              <button
                type="button"
                className="pmd-astral-step-btn"
                aria-label="Putar orbit ke kiri"
                onClick={() => rotateByStep(-1)}
              >
                ◀
              </button>
              <button
                type="button"
                className="pmd-astral-step-btn"
                data-active={String(autoSpin)}
                aria-label="Toggle putaran otomatis 360 derajat"
                onClick={() => setAutoSpin((v) => !v)}
              >
                {autoSpin ? 'Auto 360°' : 'Manual'}
              </button>
              <button
                type="button"
                className="pmd-astral-step-btn"
                aria-label="Putar orbit ke kanan"
                onClick={() => rotateByStep(1)}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="pmd-astral-hud-row">
            <div className="pmd-astral-search-wrap" style={{ flex: 1 }}>
              <label htmlFor="pmd-astral-search" className="sr-only">
                Cari semua fitur Panacea
              </label>
              <input
                id="pmd-astral-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Cari semua ${catalog.totalFeatures} fitur…`}
                autoComplete="off"
                className="pmd-astral-search-input"
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="pmd-astral-clear-btn"
                  aria-label="Hapus pencarian fitur"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 11-Chart Bank Switcher (Core | Flow | Matrix) */}
            <div role="radiogroup" aria-label="Visual chart deck" className="pmd-astral-lenses">
              {(
                [
                  { id: 'core', label: 'Gauge · Area · Stack · Radar' },
                  { id: 'flow', label: 'Donut · Vein · Waterfall · Compare' },
                  { id: 'matrix', label: 'Heatmap · Bubble · Diverging' },
                ] as const
              ).map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  role="radio"
                  aria-checked={chartBank === deck.id}
                  onClick={() => setChartBank(deck.id)}
                  className="pmd-astral-step-btn"
                  data-active={String(chartBank === deck.id)}
                  title={deck.label}
                >
                  {deck.id === 'core' ? 'Charts I' : deck.id === 'flow' ? 'Charts II' : 'Charts III'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Dynamic 11-Chart Visual Telemetry Bento Strip (All explanations hidden in (i) title!) */}
        <div className="pmd-astral-bento" data-astral-chart-bento>
          {chartBank === 'core' && (
            <>
              {/* 1. GAUGE CHART */}
              <Link to="/readiness" className="pmd-astral-widget" data-chart-type="gauge" title="Speed & Readiness Radial Gauge + Harmonic Wave">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <LensLogoSvg id="sport-medicine" />
                    <span>GAUGE</span>
                  </span>
                  <span className="pmd-astral-widget-val">{vo2Label} ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <path d="M 24 46 A 56 42 0 0 1 136 46" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="5" strokeDasharray="2.5 3.5" />
                  <path d="M 24 46 A 56 42 0 0 1 118 22" fill="none" stroke="#34d399" strokeWidth="5" strokeDasharray="2.5 3.5" />
                  <line x1="80" y1="45" x2="104" y2="21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="80" cy="45" r="3.2" fill="#34d399" />
                  <path d="M8 56c18-9 36 9 54 0s36-9 54 0 26 6 36 0" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                </svg>
              </Link>

              {/* 2. AREA CHART */}
              <Link to="/tubuh?t=jantung" className="pmd-astral-widget" data-chart-type="area" title="Cardiac Dual-Wave Area Sparkline">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="health" />
                    <span>AREA</span>
                  </span>
                  <span className="pmd-astral-widget-val">{hrLabel} ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <defs>
                    <linearGradient id="pmd-hr-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M4 44 C18 44, 22 18, 34 18 C46 18, 48 48, 60 48 C72 48, 76 10, 88 10 C100 10, 104 42, 118 42 C130 42, 138 24, 156 26 L156 60 L4 60 Z" fill="url(#pmd-hr-area)" />
                  <path d="M4 44 C18 44, 22 18, 34 18 C46 18, 48 48, 60 48 C72 48, 76 10, 88 10 C100 10, 104 42, 118 42 C130 42, 138 24, 156 26" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="88" cy="10" r="6" fill="#22d3ee" fillOpacity="0.32" />
                  <circle cx="88" cy="10" r="2.8" fill="#ffffff" />
                </svg>
              </Link>

              {/* 3. STACKED COLUMN CHART */}
              <Link to="/ikhtisar" className="pmd-astral-widget" data-chart-type="stacked-column" title="7-Day Stacked Activity & Recovery Capsule Columns">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="records" />
                    <span>STACKED</span>
                  </span>
                  <span className="pmd-astral-widget-val">{stepsLabel} ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  {[
                    { x: 14, y1: 12, h1: 22, y2: 36, h2: 18, c: '#34d399' },
                    { x: 34, y1: 8, h1: 26, y2: 36, h2: 20, c: '#22d3ee' },
                    { x: 54, y1: 16, h1: 18, y2: 36, h2: 16, c: '#34d399' },
                    { x: 74, y1: 6, h1: 28, y2: 36, h2: 20, c: '#fbbf24' },
                    { x: 94, y1: 10, h1: 24, y2: 36, h2: 18, c: '#22d3ee' },
                    { x: 114, y1: 9, h1: 25, y2: 36, h2: 19, c: '#34d399' },
                    { x: 134, y1: 5, h1: 29, y2: 36, h2: 21, c: '#a3e635' },
                  ].map((bar, i) => (
                    <g key={i}>
                      <rect x={bar.x} y={bar.y1} width="10" height={bar.h1} rx="4" fill={bar.c} />
                      <rect x={bar.x} y={bar.y2} width="10" height={bar.h2} rx="4" fill="#6366f1" fillOpacity="0.65" />
                    </g>
                  ))}
                </svg>
              </Link>

              {/* 4. RADAR CHART */}
              <Link to="/body-exposure" className="pmd-astral-widget" data-chart-type="radar" title="6-Axis Multi-System Physiological Radar">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="human" />
                    <span>RADAR</span>
                  </span>
                  <span className="pmd-astral-widget-val">6-AXIS ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <polygon points="80,4 112,18 112,46 80,60 48,46 48,18" fill="none" stroke="rgba(148,163,184,0.28)" strokeWidth="1" />
                  <polygon points="80,14 102,23 102,41 80,50 58,41 58,23" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="0.8" />
                  <polygon points="80,7 109,21 101,45 80,55 54,42 62,20" fill="rgba(52,211,153,0.24)" stroke="#34d399" strokeWidth="1.8" />
                  <polygon points="80,12 98,24 107,42 80,48 60,44 52,22" fill="rgba(56,189,248,0.16)" stroke="#38bdf8" strokeWidth="1.3" />
                </svg>
              </Link>
            </>
          )}

          {chartBank === 'flow' && (
            <>
              {/* 5. DONUT CHART */}
              <Link to="/longevity" className="pmd-astral-widget" data-chart-type="donut" title="Multi-Domain Longevity Allocation Donut">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="simulate" />
                    <span>DONUT</span>
                  </span>
                  <span className="pmd-astral-widget-val">{filtered.matchingTotal} ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <circle cx="80" cy="32" r="22" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="7" />
                  <circle cx="80" cy="32" r="22" fill="none" stroke="#34d399" strokeWidth="7" strokeDasharray="58 140" strokeLinecap="round" transform="rotate(-90 80 32)" />
                  <circle cx="80" cy="32" r="22" fill="none" stroke="#22d3ee" strokeWidth="7" strokeDasharray="36 140" strokeDashoffset="-64" strokeLinecap="round" transform="rotate(-90 80 32)" />
                  <circle cx="80" cy="32" r="22" fill="none" stroke="#a78bfa" strokeWidth="7" strokeDasharray="24 140" strokeDashoffset="-106" strokeLinecap="round" transform="rotate(-90 80 32)" />
                  <circle cx="80" cy="32" r="4" fill="#ffffff" />
                </svg>
              </Link>

              {/* 6. VEIN / SANKEY FLOW CHART */}
              <Link to="/electrophysiology" className="pmd-astral-widget" data-chart-type="vein" title="Vascular & Neural Tributary Vein Flow">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="clinical" />
                    <span>VEIN FLOW</span>
                  </span>
                  <span className="pmd-astral-widget-val">SYNC ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <path d="M8 10 C48 10, 56 32, 88 32 L152 32" fill="none" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M8 32 C48 32, 56 32, 88 32" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                  <path d="M8 54 C48 54, 56 32, 88 32" fill="none" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M88 32 C112 32, 122 14, 152 14" fill="none" stroke="#a78bfa" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M88 32 C112 32, 122 50, 152 50" fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="88" cy="32" r="5" fill="#ffffff" />
                </svg>
              </Link>

              {/* 7. WATERFALL CHART */}
              <Link to="/data-lab" className="pmd-astral-widget" data-chart-type="waterfall" title="Cumulative Biomarker Delta Waterfall">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="explore" />
                    <span>WATERFALL</span>
                  </span>
                  <span className="pmd-astral-widget-val">+Δ ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <rect x="12" y="34" width="16" height="22" rx="3" fill="#38bdf8" />
                  <rect x="38" y="22" width="16" height="14" rx="3" fill="#34d399" />
                  <rect x="64" y="12" width="16" height="12" rx="3" fill="#34d399" />
                  <rect x="90" y="12" width="16" height="10" rx="3" fill="#fb7185" />
                  <rect x="116" y="8" width="16" height="16" rx="3" fill="#22d3ee" />
                  <rect x="138" y="8" width="12" height="48" rx="3" fill="#fbbf24" />
                </svg>
              </Link>

              {/* 8. COMPARISON CHART */}
              <Link to="/clinical-scores" className="pmd-astral-widget" data-chart-type="comparison" title="Baseline vs Active Trajectory Comparison">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <LensLogoSvg id="healthcare" />
                    <span>COMPARE</span>
                  </span>
                  <span className="pmd-astral-widget-val">A/B ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <path d="M8 48 C36 20, 64 50, 94 18 C118 8, 136 32, 152 14" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M8 52 C36 38, 64 44, 94 34 C118 28, 136 42, 152 30" fill="none" stroke="#f472b6" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                </svg>
              </Link>
            </>
          )}

          {chartBank === 'matrix' && (
            <>
              {/* 9. HEATMAP CHART */}
              <Link to="/genome-lab" className="pmd-astral-widget" data-chart-type="heatmap" title="Biomarker & Genomic Density Heatmap">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <LensLogoSvg id="education" />
                    <span>HEATMAP</span>
                  </span>
                  <span className="pmd-astral-widget-val">GRID ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, col) =>
                    Array.from({ length: 4 }, (__, row) => {
                      const intensity = ((col * 3 + row * 5) % 4) + 1
                      const fill = intensity === 4 ? '#34d399' : intensity === 3 ? '#22d3ee' : intensity === 2 ? '#6366f1' : 'rgba(148,163,184,0.2)'
                      return (
                        <rect
                          key={`${col}-${row}`}
                          x={10 + col * 14}
                          y={6 + row * 13}
                          width="10"
                          height="10"
                          rx="2.5"
                          fill={fill}
                        />
                      )
                    }),
                  )}
                </svg>
              </Link>

              {/* 10. BUBBLE CHART */}
              <Link to="/knowledge-bridge" className="pmd-astral-widget" data-chart-type="bubble" title="Multi-Scale Concept Cluster Bubble Chart">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="explore" />
                    <span>BUBBLE</span>
                  </span>
                  <span className="pmd-astral-widget-val">CLUSTER ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <circle cx="28" cy="36" r="11" fill="#22d3ee" fillOpacity="0.45" stroke="#67e8f9" strokeWidth="1.2" />
                  <circle cx="58" cy="26" r="16" fill="#34d399" fillOpacity="0.55" stroke="#6ee7b7" strokeWidth="1.4" />
                  <circle cx="92" cy="38" r="12" fill="#a78bfa" fillOpacity="0.5" stroke="#c4b5fd" strokeWidth="1.2" />
                  <circle cx="122" cy="22" r="14" fill="#fbbf24" fillOpacity="0.5" stroke="#fde68a" strokeWidth="1.2" />
                  <circle cx="144" cy="42" r="7" fill="#fb7185" fillOpacity="0.7" />
                </svg>
              </Link>

              {/* 11. DIVERGING CHART */}
              <Link to="/clinical-calculators" className="pmd-astral-widget" data-chart-type="diverging" title="Bidirectional Risk vs Reserve Diverging Bars">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="clinical" />
                    <span>DIVERGING</span>
                  </span>
                  <span className="pmd-astral-widget-val">±Z ⓘ</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <line x1="80" y1="4" x2="80" y2="60" stroke="rgba(226,232,240,0.45)" strokeWidth="1.2" />
                  <rect x="42" y="8" width="38" height="8" rx="4" fill="#fb7185" />
                  <rect x="80" y="20" width="54" height="8" rx="4" fill="#34d399" />
                  <rect x="54" y="32" width="26" height="8" rx="4" fill="#fbbf24" />
                  <rect x="80" y="44" width="42" height="8" rx="4" fill="#22d3ee" />
                </svg>
              </Link>

              {/* 12. 3D SPATIAL ORGAN MESH CALLOUT */}
              <Link to="/body-exposure" className="pmd-astral-widget" data-chart-type="spatial-organ" title="3D Anatomical Atlas & Volumetric Organ Mesh">
                <div className="pmd-astral-widget-top">
                  <span className="pmd-astral-widget-tag">
                    <RealmLogoSvg realm="human" />
                    <span>3D ATLAS</span>
                  </span>
                  <span className="pmd-astral-widget-val">GLB ↗</span>
                </div>
                <svg viewBox="0 0 160 64" className="pmd-astral-widget-chart" aria-hidden="true">
                  <ellipse cx="48" cy="32" rx="26" ry="20" fill="rgba(167,139,250,0.18)" stroke="#a78bfa" strokeWidth="1.5" />
                  <path d="M32 28c6-6 14 4 20-3s10 7 14 2M30 37c8 5 16-4 24 2s10-3 14-1" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="74" y1="24" x2="94" y2="18" stroke="#67e8f9" strokeWidth="1.1" />
                  <rect x="94" y="10" width="56" height="16" rx="8" fill="rgba(6,78,59,0.75)" stroke="#34d399" strokeWidth="1" />
                  <line x1="74" y1="38" x2="94" y2="44" stroke="#c4b5fd" strokeWidth="1.1" />
                  <rect x="94" y="36" width="56" height="16" rx="8" fill="rgba(30,27,75,0.75)" stroke="#a78bfa" strokeWidth="1" />
                </svg>
              </Link>
            </>
          )}
        </div>

        {/* 3. Real-Time Interactive 360 Orbital Sphere + 3D Human Pedestal Core */}
        <div
          ref={stageRef}
          tabIndex={0}
          role="region"
          aria-label="Menu orbit 360 derajat Panacea"
          data-testid="astral-360-stage"
          className="pmd-astral-stage"
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerEnd}
          onPointerCancel={handleStagePointerEnd}
          onWheel={handleStageWheel}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              rotateByStep(-1)
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              rotateByStep(1)
            }
          }}
        >
          <svg className="pmd-astral-rings" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <ellipse cx="50" cy="52" rx="41" ry="18" fill="none" stroke="rgba(52, 211, 153, 0.28)" strokeWidth="0.35" />
            <ellipse cx="50" cy="52" rx="44" ry="23" fill="none" stroke="rgba(56, 189, 248, 0.24)" strokeWidth="0.3" strokeDasharray="1.4 1.8" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(167, 139, 250, 0.16)" strokeWidth="0.25" />
            {projected.map((node) => (
              <line
                key={node.index}
                x1="50"
                y1="50"
                x2={node.xPct}
                y2={node.yPct}
                stroke={node.isFront ? 'rgba(52, 211, 153, 0.78)' : 'rgba(103, 232, 249, 0.18)'}
                strokeWidth={node.isFront ? '0.6' : '0.28'}
              />
            ))}
          </svg>

          <div className="pmd-astral-core">
            {live3D ? (
              <Suspense
                fallback={
                  <div className="grid h-full w-full place-items-center text-[11px] font-bold text-cyan-200">
                    3D Mesh…
                  </div>
                }
              >
                <AstralLive3DBodyCore
                  layers={activeLensDef.bodyLayers}
                  onPickStructure={(label) => setPickedStructure(label)}
                  onClose={() => setLive3D(false)}
                />
              </Suspense>
            ) : (
              <Human3DPedestalCoreSvg accent={activeLensDef.accent} />
            )}
          </div>

          <div className="pmd-astral-core-actions">
            <button
              type="button"
              className="pmd-astral-core-toggle"
              onClick={() => setLive3D((v) => !v)}
            >
              <RealmLogoSvg realm="simulate" />
              <span>{live3D ? 'Hologram Core' : 'Live 3D Mesh'}</span>
            </button>
          </div>

          {projected.map((proj) => {
            const realm = filtered.realms[proj.index]
            if (!realm) return null
            const Icon = icons[realm.space.id]
            return (
              <button
                key={realm.space.id}
                type="button"
                className="pmd-astral-node"
                data-front={String(proj.isFront)}
                data-realm={realm.space.id}
                title={realm.space.cue}
                onClick={() => snapToRealmIndex(proj.index)}
                aria-label={`Fokus ke ${realm.space.label} (${realm.featureCount} fitur)`}
                style={{
                  left: `${proj.xPct.toFixed(2)}%`,
                  top: `${proj.yPct.toFixed(2)}%`,
                  zIndex: proj.zIndex,
                  opacity: proj.opacity,
                  transform: `translate(-50%, -50%) scale(${proj.scale.toFixed(3)})`,
                }}
              >
                <span className="pmd-astral-node-title">
                  <RealmLogoSvg realm={realm.space.id} />
                  <span>{realm.space.label}</span>
                  <span className="sr-only">
                    <Icon size={12} />
                  </span>
                </span>
                <span className="pmd-astral-node-count">{realm.featureCount}</span>
              </button>
            )
          })}
        </div>

        {pickedStructure && (
          <div className="text-center text-xs font-semibold text-emerald-200" role="status">
            3D: {pickedStructure}
          </div>
        )}

        {/* 4. BodyExposure / BodyAnalysis 4-Mediator Visual Portal Strip */}
        <nav aria-label="Body Exposure portals" className="pmd-astral-portals">
          {BODY_MEDIATOR_PORTALS.map((portal) => (
            <Link key={portal.id} to={portal.to} title={portal.cue} className="pmd-astral-portal-link">
              <span className="pmd-astral-portal-left">
                <span className="pmd-astral-logo-orb">
                  <RealmLogoSvg
                    realm={
                      portal.id === 'your-body'
                        ? 'health'
                        : portal.id === 'clinical'
                          ? 'clinical'
                          : portal.id === 'open-3d'
                            ? 'human'
                            : 'for-you'
                    }
                  />
                </span>
                <span className="pmd-astral-portal-label">{portal.label}</span>
              </span>
              <FeatureMiniVizSvg seed={portal.id} accent={portal.accent} />
            </Link>
          ))}
        </nav>

        {/* 5. Constellation Visual Widget Feature Dock (1-Tap, Zero Paragraph Text!) */}
        <div className="pmd-astral-dock" aria-live="polite">
          <div className="pmd-astral-dock-head">
            <div className="flex items-center gap-2">
              {focusedRealm && <RealmLogoSvg realm={focusedRealm.space.id} />}
              <span className="text-sm font-extrabold text-white">
                {isSearching
                  ? `${displayedPool.length} Match`
                  : `${focusedRealm?.space.label ?? 'Explore'} · ${displayedPool.length}`}
              </span>
            </div>

            {!isSearching && focusedRealm && (
              <Link
                to={focusedRealm.space.to}
                title={focusedRealm.space.cue}
                className="pmd-astral-btn pmd-astral-btn--accent shrink-0"
              >
                <span>{focusedRealm.space.label}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>

          {visibleFeatures.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cyan-300/25 px-4 py-5 text-center text-xs font-bold text-slate-300">
              0 fitur
            </div>
          ) : (
            <div className="pmd-astral-feature-grid">
              {visibleFeatures.map((feat) => (
                <Link
                  key={feat.canonicalTo}
                  to={feat.canonicalTo}
                  title={feat.summary}
                  className="pmd-astral-feature-card"
                >
                  <div className="pmd-astral-feature-main">
                    <span className="pmd-astral-logo-orb">
                      <RealmLogoSvg realm={feat.realm} />
                    </span>
                    <div className="pmd-astral-feature-copy">
                      <span className="pmd-astral-feature-title">{feat.label}</span>
                      <span className="pmd-astral-feature-chip">{feat.group} · ⓘ</span>
                    </div>
                  </div>
                  <div className="pmd-astral-feature-viz">
                    <FeatureMiniVizSvg seed={feat.canonicalTo} accent={activeLensDef.accent} />
                    <span aria-hidden="true" className="text-xs font-bold text-emerald-300">
                      ↗
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {displayedPool.length > COLLAPSED_FEATURE_LIMIT && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setShowAllFeatures((v) => !v)}
                className="pmd-astral-btn"
              >
                {showAllFeatures
                  ? '− Ringkas'
                  : `+ Semua (${displayedPool.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AstralOrbit360Hub
