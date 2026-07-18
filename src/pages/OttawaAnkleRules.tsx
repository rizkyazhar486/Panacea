import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Ottawa Ankle Rules — Stiell, I.G., et al. (1992/1993), JAMA/Ann Emerg Med.
// One of the most widely validated clinical decision rules in emergency
// medicine, used to decide whether an ankle/foot X-ray series is needed
// after an acute injury — reduces unnecessary imaging with very high
// sensitivity for clinically significant fractures. Pure boolean logic
// (not a points score), no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Item { key: string; label: string }

const ANKLE_ITEMS: Item[] = [
  { key: 'lateralMalleolus', label: 'Bone tenderness at the posterior edge or tip of the lateral malleolus (distal 6cm)' },
  { key: 'medialMalleolus', label: 'Bone tenderness at the posterior edge or tip of the medial malleolus (distal 6cm)' },
  { key: 'ankleWeightBear', label: 'Unable to bear weight both immediately after the injury AND in the exam room (4 steps)' },
]

const FOOT_ITEMS: Item[] = [
  { key: 'fifthMetatarsal', label: 'Bone tenderness at the base of the 5th metatarsal' },
  { key: 'navicular', label: 'Bone tenderness at the navicular bone' },
  { key: 'footWeightBear', label: 'Unable to bear weight both immediately after the injury AND in the exam room (4 steps)' },
]

function Zone({ title, painPresent, setPain, items, checked, setChecked }: {
  title: string
  painPresent: boolean
  setPain: (v: boolean) => void
  items: Item[]
  checked: Record<string, boolean>
  setChecked: (c: Record<string, boolean>) => void
}) {
  const anyChecked = items.some((it) => checked[it.key])
  const xrayIndicated = painPresent && anyChecked

  return (
    <Card className="!p-5">
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{title}</div>
      <label className="mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
        <input type="checkbox" className="h-4 w-4 accent-brand" checked={painPresent} onChange={(e) => setPain(e.target.checked)} />
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Pain in this zone</span>
      </label>
      {painPresent && (
        <div className="mt-2 space-y-2">
          {items.map((it) => (
            <label key={it.key} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
              <input type="checkbox" className="h-4 w-4 accent-brand" checked={!!checked[it.key]} onChange={(e) => setChecked({ ...checked, [it.key]: e.target.checked })} />
              <span className="text-sm text-neutral-700 dark:text-neutral-200">{it.label}</span>
            </label>
          ))}
        </div>
      )}
      {painPresent && (
        <div className="mt-3 flex items-center gap-3">
          <Badge tone={xrayIndicated ? 'critical' : 'brand'}>{xrayIndicated ? 'X-ray indicated' : 'X-ray not indicated'}</Badge>
        </div>
      )}
      {!painPresent && <p className="mt-2 text-[12px] text-neutral-400">No pain in this zone — the rule doesn't apply here.</p>}
    </Card>
  )
}

export function OttawaAnkleRules() {
  const [anklePain, setAnklePain] = useState(false)
  const [ankleChecked, setAnkleChecked] = useState<Record<string, boolean>>({})
  const [footPain, setFootPain] = useState(false)
  const [footChecked, setFootChecked] = useState<Record<string, boolean>>({})

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Ottawa Ankle Rules" subtitle="Decision rule for whether an ankle/foot X-ray is needed" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          One of the most validated clinical decision rules in emergency medicine — high sensitivity for
          clinically significant fractures, used to reduce unnecessary X-rays after an acute ankle/foot
          injury. Applies to malleolar-zone and midfoot-zone pain, evaluated separately.
        </p>
      </Card>

      <Zone title="Malleolar zone (ankle)" painPresent={anklePain} setPain={setAnklePain} items={ANKLE_ITEMS} checked={ankleChecked} setChecked={setAnkleChecked} />
      <Zone title="Midfoot zone" painPresent={footPain} setPain={setFootPain} items={FOOT_ITEMS} checked={footChecked} setChecked={setFootChecked} />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Stiell, I.G., et al. (1992). A study to develop clinical decision rules for the use of radiography
        in acute ankle injuries. <i>Ann Emerg Med</i>, 21(4), 384-390. Stiell et al. (1993), <i>JAMA</i>,
        269(9), 1127-1132. High sensitivity, not 100% — clinical judgment always applies (e.g. in
        children, intoxicated patients, or with distracting injuries).
      </div>
    </div>
  )
}

export default OttawaAnkleRules
