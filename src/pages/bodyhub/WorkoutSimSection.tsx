import { useEffect, useMemo, useState } from 'react'
import { LATIHAN, nodesForExercise, groupsForExercise, PERAN_LABEL, type Latihan, type Peran } from '../../lib/exerciseMuscles'
import { WORKOUT_MUSCLE_GROUPS } from '../../lib/workoutMuscles'
import { api, type AnatomyImage } from '../../lib/api'

interface Props {
  /** Highlight exact muscular.glb node names on the shared whole-body 3D model. */
  onHighlight: (nodeNames: string[]) => void
  /** Drive the shared 3D contraction pulse in repetitions per minute. */
  onTempo: (repsPerMinute: number) => void
}

const WARNA: Record<Peran, string> = {
  utama: 'bg-brand/15 text-brand',
  sinergis: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  stabilisator: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
}

type Mode = 'atlas' | 'exercise' | 'mechanics'
type Region = 'Spine' | 'Shoulder' | 'Elbow' | 'Wrist' | 'Hip' | 'Knee' | 'Ankle'

type JointAtlas = {
  region: Region
  joint: string
  dof: string
  motions: Array<{ name: string; typical: string; plane: string; axis: string }>
  prime: string[]
  stabilizers: string[]
  muscleKeys: string[]
  clinical: string
}

const JOINT_ATLAS: JointAtlas[] = [
  {
    region: 'Spine',
    joint: 'Cervical + thoracolumbar spine',
    dof: 'Multi-segment, coupled 3D motion rather than a single hinge',
    motions: [
      { name: 'Flexion / extension', typical: 'Region-dependent', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Lateral flexion', typical: 'Region-dependent', plane: 'Frontal', axis: 'Anteroposterior' },
      { name: 'Axial rotation', typical: 'Region-dependent', plane: 'Transverse', axis: 'Longitudinal' },
    ],
    prime: ['Erector spinae', 'Rectus abdominis', 'Internal/external oblique'],
    stabilizers: ['Multifidus', 'Transversus abdominis', 'Diaphragm', 'Pelvic floor'],
    muscleKeys: ['abs', 'back'],
    clinical: 'Trunk load is distributed across many motion segments. Rib-cage position, pelvic orientation and bracing change the moment seen by each spinal level.',
  },
  {
    region: 'Shoulder',
    joint: 'Glenohumeral + scapulothoracic complex',
    dof: 'Three glenohumeral rotational DOF plus scapular rotation/translation',
    motions: [
      { name: 'Elevation', typical: '≈ 180° total shoulder complex', plane: 'Scapular / sagittal', axis: 'Oblique / mediolateral' },
      { name: 'External rotation', typical: 'Variable with abduction', plane: 'Transverse', axis: 'Humeral longitudinal' },
      { name: 'Internal rotation', typical: 'Variable with abduction', plane: 'Transverse', axis: 'Humeral longitudinal' },
    ],
    prime: ['Deltoid', 'Pectoralis major', 'Latissimus dorsi'],
    stabilizers: ['Supraspinatus', 'Infraspinatus', 'Teres minor', 'Subscapularis', 'Serratus anterior', 'Trapezius'],
    muscleKeys: ['shoulders', 'chest', 'back'],
    clinical: 'Scapular upward rotation and posterior tilt help preserve subacromial clearance while the rotator cuff centers the humeral head.',
  },
  {
    region: 'Elbow',
    joint: 'Humeroulnar + humeroradial + proximal radioulnar',
    dof: 'Flexion/extension plus forearm pronation/supination',
    motions: [
      { name: 'Flexion', typical: '≈ 0–145°', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Pronation / supination', typical: '≈ 75–90° each direction', plane: 'Transverse', axis: 'Forearm longitudinal' },
    ],
    prime: ['Biceps brachii', 'Brachialis', 'Triceps brachii', 'Pronator teres', 'Supinator'],
    stabilizers: ['Anconeus', 'Wrist flexor/extensor groups'],
    muscleKeys: ['biceps', 'triceps', 'forearms'],
    clinical: 'Forearm position changes the biceps moment arm and therefore the elbow torque that can be produced for the same muscle force.',
  },
  {
    region: 'Wrist',
    joint: 'Radiocarpal + midcarpal complex',
    dof: 'Two principal rotational DOF with coupled carpal motion',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 70–80° each direction', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Radial / ulnar deviation', typical: '≈ 15–40°', plane: 'Frontal', axis: 'Anteroposterior' },
    ],
    prime: ['Flexor carpi radialis/ulnaris', 'Extensor carpi radialis/ulnaris'],
    stabilizers: ['Finger flexors/extensors', 'Intrinsic hand muscles'],
    muscleKeys: ['forearms'],
    clinical: 'Grip force changes with wrist angle because finger-flexor length and tendon excursion change as the wrist moves.',
  },
  {
    region: 'Hip',
    joint: 'Acetabulofemoral joint',
    dof: 'Ball-and-socket joint with three rotational DOF',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 120° flexion; ≈ 10–20° extension', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Abduction / adduction', typical: '≈ 40–45° abduction', plane: 'Frontal', axis: 'Anteroposterior' },
      { name: 'Internal / external rotation', typical: '≈ 30–45° each', plane: 'Transverse', axis: 'Femoral longitudinal' },
    ],
    prime: ['Gluteus maximus', 'Iliopsoas', 'Gluteus medius', 'Adductor group'],
    stabilizers: ['Deep external rotators', 'Gluteus minimus', 'Trunk stabilizers'],
    muscleKeys: ['glutes', 'hamstrings', 'quads', 'abs'],
    clinical: 'In single-leg stance, hip abductors generate a counter-moment to limit contralateral pelvic drop while the trunk changes the external hip moment arm.',
  },
  {
    region: 'Knee',
    joint: 'Tibiofemoral + patellofemoral complex',
    dof: 'Primary hinge motion with coupled rotation and translation',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 0–135°', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Axial rotation', typical: 'Small; increases in flexion', plane: 'Transverse', axis: 'Tibial longitudinal' },
    ],
    prime: ['Quadriceps', 'Hamstrings', 'Gastrocnemius'],
    stabilizers: ['Popliteus', 'Gluteal complex', 'Soleus'],
    muscleKeys: ['quads', 'hamstrings', 'calves', 'glutes'],
    clinical: 'The patella increases the quadriceps lever arm. External knee moment rises as the line of action of the external force moves farther from the joint center.',
  },
  {
    region: 'Ankle',
    joint: 'Talocrural + subtalar complex',
    dof: 'Sagittal ankle motion plus triplanar hindfoot motion',
    motions: [
      { name: 'Dorsiflexion / plantarflexion', typical: '≈ 20° DF; ≈ 45–50° PF', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Inversion / eversion', typical: 'Coupled, variable', plane: 'Frontal / triplanar', axis: 'Oblique' },
    ],
    prime: ['Soleus', 'Gastrocnemius', 'Tibialis anterior', 'Fibularis group'],
    stabilizers: ['Tibialis posterior', 'Intrinsic foot muscles', 'Fibularis group'],
    muscleKeys: ['calves'],
    clinical: 'During running, the ankle-foot complex absorbs, stores and returns mechanical energy while the Achilles tendon and plantar structures contribute elastic recoil.',
  },
]

type KineticChain = {
  name: string
  subtitle: string
  segments: string[]
  cue: string
  watch: string
  exerciseId?: string
}

const KINETIC_CHAINS: KineticChain[] = [
  {
    name: 'Squat', subtitle: 'Closed-chain lower limb',
    segments: ['Foot', 'Ankle', 'Knee', 'Hip', 'Pelvis', 'Trunk'],
    cue: 'Center of mass remains over the base of support while hip and knee extensor moments change continuously with depth and trunk angle.',
    watch: 'Track knee direction, heel contact, pelvic control and trunk inclination together rather than judging one joint in isolation.',
    exerciseId: 'squat',
  },
  {
    name: 'Running', subtitle: 'Elastic locomotor chain',
    segments: ['Foot strike', 'Ankle spring', 'Knee', 'Hip', 'Pelvis', 'Trunk / arms'],
    cue: 'Ground-reaction force propagates upward; segment stiffness and timing determine how much energy is absorbed, stored, returned or redirected.',
    watch: 'Contact time, cadence and center-of-mass motion matter more than any single static posture screenshot.',
  },
  {
    name: 'Jump', subtitle: 'Proximal-to-distal propulsion',
    segments: ['Hip', 'Knee', 'Ankle', 'Foot', 'Ground'],
    cue: 'Coordinated hip-knee-ankle extension can increase endpoint velocity by sequencing segmental power from proximal to distal.',
    watch: 'Landing mechanics are a separate task: peak force depends on momentum change and the time over which that change occurs.',
  },
  {
    name: 'Throw', subtitle: 'Whole-body rotational transfer',
    segments: ['Ground', 'Legs', 'Pelvis', 'Trunk', 'Scapula', 'Shoulder', 'Elbow', 'Hand'],
    cue: 'Efficient throwing transfers angular momentum across segments instead of asking the shoulder to generate endpoint velocity alone.',
    watch: 'Loss of pelvic or trunk contribution increases the demand placed on the shoulder and elbow for the same desired hand speed.',
  },
  {
    name: 'Deadlift', subtitle: 'Loaded hip-hinge chain',
    segments: ['Floor', 'Foot', 'Knee', 'Hip', 'Lumbopelvic trunk', 'Upper limb', 'Load'],
    cue: 'External joint moment depends strongly on the horizontal distance between the load line and each joint center.',
    watch: 'A bar drifting forward increases the hip and lumbar external moment even when the mass on the bar is unchanged.',
    exerciseId: 'deadlift',
  },
]

function nodesForMuscleKeys(keys: string[]): string[] {
  const names = new Set<string>()
  for (const key of keys) {
    const group = WORKOUT_MUSCLE_GROUPS.find((item) => item.key === key)
    group?.nodeNames.forEach((name) => names.add(name))
  }
  return [...names]
}

function FotoLatihan({ nama }: { nama: string }) {
  const [img, setImg] = useState<AnatomyImage[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setImg(null)
    api.anatomyImages(nama, 'exercise')
      .then((result) => { if (!cancelled) setImg(result.images) })
      .catch(() => { if (!cancelled) setImg([]) })
    return () => { cancelled = true }
  }, [nama])

  if (img === null) return <p className="text-xs text-neutral-500">Loading demonstration photos…</p>
  if (!img.length) return <p className="text-xs leading-relaxed text-neutral-500">No freely licensed demonstration photo was found. A substitute posture is intentionally not fabricated.</p>

  return (
    <div className="grid grid-cols-2 gap-2">
      {img.slice(0, 4).map((item) => (
        <figure key={item.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
          <img src={item.url} alt={item.title} loading="lazy" className="h-28 w-full bg-white object-contain" />
          <figcaption className="p-1.5">
            <a href={item.sourcePage} target="_blank" rel="noreferrer" className="block truncate text-[9.5px] text-neutral-400 underline">{item.artist} · {item.license}</a>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function Metric({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{value} <span className="text-xs font-semibold text-neutral-400">{unit}</span></div>
      {hint && <div className="mt-1 text-[9.5px] leading-snug text-neutral-400">{hint}</div>}
    </div>
  )
}

function RangeControl(props: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (value: number) => void; display?: string }) {
  return (
    <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">
      <span className="flex items-center justify-between gap-3"><span>{props.label}</span><span className="tabular-nums text-brand">{props.display ?? props.value} {props.unit}</span></span>
      <input className="mt-3 w-full accent-[var(--brand)]" type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} />
    </label>
  )
}

function KineticChainDiagram({ chain }: { chain: KineticChain }) {
  const width = 640
  const left = 46
  const right = width - 46
  const spacing = chain.segments.length > 1 ? (right - left) / (chain.segments.length - 1) : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 p-3 dark:border-white/10">
      <svg viewBox="0 0 640 170" role="img" aria-label={`${chain.name} kinetic-chain diagram`} className="h-auto w-full">
        <defs><marker id="chain-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#00BF63" /></marker></defs>
        <text x="24" y="24" fill="#00BF63" fontSize="12" fontWeight="800">{chain.name.toUpperCase()}</text>
        <text x="24" y="42" fill="#9ca3af" fontSize="10">{chain.subtitle}</text>
        {chain.segments.map((segment, index) => {
          const x = left + spacing * index
          const nextX = left + spacing * (index + 1)
          return (
            <g key={`${segment}-${index}`}>
              {index < chain.segments.length - 1 && <line x1={x + 16} y1="92" x2={nextX - 18} y2="92" stroke="#00BF63" strokeWidth="3" markerEnd="url(#chain-arrow)" opacity="0.8" />}
              <circle cx={x} cy="92" r="17" fill="#111827" stroke="#00BF63" strokeWidth="2.5" />
              <circle cx={x} cy="92" r="5" fill="#00BF63" />
              <text x={x} y="126" textAnchor="middle" fill="#f3f4f6" fontSize="9" fontWeight="700">{segment}</text>
              <text x={x} y="143" textAnchor="middle" fill="#6b7280" fontSize="8">{index + 1}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ForceDiagram({ forceN, armM }: { forceN: number; armM: number }) {
  const arrowHeight = Math.max(34, Math.min(92, forceN / 18))
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 p-3 dark:border-white/10">
      <svg viewBox="0 0 520 200" role="img" aria-label="Simplified external force and moment-arm diagram" className="h-auto w-full">
        <defs><marker id="force-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#00BF63" /></marker></defs>
        <line x1="84" y1="150" x2="430" y2="150" stroke="#4b5563" strokeWidth="5" strokeLinecap="round" />
        <circle cx="180" cy="150" r="10" fill="#f3f4f6" />
        <text x="180" y="179" textAnchor="middle" fill="#9ca3af" fontSize="10">joint center</text>
        <line x1="180" y1="118" x2="360" y2="118" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" />
        <text x="270" y="107" textAnchor="middle" fill="#f59e0b" fontSize="10">r = {armM.toFixed(2)} m</text>
        <line x1="360" y1="150" x2="360" y2={150 - arrowHeight} stroke="#00BF63" strokeWidth="5" markerEnd="url(#force-arrow)" />
        <text x="372" y={145 - arrowHeight} fill="#00BF63" fontSize="11" fontWeight="800">F ≈ {forceN.toFixed(0)} N</text>
        <path d="M147 137 A42 42 0 0 1 205 112" fill="none" stroke="#e5e7eb" strokeWidth="2.5" markerEnd="url(#force-arrow)" />
        <text x="125" y="106" fill="#e5e7eb" fontSize="10">external moment</text>
      </svg>
    </div>
  )
}

function PhaseTimeline({ exercise, phase }: { exercise: Latihan; phase: 'konsentrik' | 'eksentrik' }) {
  const total = exercise.tempo[0] + exercise.tempo[1]
  const concentricPct = (exercise.tempo[0] / total) * 100
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wide text-neutral-400"><span>Concentric {exercise.tempo[0]}s</span><span>Eccentric {exercise.tempo[1]}s</span></div>
      <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div style={{ width: `${concentricPct}%` }} className={phase === 'konsentrik' ? 'bg-brand' : 'bg-brand/25'} />
        <div style={{ width: `${100 - concentricPct}%` }} className={phase === 'eksentrik' ? 'bg-amber-500' : 'bg-amber-500/25'} />
      </div>
    </div>
  )
}

export function WorkoutSimSection({ onHighlight, onTempo }: Props) {
  const [mode, setMode] = useState<Mode>('atlas')
  const [region, setRegion] = useState<Region>('Hip')
  const [selectedChain, setSelectedChain] = useState(0)
  const [aktif, setAktif] = useState<Latihan | null>(null)
  const [jalan, setJalan] = useState(false)
  const [fase, setFase] = useState<'konsentrik' | 'eksentrik'>('konsentrik')
  const [bodyMassKg, setBodyMassKg] = useState(70)
  const [supportedMassPct, setSupportedMassPct] = useState(60)
  const [externalLoadKg, setExternalLoadKg] = useState(40)
  const [verticalAcceleration, setVerticalAcceleration] = useState(0)
  const [momentArmCm, setMomentArmCm] = useState(30)
  const [angularVelocity, setAngularVelocity] = useState(1.5)
  const [angularDisplacementDeg, setAngularDisplacementDeg] = useState(60)
  const [contactTimeMs, setContactTimeMs] = useState(250)

  const joint = JOINT_ATLAS.find((item) => item.region === region) ?? JOINT_ATLAS[0]
  const chain = KINETIC_CHAINS[selectedChain] ?? KINETIC_CHAINS[0]
  const grup = aktif ? groupsForExercise(aktif) : null

  useEffect(() => {
    if (mode === 'atlas') {
      onHighlight(nodesForMuscleKeys(joint.muscleKeys))
      onTempo(0)
    } else if (mode === 'mechanics') {
      onHighlight([])
      onTempo(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region])

  useEffect(() => {
    if (mode !== 'exercise') return
    if (!aktif) {
      onHighlight([])
      onTempo(0)
      return
    }
    const nodes = nodesForExercise(aktif)
    onHighlight(fase === 'konsentrik' ? [...nodes.utama, ...nodes.sinergis] : nodes.utama)
    const secondsPerRep = aktif.tempo[0] + aktif.tempo[1]
    onTempo(jalan ? Math.round(60 / secondsPerRep) : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, aktif, fase, jalan])

  useEffect(() => {
    if (mode !== 'exercise') setJalan(false)
  }, [mode])

  useEffect(() => {
    if (!aktif || !jalan || mode !== 'exercise') return
    const durationMs = (fase === 'konsentrik' ? aktif.tempo[0] : aktif.tempo[1]) * 1000
    const timer = setTimeout(() => setFase((current) => (current === 'konsentrik' ? 'eksentrik' : 'konsentrik')), durationMs)
    return () => clearTimeout(timer)
  }, [aktif, jalan, fase, mode])

  const mechanics = useMemo(() => {
    const g = 9.80665
    const supportedBodyMass = bodyMassKg * (supportedMassPct / 100)
    const effectiveMass = supportedBodyMass + externalLoadKg
    const verticalForce = Math.max(0, effectiveMass * (g + verticalAcceleration))
    const staticWeight = effectiveMass * g
    const inertialForce = effectiveMass * verticalAcceleration
    const radius = momentArmCm / 100
    const torque = verticalForce * radius
    const theta = angularDisplacementDeg * Math.PI / 180
    const work = torque * theta
    const power = torque * angularVelocity
    const impulse = verticalForce * (contactTimeMs / 1000)
    const bodyWeight = bodyMassKg * g
    const bodyWeightRatio = bodyWeight > 0 ? verticalForce / bodyWeight : 0
    return { supportedBodyMass, effectiveMass, verticalForce, staticWeight, inertialForce, radius, torque, theta, work, power, impulse, bodyWeightRatio }
  }, [bodyMassKg, supportedMassPct, externalLoadKg, verticalAcceleration, momentArmCm, angularVelocity, angularDisplacementDeg, contactTimeMs])

  const openChainExercise = (exerciseId: string) => {
    const exercise = LATIHAN.find((item) => item.id === exerciseId) ?? null
    setAktif(exercise)
    setFase('konsentrik')
    setJalan(false)
    setMode('exercise')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-brand/[0.04] p-4 dark:border-white/10 dark:from-white/[0.04] dark:to-brand/[0.04]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Panacea Whole-Body Movement Atlas</div>
        <h3 className="mt-1 text-lg font-black text-ink dark:text-white">Functional anatomy → kinetic chain → mechanics</h3>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500">The shared 3D body is linked to the biomechanics panel: choosing a region highlights its real muscle meshes, movement phases drive the contraction pulse, and the mechanics lab exposes every assumption used in the calculation.</p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([['atlas', 'Joint atlas'], ['exercise', 'Movement lab'], ['mechanics', 'Force lab']] as const).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${mode === key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:text-ink dark:hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {mode === 'atlas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {JOINT_ATLAS.map((item) => (
              <button key={item.region} type="button" aria-pressed={region === item.region} onClick={() => setRegion(item.region)} className={`min-h-[34px] rounded-full border px-3 text-xs font-bold transition ${region === item.region ? 'border-brand bg-brand text-white shadow-sm shadow-brand/20' : 'border-neutral-200 text-neutral-600 hover:border-brand/40 hover:text-brand dark:border-white/10 dark:text-neutral-300'}`}>{item.region}</button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-xs font-bold text-brand">{joint.region}</div><div className="mt-0.5 text-base font-black text-ink dark:text-white">{joint.joint}</div><div className="mt-1 text-[11px] text-neutral-500">{joint.dof}</div></div>
              <div className="rounded-full bg-brand/10 px-3 py-1 text-[10px] font-bold text-brand">3D muscles highlighted ↑</div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[11px]">
                <thead className="text-neutral-400"><tr><th className="pb-2">Motion</th><th className="pb-2">Typical ROM</th><th className="pb-2">Plane</th><th className="pb-2">Axis</th></tr></thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {joint.motions.map((motion) => <tr key={motion.name}><td className="py-2 font-bold text-ink dark:text-white">{motion.name}</td><td className="py-2 text-neutral-500">{motion.typical}</td><td className="py-2 text-neutral-500">{motion.plane}</td><td className="py-2 text-neutral-500">{motion.axis}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-brand/5 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-brand">Prime movers</div><p className="mt-1 text-xs leading-relaxed text-ink dark:text-white">{joint.prime.join(' · ')}</p></div>
            <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5"><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Dynamic stabilizers</div><p className="mt-1 text-xs leading-relaxed text-ink dark:text-white">{joint.stabilizers.join(' · ')}</p></div>
          </div>

          <div className="rounded-xl border-l-4 border-brand bg-brand/5 p-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{joint.clinical}</div>

          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Whole-body kinetic chains</div><div className="mt-0.5 text-xs font-black text-ink dark:text-white">{chain.name} · {chain.subtitle}</div></div>
              <div className="flex flex-wrap gap-1">{KINETIC_CHAINS.map((item, index) => <button key={item.name} type="button" aria-pressed={selectedChain === index} onClick={() => setSelectedChain(index)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedChain === index ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5'}`}>{item.name}</button>)}</div>
            </div>
            <KineticChainDiagram chain={chain} />
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 p-3 text-[11px] leading-relaxed text-neutral-600 dark:border-white/10 dark:text-neutral-300"><span className="font-black text-ink dark:text-white">Mechanics: </span>{chain.cue}</div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"><span className="font-black">Observe: </span>{chain.watch}</div>
            </div>
            {chain.exerciseId && <button type="button" onClick={() => openChainExercise(chain.exerciseId!)} className="mt-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white">Open {chain.name} in Movement Lab →</button>}
          </div>
        </div>
      )}

      {mode === 'exercise' && (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-neutral-400">Pick a movement. Exact muscle nodes illuminate on the shared 3D body by role while the contraction pulse follows the programmed concentric/eccentric timing.</p>
          <div className="flex flex-wrap gap-1.5">
            {LATIHAN.map((exercise) => (
              <button key={exercise.id} type="button" aria-pressed={aktif?.id === exercise.id} onClick={() => { setAktif(aktif?.id === exercise.id ? null : exercise); setFase('konsentrik'); setJalan(false) }} className={`min-h-[34px] rounded-full border px-3 text-xs font-bold transition ${aktif?.id === exercise.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 hover:border-brand/40 hover:text-brand dark:border-white/10 dark:text-neutral-300'}`}>{exercise.nama}</button>
            ))}
          </div>

          {aktif && grup && (
            <div className="space-y-3 rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="text-[10px] font-bold uppercase tracking-wide text-brand">{aktif.pola}</div><div className="text-base font-black text-ink dark:text-white">{aktif.nama}</div></div>
                <button type="button" onClick={() => setJalan(!jalan)} className={`min-h-[36px] rounded-full px-4 text-xs font-bold transition ${jalan ? 'bg-brand text-white' : 'border border-brand text-brand'}`}>{jalan ? '❚❚ Pause' : '▶ Run movement'}</button>
              </div>
              <PhaseTimeline exercise={aktif} phase={fase} />
              <div className={`rounded-xl p-3 ${fase === 'konsentrik' ? 'bg-brand/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                <div className="flex items-center justify-between gap-2"><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{fase === 'konsentrik' ? 'Concentric phase' : 'Eccentric phase'}</div><div className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-bold text-neutral-500 dark:bg-black/20">3D highlight synchronized</div></div>
                <p className="mt-1 text-xs leading-relaxed text-ink dark:text-white">{fase === 'konsentrik' ? aktif.konsentrik : aktif.eksentrik}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {(['utama', 'sinergis', 'stabilisator'] as Peran[]).map((role) => grup[role].length ? <div key={role} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${WARNA[role]}`}>{PERAN_LABEL[role].label}</span><div className="mt-2 text-xs font-bold text-ink dark:text-white">{grup[role].join(', ')}</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{PERAN_LABEL[role].jelas}</p></div> : null)}
              </div>
              <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/10"><div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Common mechanical error</div><p className="mt-1 text-xs leading-relaxed text-red-700 dark:text-red-300">{aktif.kesalahan}</p></div>
              <div><div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Real demonstration</div><FotoLatihan nama={aktif.nama} /></div>
            </div>
          )}
        </div>
      )}

      {mode === 'mechanics' && (
        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed text-neutral-500">This lab models one external vertical resultant and its moment about a joint. It deliberately separates body mass, supported body-mass fraction, external load, acceleration, lever arm and angular motion so the assumptions are visible.</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <RangeControl label="Body mass" value={bodyMassKg} unit="kg" min={30} max={180} step={1} onChange={setBodyMassKg} />
            <RangeControl label="Supported body mass" value={supportedMassPct} unit="%" min={0} max={100} step={5} onChange={setSupportedMassPct} />
            <RangeControl label="External load" value={externalLoadKg} unit="kg" min={0} max={250} step={1} onChange={setExternalLoadKg} />
            <RangeControl label="Vertical acceleration" value={verticalAcceleration} unit="m/s²" min={-3} max={5} step={0.1} display={verticalAcceleration.toFixed(1)} onChange={setVerticalAcceleration} />
            <RangeControl label="Moment arm" value={momentArmCm} unit="cm" min={1} max={100} step={1} onChange={setMomentArmCm} />
            <RangeControl label="Angular velocity" value={angularVelocity} unit="rad/s" min={0} max={8} step={0.1} display={angularVelocity.toFixed(1)} onChange={setAngularVelocity} />
            <RangeControl label="Angular displacement" value={angularDisplacementDeg} unit="°" min={0} max={180} step={5} onChange={setAngularDisplacementDeg} />
            <RangeControl label="Force-contact time" value={contactTimeMs} unit="ms" min={50} max={1200} step={10} onChange={setContactTimeMs} />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
            <ForceDiagram forceN={mechanics.verticalForce} armM={mechanics.radius} />
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Effective mass" value={mechanics.effectiveMass.toFixed(1)} unit="kg" hint="supported body mass + external load" />
              <Metric label="Vertical force" value={mechanics.verticalForce.toFixed(0)} unit="N" hint={`${mechanics.bodyWeightRatio.toFixed(2)} × body weight`} />
              <Metric label="External torque" value={mechanics.torque.toFixed(1)} unit="N·m" hint="force × perpendicular moment arm" />
              <Metric label="Mechanical work" value={mechanics.work.toFixed(0)} unit="J" hint="torque × angular displacement" />
              <Metric label="Mechanical power" value={mechanics.power.toFixed(0)} unit="W" hint="torque × angular velocity" />
              <Metric label="Impulse" value={mechanics.impulse.toFixed(0)} unit="N·s" hint="force × contact time" />
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-950 p-4 text-neutral-100">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Transparent equations</div>
            <div className="mt-3 grid gap-2 font-mono text-[11px] leading-relaxed md:grid-cols-2">
              <div>m_eff = m_body·f_support + m_load = {bodyMassKg}·{(supportedMassPct / 100).toFixed(2)} + {externalLoadKg} = {mechanics.effectiveMass.toFixed(1)} kg</div>
              <div>F = m_eff·(g + a) = {mechanics.effectiveMass.toFixed(1)}·(9.80665 + {verticalAcceleration.toFixed(1)}) = {mechanics.verticalForce.toFixed(1)} N</div>
              <div>τ = F·r = {mechanics.verticalForce.toFixed(1)}·{mechanics.radius.toFixed(2)} = {mechanics.torque.toFixed(1)} N·m</div>
              <div>W = τ·θ = {mechanics.torque.toFixed(1)}·{mechanics.theta.toFixed(2)} = {mechanics.work.toFixed(1)} J</div>
              <div>P = τ·ω = {mechanics.torque.toFixed(1)}·{angularVelocity.toFixed(1)} = {mechanics.power.toFixed(1)} W</div>
              <div>J = F·Δt = {mechanics.verticalForce.toFixed(1)}·{(contactTimeMs / 1000).toFixed(2)} = {mechanics.impulse.toFixed(1)} N·s</div>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-3 text-[11px] leading-relaxed text-neutral-600 dark:border-white/10 dark:text-neutral-300">Static component: <span className="font-bold text-ink dark:text-white">{mechanics.staticWeight.toFixed(0)} N</span>. Inertial component from the chosen acceleration: <span className="font-bold text-ink dark:text-white">{mechanics.inertialForce.toFixed(0)} N</span>.</div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Internal muscle force and joint-contact force are not equal to this external force. Co-contraction and short muscle moment arms can make internal loading substantially larger. Patient-specific kinetics require measured kinematics plus external-force data and inverse dynamics.</div>
          </div>
        </div>
      )}

      <div className="border-t border-neutral-100 pt-3 text-[10px] leading-relaxed text-neutral-400 dark:border-white/5">Reference framework: rigid-body mechanics (F = m·a; τ = r×F; W = ∫τdθ; P = τ·ω; J = ∫Fdt), Winter DA, <i>Biomechanics and Motor Control of Human Movement</i>, and Neumann DA, <i>Kinesiology of the Musculoskeletal System</i>. Joint ROM values are teaching ranges, not diagnostic thresholds; ROM varies with method, age, sex, position and anatomy.</div>
    </div>
  )
}

export default WorkoutSimSection
