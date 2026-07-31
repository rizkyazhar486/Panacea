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
          <h1 className="text-lg font-black text-ink dark:text-white">Sports Lab</h1>
          <p className="text-xs text-neutral-400">Valuasi pemain multi-agen & pencarian pemain serupa</p>
        </div>
      </div>

      <Card className="!p-4">
        <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Lima agen menilai pemain dari sudut yang berbeda dan <b>tidak saling melihat hasil satu sama
          lain</b>. Itu disengaja: nilai sebuah panel justru terletak pada kemungkinan mereka berbeda
          pendapat. Ketika agen "Produksi" dan agen "Ketersediaan" berselisih jauh, selisih itulah
          temuannya — bukan rata-ratanya. Setiap skor juga disertai rentang ketidakpastian yang
          ditentukan jumlah laga, karena pemain yang dinilai dari 4 laga dan 40 laga tidak setara.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Cabang olahraga</div>
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
            Belum ada pemain untuk {SPORT_LABEL[sport]}. Tambahkan minimal dua pemain agar pencarian
            pemain serupa bisa bekerja — kemiripan dihitung dari data yang Anda masukkan sendiri,
            bukan dari basis data bawaan.
          </p>
        </Card>
      ) : (
        <>
          <Card className="!p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Skuad ({roster.length})</div>
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
              <Stat label="Rata-rata nilai" value={String(team.averageOverall)} />
              <Stat label="Rata-rata usia" value={String(team.averageAge)} />
              <Stat label="Laga hilang" value={`${team.injuryLoadPct}%`} />
            </div>
          </Card>

          {selected && valuation && (
            <>
              <Card className="!p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-black text-ink dark:text-white">{selected.name}</h2>
                    <div className="text-[11px] text-neutral-400">{selected.position} · {selected.ageYears} th · {selected.matchesPlayed} laga</div>
                  </div>
                  <button onClick={() => setPlayers((x) => x.filter((y) => y.id !== selected.id))}
                    className="shrink-0 text-[11px] font-bold text-rose-500 hover:underline">Hapus</button>
                </div>

                <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
                  <div className="text-[11px] font-bold uppercase text-neutral-500">Nilai gabungan</div>
                  <div className="text-3xl font-black text-ink dark:text-white">
                    {valuation.overall}
                    <span className="text-base font-bold text-neutral-400"> ± {valuation.confidence}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-400">Rentang berasal dari jumlah laga, bukan dari mutu pemain</div>
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
                        <div className="text-[12px] font-black text-ink dark:text-white">{a.agent}</div>
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
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Selisih antar-agen</span>
                    <Badge tone={valuation.disagreement >= 40 ? 'critical' : valuation.disagreement >= 20 ? 'high' : 'normal'}>
                      {valuation.disagreement} poin
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{valuation.disagreementNote}</p>
                </div>
              </Card>

              <Card className="!p-4">
                <SectionTitle icon={<IconActivity size={18} />} title="Pemain serupa"
                  subtitle="Kemiripan kosinus pada vektor performa ternormalisasi" />
                {similar.length === 0 ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
                    Perlu minimal dua pemain pada cabang yang sama untuk membandingkan.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {similar.map((s) => (
                      <div key={s.player.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-ink dark:text-white">{s.player.name}</span>
                          <span className="text-[12px] font-black text-brand-dark">{(s.similarity * 100).toFixed(0)}%</span>
                        </div>
                        {s.sharedStrengths.length > 0 && (
                          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                            Sama-sama kuat pada: {s.sharedStrengths.join(', ')}
                          </p>
                        )}
                        {s.biggestDifference && (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                            Perbedaan terbesar: {s.biggestDifference}
                          </p>
                        )}
                      </div>
                    ))}
                    <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
                      Setiap dimensi punya nama, sehingga hasil "mirip" selalu bisa dijelaskan —
                      bukan sekadar dinyatakan.
                    </p>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Alat bantu analisis, bukan pengganti penilaian pelatih maupun pemandu bakat. Seluruh data
        dimasukkan dan disimpan oleh Anda sendiri di perangkat ini — tidak ada basis data pemain bawaan.
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase text-neutral-500">{label}</div>
      <div className="text-[14px] font-black text-ink dark:text-white">{value}</div>
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
        <span className="text-[13px] font-black text-ink dark:text-white">Tambah pemain</span>
        <span className="text-[11px] font-bold text-neutral-400">{open ? 'Tutup ▲' : 'Buka ▼'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nama"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Posisi"><input className={inputClass} placeholder="Penyerang" value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Usia"><input className={inputClass} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></Field>
            <Field label="Menit per laga"><input className={inputClass} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Laga dimainkan"><input className={inputClass} inputMode="numeric" value={played} onChange={(e) => setPlayed(e.target.value)} /></Field>
            <Field label="Laga absen (cedera)"><input className={inputClass} inputMode="numeric" value={missed} onChange={(e) => setMissed(e.target.value)} /></Field>
          </div>

          <div className="pt-1 text-[11px] font-black uppercase tracking-wide text-neutral-400">Statistik {SPORT_LABEL[sport]}</div>
          {defs.map((d) => (
            <Field key={d.key} label={d.label}>
              <input className={inputClass} inputMode="decimal" placeholder={d.hint ?? `elite ≈ ${d.eliteAt}`}
                value={metrics[d.key] ?? ''} onChange={(e) => setMetrics({ ...metrics, [d.key]: e.target.value })} />
            </Field>
          ))}

          <Button className="w-full" onClick={submit}>Simpan pemain</Button>
        </div>
      )}
    </Card>
  )
}

export default SportsLab
