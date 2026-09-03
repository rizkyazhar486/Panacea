import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconActivity } from '../components/icons'
import {
  SPORT_LABEL, SPORT_METRICS, valuePlayer, findSimilar, analyseTeam,
  type Player, type Sport,
} from '../lib/sportsAnalytics'

// Sports Lab — roster entry, multi-agent valuation, and similarity search.
//
// The design choice that matters here: the panel of agents is allowed to
// disagree, and the disagreement is shown rather than averaged away. A single
// confident number hides exactly the thing a coach needs — that a player is
// excellent at one thing and exploitable at another.

const KEY = 'pmd_sports_roster_v1'

export function SportsLab() {
  const [sport, setSport] = useState<Sport>('sepakbola')
  const [players, setPlayers] = useState<Player[]>(() => {
    try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as Player[]) : [] } catch { return [] }
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(players)) } catch { /* ignore */ }
  }, [players])

  const roster = useMemo(() => players.filter((p) => p.sport === sport), [players, sport])
  const selected = useMemo(() => roster.find((p) => p.id === selectedId) ?? roster[0] ?? null, [roster, selectedId])
  const valuation = useMemo(() => (selected ? valuePlayer(selected) : null), [selected])
  const similar = useMemo(() => (selected ? findSimilar(selected, roster) : []), [selected, roster])
  const team = useMemo(() => analyseTeam(roster), [roster])

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">📊</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Sports Lab</h1>
          <p className="text-xs text-neutral-500">Multi-agent player valuation & similar-player search</p>
        </div>
      </div>

      <Card className="!p-4">
        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Five agents rate a player from different angles and <b>never see one another’s
          results</b>. That is deliberate: the value of a panel lies precisely in its members being
          able to disagree. When the "Production" agent and the "Availability" agent diverge sharply,
          that gap is the finding — not their average. Every score also carries an uncertainty
          range set by the number of matches, because a player judged on 4 matches and one judged on
          40 are not equivalent.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Sport</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(SPORT_LABEL) as Sport[]).map((s) => (
            <button key={s} onClick={() => { setSport(s); setSelectedId(null) }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${sport === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {SPORT_LABEL[s]}
            </button>
          ))}
        </div>
      </Card>

      <AddPlayer sport={sport} onAdd={(p) => { setPlayers((x) => [...x, p]); setSelectedId(p.id) }} />

      {roster.length === 0 ? (
        <Card className="!p-4">
          <p className="text-[12px] leading-relaxed text-neutral-500">
            No players yet for {SPORT_LABEL[sport]}. Add at least two so similar-player search can
            work — similarity is computed from the data you enter yourself, not from a built-in
            database.
          </p>
        </Card>
      ) : (
        <>
          <Card className="!p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Squad ({roster.length})</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roster.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${selected?.id === p.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            {team.notes.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {team.notes.map((n, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{n}</div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Average rating" value={String(team.averageOverall)} />
              <Stat label="Average age" value={String(team.averageAge)} />
              <Stat label="Matches lost" value={`${team.injuryLoadPct}%`} />
            </div>
          </Card>

          {selected && valuation && (
            <>
              <Card className="!p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-black text-ink dark:text-ink">{selected.name}</h2>
                    <div className="text-[11px] text-neutral-500">{selected.position} · {selected.ageYears} yr · {selected.matchesPlayed} matches</div>
                  </div>
                  <button onClick={() => setPlayers((x) => x.filter((y) => y.id !== selected.id))}
                    className="shrink-0 text-[11px] font-bold text-rose-500 hover:underline">Remove</button>
                </div>

                <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
                  <div className="text-[11px] font-bold uppercase text-neutral-500">Overall rating</div>
                  <div className="text-3xl font-black text-ink dark:text-ink">
                    {valuation.overall}
                    <span className="text-base font-bold text-neutral-500"> ± {valuation.confidence}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-500">The range comes from the number of matches, not from the player’s quality</div>
                </div>

                {valuation.sampleWarning && (
                  <div className="mt-2 rounded-xl bg-rose-50 p-3 text-[12px] leading-relaxed text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
                    {valuation.sampleWarning}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {valuation.agents.map((a) => (
                    <div key={a.agent} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] font-black text-ink dark:text-ink">{a.agent}</div>
                        <div className="text-[14px] font-black text-brand-dark">{a.score}</div>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, a.score))}%` }} />
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">{a.reasoning}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl border border-brand/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Disagreement between agents</span>
                    <Badge tone={valuation.disagreement >= 40 ? 'critical' : valuation.disagreement >= 20 ? 'high' : 'normal'}>
                      {valuation.disagreement} poin
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{valuation.disagreementNote}</p>
                </div>
              </Card>

              <Card className="!p-4">
                <SectionTitle icon={<IconActivity size={18} />} title="Similar players"
                  subtitle="Cosine similarity on normalised performance vectors" />
                {similar.length === 0 ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
                    At least two players in the same sport are needed to compare.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {similar.map((s) => (
                      <div key={s.player.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-ink dark:text-ink">{s.player.name}</span>
                          <span className="text-[12px] font-black text-brand-dark">{(s.similarity * 100).toFixed(0)}%</span>
                        </div>
                        {s.sharedStrengths.length > 0 && (
                          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                            Both strong in: {s.sharedStrengths.join(', ')}
                          </p>
                        )}
                        {s.biggestDifference && (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                            Biggest difference: {s.biggestDifference}
                          </p>
                        )}
                      </div>
                    ))}
                    <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                      Every dimension has a name, so a "similar" result can always be explained —
                      not merely asserted.
                    </p>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        An analysis aid, not a replacement for the judgement of a coach or a scout. All data is
        entered and stored by you on this device — there is no built-in player database.
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase text-neutral-500">{label}</div>
      <div className="text-[14px] font-black text-ink dark:text-ink">{value}</div>
    </div>
  )
}

function AddPlayer({ sport, onAdd }: { sport: Sport; onAdd: (p: Player) => void }) {
  const defs = SPORT_METRICS[sport]
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [age, setAge] = useState('25')
  const [played, setPlayed] = useState('20')
  const [missed, setMissed] = useState('2')
  const [minutes, setMinutes] = useState('80')
  const [metrics, setMetrics] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)

  function submit() {
    if (!name.trim()) return
    const m: Record<string, number> = {}
    for (const d of defs) m[d.key] = Number(metrics[d.key] ?? '') || 0
    onAdd({
      id: Math.random().toString(36).slice(2),
      name: name.trim(), sport,
      position: position.trim() || '—',
      ageYears: Number(age) || 0,
      matchesPlayed: Number(played) || 0,
      matchesMissed: Number(missed) || 0,
      minutesPerMatch: Number(minutes) || 0,
      metrics: m,
    })
    setName(''); setPosition(''); setMetrics({})
  }

  return (
    <Card className="!p-4">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <span className="text-[13px] font-black text-ink dark:text-ink">Add player</span>
        <span className="text-[11px] font-bold text-neutral-500">{open ? 'Close ▲' : 'Open ▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Position"><input className={inputClass} placeholder="Forward" value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Age"><input className={inputClass} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></Field>
            <Field label="Minutes per match"><input className={inputClass} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Matches played"><input className={inputClass} inputMode="numeric" value={played} onChange={(e) => setPlayed(e.target.value)} /></Field>
            <Field label="Matches missed (injury)"><input className={inputClass} inputMode="numeric" value={missed} onChange={(e) => setMissed(e.target.value)} /></Field>
          </div>

          <div className="pt-1 text-[11px] font-black uppercase tracking-wide text-neutral-500">{SPORT_LABEL[sport]} statistics</div>
          {defs.map((d) => (
            <Field key={d.key} label={d.label}>
              <input className={inputClass} inputMode="decimal" placeholder={d.hint ?? `elite ≈ ${d.eliteAt}`}
                value={metrics[d.key] ?? ''} onChange={(e) => setMetrics({ ...metrics, [d.key]: e.target.value })} />
            </Field>
          ))}

          <Button className="w-full" onClick={submit}>Save player</Button>
        </div>
      )}
    </Card>
  )
}

export default SportsLab
