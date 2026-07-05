import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback, lazy, Suspense } from 'react'

// Real map (Leaflet + OpenStreetMap, free) — lazy so the heavy lib loads only
// when the GPS tracker is opened.
const RouteMap = lazy(() => import('../components/RouteMap'))
import { useStore, uid } from '../lib/store'
import { Card, Field, inputClass } from '../components/ui'
import {
  IconHome, IconUsers, IconSearch, IconUser, IconPlus, IconRun, IconDrop, IconFlame, IconLeaf,
  IconArticle, IconComment, IconMoon, IconVideo, IconHeart, IconRepost, IconBookmark, IconLock,
  IconShare2, IconSend, IconX, IconMapPin, IconNavigation, IconTimer, IconGauge, IconActivity,
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { uploadOrLocal } from '../lib/upload'
import type { SocialPost, PostType, Role, ProfileEdit, Story, MoodEntry, HealthGoal } from '../lib/types'

/* ═══════════════════════════════════════════════════════
   GPS SPORTS MODES
   ═══════════════════════════════════════════════════════ */
interface GpsSportMode {
  id: string; name: string; emoji: string; met: number; type: 'walk' | 'run' | 'cycle' | 'marathon' | 'half_marathon' | 'swim' | 'triathlon'
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
  { id: 'swim', name: 'Renang', emoji: '🏊', met: 8.3, type: 'swim', hiit: false },
  { id: 'triathlon', name: 'Triathlon', emoji: '🥇', met: 10.0, type: 'triathlon', hiit: false },
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

/* ── Music picker: real song search via the public iTunes Search API (free, no
   key, CORS-enabled) with a 30s preview, plus Spotify / Apple Music deep
   links. The chosen "Song — Artist" string is stored in post.audio. */
interface FoundSong { id: number; title: string; artist: string; artwork: string; preview: string }
function MusicPicker({ song, setSong }: { song: string; setSong: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<FoundSong[]>([])
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function search() {
    const term = q.trim()
    if (!term) return
    setBusy(true)
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=8`)
      const d = await r.json()
      setResults((d.results ?? []).map((x: Record<string, unknown>) => ({
        id: x.trackId as number,
        title: x.trackName as string,
        artist: x.artistName as string,
        artwork: x.artworkUrl60 as string,
        preview: x.previewUrl as string,
      })))
    } catch { setResults([]) }
    setBusy(false)
  }
  function preview(s: FoundSong) {
    if (playing === s.id) { audioRef.current?.pause(); setPlaying(null); return }
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = s.preview
    audioRef.current.play().catch(() => {})
    audioRef.current.onended = () => setPlaying(null)
    setPlaying(s.id)
  }
  function choose(s: FoundSong) {
    setSong(`${s.title} — ${s.artist}`)
    audioRef.current?.pause(); setPlaying(null)
    setOpen(false)
  }
  useEffect(() => () => { audioRef.current?.pause() }, [])

  return (
    <>
      <button onClick={() => setOpen(true)} className="max-w-[180px] truncate rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-100">
        {song === SONGS[0] ? '🎵 Pilih Musik' : `🎵 ${song}`}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-200" />
            <div className="text-sm font-black">Pilih Musik</div>

            {/* Real song search */}
            <div className="mt-3 flex gap-2">
              <input className={inputClass} placeholder="Cari lagu / artis…" value={q}
                onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
              <button onClick={search} disabled={busy} className="shrink-0 rounded-xl bg-brand px-4 text-xs font-bold text-white disabled:opacity-50">
                {busy ? '…' : 'Cari'}
              </button>
            </div>
            {q.trim() && (
              <div className="mt-2 flex gap-2">
                <a href={`https://open.spotify.com/search/${encodeURIComponent(q.trim())}`} target="_blank" rel="noreferrer"
                  className="rounded-full bg-[#1DB954] px-3 py-1.5 text-[10px] font-bold text-white">Buka di Spotify</a>
                <a href={`https://music.apple.com/search?term=${encodeURIComponent(q.trim())}`} target="_blank" rel="noreferrer"
                  className="rounded-full bg-neutral-900 px-3 py-1.5 text-[10px] font-bold text-white"> Apple Music</a>
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              {results.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-neutral-100 p-2">
                  <img src={s.artwork} alt="" className="h-10 w-10 rounded-lg" />
                  <button onClick={() => choose(s)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-bold">{s.title}</div>
                    <div className="truncate text-[10px] text-neutral-400">{s.artist}</div>
                  </button>
                  {s.preview && (
                    <button onClick={() => preview(s)} aria-label="Pratinjau 30 detik"
                      className={'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs ' + (playing === s.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
                      {playing === s.id ? '⏸' : '▶'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick moods + none */}
            <div className="mt-3 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Suasana cepat</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SONGS.map((s) => (
                <button key={s} onClick={() => { setSong(s); setOpen(false) }}
                  className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (song === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
              Pencarian & pratinjau 30 dtk via katalog iTunes (gratis). Pemutaran penuh membuka aplikasi Spotify / Apple Music Anda.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
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
interface GpsPoint { lat: number; lng: number; t: number; hr?: number; spd?: number; alt?: number }
// Planned-route waypoint — real map coordinates (clicked on the Leaflet map).
interface Waypoint { lat: number; lng: number }

function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; const dr = Math.PI / 180
  const dLa = (lat2 - lat1) * dr; const dLo = (lon2 - lon1) * dr
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(lat1 * dr) * Math.cos(lat2 * dr) * Math.sin(dLo / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function totalDist(pts: { lat: number; lng: number }[]) { let d = 0; for (let i = 1; i < pts.length; i++) d += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng); return d }
function fmtD(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sc = Math.floor(s % 60); return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '0') : m + ':' + String(sc).padStart(2, '0') }
function fmtDist(m: number) { return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m' }
function fmtPace(s: number, m: number) { if (m < 10) return '--:--/km'; const pk = s / 60 / (m / 1000); const pm = Math.floor(pk); const ps = Math.round((pk - pm) * 60); return pm + ':' + String(ps).padStart(2, '0') + '/km' }
// Elevation gain from GPS altitude fixes — filters <1m noise typical of phone GPS.
function elevGain(pts: GpsPoint[]): number {
  let gain = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].alt, b = pts[i].alt
    if (a == null || b == null) continue
    const d = b - a
    if (d > 1) gain += d
  }
  return gain
}
// Rough terrain classification from elevation gain per km — used since a free
// GPS route doesn't carry a terrain database.
function terrainLabel(gainM: number, distKm: number): string {
  if (distKm < 0.15) return '—'
  const perKm = gainM / distKm
  if (perKm < 8) return 'Datar'
  if (perKm < 20) return 'Bergelombang'
  if (perKm < 45) return 'Berbukit'
  return 'Pegunungan'
}
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
  elevGainM: number; terrain: string
}

function GpsTrackerCard({ onShareToFeed }: { onShareToFeed: (data: SharedGpsData) => void }) {
  const [mode, setMode] = useState<TrackMode>('idle')
  const [sport, setSport] = useState<GpsSportMode>(GPS_SPORTS[0])
  const [pts, setPts] = useState<GpsPoint[]>([])
  const [plan, setPlan] = useState<Waypoint[]>([])
  const [dur, setDur] = useState(0)
  const [hr, setHr] = useState(0)
  const [gpsErr, setGpsErr] = useState('')
  const [open, setOpen] = useState(false) // collapsed by default — logo only, expand on tap
  const wRef = useRef<number | null>(null)
  const tRef = useRef<number | null>(null)
  const sRef = useRef(0)

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
  const hiit = hiitIndicator(sport.met, hrMax, hr || 60, hr)
  const vo2Est = hr > 0 ? calcVO2MaxRockport(dist / 1000, dur / 60, hr, age, gender as 'M' | 'F') : 0
  const elevGainM = elevGain(pts)
  const terrain = terrainLabel(elevGainM, dist / 1000)
  const planDist = totalDist(plan)
  function startTrack() {
    setGpsErr(''); setMode('tracking'); setPts([]); setDur(0); sRef.current = Date.now()
    tRef.current = window.setInterval(() => setDur((Date.now() - sRef.current) / 1000), 1000)
    if (!navigator.geolocation) { setGpsErr('GPS tidak didukung browser.'); return }
    wRef.current = navigator.geolocation.watchPosition(
      pos => setPts(p => {
        return [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined, spd: pos.coords.speed ?? undefined, alt: pos.coords.altitude ?? undefined }]
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
      pos => setPts(p => [...p, { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now(), hr: hr || undefined, spd: pos.coords.speed ?? undefined, alt: pos.coords.altitude ?? undefined }]),
      () => {}, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    )
  }
  function stop() { setMode('done'); if (wRef.current) navigator.geolocation.clearWatch(wRef.current); if (tRef.current) clearInterval(tRef.current) }
  function reset() { setMode('idle'); setPts([]); setPlan([]); setDur(0); setHr(0); setGpsErr('') }
  function shareToFeed() {
    onShareToFeed({ sport, dist, dur, speed, pace: fmtPace(dur, dist), kcal, hr, acceleration, vo2Max: vo2Est, hiit, elevGainM, terrain })
  }

  const progressPct = sport.targetDist ? Math.min(100, (dist / 1000 / sport.targetDist) * 100) : 0

  // Collapsed state — show only a compact logo pill so the dashboard stays short.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka GPS Tracker untuk melacak olahraga"
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-xl">📍</span>
        <span className="flex-1 text-left text-sm font-bold text-ink">GPS Tracker</span>
        {mode === 'tracking' && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-label="Sedang merekam" />}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
    )
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-black flex items-center gap-2">📍 GPS Tracker</h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">Lacak rute, kecepatan, percepatan & kalori</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'done' && (
            <button onClick={shareToFeed} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>
              <IconShare2 size={13} /> Share
            </button>
          )}
          <button onClick={() => setOpen(false)} aria-label="Tutup GPS Tracker" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
          </button>
        </div>
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

      {/* Satu peta nyata (OpenStreetMap) untuk semua mode: lihat posisi,
          rencanakan jalur (klik peta = tambah waypoint), dan rekam rute. */}
      <div className="mx-5 overflow-hidden rounded-2xl border border-neutral-100 relative">
        {mode === 'planning' && (
          <div className="absolute inset-x-0 top-0 z-[500] bg-purple-600/90 px-3 py-1.5 text-center text-[11px] font-bold text-white">
            📍 Ketuk peta untuk menambah titik jalur {plan.length > 0 && `· ${plan.length} titik · ${fmtDist(planDist)}`}
          </div>
        )}
        <Suspense fallback={<div className="grid h-[240px] place-items-center bg-neutral-50 text-xs text-neutral-400">Memuat peta…</div>}>
          <RouteMap
            points={pts}
            planned={plan}
            height={240}
            onMapClick={mode === 'planning' ? (p) => setPlan((pl) => [...pl, p]) : undefined}
          />
        </Suspense>

        {/* Stats bar */}
        {(mode === 'tracking' || mode === 'paused' || mode === 'done') && (
          <div className="grid grid-cols-3 gap-px bg-neutral-900">
            {[[fmtD(dur), 'WAKTU'], [fmtDist(dist), 'JARAK'], [Math.round(speed), 'KM/H'], [fmtPace(dur, dist), 'PACE'], [acceleration.toFixed(2), 'm/s²'], [`${Math.round(elevGainM)}m · ${terrain}`, 'ELEVASI']].map(([v, l]) => (
              <div key={l} className="bg-neutral-900 px-1.5 py-2 text-center">
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

            {/* %HRmax + Talk Test + MAF (Maffetone) — panduan intensitas lari */}
            <div className="rounded-xl border border-neutral-100 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Panduan Intensitas Lari</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-neutral-50 p-2">
                  <div className="text-sm font-extrabold tabular-nums" style={{ color: hr > 0 ? (hr / hrMax >= 0.9 ? '#ef4444' : hr / hrMax >= 0.77 ? '#f59e0b' : '#00BF63') : '#a3a3a3' }}>
                    {hr > 0 ? Math.round((hr / hrMax) * 100) + '%' : '—'}
                  </div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">% HR Max</div>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2">
                  <div className="text-[11px] font-extrabold leading-tight" style={{ color: hr > 0 ? (hr / hrMax >= 0.9 ? '#ef4444' : hr / hrMax >= 0.77 ? '#f59e0b' : '#00BF63') : '#a3a3a3' }}>
                    {hr <= 0 ? '—' : hr / hrMax < 0.77 ? 'Bisa bicara kalimat penuh' : hr / hrMax < 0.9 ? 'Hanya 3-4 kata' : 'Tak bisa bicara'}
                  </div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Talk Test</div>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2">
                  <div className="text-sm font-extrabold tabular-nums text-brand-dark">{180 - age}<span className="text-[9px] text-neutral-400"> bpm</span></div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">MAF Target</div>
                </div>
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-400">
                <b>Talk test:</b> validasi zona termudah — Zone 2 bila masih bisa bicara kalimat penuh.
                <b> MAF</b> (Maximum Aerobic Function, metode Maffetone 180−usia): latihan di ≤{180 - age} bpm membangun mesin aerobik & pembakaran lemak maksimal.
                {hr > 0 && hr > 180 - age && <span className="font-bold text-amber-600"> HR Anda {hr} bpm di atas MAF — pelankan untuk basis aerobik.</span>}
              </p>
            </div>

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

const STORY_REACTIONS = ['❤️', '💪', '🙏', '👏', '🔥', '😍', '😂', '😮', '💯', '🎉']

function StoryViewer({ group, onClose, onComment, onReact }: {
  group: StoryGroup; onClose: () => void; onComment: (storyId: string, text: string) => void; onReact: (storyId: string, emoji: string) => void
}) {
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const [floaters, setFloaters] = useState<{ id: string; emoji: string }[]>([])
  const story = group.stories[idx]
  const DURATION = story.video ? 15000 : 5000

  function react(emoji: string) {
    onReact(story.id, emoji)
    const id = uid()
    setFloaters((f) => [...f, { id, emoji }])
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1200)
  }

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

        {/* Floating live reactions (item 8) */}
        <div className="pointer-events-none absolute bottom-24 right-4 z-10 flex h-40 w-10 flex-col items-center justify-end">
          {floaters.map((f) => (
            <span key={f.id} className="story-float absolute text-2xl">{f.emoji}</span>
          ))}
        </div>

        {/* Quick reactions + direct reply input */}
        <div className="z-10 flex items-center gap-2 p-3" onClick={(e) => e.stopPropagation()}>
          {STORY_REACTIONS.map((emo) => (
            <button key={emo} onClick={() => react(emo)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-base transition active:scale-90">
              {emo}
              {story.reactions?.[emo] ? <span className="sr-only">{story.reactions[emo]}</span> : null}
            </button>
          ))}
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            placeholder="Balas langsung..." className="flex-1 rounded-full border border-white/30 bg-black/30 px-4 py-2.5 text-xs text-white placeholder:text-white/50 focus:outline-none" />
          <button onClick={send} disabled={!draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition active:scale-90 disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            <IconSend size={16} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes storyFloat { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-140px) scale(1.2); opacity: 0; } }
        .story-float { animation: storyFloat 1.2s ease-out forwards; }
      `}</style>
    </div>
  )
}

function StoriesBar({ stories, viewerEmail, viewerName, onAddStory }: {
  stories: Story[]; viewerEmail: string; viewerName: string; onAddStory: (s: Story) => void
}) {
  const [openEmail, setOpenEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addStoryComment, addStoryReaction } = useStore()

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
        <button key={g.authorEmail} onClick={() => setOpenEmail(g.authorEmail)} className="flex shrink-0 flex-col items-center gap-1">
          <span className="grid h-14 w-14 place-items-center rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, #00BF63, #f59e0b, #FF3131)' }}>
            <span className="grid h-full w-full place-items-center rounded-full border-2 border-white text-sm font-bold text-white" style={{ backgroundColor: g.mediaColor }}>
              {initials(g.authorName)}
            </span>
          </span>
          <span className="max-w-[60px] truncate text-[10px] font-semibold text-neutral-500">{g.authorName.split(' ')[0]}</span>
        </button>
      ))}
      {openEmail && groups.find((g) => g.authorEmail === openEmail) && (
        <StoryViewer
          group={groups.find((g) => g.authorEmail === openEmail)!}
          onClose={() => setOpenEmail(null)}
          onComment={(storyId, text) => addStoryComment(storyId, text, viewerName)}
          onReact={(storyId, emoji) => addStoryReaction(storyId, emoji)}
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
  const [tags, setTags] = useState('') // tag teman (@nama), dipisah koma
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
    // Tag teman → mention "@nama" yang ditambahkan ke caption.
    const mentions = tags.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean).map((n) => `@${n}`)
    const fullCaption = [caption.trim(), mentions.length ? `\n${mentions.join(' ')}` : ''].join('')
    onPost({
      id: uid(), authorEmail, authorName, role,
      postType, kind: videoUrl ? 'video' : photos.length > 0 ? 'image' : 'text',
      activity: activity || 'Postingan', caption: fullCaption,
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

          {/* Tag teman */}
          <input className={inputClass + ' text-sm'} type="text" placeholder="🏷️ Tag teman (mis. Budi, Sinta) — pisahkan koma" value={tags} onChange={e => setTags(e.target.value)} />

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={!!videoUrl} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition disabled:opacity-40">
              📸 {busy ? 'Mengunggah...' : 'Foto'}
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => pickFiles(e.target.files)} />

            <button onClick={() => videoRef.current?.click()} disabled={photos.length > 0} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition disabled:opacity-40">
              <IconVideo size={14} /> {busy ? 'Mengunggah...' : 'Video (maks 3 mnt)'}
            </button>
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => pickVideo(e.target.files?.[0])} />

            <MusicPicker song={song} setSong={setSong} />
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
const POST_REACTIONS: { emoji: string; label: string }[] = [
  { emoji: '❤️', label: 'Peduli' }, { emoji: '💪', label: 'Semangat' }, { emoji: '🙏', label: 'Doa' }, { emoji: '👏', label: 'Bangga' },
  { emoji: '🔥', label: 'Keren' }, { emoji: '😍', label: 'Suka banget' }, { emoji: '😂', label: 'Lucu' }, { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sedih' }, { emoji: '💯', label: 'Mantap' }, { emoji: '🎉', label: 'Selamat' }, { emoji: '🏆', label: 'Juara' },
]

// Instagram-style options bottom sheet for a post. Owner-only actions are
// hidden for other viewers. Light/efficient: pure flags + existing store calls.
function PostOptionsSheet({ post, isOwnPost, onClose, onCopyUrl, onToggleBookmark, onUpdate, onDelete }: {
  post: SocialPost
  isOwnPost: boolean
  onClose: () => void
  onCopyUrl: () => void
  onToggleBookmark: () => void
  onUpdate: (patch: Partial<SocialPost>) => void
  onDelete: () => void
}) {
  type Row = { icon: string; label: string; onClick: () => void; danger?: boolean; active?: boolean }
  const close = (fn: () => void) => () => { fn(); onClose() }
  const general: Row[] = [
    { icon: '🔖', label: post.bookmarkedByMe ? 'Hapus dari simpanan' : 'Simpan', onClick: close(onToggleBookmark), active: post.bookmarkedByMe },
    { icon: '📋', label: 'Salin URL', onClick: close(onCopyUrl) },
  ]
  const owner: Row[] = isOwnPost ? [
    { icon: post.exclusive ? '🔓' : '🔒', label: post.exclusive ? 'Jadikan publik' : 'Jadikan premium', onClick: close(() => onUpdate({ exclusive: !post.exclusive })), active: post.exclusive },
    { icon: '🗂️', label: post.archived ? 'Keluarkan dari arsip' : 'Arsipkan', onClick: close(() => onUpdate({ archived: !post.archived })), active: post.archived },
    { icon: '📌', label: post.pinned ? 'Lepas sematan' : 'Sematkan di profil', onClick: close(() => onUpdate({ pinned: !post.pinned })), active: post.pinned },
    { icon: '❤️', label: post.hideLikes ? 'Tampilkan jumlah suka' : 'Sembunyikan jumlah suka', onClick: close(() => onUpdate({ hideLikes: !post.hideLikes })), active: post.hideLikes },
    { icon: '💬', label: post.commentsOff ? 'Aktifkan komentar' : 'Matikan komentar', onClick: close(() => onUpdate({ commentsOff: !post.commentsOff })), active: post.commentsOff },
  ] : []
  const danger: Row[] = isOwnPost ? [
    { icon: '🗑️', label: 'Hapus', danger: true, onClick: () => { if (confirm('Hapus postingan ini secara permanen?')) { onDelete(); onClose() } } },
  ] : []
  const Group = ({ rows }: { rows: Row[] }) => (
    <div className="overflow-hidden rounded-2xl bg-neutral-50">
      {rows.map((r, i) => (
        <button key={r.label} onClick={r.onClick}
          className={'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition active:bg-neutral-100 ' + (i > 0 ? 'border-t border-neutral-100 ' : '') + (r.danger ? 'text-rose-500' : 'text-ink')}>
          <span className="w-5 text-center text-base">{r.icon}</span>
          <span className="flex-1">{r.label}</span>
          {r.active && <span className="text-brand-dark">✓</span>}
        </button>
      ))}
    </div>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md space-y-2.5 rounded-t-3xl bg-white p-3 pb-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto h-1 w-10 rounded-full bg-neutral-200" />
        <Group rows={general} />
        {owner.length > 0 && <Group rows={owner} />}
        {danger.length > 0 && <Group rows={danger} />}
        <button onClick={onClose} className="w-full rounded-2xl bg-neutral-100 py-3 text-sm font-bold text-neutral-500 active:scale-[0.99]">Batal</button>
      </div>
    </div>
  )
}

export function PostCard({ post, viewerEmail, viewerName }: { post: SocialPost; viewerEmail: string; viewerName: string }) {
  const { state, toggleLike, updatePost, deletePost, toggleBookmark, toggleFollow, subscribeAuthor, toggleReaction } = useStore()
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [draft, setDraft] = useState('')
  const comments = post.commentList ?? []
  const isOwnPost = post.authorEmail === viewerEmail
  const following = state.follows.includes(post.authorEmail)
  // Mutual engagement badge (item 7): you follow them and they've engaged back on this post.
  const mutual = following && (post.likedByMe || (post.commentList?.some((c) => c.authorName === viewerName)))
  const subPrice = state.authorSubPrices[post.authorEmail] ?? 0
  const subExpires = state.authorSubs[post.authorEmail]
  const subscribed = !!subExpires && new Date(subExpires) > new Date()
  const lastSeen = state.presence[post.authorEmail]
  const online = !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000

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

  // Copy a deep link to this specific post (shareable URL with ?post=id).
  const [copied, setCopied] = useState(false)
  async function copyUrl() {
    const base = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/?post=${post.id}`
      : `https://panaceamed.id/#/?post=${post.id}`
    try {
      await navigator.clipboard.writeText(base)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { alert('Tautan: ' + base) }
  }

  // Premium gating: an exclusive post is blurred for viewers who aren't the
  // author and haven't subscribed to the author.
  const premium = !!post.exclusive
  const gated = premium && !isOwnPost && !subscribed

  const photos = post.photos ?? []

  // Overlay shown on top of the post media (video/photos): Premium toggle for
  // the owner, Copy-URL for everyone.
  const mediaOverlay = (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2">
      <div className="flex items-start justify-between">
        {premium ? (
          <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm">
            🔒 Premium
          </span>
        ) : <span />}
        {isOwnPost && (
          <button
            onClick={() => updatePost(post.id, { exclusive: !premium })}
            aria-label={premium ? 'Jadikan publik' : 'Jadikan premium'}
            title={premium ? 'Jadikan publik' : 'Jadikan premium (khusus pelanggan)'}
            className={'pointer-events-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold shadow backdrop-blur-sm transition active:scale-95 ' + (premium ? 'bg-white/90 text-amber-600' : 'bg-black/55 text-white')}>
            {premium ? '🔓 Publik' : '🔒 Premium'}
          </button>
        )}
      </div>
      <div className="flex justify-end">
        <button onClick={copyUrl} aria-label="Salin URL" title="Salin tautan postingan"
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm transition active:scale-95">
          {copied ? '✓ Tersalin' : '📋 Copy URL'}
        </button>
      </div>
    </div>
  )

  return (
    <Card className="space-y-3 overflow-hidden">
      {/* Header + share logo (top-right) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: post.mediaColor || '#00BF63' }}>
            {initials(post.authorName)}
            {online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" title="Sedang aktif" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-xs font-black">{post.authorName}</span>
              <span className="shrink-0 text-[9px] font-medium bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-md">{roleLabel[post.role]}</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
              {timeAgo(post.at)} · <span className="font-semibold text-brand-dark capitalize">{post.postType}</span>
              {mutual && <span className="ml-1 text-amber-600">· 🤝</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isOwnPost && (
            <button onClick={() => toggleFollow(post.authorEmail)} aria-label={following ? 'Berhenti mengikuti' : 'Ikuti'}
              className={'rounded-full px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ' + (following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand/10 text-brand-dark')}>
              {following ? '✓' : '+ Ikuti'}
            </button>
          )}
          {!isOwnPost && subPrice > 0 && (
            <button onClick={subscribeNow} disabled={subscribed} aria-label="Berlangganan"
              className={'grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold transition active:scale-95 ' + (subscribed ? 'bg-amber-50 text-amber-600' : 'bg-ink text-white')}>
              {subscribed ? '✓' : '★'}
            </button>
          )}
          {/* Share button rendered as a logo only (no text) */}
          <button onClick={share} aria-label="Bagikan ke media sosial" title="Bagikan"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition active:scale-90"
            style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 4px 12px rgba(0,191,99,0.32)' }}>
            <IconShare2 size={15} />
          </button>
          {/* Options menu (Instagram-style: Save / QR / Insights / Archive / Edit / Delete …) */}
          <button onClick={() => setShowMenu(true)} aria-label="Opsi lainnya" title="Opsi"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 transition active:scale-90 hover:bg-neutral-100">
            <span className="text-lg leading-none">⋯</span>
          </button>
        </div>
      </div>

      {showMenu && (
        <PostOptionsSheet
          post={post}
          isOwnPost={isOwnPost}
          onClose={() => setShowMenu(false)}
          onCopyUrl={copyUrl}
          onToggleBookmark={() => toggleBookmark(post.id)}
          onUpdate={(patch) => updatePost(post.id, patch)}
          onDelete={() => deletePost(post.id)}
        />
      )}

      <div className="border-l-2 pl-3 py-0.5 text-xs text-neutral-700 font-medium" style={{ borderColor: post.mediaColor }}>{post.activity}</div>
      <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{post.caption}</p>

      {post.videoUrl ? (
        <div className="relative overflow-hidden rounded-xl bg-black">
          <div className={gated ? 'blur-xl' : ''}>
            <video src={post.videoUrl} controls={!gated} className="max-h-80 w-full object-contain" />
          </div>
          {post.videoSec ? (
            <span className="absolute right-2 bottom-2 z-20 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              {Math.floor(post.videoSec / 60)}:{String(post.videoSec % 60).padStart(2, '0')}
            </span>
          ) : null}
          {mediaOverlay}
          {gated && (
            <button onClick={subscribeNow} className="absolute inset-0 z-20 grid place-items-center text-center text-white">
              <span className="rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold backdrop-blur-sm">🔒 Konten premium<br /><span className="text-[11px] font-medium text-amber-300">Berlangganan untuk membuka</span></span>
            </button>
          )}
        </div>
      ) : photos.length > 0 && (
        <div className="relative overflow-hidden rounded-xl">
          <div className={'grid gap-1.5 ' + (photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2') + (gated ? ' blur-xl' : '')}>
            {photos.map((img, idx) => (
              isImg(img)
                ? <img key={idx} src={img} alt="" className="w-full h-40 object-cover" />
                : <div key={idx} className="w-full h-40" style={{ background: img }} />
            ))}
          </div>
          {mediaOverlay}
          {gated && (
            <button onClick={subscribeNow} className="absolute inset-0 z-20 grid place-items-center text-center text-white">
              <span className="rounded-2xl bg-black/50 px-4 py-3 text-xs font-bold backdrop-blur-sm">🔒 Konten premium<br /><span className="text-[11px] font-medium text-amber-300">Berlangganan untuk membuka</span></span>
            </button>
          )}
        </div>
      )}

      {post.audio && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
          🎵 {post.audio}
        </div>
      )}

      {/* Reaction tally (item 2: peduli/semangat/doa/bangga beyond plain Like) */}
      {post.reactions && Object.values(post.reactions).some((list) => list.length > 0) && (
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          {POST_REACTIONS.filter((r) => (post.reactions?.[r.emoji]?.length ?? 0) > 0).map((r) => (
            <span key={r.emoji} className="rounded-full bg-neutral-100 px-2 py-0.5">{r.emoji} {post.reactions![r.emoji].length}</span>
          ))}
        </div>
      )}

      {/* Action bar: like · react · comment · share (icon-first, evenly spread) */}
      <div className="relative flex items-center justify-around gap-1 border-t border-neutral-100 pt-1.5 -mb-1">
        <button onClick={() => toggleLike(post.id)} aria-label="Suka" className={'flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 ' + (post.likedByMe ? 'text-rose-500 bg-rose-50' : 'text-neutral-500 hover:bg-neutral-50')}>
          <ColoredIcon color={post.likedByMe ? '#f43f5e' : '#a3a3a3'}><span className={post.likedByMe ? 'inline-block animate-[likepop_0.35s_ease]' : 'inline-block'}><IconHeart size={18} /></span></ColoredIcon>
          {post.likes > 0 && !post.hideLikes && <span>{post.likes}</span>}
        </button>
        <button onClick={() => setShowReactions((v) => !v)} aria-label="Reaksi" className="flex min-h-[40px] items-center rounded-xl px-3 py-2 text-lg transition-transform duration-200 active:scale-90 hover:bg-neutral-50">
          😊
        </button>
        {showReactions && (
          <div className="absolute bottom-11 left-1/2 z-10 grid w-60 max-w-[80vw] -translate-x-1/2 grid-cols-6 gap-1 rounded-2xl border border-neutral-100 bg-white p-2 shadow-lg">
            {POST_REACTIONS.map((r) => (
              <button key={r.emoji} title={r.label} aria-label={r.label} onClick={() => { toggleReaction(post.id, r.emoji); setShowReactions(false) }}
                className={'grid h-8 w-8 place-items-center rounded-full text-lg transition hover:scale-125 ' + (post.reactions?.[r.emoji]?.includes(viewerEmail) ? 'bg-brand/10' : '')}>
                {r.emoji}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => !post.commentsOff && setShowComments(v => !v)} disabled={post.commentsOff} aria-label="Komentar" className={'flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-90 ' + (post.commentsOff ? 'text-neutral-300 cursor-not-allowed' : showComments ? 'text-brand-dark bg-brand/10' : 'text-neutral-500 hover:bg-neutral-50')}>
          <IconComment size={18} /> {!post.commentsOff && comments.length > 0 && <span>{comments.length}</span>}
        </button>
        <button onClick={share} aria-label="Bagikan" className="flex min-h-[40px] items-center rounded-xl px-3 py-2 text-neutral-500 transition-transform duration-200 active:scale-90 hover:bg-neutral-50">
          <IconShare2 size={17} />
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

const MOOD_OPTIONS: { id: MoodEntry['mood']; emoji: string; label: string }[] = [
  { id: 'senang', emoji: '😄', label: 'Senang' },
  { id: 'biasa', emoji: '🙂', label: 'Biasa' },
  { id: 'lelah', emoji: '😴', label: 'Lelah' },
  { id: 'sedih', emoji: '😢', label: 'Sedih' },
  { id: 'stres', emoji: '😣', label: 'Stres' },
]

/* ═══════════════════════════════════════════════════════
   KOMUNITAS SEHAT — interpersonal-relationship health features
   (Health Buddy & check-in, mood + dukungan, tantangan kelompok,
   Circle of Care, dan dinding rasa terima kasih)
   ═══════════════════════════════════════════════════════ */
// Achievement tiers — derived, no extra state. Colors deepen as counts grow.
const LOVE_TIERS = [
  { min: 0, color: '#FFB3C1', label: 'Pemula' },
  { min: 5, color: '#FF6B8B', label: 'Hangat' },
  { min: 20, color: '#E0245E', label: 'Penuh Kasih' },
  { min: 50, color: '#8B0036', label: 'Legenda Peduli' },
]
const FIRE_TIERS = [
  { min: 0, color: '#FFD27A', label: 'Mulai' },
  { min: 3, color: '#FF9F43', label: 'Konsisten' },
  { min: 7, color: '#FF5E1A', label: 'Membara' },
  { min: 30, color: '#B8330A', label: 'Tak Tergoyahkan' },
]
function tierFor(tiers: typeof LOVE_TIERS, n: number) {
  return [...tiers].reverse().find((t) => n >= t.min) ?? tiers[0]
}

export function KomunitasSehat({ viewerEmail, viewerName }: { viewerEmail: string; viewerName: string }) {
  const { state, setBuddy, checkInToday, addMood, sendSupport, startChallenge, bumpChallenge, createCircle, addGratitude, createCommunity, joinCommunity } = useStore()
  const [buddyDraft, setBuddyDraft] = useState(state.buddyName ?? '')
  const [moodNote, setMoodNote] = useState('')
  const [supportTo, setSupportTo] = useState('')
  const [supportText, setSupportText] = useState('')
  const [newChallengeTitle, setNewChallengeTitle] = useState('')
  const [circleName, setCircleName] = useState('')
  const [circleMembers, setCircleMembers] = useState('')
  const [gratTo, setGratTo] = useState('')
  const [gratText, setGratText] = useState('')
  const [communityName, setCommunityName] = useState('')
  const [sportTag, setSportTag] = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const [joinNameDraft, setJoinNameDraft] = useState(viewerName)

  const myCheckIns = state.checkIns.filter((c) => c.email === viewerEmail).map((c) => c.date).sort()
  const today = new Date().toISOString().slice(0, 10)
  const checkedInToday = myCheckIns.includes(today)
  // Consecutive-day streak ending today/yesterday.
  const streak = useMemo(() => {
    let s = 0
    let d = new Date()
    if (!checkedInToday) d.setDate(d.getDate() - 1)
    while (myCheckIns.includes(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) }
    return s
  }, [myCheckIns, checkedInToday])

  const recentMoods = state.moods.slice(0, 6)
  const recentSupport = state.supportMessages.slice(0, 5)
  const recentGratitude = state.gratitudes.slice(0, 5)

  // Item 2: achievement tiers, derived from existing activity — no extra state.
  const loveCount = state.gratitudes.filter((g) => g.toName === viewerName).length
    + state.posts.filter((p) => p.authorEmail === viewerEmail).reduce((sum, p) => sum + (p.reactions?.['❤️']?.length ?? 0), 0)
  const loveTier = tierFor(LOVE_TIERS, loveCount)
  const fireTier = tierFor(FIRE_TIERS, streak)

  // Item 1: an illustrative "affinity score" toward the Health Buddy — built from
  // shared accountability signals (streak + shared sport-community membership).
  const sharedCommunities = state.communities.filter((c) => c.memberNames.includes(viewerName) && state.buddyName && c.memberNames.includes(state.buddyName))
  const affinityScore = state.buddyName ? Math.min(100, streak * 8 + sharedCommunities.length * 15) : 0

  const filteredCommunities = state.communities.filter((c) => !sportFilter.trim() || c.sportTag.toLowerCase().includes(sportFilter.trim().toLowerCase()))

  return (
    <div className="space-y-4">
      <h4 className="px-1 text-xs font-black uppercase tracking-wider text-neutral-400">Komunitas Sehat</h4>

      {/* 1. Health Buddy — akuntabilitas */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🤝 Health Buddy</div>
        <div className="flex items-center gap-2">
          <input value={buddyDraft} onChange={(e) => setBuddyDraft(e.target.value)} placeholder="Nama teman akuntabilitas Anda"
            className={inputClass + ' flex-1 text-xs'} />
          <button onClick={() => setBuddy(buddyDraft)} className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600">Simpan</button>
        </div>
        {state.buddyName && (
          <p className="text-xs text-neutral-500">Buddy Anda: <b className="text-ink">{state.buddyName}</b> — saling mengingatkan check-in harian ya!</p>
        )}
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
          <div className="text-xs">
            <div className="font-bold text-brand-dark">🔥 Streak {streak} hari</div>
            <div className="text-neutral-500">{checkedInToday ? 'Sudah check-in hari ini.' : 'Belum check-in hari ini.'}</div>
          </div>
          <button onClick={checkInToday} disabled={checkedInToday}
            className="rounded-xl px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            {checkedInToday ? '✓ Check-in' : 'Check-in Sekarang'}
          </button>
        </div>
        {/* Riwayat check-in (log) */}
        {myCheckIns.length > 0 && (
          <div className="border-t border-neutral-100 pt-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Riwayat Check-in ({myCheckIns.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {[...myCheckIns].reverse().slice(0, 14).map((d) => (
                <span key={d} className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                  {new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Item 2: achievement badges with color tiers */}
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 text-[11px] font-bold">
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-white" style={{ background: fireTier.color }}>🔥 {fireTier.label}</span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-white" style={{ background: loveTier.color }}>❤️ {loveTier.label}</span>
        </div>
        {state.buddyName && (
          <div className="rounded-xl bg-pink-50 p-2.5 text-[11px] text-pink-700">
            💞 Skor Afinitas dengan {state.buddyName}: <b>{affinityScore}/100</b> — naik tiap check-in & komunitas olahraga yang sama (ilustratif, berdasarkan aktivitas Anda berdua di akun ini).
          </div>
        )}
      </Card>

      {/* 10. Komunitas olahraga — temukan/buat grup berdasarkan ketertarikan yang sama */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🏃 Komunitas Olahraga</div>
        <input value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} placeholder="Cari komunitas (mis. Lari, Yoga)"
          className={inputClass + ' text-xs'} />
        <div className="space-y-1.5">
          {filteredCommunities.length === 0 && <p className="text-xs text-neutral-400">Belum ada komunitas. Buat yang pertama!</p>}
          {filteredCommunities.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
              <div>
                <b className="text-ink">{c.name}</b> · <span className="text-brand-dark">{c.sportTag}</span>
                <div className="text-neutral-400">{c.memberNames.length} anggota: {c.memberNames.join(', ')}</div>
              </div>
              {!c.memberNames.includes(viewerName) && (
                <button onClick={() => joinCommunity(c.id, joinNameDraft || viewerName)} className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand-dark">Gabung</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-2">
          <input value={communityName} onChange={(e) => setCommunityName(e.target.value)} placeholder="Nama komunitas" className={inputClass + ' flex-1 text-xs'} />
          <input value={sportTag} onChange={(e) => setSportTag(e.target.value)} placeholder="Olahraga" className={inputClass + ' w-24 text-xs'} />
          <button onClick={() => { createCommunity(communityName, sportTag); setCommunityName(''); setSportTag('') }} disabled={!communityName.trim() || !sportTag.trim()}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">Buat</button>
        </div>
      </Card>

      {/* 4 & 6. Mood check-in + dukungan langsung */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">💬 Mood & Dukungan</div>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button key={m.id} onClick={() => { addMood(m.id, moodNote); setMoodNote('') }}
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <input value={moodNote} onChange={(e) => setMoodNote(e.target.value)} placeholder="Catatan singkat (opsional), lalu pilih mood di atas"
          className={inputClass + ' text-xs'} />
        {recentMoods.length > 0 && (
          <div className="space-y-1.5 border-t border-neutral-100 pt-2">
            {recentMoods.map((m) => (
              <div key={m.id} className="text-[11px] text-neutral-500">
                {MOOD_OPTIONS.find((o) => o.id === m.mood)?.emoji} <b className="text-ink">{m.name}</b> merasa {m.mood}{m.note ? ` — "${m.note}"` : ''} <span className="text-neutral-400">· {timeAgo(m.at)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-2">
          <input value={supportTo} onChange={(e) => setSupportTo(e.target.value)} placeholder="Untuk siapa?" className={inputClass + ' w-28 text-xs'} />
          <input value={supportText} onChange={(e) => setSupportText(e.target.value)} placeholder="Kirim semangat singkat..." className={inputClass + ' flex-1 text-xs'} />
          <button onClick={() => { sendSupport(supportTo, supportText); setSupportTo(''); setSupportText('') }} disabled={!supportText.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            <IconSend size={15} />
          </button>
        </div>
        {recentSupport.length > 0 && (
          <div className="space-y-1.5">
            {recentSupport.map((s) => (
              <div key={s.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
                <b className="text-ink">{s.fromName}</b> → {s.toName}: {s.text}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. Tantangan kelompok realtime */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🏆 Tantangan Kelompok</div>
        <div className="flex items-center gap-2">
          <input value={newChallengeTitle} onChange={(e) => setNewChallengeTitle(e.target.value)} placeholder="Mis. 10.000 langkah/minggu"
            className={inputClass + ' flex-1 text-xs'} />
          <button onClick={() => { startChallenge(newChallengeTitle, 'poin', 100, 7); setNewChallengeTitle('') }} disabled={!newChallengeTitle.trim()}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">Mulai</button>
        </div>
        {state.challenges.length === 0 && <p className="text-xs text-neutral-400">Belum ada tantangan aktif. Mulai satu dan undang teman!</p>}
        {state.challenges.map((c) => {
          const leaders = [...c.participants].sort((a, b) => b.progress - a.progress)
          const me = c.participants.find((p) => p.email === viewerEmail)
          return (
            <div key={c.id} className="rounded-xl border border-neutral-100 p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink">
                <span>{c.title}</span>
                <button onClick={() => bumpChallenge(c.id, 10)} className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand-dark">+10 {c.unit}</button>
              </div>
              <div className="space-y-1">
                {leaders.map((p, i) => (
                  <div key={p.email} className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="w-4 font-bold">{i + 1}.</span>
                    <span className="flex-1 truncate font-semibold text-neutral-600">{p.email === viewerEmail ? `${p.name} (Anda)` : p.name}</span>
                    <span>{p.progress} {c.unit}</span>
                  </div>
                ))}
              </div>
              {!me && <p className="mt-1 text-[10px] text-neutral-400">Tekan "+10" untuk ikut serta.</p>}
            </div>
          )
        })}
      </Card>

      {/* 9. Circle of Care */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🫂 Circle of Care</div>
        <div className="flex items-center gap-2">
          <input value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder="Nama circle (mis. Keluarga)" className={inputClass + ' w-32 text-xs'} />
          <input value={circleMembers} onChange={(e) => setCircleMembers(e.target.value)} placeholder="Nama anggota, pisahkan koma" className={inputClass + ' flex-1 text-xs'} />
          <button onClick={() => { createCircle(circleName, circleMembers.split(',')); setCircleName(''); setCircleMembers('') }} disabled={!circleName.trim()}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">Buat</button>
        </div>
        {state.circles.map((c) => (
          <div key={c.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
            <b className="text-ink">{c.name}</b> — {c.memberNames.length > 0 ? c.memberNames.join(', ') : 'belum ada anggota'}
          </div>
        ))}
      </Card>

      {/* 10. Gratitude wall */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🙏 Dinding Terima Kasih</div>
        <div className="flex items-center gap-2">
          <input value={gratTo} onChange={(e) => setGratTo(e.target.value)} placeholder="Untuk siapa?" className={inputClass + ' w-28 text-xs'} />
          <input value={gratText} onChange={(e) => setGratText(e.target.value)} placeholder="Ucapan terima kasih..." className={inputClass + ' flex-1 text-xs'} />
          <button onClick={() => { addGratitude(gratTo, gratText); setGratTo(''); setGratText('') }} disabled={!gratText.trim() || !gratTo.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            <IconSend size={15} />
          </button>
        </div>
        {recentGratitude.map((g) => (
          <div key={g.id} className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-neutral-700">
            <b>{g.fromName}</b> berterima kasih kepada <b>{g.toName}</b>: "{g.text}"
          </div>
        ))}
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PUSAT KESEHATAN REALTIME — edukasi, news, fungsionalitas,
   kalkulasi, monitoring (10 fitur)
   ═══════════════════════════════════════════════════════ */
const HEALTH_NEWS = [
  { id: 'n1', title: 'WHO: 30 menit jalan cepat/hari turunkan risiko penyakit jantung', tag: 'Kardiologi' },
  { id: 'n2', title: 'Studi terbaru: tidur < 6 jam tingkatkan risiko diabetes tipe 2', tag: 'Endokrin' },
  { id: 'n3', title: 'Kemenkes imbau vaksinasi influenza musim hujan', tag: 'Imunisasi' },
  { id: 'n4', title: 'Konsumsi gula berlebih dikaitkan dengan penuaan kulit lebih cepat', tag: 'Nutrisi' },
  { id: 'n5', title: 'Latihan kekuatan 2x/minggu terbukti perpanjang usia harapan hidup', tag: 'Olahraga' },
]
const EDU_ARTICLES = [
  { id: 'e1', title: 'Mengenal Tekanan Darah: Kapan Harus Waspada?', minutes: 4 },
  { id: 'e2', title: '5 Kebiasaan Tidur Sehat untuk Pemulihan Otot', minutes: 3 },
  { id: 'e3', title: 'Hidrasi: Berapa Air yang Sebenarnya Tubuh Anda Butuhkan?', minutes: 2 },
  { id: 'e4', title: 'Mitos vs Fakta Seputar Diet Karbo', minutes: 5 },
]
const MYTH_QUIZ = [
  { q: 'Minum air dingin setelah olahraga berat berbahaya bagi jantung.', answer: false },
  { q: 'Tekanan darah normal dewasa sekitar 120/80 mmHg.', answer: true },
  { q: 'Tidur kurang dari 6 jam tiap malam dapat memengaruhi metabolisme.', answer: true },
  { q: 'Detoks jus selama 3 hari dapat "membersihkan" racun dari hati.', answer: false },
]

function bpCategory(sys: number, dia: number) {
  if (sys < 90 || dia < 60) return { label: 'Rendah', color: '#3B82F6' }
  if (sys <= 120 && dia <= 80) return { label: 'Normal', color: '#00BF63' }
  if (sys < 130 && dia < 85) return { label: 'Tinggi-Normal', color: '#84CC16' }
  if (sys < 140 || dia < 90) return { label: 'Hipertensi Tahap 1', color: '#F59E0B' }
  return { label: 'Hipertensi Tahap 2', color: '#EF4444' }
}

// #1: lightweight inline SVG sparkline for trend visualization (no chart lib).
function Sparkline({ data, color = '#00BF63', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length === 0) return <div className="text-[10px] text-neutral-400">Belum ada data</div>
  const w = 100, h = height
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const step = data.length > 1 ? w / (data.length - 1) : 0
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 6) - 3).toFixed(1)}`)
  const last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-8 w-full">
      {data.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
      <circle cx={data.length > 1 ? (data.length - 1) * step : w / 2} cy={h - ((last - min) / range) * (h - 6) - 3} r={2.5} fill={color} />
    </svg>
  )
}

export function PusatKesehatanRealtime({ viewerEmail }: { viewerEmail: string }) {
  const { state, addSelfVital, addSleepLog, addMedReminder, markMedTaken, toggleEduBookmark, answerQuiz, logVo2Max, addGoal, removeGoal } = useStore()

  // 1. Kalkulator BMI & Kalori Harian (TDEE)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [activity, setActivity] = useState(1.4)
  const bmi = weight / Math.pow(height / 100, 2)
  const bmiCat = bmiCategory(bmi)
  const tdee = Math.round((10 * weight + 6.25 * height - 5 * age + 5) * activity)

  // 2. Kalkulator Tekanan Darah
  const [sys, setSys] = useState(120)
  const [dia, setDia] = useState(80)
  const bpCat = bpCategory(sys, dia)

  // 3. Kalkulator Kebutuhan Cairan Harian
  const waterMl = Math.round(weight * 33 * (activity > 1.3 ? 1.15 : 1))

  // 4. Monitor Vital Realtime
  const [hr, setHr] = useState(72)
  const [spo2, setSpo2] = useState(98)
  const [tempC, setTempC] = useState(36.5)
  const lastVital = state.selfVitals[0]

  // #8: Web Bluetooth — baca detak jantung langsung dari strap BLE (Heart Rate Service 0x180D).
  const [bleStatus, setBleStatus] = useState<'idle' | 'connecting' | 'connected' | 'unsupported' | 'error'>(
    typeof navigator !== 'undefined' && (navigator as any).bluetooth ? 'idle' : 'unsupported'
  )
  const connectWearable = async () => {
    const bt = (navigator as any).bluetooth
    if (!bt) { setBleStatus('unsupported'); return }
    try {
      setBleStatus('connecting')
      const device = await bt.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const char = await service.getCharacteristic('heart_rate_measurement')
      await char.startNotifications()
      char.addEventListener('characteristicvaluechanged', (e: any) => {
        const dv: DataView = e.target.value
        const flags = dv.getUint8(0)
        const bpm = flags & 0x1 ? dv.getUint16(1, true) : dv.getUint8(1)
        if (bpm > 0) setHr(bpm)
      })
      device.addEventListener('gattserverdisconnected', () => setBleStatus('idle'))
      setBleStatus('connected')
    } catch {
      setBleStatus('error')
    }
  }
  // #1: trend series (oldest -> newest) for sparklines.
  const sysSeries = [...state.selfVitals].reverse().slice(-10).map((v) => v.systolic)
  const hrSeries = [...state.selfVitals].reverse().slice(-10).map((v) => v.heartRate)
  const sleepSeries = [...state.sleepLogs].reverse().slice(-10).map((s) => s.hours)

  // 5. Skor Kualitas Tidur
  const [sleepHours, setSleepHours] = useState(7)
  const [bedtimeConsistent, setBedtimeConsistent] = useState(true)
  const sleepScore = Math.max(0, Math.min(100, Math.round((Math.min(sleepHours, 9) / 9) * 70 + (bedtimeConsistent ? 30 : 0))))
  const todaySleep = state.sleepLogs.find((s) => s.date === new Date().toISOString().slice(0, 10))

  // VO2Max — estimasi non-exercise dari HR istirahat & HR maksimal (Uth-Sørensen formula)
  const [hrRest, setHrRest] = useState(65)
  const [hrMaxInput, setHrMaxInput] = useState(220 - age)
  const vo2max = Math.round((15.3 * (hrMaxInput / Math.max(hrRest, 1))) * 10) / 10
  const vo2Cat = vo2max >= 55 ? { l: 'Sangat Baik', c: '#00BF63' } : vo2max >= 45 ? { l: 'Baik', c: '#84CC16' } : vo2max >= 35 ? { l: 'Cukup', c: '#F59E0B' } : { l: 'Rendah', c: '#EF4444' }
  // #5: Tes Cooper — jarak (meter) yang ditempuh dalam lari 12 menit.
  const [cooperMeters, setCooperMeters] = useState(2400)
  const cooperVo2 = Math.round(((cooperMeters - 504.9) / 44.73) * 10) / 10
  const lastVo2 = state.vo2maxLog[0]

  // 6. Pengingat Obat/Vitamin
  const [medName, setMedName] = useState('')
  const [medTime, setMedTime] = useState('08:00')
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // 7. Live Health News Ticker
  const [newsIdx, setNewsIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNewsIdx((i) => (i + 1) % HEALTH_NEWS.length), 6000)
    return () => clearInterval(t)
  }, [])

  // #2: real browser notifications for due medication reminders.
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const notifiedRef = useRef<Set<string>>(new Set())
  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setNotifPerm(p)
  }
  useEffect(() => {
    if (notifPerm !== 'granted') return
    const check = () => {
      const d = new Date()
      const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      const day = d.toISOString().slice(0, 10)
      for (const m of state.medReminders) {
        const key = `${m.id}-${day}`
        if (hm >= m.time && !m.takenDates.includes(day) && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key)
          try { new Notification('💊 Waktunya minum obat', { body: `${m.name} — jadwal ${m.time}`, tag: key }) } catch { /* ignore */ }
        }
      }
    }
    check()
    const t = setInterval(check, 60_000)
    return () => clearInterval(t)
  }, [notifPerm, state.medReminders])

  // 9. Kuis Fakta vs Mitos
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizFeedback, setQuizFeedback] = useState<'right' | 'wrong' | null>(null)
  const quiz = MYTH_QUIZ[quizIdx % MYTH_QUIZ.length]

  // #4: targets & progress badges. Current values pulled from real tracked data.
  const myCheckInDates = state.checkIns.filter((c) => c.email === viewerEmail).map((c) => c.date).sort()
  const checkInStreak = useMemo(() => {
    let s = 0, d = new Date()
    if (!myCheckInDates.includes(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
    while (myCheckInDates.includes(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) }
    return s
  }, [myCheckInDates])
  const goalCurrent = (metric: HealthGoal['metric']): number => {
    if (metric === 'sleep') return todaySleep?.hours ?? 0
    if (metric === 'checkin') return checkInStreak
    if (metric === 'steps') return 0 // butuh integrasi wearable (rekomendasi #8)
    return 0
  }
  const [goalLabel, setGoalLabel] = useState('')
  const [goalMetric, setGoalMetric] = useState<HealthGoal['metric']>('sleep')
  const [goalTarget, setGoalTarget] = useState(7)
  const metricUnit: Record<HealthGoal['metric'], string> = { sleep: 'jam', checkin: 'hari', water: 'liter', steps: 'langkah', custom: '' }

  // #3: export a printable health report (user can Save as PDF / share).
  const exportReport = () => {
    const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))
    const rows = [
      ['BMI', `${bmi.toFixed(1)} (${bmiCat.l})`],
      ['Kalori harian (TDEE)', `${tdee} kkal`],
      ['Kebutuhan cairan', `${(waterMl / 1000).toFixed(1)} liter/hari`],
      ['Tekanan darah', `${sys}/${dia} mmHg (${bpCat.label})`],
      ['VO2Max', lastVo2 ? `${lastVo2.value} mL/kg/min (${lastVo2.method})` : `${vo2max} mL/kg/min (estimasi HR)`],
      ['Skor tidur hari ini', todaySleep ? `${sleepScore}/100` : 'Belum dicatat'],
      ['Vital terakhir', lastVital ? `${lastVital.systolic}/${lastVital.diastolic} mmHg, HR ${lastVital.heartRate}, SpO2 ${lastVital.spo2}%, ${lastVital.tempC}°C` : 'Belum ada'],
    ]
    const win = window.open('', '_blank')
    if (!win) { alert('Izinkan pop-up untuk mengekspor laporan.'); return }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Kesehatan</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{color:#0B7A4B;font-size:20px}
      .sub{color:#888;font-size:12px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:14px}
      td{padding:10px 8px;border-bottom:1px solid #eee}td:first-child{color:#666;width:45%}td:last-child{font-weight:600}
      .foot{margin-top:24px;font-size:11px;color:#aaa}</style></head><body>
      <h1>🩺 Laporan Kesehatan — Panaceamed.id</h1>
      <div class="sub">Dibuat: ${esc(new Date().toLocaleString('id-ID'))}</div>
      <table>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
      <div class="foot">Data bersifat pencatatan mandiri dan tidak menggantikan diagnosis tenaga medis profesional.</div>
      </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  // #7: anomaly detection — flag vitals outside safe ranges (uses current monitor inputs).
  const anomalies: { level: 'warn' | 'crit'; text: string }[] = []
  if (spo2 > 0 && spo2 < 90) anomalies.push({ level: 'crit', text: `SpO2 ${spo2}% sangat rendah — segera cari pertolongan medis.` })
  else if (spo2 > 0 && spo2 < 95) anomalies.push({ level: 'warn', text: `SpO2 ${spo2}% di bawah normal (≥95%). Pantau & istirahat.` })
  if (hr > 120) anomalies.push({ level: 'crit', text: `Detak jantung ${hr} bpm sangat tinggi saat istirahat.` })
  else if (hr > 100) anomalies.push({ level: 'warn', text: `Detak jantung ${hr} bpm (takikardia ringan). Tenangkan diri.` })
  else if (hr > 0 && hr < 50) anomalies.push({ level: 'warn', text: `Detak jantung ${hr} bpm rendah (bradikardia). Pantau jika disertai pusing.` })
  if (tempC >= 39) anomalies.push({ level: 'crit', text: `Suhu ${tempC}°C demam tinggi.` })
  else if (tempC >= 37.8) anomalies.push({ level: 'warn', text: `Suhu ${tempC}°C menandakan demam.` })
  if (sys >= 180 || dia >= 120) anomalies.push({ level: 'crit', text: `Tekanan darah ${sys}/${dia} krisis hipertensi — butuh penanganan segera.` })
  else if (sys >= 140 || dia >= 90) anomalies.push({ level: 'warn', text: `Tekanan darah ${sys}/${dia} tinggi (hipertensi). Kurangi garam & kelola stres.` })
  else if (sys > 0 && sys < 90) anomalies.push({ level: 'warn', text: `Tekanan darah ${sys}/${dia} rendah. Cukupi cairan.` })

  // #6: AI Health Assistant — rekomendasi kontekstual dari data pengguna (rule-based, offline).
  const insights: string[] = []
  if (bmi >= 25) insights.push(`BMI Anda ${bmi.toFixed(1)} (${bmiCat.l}). Defisit ~300-500 kkal/hari dari TDEE (${tdee} kkal) + kardio 3x/minggu membantu menurunkan berat secara sehat.`)
  else if (bmi < 18.5) insights.push(`BMI Anda ${bmi.toFixed(1)} tergolong kurus. Tambah asupan bergizi dan latihan kekuatan untuk massa otot.`)
  else insights.push(`BMI Anda ${bmi.toFixed(1)} ideal — pertahankan dengan ${tdee} kkal/hari dan aktivitas rutin.`)
  if (todaySleep && sleepScore < 70) insights.push(`Skor tidur ${sleepScore}/100. Coba tidur 7-9 jam dengan jadwal konsisten untuk pemulihan optimal.`)
  if (!todaySleep) insights.push('Anda belum mencatat tidur hari ini — pantau durasi & konsistensi untuk insight lebih akurat.')
  const vForAdvice = lastVo2?.value ?? vo2max
  if (vForAdvice < 40) insights.push(`VO2Max ${vForAdvice} masih bisa ditingkatkan. Latihan interval (HIIT) 1-2x/minggu efektif menaikkan kebugaran kardio.`)
  else insights.push(`VO2Max ${vForAdvice} tergolong baik — pertahankan latihan aerobik rutin.`)
  if (checkInStreak >= 3) insights.push(`Hebat! Streak check-in ${checkInStreak} hari. Konsistensi adalah kunci kesehatan jangka panjang. 🔥`)
  insights.push(`Target cairan hari ini ~${(waterMl / 1000).toFixed(1)} liter. Sebarkan minum sepanjang hari, jangan sekaligus.`)

  return (
    <div className="space-y-4">
      <h4 className="px-1 text-xs font-black uppercase tracking-wider text-neutral-400">Pusat Kesehatan Realtime</h4>

      {/* #6 + #7: Asisten Kesehatan AI dengan deteksi anomali */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🤖 Asisten Kesehatan AI</div>
        {anomalies.length > 0 && (
          <div className="space-y-1.5">
            {anomalies.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold ${a.level === 'crit' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                <span>{a.level === 'crit' ? '🚨' : '⚠️'}</span><span>{a.text}</span>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {insights.map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
              <span className="text-brand-dark">💡</span><span>{t}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400">Analisis otomatis berdasarkan data yang Anda catat. Bukan pengganti konsultasi tenaga medis profesional.</p>
      </Card>

      {/* 1. Kalkulator BMI & Kalori Harian + 3. Kebutuhan Cairan */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🧮 Kalkulator BMI, Kalori & Cairan</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Field label="Berat (kg)"><input type="number" value={weight} onChange={(e) => setWeight(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="Tinggi (cm)"><input type="number" value={height} onChange={(e) => setHeight(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="Usia"><input type="number" value={age} onChange={(e) => setAge(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
        </div>
        <select value={activity} onChange={(e) => setActivity(+e.target.value)} className={inputClass + ' text-xs'}>
          <option value={1.2}>Jarang olahraga</option>
          <option value={1.4}>Olahraga ringan</option>
          <option value={1.6}>Olahraga sedang</option>
          <option value={1.9}>Olahraga berat</option>
        </select>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2 text-center text-white" style={{ background: bmiCat.c }}>
            <div className="text-[10px] opacity-90">BMI</div>
            <div className="text-sm font-black">{bmi.toFixed(1)}</div>
            <div className="text-[10px] font-bold">{bmiCat.l}</div>
          </div>
          <div className="rounded-xl bg-brand-50 p-2 text-center text-brand-dark">
            <div className="text-[10px]">Kalori/hari</div>
            <div className="text-sm font-black">{tdee}</div>
            <div className="text-[10px] font-bold">kkal</div>
          </div>
          <div className="rounded-xl bg-sky-50 p-2 text-center text-sky-700">
            <div className="text-[10px]">Cairan/hari</div>
            <div className="text-sm font-black">{(waterMl / 1000).toFixed(1)}</div>
            <div className="text-[10px] font-bold">liter</div>
          </div>
        </div>
      </Card>

      {/* 2. Kalkulator Tekanan Darah + 4. Monitor Vital Realtime */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🩺 Tekanan Darah & Monitor Vital</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="Sistolik"><input type="number" value={sys} onChange={(e) => setSys(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="Diastolik"><input type="number" value={dia} onChange={(e) => setDia(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
        </div>
        <div className="rounded-xl p-2 text-center text-white" style={{ background: bpCat.color }}>
          <span className="text-sm font-black">{sys}/{dia} mmHg</span> — <span className="text-xs font-bold">{bpCat.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-2 text-xs">
          <Field label="HR (bpm)"><input type="number" value={hr} onChange={(e) => setHr(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="SpO2 (%)"><input type="number" value={spo2} onChange={(e) => setSpo2(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="Suhu (°C)"><input type="number" step={0.1} value={tempC} onChange={(e) => setTempC(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
        </div>
        {/* #8: koneksi wearable BLE untuk HR live */}
        {bleStatus !== 'unsupported' && (
          <button onClick={connectWearable} disabled={bleStatus === 'connecting' || bleStatus === 'connected'}
            className="w-full rounded-xl border border-brand/30 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-dark disabled:opacity-60">
            {bleStatus === 'connected' ? '⌚ Wearable terhubung — HR live' : bleStatus === 'connecting' ? 'Menghubungkan…' : bleStatus === 'error' ? '⚠ Gagal — coba lagi' : '⌚ Hubungkan Wearable (Bluetooth)'}
          </button>
        )}
        <button onClick={() => addSelfVital({ systolic: sys, diastolic: dia, heartRate: hr, spo2, tempC })}
          className="w-full rounded-xl px-4 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Catat Vital Sekarang
        </button>
        {lastVital && (
          <p className="text-[11px] text-neutral-500">Terakhir dicatat: {timeAgo(lastVital.at)} — {lastVital.systolic}/{lastVital.diastolic} mmHg, HR {lastVital.heartRate}, SpO2 {lastVital.spo2}%, {lastVital.tempC}°C</p>
        )}
      </Card>

      {/* 5. Skor Kualitas Tidur */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">😴 Skor Kualitas Tidur</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="Jam tidur"><input type="number" value={sleepHours} onChange={(e) => setSleepHours(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <label className="flex items-center gap-2 pt-5 text-xs text-neutral-600">
            <input type="checkbox" checked={bedtimeConsistent} onChange={(e) => setBedtimeConsistent(e.target.checked)} /> Jam tidur konsisten
          </label>
        </div>
        <button onClick={() => addSleepLog(sleepHours, bedtimeConsistent)} className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600">Simpan Tidur Hari Ini</button>
        <div className="rounded-xl bg-indigo-50 p-2 text-center text-indigo-700">
          <span className="text-sm font-black">{todaySleep ? sleepScore : '—'}</span> <span className="text-xs font-bold">/100 {todaySleep ? '(tersimpan hari ini)' : '(belum disimpan)'}</span>
        </div>
      </Card>

      {/* #1: Tren grafik vital & tidur */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">📈 Tren 10 Pencatatan Terakhir</div>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px]"><span className="text-neutral-500">Sistolik (mmHg)</span><b className="text-ink">{sysSeries.length ? sysSeries[sysSeries.length - 1] : '—'}</b></div>
            <Sparkline data={sysSeries} color="#EF4444" />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px]"><span className="text-neutral-500">Detak Jantung (bpm)</span><b className="text-ink">{hrSeries.length ? hrSeries[hrSeries.length - 1] : '—'}</b></div>
            <Sparkline data={hrSeries} color="#00BF63" />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px]"><span className="text-neutral-500">Jam Tidur</span><b className="text-ink">{sleepSeries.length ? sleepSeries[sleepSeries.length - 1] : '—'}</b></div>
            <Sparkline data={sleepSeries} color="#6366F1" />
          </div>
        </div>
        <p className="text-[10px] text-neutral-400">Catat vital & tidur secara rutin untuk melihat tren naik/turun di sini.</p>
      </Card>

      {/* VO2Max Calculator — estimasi kebugaran kardio (Uth-Sørensen) */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🫁 Kalkulator VO2Max</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="HR Istirahat (bpm)"><input type="number" value={hrRest} onChange={(e) => setHrRest(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
          <Field label="HR Maksimal (bpm)"><input type="number" value={hrMaxInput} onChange={(e) => setHrMaxInput(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
        </div>
        <p className="text-[10px] text-neutral-400">HR Maks default = 220 − usia. Ganti jika Anda tahu nilai aktual dari tes.</p>
        <div className="flex items-center justify-between rounded-xl p-2 text-white" style={{ background: vo2Cat.c }}>
          <span><span className="text-sm font-black">{vo2max}</span> <span className="text-xs font-bold">mL/kg/min · {vo2Cat.l}</span></span>
          <button onClick={() => logVo2Max(vo2max, 'Estimasi HR')} className="rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold">Catat</button>
        </div>
        <p className="text-[10px] text-neutral-400">Estimasi non-exercise (Uth-Sørensen).</p>

        {/* #5: Tes Cooper — lari 12 menit, paling akurat */}
        <div className="space-y-2 border-t border-neutral-100 pt-2">
          <div className="text-[11px] font-bold text-ink">🏃 Tes Cooper (lari 12 menit)</div>
          <div className="flex items-center gap-2">
            <Field label="Jarak 12 mnt (m)"><input type="number" value={cooperMeters} onChange={(e) => setCooperMeters(+e.target.value || 0)} className={inputClass + ' text-xs'} /></Field>
            <div className="flex-1 rounded-xl bg-brand-50 p-2 text-center text-brand-dark">
              <span className="text-sm font-black">{cooperVo2 > 0 ? cooperVo2 : '—'}</span> <span className="text-[10px] font-bold">mL/kg/min</span>
            </div>
            <button onClick={() => logVo2Max(cooperVo2, 'Tes Cooper')} disabled={cooperVo2 <= 0}
              className="rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Catat</button>
          </div>
          <p className="text-[10px] text-neutral-400">Lari sejauh mungkin dalam 12 menit (pakai GPS Tracker untuk ukur jarak), lalu masukkan jaraknya. Rumus Cooper paling akurat.</p>
        </div>

        {lastVo2 && (
          <div className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
            VO2Max terukur terakhir: <b className="text-ink">{lastVo2.value}</b> mL/kg/min · {lastVo2.method} · {timeAgo(lastVo2.at)}
          </div>
        )}
      </Card>

      {/* 7. Live Health News Ticker */}
      <Card className="space-y-1.5 overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-black text-ink">📰 Berita Kesehatan Live <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /></div>
        <div className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-700">
          <span className="font-bold text-brand-dark">[{HEALTH_NEWS[newsIdx].tag}]</span> {HEALTH_NEWS[newsIdx].title}
        </div>
      </Card>

      {/* 6. Pengingat Obat/Vitamin Realtime */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-ink">💊 Pengingat Obat & Vitamin</div>
          {notifPerm === 'granted'
            ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-dark">🔔 Notifikasi aktif</span>
            : <button onClick={requestNotif} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">Aktifkan Notifikasi</button>}
        </div>
        <div className="flex items-center gap-2">
          <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Nama obat/vitamin" className={inputClass + ' flex-1 text-xs'} />
          <input type="time" value={medTime} onChange={(e) => setMedTime(e.target.value)} className={inputClass + ' w-24 text-xs'} />
          <button onClick={() => { addMedReminder(medName, medTime); setMedName('') }} disabled={!medName.trim()}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">+</button>
        </div>
        {state.medReminders.length === 0 && <p className="text-xs text-neutral-400">Belum ada pengingat. Tambahkan satu di atas.</p>}
        {state.medReminders.map((m) => {
          const taken = m.takenDates.includes(today)
          const due = nowHM >= m.time && !taken
          return (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-xs">
              <span className={due ? 'font-bold text-red-500' : 'text-neutral-600'}>{m.name} · {m.time} {due ? '⏰ Saatnya!' : ''}</span>
              <button onClick={() => markMedTaken(m.id)} disabled={taken}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-50" style={{ background: taken ? '#E5F8EE' : '#00BF63', color: taken ? '#0B7A4B' : '#fff' }}>
                {taken ? '✓ Diminum' : 'Tandai'}
              </button>
            </div>
          )
        })}
      </Card>

      {/* 8. Pusat Edukasi Cepat */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">📚 Edukasi Cepat</div>
        {EDU_ARTICLES.map((a) => {
          const bookmarked = state.eduBookmarks.includes(a.id)
          return (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-[11px]">
              <span className="flex-1 pr-2 text-neutral-700">{a.title} <span className="text-neutral-400">· {a.minutes} mnt baca</span></span>
              <button onClick={() => toggleEduBookmark(a.id)} className="shrink-0 text-base">{bookmarked ? '🔖' : '📑'}</button>
            </div>
          )
        })}
      </Card>

      {/* 9. Kuis Fakta vs Mitos */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🧠 Kuis Fakta vs Mitos</div>
        <p className="text-xs text-neutral-600">{quiz.q}</p>
        <div className="flex gap-2">
          <button onClick={() => { const ok = quiz.answer === true; setQuizFeedback(ok ? 'right' : 'wrong'); answerQuiz(ok) }}
            className="flex-1 rounded-xl bg-brand/10 py-2 text-xs font-bold text-brand-dark">Fakta</button>
          <button onClick={() => { const ok = quiz.answer === false; setQuizFeedback(ok ? 'right' : 'wrong'); answerQuiz(ok) }}
            className="flex-1 rounded-xl bg-neutral-100 py-2 text-xs font-bold text-neutral-600">Mitos</button>
        </div>
        {quizFeedback && (
          <div className="flex items-center justify-between text-xs">
            <span className={quizFeedback === 'right' ? 'font-bold text-brand-dark' : 'font-bold text-red-500'}>{quizFeedback === 'right' ? '✓ Benar!' : '✕ Kurang tepat.'}</span>
            <button onClick={() => { setQuizIdx((i) => i + 1); setQuizFeedback(null) }} className="rounded-full bg-neutral-100 px-3 py-1 font-bold text-neutral-600">Lanjut →</button>
          </div>
        )}
        <p className="text-[11px] text-neutral-400">Skor: {state.quizScore.correct}/{state.quizScore.total}</p>
      </Card>

      {/* #4: Target & Badge Progres */}
      <Card className="space-y-3">
        <div className="text-xs font-black text-ink">🎯 Target Kesehatan</div>
        <div className="flex items-center gap-2">
          <select value={goalMetric} onChange={(e) => setGoalMetric(e.target.value as HealthGoal['metric'])} className={inputClass + ' w-28 text-xs'}>
            <option value="sleep">Tidur</option>
            <option value="checkin">Check-in beruntun</option>
            <option value="water">Minum air</option>
            <option value="steps">Langkah</option>
            <option value="custom">Lainnya</option>
          </select>
          {goalMetric === 'custom' && <input value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} placeholder="Nama target" className={inputClass + ' flex-1 text-xs'} />}
          <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(+e.target.value || 0)} className={inputClass + ' w-16 text-xs'} />
          <button onClick={() => {
            const label = goalMetric === 'custom' ? goalLabel : { sleep: 'Tidur', checkin: 'Check-in beruntun', water: 'Minum air', steps: 'Langkah harian', custom: '' }[goalMetric]
            addGoal({ metric: goalMetric, label, target: goalTarget, unit: metricUnit[goalMetric] })
            setGoalLabel('')
          }} disabled={goalTarget <= 0 || (goalMetric === 'custom' && !goalLabel.trim())}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">+</button>
        </div>
        {state.goals.length === 0 && <p className="text-xs text-neutral-400">Belum ada target. Tetapkan satu untuk mulai melacak progres.</p>}
        {state.goals.map((g) => {
          const cur = goalCurrent(g.metric)
          const pct = Math.min(100, Math.round((cur / g.target) * 100))
          const done = pct >= 100
          const trackable = g.metric === 'sleep' || g.metric === 'checkin'
          return (
            <div key={g.id} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-neutral-600">{done ? '🏅 ' : ''}{g.label} <span className="text-neutral-400">· target {g.target} {g.unit}</span></span>
                <button onClick={() => removeGoal(g.id)} className="text-neutral-300 hover:text-red-400">✕</button>
              </div>
              {trackable ? (
                <>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: done ? '#00BF63' : 'linear-gradient(90deg,#84CC16,#00BF63)' }} />
                  </div>
                  <div className="text-[10px] text-neutral-400">{cur} / {g.target} {g.unit} ({pct}%){done ? ' — tercapai! 🎉' : ''}</div>
                </>
              ) : (
                <div className="text-[10px] text-neutral-400">Pelacakan otomatis butuh integrasi wearable (rekomendasi mendatang).</div>
              )}
            </div>
          )
        })}
      </Card>

      {/* 10. Dashboard Ringkasan Realtime — agregasi semua metrik di atas */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-ink">📊 Ringkasan Realtime</div>
          <button onClick={exportReport} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">⬇ Ekspor Laporan</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl bg-neutral-50 p-2"><div className="text-neutral-400">BMI</div><div className="font-bold" style={{ color: bmiCat.c }}>{bmi.toFixed(1)} · {bmiCat.l}</div></div>
          <div className="rounded-xl bg-neutral-50 p-2"><div className="text-neutral-400">Tensi</div><div className="font-bold" style={{ color: bpCat.color }}>{sys}/{dia} · {bpCat.label}</div></div>
          <div className="rounded-xl bg-neutral-50 p-2"><div className="text-neutral-400">Tidur hari ini</div><div className="font-bold text-indigo-600">{todaySleep ? `${sleepScore}/100` : 'Belum dicatat'}</div></div>
          <div className="rounded-xl bg-neutral-50 p-2"><div className="text-neutral-400">Vital terakhir</div><div className="font-bold text-neutral-700">{lastVital ? timeAgo(lastVital.at) : 'Belum ada'}</div></div>
          <div className="rounded-xl bg-neutral-50 p-2"><div className="text-neutral-400">VO2Max</div><div className="font-bold" style={{ color: vo2Cat.c }}>{lastVo2 ? `${lastVo2.value} · ${lastVo2.method}` : `${vo2max} · ${vo2Cat.l}`}</div></div>
        </div>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN INTEGRATION WRAPPER COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function SportsSocialFeed() {
  const { state, account, addPost, addStory, heartbeat, logVo2Max, addGpsActivity } = useStore()
  const posts = state.posts
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou')

  // Open the composer when the mobile bottom-bar "+" is tapped (decoupled event).
  useEffect(() => {
    const open = () => setIsComposeOpen(true)
    window.addEventListener('panacea:compose', open)
    return () => window.removeEventListener('panacea:compose', open)
  }, [])

  // Default fallback user jika context/store kosong
  const currentUser = useMemo(() => ({
    email: account?.email || 'user@fitlife.id',
    name: account?.name || 'Ksatria Bugar',
    role: (account?.role as Role) || 'pasien'
  }), [account])

  // 3. Live "sedang aktif" presence — heartbeat while the feed is open.
  useEffect(() => {
    if (!account) return
    heartbeat()
    const t = setInterval(heartbeat, 60_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.email])

  // Handler memproses postingan standar dari modal → store global (persisten & terbagi)
  const handleAddNewPost = (newPost: SocialPost) => {
    addPost(newPost)
    setIsComposeOpen(false)
  }

  // Handler memproses share data aktivitas tracker langsung ke feed sosial
  const handleShareGpsToFeed = (gpsData: SharedGpsData) => {
    const elevNote = gpsData.elevGainM > 5 ? ` Elevasi +${Math.round(gpsData.elevGainM)}m (${gpsData.terrain}).` : ''
    const generatedCaption = `Saya baru saja menyelesaikan aktivitas ${gpsData.sport.emoji} ${gpsData.sport.name} sejauh ${fmtDist(gpsData.dist)} dengan durasi ${fmtD(gpsData.dur)}. Total pembakaran ${gpsData.kcal} kkal dengan rata-rata zona intensitas ${gpsData.hiit.zone}!${elevNote} 💪`
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
    // #5: persist activity-based VO2Max so the calculator can show a real measurement.
    if (gpsData.vo2Max > 0) logVo2Max(gpsData.vo2Max, `GPS ${gpsData.sport.name}`)
    // Auto-record the GPS activity (values computed from tracking, never manual)
    // → powers the competitive charts & leaderboard in Community.
    addGpsActivity({
      email: currentUser.email,
      name: currentUser.name,
      sport: gpsData.sport.name,
      sportType: gpsData.sport.type,
      emoji: gpsData.sport.emoji,
      distKm: Math.round((gpsData.dist / 1000) * 100) / 100,
      durSec: Math.round(gpsData.dur),
      avgSpeedKmh: Math.round(gpsData.speed * 10) / 10,
      kcal: gpsData.kcal,
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

      {/* Widget Atas: GPS Tracking Engine (collapsed → logo only) */}
      <GpsTrackerCard onShareToFeed={handleShareGpsToFeed} />

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

      {/* Feed tabs — For You / Mengikuti + search (gaya TikTok/Instagram) */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-center gap-6 border-b border-neutral-100 bg-white/85 px-4 py-2 backdrop-blur">
        <button onClick={() => setFeedTab('following')} className={`text-sm font-bold transition ${feedTab === 'following' ? 'text-ink' : 'text-neutral-400'}`}>
          Mengikuti{feedTab === 'following' && <span className="mx-auto mt-0.5 block h-0.5 w-6 rounded-full bg-brand" />}
        </button>
        <button onClick={() => setFeedTab('foryou')} className={`text-sm font-bold transition ${feedTab === 'foryou' ? 'text-ink' : 'text-neutral-400'}`}>
          Untuk Anda{feedTab === 'foryou' && <span className="mx-auto mt-0.5 block h-0.5 w-6 rounded-full bg-brand" />}
        </button>
        <button onClick={() => { window.location.hash = '#/search' }} aria-label="Cari" className="absolute right-4 grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100">
          <IconSearch size={18} />
        </button>
      </div>

      {/* RENDER FEED SOSIAL — beranda social media (Instagram/TikTok-style) */}
      <div className="space-y-4">
        {(() => {
          const visible = posts.filter((p) => !p.archived && !p.locked)
          const feed = feedTab === 'following'
            ? visible.filter((p) => p.authorEmail === currentUser.email || state.follows.includes(p.authorEmail))
            : visible
          if (feed.length === 0) {
            return (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-400">
                {feedTab === 'following'
                  ? <>Belum ada kiriman dari yang Anda ikuti. Buka <button onClick={() => setFeedTab('foryou')} className="font-bold text-brand-dark">Untuk Anda</button> atau <button onClick={() => { window.location.hash = '#/search' }} className="font-bold text-brand-dark">cari orang</button>.</>
                  : <>Belum ada kiriman. Ketuk tombol <span className="font-bold text-brand-dark">＋</span> di bawah untuk membuat postingan atau story.</>}
              </div>
            )
          }
          return feed.map((p) => <PostCard key={p.id} post={p} viewerEmail={currentUser.email} viewerName={currentUser.name} />)
        })()}
      </div>

      {/* Tombol mengambang "+" — buat post/story (ikon, universal, target besar) */}
      <button
        onClick={() => setIsComposeOpen(true)}
        aria-label="Buat postingan atau story baru"
        data-tour="compose"
        className="fixed bottom-8 right-5 z-30 hidden h-14 w-14 place-items-center rounded-full text-white shadow-lg transition active:scale-95 lg:grid"
        style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 8px 24px rgba(0,191,99,0.4)' }}
      >
        <IconPlus size={26} />
      </button>
    </div>
  )
}
