import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'
import type { SocialPost } from '../lib/types'

type FootballEvent = {
  id: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  statusDetail?: string
  home: { name: string; abbrev: string; logo?: string; score?: string }
  away: { name: string; abbrev: string; logo?: string; score?: string }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'U'
}

function timeAgo(iso: string) {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function PostPreview({ post }: { post: SocialPost }) {
  const { state } = useStore()
  const avatar = state.profiles[post.authorEmail]?.avatar
  const media = post.photos?.[0]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group grid min-w-0 gap-3 border-b border-white/[.075] py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_104px]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[.045] text-[9px] font-black text-white/70">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials(post.authorName)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-black text-white/88">{post.authorName}</div>
            <div className="truncate text-[9px] font-bold uppercase tracking-[.12em] text-white/32">
              {post.activity || 'Moment'} · {timeAgo(post.at)}
              {post.location ? ` · ${post.location}` : ''}
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-relaxed text-white/66">
          {post.caption || post.articleTitle || 'Shared a new moment.'}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black text-white/34">
          {typeof post.distanceKm === 'number' && <span>{post.distanceKm.toFixed(1)} km</span>}
          {typeof post.durationMin === 'number' && <span>{Math.round(post.durationMin)} min</span>}
          {typeof post.steps === 'number' && <span>{post.steps.toLocaleString()} steps</span>}
          <span>♡ {post.likes ?? 0}</span>
          <span>↻ {post.reposts ?? 0}</span>
        </div>
      </div>

      {media && (
        <div className="hidden overflow-hidden rounded-[18px] border border-white/[.08] bg-white/[.025] sm:block">
          <img src={media} alt="" className="h-full min-h-[92px] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
    </motion.article>
  )
}

function FootballWidget() {
  const [event, setEvent] = useState<FootballEvent | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'offline'>('loading')

  useEffect(() => {
    let disposed = false

    const load = async () => {
      if (!backendEnabled) {
        if (!disposed) setState('offline')
        return
      }
      try {
        const result = await api.getSportsScores('epl')
        if (disposed) return
        const events = (result.events ?? []) as FootballEvent[]
        const selected = events.find((item) => item.state === 'in')
          ?? events.find((item) => item.state === 'pre')
          ?? events[0]
          ?? null
        setEvent(selected)
        setState(selected ? 'ready' : 'empty')
      } catch {
        if (!disposed) setState('offline')
      }
    }

    void load()
    const timer = window.setInterval(load, 90_000)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <Link to="/sports-scores" className="pmd-social-live-widget group" aria-label="Open live sports scores">
      <div className="flex items-center justify-between gap-3">
        <span className="pmd-social-widget-label">Football</span>
        <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/28">
          {event?.state === 'in' ? '● live' : 'EPL'}
        </span>
      </div>

      {state === 'ready' && event ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-sm font-black text-white/80">{event.home.abbrev || event.home.name}</span>
            <strong className="shrink-0 text-2xl font-black tracking-[-.06em] tabular-nums text-white">
              {event.home.score ?? '–'} <span className="text-white/24">:</span> {event.away.score ?? '–'}
            </strong>
            <span className="min-w-0 flex-1 truncate text-right text-sm font-black text-white/80">{event.away.abbrev || event.away.name}</span>
          </div>
          <div className="mt-4 truncate text-[10px] font-bold text-white/34">
            {event.state === 'pre'
              ? new Date(event.startTime).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
              : event.statusDetail || (event.state === 'post' ? 'Finished' : 'Live')}
          </div>
        </>
      ) : (
        <div className="mt-5 flex min-h-[58px] items-end text-sm font-black text-white/48">
          {state === 'loading' ? 'Loading live score…' : state === 'empty' ? 'No EPL match right now' : 'Live source unavailable'}
        </div>
      )}
      <span className="pmd-social-widget-open">All scores ↗</span>
    </Link>
  )
}

function GpsWidget() {
  const { state } = useStore()
  const activities = state.gpsActivities ?? []

  const summary = useMemo(() => {
    const now = Date.now()
    const weekStart = now - 7 * 24 * 60 * 60 * 1000
    const weekly = activities.filter((activity) => {
      const at = new Date(activity.at).getTime()
      return Number.isFinite(at) && at >= weekStart && at <= now
    })
    const distanceKm = weekly.reduce((sum, activity) => sum + (Number.isFinite(activity.distKm) ? activity.distKm : 0), 0)
    const movingSec = weekly.reduce((sum, activity) => sum + (Number.isFinite(activity.durSec) ? activity.durSec : 0), 0)
    const latest = [...activities].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0]
    return { distanceKm, movingSec, count: weekly.length, latest }
  }, [activities])

  const hours = Math.floor(summary.movingSec / 3600)
  const minutes = Math.round((summary.movingSec % 3600) / 60)

  return (
    <Link to="/latihan?t=gps" className="pmd-social-live-widget group" aria-label="Open GPS activity tracker">
      <div className="flex items-center justify-between gap-3">
        <span className="pmd-social-widget-label">GPS</span>
        <span className="text-[9px] font-black uppercase tracking-[.13em] text-white/28">7 days</span>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <strong className="text-4xl font-black tracking-[-.07em] tabular-nums text-white">{summary.distanceKm.toFixed(1)}</strong>
        <span className="pb-1 text-[10px] font-black uppercase tracking-[.12em] text-white/32">km</span>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-white/36">
        <span>{summary.count} sessions</span>
        <span>{hours ? `${hours}h ` : ''}{minutes}m moving</span>
        {summary.latest && <span className="truncate">{summary.latest.emoji} {summary.latest.sport}</span>}
      </div>
      <span className="pmd-social-widget-open">Track route ↗</span>
    </Link>
  )
}

export function ForYouSocialPulse() {
  const { state, account } = useStore()

  const posts = useMemo(
    () => [...state.posts]
      .filter((post) => !post.archived && !post.locked)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [state.posts],
  )

  const people = useMemo(() => {
    const seen = new Set<string>()
    const result: SocialPost[] = []
    for (const post of posts) {
      if (seen.has(post.authorEmail)) continue
      seen.add(post.authorEmail)
      result.push(post)
      if (result.length >= 10) break
    }
    return result
  }, [posts])

  return (
    <section className="pmd-social-pulse" aria-label="For You social pulse">
      <header className="pmd-social-pulse-head">
        <div className="min-w-0">
          <div className="pmd-social-kicker">For You · live</div>
          <h2 className="pmd-social-title">People, movement and what is happening now</h2>
        </div>
        <Link to="/feed" className="pmd-social-round-action" aria-label="Open social feed">＋</Link>
      </header>

      <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-1" aria-label="Recent people">
        <Link to="/feed" className="flex w-14 shrink-0 flex-col items-center gap-1.5">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-white/20 text-lg font-light text-white/50">＋</span>
          <span className="w-full truncate text-center text-[9px] font-black text-white/34">Share</span>
        </Link>
        {people.map((post) => {
          const avatar = state.profiles[post.authorEmail]?.avatar
          return (
            <Link key={post.authorEmail} to="/feed" className="flex w-14 shrink-0 flex-col items-center gap-1.5">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[.045] text-[9px] font-black text-white/70 ring-1 ring-cyan-200/10">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials(post.authorName)}
              </span>
              <span className="w-full truncate text-center text-[9px] font-black text-white/42">{post.authorName.split(/\s+/)[0]}</span>
            </Link>
          )
        })}
      </div>

      <div className="pmd-social-live-grid">
        <GpsWidget />
        <FootballWidget />
      </div>

      <div className="pmd-social-feed-preview">
        <div className="flex items-center justify-between gap-3 border-b border-white/[.075] pb-2">
          <span className="pmd-social-widget-label">Your feed</span>
          <Link to="/feed" className="text-[10px] font-black text-white/40 transition hover:text-white">Open feed ↗</Link>
        </div>

        {posts.length ? posts.slice(0, 2).map((post) => <PostPreview key={post.id} post={post} />) : (
          <Link to="/feed" className="flex min-h-[104px] items-center justify-between gap-4 py-4 text-sm font-bold text-white/45">
            <span>{account ? 'Your social feed is ready for its first post.' : 'Sign in to build your personal feed.'}</span>
            <span aria-hidden>↗</span>
          </Link>
        )}
      </div>

      <nav className="pmd-social-destination-row" aria-label="More For You">
        {[
          ['Community', '/?t=community'],
          ['Clubs', '/?t=clubs'],
          ['Markets', '/?t=markets'],
          ['Finance', '/?t=finance'],
          ['Faith', '/?t=religion'],
          ['Scores', '/?t=scores'],
        ].map(([label, to]) => (
          <Link key={label} to={to} className="pmd-social-destination">{label}<span aria-hidden>↗</span></Link>
        ))}
      </nav>
    </section>
  )
}

export default ForYouSocialPulse
