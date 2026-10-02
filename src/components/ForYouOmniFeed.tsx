import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { SocialPost } from '../lib/types'
import { getWorkouts } from '../lib/workoutStore'
import { calculateSeasonalRank, type RankedHealthEvidence } from '../lib/seasonalHealthSportRank'
import { ForYouDailyStack } from './ForYouDailyStack'
import { ForYouNetworkHub } from './ForYouNetworkHub'
import { ForYouSocialPulse } from './ForYouSocialPulse'
import { ForYouAffectArc } from './ForYouAffectArc'
import { ShareToFeed } from './ShareToFeed'
import { recordAffectEvent } from '../domains/affect'
import { Prosa } from './Prosa'

type FeedMode = 'all' | 'following' | 'fitness' | 'work' | 'people'

type FeedItem =
  | { kind: 'post'; id: string; post: SocialPost }
  | { kind: 'rank'; id: 'rank' }
  | { kind: 'network'; id: 'network' }
  | { kind: 'daily'; id: 'daily' }
  | { kind: 'community'; id: 'community' }
  | { kind: 'jobs'; id: 'jobs' }
  | { kind: 'pulse'; id: 'pulse' }
  | { kind: 'affect'; id: 'affect' }

const HEALTH_PROFILE_KEY = 'pmd_health_profile'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'U'
}

function timeAgo(iso: string) {
  const age = Math.max(0, Date.now() - Date.parse(iso))
  const minutes = Math.floor(age / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function readHealth(): RankedHealthEvidence | undefined {
  try {
    const raw = localStorage.getItem(HEALTH_PROFILE_KEY)
    if (!raw) return undefined
    const x = JSON.parse(raw) as Record<string, unknown>
    return {
      weightKg: typeof x.weightKg === 'number' ? x.weightKg : undefined,
      restingHr: typeof x.restingHr === 'number' ? x.restingHr : undefined,
      recoveryPct: typeof x.recoveryPct === 'number' ? x.recoveryPct : undefined,
      sleepHours: typeof x.sleepH === 'number' ? x.sleepH : undefined,
      updatedAt: typeof x.updatedAt === 'string' ? x.updatedAt : undefined,
      history: Array.isArray(x.history)
        ? x.history
          .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
          .map((row) => ({
            date: typeof row.date === 'string' ? row.date : '',
            recoveryPct: typeof row.recoveryPct === 'number' ? row.recoveryPct : undefined,
            sleepH: typeof row.sleepH === 'number' ? row.sleepH : undefined,
          }))
          .filter((row) => row.date)
        : [],
    }
  } catch {
    return undefined
  }
}

function useSeasonRank() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const update = () => setRevision((value) => value + 1)
    window.addEventListener('focus', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('focus', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return useMemo(() => calculateSeasonalRank({
    health: readHealth(),
    workouts: getWorkouts().map((workout) => ({
      id: workout.id,
      startedAt: workout.mulai,
      durationMinutes: Math.max(0, workout.durasi / 60),
      activeKcal: workout.kcal,
      paceSecondsPerKm: workout.paceSec,
      speedKmh: workout.kecepatanKmh,
      avgHr: workout.avgHr,
      maxHr: workout.maxHr,
      rpe: workout.rpe,
    })),
  }, 'health', new Date()), [revision])
}

function matchesMode(post: SocialPost, mode: FeedMode, me?: string, follows: readonly string[] = []) {
  if (mode === 'all') return true
  const text = `${post.activity ?? ''} ${post.caption ?? ''} ${post.articleTitle ?? ''}`.toLowerCase()
  if (mode === 'following') return follows.includes(post.authorEmail)
  if (mode === 'fitness') return /(run|running|gym|workout|strength|cycling|swim|sport|fitness|padel|badminton|walk|yoga|training)/.test(text)
  if (mode === 'work') return /(job|hiring|intern|research|startup|cofounder|co-founder|work|career|opportunity|lowongan|role|collaborat)/.test(text)
  if (mode === 'people') return post.authorEmail !== me
  return true
}

function postPriority(post: SocialPost, mode: FeedMode, me?: string, follows: readonly string[] = []) {
  const ageDays = Math.max(0, (Date.now() - Date.parse(post.at)) / 86_400_000)
  const freshness = Math.max(0, 1 - ageDays / 30)
  const social = Math.min(1, ((post.likes ?? 0) + (post.comments ?? 0) * 2 + (post.reposts ?? 0) * 2) / 30)
  const media = post.videoUrl ? 1 : post.photos?.length ? 0.75 : 0.35
  const selfPenalty = post.authorEmail === me ? -0.08 : 0
  const modeBonus = mode === 'all' ? 0 : matchesMode(post, mode, me, follows) ? 0.15 : 0
  return freshness * 0.48 + social * 0.24 + media * 0.20 + modeBonus + selfPenalty
}

function PostCard({ post }: { post: SocialPost }) {
  const { state, toggleLike, toggleRepost, toggleBookmark } = useStore()
  const avatar = state.profiles[post.authorEmail]?.avatar
  const media = post.photos?.[0]

  return (
    <article className="snap-start border-b border-white/[.08] bg-black py-4 sm:py-5">
      <div className="flex items-start gap-3 px-1">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[.045] text-[10px] font-black text-white/70">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials(post.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-black text-white/88">{post.authorName}</span>
            <span className="shrink-0 text-[9px] font-bold text-white/30">{timeAgo(post.at)}</span>
          </div>
          <div className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[.11em] text-white/28">
            {post.activity || post.postType || 'Post'}{post.location ? ` · ${post.location}` : ''}
          </div>
        </div>
        <Link to="/feed" className="shrink-0 text-[10px] font-black text-white/28 hover:text-white">•••</Link>
      </div>

      {(post.articleTitle || post.caption) && (
        <div className="px-1">
          {post.articleTitle && <h3 className="mt-3 text-[15px] font-black leading-snug text-white/88">{post.articleTitle}</h3>}
          {post.caption && <p className="mt-2 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-white/68">{post.caption}</p>}
        </div>
      )}

      {post.videoUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-[22px] border border-white/[.07] bg-[#080808]">
          <video
            src={post.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="mx-auto aspect-[9/16] max-h-[74vh] w-full bg-black object-contain sm:max-w-[430px]"
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white/72">
            Short
          </div>
        </div>
      ) : media ? (
        <div className="mt-4 overflow-hidden rounded-[22px] border border-white/[.07] bg-white/[.025]">
          <img src={media} alt="" loading="lazy" className="max-h-[72vh] w-full object-cover" />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[10px] font-black text-white/38">
        <button type="button" onClick={() => { toggleLike(post.id); recordAffectEvent('social_reaction', 1) }} className={post.likedByMe ? 'text-rose-300' : 'hover:text-white'}>{post.likedByMe ? '♥' : '♡'} {post.hideLikes ? '—' : post.likes ?? 0}</button>
        <Link to="/feed" className="hover:text-white">◌ {post.comments ?? 0}</Link>
        <button type="button" onClick={() => { toggleRepost(post.id); recordAffectEvent('social_reaction', 1) }} className={post.repostedByMe ? 'text-emerald-300' : 'hover:text-white'}>↻ {post.reposts ?? 0}</button>
        <button type="button" onClick={() => { toggleBookmark(post.id); recordAffectEvent('social_reaction', 0.5) }} className={post.bookmarkedByMe ? 'text-amber-300' : 'hover:text-white'}>{post.bookmarkedByMe ? '★ Saved' : '☆ Save'}</button>
        <span className="ml-auto flex flex-wrap gap-3">
          {typeof post.distanceKm === 'number' && <span>{post.distanceKm.toFixed(1)} km</span>}
          {typeof post.durationMin === 'number' && <span>{Math.round(post.durationMin)} min</span>}
          {typeof post.calories === 'number' && <span>{Math.round(post.calories)} kcal</span>}
        </span>
      </div>
    </article>
  )
}

function RankCard() {
  const result = useSeasonRank()
  return (
    <section className="snap-start border-b border-white/[.08] py-6">
      <Link to="/fitness-hub?view=ranked" onClick={() => recordAffectEvent('achievement_view', Math.min(1, result.progressToNext / 100))} className="block rounded-[24px] border border-cyan-300/15 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.12),transparent_36%),#05070a] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/50">Ranked Season</div>
            <div className="mt-1 text-xl font-black tracking-[-.03em] text-white">{result.currentTier.label}{result.division ? ` ${result.division}` : ''}</div>
            <div className="mt-1 text-xs font-black text-amber-300">★ {result.stars.toFixed(2)}</div>
          </div>
          <div className={`grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br ${result.currentTier.accent} text-3xl font-black text-black`}>
            {result.currentTier.glyph}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-white/70" style={{ width: `${result.progressToNext}%` }} />
        </div>
        <div className="mt-2 text-[10px] font-bold text-white/35">
          {result.nextTier ? `★ ${result.starsToNext.toFixed(2)} to ${result.nextTier.label}` : 'Season cap reached'} · each verified effort is one match
        </div>
      </Link>
    </section>
  )
}

function CommunityCard() {
  return (
    <section className="snap-start border-b border-white/[.08] py-6">
      <div className="rounded-[24px] border border-white/[.08] p-5">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">People & squads</div>
        <h3 className="mt-1 text-lg font-black tracking-[-.025em] text-white/84">Meet → join → talk → train together</h3>
        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-white/42">
          Discovery is only the first step. Move directly into messages, a club, meetup or community discussion without leaving For You.
        </Prosa>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link to="/connect" className="grid min-h-[48px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/62">Discover</Link>
          <Link to="/messages" className="grid min-h-[48px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/62">Messages</Link>
          <Link to="/clubs" className="grid min-h-[48px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/62">Squads</Link>
          <Link to="/?t=community" className="grid min-h-[48px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/62">Discuss</Link>
        </div>
      </div>
    </section>
  )
}

function JobsCard() {
  return (
    <section className="snap-start border-b border-white/[.08] py-6">
      <Link to="#network-os" className="block rounded-[24px] border border-white/[.08] p-5">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Opportunity feed</div>
        <h3 className="mt-1 text-lg font-black tracking-[-.025em] text-white/84">Jobs, research, collaborators, cofounders</h3>
        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-white/42">
          Community opportunity signals and external job search live in the same scroll, instead of another isolated career page.
        </Prosa>
        <div className="mt-3 text-[10px] font-black text-cyan-200/60">Open Network OS ↓</div>
      </Link>
    </section>
  )
}

function buildMixedFeed(posts: SocialPost[]): FeedItem[] {
  const items: FeedItem[] = []
  posts.forEach((post, index) => {
    items.push({ kind: 'post', id: `post-${post.id}`, post })
    if (index === 1) items.push({ kind: 'rank', id: 'rank' })
    if (index === 2) items.push({ kind: 'affect', id: 'affect' })
    if (index === 3) items.push({ kind: 'community', id: 'community' })
    if (index === 5) items.push({ kind: 'daily', id: 'daily' })
    if (index === 7) items.push({ kind: 'jobs', id: 'jobs' })
    if (index === 9) items.push({ kind: 'network', id: 'network' })
    if (index === 11) items.push({ kind: 'pulse', id: 'pulse' })
  })
  if (!posts.length) {
    items.push({ kind: 'rank', id: 'rank' }, { kind: 'affect', id: 'affect' }, { kind: 'community', id: 'community' }, { kind: 'daily', id: 'daily' }, { kind: 'network', id: 'network' })
  } else {
    if (!items.some((item) => item.kind === 'rank')) items.push({ kind: 'rank', id: 'rank' })
    if (!items.some((item) => item.kind === 'affect')) items.push({ kind: 'affect', id: 'affect' })
    if (!items.some((item) => item.kind === 'community')) items.push({ kind: 'community', id: 'community' })
    if (!items.some((item) => item.kind === 'daily')) items.push({ kind: 'daily', id: 'daily' })
    if (!items.some((item) => item.kind === 'network')) items.push({ kind: 'network', id: 'network' })
    if (!items.some((item) => item.kind === 'pulse')) items.push({ kind: 'pulse', id: 'pulse' })
  }
  return items
}

export function ForYouOmniFeed() {
  const { state, account } = useStore()
  const [mode, setMode] = useState<FeedMode>('all')
  const [visible, setVisible] = useState(10)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const posts = useMemo(() => [...state.posts]
    .filter((post) => !post.archived && !post.locked)
    .filter((post) => matchesMode(post, mode, account?.email, state.follows))
    .sort((a, b) => postPriority(b, mode, account?.email, state.follows) - postPriority(a, mode, account?.email, state.follows)), [state.posts, state.follows, mode, account?.email])

  const items = useMemo(() => buildMixedFeed(posts), [posts])

  useEffect(() => setVisible(10), [mode])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible((value) => {
          const next = Math.min(items.length, value + 6)
          if (next > value) recordAffectEvent('feed_reveal', next - value)
          return next
        })
      }
    }, { rootMargin: '500px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [items.length])

  return (
    <section aria-label="All-in-one For You feed" className="relative">
      <nav className="sticky top-[env(safe-area-inset-top)] z-30 -mx-2 border-y border-white/[.08] bg-black/90 px-2 backdrop-blur-xl" aria-label="For You feed modes">
        <div className="no-scrollbar flex overflow-x-auto">
          {([
            ['all', 'For You'],
            ['following', 'Following'],
            ['fitness', 'Fitness'],
            ['work', 'Work'],
            ['people', 'People'],
          ] as Array<[FeedMode, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setMode(value); recordAffectEvent('mode_switch') }}
              className={`relative min-h-[48px] shrink-0 px-4 text-[11px] font-black transition ${
                mode === value ? 'text-white' : 'text-white/38 hover:text-white/70'
              }`}
            >
              {label}
              {mode === value && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-white" />}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-2xl">
        <div className="border-b border-white/[.08] py-4">
          <div className="flex items-center gap-3">
            <ShareToFeed defaultCaption="" activity="For You" />
            <Link to="/messages" className="grid min-h-[42px] place-items-center rounded-full border border-white/10 px-4 text-[10px] font-black text-white/56">Messages</Link>
            <Link to="/clubs" className="grid min-h-[42px] place-items-center rounded-full border border-white/10 px-4 text-[10px] font-black text-white/56">Squads</Link>
          </div>
        </div>

        {state.stories.filter((story) => Date.now() - Date.parse(story.at) < 86_400_000).length > 0 && (
          <div className="no-scrollbar flex gap-3 overflow-x-auto border-b border-white/[.08] py-4" aria-label="Stories">
            {state.stories
              .filter((story) => Date.now() - Date.parse(story.at) < 86_400_000)
              .slice(0, 12)
              .map((story) => (
                <Link key={story.id} to="/feed" className="w-16 shrink-0 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-emerald-300/65 bg-white/[.04] p-0.5">
                    {story.image ? <img src={story.image} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="grid h-full w-full place-items-center rounded-full bg-white/[.05] text-[10px] font-black text-white/70">{initials(story.authorName)}</span>}
                  </span>
                  <span className="mt-1 block truncate text-[9px] font-black text-white/42">{story.authorName.split(/\s+/)[0]}</span>
                </Link>
              ))}
          </div>
        )}

        {items.slice(0, visible).map((item) => {
          if (item.kind === 'post') return <PostCard key={item.id} post={item.post} />
          if (item.kind === 'rank') return <RankCard key={item.id} />
          if (item.kind === 'affect') return <ForYouAffectArc key={item.id} />
          if (item.kind === 'community') return <CommunityCard key={item.id} />
          if (item.kind === 'jobs') return <JobsCard key={item.id} />
          if (item.kind === 'daily') return <section key={item.id} className="snap-start border-b border-white/[.08] py-6"><ForYouDailyStack /></section>
          if (item.kind === 'pulse') return <section key={item.id} className="snap-start border-b border-white/[.08] py-6"><ForYouSocialPulse /></section>
          return <section id="network-os" key={item.id} className="snap-start border-b border-white/[.08] py-6"><ForYouNetworkHub /></section>
        })}

        {!posts.length && (
          <div className="border-b border-white/[.08] py-8 text-center">
            <div className="text-sm font-black text-white/58">Your real social feed is still empty.</div>
            <div className="mt-1 text-[11px] text-white/32">Panacea shows product surfaces instead of fabricating people or posts.</div>
            <Link to="/feed" className="mt-4 inline-grid min-h-[42px] place-items-center rounded-full border border-white/12 px-5 text-[10px] font-black text-white/62">Create the first post ↗</Link>
          </div>
        )}

        <div ref={sentinelRef} className="h-16" aria-hidden />
      </div>
    </section>
  )
}

export default ForYouOmniFeed
