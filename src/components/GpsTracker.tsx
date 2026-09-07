import { useEffect, useMemo, useRef, useState } from 'react'
import RouteMap from './RouteMap'
import { ActivityShareCard, type ActivityShareData } from './ActivityShareCard'
import { GpsCompetition } from './GpsCompetition'
import { Card } from './ui'
import { useStore } from '../lib/store'
import {
  advanceGpsTrack,
  downsampleRoute,
  newGpsTrack,
  recentPaceSecPerKm,
  type GpsFix,
  type GpsTrackSport,
  type GpsTrackState,
} from '../lib/gpsTracking'

const SPORTS: { type: GpsTrackSport; name: string; emoji: string }[] = [
  { type: 'run', name: 'Run', emoji: '🏃' },
  { type: 'walk', name: 'Walk', emoji: '🚶' },
  { type: 'cycle', name: 'Ride', emoji: '🚴' },
]

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

function fmtPace(secPerKm?: number) {
  if (!secPerKm || !Number.isFinite(secPerKm)) return '—'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function accuracyLabel(m?: number) {
  if (m == null) return 'Waiting for fix'
  if (m <= 10) return `Excellent · ±${Math.round(m)} m`
  if (m <= 20) return `Good · ±${Math.round(m)} m`
  return `Usable · ±${Math.round(m)} m`
}

export function GpsTracker() {
  const { account, addGpsActivity } = useStore()
  const [sportType, setSportType] = useState<GpsTrackSport>('run')
  const [track, setTrack] = useState<GpsTrackState | null>(null)
  const trackRef = useRef<GpsTrackState | null>(null)
  const watchRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'recording' | 'stopped'>('idle')
  const [message, setMessage] = useState('')
  const [tick, setTick] = useState(0)
  const [shareData, setShareData] = useState<ActivityShareData | null>(null)
  const [saved, setSaved] = useState(false)

  const sport = SPORTS.find((x) => x.type === sportType) ?? SPORTS[0]

  useEffect(() => {
    if (phase !== 'recording') return
    const timer = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => () => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current)
  }, [])

  const elapsedSec = track ? Math.max(track.elapsedMs / 1000, phase === 'recording' ? (Date.now() - track.startedAtMs) / 1000 : 0) : 0
  void tick
  const movingSec = (track?.movingMs ?? 0) / 1000
  const distKm = (track?.totalM ?? 0) / 1000
  const livePace = track ? recentPaceSecPerKm(track) : undefined
  const avgPace = distKm > 0 && movingSec > 0 ? movingSec / distKm : undefined
  const lastPoint = track?.points[track.points.length - 1]
  const rejected = (track?.rejectedAccuracy ?? 0) + (track?.rejectedJump ?? 0) + (track?.rejectedInvalid ?? 0)

  const mapPoints = useMemo(
    () => (track?.points ?? []).map((p) => ({ lat: p.lat, lng: p.lng, segment: p.segment })),
    [track?.points],
  )

  function stopWatch() {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = null
  }

  function start() {
    setMessage('')
    setSaved(false)
    setShareData(null)
    if (!account) { setMessage('Sign in before recording an activity.'); return }
    if (!navigator.geolocation) { setMessage('This browser does not expose device geolocation.'); return }

    const state = newGpsTrack(Date.now())
    trackRef.current = state
    setTrack(state)
    setPhase('recording')

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const current = trackRef.current
        if (!current) return
        const fix: GpsFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
          timestampMs: position.timestamp || Date.now(),
          speedMps: Number.isFinite(position.coords.speed) ? position.coords.speed : undefined,
        }
        const next = advanceGpsTrack(current, fix, sportType)
        trackRef.current = next
        setTrack(next)
      },
      (error) => {
        const text = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Enable precise location for Panaceamed, then try again.'
          : error.code === error.TIMEOUT
            ? 'GPS fix timed out. Move outdoors or wait for a clearer satellite fix.'
            : 'GPS signal is unavailable right now.'
        setMessage(text)
        if (error.code === error.PERMISSION_DENIED) { stopWatch(); setPhase('idle') }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    )
  }

  function stop() {
    if (phase !== 'recording') return
    stopWatch()
    const current = trackRef.current
    if (!current) { setPhase('idle'); return }
    const finalState = { ...current, elapsedMs: Math.max(current.elapsedMs, Date.now() - current.startedAtMs) }
    trackRef.current = finalState
    setTrack(finalState)
    setPhase('stopped')

    const finalKm = finalState.totalM / 1000
    const finalMovingSec = finalState.movingMs / 1000
    if (!account || finalState.totalM < 50 || finalMovingSec < 10) {
      setMessage('Not saved: fewer than 50 accepted metres or 10 seconds of moving time. This prevents accidental GPS sessions from becoming health data.')
      return
    }

    const avgSpeedKmh = finalKm / (finalMovingSec / 3600)
    addGpsActivity({
      email: account.email,
      name: account.name,
      sport: sport.name,
      sportType: sport.type,
      emoji: sport.emoji,
      distKm: Math.round(finalKm * 1000) / 1000,
      durSec: Math.round(finalMovingSec),
      avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
      // 0 is the legacy store's sentinel for "not available". The UI never
      // displays it as a measured calorie value; no energy expenditure is
      // fabricated from GPS distance alone.
      kcal: 0,
      at: new Date(finalState.startedAtMs).toISOString(),
    })
    setSaved(true)
    setShareData({
      points: downsampleRoute(finalState.points.map((p) => ({ lat: p.lat, lng: p.lng, segment: p.segment }))),
      distKm: finalKm,
      durSec: Math.round(finalMovingSec),
      sportEmoji: sport.emoji,
      sportName: sport.name,
      authorName: account.name,
      at: new Date(finalState.startedAtMs).toISOString(),
    })
  }

  function reset() {
    stopWatch()
    trackRef.current = null
    setTrack(null)
    setPhase('idle')
    setMessage('')
    setSaved(false)
    setShareData(null)
  }

  return (
    <div className="space-y-4 pb-4">
      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-neutral-100 p-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-brand-dark">Device GPS recorder</div>
              <h2 className="mt-1 text-lg font-black text-ink dark:text-white">Track the route, not a guessed workout</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">Coordinates and GPS accuracy come from the device. Distance, moving time, pace and splits are derived from accepted fixes. Poor fixes and impossible jumps are discarded.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${phase === 'recording' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10'}`}>
              {phase === 'recording' ? '● RECORDING' : phase === 'stopped' ? 'STOPPED' : 'READY'}
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {SPORTS.map((x) => (
              <button key={x.type} disabled={phase === 'recording'} onClick={() => setSportType(x.type)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${sportType === x.type ? 'bg-ink text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
                {x.emoji} {x.name}
              </button>
            ))}
          </div>
        </div>

        <RouteMap points={mapPoints} height={260} />

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Distance" value={distKm ? distKm.toFixed(2) : '0.00'} unit="km" provenance="Derived" />
            <Metric label="Moving time" value={fmtDuration(movingSec)} provenance="Derived" />
            <Metric label="Live pace" value={fmtPace(livePace)} unit="/km" provenance="Derived" />
            <Metric label="Elapsed" value={fmtDuration(elapsedSec)} provenance="Clock" />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Info label="GPS accuracy" value={accuracyLabel(lastPoint?.accuracyM)} provenance="Measured by device" />
            <Info label="Auto-pause" value={track?.motion.moving ? 'Moving' : phase === 'recording' ? 'Paused / acquiring motion' : '—'} provenance="Derived with dwell + hysteresis" />
            <Info label="Rejected fixes" value={String(rejected)} provenance="QC: accuracy / impossible jump" />
          </div>

          <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 p-3 text-[11px] leading-relaxed text-neutral-500 dark:border-white/10">
            <b className="text-ink dark:text-white">Not inferred:</b> cadence and calories remain unavailable unless a compatible motion/energy source supplies them. Browser GPS alone is not enough to claim either measurement.
          </div>

          {message && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{message}</p>}
          {saved && <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">Saved from accepted device GPS fixes ✓</p>}

          <div className="mt-4 flex gap-2">
            {phase === 'idle' && <button onClick={start} className="flex-1 rounded-2xl bg-brand py-3 text-sm font-black text-white active:scale-[.99]">Start {sport.emoji} {sport.name}</button>}
            {phase === 'recording' && <button onClick={stop} className="flex-1 rounded-2xl bg-rose-600 py-3 text-sm font-black text-white active:scale-[.99]">Stop & save GPS activity</button>}
            {phase === 'stopped' && <button onClick={reset} className="flex-1 rounded-2xl bg-neutral-100 py-3 text-sm font-black text-neutral-700 dark:bg-white/10 dark:text-white">New activity</button>}
            {phase === 'stopped' && shareData && <button onClick={() => setShareData({ ...shareData })} className="flex-1 rounded-2xl bg-ink py-3 text-sm font-black text-white dark:bg-white dark:text-neutral-950">Share card</button>}
          </div>
        </div>
      </Card>

      {(track?.splits.length ?? 0) > 0 && (
        <Card className="!p-4">
          <div className="text-xs font-black text-ink dark:text-white">Kilometre splits · Derived</div>
          <div className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
            {track!.splits.slice(-10).map((s) => (
              <div key={s.km} className="flex items-center justify-between py-2 text-xs">
                <span className="font-bold text-neutral-600 dark:text-neutral-300">KM {s.km}</span>
                <span className="font-black tabular-nums text-ink dark:text-white">{fmtDuration(s.splitSec)} /km</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <GpsCompetition />

      {shareData && phase === 'stopped' && (
        <ActivityShareCard data={shareData} onClose={() => setShareData(null)} />
      )}
    </div>
  )
}

function Metric({ label, value, unit, provenance }: { label: string; value: string; unit?: string; provenance: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.05]">
      <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-1"><span className="text-2xl font-black tabular-nums text-ink dark:text-white">{value}</span>{unit && <span className="text-[10px] font-bold text-neutral-400">{unit}</span>}</div>
      <div className="mt-1 text-[9px] font-bold text-neutral-400">{provenance}</div>
    </div>
  )
}

function Info({ label, value, provenance }: { label: string; value: string; provenance: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
      <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1 text-xs font-black text-ink dark:text-white">{value}</div>
      <div className="mt-1 text-[9px] leading-snug text-neutral-400">{provenance}</div>
    </div>
  )
}

export default GpsTracker
