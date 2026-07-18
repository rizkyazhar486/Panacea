import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, SectionTitle, Badge, inputClass } from '../components/ui'
import { IconUsers, IconActivity, IconMapPin } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Club Hub — community sports & health clubs, scheduled meets with join
// capacity, meet detail (participants, fee, notes, calendar export, maps
// link), and a personal "My Hub" schedule of everything joined. Inspired by
// community-sport apps (clubs / meets / detail pages), adapted to
// Panaceamed's health focus. Client-side only: seeded catalog + localStorage
// persistence. Calendar export generates a standards-compliant .ics file
// locally; the maps link opens the venue in Google Maps — no API keys.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_clubhub_v1'

interface Persisted { joinedMeets: string[]; maybeMeets: string[]; joinedClubs: string[]; joinedEvents: string[] }
function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { joinedMeets: [], maybeMeets: [], joinedClubs: [], joinedEvents: [], ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { joinedMeets: [], maybeMeets: [], joinedClubs: [], joinedEvents: [] }
}

interface Club { id: string; name: string; emoji: string; members: number; level: string; sport: string; desc: string }
const CLUBS: Club[] = [
  { id: 'sunrise-run', name: 'Sunrise Run Club', emoji: '🏃', members: 486, level: 'All levels', sport: 'Running', desc: 'Easy-pace social runs every weekend morning — zone 2, no one left behind.' },
  { id: 'padel-pulse', name: 'Padel Pulse', emoji: '🎾', members: 261, level: 'Beginner-Intermediate', sport: 'Padel', desc: 'Social padel mixers and Americano-format sessions.' },
  { id: 'shuttle-squad', name: 'Shuttle Squad', emoji: '🏸', members: 342, level: 'All levels', sport: 'Badminton', desc: 'Doubles rotation nights, casual and competitive courts.' },
  { id: 'iron-circle', name: 'Iron Circle', emoji: '🏋️', members: 158, level: 'Intermediate', sport: 'Strength', desc: 'Progressive-overload group lifting with form-check culture.' },
  { id: 'dokter-jalan', name: 'Walk With A Doctor', emoji: '🩺', members: 97, level: 'All levels', sport: 'Health walk', desc: 'Clinician-led weekend walks — bring your questions, leave with 8,000 steps.' },
  { id: 'flow-yoga', name: 'Morning Flow Yoga', emoji: '🧘', members: 214, level: 'All levels', sport: 'Yoga', desc: 'Sunrise vinyasa in the park; mats provided for first-timers.' },
]

interface Meet {
  id: string; day: number; time: string; durH: number; title: string; club: string; tag: string
  venue: string; address: string; km: number; cap: number; joined: number; emoji: string
  feeRp: number; hosts: string[]; notes: string[]
}
const MEETS: Meet[] = [
  { id: 'm1', day: 0, time: '06:00', durH: 2, title: 'Weekend Long Run 10K', club: 'Sunrise Run Club', tag: 'Social', venue: 'GBK Senayan Loop', address: 'Gelora Bung Karno, Jakarta Pusat', km: 3.2, cap: 35, joined: 27, emoji: '🏃', feeRp: 0, hosts: ['RA', 'DW'], notes: ['Pace groups: 6:30, 7:30, 8:30 /km', 'Water station at km 5', 'Post-run coffee nearby (self-pay)'] },
  { id: 'm2', day: 0, time: '07:30', durH: 2, title: 'Americano Mixer', club: 'Padel Pulse', tag: 'Americano', venue: 'Padel Parc Simprug', address: 'Jl. Teuku Nyak Arief, Jakarta Selatan', km: 4.5, cap: 12, joined: 11, emoji: '🎾', feeRp: 85000, hosts: ['FK'], notes: ['Fee includes 2h court + balls', 'Bring your own racket (rental available)'] },
  { id: 'm3', day: 0, time: '16:00', durH: 3, title: 'Doubles Rotation Night', club: 'Shuttle Squad', tag: 'Social', venue: 'GOR Bulungan', address: 'Jl. Bulungan No.1, Jakarta Selatan', km: 5.8, cap: 16, joined: 9, emoji: '🏸', feeRp: 45000, hosts: ['AB', 'TN'], notes: ['Fee includes 3h court + shuttlecocks', 'Mineral water provided'] },
  { id: 'm4', day: 1, time: '06:30', durH: 1.5, title: 'Walk & Talk: Heart Health', club: 'Walk With A Doctor', tag: 'Health walk', venue: 'Taman Menteng', address: 'Jl. HOS Cokroaminoto, Jakarta Pusat', km: 2.1, cap: 25, joined: 14, emoji: '🩺', feeRp: 0, hosts: ['dr'], notes: ['Q&A on blood pressure & cholesterol while walking', 'Wear comfortable shoes'] },
  { id: 'm5', day: 1, time: '07:00', durH: 1, title: 'Sunrise Vinyasa', club: 'Morning Flow Yoga', tag: 'Class', venue: 'Taman Langsat', address: 'Jl. Barito, Kebayoran Baru', km: 3.9, cap: 20, joined: 17, emoji: '🧘', feeRp: 30000, hosts: ['YS'], notes: ['Mats provided for first-timers', 'Arrive 10 min early'] },
  { id: 'm6', day: 2, time: '19:00', durH: 1.5, title: 'Push-Pull-Legs: Pull Day', club: 'Iron Circle', tag: 'Training', venue: 'Ration Strength Gym', address: 'Jl. Wolter Monginsidi, Jakarta Selatan', km: 6.4, cap: 10, joined: 6, emoji: '🏋️', feeRp: 50000, hosts: ['GH'], notes: ['Day pass included in fee', 'Program sheet shared in advance'] },
  { id: 'm7', day: 3, time: '19:30', durH: 2, title: 'Beginner Padel Clinic', club: 'Padel Pulse', tag: 'Class', venue: 'Republic Padel', address: 'Simprug, Jakarta Selatan', km: 3.8, cap: 8, joined: 8, emoji: '🎾', feeRp: 120000, hosts: ['FK', 'CO'], notes: ['Coached fundamentals: grip, wall play, positioning', 'All equipment provided'] },
  { id: 'm8', day: 4, time: '06:00', durH: 1.5, title: 'Interval Tempo Session', club: 'Sunrise Run Club', tag: 'Training', venue: 'Stadion Madya Track', address: 'Senayan, Jakarta Pusat', km: 3.0, cap: 30, joined: 12, emoji: '🏃', feeRp: 0, hosts: ['DW'], notes: ['6×800m @ 5K effort', 'Track etiquette briefing for first-timers'] },
  { id: 'm9', day: 5, time: '16:30', durH: 3, title: 'Mixed Doubles Ladder', club: 'Shuttle Squad', tag: 'Competitive', venue: 'GOR Pertamina', address: 'Simprug, Jakarta Selatan', km: 7.2, cap: 24, joined: 19, emoji: '🏸', feeRp: 55000, hosts: ['AB'], notes: ['Ladder points count toward monthly ranking'] },
  { id: 'm10', day: 6, time: '06:00', durH: 1.5, title: 'Recovery 5K + Coffee', club: 'Sunrise Run Club', tag: 'Social', venue: 'FX Sudirman Loop', address: 'Jl. Jend. Sudirman, Jakarta Pusat', km: 2.8, cap: 40, joined: 22, emoji: '🏃', feeRp: 0, hosts: ['RA'], notes: ['Conversational pace only — HR zone 1-2'] },
]

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
  const [tab, setTab] = useState<Tab>('meets')
  const [day, setDay] = useState(0)
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<Meet | null>(null)
  const [p, setP] = useState<Persisted>(loadPersisted)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
  }, [p])

  const rsvpOf = (id: string): Rsvp => (p.joinedMeets.includes(id) ? 'joined' : p.maybeMeets.includes(id) ? 'maybe' : 'none')
  const setRsvp = (id: string, r: Rsvp) =>
    setP((s) => ({
      ...s,
      joinedMeets: r === 'joined' ? [...new Set([...s.joinedMeets, id])] : s.joinedMeets.filter((x) => x !== id),
      maybeMeets: r === 'maybe' ? [...new Set([...s.maybeMeets, id])] : s.maybeMeets.filter((x) => x !== id),
    }))
  const toggleIn = (list: 'joinedClubs' | 'joinedEvents', id: string) =>
    setP((s) => ({ ...s, [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id] }))

  const q = query.trim().toLowerCase()
  const meetsToday = useMemo(
    () => MEETS.filter((m) => m.day === day && (!q || (m.title + m.club + m.venue + m.tag).toLowerCase().includes(q))).sort((a, b) => a.time.localeCompare(b.time)),
    [day, q],
  )
  const clubsFiltered = CLUBS.filter((c) => !q || (c.name + c.sport + c.desc).toLowerCase().includes(q))
  const eventsFiltered = EVENTS.filter((e) => !q || (e.title + e.org + e.format).toLowerCase().includes(q))

  const myMeets = MEETS.filter((m) => rsvpOf(m.id) !== 'none').sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
  const myMeetsByDay = useMemo(() => {
    const groups: { day: number; meets: Meet[] }[] = []
    for (const m of myMeets) {
      const g = groups.find((x) => x.day === m.day)
      if (g) g.meets.push(m)
      else groups.push({ day: m.day, meets: [m] })
    }
    return groups
  }, [p.joinedMeets, p.maybeMeets]) // eslint-disable-line react-hooks/exhaustive-deps
  const myClubs = CLUBS.filter((c) => p.joinedClubs.includes(c.id))
  const myEvents = EVENTS.filter((e) => p.joinedEvents.includes(e.id))

  const capBadge = (m: Meet) => {
    const count = m.joined + (rsvpOf(m.id) === 'joined' ? 1 : 0)
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
                  const r = rsvpOf(m.id)
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
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-neutral-400"><IconMapPin size={12} />{m.venue} ({m.km.toFixed(1)} km)</div>
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
          </div>

          {meetsToday.length === 0 && (
            <Card className="!p-5 text-center text-sm text-neutral-400">No meets on this day{q ? ' matching your search' : ''} — check another day.</Card>
          )}

          {meetsToday.map((m) => {
            const r = rsvpOf(m.id)
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
                      <span>· {m.km.toFixed(1)} km</span>
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
                  <span className="flex items-center gap-1"><IconUsers size={12} />{(c.members + (member ? 1 : 0)).toLocaleString()} members</span>
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
        const r = rsvpOf(m.id)
        const count = m.joined + (r === 'joined' ? 1 : 0)
        const full = count >= m.cap && r !== 'joined'
        const start = meetDate(m)
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
                  <div className="text-[12px] text-neutral-500">Hosted meet · {m.tag}</div>
                </div>
                {capBadge(m)}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {m.hosts.map((h) => (
                  <span key={h} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[12px] font-black text-white">{h}</span>
                ))}
                {Array.from({ length: Math.min(3, Math.max(0, count - m.hosts.length)) }, (_, i) => (
                  <span key={i} className="h-9 w-9 rounded-full border-2 border-dashed border-neutral-300 dark:border-white/20" />
                ))}
                {count > m.hosts.length + 3 && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 text-[12px] font-bold text-neutral-400 dark:border-white/20">+{count - m.hosts.length - 3}</span>
                )}
                <span className="ml-1 text-[12px] text-neutral-400">{count} going</span>
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
                    <div className="text-[12px] text-neutral-400">{m.km.toFixed(1)} km from you</div>
                    <a href={mapsUrl(m)} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[13px] font-bold text-brand-dark">Show in maps</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏷️</span>
                  <div className="font-bold text-ink dark:text-white">Per person · {fmtFee(m.feeRp)}</div>
                </div>
              </div>

              {m.notes.length > 0 && (
                <div className="mt-4 rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
                  <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Notes</div>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[13px] text-neutral-600 dark:text-neutral-300">
                    {m.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              )}

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
            </div>
          </div>,
          document.body,
        )
      })()}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Community catalog is illustrative while club onboarding is open — joins are saved on this
        device. Group exercise adherence evidence: social support is a consistent predictor of
        long-term physical-activity maintenance (e.g. Smith et al., <i>Int J Behav Nutr Phys Act</i> 2017).
      </div>
    </div>
  )
}

export default ClubHub
