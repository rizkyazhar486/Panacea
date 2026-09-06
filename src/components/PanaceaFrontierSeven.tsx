import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PANACEA_FRONTIER_SEVEN, frontierReadiness } from '../lib/panaceaFrontierSeven'

const PIN_KEY = 'pmd_frontier_seven_pins_v1'
const NOTE_KEY = 'pmd_frontier_seven_notes_v1'

function loadPins() { try { return new Set<string>(JSON.parse(localStorage.getItem(PIN_KEY) || '[]')) } catch { return new Set<string>() } }
function loadNotes() { try { return JSON.parse(localStorage.getItem(NOTE_KEY) || '{}') as Record<string, string> } catch { return {} } }

export function PanaceaFrontierSeven() {
  const [selectedId, setSelectedId] = useState(PANACEA_FRONTIER_SEVEN[0].id)
  const [pins, setPins] = useState<Set<string>>(loadPins)
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes)
  const [copied, setCopied] = useState(false)

  const selected = useMemo(() => PANACEA_FRONTIER_SEVEN.find((item) => item.id === selectedId) ?? PANACEA_FRONTIER_SEVEN[0], [selectedId])
  const readiness = frontierReadiness(selected.status)

  function togglePin(id: string) {
    setPins((previous) => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(PIN_KEY, JSON.stringify([...next])) } catch { /* unavailable */ }
      return next
    })
  }
  function saveNote(value: string) {
    const next = { ...notes, [selected.id]: value }
    setNotes(next)
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(next)) } catch { /* unavailable */ }
  }
  async function copySpec() {
    const text = `${selected.name}\nMission: ${selected.mission}\nProblem: ${selected.humanProblem}\nExperience:\n- ${selected.experience.join('\n- ')}\nInputs:\n- ${selected.inputs.join('\n- ')}\nOutputs:\n- ${selected.outputs.join('\n- ')}\nSafety boundary: ${selected.safetyBoundary}`
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1400) } catch { setCopied(false) }
  }

  return (
    <section className="rounded-[32px] border border-neutral-200 bg-neutral-950 p-4 text-white shadow-[0_28px_80px_rgba(0,0,0,.18)] dark:border-white/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl"><div className="text-[9px] font-black uppercase tracking-[.2em] text-fuchsia-300">Panacea Frontier Seven · experimental product studio</div><h2 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Seven ambitious health-and-humanity products that connect medicine back to life.</h2><p className="mt-2 text-[10px] leading-relaxed text-white/50">These are Panacea first-of-kind ambitions, not a factual claim that no similar concept exists anywhere. Each card states what can be prototyped now, what remains research, and where human/clinical consent must stay in control.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.06] px-3 py-2 text-[9px] font-black text-white/55">Pinned roadmap · {pins.size}/7</div>
      </div>

      <div className="no-scrollbar -mx-1 mt-5 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        {PANACEA_FRONTIER_SEVEN.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-[190px] shrink-0 snap-start rounded-[24px] border p-3 text-left transition ${selected.id === item.id ? 'border-fuchsia-300/50 bg-fuchsia-300/10' : 'border-white/10 bg-white/[.035]'}`}>
            <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-lg font-black">{item.icon}</span><span className="text-[9px] font-black text-white/30">0{index + 1}</span></div>
            <div className="mt-4 text-[12px] font-black leading-tight">{item.shortName}</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-fuchsia-300/70">{item.status.replaceAll('-', ' ')}</div>
            <p className="mt-2 line-clamp-3 text-[9px] leading-relaxed text-white/42">{item.humanProblem}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-[26px] border border-white/10 bg-white/[.045] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.14em] text-fuchsia-300">{selected.name}</div><h3 className="mt-1 text-xl font-black">{selected.mission}</h3></div><button type="button" onClick={() => togglePin(selected.id)} className={`rounded-full px-3 py-2 text-[9px] font-black ${pins.has(selected.id) ? 'bg-amber-200 text-amber-950' : 'bg-white/10 text-white/60'}`}>{pins.has(selected.id) ? '★ Pinned' : '☆ Pin roadmap'}</button></div>
          <div className="mt-4"><div className="mb-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wide text-white/35"><span>Prototype readiness</span><span>{readiness}% · {selected.status.replaceAll('-', ' ')}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-fuchsia-300" style={{ width: `${readiness}%` }} /></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Info title="Human problem" items={[selected.humanProblem]} /><Info title="Core experience" items={selected.experience} /><Info title="Inputs" items={selected.inputs} /><Info title="Outputs" items={selected.outputs} /></div>
          <div className="mt-3 rounded-[20px] border border-amber-300/20 bg-amber-300/[.07] p-3"><div className="text-[8px] font-black uppercase tracking-wide text-amber-200">Human / clinical gate</div><p className="mt-1 text-[10px] leading-relaxed text-white/60">{selected.safetyBoundary}</p></div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[26px] border border-white/10 bg-white/[.045] p-4"><div className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">Prototype notebook</div><p className="mt-1 text-[10px] leading-relaxed text-white/45">Write the smallest real-world experiment that could falsify or validate the value proposition. Saved locally; not a clinical study protocol.</p><textarea rows={6} value={notes[selected.id] ?? ''} onChange={(event) => saveNote(event.target.value)} placeholder="Example: 10 users, one week, one measurable workflow friction, explicit success/failure criterion…" className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-3 text-[10px] leading-relaxed text-white outline-none placeholder:text-white/25" /><button type="button" onClick={copySpec} className="mt-2 w-full rounded-2xl bg-white px-3 py-2.5 text-[10px] font-black text-neutral-950">{copied ? 'Spec copied ✓' : 'Copy product spec'}</button></div>
          <div className="rounded-[26px] border border-white/10 bg-white/[.045] p-4"><div className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">Connected Panacea surfaces</div><div className="mt-3 flex flex-wrap gap-2">{selected.routes.map((route) => <Link key={route} to={route} className="rounded-full bg-white/10 px-3 py-2 text-[9px] font-black text-white/70">Open {route} →</Link>)}</div></div>
        </div>
      </div>
    </section>
  )
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-[20px] bg-black/20 p-3"><div className="text-[8px] font-black uppercase tracking-wide text-white/30">{title}</div><ul className="mt-2 space-y-1.5">{items.map((item) => <li key={item} className="text-[9.5px] leading-relaxed text-white/58">• {item}</li>)}</ul></div>
}

export default PanaceaFrontierSeven
