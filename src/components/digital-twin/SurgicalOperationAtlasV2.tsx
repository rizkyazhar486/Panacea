import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type MotionState } from '../Body3D'
import { IconActivity, IconBook, IconHeart, IconShield, IconSparkle, IconTimer } from '../icons'
import {
  ALL_SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  getSurgicalCatalogStats,
  searchAllSurgicalProcedures,
  type SurgicalProcedure,
  type SurgicalSpecialty,
} from '../../lib/surgicalAtlasCatalog'

const REST_MOTION: MotionState = { heartRate: 72, respRate: 14, contractionRate: 0, peristalsisRate: 6 }

function specialtyLabel(value: SurgicalSpecialty) {
  return SURGICAL_SPECIALTIES.find((item) => item.key === value)?.label ?? value
}

function approachLabel(value: SurgicalProcedure['approach']) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

async function operationUniversePoster(procedure: SurgicalProcedure, total: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#020611')
  bg.addColorStop(.5, '#061812')
  bg.addColorStop(1, '#130c08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1350)

  const aurora = ctx.createRadialGradient(805, 245, 10, 805, 245, 620)
  aurora.addColorStop(0, 'rgba(0,191,99,.34)')
  aurora.addColorStop(.48, 'rgba(73,207,255,.11)')
  aurora.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = aurora
  ctx.fillRect(0, 0, 1080, 900)

  ctx.strokeStyle = 'rgba(240,214,138,.18)'
  ctx.lineWidth = 2
  for (let r = 150; r <= 420; r += 68) {
    ctx.beginPath()
    ctx.ellipse(805, 420, r, r * .4, -.15, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 50px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 82, 125)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '900 20px Montserrat, system-ui, sans-serif'
  ctx.fillText('OPERATION UNIVERSE · INTERACTIVE 4D SURGICAL ATLAS', 82, 170)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 62px Montserrat, system-ui, sans-serif'
  ctx.fillText(truncate(procedure.name, 29), 82, 330)
  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.font = '700 23px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${specialtyLabel(procedure.specialty)} · ${approachLabel(procedure.approach)} · ${truncate(procedure.region, 34)}`, 82, 376)

  procedure.phases.slice(0, 5).forEach((item, index) => {
    const y = 515 + index * 121
    ctx.fillStyle = index === 0 ? 'rgba(99,245,166,.12)' : 'rgba(255,255,255,.045)'
    ctx.beginPath()
    ctx.roundRect(82, y - 55, 916, 92, 24)
    ctx.fill()
    ctx.fillStyle = index === 0 ? '#63f5a6' : 'rgba(255,255,255,.38)'
    ctx.font = '900 17px Montserrat, system-ui, sans-serif'
    ctx.fillText(String(index + 1).padStart(2, '0'), 118, y - 12)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 21px Montserrat, system-ui, sans-serif'
    ctx.fillText(truncate(item.title, 49), 180, y - 12)
  })

  ctx.fillStyle = 'rgba(255,255,255,.48)'
  ctx.font = '700 20px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${total} operations in one reusable anatomy-aware engine`, 82, 1135)
  ctx.fillStyle = 'rgba(255,255,255,.34)'
  ctx.font = '600 18px Montserrat, system-ui, sans-serif'
  ctx.fillText('Reference education · not patient-specific navigation or operative instructions', 82, 1180)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 82, 1260)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(82, 1280, 225, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

export function SurgicalOperationAtlasV2() {
  const stats = useMemo(() => getSurgicalCatalogStats(), [])
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<'all' | SurgicalSpecialty>('all')
  const [selectedId, setSelectedId] = useState(ALL_SURGICAL_PROCEDURES[0]?.id ?? '')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const [showPatientGate, setShowPatientGate] = useState(false)

  const filtered = useMemo(() => searchAllSurgicalProcedures(query, specialty), [query, specialty])
  const procedure = ALL_SURGICAL_PROCEDURES.find((item) => item.id === selectedId) ?? filtered[0] ?? ALL_SURGICAL_PROCEDURES[0]
  const current = procedure?.phases[Math.min(phaseIndex, procedure.phases.length - 1)]

  useEffect(() => {
    if (!filtered.length) return
    if (!filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    setPhaseIndex(0)
    setPlaying(false)
    setSelectedStructure('')
    setShareStatus('')
  }, [selectedId])

  useEffect(() => {
    if (!playing || !procedure) return
    const timer = window.setInterval(() => {
      setPhaseIndex((index) => {
        if (index >= procedure.phases.length - 1) {
          setPlaying(false)
          return index
        }
        return index + 1
      })
    }, 3600)
    return () => window.clearInterval(timer)
  }, [playing, procedure])

  if (!procedure || !current) return null

  async function shareOperation() {
    const snapshot = procedure
    const blob = await operationUniversePoster(snapshot, stats.procedures)
    if (!blob) {
      setShareStatus('Share poster unavailable on this browser')
      return
    }
    const file = new File([blob], `panacea-${snapshot.id}-operation-universe.png`, { type: 'image/png' })
    const text = `Exploring ${snapshot.name} in PanaceaMed Operation Universe: an anatomy-aware 4D surgical education atlas with structures at risk and patient-specific provenance gates.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${snapshot.name} · PanaceaMed Operation Universe`, text, files: [file] })
        setShareStatus('Operation Universe card shared')
        return
      }
    } catch {
      // Fall back to a local PNG export.
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareStatus('Operation Universe poster exported')
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#030914] text-white shadow-[0_36px_120px_rgba(0,0,0,.32)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]"><IconSparkle size={14} /> Panacea Operation Universe</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-4xl">One 4D engine for an expanding universe of operations.</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">Every procedure uses the same scientific scene contract: approach → anatomy → target/risk map → treatment concept → final anatomy. It is built for education and rehearsal; patient-specific navigation remains locked until real imaging, registration and clinician review exist.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [stats.procedures, 'operations'],
              [stats.specialties, 'specialties'],
              [stats.phases, '4D phases'],
              [stats.riskMentions, 'risk links'],
            ].map(([value, label]) => (
              <div key={label} className="min-w-[92px] rounded-2xl border border-white/8 bg-white/[.035] px-3 py-2.5 text-center">
                <div className="text-xl font-black text-[#f0d68a]">{value}</div>
                <div className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-white/30">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto]">
          <label className="relative min-w-0">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35" aria-hidden>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search operation, organ, region, structure at risk, complication…" className="h-11 w-full rounded-2xl border border-white/10 bg-white/[.055] pl-10 pr-4 text-xs font-semibold text-white outline-none placeholder:text-white/25 focus:border-emerald-300/30" />
          </label>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {SURGICAL_SPECIALTIES.map((item) => (
              <button key={item.key} onClick={() => setSpecialty(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black ${specialty === item.key ? 'border-[#f0d68a]/35 bg-[#f0d68a] text-[#171106]' : 'border-white/10 text-white/45'}`}>{item.label}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[310px_1fr]">
        <aside className="max-h-[790px] overflow-y-auto border-b border-white/8 p-4 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-[.18em] text-white/28">Operation library</span>
            <span className="text-[9px] font-black text-emerald-300">{filtered.length} shown</span>
          </div>
          <div className="space-y-2">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === item.id ? 'border-emerald-300/25 bg-emerald-300/[.075]' : 'border-white/8 bg-white/[.025] hover:bg-white/[.045]'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wide text-[#f0d68a]/70">{specialtyLabel(item.specialty)}</span>
                  <span className="text-[8px] font-bold uppercase text-white/25">{item.approach}</span>
                </div>
                <div className="mt-1.5 text-xs font-black text-white/82">{item.name}</div>
                <div className="mt-1 text-[9px] text-white/30">{item.region} · {item.phases.length} phases</div>
              </button>
            ))}
            {!filtered.length && (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[.02] p-4 text-center">
                <div className="text-xs font-black text-white/65">No match yet.</div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/32">The engine can accept another procedure record without requiring a new renderer.</p>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            <div className="relative min-h-[600px] border-b border-white/8 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,191,99,.11),transparent_36%),radial-gradient(circle_at_90%_74%,rgba(240,214,138,.08),transparent_32%)]" />
              <div className="relative h-[600px]">
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

              <div className="pointer-events-none absolute left-4 top-4 max-w-[78%] rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
                <div className="text-[8px] font-black uppercase tracking-[.18em] text-[#f0d68a]">{specialtyLabel(procedure.specialty)} · {approachLabel(procedure.approach)}</div>
                <div className="mt-1 text-lg font-black">{procedure.name}</div>
                <div className="mt-1 text-[10px] text-white/38">{procedure.region}</div>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/52 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">Phase {phaseIndex + 1}/{procedure.phases.length}</span>
                  <span className="text-[9px] text-white/28">Dissection {current.dissect}/6 · unfold {Math.round(current.unfold * 100)}%</span>
                </div>
                <div className="mt-1 text-base font-black">{current.title}</div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/55">{current.narration}</p>
                {selectedStructure && <div className="mt-2 text-[9px] font-bold text-[#f0d68a]">Selected anatomy: {selectedStructure}</div>}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[.17em] text-white/30">Current objective</div>
                  <div className="mt-2 text-xl font-black tracking-[-.025em]">{current.objective}</div>
                </div>
                <button onClick={() => setPlaying((value) => !value)} className="rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-4 py-2 text-[10px] font-black text-emerald-200">{playing ? 'Pause 4D story' : 'Play operation story'}</button>
              </div>

              <div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-300/[.05] p-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-rose-200"><IconHeart size={13} /> Structures at risk</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{current.structuresAtRisk.map((item) => <span key={item} className="rounded-full border border-rose-200/12 bg-black/20 px-2.5 py-1.5 text-[10px] font-bold text-rose-100/75">{item}</span>)}</div>
              </div>

              <div className="mt-3 rounded-2xl border border-[#f0d68a]/15 bg-[#f0d68a]/[.055] p-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#f0d68a]"><IconShield size={13} /> Safety checkpoint</div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/58">{current.checkpoint}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-white/8 bg-white/[.025] p-4">
                <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/30">Instrument families — orientation only</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{current.instrumentFamilies.map((item) => <span key={item} className="rounded-full border border-white/8 px-2.5 py-1 text-[9px] font-bold text-white/42">{item}</span>)}</div>
              </div>

              <div className="mt-4 space-y-2">
                {procedure.phases.map((item, index) => (
                  <button key={item.id} onClick={() => { setPhaseIndex(index); setPlaying(false) }} className={`w-full rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-emerald-300/20 bg-emerald-300/[.06]' : 'border-white/8 bg-white/[.02]'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[9px] font-black ${index === phaseIndex ? 'bg-emerald-300 text-[#04100a]' : 'bg-white/5 text-white/35'}`}>{index + 1}</span>
                      <div className="min-w-0"><div className="text-[11px] font-black text-white/78">{item.title}</div><div className="mt-0.5 truncate text-[9px] text-white/30">{item.objective}</div></div>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={shareOperation} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f0d68a] px-4 py-2.5 text-[10px] font-black text-[#171106]"><IconActivity size={14} /> Share Operation Universe</button>
              {shareStatus && <div className="mt-2 text-[9px] font-bold text-emerald-300">{shareStatus}</div>}
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/8 p-5 md:grid-cols-3 sm:p-6">
            <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-cyan-200"><IconBook size={13} /> Learning objectives</div>
              <div className="mt-3 space-y-2">{procedure.learningObjectives.map((item) => <div key={item} className="flex gap-2 text-[10px] leading-relaxed text-white/48"><span className="text-cyan-300">•</span><span>{item}</span></div>)}</div>
            </article>
            <article className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-rose-200"><IconTimer size={13} /> Complication map</div>
              <div className="mt-3 flex flex-wrap gap-1.5">{procedure.complications.map((item) => <span key={item} className="rounded-full border border-rose-200/10 px-2.5 py-1 text-[9px] text-white/42">{item}</span>)}</div>
            </article>
            <article className="rounded-2xl border border-emerald-300/12 bg-emerald-300/[.045] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-emerald-300"><IconShield size={13} /> Patient-specific gate</div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/45">Reference anatomy never becomes a patient surgical plan merely by adding demographics. Real geometry and clinician review are required.</p>
              <button onClick={() => setShowPatientGate((value) => !value)} className="mt-3 rounded-full border border-emerald-300/15 px-3 py-2 text-[9px] font-black text-emerald-200">{showPatientGate ? 'Hide requirements' : 'Show requirements'}</button>
              {showPatientGate && <div className="mt-3 space-y-1.5">{procedure.patientSpecificInputs.map((item) => <div key={item} className="text-[9px] leading-relaxed text-white/40">• {item}</div>)}</div>}
            </article>
          </div>

          <div className="border-t border-white/8 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f0d68a]">Specialty constellation</div>
                <p className="mt-1 text-[10px] text-white/36">The catalog expands by data records, not separate pages or separate render engines.</p>
              </div>
              <div className="text-[9px] font-black uppercase tracking-wide text-white/25">Reference education · evidence level: {procedure.evidenceLevel}</div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {stats.bySpecialty.map((item) => (
                <button key={item.specialty} onClick={() => setSpecialty(item.specialty)} className="rounded-2xl border border-white/8 bg-white/[.025] p-3 text-left hover:bg-white/[.045]">
                  <div className="text-lg font-black text-white">{item.count}</div>
                  <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/30">{specialtyLabel(item.specialty)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
