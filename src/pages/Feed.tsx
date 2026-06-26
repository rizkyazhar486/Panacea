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
import type { SocialPost, PostType, Role, ProfileEdit, Story } from '../lib/types'

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
   CONSTANTS & CONTEXT
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

/** Probe a local video file's duration (seconds) before upload, so we can enforce the 3-minute cap. */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { const d = v.duration; URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : 0) }
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    v.src = url
  })
}

const SONGS = ['Tanpa Musik', '🎵 Morning Vibes', '🎵 Upbeat Workout', '🎵 Chill Lo-fi', '🎵 Acoustic Calm', '🎵 Energetic Pop']
const MAX_VIDEO_SEC = 180 // 3 minutes

/* ═══════════════════════════════════════════════════════
   CALCULATIONS: BMI, BMR, VO2Max, HIIT Indicator
   ═══════════════════════════════════════════════════════ */
function calcBMI(w: number, h: number) { return w / ((h / 100) ** 2) }
function calcBMR(w: number, h: number, age: number, g: 'M' | 'F') {
  return g === 'M' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161
}
function calcVO2MaxEst(hrRest: number, age: number, g: 'M' | 'F') {
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

interface SharedGpsData {
  sport: GpsSportMode; dist: number; dur: number; speed: number;
  pace: string; kcal: number; hr: number; acceleration: number;
  vo2Max: number; hiit: ReturnType<typeof hiitIndicator>
}

function GpsTrackerCard({ onShareToFeed }: { onShareToFeed: (data: SharedGpsData) => void }) {
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

  // Load body data safely from localStorage
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
        return [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined, spd: pos.coords.speed ?? undefined }]
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

            {sport.targetDist && (
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
   STORIES — Instagram-style 24h ephemeral stories with a
   full-screen viewer and live/direct comment replies.
   ═══════════════════════════════════════════════════════ */
const STORY_TTL_MS = 24 * 60 * 60 * 1000

interface StoryGroup { authorEmail: string; authorName: string; mediaColor: string; stories: Story[] }

function StoryViewer({ group, onClose, onComment }: {
  group: StoryGroup; onClose: () => void; onComment: (storyId: string, text: string) => void
}) {
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const story = group.stories[idx]
  const DURATION = story.video ? 15000 : 5000

  useEffect(() => {
    const t = setTimeout(() => {
      if (idx < group.stories.length - 1) setIdx((i) => i + 1)
      else onClose()
    }, DURATION)
    return () => clearTimeout(t)
  }, [idx, DURATION, group.stories.length, onClose])

  function send() {
    const text = draft.trim()
    if (!text) return
    onComment(story.id, text)
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative flex h-full w-full max-w-md flex-col">
        {/* Progress segments */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full bg-white" style={{ width: i < idx ? '100%' : i === idx ? '100%' : '0%', transition: i === idx ? `width ${DURATION}ms linear` : undefined }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 top-5 z-10 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: group.mediaColor }}>{initials(group.authorName)}</div>
            <div className="text-xs font-bold text-white drop-shadow">{group.authorName}</div>
            <div className="text-[10px] text-white/70">{timeAgo(story.at)}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white"><IconX size={16} /></button>
        </div>

        {/* Tap zones to navigate */}
        <button aria-label="Sebelumnya" className="absolute left-0 top-0 z-[5] h-full w-1/3" onClick={() => setIdx((i) => Math.max(0, i - 1))} />
        <button aria-label="Selanjutnya" className="absolute right-0 top-0 z-[5] h-full w-1/3" onClick={() => (idx < group.stories.length - 1 ? setIdx((i) => i + 1) : onClose())} />

        {/* Media */}
        <div className="flex flex-1 items-center justify-center overflow-hidden" style={{ background: story.image || story.video ? '#000' : group.mediaColor }}>
          {story.video
            ? <video src={story.video} className="h-full w-full object-contain" autoPlay muted playsInline />
            : story.image
              ? <img src={story.image} className="h-full w-full object-contain" alt="" />
              : <div className="px-8 text-center text-lg font-bold text-white">{story.caption}</div>}
        </div>
        {story.caption && (story.image || story.video) && (
          <div className="absolute bottom-20 left-0 right-0 px-4 text-center text-sm font-semibold text-white drop-shadow">{story.caption}</div>
        )}

        {/* Live comment feed (most recent on top, IG-style direct reply) */}
        {(story.comments?.length ?? 0) > 0 && (
          <div className="absolute bottom-16 left-0 right-0 z-10 max-h-32 space-y-1.5 overflow-y-auto px-4">
            {story.comments!.slice(-4).map((c) => (
              <div key={c.id} className="inline-block w-full rounded-2xl bg-black/35 px-3 py-1.5 text-[11px] text-white">
                <b>{c.authorName}</b> {c.text}
              </div>
            ))}
          </div>
        )}

        {/* Direct reply input */}
        <div className="z-10 flex items-center gap-2 p-3" onClick={(e) => e.stopPropagation()}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            placeholder="Balas langsung..." className="flex-1 rounded-full border border-white/30 bg-black/30 px-4 py-2.5 text-xs text-white placeholder:text-white/50 focus:outline-none" />
          <button onClick={send} disabled={!draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition active:scale-90 disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            <IconSend size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StoriesBar({ stories, viewerEmail, viewerName, onAddStory }: {
  stories: Story[]; viewerEmail: string; viewerName: string; onAddStory: (s: Story) => void
}) {
  const [openGroup, setOpenGroup] = useState<StoryGroup | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addStoryComment } = useStore()

  const active = useMemo(() => stories.filter((s) => Date.now() - new Date(s.at).getTime() < STORY_TTL_MS), [stories])
  const groups = useMemo(() => {
    const byAuthor = new Map<string, StoryGroup>()
    for (const s of active) {
      const g = byAuthor.get(s.authorEmail)
      if (g) g.stories.push(s)
      else byAuthor.set(s.authorEmail, { authorEmail: s.authorEmail, authorName: s.authorName, mediaColor: s.mediaColor, stories: [s] })
    }
    for (const g of byAuthor.values()) g.stories.reverse() // oldest-first within a group
    return Array.from(byAuthor.values())
  }, [active])

  async function pickStory(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      if (file.type.startsWith('video/')) {
        const dur = await getVideoDuration(file)
        if (dur > MAX_VIDEO_SEC) { alert(`Video story maksimal ${MAX_VIDEO_SEC / 60} menit.`); return }
        const url = await uploadOrLocal(file)
        onAddStory({ id: uid(), authorEmail: viewerEmail, authorName: viewerName, mediaColor: COLORS[Math.floor(Math.random() * COLORS.length)], video: url, at: new Date().toISOString(), comments: [] })
      } else {
        const url = await uploadOrLocal(file)
        onAddStory({ id: uid(), authorEmail: viewerEmail, authorName: viewerName, mediaColor: COLORS[Math.floor(Math.random() * COLORS.length)], image: url, at: new Date().toISOString(), comments: [] })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex shrink-0 flex-col items-center gap-1">
        <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand-50 text-brand-dark">
          <IconPlus size={20} />
        </span>
        <span className="text-[10px] font-semibold text-neutral-500">{busy ? 'Mengunggah…' : 'Story Anda'}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickStory(e.target.files?.[0])} />
      {groups.map((g) => (
        <button key={g.authorEmail} onClick={() => setOpenGroup(g)} className="flex shrink-0 flex-col items-center gap-1">
          <span className="grid h-14 w-14 place-items-center rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #00BF63, #f59e0b, #FF3131)' }}>
            <span className="grid h-full w-full place-items-center rounded-full border-2 border-white text-sm font-bold text-white" style={{ backgroundColor: g.mediaColor }}>
              {initials(g.authorName)}
            </span>
          </span>
          <span className="max-w-[60px] truncate text-[10px] font-semibold text-neutral-500">{g.authorName.split(' ')[0]}</span>
        </button>
      ))}
      {openGroup && (
        <StoryViewer
          group={openGroup}
          onClose={() => setOpenGroup(null)}
          onComment={(storyId, text) => addStoryComment(storyId, text, viewerName)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   COMPOSE MODAL (Penyempurnaan Potongan Kode Akhir)
   ═══════════════════════════════════════════════════════ */
function ComposeModal({ onClose, onPost, onShareGps, authorEmail, authorName, role }: {
  onClose: () => void; onPost: (p: SocialPost) => void; onShareGps: () => void
  authorEmail: string; authorName: string; role: Role
}) {
  const [caption, setCaption] = useState('')
  const [activity, setActivity] = useState('')
  const [postType, setPostType] = useState<PostType>('aktivitas')
  const [photos, setPhotos] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoSec, setVideoSec] = useState(0)
  const [song, setSong] = useState(SONGS[0])
  const [busy, setBusy] = useState(false)
  const [videoErr, setVideoErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

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

  async function pickVideo(file?: File) {
    if (!file) return
    setVideoErr('')
    const dur = await getVideoDuration(file)
    if (dur > MAX_VIDEO_SEC) { setVideoErr(`Video maksimal ${MAX_VIDEO_SEC / 60} menit (durasi terdeteksi ${Math.round(dur)} detik).`); return }
    setBusy(true)
    const url = await uploadOrLocal(file)
    setVideoUrl(url); setVideoSec(Math.round(dur))
    setBusy(false)
  }

  function submit() {
    if (!caption.trim() && photos.length === 0 && !videoUrl) return
    onPost({
      id: uid(), authorEmail, authorName, role,
      postType, kind: videoUrl ? 'video' : photos.length > 0 ? 'image' : 'text',
      activity: activity || 'Postingan', caption: caption.trim(),
      mediaColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      photos, videoUrl: videoUrl ?? undefined, videoSec: videoUrl ? videoSec : undefined,
      audio: song !== SONGS[0] ? song : undefined,
      likes: 0, comments: 0, reposts: 0,
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

        {/* Video preview */}
        {videoUrl && (
          <div className="px-5 pb-3">
            <div className="relative w-full overflow-hidden rounded-xl bg-black">
              <video src={videoUrl} className="max-h-56 w-full object-contain" controls />
              <button onClick={() => { setVideoUrl(null); setVideoSec(0) }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"><IconX size={12} /></button>
            </div>
            <p className="mt-1 text-[10px] text-neutral-400">Durasi: {videoSec}s / {MAX_VIDEO_SEC}s maks.</p>
          </div>
        )}
        {videoErr && <p className="px-5 pb-2 text-[11px] font-medium text-accent">{videoErr}</p>}

        {/* Type & Activity */}
        <div className="px-5 pb-3 flex gap-2">
          <select className={inputClass + ' flex-1'} value={postType} onChange={e => setPostType(e.target.value as PostType)}>
            <option value="aktivitas">🏃 Aktivitas</option>
            <option value="kebiasaan">🌿 Kebiasaan</option>
            <option value="artikel">📄 Artikel</option>
            <option value="resep">🍳 Resep</option>
          </select>
          <input className={inputClass + ' flex-1'} type="text" placeholder="Nama Aktivitas/Judul" value={activity} onChange={e => setActivity(e.target.value)} />
        </div>

        {/* Input Area */}
        <div className="px-5 pb-5 space-y-4">
          <textarea className="w-full h-28 p-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand resize-none" placeholder="Tulis deskripsi atau insight kesehatanmu di sini..." value={caption} onChange={e => setCaption(e.target.value)} />
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={!!videoUrl} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition disabled:opacity-40">
              📸 {busy ? 'Mengunggah...' : 'Foto'}
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => pickFiles(e.target.files)} />

            <button onClick={() => videoRef.current?.click()} disabled={photos.length > 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition disabled:opacity-40">
              <IconVideo size={14} /> {busy ? 'Mengunggah...' : 'Video (maks 3 mnt)'}
            </button>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => pickVideo(e.target.files?.[0])} />

            <select className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-600 focus:outline-none" value={song} onChange={e => setSong(e.target.value)}>
              {SONGS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex justify-end">
            <button onClick={submit} disabled={busy || (!caption.trim() && photos.length === 0 && !videoUrl)} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand transition disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
              Kirim Postingan
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   POST CARD — like / comment / share-as-logo (Feed "new face")
   ═══════════════════════════════════════════════════════ */
function PostCard({ post, viewerEmail, viewerName }: { post: SocialPost; viewerEmail: string; viewerName: string }) {
  const { state, toggleLike, updatePost, toggleFollow, subscribeAuthor } = useStore()
  const [showComments, setShowComments] = useState(false)
  const [draft, setDraft] = useState('')
  const comments = post.commentList ?? []
  const isOwnPost = post.authorEmail === viewerEmail
  const following = state.follows.includes(post.authorEmail)
  const subPrice = state.authorSubPrices[post.authorEmail] ?? 0
  const subExpires = state.authorSubs[post.authorEmail]
  const subscribed = !!subExpires && new Date(subExpires) > new Date()

  function subscribeNow() {
    const r = subscribeAuthor(post.authorEmail)
    if (!r.ok) alert(r.reason ?? 'Gagal berlangganan.')
  }

  function addComment() {
    const text = draft.trim()
    if (!text) return
    const next = [...comments, { id: uid(), authorName: viewerName, text, at: new Date().toISOString() }]
    updatePost(post.id, { commentList: next, comments: next.length })
    setDraft('')
  }

  // Share-as-logo: native Web Share (social media) with clipboard fallback.
  async function share() {
    const text = `${post.activity} — ${post.caption}`
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://panaceamed.id'
    const payload = { title: 'Panaceamed.id', text, url }
    try {
      if (navigator.share) { await navigator.share(payload); return }
      await navigator.clipboard.writeText(`${text}\n${url}`)
      alert('Tautan postingan disalin — siap dibagikan ke media sosial!')
    } catch { /* user cancelled share sheet */ }
  }

  const photos = post.photos ?? []

  return (
    <Card className="space-y-3 overflow-hidden">
      {/* Header + share logo (top-right) */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: post.mediaColor || '#00BF63' }}>
            {initials(post.authorName)}
          </div>
          <div>
            <div className="text-xs font-black flex items-center gap-1">
              {post.authorName}
              <span className="text-[9px] font-medium bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-md">{roleLabel[post.role]}</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{timeAgo(post.at)} · <span className="font-semibold text-brand-dark capitalize">{post.postType}</span></div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isOwnPost && (
            <button onClick={() => toggleFollow(post.authorEmail)}
              className={'rounded-full px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand/10 text-brand-dark')}>
              {following ? 'Mengikuti' : '+ Ikuti'}
            </button>
          )}
          {!isOwnPost && subPrice > 0 && (
            <button onClick={subscribeNow} disabled={subscribed}
              className={'rounded-full px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (subscribed ? 'bg-amber-50 text-amber-600' : 'bg-ink text-white')}>
              {subscribed ? '✓ Berlangganan' : `Subscribe`}
            </button>
          )}
          {/* Share button rendered as a logo only (no text) */}
          <button onClick={share} aria-label="Bagikan ke media sosial" title="Bagikan"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition active:scale-90"
            style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 12px rgba(0,191,99,0.32)' }}>
            <IconShare2 size={15} />
          </button>
        </div>
      </div>

      <div className="border-l-2 pl-3 py-0.5 text-xs text-neutral-700 font-medium" style={{ borderColor: post.mediaColor }}>{post.activity}</div>
      <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{post.caption}</p>

      {post.videoUrl ? (
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video src={post.videoUrl} controls className="max-h-80 w-full object-contain" />
          {post.videoSec ? (
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              {Math.floor(post.videoSec / 60)}:{String(post.videoSec % 60).padStart(2, '0')}
            </span>
          ) : null}
        </div>
      ) : photos.length > 0 && (
        <div className={'grid gap-1.5 rounded-xl overflow-hidden ' + (photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {photos.map((img, idx) => (
            isImg(img)
              ? <img key={idx} src={img} alt="" className="w-full h-40 object-cover" />
              : <div key={idx} className="w-full h-40" style={{ background: img }} />
          ))}
        </div>
      )}

      {post.audio && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
          🎵 {post.audio}
        </div>
      )}

      {/* Action bar: like · comment · share */}
      <div className="flex items-center gap-1 border-t border-neutral-100 pt-2 -mb-1">
        <button onClick={() => toggleLike(post.id)} className={'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ' + (post.likedByMe ? 'text-rose-500 bg-rose-50' : 'text-neutral-500 hover:bg-neutral-50')}>
          <ColoredIcon color={post.likedByMe ? '#f43f5e' : '#a3a3a3'}><IconHeart size={16} /></ColoredIcon>
          {post.likes > 0 ? post.likes : 'Suka'}
        </button>
        <button onClick={() => setShowComments(v => !v)} className={'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ' + (showComments ? 'text-brand-dark bg-brand/10' : 'text-neutral-500 hover:bg-neutral-50')}>
          <IconComment size={16} /> {comments.length > 0 ? comments.length : 'Komentar'}
        </button>
        <button onClick={share} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition active:scale-95 ml-auto">
          <IconShare2 size={15} /> Bagikan
        </button>
      </div>

      {/* Comment thread */}
      {showComments && (
        <div className="space-y-2.5 border-t border-neutral-100 pt-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand-dark">{initials(c.authorName)}</div>
              <div className="flex-1 rounded-2xl bg-neutral-50 px-3 py-2">
                <div className="text-[11px] font-bold text-ink">{c.authorName} <span className="ml-1 font-normal text-neutral-400">{timeAgo(c.at)}</span></div>
                <div className="text-xs text-neutral-600">{c.text}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment() }}
              placeholder="Tulis komentar..." className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs focus:outline-none focus:border-brand" />
            <button onClick={addComment} disabled={!draft.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition active:scale-90 disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
              <IconSend size={15} />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN INTEGRATION WRAPPER COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function SportsSocialFeed() {
  const { state, account, addPost, addStory } = useStore()
  const posts = state.posts
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  // Default fallback user jika context/store kosong
  const currentUser = useMemo(() => ({
    email: account?.email || 'user@fitlife.id',
    name: account?.name || 'Ksatria Bugar',
    role: (account?.role as Role) || 'pasien'
  }), [account])

  // Handler memproses postingan standar dari modal → store global (persisten & terbagi)
  const handleAddNewPost = (newPost: SocialPost) => {
    addPost(newPost)
    setIsComposeOpen(false)
  }

  // Handler memproses share data aktivitas tracker langsung ke feed sosial
  const handleShareGpsToFeed = (gpsData: SharedGpsData) => {
    const generatedCaption = `Saya baru saja menyelesaikan aktivitas ${gpsData.sport.emoji} ${gpsData.sport.name} sejauh ${fmtDist(gpsData.dist)} dengan durasi ${fmtD(gpsData.dur)}. Total pembakaran ${gpsData.kcal} kkal dengan rata-rata zona intensitas ${gpsData.hiit.zone}! 💪`
    addPost({
      id: uid(),
      authorEmail: currentUser.email,
      authorName: currentUser.name,
      role: currentUser.role,
      postType: 'aktivitas',
      kind: 'text',
      activity: `${gpsData.sport.emoji} ${gpsData.sport.name}`,
      caption: generatedCaption,
      mediaColor: '#00BF63',
      photos: [],
      likes: 0, comments: 0, commentList: [], reposts: 0,
      at: new Date().toISOString(),
    })
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Stories (Instagram-style, 24h) */}
      <StoriesBar
        stories={state.stories}
        viewerEmail={currentUser.email}
        viewerName={currentUser.name}
        onAddStory={addStory}
      />

      {/* Widget Atas: GPS Tracking Engine */}
      <GpsTrackerCard onShareToFeed={handleShareGpsToFeed} />

      {/* Trigger Pembuat Postingan Sosial */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        <span className="text-sm font-semibold text-neutral-500">Punya cerita bugar hari ini?</span>
        <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          <IconPlus size={14} /> Buat Post
        </button>
      </div>

      {/* Komponen Modal Pembuat Postingan */}
      {isComposeOpen && (
        <ComposeModal
          onClose={() => setIsComposeOpen(false)}
          onPost={handleAddNewPost}
          onShareGps={() => alert('Gunakan panel GPS Tracker di atas untuk merekam rute aktif!')}
          authorEmail={currentUser.email}
          authorName={currentUser.name}
          role={currentUser.role}
        />
      )}

      {/* RENDER FEED SOSIAL */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 px-1">Feed Komunitas</h4>
        {posts.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 text-xs">
            Belum ada kiriman. Selesaikan pelacakan rute GPS kamu atau ketuk buat postingan!
          </div>
        ) : (
          posts.filter(p => !p.archived).map(p => (
            <PostCard key={p.id} post={p} viewerEmail={currentUser.email} viewerName={currentUser.name} />
          ))
        )}
      </div>
    </div>
  )
}
