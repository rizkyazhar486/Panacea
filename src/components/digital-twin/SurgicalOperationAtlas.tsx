import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type MotionState } from '../Body3D'
import { IconActivity, IconBook, IconHeart, IconShield, IconSparkle, IconTimer } from '../icons'
import {
  SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  searchSurgicalProcedures,
  type SurgicalProcedure,
  type SurgicalSpecialty,
} from '../../lib/surgicalAtlas'

const REST_MOTION: MotionState = { heartRate: 72, respRate: 14, contractionRate: 0, peristalsisRate: 6 }

function specialtyLabel(value: SurgicalSpecialty) {
  return SURGICAL_SPECIALTIES.find((item) => item.key === value)?.label ?? value
}

function approachLabel(value: SurgicalProcedure['approach']) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

async function operationPoster(procedure: SurgicalProcedure): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#020611')
  bg.addColorStop(.52, '#071510')
  bg.addColorStop(1, '#120b08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1350)

  const glow = ctx.createRadialGradient(820, 260, 20, 820, 260, 600)
  glow.addColorStop(0, 'rgba(0,191,99,.32)')
  glow.addColorStop(.55, 'rgba(50,196,255,.10)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 900)

  ctx.strokeStyle = 'rgba(240,214,138,.20)'
  ctx.lineWidth = 2
  for (let r = 170; r <= 430; r += 86) {
    ctx.beginPath()
    ctx.ellipse(790, 470, r, r * .38, -.18, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 50px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 88, 130)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '900 21px Montserrat, system-ui, sans-serif'
  ctx.fillText('SURGICAL OPERATION ATLAS · 4D', 88, 174)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px Montserrat, system-ui, sans-serif'
  const title = procedure.name.length > 27 ? `${procedure.name.slice(0, 27)}…` : procedure.name
  ctx.fillText(title, 88, 340)
  ctx.fillStyle = 'rgba(255,255,255,.50)'
  ctx.font = '700 24px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${specialtyLabel(procedure.specialty)} · ${approachLabel(procedure.approach)} · ${procedure.region}`, 88, 390)

  const phases = procedure.phases.slice(0, 5)
  phases.forEach((item, index) => {
    const y = 545 + index * 125
    ctx.fillStyle = index === 0 ? 'rgba(99,245,166,.12)' : 'rgba(255,255,255,.045)'
    ctx.beginPath()
    ctx.roundRect(88, y - 62, 904, 98, 26)
    ctx.fill()
    ctx.fillStyle = index === 0 ? '#63f5a6' : 'rgba(255,255,255,.42)'
    ctx.font = '900 18px Montserrat, system-ui, sans-serif'
    ctx.fillText(String(index + 1).padStart(2, '0'), 126, y - 17)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 22px Montserrat, system-ui, sans-serif'
    ctx.fillText(item.title, 190, y - 17)
  })

  ctx.fillStyle = 'rgba(255,255,255,.48)'
  ctx.font = '600 20px Montserrat, system-ui, sans-serif'
  ctx.fillText('Reference anatomy · educational rehearsal · not operative guidance', 88, 1190)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 88, 1260)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(88, 1280, 225, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

function EmptyCatalog({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[.02] p-5 text-center">
      <div className="text-sm font-black text-white/70">No seeded operation matches “{query || 'this filter'}” yet.</div>
      <p className="mt-2 text-[11px] leading-relaxed text-white/35">The renderer is universal: a new operation only needs a procedure record with phases, anatomy keywords, structures at risk and provenance. No new 3D engine is required.</p>
    </div>
  )
}

export function SurgicalOperationAtlas() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<'all' | SurgicalSpecialty>('all')
  const [selectedId, setSelectedId] = useState(SURGICAL_PROCEDURES[0]?.id ?? '')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState('')
  const [shareStatus, setShareStatus] = useState('')

  const filtered = useMemo(() => searchSurgicalProcedures(query, specialty), [query, specialty])
  const procedure = SURGICAL_PROCEDURES.find((item) => item.id === selectedId) ?? filtered[0] ?? SURGICAL_PROCEDURES[0]
  const current = procedure?.phases[Math.min(phaseIndex, procedure.phases.length - 1)]

  useEffect(() => {
    if (!filtered.length) return
    if (!filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id)
      setPhaseIndex(0)
      setPlaying(false)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    setPhaseIndex(0)
    setPlaying(false)
    setSelectedStructure('')
  }, [selectedId])

  useEffect(() => {
    if (!playing || !procedure) return
    const id = window.setInterval(() => {
      setPhaseIndex((index) => {
        if (index >= procedure.phases.length - 1) {
          setPlaying(false)
          return index
        }
        return index + 1
      })
    }, 3400)
    return () => window.clearInterval(id)
  }, [playing, procedure])

  if (!procedure || !current) return null

  async function shareOperation() {
    const blob = await operationPoster(procedure)
    if (!blob) {
      setShareStatus('Share poster unavailable on this browser')
      return
    }
    const file = new File([blob], `panacea-${procedure.id}-atlas.png`, { type: 'image/png' })
    const text = `Exploring ${procedure.name} in the PanaceaMed 4D Surgical Operation Atlas — anatomy, phases, structures at risk and safety checkpoints in one educational scene.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${procedure.name} · PanaceaMed Surgical Atlas`, text, files: [file] })
        setShareStatus('Operation atlas card shared')
        return
      }
    } catch {
      // Fall through to local export.
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareStatus('Operation atlas poster exported')
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#030914] text-white shadow-[0_34px_110px_rgba(0,0,0,.30)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]"><IconSparkle size={14} /> Panacea Surgical Operation Atlas</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-4xl">Any operation becomes an anatomy-aware 4D story.</h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/50 sm:text-sm">One reusable surgical scene contract: approach → anatomy → target → structures at risk → safety checkpoint → reconstruction. The current catalog is reference education; patient-specific rehearsal stays locked until validated imaging and registration are supplied.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Seed catalog</div>
            <div className="mt-1 text-2xl font-black">{SURGICAL_PROCEDURES.length}</div>
            <div className="text-[9px] text-white/35">operations · universal schema</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35" aria-hidden>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search operation, anatomy, complication or region…" className="h-11 w-full rounded-2xl border border-white/10 bg-white/[.055] pl-10 pr-4 text-xs font-semibold text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30" />
          </label>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {SURGICAL_SPECIALTIES.map((item) => (
              <button key={item.key} onClick={() => setSpecialty(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${specialty === item.key ? 'border-[#f0d68a]/35 bg-[#f0d68a] text-[#171106]' : 'border-white/10 text-white/45'}`}>{item.label}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[300px_1fr]">
        <aside className="max-h-[720px] overflow-y-auto border-b border-white/8 p-4 xl:border-b-0 xl:border-r">
          <div className="mb-3 text-[9px] font-black uppercase tracking-[.18em] text-white/28">Operation library</div>
          <div className="space-y-2">
            {filtered.length ? filtered.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === item.id ? 'border-emerald-300/25 bg-emerald-300/[.07]' : 'border-white/8 bg-white/[.025] hover:bg-white/[.045]'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wide text-[#f0d68a]/70">{specialtyLabel(item.specialty)}</span>
                  <span className="text-[8px] font-bold uppercase text-white/25">{item.approach}</span>
                </div>
                <div className="mt-1.5 text-xs font-black text-white/82">{item.name}</div>
                <div className="mt-1 text-[9px] text-white/30">{item.region} · {item.phases.length} phases</div>
              </button>
            )) : <EmptyCatalog query={query} />}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="grid lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative min-h-[580px] border-b border-white/8 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,191,99,.10),transparent_36%),radial-gradient(circle_at_88%_72%,rgba(240,214,138,.08),transparent_32%)]" />
              <div className="relative h-[580px]">
                <Body3D
                  layers={new Set(current.layers)}
                  highlighted={[]}
                  focusKeywords={current.focusKeywords.length ? current.focusKeywords : null}
                  renderMode="anatomy"
                  ctWindow={CT_WINDOWS[0]}
                  slicePlane="none"
                  slicePos={.5}
                  motion={REST_MOTION}
                  unfold={current.unfold}
                  dissect={current.dissect}
                  onPick={(_raw, label) => setSelectedStructure(label)}
                />
              </div>

              <div className="pointer-events-none absolute left-4 top-4 max-w-[72%] rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
                <div className="text-[8px] font-black uppercase tracking-[.18em] text-[#f0d68a]">{specialtyLabel(procedure.specialty)} · {approachLabel(procedure.approach)}</div>
                <div className="mt-1 text-lg font-black">{procedure.name}</div>
                <div className="mt-1 text-[10px] leading-relaxed text-white/40">{procedure.region}</div>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">Phase {phaseIndex + 1}/{procedure.phases.length}</div>
                  <div className="text-[9px] text-white/30">Dissection {current.dissect}/6 · unfold {Math.round(current.unfold * 100)}%</div>
                </div>
                <div className="mt-1 text-base font-black">{current.title}</div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/55">{current.narration}</p>
                {selectedStructure && <div className="mt-2 text-[9px] font-bold text-[#f0d68a]">Selected anatomy: {selectedStructure}</div>}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-white/30">Current objective</div>
              <div className="mt-2 text-xl font-black tracking-[-.025em]">{current.objective}</div>

              <div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-300/[.05] p-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-rose-200"><IconHeart size={13} /> Structures at risk</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{current.structuresAtRisk.map((item) => <span key={item} className="rounded-full border border-rose-200/12 bg-black/15 px-2.5 py-1.5 text-[9px] font-bold text-white/60">{item}</span>)}</div>
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-emerald-200"><IconShield size={13} /> Safety checkpoint</div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">{current.checkpoint}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/30">Instrument families · contextual only</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{current.instrumentFamilies.map((item) => <span key={item} className="rounded-full bg-white/[.055] px-2.5 py-1.5 text-[9px] font-bold text-white/45">{item}</span>)}</div>
                <p className="mt-2 text-[9px] leading-relaxed text-white/25">No device sizes, energy settings, cutting parameters or patient-specific operative instructions are generated here.</p>
              </div>

              <div className="mt-5">
                <div className="flex gap-1">{procedure.phases.map((item, index) => <button key={item.id} aria-label={`Phase ${index + 1}: ${item.title}`} onClick={() => { setPhaseIndex(index); setPlaying(false) }} className={`h-2 flex-1 rounded-full ${index <= phaseIndex ? 'bg-emerald-300' : 'bg-white/10'}`} />)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { if (phaseIndex >= procedure.phases.length - 1) setPhaseIndex(0); setPlaying((v) => !v) }} className="rounded-full bg-emerald-400 px-5 py-2.5 text-[11px] font-black text-emerald-950">{playing ? 'Pause 4D operation' : '▶ Play 4D operation'}</button>
                  <button onClick={() => { setPhaseIndex(0); setPlaying(false) }} className="rounded-full border border-white/12 px-4 py-2.5 text-[11px] font-black text-white/55">Restart</button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/8 lg:grid-cols-3">
            <div className="p-5 lg:border-r lg:border-white/8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-cyan-200"><IconBook size={13} /> Learning objectives</div>
              <div className="mt-3 space-y-2">{procedure.learningObjectives.map((item) => <div key={item} className="flex gap-2 text-[10px] leading-relaxed text-white/48"><span className="text-cyan-300">•</span><span>{item}</span></div>)}</div>
            </div>
            <div className="border-t border-white/8 p-5 lg:border-r lg:border-t-0 lg:border-white/8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-amber-100"><IconActivity size={13} /> Complication map</div>
              <div className="mt-3 flex flex-wrap gap-1.5">{procedure.complications.map((item) => <span key={item} className="rounded-full border border-amber-100/10 px-2.5 py-1.5 text-[9px] text-white/45">{item}</span>)}</div>
            </div>
            <div className="border-t border-white/8 p-5 lg:border-t-0">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-violet-200"><IconTimer size={13} /> Patient-specific gate</div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/38">Locked until real data are supplied and validated:</p>
              <div className="mt-2 space-y-1.5">{procedure.patientSpecificInputs.map((item) => <div key={item} className="text-[9px] text-white/42">🔒 {item}</div>)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 p-5">
            <div className="max-w-2xl text-[9px] leading-relaxed text-white/28"><strong className="text-white/45">Educational boundary:</strong> this atlas teaches anatomy, sequence concepts and safety awareness. It is not operative guidance, credentialing, navigation, a patient plan or a substitute for supervised surgical training.</div>
            <div className="flex items-center gap-2">
              <button onClick={shareOperation} className="rounded-full bg-[#f0d68a] px-4 py-2.5 text-[10px] font-black text-[#171106]">Share operation atlas</button>
              {shareStatus && <span className="text-[9px] font-bold text-emerald-300">{shareStatus}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
