import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, inputClass } from '../components/ui'
import { IconUsers, IconActivity, IconMapPin } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Club Hub — community sports & health clubs, scheduled meets with join
// capacity, and community events. Inspired by community-sport apps (clubs /
// meets / comps), adapted to Panaceamed's health focus: run clubs, racquet
// sports, and clinician-led health walks all count as preventive medicine.
// Client-side only: seeded catalog + localStorage persistence (joins and
// club memberships survive reloads). No external API.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_clubhub_v1'

interface Persisted { joinedMeets: string[]; joinedClubs: string[]; joinedEvents: string[] }
function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { joinedMeets: [], joinedClubs: [], joinedEvents: [], ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { joinedMeets: [], joinedClubs: [], joinedEvents: [] }
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

interface Meet { id: string; day: number; time: string; title: string; club: string; tag: string; venue: string; km: number; cap: number; joined: number; emoji: string }
const MEETS: Meet[] = [
  { id: 'm1', day: 0, time: '06:00', title: 'Weekend Long Run 10K', club: 'Sunrise Run Club', tag: 'Social', venue: 'GBK Senayan Loop', km: 3.2, cap: 35, joined: 27, emoji: '🏃' },
  { id: 'm2', day: 0, time: '07:30', title: 'Americano Mixer', club: 'Padel Pulse', tag: 'Americano', venue: 'Padel Parc Simprug', km: 4.5, cap: 12, joined: 11, emoji: '🎾' },
  { id: 'm3', day: 0, time: '16:00', title: 'Doubles Rotation Night', club: 'Shuttle Squad', tag: 'Social', venue: 'GOR Bulungan', km: 5.8, cap: 16, joined: 9, emoji: '🏸' },
  { id: 'm4', day: 1, time: '06:30', title: 'Walk & Talk: Heart Health', club: 'Walk With A Doctor', tag: 'Health walk', venue: 'Taman Menteng', km: 2.1, cap: 25, joined: 14, emoji: '🩺' },
  { id: 'm5', day: 1, time: '07:00', title: 'Sunrise Vinyasa', club: 'Morning Flow Yoga', tag: 'Class', venue: 'Taman Langsat', km: 3.9, cap: 20, joined: 17, emoji: '🧘' },
  { id: 'm6', day: 2, time: '19:00', title: 'Push-Pull-Legs: Pull Day', club: 'Iron Circle', tag: 'Training', venue: 'Ration Strength Gym', km: 6.4, cap: 10, joined: 6, emoji: '🏋️' },
  { id: 'm7', day: 3, time: '19:30', title: 'Beginner Padel Clinic', club: 'Padel Pulse', tag: 'Class', venue: 'Republic Padel', km: 3.8, cap: 8, joined: 8, emoji: '🎾' },
  { id: 'm8', day: 4, time: '06:00', title: 'Interval Tempo Session', club: 'Sunrise Run Club', tag: 'Training', venue: 'Stadion Madya Track', km: 3.0, cap: 30, joined: 12, emoji: '🏃' },
  { id: 'm9', day: 5, time: '16:30', title: 'Mixed Doubles Ladder', club: 'Shuttle Squad', tag: 'Competitive', venue: 'GOR Pertamina', km: 7.2, cap: 24, joined: 19, emoji: '🏸' },
  { id: 'm10', day: 6, time: '06:00', title: 'Recovery 5K + Coffee', club: 'Sunrise Run Club', tag: 'Social', venue: 'FX Sudirman Loop', km: 2.8, cap: 40, joined: 22, emoji: '🏃' },
]

interface Evt { id: string; title: string; org: string; date: string; format: string; teams: number; status: 'registration' | 'happening'; emoji: string; venue: string }
const EVENTS: Evt[] = [
  { id: 'e1', title: 'Panacea Community Run 2026', org: 'Sunrise Run Club', date: 'Aug 9', format: '5K / 10K fun run', teams: 214, status: 'registration', emoji: '🏅', venue: 'GBK Senayan' },
  { id: 'e2', title: 'Padel League Season 2', org: 'Padel Pulse', date: 'Jul 26', format: 'Round robin, 6 weeks', teams: 18, status: 'happening', emoji: '🏆', venue: 'Padel Parc Simprug' },
  { id: 'e3', title: 'Healthy Heart Charity Walk', org: 'Walk With A Doctor', date: 'Aug 17', format: '3K walk + health screening booths', teams: 130, status: 'registration', emoji: '❤️', venue: 'Taman Menteng' },
  { id: 'e4', title: 'Smash Cup Badminton Open', org: 'Shuttle Squad', date: 'Jul 20', format: 'Knockout doubles', teams: 32, status: 'happening', emoji: '🏸', venue: 'GOR Bulungan' },
]

const DAY_MS = 86400000
function dayLabel(offset: number): { dow: string; date: number } {
  const d = new Date(Date.now() + offset * DAY_MS)
  return { dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), date: d.getDate() }
}

type Tab = 'clubs' | 'meets' | 'events'

export function ClubHub() {
  const [tab, setTab] = useState<Tab>('meets')
  const [day, setDay] = useState(0)
  const [query, setQuery] = useState('')
  const [p, setP] = useState<Persisted>(loadPersisted)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch { /* ignore */ }
  }, [p])

  const toggleIn = (list: keyof Persisted, id: string) =>
    setP((s) => ({ ...s, [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id] }))

  const q = query.trim().toLowerCase()
  const meetsToday = useMemo(
    () => MEETS.filter((m) => m.day === day && (!q || (m.title + m.club + m.venue + m.tag).toLowerCase().includes(q))).sort((a, b) => a.time.localeCompare(b.time)),
    [day, q],
  )
  const clubsFiltered = CLUBS.filter((c) => !q || (c.name + c.sport + c.desc).toLowerCase().includes(q))
  const eventsFiltered = EVENTS.filter((e) => !q || (e.title + e.org + e.format).toLowerCase().includes(q))

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconUsers size={20} />} title="Club Hub" subtitle="Find your people — clubs, group meets, and community events" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Regular group activity is one of the strongest predictors of sticking with exercise. Join a
          club, show up to a meet, and your workouts stop depending on willpower alone.
        </p>
        <div className="mt-3 flex gap-2">
          {(['meets', 'clubs', 'events'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${tab === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search clubs, meets, venues…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {tab === 'meets' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
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
            const joined = p.joinedMeets.includes(m.id)
            const count = m.joined + (joined ? 1 : 0)
            const full = count >= m.cap && !joined
            return (
              <Card key={m.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl">{m.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{m.club}</div>
                    <div className="truncate text-[15px] font-black text-ink dark:text-white">{m.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold dark:bg-white/10">{m.tag}</span>
                      <span className="flex items-center gap-1"><IconMapPin size={12} />{m.venue}</span>
                      <span>· {m.km.toFixed(1)} km</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-black text-ink dark:text-white">{m.time}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${count >= m.cap ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                      {count}/{m.cap}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => !full && toggleIn('joinedMeets', m.id)}
                  disabled={full}
                  className={`mt-3 w-full rounded-xl py-2 text-sm font-bold transition ${joined ? 'bg-brand/10 text-brand-dark' : full ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-white/5' : 'bg-brand text-white'}`}
                >
                  {joined ? '✓ Joining — tap to leave' : full ? 'Full' : 'Join meet'}
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

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Community catalog is illustrative while club onboarding is open — joins are saved on this
        device. Group exercise adherence evidence: social support is a consistent predictor of
        long-term physical-activity maintenance (e.g. Smith et al., <i>Int J Behav Nutr Phys Act</i> 2017).
      </div>
    </div>
  )
}

export default ClubHub
