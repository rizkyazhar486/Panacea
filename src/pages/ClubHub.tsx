import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const MeetMap = lazy(() => import('../components/MeetMap'))
import { Card, SectionTitle, Badge, inputClass } from '../components/ui'
import { IconUsers, IconActivity, IconMapPin } from '../components/icons'
import { api, type BackendMeet } from '../lib/api'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Club Hub — community sports & health clubs, scheduled meets with join
// capacity, meet detail (participants, fee, notes, calendar export, maps
// link), and a personal "My Hub" schedule of everything joined. Meets are
// real and server-persisted (see server/src/store.ts `meets`) — anyone can
// host one, and the "X/Y joined" count is the actual number of accounts that
// RSVP'd, not a preset number. Calendar export generates a standards-
// compliant .ics file locally; the maps link opens the venue in Google Maps
// — no API keys for either.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_clubhub_v1'

interface Persisted { joinedClubs: string[]; joinedEvents: string[] }
function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { joinedClubs: [], joinedEvents: [], ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { joinedClubs: [], joinedEvents: [] }
}

// No fake member counts: this is a directory of sports/formats you can host or
// join a real meet under. "Members" isn't shown because Club Hub doesn't yet
// track club-level membership separately from meet RSVPs — only claim numbers
// that are real.
interface Club { id: string; name: string; emoji: string; level: string; sport: string; desc: string }
const CLUBS: Club[] = [
  { id: 'sunrise-run', name: 'Sunrise Run Club', emoji: '🏃', level: 'All levels', sport: 'Running', desc: 'Easy-pace social runs every weekend morning — zone 2, no one left behind.' },
  { id: 'padel-pulse', name: 'Padel Pulse', emoji: '🎾', level: 'Beginner-Intermediate', sport: 'Padel', desc: 'Social padel mixers and Americano-format sessions.' },
  { id: 'shuttle-squad', name: 'Shuttle Squad', emoji: '🏸', level: 'All levels', sport: 'Badminton', desc: 'Doubles rotation nights, casual and competitive courts.' },
  { id: 'iron-circle', name: 'Iron Circle', emoji: '🏋️', level: 'Intermediate', sport: 'Strength', desc: 'Progressive-overload group lifting with form-check culture.' },
  { id: 'dokter-jalan', name: 'Walk With A Doctor', emoji: '🩺', level: 'All levels', sport: 'Health walk', desc: 'Clinician-led weekend walks — bring your questions, leave with 8,000 steps.' },
  { id: 'flow-yoga', name: 'Morning Flow Yoga', emoji: '🧘', level: 'All levels', sport: 'Yoga', desc: 'Sunrise vinyasa in the park; mats provided for first-timers.' },
]

// Meet is the server's BackendMeet — a real, shared record. "Joined" count
// is always `participants.length`, never a stored number, so it can't drift
// from reality.
type Meet = BackendMeet

const TAGS = ['Social', 'Training', 'Class', 'Competitive', 'Health walk', 'Americano'] as const
const EMOJI_BY_SPORT: Record<string, string> = { Running: '🏃', Padel: '🎾', Badminton: '🏸', Strength: '🏋️', 'Health walk': '🩺', Yoga: '🧘' }

interface Evt { id: string; title: string; org: string; date: string; format: string; teams: number; status: 'registration' | 'happening'; emoji: string; venue: string }
const EVENTS: Evt[] = [
  { id: 'e1', title: 'Panacea Community Run 2026', org: 'Sunrise Run Club', date: 'Aug 9', format: '5K / 10K fun run', teams: 214, status: 'registration', emoji: '🏅', venue: 'GBK Senayan' },
  { id: 'e2', title: 'Padel League Season 2', org: 'Padel Pulse', date: 'Jul 26', format: 'Round robin, 6 weeks', teams: 18, status: 'happening', emoji: '🏆', venue: 'Padel Parc Simprug' },
  { id: 'e3', title: 'Healthy Heart Charity Walk', org: 'Walk With A Doctor', date: 'Aug 17', format: '3K walk + health screening booths', teams: 130, status: 'registration', emoji: '❤️', venue: 'Taman Menteng' },
  { id: 'e4', title: 'Smash Cup Badminton Open', org: 'Shuttle Squad', date: 'Jul 20', format: 'Knockout doubles', teams: 32, status: 'happening', emoji: '🏸', venue: 'GOR Bulungan' },
]

const DAY_MS = 86400000
function meetDate(m: Meet): Date {
  const d = new Date(Date.now() + m.day * DAY_MS)
  const [h, min] = m.time.split(':').map(Number)
  d.setHours(h, min, 0, 0)
  return d
}
function dayLabel(offset: number): { dow: string; date: number } {
  const d = new Date(Date.now() + offset * DAY_MS)
  return { dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), date: d.getDate() }
}
function dayName(offset: number): string {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  return new Date(Date.now() + offset * DAY_MS).toLocaleDateString('en-US', { weekday: 'long' })
}
function fmtFee(rp: number): string {
  return rp === 0 ? 'Free' : 'Rp' + rp.toLocaleString('id-ID')
}
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
function downloadIcs(m: Meet) {
  const start = meetDate(m)
  const end = new Date(start.getTime() + m.durH * 3600000)
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Panaceamed//ClubHub//EN', 'BEGIN:VEVENT',
    `UID:${m.id}@panaceamed.id`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${m.title} — ${m.club}`, `LOCATION:${m.venue}, ${m.address}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${m.id}-${m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
function mapsUrl(m: Meet): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${m.venue}, ${m.address}`)
}

type Tab = 'myhub' | 'meets' | 'clubs' | 'events'
type Rsvp = 'none' | 'maybe' | 'joined'

export function ClubHub() {
  const { account } = useStore()
  const email = account?.email || ''
  const [tab, setTab] = useState<Tab>('meets')
  const [day, setDay] = useState(0)
  const [meetView, setMeetView] = useState<'list' | 'map'>('list')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<Meet | null>(null)
  const [p, setP] = useState<Persisted>(loadPersisted)
  const [meets, setMeets] = useState<Meet[]>([])
  const [loadingMeets, setLoadingMeets] = useState(true)
  const [showHost, setShowHost] = useState(false)
  const [rsvpError, setRsvpError] = useState('')

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
  }, [p])

  const refreshMeets = () => {
    api.meets().then(setMeets).catch(() => {}).finally(() => setLoadingMeets(false))
  }
  useEffect(() => { refreshMeets() }, [])

  const rsvpOf = (m: Meet): Rsvp => (m.participants.includes(email) ? 'joined' : m.maybes.includes(email) ? 'maybe' : 'none')
  const setRsvp = async (id: string, r: Rsvp) => {
    setRsvpError('')
    try {
      const updated = await api.rsvpMeet(id, r)
      setMeets((list) => list.map((m) => (m.id === id ? updated : m)))
      setDetail((d) => (d && d.id === id ? updated : d))
    } catch (e) {
      setRsvpError(e instanceof Error && e.message === 'full' ? 'This meet just filled up — try another one.' : 'Could not update your RSVP — check your connection and try again.')
    }
  }
  const toggleIn = (list: 'joinedClubs' | 'joinedEvents', id: string) =>
    setP((s) => ({ ...s, [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id] }))

  const q = query.trim().toLowerCase()
  const meetsToday = useMemo(
    () => meets.filter((m) => m.day === day && (!q || (m.title + m.club + m.venue + m.tag).toLowerCase().includes(q))).sort((a, b) => a.time.localeCompare(b.time)),
    [meets, day, q],
  )
  const clubsFiltered = CLUBS.filter((c) => !q || (c.name + c.sport + c.desc).toLowerCase().includes(q))
  const eventsFiltered = EVENTS.filter((e) => !q || (e.title + e.org + e.format).toLowerCase().includes(q))

  const myMeets = useMemo(
    () => meets.filter((m) => rsvpOf(m) !== 'none').sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
    [meets, email],
  )
  const myMeetsByDay = useMemo(() => {
    const groups: { day: number; meets: Meet[] }[] = []
    for (const m of myMeets) {
      const g = groups.find((x) => x.day === m.day)
      if (g) g.meets.push(m)
      else groups.push({ day: m.day, meets: [m] })
    }
    return groups
  }, [myMeets])
  const myClubs = CLUBS.filter((c) => p.joinedClubs.includes(c.id))
  const myEvents = EVENTS.filter((e) => p.joinedEvents.includes(e.id))

  const capBadge = (m: Meet) => {
    const count = m.participants.length
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${count >= m.cap ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
        {count}/{m.cap}
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconUsers size={20} />} title="Club Hub" subtitle="Find your people — clubs, group meets, and community events" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Regular group activity is one of the strongest predictors of sticking with exercise. Join a
          club, show up to a meet, and your workouts stop depending on willpower alone.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {([['meets', 'Meets'], ['myhub', 'My Hub'], ['clubs', 'Clubs'], ['events', 'Events']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${tab === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== 'myhub' && (
          <input
            className={`${inputClass} mt-3`}
            placeholder="Search clubs, meets, venues…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </Card>

      {tab === 'myhub' && (
        <>
          <Card className="!p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-brand/10 p-3">
                <div className="text-2xl font-black text-brand-dark">{myClubs.length}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">My clubs</div>
              </div>
              <div className="rounded-2xl bg-brand/10 p-3">
                <div className="text-2xl font-black text-brand-dark">{myMeets.length}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Upcoming</div>
              </div>
              <div className="rounded-2xl bg-brand/10 p-3">
                <div className="text-2xl font-black text-brand-dark">{myEvents.length}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Events</div>
              </div>
            </div>
            {myClubs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {myClubs.map((c) => (
                  <span key={c.id} className="rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{c.emoji} {c.name}</span>
                ))}
              </div>
            )}
          </Card>

          {myMeetsByDay.length === 0 && (
            <Card className="!p-5 text-center text-sm text-neutral-400">
              Nothing on your schedule yet — head to the Meets tab and join one.
            </Card>
          )}

          {myMeetsByDay.map((g) => (
            <Card key={g.day} className="!p-4">
              <div className="border-b border-dashed border-neutral-200 pb-2 text-base font-black text-ink dark:border-white/10 dark:text-white">{dayName(g.day)}</div>
              <div className="mt-2 space-y-3">
                {g.meets.map((m) => {
                  const r = rsvpOf(m)
                  return (
                    <button key={m.id} onClick={() => setDetail(m)} className="flex w-full items-start gap-3 text-left">
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-lg font-black leading-tight text-neutral-400">{m.time}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-black text-ink dark:text-white">{m.title}</div>
                        <div className="text-[12px] text-neutral-500">{m.club}</div>
                        <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${r === 'joined' ? 'border-brand text-brand-dark' : 'border-amber-400 text-amber-600 dark:text-amber-300'}`}>
                          {r === 'joined' ? 'Joining' : 'Maybe'}
                        </span>
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-neutral-400"><IconMapPin size={12} />{m.venue}</div>
                      </div>
                      {capBadge(m)}
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </>
      )}

      {tab === 'meets' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1" data-daypicker>
            {Array.from({ length: 7 }, (_, i) => {
              const { dow, date } = dayLabel(i)
              return (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={`flex min-w-[64px] flex-col items-center rounded-2xl px-3 py-2 text-center transition ${day === i ? 'bg-brand text-white' : 'bg-white text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}
                >
                  <span className="text-[10px] font-bold tracking-wide">{i === 0 ? 'TODAY' : dow}</span>
                  <span className="text-lg font-black">{date}</span>
                </button>
              )
            })}
            <button
              onClick={() => setMeetView((v) => (v === 'list' ? 'map' : 'list'))}
              className="flex min-w-[64px] flex-col items-center justify-center rounded-2xl bg-white px-3 py-2 text-center text-neutral-500 transition dark:bg-white/10 dark:text-neutral-300"
            >
              <span className="text-lg leading-none">{meetView === 'list' ? '🗺️' : '📋'}</span>
              <span className="mt-0.5 text-[10px] font-bold tracking-wide">{meetView === 'list' ? 'MAP' : 'LIST'}</span>
            </button>
            <button
              onClick={() => setShowHost(true)}
              className="ml-auto flex min-w-[64px] flex-col items-center justify-center rounded-2xl bg-brand px-3 py-2 text-center text-white transition"
            >
              <span className="text-lg leading-none">＋</span>
              <span className="mt-0.5 text-[10px] font-bold tracking-wide">HOST</span>
            </button>
          </div>

          {loadingMeets && <Card className="!p-5 text-center text-sm text-neutral-400">Loading meets…</Card>}

          {!loadingMeets && meetsToday.length === 0 && (
            <Card className="!p-5 text-center text-sm text-neutral-400">No meets on this day{q ? ' matching your search' : ''} — check another day, or host your own.</Card>
          )}

          {meetView === 'map' && meetsToday.length > 0 && (
            <Card className="!p-2">
              <Suspense fallback={<div className="flex h-[340px] items-center justify-center text-sm text-neutral-400">Loading map…</div>}>
                <MeetMap
                  pins={meetsToday.map((m) => ({
                    id: m.id, lat: m.lat, lng: m.lng, emoji: m.emoji, title: m.title, time: m.time,
                    count: m.participants.length, cap: m.cap,
                  }))}
                  onSelect={(id) => { const m = meets.find((x) => x.id === id); if (m) setDetail(m) }}
                />
              </Suspense>
              <p className="px-2 py-1.5 text-center text-[11px] text-neutral-400">Pin number = people actually joined · red = full · tap a pin for details</p>
            </Card>
          )}

          {meetView === 'list' && meetsToday.map((m) => {
            const r = rsvpOf(m)
            return (
              <Card key={m.id} className="!p-4">
                <button onClick={() => setDetail(m)} className="flex w-full items-start gap-3 text-left">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl">{m.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{m.club}</div>
                    <div className="truncate text-[15px] font-black text-ink dark:text-white">{m.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold dark:bg-white/10">{m.tag}</span>
                      <span className="flex items-center gap-1"><IconMapPin size={12} />{m.venue}</span>
                      <span className="font-semibold">{fmtFee(m.feeRp)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-black text-ink dark:text-white">{m.time}</span>
                    {capBadge(m)}
                    {r !== 'none' && (
                      <span className={`text-[11px] font-bold ${r === 'joined' ? 'text-brand-dark' : 'text-amber-600 dark:text-amber-300'}`}>{r === 'joined' ? '✓ Joining' : '? Maybe'}</span>
                    )}
                  </div>
                </button>
              </Card>
            )
          })}
        </>
      )}

      {tab === 'clubs' && clubsFiltered.map((c) => {
        const member = p.joinedClubs.includes(c.id)
        return (
          <Card key={c.id} className="!p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-2xl">{c.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-ink dark:text-white">{c.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
                  <span className="flex items-center gap-1"><IconActivity size={12} />{c.level}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold dark:bg-white/10">{c.sport}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">{c.desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggleIn('joinedClubs', c.id)}
              className={`mt-3 w-full rounded-xl py-2 text-sm font-bold transition ${member ? 'bg-brand/10 text-brand-dark' : 'bg-brand text-white'}`}
            >
              {member ? '✓ Member — tap to leave' : 'Join club'}
            </button>
          </Card>
        )
      })}

      {tab === 'events' && eventsFiltered.map((e) => {
        const registered = p.joinedEvents.includes(e.id)
        return (
          <Card key={e.id} className="!p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-2xl">{e.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{e.org}</div>
                <div className="text-[15px] font-black text-ink dark:text-white">{e.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
                  <span className="font-bold text-ink dark:text-white">{e.date}</span>
                  <span className="flex items-center gap-1"><IconMapPin size={12} />{e.venue}</span>
                </div>
                <div className="mt-1 text-[12px] text-neutral-500">{e.format} · {e.teams + (registered ? 1 : 0)} registered</div>
              </div>
              <Badge tone={e.status === 'happening' ? 'brand' : 'low'}>{e.status === 'happening' ? 'Happening now' : 'Registration open'}</Badge>
            </div>
            <button
              onClick={() => toggleIn('joinedEvents', e.id)}
              className={`mt-3 w-full rounded-xl py-2 text-sm font-bold transition ${registered ? 'bg-brand/10 text-brand-dark' : 'bg-brand text-white'}`}
            >
              {registered ? '✓ Registered — tap to cancel' : e.status === 'happening' ? 'Join event' : 'Register'}
            </button>
          </Card>
        )
      })}

      {detail && (() => {
        const m = detail
        const r = rsvpOf(m)
        const count = m.participants.length
        const full = count >= m.cap && r !== 'joined'
        const isHost = m.hostEmail === email
        const start = meetDate(m)
        const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        return createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-label="Meet detail" onClick={() => setDetail(null)}>
            <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-neutral-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-bold text-brand-dark">
                    {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @{m.time}
                  </div>
                  <h2 className="mt-1 text-lg font-black uppercase leading-snug text-ink dark:text-white">{m.title}</h2>
                </div>
                <button onClick={() => setDetail(null)} aria-label="Close" className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-500 dark:bg-white/10">✕</button>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-brand/10 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-xl">{m.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-ink dark:text-white">{m.club}</div>
                  <div className="text-[12px] text-neutral-500">Hosted by {m.hostName} · {m.tag}</div>
                </div>
                {capBadge(m)}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {m.participants.slice(0, 4).map((pEmail) => (
                  <span key={pEmail} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[12px] font-black text-white" title={pEmail}>{initials(pEmail)}</span>
                ))}
                {count > 4 && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 text-[12px] font-bold text-neutral-400 dark:border-white/20">+{count - 4}</span>
                )}
                <span className="ml-1 text-[12px] text-neutral-400">{count} really going{m.maybes.length > 0 ? ` · ${m.maybes.length} maybe` : ''}</span>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🗓️</span>
                  <div>
                    <div className="font-bold text-ink dark:text-white">{start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {m.time}</div>
                    <div className="text-[12px] text-neutral-500">{m.durH} hour(s)</div>
                    <button onClick={() => downloadIcs(m)} className="mt-0.5 text-[13px] font-bold text-brand-dark">Add to calendar</button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="font-bold text-ink dark:text-white">{m.venue}</div>
                    <div className="text-[12px] leading-relaxed text-neutral-500">{m.address}</div>
                    <a href={mapsUrl(m)} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[13px] font-bold text-brand-dark">Show in maps</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏷️</span>
                  <div className="font-bold text-ink dark:text-white">Per person · {fmtFee(m.feeRp)}</div>
                </div>
                {(m.emoji === '🏃' || m.emoji === '🩺') && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📡</span>
                    <a href="#/community" className="font-bold text-brand-dark">
                      Track this {m.emoji === '🏃' ? 'run' : 'walk'} with the GPS tracker →
                    </a>
                  </div>
                )}
              </div>

              {m.notes.length > 0 && (
                <div className="mt-4 rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
                  <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Notes</div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[13px] text-neutral-600 dark:text-neutral-300">
                    {m.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              )}

              {rsvpError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{rsvpError}</p>}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setRsvp(m.id, r === 'maybe' ? 'none' : 'maybe')}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition ${r === 'maybe' ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'border-brand text-brand-dark'}`}
                >
                  {r === 'maybe' ? '? Maybe ✓' : 'Maybe'}
                </button>
                <button
                  onClick={() => !full && setRsvp(m.id, r === 'joined' ? 'none' : 'joined')}
                  disabled={full}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${r === 'joined' ? 'bg-brand/10 text-brand-dark' : full ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/5' : 'bg-brand text-white'}`}
                >
                  {r === 'joined' ? '✓ Joining — tap to leave' : full ? 'Full' : 'Join meet'}
                </button>
              </div>

              {isHost && (
                <button
                  onClick={async () => { await api.deleteMeet(m.id).catch(() => {}); setDetail(null); refreshMeets() }}
                  className="mt-3 w-full rounded-xl bg-red-50 py-2 text-[13px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300"
                >
                  Cancel this meet (you're hosting it)
                </button>
              )}
            </div>
          </div>,
          document.body,
        )
      })()}

      {showHost && <HostMeetSheet email={email} onClose={() => setShowHost(false)} onCreated={() => { setShowHost(false); refreshMeets() }} />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Meets are real and shared with every Panaceamed user — anyone can host one, and "joined" is
        the actual number of accounts who RSVP'd, never a preset number. Group exercise adherence
        evidence: social support is a consistent predictor of long-term physical-activity maintenance
        (e.g. Smith et al., <i>Int J Behav Nutr Phys Act</i> 2017).
      </div>
    </div>
  )
}

function HostMeetSheet({ email, onClose, onCreated }: { email: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [club, setClub] = useState('')
  const [tag, setTag] = useState<(typeof TAGS)[number]>('Social')
  const [venue, setVenue] = useState('')
  const [address, setAddress] = useState('')
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('06:00')
  const [durH, setDurH] = useState(1.5)
  const [cap, setCap] = useState(20)
  const [feeRp, setFeeRp] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim() || !venue.trim()) { setError('Give it a title and a venue.'); return }
    setSaving(true)
    setError('')
    try {
      await api.createMeet({
        title: title.trim(), club: club.trim() || undefined, tag, venue: venue.trim(), address: address.trim(),
        day, time, durH, cap, feeRp, emoji: EMOJI_BY_SPORT[tag] || '🏃', notes: [],
      })
      onCreated()
    } catch {
      setError('Could not create the meet — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="dialog" aria-label="Host a meet" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-neutral-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink dark:text-white">Host a real meet</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-500 dark:bg-white/10">✕</button>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
          This posts a real, shared meet visible to every Panaceamed user — {email || 'you'} will be
          listed as the host and first participant.
        </p>
        <div className="mt-4 space-y-3">
          <input className={inputClass} placeholder="Title (e.g. Saturday 5K)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={inputClass} placeholder="Club / group name (optional)" value={club} onChange={(e) => setClub(e.target.value)} />
          <select className={inputClass} value={tag} onChange={(e) => setTag(e.target.value as (typeof TAGS)[number])}>
            {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={inputClass} placeholder="Venue (e.g. GBK Senayan Loop)" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <input className={inputClass} placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[12px] font-bold text-neutral-500">Day
              <select className={`${inputClass} mt-1`} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {Array.from({ length: 7 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Today' : dayName(i)}</option>)}
              </select>
            </label>
            <label className="text-[12px] font-bold text-neutral-500">Time
              <input className={`${inputClass} mt-1`} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="text-[12px] font-bold text-neutral-500">Duration (hours)
              <input className={`${inputClass} mt-1`} type="number" min={0.5} max={6} step={0.5} value={durH} onChange={(e) => setDurH(Number(e.target.value) || 1)} />
            </label>
            <label className="text-[12px] font-bold text-neutral-500">Capacity
              <input className={`${inputClass} mt-1`} type="number" min={2} max={200} value={cap} onChange={(e) => setCap(Number(e.target.value) || 2)} />
            </label>
            <label className="col-span-2 text-[12px] font-bold text-neutral-500">Fee per person (Rp, 0 = free)
              <input className={`${inputClass} mt-1`} type="number" min={0} step={5000} value={feeRp} onChange={(e) => setFeeRp(Number(e.target.value) || 0)} />
            </label>
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {saving ? 'Posting…' : 'Post this meet'}
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default ClubHub
