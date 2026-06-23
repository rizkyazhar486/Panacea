import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, Field, inputClass } from '../components/ui'
import {
  IconHome, IconUsers, IconSearch, IconUser, IconPlus, IconRun, IconDrop, IconFlame, IconLeaf,
  IconArticle, IconComment, IconMoon, IconVideo, IconHeart, IconRepost, IconBookmark, IconLock,
  IconShare2, IconSend, IconX, IconMapPin, IconNavigation, IconTimer, IconGauge, IconActivity,
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { uploadOrLocal } from '../lib/upload'
import type { SocialPost, PostType, Role, ProfileEdit } from '../lib/types'

/* ═══════════════════════════════════════════════════════
   GPS SPORTS MODES
   ═══════════════════════════════════════════════════════ */
interface GpsSportMode {
  id: string; name: string; emoji: string; met: number; type: 'walk' | 'run' | 'cycle' | 'marathon' | 'half_marathon'
  targetDist?: number; // km
  hiit: boolean
}
const GPS_SPORTS: GpsSportMode[] = [
  { id: 'walk', name: 'Jalan', emoji: '🚶', met: 3.5, type: 'walk', hiit: false },
  { id: 'jog', name: 'Jogging', emoji: '🏃', met: 7.0, type: 'run', hiit: false },
  { id: 'run', name: 'Lari', emoji: '🏃‍♂️', met: 9.8, type: 'run', hiit: false },
  { id: 'sprint', name: 'Sprint/HIIT', emoji: '⚡', met: 14.0, type: 'run', hiit: true },
  { id: 'cycle_easy', name: 'Sepeda Santai', emoji: '🚴', met: 6.0, type: 'cycle', hiit: false },
  { id: 'cycle_intense', name: 'Sepeda Intens', emoji: '🚴‍♂️', met: 12.0, type: 'cycle', hiit: true },
  { id: 'half_marathon', name: 'Half Marathon', emoji: '🏅', met: 10.5, type: 'half_marathon', targetDist: 21.0975, hiit: false },
  { id: 'marathon', name: 'Marathon', emoji: '🏆', met: 10.0, type: 'marathon', targetDist: 42.195, hiit: false },
  { id: 'trail', name: 'Trail Running', emoji: '🏔️', met: 11.0, type: 'run', hiit: false },
  { id: 'fartlek', name: 'Fartlek', emoji: '🌀', met: 11.5, type: 'run', hiit: true },
  { id: 'interval', name: 'Interval Training', emoji: '🔥', met: 13.0, type: 'run', hiit: true },
  { id: 'tempo', name: 'Tempo Run', emoji: '💨', met: 10.8, type: 'run', hiit: false },
]

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const COLORS = ['#00BF63', '#0B7A4B', '#3b82f6', '#8b5cf6', '#f59e0b', '#FF3131']
const roleLabel: Record<Role, string> = {
  pasien: 'Pelanggan', dokter: 'Dokter', kontributor: 'Kontributor', verifikator: 'Verifikator', admin: 'Admin', owner: 'Owner',
}
type Tab = 'home' | 'friends' | 'search' | 'profile'

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} mnt`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam`
  return `${Math.floor(h / 24)} hari`
}

function initials(name: string): string {
  const parts = name.replace(/^(Bpk\.|Ibu|Sdr\.|An\.|dr\.|Prof\.)\s*/i, '').trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

interface Profile { email: string; name: string; role: Role; color: string; posts: number }

const SubCtx = createContext<{ subscribed: Set<string>; price: number; subscribe: (email: string) => Promise<boolean> }>({
  subscribed: new Set(), price: 100, subscribe: async () => false,
})

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function ColoredIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ color, display: 'inline-flex' }}>{children}</span>
}
function isImg(s: string): boolean { return s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('http') }
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i); return h }

/* ═══════════════════════════════════════════════════════
   CALCULATIONS: BMI, BMR, VO2Max, HIIT Indicator
   ═══════════════════════════════════════════════════════ */
function calcBMI(w: number, h: number) { return w / ((h / 100) ** 2) }
function calcBMR(w: number, h: number, age: number, g: 'M' | 'F') {
  return g === 'M' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161
}
function calcVO2MaxEst(hrRest: number, age: number, g: 'M' | 'F') {
  // Uth-Sørensen estimation
  return g === 'M' ? 15.3 * (220 - age) / hrRest : 15.3 * (226 - age) / hrRest
}
function calcVO2MaxRockport(distKm: number, timeMin: number, hr: number, age: number, g: 'M' | 'F') {
  const vo2 = 132.853 - (0.0769 * (g === 'M' ? 1 : 0)) - (0.3877 * age) - (0.1692 * (hr)) + (6.315 * (g === 'M' ? 1 : 0)) - (3.2649 * timeMin) + (0.1565 * (distKm * 1000))
  return Math.max(10, vo2)
}
function hiitIndicator(met: number, hrMax: number, hrRest: number, currentHr: number) {
  if (!currentHr) return { zone: '—', color: '#a3a3a3', intensity: 0, label: 'No HR data' }
  const hrReserve = hrMax - hrRest
  const pct = hrReserve > 0 ? ((currentHr - hrRest) / hrReserve) * 100 : 0
  if (pct >= 90) return { zone: 'Z5 ANAEROBIC', color: '#FF3131', intensity: 100, label: 'HIIT MAX — Maksimal 30-60 detik interval' }
  if (pct >= 80) return { zone: 'Z4 THRESHOLD', color: '#f97316', intensity: 85, label: 'HIIT High — 2-4 menit interval' }
  if (pct >= 70) return { zone: 'Z3 TEMPO', color: '#f59e0b', intensity: 70, label: 'Moderate-High — 5-10 menit' }
  if (pct >= 60) return { zone: 'Z2 AEROBIC', color: '#00BF63', intensity: 50, label: 'Fat Burn — Lari santai / LSD' }
  return { zone: 'Z1 RECOVERY', color: '#3b82f6', intensity: 25, label: 'Recovery — Warm up / Cool down' }
}

function bmiCategory(v: number) {
  if (v < 18.5) return { l: 'Kurus', c: '#3b82f6' }
  if (v < 23) return { l: 'Normal', c: '#00BF63' }
  if (v < 25) return { l: 'Berlebih', c: '#f59e0b' }
  if (v < 30) return { l: 'Obesitas I', c: '#f97316' }
  return { l: 'Obesitas II', c: '#FF3131' }
}

/* ═══════════════════════════════════════════════════════
   GPS HELPERS
   ═══════════════════════════════════════════════════════ */
interface GpsPoint { lat: number; lng: number; t: number; hr?: number; spd?: number }
interface Waypoint { x: number; y: number }

function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; const dr = Math.PI / 180
  const dLa = (lat2 - lat1) * dr; const dLo = (lon2 - lon1) * dr
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * dr) * Math.cos(lat2 * dr) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function totalDist(pts: GpsPoint[]) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng); return d }
function fmtD(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sc = Math.floor(s % 60); return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '0') : m + ':' + String(sc).padStart(2, '0') }
function fmtDist(m: number) { return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m' }
function fmtPace(s: number, m: number) { if (m < 10) return '--:--/km'; const pk = s / 60 / (m / 1000); const pm = Math.floor(pk); const ps = Math.round((pk - pm) * 60); return pm + ':' + String(ps).padStart(2, '0') + '/km' }
function calcAcceleration(pts: GpsPoint[]): number {
  if (pts.length < 3) return 0
  const recent = pts.slice(-5)
  if (recent.length < 2) return 0
  let totalAcc = 0; let count = 0
  for (let i = 1; i < recent.length; i++) {
    const dt = (recent[i].t - recent[i - 1].t) / 1000
    if (dt <= 0) continue
    const d = hav(recent[i - 1].lat, recent[i - 1].lng, recent[i].lat, recent[i].lng)
    const v1 = recent[i - 1].spd ?? (d / dt)
    const v2 = recent[i].spd ?? (d / dt)
    totalAcc += (v2 - v1) / dt; count++
  }
  return count > 0 ? totalAcc / count : 0
}
function mapGPSToSVG(pts: GpsPoint[], w: number, h: number, pad: number) {
  if (!pts.length) return [{ x: w / 2, y: h / 2 }]
  const las = pts.map(p => p.lat); const lns = pts.map(p => p.lng)
  const minLa = Math.min(...las); const maxLa = Math.max(...las)
  const minLo = Math.min(...lns); const maxLo = Math.max(...lns)
  const rLa = (maxLa - minLa) || 0.002; const rLo = (maxLo - minLo) || 0.002
  const s = Math.min((w - pad * 2) / rLo, (h - pad * 2) / rLa)
  return pts.map(p => ({
    x: pad + (p.lng - minLo) * s + ((w - pad * 2) - rLo * s) / 2,
    y: pad + (maxLa - p.lat) * s + ((h - pad * 2) - rLa * s) / 2,
  }))
}
function makeSVGPath(m: { x: number; y: number }[]) {
  if (m.length < 2) return ''
  return 'M' + m[0].x.toFixed(1) + ',' + m[0].y.toFixed(1) + m.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('')
}

/* ═══════════════════════════════════════════════════════
   MINI LONGEVITY RING
   ═══════════════════════════════════════════════════════ */
function MiniRing({ score, size = 56 }: { score: number; size?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => { const t = setTimeout(() => setV(score), 300); return () => clearTimeout(t) }, [score])
  const r = (size - 10) / 2; const c = 2 * Math.PI * r; const off = c - (v / 100) * c
  const col = score >= 70 ? '#00BF63' : score >= 45 ? '#f59e0b' : '#FF3131'
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ filter: `drop-shadow(0 0 10px ${col}44)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   HEALTH METRICS DISPLAY (VO2Max, BMI, BMR)
   ═══════════════════════════════════════════════════════ */
function HealthMetricsBar({ weight, height, age, gender, hrRest }: { weight: number; height: number; age: number; gender: 'M' | 'F'; hrRest?: number }) {
  const bmi = calcBMI(weight, height)
  const bmr = calcBMR(weight, height, age, gender)
  const vo2 = hrRest ? calcVO2MaxEst(hrRest, age, gender) : null
  const bmiCat = bmiCategory(bmi)
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-neutral-100 p-2.5 text-center">
        <div className="text-lg font-extrabold" style={{ color: bmiCat.c }}>{bmi.toFixed(1)}</div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">BMI</div>
        <div className="text-[9px] font-semibold" style={{ color: bmiCat.c }}>{bmiCat.l}</div>
      </div>
      <div className="rounded-xl border border-neutral-100 p-2.5 text-center">
        <div className="text-lg font-extrabold text-indigo-500">{Math.round(bmr)}</div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">BMR</div>
        <div className="text-[9px] text-neutral-400">kkal/hari</div>
      </div>
      <div className="rounded-xl border border-neutral-100 p-2.5 text-center">
        <div className="text-lg font-extrabold" style={{ color: vo2 ? (vo2 >= 45 ? '#00BF63' : vo2 >= 35 ? '#f59e0b' : '#FF3131') : '#d4d4d4' }}>
          {vo2 ? vo2.toFixed(1) : '—'}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">VO₂Max</div>
        <div className="text-[9px] text-neutral-400">{vo2 ? (vo2 >= 50 ? 'Elite' : vo2 >= 45 ? 'Excellent' : vo2 >= 35 ? 'Good' : 'Fair') : 'Need HR'}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GPS TRACKER COMPONENT (in Feed)
   ═══════════════════════════════════════════════════════ */
type TrackMode = 'idle' | 'planning' | 'tracking' | 'paused' | 'done'

function GpsTrackerCard({ onShareToFeed }: { onShareToFeed: (data: { sport: GpsSportMode; dist: number; dur: number; speed: number; pace: string; kcal: number; hr: number; acceleration: number; vo2Max: number; hiit: ReturnType<typeof hiitIndicator>; pathImage?: string }) => void }) {
  const [mode, setMode] = useState<TrackMode>('idle')
  const [sport, setSport] = useState<GpsSportMode>(GPS_SPORTS[0])
  const [pts, setPts] = useState<GpsPoint[]>([])
  const [plan, setPlan] = useState<Waypoint[]>([])
  const [dur, setDur] = useState(0)
  const [hr, setHr] = useState(0)
  const [gpsErr, setGpsErr] = useState('')
  const wRef = useRef<number | null>(null)
  const tRef = useRef<number | null>(null)
  const sRef = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const { account } = useStore()

  // Load body data from localStorage
  const bodyData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('pm_body_v2') || '{}') } catch { return {} }
  }, [])
  const weight = bodyData.w || 65
  const height = bodyData.h || 165
  const age = bodyData.age || 30
  const gender = bodyData.g || 'M'
  const hrMax = gender === 'M' ? 220 - age : 226 - age

  const dist = totalDist(pts)
  const speed = dur > 0 ? (dist / dur) * 3.6 : 0
  const acceleration = calcAcceleration(pts)
  const kcal = Math.round(sport.met * weight * (dur / 3600))
  const mapped = mapGPSToSVG(pts, 360, 220, 20)
  const pathD = makeSVGPath(mapped)
  const hiit = hiitIndicator(sport.met, hrMax, hr || 60, hr)
  const vo2Est = hr > 0 ? calcVO2MaxRockport(dist / 1000, dur / 60, hr, age, gender as 'M' | 'F') : 0

  function onSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (mode !== 'planning' || !svgRef.current) return
    const r = svgRef.current.getBoundingClientRect()
    setPlan(p => [...p, { x: ((e.clientX - r.left) / r.width) * 360, y: ((e.clientY - r.top) / r.height) * 220 }])
  }
  function startTrack() {
    setGpsErr(''); setMode('tracking'); setPts([]); setDur(0); sRef.current = Date.now()
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    if (!navigator.geolocation) { setGpsErr('GPS tidak didukung browser.'); return }
    wRef.current = navigator.geolocation.watchPosition(
      pos => setPts(p => {
        const newPts = [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined, spd: pos.coords.speed ?? undefined }]
        return newPts
      }),
      err => setGpsErr('GPS error: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    )
  }
  function pause() { setMode('paused'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current) }
  function resume() {
    setMode('tracking'); const off = dur * 1000; sRef.current = Date.now() - off
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    wRef.current = navigator.geolocation.watchPosition(
      pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined, spd: pos.coords.speed ?? undefined }]),
      () => {}, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    )
  }
  function stop() { setMode('done'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current) }
  function reset() { setMode('idle'); setPts([]); setPlan([]); setDur(0); setHr(0); setGpsErr('') }
  function shareToFeed() {
    onShareToFeed({ sport, dist, dur, speed, pace: fmtPace(dur, dist), kcal, hr, acceleration, vo2Max: vo2Est, hiit })
  }
  function planPathD() { if (plan.length < 2) return ''; return 'M' + plan[0].x.toFixed(1) + ',' + plan[0].y.toFixed(1) + plan.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('') }

  const progressPct = sport.targetDist ? Math.min(100, (dist / 1000 / sport.targetDist) * 100) : 0

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-black flex items-center gap-2">📍 GPS Tracker</h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">Lacak rute, kecepatan, percepatan & kalori</p>
        </div>
        {mode === 'done' && (
          <button onClick={shareToFeed} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>
            <IconShare2 size={13} /> Share
          </button>
        )}
      </div>

      {/* Sport Selection */}
      <div className="px-5 pb-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {GPS_SPORTS.map(s => (
            <button key={s.id} onClick={() => mode === 'idle' && setSport(s)} disabled={mode !== 'idle'}
              className={'shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50 border ' +
                (sport.id === s.id ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white')}>
              <span className="text-sm">{s.emoji}</span> {s.name}
              {s.hiit && <span className="ml-1 text-[8px] font-black text-red-500">HIIT</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Map SVG */}
      <div className="mx-5 rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <svg ref={svgRef} viewBox="0 0 360 220" className="w-full cursor-crosshair" onClick={onSvgClick} style={{ minHeight: 180 }}>
          {Array.from({ length: 9 }, (_, i) => <line key={'h' + i} x1="0" x2="360" y1={i * 27.5} y2={i * 27.5} stroke="rgba(255,255,255,0.03)" />)}
          {Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={i * 30} x2={i * 30} y1="0" y2="220" stroke="rgba(255,255,255,0.03)" />)}
          {plan.length >= 2 && <><path d={planPathD()} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="3" strokeDasharray="8 4" strokeLinecap="round" />{plan.map((p, i) => <circle key={'wp' + i} cx={p.x} cy={p.y} r="5" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" />)}</>}
          {pathD && <><defs><linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00BF63" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs><path d={pathD} fill="none" stroke="url(#rG)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" /></>}
          {mapped.length > 0 && <>{mapped.map((p, i) => i === 0 ? <circle key={'s' + i} cx={p.x} cy={p.y} r="6" fill="#00BF63" stroke="white" strokeWidth="2" /> : i === mapped.length - 1 && mode !== 'tracking' ? <circle key={'e' + i} cx={p.x} cy={p.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" /> : null)}{(mode === 'tracking' || mode === 'paused') && mapped.length > 0 && <g><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="8" fill="rgba(0,191,99,0.3)"><animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" /></circle><circle cx={mapped[mapped.length - 1].x} cy={mapped[mapped.length - 1].y} r="4" fill="#00BF63" stroke="white" strokeWidth="1.5" /></g>}</>}
          {mode === 'idle' && pts.length === 0 && plan.length === 0 && <text x="180" y="105" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.3)" fontWeight="600">Pilih olahraga & tekan Mulai</text>}
          {mode === 'planning' && <text x="180" y="15" textAnchor="middle" fontSize="9" fill="rgba(139,92,246,0.8)" fontWeight="600">📍 Klik untuk menambah waypoint</text>}
        </svg>

        {/* Stats Overlay */}
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="grid grid-cols-5 gap-px bg-black/30">
            {[[fmtD(dur), 'WAKTU'], [fmtDist(dist), 'JARAK'], [Math.round(speed), 'KM/H'], [fmtPace(dur, dist), 'PACE'], [acceleration.toFixed(2), 'm/s²']].map(([v, l]) => (
              <div key={l} className="bg-black/40 px-1.5 py-2 text-center">
                <div className="text-xs font-extrabold text-white tabular-nums">{v}</div>
                <div className="text-[7px] font-bold uppercase tracking-widest text-white/40">{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HIIT Indicator & Health Metrics */}
      <div className="px-5 pt-3 space-y-2">
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <>
            {/* HIIT Zone Indicator */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: `${hiit.color}10`, border: `1px solid ${hiit.color}30` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ background: hiit.color, boxShadow: `0 4px 12px ${hiit.color}44` }}>
                {hiit.intensity}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black" style={{ color: hiit.color }}>{hiit.zone}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">{hiit.label}</div>
              </div>
              <div className="h-2 w-20 rounded-full overflow-hidden" style={{ background: `${hiit.color}20` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hiit.intensity}%`, background: hiit.color }} />
              </div>
            </div>

            {/* Marathon/Half-Marathon Progress */}
            {sport.targetDist && (mode === 'tracking' || mode === 'paused' || mode === 'done') && (
              <div className="rounded-xl border border-neutral-100 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-neutral-700">{sport.emoji} {sport.name} Progress</span>
                  <span className="font-extrabold" style={{ color: progressPct >= 100 ? '#00BF63' : '#f59e0b' }}>{progressPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, progressPct)}%`, background: 'linear-gradient(90deg, #00BF63, #0B7A4B)' }} />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-400 mt-1">
                  <span>0 km</span>
                  <span>{sport.targetDist} km</span>
                </div>
              </div>
            )}

            {/* Health Metrics: VO2Max, BMI, BMR */}
            <HealthMetricsBar weight={weight} height={height} age={age} gender={gender as 'M' | 'F'} hrRest={hr || undefined} />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-5 space-y-3">
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-2.5">
            <span className="text-lg">💗</span>
            <div className="flex-1"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Heart Rate</div></div>
            <input className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-sm font-bold tabular-nums" type="number" value={hr} onChange={e => setHr(+e.target.value)} placeholder="bpm" />
            <span className="text-[10px] text-neutral-400">bpm</span>
          </div>
        )}

        {mode === 'done' && (
          <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #064e36)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ringkasan</div>
                <div className="text-xl font-extrabold">{sport.emoji} {sport.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold">{kcal}<span className="text-sm font-medium text-white/60"> kkal</span></div>
                <div className="text-[10px] text-white/70">MET {sport.met} · {vo2Est > 0 ? `VO₂Max ~${vo2Est.toFixed(1)}` : '—'}</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-2 text-center text-xs">
              <div><div className="font-bold">{fmtDist(dist)}</div><div className="text-white/50">Jarak</div></div>
              <div><div className="font-bold">{fmtD(dur)}</div><div className="text-white/50">Durasi</div></div>
              <div><div className="font-bold">{Math.round(speed)}</div><div className="text-white/50">km/h</div></div>
              <div><div className="font-bold">{hr || '—'}</div><div className="text-white/50">HR</div></div>
              <div><div className="font-bold">{acceleration.toFixed(1)}</div><div className="text-white/50">m/s²</div></div>
            </div>
          </div>
        )}

        {gpsErr && <div className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">{gpsErr}</div>}

        <div className="flex gap-2">
          {mode === 'idle' && <>
            <button onClick={startTrack} className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>▶ Mulai GPS</button>
            <button onClick={() => { setMode('planning'); setPlan([]) }} className="h-11 rounded-xl text-sm font-bold border-2 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all active:scale-95">📍 Rencanakan Jalur</button>
          </>}
          {mode === 'planning' && <>
            <button onClick={() => setPlan([])} className="h-10 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-600 px-4">Hapus</button>
            <button onClick={reset} className="flex-1 h-10 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-600">Batal</button>
            <button onClick={startTrack} className="flex-1 h-10 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>▶ Mulai</button>
          </>}
          {mode === 'tracking' && <>
            <button onClick={pause} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-all active:scale-95">⏸ Jeda</button>
            <button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95">⏹ Selesai</button>
          </>}
          {mode === 'paused' && <>
            <button onClick={resume} className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>▶ Lanjut</button>
            <button onClick={stop} className="flex-1 h-11 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95">⏹ Selesai</button>
          </>}
          {mode === 'done' && <button onClick={reset} className="w-full h-10 rounded-xl text-sm font-bold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all">Selesai & Reset</button>}
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   COMPOSE MODAL (with image upload, longevity share, GPS share)
   ═══════════════════════════════════════════════════════ */
function ComposeModal({ onClose, onPost, onShareLongevity, onShareGps, authorEmail, authorName, role }: {
  onClose: () => void; onPost: (p: SocialPost) => void; onShareLongevity: () => void; onShareGps: () => void
  authorEmail: string; authorName: string; role: Role
}) {
  const [caption, setCaption] = useState('')
  const [activity, setActivity] = useState('')
  const [postType, setPostType] = useState<PostType>('aktivitas')
  const [photos, setPhotos] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickFiles(files: FileList | null) {
    if (!files) return
    setBusy(true)
    const arr: string[] = []
    for (const f of Array.from(files)) {
      if (f.size > 10 * 1024 * 1024) continue
      arr.push(await uploadOrLocal(f))
    }
    setPhotos(p => [...p, ...arr])
    setBusy(false)
  }

  function submit() {
    if (!caption.trim() && photos.length === 0) return
    onPost({
      id: uid(), authorEmail, authorName, role,
      postType, kind: photos.length > 0 ? 'image' : 'text',
      activity: activity || 'Postingan', caption: caption.trim(),
      mediaColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      photos, likes: 0, comments: 0, reposts: 0,
      at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <h3 className="text-base font-black">Buat Postingan</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition"><IconX size={16} /></button>
        </div>

        {/* Quick Share Actions */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => { onShareLongevity(); onClose() }} className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #0B7A4B, #064e36)' }}>
            <span>🌱</span> Longevity Harian
          </button>
          <button onClick={() => { onShareGps(); onClose() }} className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <span>📍</span> Aktivitas GPS
          </button>
        </div>

        {/* Image Preview */}
        {photos.length > 0 && (
          <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {photos.map((p, i) => (
              <div key={i} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden">
                <img src={p} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><IconX size={10} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Type & Activity */}
        <div className="px-5 pb-3 flex gap-2">
          <select className={inputClass + ' flex-1'} value={postType} onChange={e => setPostType(e.target.value as PostType)}>
            <option value="aktivitas">🏃 Aktivitas</option>
            <option value="kebiasaan">🌿 Kebiasaan</option>
            <option value="artikel">📄 Artikel</option>
            <option value="resep">🍳 Resep</option>
            <option value="tips">💡 Tips</option>
          </select>
          <input className={inputClass + ' flex-1'} placeholder="Aktivitas (opsional)" value={activity} onChange={e => setActivity(e.target.value)} />
        </div>

        {/* Caption */}
        <div className="px-5 pb-3">
          <textarea className={inputClass + ' min-h-[120px] resize-none'} placeholder="Tulis caption... #longevity #sehat" value={caption} onChange={e => setCaption(e.target.value)} />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <label className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer hover:bg-neutral-200 transition">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => pickFiles(e.target.files)} />
            🖼️
          </label>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition">Batal</button>
          <button onClick={submit} disabled={busy || (!caption.trim() && photos.length === 0)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>
            {busy ? '...' : 'Posting'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   COMMENT SECTION
   ═══════════════════════════════════════════════════════ */
function CommentSection({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { state, addComment } = useStore()
  const [text, setText] = useState('')
  const comments = state.comments?.[postId] || []

  function submit() {
    if (!text.trim()) return
    addComment(postId, { id: uid(), authorEmail: state.account?.email ?? '', authorName: state.account?.name ?? 'Anonim', text: text.trim(), at: new Date().toISOString() })
    setText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-black">Komentar ({comments.length})</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"><IconX size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {comments.length === 0 && <p className="text-center text-sm text-neutral-400 py-6">Belum ada komentar</p>}
          {comments.map((c: { id: string; authorName: string; text: string; at: string }) => (
            <div key={c.id} className="flex gap-2.5">
              <span className="w-8 h-8 shrink-0 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">{initials(c.authorName)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2"><span className="text-xs font-bold">{c.authorName}</span><span className="text-[10px] text-neutral-400">{timeAgo(c.at)}</span></div>
                <p className="text-sm text-neutral-700 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-5 py-3 border-t border-neutral-100">
          <input className={inputClass + ' flex-1'} placeholder="Tulis komentar..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <button onClick={submit} disabled={!text.trim()} className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40" style={{ background: '#00BF63' }}><IconSend size={15} /></button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   POST CARD
   ═══════════════════════════════════════════════════════ */
function PostCard({ post: p, me, store, onProfile }: { post: SocialPost; me: string; store: ReturnType<typeof useStore>; onProfile: (e: string) => void }) {
  const [commentOpen, setCommentOpen] = useState(false)
  const [shareMenu, setShareMenu] = useState(false)
  const type = p.postType ?? 'aktivitas'
  const mine = p.authorEmail === me
  const cover = p.photos?.find(isImg)
  const color = COLORS[Math.abs(hash(p.id)) % COLORS.length]

  function handleLike() { store.toggleLike(p.id) }
  function handleBookmark() { store.toggleBookmark(p.id) }
  function handleRepost() { store.toggleRepost(p.id) }

  async function handleShareExternal() {
    const text = `${p.activity}\n\n${p.caption}\n\n— ${p.authorName} via Panaceamed.id\n#Longevity #PerjalananSehat`
    try {
      if (navigator.share) await navigator.share({ title: p.activity, text })
      else await navigator.clipboard.writeText(text)
    } catch { /* cancelled */ }
    setShareMenu(false)
  }

  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-md" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      {/* Author */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => !mine && onProfile(p.authorEmail)} className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)` }}>
          {initials(p.authorName)}
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => !mine && onProfile(p.authorEmail)} className="text-sm font-bold hover:underline">{p.authorName}</button>
          <div className="text-[10px] text-neutral-400">{timeAgo(p.at)} · {type}</div>
        </div>
        <div className="relative">
          <button onClick={() => setShareMenu(!shareMenu)} className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition">
            <IconShare2 size={15} />
          </button>
          {shareMenu && (
            <div className="absolute right-0 top-10 z-20 w-44 rounded-xl bg-white shadow-xl border border-neutral-100 py-1.5 overflow-hidden" style={{ animation: 'scaleIn 0.15s ease-out' }}>
              <button onClick={handleShareExternal} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">🔗 Salin Tautan</button>
              <button onClick={handleShareExternal} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">📱 Bagikan ke Medsos</button>
              <button onClick={handleRepost} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">🔄 Repost</button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {p.activity && p.activity !== 'Postingan' && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${color}10`, color }}>{p.activity}</span>
        </div>
      )}

      {/* Image */}
      {cover && (
        <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
          <img src={cover} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
        </div>
      )}

      {/* Caption */}
      {p.caption && (
        <div className="px-4 py-3 text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{p.caption}</div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t px-4 py-2.5" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <button onClick={handleLike} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-90 hover:bg-neutral-50" style={{ color: p.likedByMe ? '#FF3131' : '#a3a3a3' }}>
          <IconHeart size={16} fill={p.likedByMe ? '#FF3131' : 'none'} /> {p.likes || ''}
        </button>
        <button onClick={() => setCommentOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-400 transition-all active:scale-90 hover:bg-neutral-50">
          <IconComment size={16} /> {p.comments || 0}
        </button>
        <button onClick={handleRepost} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-90 hover:bg-neutral-50" style={{ color: p.repostedByMe ? '#00BF63' : '#a3a3a3' }}>
          <IconRepost size={16} /> {p.reposts || 0}
        </button>
        <div className="flex-1" />
        <button onClick={handleBookmark} className="px-2 py-1.5 rounded-lg transition-all active:scale-90 hover:bg-neutral-50" style={{ color: p.bookmarkedByMe ? '#f59e0b' : '#d4d4d4' }}>
          <IconBookmark size={16} fill={p.bookmarkedByMe ? '#f59e0b' : 'none'} />
        </button>
      </div>

      {commentOpen && <CommentSection postId={p.id} onClose={() => setCommentOpen(false)} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   TAB BUTTON
   ═══════════════════════════════════════════════════════ */
function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-300 sm:px-4 sm:text-sm" style={active ? { background: '#171717', color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } : { color: '#a3a3a3' }}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════
   HOME FEED
   ═══════════════════════════════════════════════════════ */
function HomeFeed({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const store = useStore()
  const { state, account, addPost } = useStore()
  const [filter, setFilter] = useState<'foryou' | 'following'>('foryou')
  const [showGps, setShowGps] = useState(false)

  const posts = state.posts.filter((p) => {
    if (p.archived) return false
    if (p.locked && p.authorEmail !== me) return false
    if (filter === 'following') return state.follows.includes(p.authorEmail) || p.authorEmail === me
    return true
  })

  const todayStr = new Date().toISOString().slice(0, 10)
  const wt = (state.wellness?.[todayStr] ?? {}) as Record<string, unknown>
  const todaysFoods = state.foods.filter((f) => f.date === todayStr)

  const { score: longevityScore, hasData, pillars } = useMemo(() => {
    function clampNum(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }
    const mainMeals = Math.max(0, todaysFoods.length)
    const exerciseFreq = (wt.exerciseMin as number || 0) > 0 ? 1 : 0
    const exerciseMin = wt.exerciseMin as number || 0
    const hydrationL = (wt.waterMl as number || 0) / 1000
    const sleepHr = wt.sleepHr as number || 0
    const meals = clampNum(100 - Math.abs(mainMeals - 3) * 18)
    const exercise = clampNum((exerciseFreq >= 1 ? 60 : 0) + Math.min(40, (exerciseMin / 30) * 40))
    const hydration = clampNum(hydrationL >= 2 && hydrationL <= 3.5 ? 100 : 100 - Math.abs(hydrationL - 2.5) * 28)
    const sleep = clampNum(sleepHr >= 7 && sleepHr <= 9 ? 100 : 100 - Math.abs(sleepHr - 8) * 16)
    const sun = 40
    const score = clampNum(meals * 0.2 + exercise * 0.25 + hydration * 0.15 + sleep * 0.25 + sun * 0.15)
    const hasAny = todaysFoods.length > 0 || (wt.sleepHr as number || 0) > 0 || (wt.waterMl as number || 0) > 0 || (wt.exerciseMin as number || 0) > 0
    return { score: hasAny ? score : 0, hasData: hasAny, pillars: { meals, exercise, hydration, sleep, sun } }
  }, [todaysFoods, wt])

  function shareLongevityToFeed() {
    if (!hasData) return
    addPost({
      id: uid(), authorEmail: account?.email ?? me, authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien',
      postType: 'kebiasaan', kind: 'text', activity: 'Longevity harian',
      caption: `Nilai Longevity: ${longevityScore}/100 🌱\n${longevityScore >= 80 ? 'Sangat baik' : longevityScore >= 60 ? 'Cukup baik' : 'Perlu perbaikan'}\n\n🍽️ Makan ${pillars.meals} · 🏃 Olahraga ${pillars.exercise} · 💧 Hidrasi ${pillars.hydration} · 🌙 Tidur ${pillars.sleep}\n\n#PerjalananSehat #Longevity`,
      mediaColor: '#0B7A4B', likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    })
  }

  function shareGpsToFeed(data: { sport: GpsSportMode; dist: number; dur: number; speed: number; pace: string; kcal: number; hr: number; acceleration: number; vo2Max: number; hiit: ReturnType<typeof hiitIndicator> }) {
    addPost({
      id: uid(), authorEmail: account?.email ?? me, authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien',
      postType: 'aktivitas', kind: 'text', activity: data.sport.name,
      caption: `${data.sport.emoji} ${data.sport.name}\n📍 Jarak: ${fmtDist(data.dist)}\n⏱ Durasi: ${fmtD(data.dur)}\n💨 Kecepatan: ${Math.round(data.speed)} km/h\n🏃 Pace: ${data.pace}\n🔥 Kalori: ${data.kcal} kkal\n💗 HR: ${data.hr || '—'} bpm\n📊 ${data.hiit.zone}\n${data.vo2Max > 0 ? `🫀 VO₂Max: ~${data.vo2Max.toFixed(1)} ml/kg/min\n` : ''}🚀 Percepatan: ${data.acceleration.toFixed(2)} m/s²\n\n#GPS #Olahraga #Longevity`,
      mediaColor: data.sport.hiit ? '#FF3131' : '#00BF63', likes: 0, comments: 0, reposts: 0,
      calories: data.kcal, at: new Date().toISOString(),
    })
  }

  const pillarDefs = [
    { key: 'meals' as const, label: 'Makan', emoji: '🍽️', color: '#f59e0b' },
    { key: 'exercise' as const, label: 'Olahraga', emoji: '🏃', color: '#f97316' },
    { key: 'hydration' as const, label: 'Hidrasi', emoji: '💧', color: '#2563eb' },
    { key: 'sleep' as const, label: 'Tidur', emoji: '🌙', color: '#818cf8' },
    { key: 'sun' as const, label: 'Matahari', emoji: '☀️', color: '#eab308' },
  ]

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Hero - NO "Bagikan Nilai Longevity" text button, just the ring + pillars */}
      <div className="overflow-hidden rounded-2xl border p-5" style={{ borderColor: 'rgba(0,191,99,0.12)', background: 'linear-gradient(135deg, rgba(0,191,99,0.04), rgba(11,122,75,0.02), transparent)' }}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <MiniRing score={longevityScore} size={68} />
            <span className="absolute inset-0 flex items-center justify-center text-[17px] font-black tabular-nums" style={{ color: longevityScore >= 60 ? '#00BF63' : longevityScore >= 30 ? '#f59e0b' : '#d4d4d4' }}>{longevityScore}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black tracking-tight">
              Panacea <span style={{ background: 'linear-gradient(135deg, #0B7A4B, #00BF63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hidup Sehat</span>
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">Bagikan aktivitas, kebiasaan & artikel longevity Anda.</p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {pillarDefs.map((p) => (
            <div key={p.key} className="flex items-center gap-2">
              <span className="w-4 text-center text-[11px]">{p.emoji}</span>
              <span className="w-16 text-[9px] font-semibold text-neutral-400">{p.label}</span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: `${p.color}15` }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${hasData ? pillars[p.key] : 0}%`, background: p.color }} />
              </div>
              <span className="w-7 text-right text-[9px] font-bold tabular-nums" style={{ color: hasData ? p.color : '#d4d4d4' }}>{hasData ? pillars[p.key] : '—'}</span>
            </div>
          ))}
        </div>

        {!hasData && (
          <div className="mt-4 rounded-xl px-3 py-2.5 text-center text-[11px] font-medium text-neutral-400" style={{ background: 'rgba(0,0,0,0.02)' }}>
            💡 Catat makanan & aktivitas di halaman <b>Nutrisi</b> untuk melihat skor
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: '📍', label: 'GPS Tracker', color: '#3b82f6', action: () => setShowGps(true) },
            { icon: '🏃', label: 'Aktivitas', color: '#00BF63' },
            { icon: '🌿', label: 'Kebiasaan', color: '#0B7A4B' },
            { icon: '📄', label: 'Artikel', color: '#3b82f6' },
            { icon: '🌙', label: 'Tidur', color: '#8b5cf6' },
            { icon: '💧', label: 'Hydrasi', color: '#06b6d4' },
          ].map((a) => (
            <button key={a.label} onClick={a.action} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-200 hover:scale-110" style={{ borderColor: `${a.color}20`, background: `${a.color}08` }}>
                <span className="text-lg">{a.icon}</span>
              </div>
              <span className="text-[9px] font-bold text-neutral-400">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GPS Tracker (expandable) */}
      {showGps && <GpsTrackerCard onShareToFeed={shareGpsToFeed} />}
      {showGps && (
        <div className="text-center">
          <button onClick={() => setShowGps(false)} className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition">Tutup GPS Tracker</button>
        </div>
      )}

      {/* Filter */}
      <div className="flex justify-center gap-2">
        {(['foryou', 'following'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="rounded-full px-5 py-1.5 text-sm font-bold transition-all duration-300 active:scale-95"
            style={filter === f ? { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', color: '#fff', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' } : { background: '#fff', color: '#a3a3a3', border: '1px solid rgba(0,0,0,0.06)' }}>
            {f === 'foryou' ? 'Untuk Anda' : 'Mengikuti'}
          </button>
        ))}
      </div>

      {posts.map((p) => <PostCard key={p.id} post={p} me={me} store={store} onProfile={onProfile} />)}
      {posts.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 10px 30px rgba(0,191,99,0.25)' }}><IconPlus size={30} /></div>
          <p className="max-w-xs text-sm text-neutral-500">Belum ada unggahan. Ketuk tombol <b style={{ color: '#0B7A4B' }}>+</b> untuk membagikan foto, aktivitas GPS, atau longevity harian.</p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FRIENDS / SEARCH / PROFILE VIEWS
   ═══════════════════════════════════════════════════════ */
function FriendsView({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const { state } = useStore()
  const profiles = useProfiles(me).filter((p) => state.follows.includes(p.email))
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <h3 className="flex items-center gap-2 font-bold">👥 Teman</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Akun yang Anda ikuti.</p>
      </div>
      {profiles.map((p) => (
        <button key={p.email} onClick={() => onProfile(p.email)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:shadow-sm" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(145deg, ${p.color}, ${p.color}bb)` }}>{initials(p.name)}</span>
          <div className="min-w-0 flex-1"><div className="truncate font-bold">{p.name}</div><div className="text-xs text-neutral-400">{roleLabel[p.role]} · {p.posts} postingan</div></div>
        </button>
      ))}
      {profiles.length === 0 && <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Belum ada teman.</div>}
    </div>
  )
}

function SearchView({ me, onProfile, onOpen }: { me: string; onProfile: (e: string) => void; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const profiles = useProfiles(me)
  const query = q.trim().toLowerCase()
  const matchProfiles = query ? profiles.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)) : []
  const fyp = state.posts.filter((p) => !p.locked && !p.archived && p.postType !== 'artikel')
  const shown = query ? fyp.filter((p) => p.caption.toLowerCase().includes(query) || p.activity.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query)) : fyp
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <IconSearch size={18} className="text-neutral-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari akun atau unggahan…" className="w-full bg-transparent text-sm outline-none" />
      </div>
      {matchProfiles.length > 0 && <div className="space-y-2"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Akun</div>{matchProfiles.map((p) => <button key={p.email} onClick={() => onProfile(p.email)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(145deg, ${p.color}, ${p.color}bb)` }}>{initials(p.name)}</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{p.name}</div><div className="text-xs text-neutral-400">{roleLabel[p.role]}</div></div></button>)}</div>}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{query ? 'Hasil' : 'For You'}</div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {shown.map((p) => { const cover = p.photos?.find(isImg); return (
          <button key={p.id} onClick={() => onOpen(p.id)} className="group relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
            {cover && <img src={cover} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span>
            <span className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow"><IconHeart size={10} />{p.likes}</span>
          </button>
        )})}
      </div>
      {shown.length === 0 && <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Belum ada unggahan.</div>}
    </div>
  )
}

type ProfileTab = 'posts' | 'locked' | 'liked' | 'saved'

function ProfileView({ me, name, role, onOpen }: { me: string; name: string; role: Role; onOpen: (id: string) => void }) {
  const { state, updateProfile } = useStore()
  const [pt, setPt] = useState<ProfileTab>('posts')
  const [edit, setEdit] = useState(false)
  const prof = state.profiles[me]
  const displayName = prof?.name || name
  const mine = state.posts.filter((p) => p.authorEmail === me)
  const sets: Record<ProfileTab, SocialPost[]> = {
    posts: mine.filter((p) => !p.locked && !p.archived),
    locked: mine.filter((p) => p.locked || p.archived),
    liked: state.posts.filter((p) => p.likedByMe || p.repostedByMe),
    saved: state.posts.filter((p) => p.bookmarkedByMe),
  }
  const color = COLORS[Math.abs(hash(me)) % COLORS.length]
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10 60%, transparent)` }} />
        <div className="relative -mt-10 px-5 pb-5">
          <div className="flex items-end gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)`, boxShadow: `0 8px 20px ${color}44` }}>{prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(displayName)}</span>
            <div className="min-w-0 flex-1 pb-1"><h2 className="text-lg font-black">{displayName}</h2><p className="text-xs text-neutral-500">{roleLabel[role]}</p></div>
          </div>
          {prof?.bio && <p className="mt-3 text-sm text-neutral-600">{prof.bio}</p>}
          <div className="mt-4 grid grid-cols-3 gap-3">{[{ val: mine.length, label: 'Postingan' }, { val: state.follows.length, label: 'Mengikuti' }, { val: sets.saved.length, label: 'Disimpan' }].map((s) => (<div key={s.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,0,0,0.02)' }}><div className="text-lg font-black tabular-nums">{s.val}</div><div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{s.label}</div></div>))}</div>
          <button onClick={() => setEdit(true)} className="mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition-all hover:shadow-sm active:scale-[0.98]" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Edit Profil</button>
        </div>
      </div>
      {edit && <EditProfileModal current={{ name: displayName, bio: prof?.bio ?? '', avatar: prof?.avatar }} onClose={() => setEdit(false)} onSave={(d) => { updateProfile(me, d); setEdit(false) }} />}
      <div className="flex gap-1 rounded-2xl p-1" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        {[['posts', <IconHome size={15} />, 'Postingan'], ['locked', <IconLock size={15} />, 'Terkunci'], ['liked', <IconHeart size={15} />, 'Disukai'], ['saved', <IconBookmark size={15} />, 'Disimpan']].map(([k, icon, label]) => (
          <button key={k} onClick={() => setPt(k as ProfileTab)} className={'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ' + (pt === k ? 'bg-brand/8 text-brand-dark' : 'text-neutral-400')}>{icon}<span className="hidden sm:inline">{label}</span></button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">{sets[pt].map((p) => { const cover = p.photos?.find(isImg); return (<button key={p.id} onClick={() => onOpen(p.id)} className="group relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>{cover && <img src={cover} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />}<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" /><span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span></button>) })}</div>
      {sets[pt].length === 0 && <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Belum ada data.</div>}
    </div>
  )
}

function PublicProfile({ email, onBack, onOpen }: { email: string; onBack: () => void; onOpen: (id: string) => void }) {
  const store = useStore(); const { state } = store; const me = state.account?.email ?? ''
  const posts = state.posts.filter((p) => p.authorEmail === email && !p.archived && (!p.locked || p.authorEmail === me))
  const first = state.posts.find((p) => p.authorEmail === email); const prof = state.profiles[email]
  const name = prof?.name ?? first?.authorName ?? email; const role = first?.role ?? 'pasien'
  const color = first?.mediaColor ?? COLORS[Math.abs(hash(email)) % COLORS.length]
  const following = state.follows.includes(email)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={onBack} className="text-sm font-semibold text-neutral-400">← Kembali</button>
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10 60%, transparent)` }} />
        <div className="relative -mt-10 px-5 pb-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)`, boxShadow: `0 8px 20px ${color}44` }}>{prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}</span>
          <h2 className="mt-2 text-lg font-black">{name}</h2><p className="text-xs text-neutral-500">{roleLabel[role]}</p>
          {email !== me && <button onClick={() => store.toggleFollow(email)} className="mt-4 rounded-xl px-6 py-2.5 text-sm font-bold transition-all active:scale-[0.97]" style={following ? { background: 'rgba(0,0,0,0.04)', color: '#737373', border: '1px solid rgba(0,0,0,0.06)' } : { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', color: '#fff', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>{following ? 'Mengikuti' : 'Ikuti'}</button>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">{posts.map((p) => { const cover = p.photos?.find(isImg); return (<button key={p.id} onClick={() => onOpen(p.id)} className="group relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02]" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>{cover && <img src={cover} loading="lazy" className="absolute inset-0 h-full w-full object-cover" alt="" />}<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" /><span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span></button>) })}</div>
    </div>
  )
}

function EditProfileModal({ current, onClose, onSave }: { current: { name: string; bio: string; avatar?: string }; onClose: () => void; onSave: (d: ProfileEdit) => void }) {
  const [name, setName] = useState(current.name); const [bio, setBio] = useState(current.bio); const [avatar, setAvatar] = useState<string | undefined>(current.avatar); const [busy, setBusy] = useState(false)
  async function pick(file?: File) { if (!file) return; setBusy(true); setAvatar(await uploadOrLocal(file)); setBusy(false) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Edit Profil</h3>
        <div className="mt-4 flex flex-col items-center"><span className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white" style={{ background: 'linear-gradient(145deg, #00BF63, #0B7A4B)' }}>{avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}</span><label className="mt-2 cursor-pointer text-sm font-semibold hover:underline" style={{ color: '#0B7A4B' }}>{busy ? 'Mengunggah…' : 'Ubah foto'}<input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} /></label></div>
        <div className="mt-4 space-y-3"><Field label="Nama"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Bio"><textarea className={`${inputClass} min-h-[70px]`} value={bio} onChange={(e) => setBio(e.target.value)} /></Field></div>
        <div className="mt-5 flex gap-2"><button onClick={onClose} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-50">Batal</button><button onClick={() => onSave({ name: name.trim() || current.name, bio: bio.trim(), avatar })} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Simpan</button></div>
      </div>
    </div>
  )
}

function useProfiles(_me: string): Profile[] {
  const { state } = useStore()
  return useMemo(() => {
    const map = new Map<string, Profile>()
    for (const p of state.posts) { const cur = map.get(p.authorEmail); if (cur) cur.posts++; else map.set(p.authorEmail, { email: p.authorEmail, name: p.authorName, role: p.role, color: p.mediaColor, posts: 1 }) }
    return [...map.values()]
  }, [state.posts])
}

/* ═══════════════════════════════════════════════════════
   MAIN FEED EXPORT
   ═══════════════════════════════════════════════════════ */
export function Feed() {
  const store = useStore()
  const { state, account } = store
  const [tab, setTab] = useState<Tab>('home')
  const [compose, setCompose] = useState(false)
  const [viewProfile, setViewProfile] = useState<string | null>(null)
  const [viewPost, setViewPost] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())
  const [subPrice, setSubPrice] = useState(100)
  const me = account?.email ?? 'me@panaceamed.id'

  useEffect(() => {
    if (!backendEnabled) return
    api.creatorSubs().then((r: { authors: string[]; price: number }) => { setSubscribed(new Set(r.authors.map((a) => a.toLowerCase()))); setSubPrice(r.price) }).catch(() => {})
  }, [])

  async function subscribe(email: string): Promise<boolean> {
    try { const r: { balance: number } = await api.creatorSubscribe(email); setSubscribed((s) => new Set(s).add(email.toLowerCase())); store.syncWalletBalance(r.balance); return true } catch { return false }
  }

  function onCreate(p: SocialPost) {
    store.addPost(p)
    if (backendEnabled) api.createPost({ activity: p.activity, caption: p.caption, kind: p.kind, mediaColor: p.mediaColor }).catch(() => {})
    setCompose(false)
  }

  const activePost = viewPost ? state.posts.find((p) => p.id === viewPost) : null

  // Longevity share handler for compose modal
  function handleShareLongevity() {
    const todayStr = new Date().toISOString().slice(0, 10)
    const wt = (state.wellness?.[todayStr] ?? {}) as Record<string, unknown>
    const todaysFoods = state.foods.filter((f) => f.date === todayStr)
    function clampNum(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }
    const mainMeals = Math.max(0, todaysFoods.length)
    const exerciseMin = wt.exerciseMin as number || 0
    const hydrationL = (wt.waterMl as number || 0) / 1000
    const sleepHr = wt.sleepHr as number || 0
    const meals = clampNum(100 - Math.abs(mainMeals - 3) * 18)
    const exercise = clampNum(60 + Math.min(40, (exerciseMin / 30) * 40))
    const hydration = clampNum(hydrationL >= 2 && hydrationL <= 3.5 ? 100 : 100 - Math.abs(hydrationL - 2.5) * 28)
    const sleep = clampNum(sleepHr >= 7 && sleepHr <= 9 ? 100 : 100 - Math.abs(sleepHr - 8) * 16)
    const sun = 40
    const score = clampNum(meals * 0.2 + exercise * 0.25 + hydration * 0.15 + sleep * 0.25 + sun * 0.15)
    const hasAny = todaysFoods.length > 0 || sleepHr > 0 || (wt.waterMl as number || 0) > 0 || exerciseMin > 0
    if (!hasAny) return
    addPost({
      id: uid(), authorEmail: account?.email ?? me, authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien',
      postType: 'kebiasaan', kind: 'text', activity: 'Longevity harian',
      caption: `Nilai Longevity: ${score}/100 🌱\n${score >= 80 ? 'Sangat baik' : score >= 60 ? 'Cukup baik' : 'Perlu perbaikan'}\n\n🍽️ Makan ${meals} · 🏃 Olahraga ${exercise} · 💧 Hidrasi ${hydration} · 🌙 Tidur ${sleep}\n\n#PerjalananSehat #Longevity`,
      mediaColor: '#0B7A4B', likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    })
  }

  function handleShareGps() { /* Open GPS tracker instead */ }

  function addPost(p: SocialPost) {
    store.addPost(p)
    if (backendEnabled) api.createPost({ activity: p.activity, caption: p.caption, kind: p.kind, mediaColor: p.mediaColor }).catch(() => {})
  }

  return (
    <SubCtx.Provider value={{ subscribed, price: subPrice, subscribe }}>
      <div className="relative pb-24">
        <div className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-center gap-1 border-b px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderColor: 'rgba(0,0,0,0.04)' }}>
          <TabBtn icon={<IconHome size={17} />} label="Home" active={tab === 'home'} onClick={() => { setTab('home'); setViewProfile(null) }} />
          <TabBtn icon={<IconUsers size={17} />} label="Friends" active={tab === 'friends'} onClick={() => { setTab('friends'); setViewProfile(null) }} />
          <TabBtn icon={<IconSearch size={17} />} label="Search" active={tab === 'search'} onClick={() => { setTab('search'); setViewProfile(null) }} />
          <TabBtn icon={<IconUser size={17} />} label="Profil" active={tab === 'profile'} onClick={() => { setTab('profile'); setViewProfile(null) }} />
        </div>

        {viewProfile ? (
          <PublicProfile email={viewProfile} onBack={() => setViewProfile(null)} onOpen={(id) => setViewPost(id)} />
        ) : (
          <>
            {tab === 'home' && <HomeFeed me={me} onProfile={setViewProfile} />}
            {tab === 'friends' && <FriendsView me={me} onProfile={setViewProfile} />}
            {tab === 'search' && <SearchView me={me} onProfile={setViewProfile} onOpen={setViewPost} />}
            {tab === 'profile' && <ProfileView me={me} name={account?.name ?? 'Saya'} role={account?.role ?? 'pasien'} onOpen={setViewPost} />}
          </>
        )}

        {/* Main + Button */}
        <button onClick={() => setCompose(true)} className="fixed bottom-6 left-6 z-30 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 lg:left-[17rem]" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 8px 28px rgba(0,191,99,0.35)' }} title="Buat postingan, share longevity, atau share GPS">
          <IconPlus size={26} />
        </button>

        {compose && <ComposeModal onClose={() => setCompose(false)} onPost={onCreate} onShareLongevity={handleShareLongevity} onShareGps={handleShareGps} authorEmail={me} authorName={account?.name ?? 'Saya'} role={account?.role ?? 'pasien'} />}

        {activePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setViewPost(null)}>
            <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}><PostCard post={activePost} me={me} store={store} onProfile={(e) => { setViewPost(null); setViewProfile(e) }} /></div>
          </div>
        )}
      </div>
    </SubCtx.Provider>
  )
}
