import { useEffect, useState } from 'react'
import { Card, SectionTitle, Badge, Button, inputClass } from '../components/ui'
import { IconActivity, IconTimer } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Live sports scores — football (multi-league), NBA, NFL, F1. Sources are free
// (ESPN public site API + Jolpica-F1), see server/src/sports.ts for the full
// honesty note: Liga 1/2 Indonesia, tennis, and padel have NO reliable free
// source, so they're shown as an explicit "belum tersedia" list rather than
// faked. Favorite teams are saved server-side and trigger a notification
// (goal/full-time) via the existing push infra, polled every ~90s server-side.
// ─────────────────────────────────────────────────────────────────────────────

interface NormalizedEvent {
  id: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  statusDetail: string
  home: { name: string; abbrev: string; logo?: string; score?: string }
  away: { name: string; abbrev: string; logo?: string; score?: string }
}

const STATE_BADGE: Record<NormalizedEvent['state'], { label: string; tone: 'brand' | 'critical' | 'neutral' }> = {
  in: { label: 'LIVE', tone: 'critical' },
  post: { label: 'Finished', tone: 'neutral' },
  pre: { label: 'Upcoming', tone: 'brand' },
}

// Real team crest from the source API (ESPN) when available; falls back to a
// monogram badge (initials) if there's no logo URL or it fails to load, so a
// broken/missing image never leaves a blank gap.
function TeamLogo({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  const initials = alt.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  if (!src || broken) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-[9px] font-black text-neutral-500">
        {initials}
      </span>
    )
  }
  return <img src={src} alt="" className="h-6 w-6 shrink-0 rounded-full object-contain" onError={() => setBroken(true)} />
}

export function SportsScores() {
  const [leagues, setLeagues] = useState<{ id: string; label: string }[]>([])
  const [league, setLeague] = useState<string>('epl')
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [f1, setF1] = useState<{ next?: { raceName: string; circuit: string; location: string; date: string }; lastRaceName?: string; lastPodium?: { position: string; driver: string; constructor: string }[] } | null>(null)
  const [motogp, setMotogp] = useState<{ next?: { name: string; circuit: string; country: string; date: string }; lastRaceName?: string; lastRaceDate?: string } | null>(null)

  useEffect(() => {
    if (!backendEnabled) { setLoading(false); return }
    api.getSportsLeagues().then((r) => setLeagues(r.leagues)).catch(() => {})
    api.getSportsFavorites().then(setFavorites).catch(() => {})
  }, [])

  useEffect(() => {
    if (!backendEnabled) return
    setLoading(true); setErr('')
    if (league === 'f1') {
      api.getF1Info().then((r) => { setF1(r); setEvents([]) }).catch(() => setErr('Failed to load F1 data.')).finally(() => setLoading(false))
      return
    }
    if (league === 'motogp') {
      api.getMotoGpInfo().then((r) => { setMotogp(r); setEvents([]) }).catch(() => setErr('Failed to load MotoGP data.')).finally(() => setLoading(false))
      return
    }
    api.getSportsScores(league)
      .then((r) => {
        setEvents(r.events as NormalizedEvent[])
        if (r.error === 'not_configured') setErr('This league needs the data provider to be set up on the server (APISPORTS_KEY). It will work once that key is configured.')
        else if (r.error === 'no_slam_active') setErr('No Grand Slam is being played right now. This card shows live matches during the Australian Open (Jan), French Open (May-Jun), Wimbledon (Jun-Jul), and US Open (Aug-Sep).')
        else if (r.error === 'league_not_found') setErr('Couldn\'t find this league on the data provider right now — please try again later.')
        else if (r.error) setErr('The data source is having issues, please try again later.')
      })
      .catch(() => setErr('Failed to load scores.'))
      .finally(() => setLoading(false))
  }, [league])

  function teamKey(name: string) { return `${league}:${name}` }
  function isFav(name: string) { return favorites.includes(teamKey(name)) }
  async function toggleFav(name: string) {
    const key = teamKey(name)
    const next = isFav(name) ? favorites.filter((f) => f !== key) : [...favorites, key]
    setFavorites(next)
    try { await api.saveSportsFavorites(next) } catch { /* ignore */ }
  }

  if (!backendEnabled) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-neutral-400">
        Live scores require an active server — not available in local demo mode.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Live Scores" subtitle="Football, NBA, NFL, MLB, NHL, UFC, tennis, cricket, F1, MotoGP — free sources" />
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">Choose league / sport</span>
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className={inputClass + ' cursor-pointer font-semibold'}
          >
            {[...leagues, { id: 'f1', label: 'F1' }, { id: 'motogp', label: 'MotoGP' }].map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </label>
      </Card>

      {loading && <div className="py-8 text-center text-sm text-neutral-400">Loading…</div>}
      {err && <div className="rounded-xl bg-rose-50 p-3 text-center text-xs text-rose-600">{err}</div>}

      {league === 'motogp' && motogp && !loading && (
        <Card className="!p-5 space-y-4">
          {motogp.next ? (
            <div>
              <SectionTitle icon={<IconTimer size={20} />} title="Next Race" subtitle={motogp.next.name} />
              <p className="mt-1 text-xs text-neutral-500">{motogp.next.circuit}{motogp.next.country ? ` · ${motogp.next.country}` : ''}</p>
              {motogp.next.date && <p className="mt-0.5 text-xs font-semibold text-brand-dark">{new Date(motogp.next.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
            </div>
          ) : (
            <p className="text-xs text-neutral-400">No upcoming MotoGP race found right now.</p>
          )}
          {motogp.lastRaceName && (
            <div className="border-t border-neutral-100 pt-3">
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Last Race</div>
              <p className="mt-1 text-sm font-semibold text-ink">{motogp.lastRaceName}</p>
              {motogp.lastRaceDate && <p className="text-[11px] text-neutral-400">{new Date(motogp.lastRaceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            </div>
          )}
        </Card>
      )}

      {league === 'f1' && f1 && !loading && (
        <Card className="!p-5 space-y-4">
          {f1.next && (
            <div>
              <SectionTitle icon={<IconTimer size={20} />} title="Next Race" subtitle={f1.next.raceName} />
              <p className="mt-1 text-xs text-neutral-500">{f1.next.circuit} · {f1.next.location}</p>
              <p className="mt-0.5 text-xs font-semibold text-brand-dark">{new Date(f1.next.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          )}
          {f1.lastPodium && f1.lastPodium.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Last Podium — {f1.lastRaceName}</div>
              <div className="mt-2 space-y-1.5">
                {f1.lastPodium.map((p) => (
                  <div key={p.position} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs">
                    <span className="font-bold text-ink">P{p.position} · {p.driver}</span>
                    <span className="text-neutral-500">{p.constructor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!f1.next && !f1.lastPodium && <p className="text-xs text-neutral-400">F1 data is unavailable right now.</p>}
        </Card>
      )}

      {league !== 'f1' && league !== 'motogp' && !loading && !err && (
        <div className="space-y-2">
          {events.length === 0 && <div className="py-8 text-center text-xs text-neutral-400">No matches for this league right now.</div>}
          {events.map((ev) => {
            const badge = STATE_BADGE[ev.state]
            return (
              <Card key={ev.id} className="!p-4">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{new Date(ev.startTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <Badge tone={badge.tone}>{ev.state === 'in' ? `🔴 ${ev.statusDetail || badge.label}` : badge.label}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button onClick={() => toggleFav(ev.home.name)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className={`shrink-0 text-sm ${isFav(ev.home.name) ? 'text-amber-400' : 'text-neutral-300'}`}>★</span>
                    <TeamLogo src={ev.home.logo} alt={ev.home.name} />
                    <span className="truncate text-sm font-semibold text-ink">{ev.home.name}</span>
                  </button>
                  <span className="shrink-0 whitespace-nowrap px-1 text-lg font-black text-ink">{ev.home.score ?? '-'} : {ev.away.score ?? '-'}</span>
                  <button onClick={() => toggleFav(ev.away.name)} className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                    <span className="truncate text-sm font-semibold text-ink">{ev.away.name}</span>
                    <TeamLogo src={ev.away.logo} alt={ev.away.name} />
                    <span className={`shrink-0 text-sm ${isFav(ev.away.name) ? 'text-amber-400' : 'text-neutral-300'}`}>★</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-neutral-400">
        Star ★ your favorite teams to get goal / final-result notifications (checked server-side every ~90 seconds).
      </p>
    </div>
  )
}

export default SportsScores
