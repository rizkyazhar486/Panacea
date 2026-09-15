import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BODY_WORLD_AXES,
  BODY_WORLD_MISSION_COUNT,
  bodyWorldAxisStats,
  bodyWorldHumanCount,
  bodyWorldMissionSet,
  type BodyWorldMission,
} from '../lib/bodyOpenWorldFactory'

const ZONE_POSITIONS = BODY_WORLD_AXES.zone.map((zone, index) => ({
  zone,
  x: 8 + ((index * 37) % 84),
  y: 10 + ((index * 53) % 78),
}))

function MissionCard({ mission, active, onClick }: { mission: BodyWorldMission; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border p-3 text-left transition ${active ? 'border-cyan-300/25 bg-cyan-300/[.07]' : 'border-white/[.06] bg-white/[.025] hover:border-white/[.12] hover:bg-white/[.045]'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-100/55">{mission.selection.system}</span>
        <span className="text-[7px] font-bold text-white/22">{mission.id}</span>
      </div>
      <div className="mt-1.5 text-[11px] font-black leading-tight text-white/76">{mission.title}</div>
      <div className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-relaxed text-white/32">{mission.objectiveText}</div>
    </button>
  )
}

export default function BodyOpenWorldLab() {
  const reduceMotion = useReducedMotion()
  const stats = useMemo(() => bodyWorldAxisStats(), [])
  const [seed, setSeed] = useState('panaceamed-open-world')
  const [nonce, setNonce] = useState(0)
  const missions = useMemo(() => bodyWorldMissionSet(`${seed}:${nonce}`, 18), [seed, nonce])
  const [selectedIndex, setSelectedIndex] = useState<bigint>(missions[0]?.index ?? 0n)
  const selected = missions.find((mission) => mission.index === selectedIndex) ?? missions[0]

  function choose(mission: BodyWorldMission) {
    setSelectedIndex(mission.index)
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-[#020407]/95 shadow-[0_28px_100px_rgba(0,0,0,.46)]" aria-labelledby="body-open-world-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-[-16%] top-[-28%] h-[500px] w-[500px] rounded-full bg-cyan-400/[.07] blur-[150px]" />
        <div className="absolute bottom-[-30%] right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-500/[.065] blur-[160px]" />
      </div>

      <header className="relative z-[2] border-b border-white/[.065] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.23em] text-cyan-200">Body Open World · Experimental learning game architecture</div>
            <h3 id="body-open-world-title" className="mt-2 text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">A navigable medical world with procedural missions.</h3>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/48">
              This is not a claim of GTA-scale production scope. It is a reusable open-world learning architecture: zones, missions, encounters, progression, rewards, visual styles and time states are generated as deterministic coordinates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 xl:w-[390px]">
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">Mission space</div>
              <div className="mt-1 text-sm font-black text-white/80">{bodyWorldHumanCount()}</div>
            </div>
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">Coordinates</div>
              <div className="mt-1 text-sm font-black text-cyan-100/70">{BODY_WORLD_MISSION_COUNT.toString()}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-[2] grid xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="border-b border-white/[.06] xl:border-b-0 xl:border-r">
          <div className="relative min-h-[650px] overflow-hidden">
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:36px_36px]" aria-hidden />
            <div className="absolute inset-[7%] rounded-[32px] border border-white/[.055] bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.07),rgba(139,92,246,.035)_35%,transparent_70%)]">
              {ZONE_POSITIONS.map((item, index) => {
                const missionHere = missions.find((mission) => mission.selection.zone === item.zone)
                const active = missionHere?.index === selected?.index
                return (
                  <motion.button
                    key={item.zone}
                    type="button"
                    disabled={!missionHere}
                    onClick={() => missionHere && choose(missionHere)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border backdrop-blur-xl transition ${missionHere ? 'cursor-pointer' : 'cursor-default opacity-25'} ${active ? 'h-16 w-16 border-cyan-200/40 bg-cyan-300/15 shadow-[0_0_50px_rgba(34,211,238,.20)]' : 'h-10 w-10 border-white/[.10] bg-black/55 hover:border-cyan-200/20 hover:bg-cyan-300/[.07]'}`}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    animate={reduceMotion || !missionHere ? undefined : { scale: [1, active ? 1.12 : 1.04, 1], boxShadow: active ? ['0 0 22px rgba(34,211,238,.12)', '0 0 58px rgba(139,92,246,.22)', '0 0 22px rgba(34,211,238,.12)'] : undefined }}
                    transition={{ duration: 3 + (index % 5) * .35, repeat: Infinity, ease: 'easeInOut' }}
                    aria-label={missionHere ? `Open mission in ${item.zone}` : `${item.zone} has no mission in this constellation`}
                  >
                    <span className="sr-only">{item.zone}</span>
                    {missionHere && <span className="text-[8px] font-black text-white/70">{index + 1}</span>}
                  </motion.button>
                )
              })}

              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-cyan-200/[.075]"
                animate={reduceMotion ? undefined : { rotate: [0, 2, -2, 0], scale: [1, 1.015, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            </div>

            <div className="absolute left-[4%] top-[4%] max-w-[320px] rounded-[20px] border border-white/[.07] bg-black/48 p-3 backdrop-blur-xl">
              <div className="text-[8px] font-black uppercase tracking-[.15em] text-white/25">World map</div>
              <div className="mt-1 text-[11px] font-black text-white/68">20 anatomical districts · mission nodes only appear when sampled.</div>
            </div>

            {selected && (
              <div className="absolute inset-x-[4%] bottom-[4%] rounded-[22px] border border-cyan-300/[.10] bg-black/55 p-4 backdrop-blur-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[.15em] text-cyan-100/55">{selected.id} · {selected.selection.zone}</span>
                  <span className="text-[8px] font-bold text-white/25">{selected.selection.difficulty} · {selected.selection.progression}</span>
                </div>
                <div className="mt-2 text-base font-black text-white/82">{selected.title}</div>
                <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/38">{selected.briefing}</p>
                <p className="mt-2 text-[10px] font-black text-cyan-100/55">Objective · {selected.objectiveText}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="p-4 sm:p-5">
          <label className="block">
            <span className="text-[8px] font-black uppercase tracking-[.15em] text-white/28">World seed</span>
            <input value={seed} onChange={(event) => setSeed(event.target.value)} className="mt-2 min-h-[42px] w-full rounded-[14px] border border-white/[.08] bg-black/30 px-3 text-[10px] font-bold text-white/65 outline-none focus:border-cyan-300/20" />
          </label>
          <button type="button" onClick={() => setNonce((value) => value + 1)} className="mt-2 min-h-[40px] w-full rounded-[14px] border border-cyan-300/15 bg-cyan-300/[.055] text-[9px] font-black text-cyan-100/65 transition hover:bg-cyan-300/[.09]">Generate new mission constellation</button>

          <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {missions.map((mission) => <MissionCard key={mission.id} mission={mission} active={mission.index === selected?.index} onClick={() => choose(mission)} />)}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.slice(0, 8).map((stat) => (
              <div key={stat.axis} className="rounded-[15px] border border-white/[.06] bg-white/[.022] p-2.5">
                <div className="text-[7px] font-black uppercase tracking-[.14em] text-white/23">{stat.axis}</div>
                <div className="mt-1 text-sm font-black text-white/58">{stat.count}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="relative z-[2] border-t border-white/[.06] px-4 py-3 text-[9px] font-medium leading-relaxed text-white/27 sm:px-5">
        Open World missions are synthetic educational game states. They do not diagnose patients, prescribe treatment, or autonomously instruct real surgical procedures.
      </footer>
    </section>
  )
}
