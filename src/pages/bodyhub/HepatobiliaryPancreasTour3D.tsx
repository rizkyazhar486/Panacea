import { useEffect, useMemo, useState } from 'react'
import { AtlasViewer3D } from '../../components/AtlasViewer3D'
import { ATLAS_PARTS } from '../../lib/systemAtlas.gen'

interface TourStop {
  id: string
  label: string
  description: string
  names: string[]
}

const TOUR: TourStop[] = [
  {
    id: 'liver-surface',
    label: 'Liver surface & porta hepatis',
    description: 'Orient the liver capsule and porta hepatis before following the extrahepatic ducts.',
    names: ['Capsule of the liver', 'Porta hepatis', 'Falciform ligament', 'Coronary ligament'],
  },
  {
    id: 'hepatic-ducts',
    label: 'Right + left hepatic ducts',
    description: 'Follow the named right and left hepatic ducts toward the common hepatic duct.',
    names: ['Right hepatic duct', 'Left hepatic duct', 'Common hepatic duct'],
  },
  {
    id: 'gallbladder',
    label: 'Gallbladder & cystic duct',
    description: 'Inspect the gallbladder together with the cystic duct and its relationship to the common hepatic duct.',
    names: ['Gallbladder', 'Cystic duct', 'Common hepatic duct'],
  },
  {
    id: 'common-bile-duct',
    label: 'Common bile duct',
    description: 'Isolate the common bile duct as it approaches the pancreatic head region.',
    names: ['Common bile duct', 'Head of pancreas', 'Hepatoduodenal ligament'],
  },
  {
    id: 'pancreas',
    label: 'Pancreas',
    description: 'Move across the head, uncinate process, neck, body and tail using the registered source geometry.',
    names: ['Head of pancreas', 'Uncinate process', 'Neck of pancreas', 'Body of pancreas', 'Tail of pancreas'],
  },
  {
    id: 'pancreatic-ducts',
    label: 'Pancreatic ducts & ampulla',
    description: 'Finish at the registered pancreatic ducts and hepatopancreatic ampulla. This is an anatomy tour, not a simulated bile or pancreatic-juice flow.',
    names: ['Ventral pancreatic duct', 'Dorsal pancreatic duct', 'Hepatopancreatic ampulla', 'Common bile duct'],
  },
]

export default function HepatobiliaryPancreasTour3D() {
  const parts = useMemo(() => ATLAS_PARTS.filter((part) => part.module === 'bilier'), [])
  const availableNames = useMemo(() => new Set(parts.map((part) => part.name)), [parts])
  const stops = useMemo(() => TOUR.map((stop) => ({
    ...stop,
    names: stop.names.filter((name) => availableNames.has(name)),
  })).filter((stop) => stop.names.length > 0), [availableNames])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const stop = stops[Math.min(index, Math.max(0, stops.length - 1))]

  useEffect(() => {
    if (!stop) return
    setSelected(stop.names[0] ?? null)
  }, [stop?.id])

  useEffect(() => {
    if (!playing || stops.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % stops.length)
    }, 3600)
    return () => window.clearInterval(timer)
  }, [playing, stops.length])

  const viewerParts = useMemo(() => parts.map((part) => ({
    name: part.name,
    kind: part.kind,
    group: part.source,
  })), [parts])

  if (!stop) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-[11px] leading-relaxed text-neutral-500">
        The registered biliary/pancreatic source set is not available in this build, so Panacea is not substituting generic anatomy.
      </div>
    )
  }

  const progress = ((index + 1) / stops.length) * 100

  return (
    <section data-hepatobiliary-tour3d="v1" className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 text-white dark:border-white/10">
      <div className="border-b border-white/10 bg-gradient-to-br from-emerald-400/10 via-transparent to-amber-300/10 p-4">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Hepatobiliary + pancreas · source-backed 3D</div>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-black">Trace the real registered structures, one relationship at a time</h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/55">
              This guided view uses the existing biliary/pancreatic atlas geometry already registered in Panacea. It does not invent missing ducts, vessels, motion, measurements or patient-specific anatomy.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
            className="min-h-11 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 text-[10px] font-black text-emerald-200"
          >
            {playing ? 'Pause tour' : 'Auto tour'}
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-emerald-300 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(250px,.55fr)]">
        <div className="relative min-h-[390px] border-b border-white/10 lg:min-h-[520px] lg:border-b-0 lg:border-r lg:border-white/10">
          <AtlasViewer3D
            berkas="atlas/bilier.glb"
            bagian={viewerParts}
            lesi={stop.names}
            dipilih={selected}
            onPilih={setSelected}
            tinggi={520}
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[9px] font-bold text-white/75 backdrop-blur">
            Drag / touch to rotate · tap a structure
          </div>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          <div aria-live="polite" className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Stop {index + 1} of {stops.length}</div>
            <div className="mt-1 text-sm font-black">{stop.label}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-white/60">{stop.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {stop.names.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected === name}
                  onClick={() => { setPlaying(false); setSelected(name) }}
                  className={`min-h-11 rounded-full border px-3 py-1 text-left text-[9px] font-bold ${selected === name ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 text-white/65'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => { setPlaying(false); setIndex((value) => Math.max(0, value - 1)) }}
              className="min-h-11 flex-1 rounded-xl border border-white/10 px-3 text-[10px] font-black disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={index === stops.length - 1}
              onClick={() => { setPlaying(false); setIndex((value) => Math.min(stops.length - 1, value + 1)) }}
              className="min-h-11 flex-1 rounded-xl bg-emerald-300 px-3 text-[10px] font-black text-black disabled:opacity-30"
            >
              Next →
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-[9px] leading-relaxed text-white/45">
            <span className="font-black text-white/70">Source boundary. </span>
            Structures shown here are the names actually present in Panacea’s generated <span className="font-mono">bilier</span> atlas manifest. The current set includes HuBMAP HRA female reference geometry. A highlighted sequence is an educational orientation aid, not evidence of physiological flow, disease, obstruction, surgical safety or an individual patient’s anatomy.
          </div>
        </div>
      </div>
    </section>
  )
}
