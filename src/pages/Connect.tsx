import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconUsers, IconShield } from '../components/icons'
import { useStore } from '../lib/store'
import {
  ACTIVITY_OPTIONS, ACTIVITY_LABEL, LOOKING_FOR_LABEL, CHILDREN_LABEL, MATCH_LABEL,
  SAFETY_RULES, buildDeck, compatibility,
  type MatchProfile, type Preferences, type Sex,
} from '../lib/matching'

// Connect — Bumble-style: women hold the initiative, men set preferences.
// Swipe left rejects, swipe right accepts.
//
// Safety is part of the product rather than a footnote: location is banded
// never exact, the deck is ordered by actual commonality rather than by
// engagement potential, and the safety rules must be acknowledged before the
// matches list becomes usable.

const PROFILE_KEY = 'pmd_connect_profile_v1'
const PREFS_KEY = 'pmd_connect_prefs_v1'
const SEEN_KEY = 'pmd_connect_seen_v1'
const LIKED_KEY = 'pmd_connect_liked_v1'
const POOL_KEY = 'pmd_connect_pool_v1'
const SAFETY_KEY = 'pmd_connect_safety_ack_v1'

function load<T>(k: string, f: T): T {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : f } catch { return f }
}
function store(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ }
}

const BANDS: MatchProfile['distanceBand'][] = ['<5 km', '5-15 km', '15-50 km', '>50 km']

export function Connect() {
  const { account } = useStore()
  const [profile, setProfile] = useState<MatchProfile | null>(() => load<MatchProfile | null>(PROFILE_KEY, null))
  const [prefs, setPrefs] = useState<Preferences>(() => load<Preferences>(PREFS_KEY, {
    interestedIn: 'P', ageMin: 20, ageMax: 40, maxDistanceBand: '15-50 km',
    mustShareActivity: false, nonSmokerOnly: false,
  }))
  const [seen, setSeen] = useState<string[]>(() => load<string[]>(SEEN_KEY, []))
  const [liked, setLiked] = useState<string[]>(() => load<string[]>(LIKED_KEY, []))
  const [pool] = useState<MatchProfile[]>(() => load<MatchProfile[]>(POOL_KEY, []))
  const [safetyAck, setSafetyAck] = useState<boolean>(() => load<boolean>(SAFETY_KEY, false))
  const [tab, setTab] = useState<'deck' | 'profil' | 'filter' | 'match' | 'aman'>('profil')

  useEffect(() => store(PREFS_KEY, prefs), [prefs])
  useEffect(() => store(SEEN_KEY, seen), [seen])
  useEffect(() => store(LIKED_KEY, liked), [liked])
  useEffect(() => store(SAFETY_KEY, safetyAck), [safetyAck])
  useEffect(() => { if (profile) store(PROFILE_KEY, profile) }, [profile])

  useEffect(() => { if (profile) setTab('deck') }, [profile?.id])

  const deck = useMemo(
    () => (profile ? buildDeck(profile, prefs, pool, seen) : []),
    [profile, prefs, pool, seen],
  )
  const current = deck[0] ?? null

  // Bumble model: the woman decides first. A man's right-swipe registers
  // interest but cannot start a conversation.
  const iInitiate = profile?.sex === 'P'

  function swipe(dir: 'left' | 'right') {
    if (!current) return
    setSeen((s) => [...s, current.id])
    if (dir === 'right') setLiked((l) => [...l, current.id])
  }

  const matches = useMemo(() => pool.filter((p) => liked.includes(p.id)), [pool, liked])

  const TABS = [
    { id: 'profil', l: 'Profile' },
    { id: 'filter', l: 'Preference' },
    { id: 'deck', l: 'Explore' },
    { id: 'match', l: `Matches (${matches.length})` },
    { id: 'aman', l: 'Safety' },
  ] as const

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🤝</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Connect</h1>
          <p className="text-xs text-neutral-500">Find a training partner or a match — women start the conversation</p>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <ProfileEditor initial={profile} defaultName={account?.name ?? ''} onSave={setProfile} />
      )}

      {tab === 'filter' && (
        <Card className="!p-4">
          <SectionTitle icon={<IconUsers size={18} />} title="Preference" subtitle="Decides who appears in Explore" />
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-[12px] font-bold text-ink dark:text-ink">Interested in</div>
              <div className="mt-1 flex gap-1.5">
                {(['P', 'L'] as Sex[]).map((s) => (
                  <button key={s} onClick={() => setPrefs({ ...prefs, interestedIn: s })}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${prefs.interestedIn === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                    {s === 'P' ? 'Women' : 'Men'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Minimum age">
                <input className={inputClass} inputMode="numeric" value={prefs.ageMin}
                  onChange={(e) => setPrefs({ ...prefs, ageMin: Number(e.target.value) || 18 })} />
              </Field>
              <Field label="Maximum age">
                <input className={inputClass} inputMode="numeric" value={prefs.ageMax}
                  onChange={(e) => setPrefs({ ...prefs, ageMax: Number(e.target.value) || 99 })} />
              </Field>
            </div>
            <div>
              <div className="text-[12px] font-bold text-ink dark:text-ink">Maximum distance</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {BANDS.map((b) => (
                  <button key={b} onClick={() => setPrefs({ ...prefs, maxDistanceBand: b })}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${prefs.maxDistanceBand === b ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                Distance is always a band, never an exact point — a precise location on a dating
                profile is how stalking happens.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" checked={prefs.mustShareActivity}
                onChange={(e) => setPrefs({ ...prefs, mustShareActivity: e.target.checked })} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Must share at least one sport</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <input type="checkbox" checked={prefs.nonSmokerOnly}
                onChange={(e) => setPrefs({ ...prefs, nonSmokerOnly: e.target.checked })} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Non-smokers only</span>
            </label>
          </div>
        </Card>
      )}

      {tab === 'deck' && (
        !profile ? (
          <Card className="!p-4">
            <p className="text-[12px] leading-relaxed text-neutral-500">Fill in your profile first, in the <b>Profile</b> tab.</p>
          </Card>
        ) : !current ? (
          <Card className="!p-4">
            <p className="text-[12px] leading-relaxed text-neutral-500">
              No other profile matches your current preferences. Loosen the filters in the
              <b>Preference</b> tab, or wait for more people to join. This page shows no invented
              profiles — only real people appear here.
            </p>
          </Card>
        ) : (
          <SwipeCard me={profile} them={current} iInitiate={iInitiate} onSwipe={swipe} remaining={deck.length} />
        )
      )}

      {tab === 'match' && (
        !safetyAck ? (
          <Card className="!p-4">
            <p className="text-[12px] leading-relaxed text-neutral-500">
              Read and accept the safety guidance in the <b>Safety</b> tab before opening your
              matches. This is deliberate — that section is not a formality.
            </p>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="!p-4"><p className="text-[12px] text-neutral-500">No matches yet.</p></Card>
        ) : (
          <Card className="!p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Your matches</div>
            <div className="mt-2 space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                  <div className="text-[13px] font-bold text-ink dark:text-ink">{m.displayName}, {m.age}</div>
                  <div className="text-[11px] text-neutral-500">{m.city} · {m.distanceBand}</div>
                  {profile && (
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      {compatibility(profile, m).sharedActivities.join(', ') || 'No shared activities yet'}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
              {iInitiate
                ? 'You start the conversation. You are never obliged to reply to anyone, and you can stop at any time.'
                : 'Waiting for her to start the conversation. You cannot message first — this is deliberate, to cut down unwanted messages.'}
            </p>
          </Card>
        )
      )}

      {tab === 'aman' && (
        <Card className="!p-4">
          <SectionTitle icon={<IconShield size={18} />} title="Safety" subtitle="Required reading before your matches open" />
          <ul className="mt-3 space-y-2">
            {SAFETY_RULES.map((r, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-700 dark:bg-white/5 dark:text-neutral-200">
                <span className="shrink-0 font-black text-brand-dark">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-3 dark:bg-brand/10">
            <input type="checkbox" checked={safetyAck} onChange={(e) => setSafetyAck(e.target.checked)} />
            <span className="text-[12px] font-bold text-brand-dark">I have read and understood this guidance</span>
          </label>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Strictly 18 and over. Your profile and choices stay on this device. Report behaviour that makes
        you uncomfortable — and stop communicating first, before you report.
      </div>
    </div>
  )
}

function SwipeCard({ me, them, iInitiate, onSwipe, remaining }: {
  me: MatchProfile; them: MatchProfile; iInitiate: boolean
  onSwipe: (d: 'left' | 'right') => void; remaining: number
}) {
  const c = compatibility(me, them)
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-black text-ink dark:text-ink">{them.displayName}, {them.age}</h2>
          <div className="text-[11px] text-neutral-500">{them.city} · {them.distanceBand} · looking for {LOOKING_FOR_LABEL[them.lookingFor]}</div>
        </div>
        <Badge tone={c.label === 'many' ? 'normal' : c.label === 'some' ? 'low' : 'neutral'}>{MATCH_LABEL[c.label]}</Badge>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{them.bio}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {them.activities.map((a) => (
          <span key={a} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            c.sharedActivities.includes(a) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {a}
          </span>
        ))}
      </div>

      {c.agreements.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-700">In common</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {c.agreements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {c.frictions.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-700">Differences</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {c.frictions.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
            Differences are shown on purpose, not hidden. An app that hides them to manufacture more
            matches is working against its own users.
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => onSwipe('left')}
          className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200">
          ← Skip
        </button>
        <button onClick={() => onSwipe('right')}
          className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:opacity-90">
          Like →
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-neutral-500">
        {remaining} profiles left · {iInitiate ? 'You start the conversation if you match' : 'If you match, she starts the conversation'}
      </p>
    </Card>
  )
}

function ProfileEditor({ initial, defaultName, onSave }: {
  initial: MatchProfile | null; defaultName: string; onSave: (p: MatchProfile) => void
}) {
  const [p, setP] = useState<MatchProfile>(initial ?? {
    id: Math.random().toString(36).slice(2),
    displayName: defaultName, age: 25, sex: 'P', city: '', distanceBand: '5-15 km',
    bio: '', activities: [],
    lifestyle: { smokes: false, drinks: 'tidak', exerciseDaysPerWeek: 3, sleepSchedule: 'fleksibel', wantsChildren: 'belum yakin' },
    lookingFor: 'teman olahraga',
  })
  const [saved, setSaved] = useState(false)

  const toggleActivity = (a: string) =>
    setP({ ...p, activities: p.activities.includes(a) ? p.activities.filter((x) => x !== a) : [...p.activities, a] })

  return (
    <Card className="!p-4">
      <SectionTitle icon={<IconUsers size={18} />} title="Your profile" subtitle="What other people see" />
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Display name"><input className={inputClass} value={p.displayName} onChange={(e) => setP({ ...p, displayName: e.target.value })} /></Field>
          <Field label="Age"><input className={inputClass} inputMode="numeric" value={p.age} onChange={(e) => setP({ ...p, age: Number(e.target.value) || 18 })} /></Field>
        </div>
        <div>
          <div className="text-[12px] font-bold text-ink dark:text-ink">Sex</div>
          <div className="mt-1 flex gap-1.5">
            {(['P', 'L'] as Sex[]).map((s) => (
              <button key={s} onClick={() => setP({ ...p, sex: s })}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${p.sex === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {s === 'P' ? 'Women' : 'Men'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
            Following the Bumble model: women start the conversation first.
          </p>
        </div>
        <Field label="City"><input className={inputClass} placeholder="Jakarta Selatan" value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} /></Field>
        <Field label="About you"><input className={inputClass} placeholder="Morning runner, works at a hospital" value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} /></Field>

        <div>
          <div className="text-[12px] font-bold text-ink dark:text-ink">Sports you do</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ACTIVITY_OPTIONS.map((a) => (
              <button key={a} onClick={() => toggleActivity(a)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${p.activities.includes(a) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {ACTIVITY_LABEL[a] ?? a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-ink dark:text-ink">Looking for</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(['teman olahraga', 'hubungan serius', 'belum yakin'] as const).map((l) => (
              <button key={l} onClick={() => setP({ ...p, lookingFor: l })}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${p.lookingFor === l ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {LOOKING_FOR_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-ink dark:text-ink">Children</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(['ya', 'tidak', 'belum yakin'] as const).map((w) => (
              <button key={w} onClick={() => setP({ ...p, lifestyle: { ...p.lifestyle, wantsChildren: w } })}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${p.lifestyle.wantsChildren === w ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                {CHILDREN_LABEL[w]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
          <input type="checkbox" checked={p.lifestyle.smokes}
            onChange={(e) => setP({ ...p, lifestyle: { ...p.lifestyle, smokes: e.target.checked } })} />
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">I smoke</span>
        </label>

        <Button className="w-full" onClick={() => { onSave(p); setSaved(true); setTimeout(() => setSaved(false), 1800) }}>
          {saved ? 'Saved ✓' : 'Save profile'}
        </Button>
        <p className="text-[10px] leading-relaxed text-neutral-500">
          Do not put your home address, phone number, exact workplace, or national ID anywhere on this profile.
        </p>
      </div>
    </Card>
  )
}

export default Connect
