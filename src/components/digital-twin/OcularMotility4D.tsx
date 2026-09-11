import { useMemo, useState } from 'react'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'
import { HraContextBridge } from './HraContextBridge'

type GazeKey = 'primary' | 'right' | 'left' | 'up' | 'down' | 'up-right' | 'up-left' | 'down-right' | 'down-left'

type Muscle = {
  label: string
  term: string
  ontology: string
  nerve: string
  principal: string
  secondary: string
}

const MUSCLES: Muscle[] = [
  { label: 'Medial rectus', term: 'medial rectus extraocular muscle', ontology: 'FMA:49056 / FMA:49057', nerve: 'CN III', principal: 'Adduction', secondary: 'Horizontal alignment and convergence context.' },
  { label: 'Lateral rectus', term: 'lateral rectus extraocular muscle', ontology: 'FMA:49054 / FMA:49055', nerve: 'CN VI', principal: 'Abduction', secondary: 'Horizontal alignment and conjugate gaze context.' },
  { label: 'Superior rectus', term: 'superior rectus extraocular muscle', ontology: 'FMA:49044 / FMA:49045', nerve: 'CN III', principal: 'Elevation', secondary: 'Also contributes to intorsion and adduction.' },
  { label: 'Inferior rectus', term: 'inferior rectus extraocular muscle', ontology: 'FMA:49046 / FMA:49047', nerve: 'CN III', principal: 'Depression', secondary: 'Also contributes to extorsion and adduction.' },
  { label: 'Superior oblique', term: 'superior oblique extraocular muscle', ontology: 'FMA:49052 / FMA:49053', nerve: 'CN IV', principal: 'Intorsion', secondary: 'Also contributes to depression and abduction.' },
  { label: 'Inferior oblique', term: 'inferior oblique extraocular muscle', ontology: 'FMA:49050 / FMA:49051', nerve: 'CN III', principal: 'Extorsion', secondary: 'Also contributes to elevation and abduction.' },
  { label: 'Levator palpebrae superioris', term: 'levator palpebrae superioris', ontology: 'FMA:49048 / FMA:49049', nerve: 'CN III', principal: 'Upper-eyelid elevation', secondary: 'Eyelid function rather than globe rotation.' },
]

const GAZE: Record<GazeKey, { label: string; active: string[]; explanation: string }> = {
  primary: { label: 'Primary', active: [], explanation: 'Primary position is the reference orientation. Real tonic activity is not represented as a fabricated percentage.' },
  right: { label: 'Right', active: ['Right lateral rectus', 'Left medial rectus'], explanation: 'Conjugate right gaze pairs right-eye abduction with left-eye adduction.' },
  left: { label: 'Left', active: ['Left lateral rectus', 'Right medial rectus'], explanation: 'Conjugate left gaze pairs left-eye abduction with right-eye adduction.' },
  up: { label: 'Up', active: ['Superior rectus', 'Inferior oblique'], explanation: 'Elevation uses coordinated vertical actions; the contribution depends on eye position.' },
  down: { label: 'Down', active: ['Inferior rectus', 'Superior oblique'], explanation: 'Depression uses coordinated vertical actions; the contribution depends on eye position.' },
  'up-right': { label: 'Up-right', active: ['Right superior rectus', 'Left inferior oblique'], explanation: 'In right gaze, the abducted right eye is elevated mainly by superior rectus while the adducted left eye is elevated mainly by inferior oblique.' },
  'up-left': { label: 'Up-left', active: ['Left superior rectus', 'Right inferior oblique'], explanation: 'In left gaze, the abducted left eye is elevated mainly by superior rectus while the adducted right eye is elevated mainly by inferior oblique.' },
  'down-right': { label: 'Down-right', active: ['Right inferior rectus', 'Left superior oblique'], explanation: 'In right gaze, the abducted right eye is depressed mainly by inferior rectus while the adducted left eye is depressed mainly by superior oblique.' },
  'down-left': { label: 'Down-left', active: ['Left inferior rectus', 'Right superior oblique'], explanation: 'In left gaze, the abducted left eye is depressed mainly by inferior rectus while the adducted right eye is depressed mainly by superior oblique.' },
}

const GAZE_ORDER: GazeKey[] = ['up-left', 'up', 'up-right', 'left', 'primary', 'right', 'down-left', 'down', 'down-right']
const SOURCE_TERMS = MUSCLES.map((item) => item.term)

export function OcularMotility4D() {
  const [gaze, setGaze] = useState<GazeKey>('primary')
  const [selected, setSelected] = useState('medial rectus extraocular muscle')
  const selectedMuscle = useMemo(() => MUSCLES.find((item) => item.term === selected) ?? MUSCLES[0], [selected])
  const gazeState = GAZE[gaze]

  return (
    <section className="space-y-4 rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#080c10] sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-fuchsia-700 dark:text-fuchsia-300">Ocular motility 4D</div>
          <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Extraocular muscles · gaze mechanics · eyelid elevator</h3>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">HRA maps the extraocular muscles to FMA identities and source-model stems. Panacea renders an HRA muscle model only when that release exposes browser-loadable geometry; mapping-only records remain mapping-only. Gaze controls never invent EMG, force or nerve-firing percentages.</p>
        </div>
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-300">CN III · IV · VI teaching map</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[270px_minmax(0,1fr)]">
        <div className="space-y-2">
          {MUSCLES.map((muscle) => (
            <button key={muscle.term} onClick={() => setSelected(muscle.term)} className={`w-full rounded-2xl border p-3 text-left ${muscle.term === selectedMuscle.term ? 'border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-300/30 dark:bg-fuchsia-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="flex items-start justify-between gap-2"><span className="text-[10px] font-black text-neutral-950 dark:text-white">{muscle.label}</span><span className="text-[8px] font-black text-fuchsia-700 dark:text-fuchsia-300">{muscle.nerve}</span></div>
              <div className="mt-1 text-[9px] font-bold text-neutral-600 dark:text-neutral-300">{muscle.principal}</div>
              <div className="mt-1 text-[8px] leading-relaxed text-neutral-400">{muscle.ontology}</div>
            </button>
          ))}
        </div>

        <HraResolvedAnatomyViewer
          key={selectedMuscle.term}
          title={`${selectedMuscle.label} · source-resolved HRA geometry`}
          description={`${selectedMuscle.principal}. ${selectedMuscle.secondary} Innervation label: ${selectedMuscle.nerve}. If the current HRA release contains only a mapping record, this panel deliberately shows no substitute 3D muscle.`}
          terms={[selectedMuscle.term, 'ocular muscle']}
          maxResults={14}
        />
      </div>

      <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025] sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-center">
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {GAZE_ORDER.map((key) => (
                <button key={key} onClick={() => setGaze(key)} className={`min-h-14 rounded-xl border px-2 py-2 text-[9px] font-black ${gaze === key ? 'border-fuchsia-500 bg-fuchsia-500 text-white' : 'border-neutral-200 bg-white text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300'}`}>{GAZE[key].label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Selected gaze · {gazeState.label}</div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-200">{gazeState.explanation}</p>
            {gazeState.active.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{gazeState.active.map((item) => <span key={item} className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[8px] font-black text-fuchsia-800 dark:border-fuchsia-300/20 dark:bg-fuchsia-300/10 dark:text-fuchsia-200">{item}</span>)}</div>}
          </div>
        </div>
      </div>

      <HraContextBridge title="HRA extraocular muscle mappings" terms={SOURCE_TERMS} maxResults={16} />
    </section>
  )
}

export default OcularMotility4D
