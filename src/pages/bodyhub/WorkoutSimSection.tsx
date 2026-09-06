import { useEffect, useMemo, useState } from 'react'
import { LATIHAN, nodesForExercise, groupsForExercise, PERAN_LABEL, type Latihan, type Peran } from '../../lib/exerciseMuscles'
import { api, type AnatomyImage } from '../../lib/api'

// Whole-body functional anatomy + movement biomechanics atlas.
// The 3D body itself lives in BodyExplorer/Body3D; this panel turns that anatomy
// into a movement lab: kinetic chains, movement phases, muscle roles, and basic
// mechanics computed from explicit equations rather than decorative scores.

interface Props {
  /** Highlight muscle nodes on the shared 3D body and ensure its muscle layer is visible. */
  onHighlight: (nodeNames: string[]) => void
  /** Drive the shared body's contraction tempo in repetitions per minute. */
  onTempo: (repsPerMinute: number) => void
}

const WARNA: Record<Peran, string> = {
  utama: 'bg-brand/15 text-brand',
  sinergis: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  stabilisator: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
}

type Region = 'Spine' | 'Shoulder' | 'Elbow' | 'Wrist' | 'Hip' | 'Knee' | 'Ankle'

type JointAtlas = {
  region: Region
  joint: string
  dof: string
  motions: Array<{ name: string; typical: string; plane: string; axis: string }>
  prime: string[]
  stabilizers: string[]
  clinical: string
}

const JOINT_ATLAS: JointAtlas[] = [
  {
    region: 'Spine', joint: 'Cervical + thoracolumbar spine', dof: 'Multi-segment, 3D coupled motion',
    motions: [
      { name: 'Flexion / extension', typical: 'Region-dependent', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Lateral flexion', typical: 'Region-dependent', plane: 'Frontal', axis: 'Anteroposterior' },
      { name: 'Axial rotation', typical: 'Region-dependent', plane: 'Transverse', axis: 'Longitudinal' },
    ],
    prime: ['Erector spinae', 'Rectus abdominis', 'Internal/external oblique'],
    stabilizers: ['Multifidus', 'Transversus abdominis', 'Diaphragm', 'Pelvic floor'],
    clinical: 'Treat the trunk as a linked column, not one hinge. Segmental motion, rib cage position and pelvic control alter the load seen by each level.',
  },
  {
    region: 'Shoulder', joint: 'Glenohumeral + scapulothoracic complex', dof: '3 rotational DOF plus scapular translation/rotation',
    motions: [
      { name: 'Elevation', typical: '≈ 180° total shoulder complex', plane: 'Scapular/sagittal', axis: 'Oblique/mediolateral' },
      { name: 'External rotation', typical: 'Variable with abduction', plane: 'Transverse', axis: 'Longitudinal humerus' },
      { name: 'Internal rotation', typical: 'Variable with abduction', plane: 'Transverse', axis: 'Longitudinal humerus' },
    ],
    prime: ['Deltoid', 'Pectoralis major', 'Latissimus dorsi'],
    stabilizers: ['Supraspinatus', 'Infraspinatus', 'Teres minor', 'Subscapularis', 'Serratus anterior', 'Trapezius'],
    clinical: 'Scapular upward rotation and posterior tilt preserve subacromial clearance while the rotator cuff centers the humeral head.',
  },
  {
    region: 'Elbow', joint: 'Humeroulnar + humeroradial + proximal radioulnar', dof: 'Flexion/extension plus forearm rotation',
    motions: [
      { name: 'Flexion', typical: '≈ 0–145°', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Pronation / supination', typical: '≈ 75–90° each direction', plane: 'Transverse', axis: 'Forearm longitudinal' },
    ],
    prime: ['Biceps brachii', 'Brachialis', 'Triceps brachii', 'Pronator teres', 'Supinator'],
    stabilizers: ['Anconeus', 'Wrist flexor/extensor groups'],
    clinical: 'Changing forearm position changes the biceps moment arm and therefore the torque it can produce at the elbow.',
  },
  {
    region: 'Wrist', joint: 'Radiocarpal + midcarpal complex', dof: '2 principal rotational DOF',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 70–80° each direction', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Radial / ulnar deviation', typical: '≈ 15–40°', plane: 'Frontal', axis: 'Anteroposterior' },
    ],
    prime: ['Flexor carpi radialis/ulnaris', 'Extensor carpi radialis/ulnaris'],
    stabilizers: ['Finger flexors/extensors', 'Intrinsic hand muscles'],
    clinical: 'Grip force is strongly affected by wrist angle because finger flexor length and tendon excursion change with wrist position.',
  },
  {
    region: 'Hip', joint: 'Acetabulofemoral joint', dof: 'Ball-and-socket, 3 rotational DOF',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 120° flexion; ≈ 10–20° extension', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Abduction / adduction', typical: '≈ 40–45° abduction', plane: 'Frontal', axis: 'Anteroposterior' },
      { name: 'Internal / external rotation', typical: '≈ 30–45° each', plane: 'Transverse', axis: 'Femoral longitudinal' },
    ],
    prime: ['Gluteus maximus', 'Iliopsoas', 'Gluteus medius', 'Adductors'],
    stabilizers: ['Deep external rotators', 'Gluteus minimus', 'Trunk stabilizers'],
    clinical: 'Pelvic control changes femoral orientation. In single-leg stance, hip abductors generate a counter-moment to keep the pelvis level.',
  },
  {
    region: 'Knee', joint: 'Tibiofemoral + patellofemoral complex', dof: 'Primary hinge with coupled rotation/translation',
    motions: [
      { name: 'Flexion / extension', typical: '≈ 0–135°', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Axial rotation', typical: 'Small; increases in flexion', plane: 'Transverse', axis: 'Longitudinal tibia' },
    ],
    prime: ['Quadriceps', 'Hamstrings', 'Gastrocnemius'],
    stabilizers: ['Popliteus', 'Gluteal complex', 'Soleus'],
    clinical: 'The patella increases the quadriceps lever arm. Knee demand rises when the external force line moves farther from the joint center.',
  },
  {
    region: 'Ankle', joint: 'Talocrural + subtalar complex', dof: 'Sagittal ankle motion plus triplanar hindfoot motion',
    motions: [
      { name: 'Dorsiflexion / plantarflexion', typical: '≈ 20° DF; ≈ 45–50° PF', plane: 'Sagittal', axis: 'Mediolateral' },
      { name: 'Inversion / eversion', typical: 'Coupled, variable', plane: 'Frontal/triplanar', axis: 'Oblique' },
    ],
    prime: ['Soleus', 'Gastrocnemius', 'Tibialis anterior', 'Fibularis group'],
    stabilizers: ['Tibialis posterior', 'Intrinsic foot muscles', 'Peroneal/fibularis group'],
    clinical: 'During running the ankle-foot complex stores and returns elastic energy through Achilles tendon and plantar structures while controlling pronation/supination.',
  },
]

const CHAINS = [
  { name: 'Squat', chain: 'Foot → ankle → knee → hip → pelvis → trunk', cue: 'Center of mass remains over the base of support while hip and knee extensor moments rise with depth.' },
  { name: 'Running', chain: 'Foot strike → ankle spring → knee shock absorption → hip extension → trunk/arm counter-rotation', cue: 'Ground-reaction force travels upward; stiffness and timing determine whether energy is absorbed, stored or redirected.' },
  { name: 'Jump', chain: 'Hip → knee → ankle (triple extension)', cue: 'Proximal-to-distal sequencing can increase endpoint velocity and power.' },
  { name: 'Throw', chain: 'Ground → legs → pelvis → trunk → scapula → shoulder → elbow → wrist/hand', cue: 'Efficient throws transfer angular momentum across segments rather than asking the shoulder to generate all velocity alone.' },
  { name: 'Deadlift', chain: 'Foot pressure → knee/hip extension → lumbopelvic stiffness → upper-limb force transmission', cue: 'External moment depends strongly on horizontal distance between the load and each joint center.' },
]

/** Freely licensed real photographs; never substitute a diagram pretending to be a real posture. */
function FotoLatihan({ nama }: { nama: string }) {
  const [img, setImg] = useState<AnatomyImage[] | null>(null)
  useEffect(() => {
    let batal = false
    setImg(null)
    api.anatomyImages(nama, 'exercise')
      .then((r) => { if (!batal) setImg(r.images) })
      .catch(() => { if (!batal) setImg([]) })
    return () => { batal = true }
  }, [nama])

  if (img === null) return <p className="text-xs text-neutral-500">Loading demonstration photos…</p>
  if (!img.length) {
    return (
      <p className="text-xs leading-relaxed text-neutral-500">
        No freely licensed demonstration photo was found for this movement. A substitute drawing is intentionally not shown because joint position must not be fabricated.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {img.slice(0, 4).map((i) => (
        <figure key={i.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
          <img src={i.url} alt={i.title} loading="lazy" className="h-28 w-full bg-white object-contain" />
          <figcaption className="p-1.5">
            <a href={i.sourcePage} target="_blank" rel="noreferrer" className="block truncate text-[9.5px] text-neutral-400 underline">
              {i.artist} · {i.license}
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{value} <span className="text-xs font-semibold text-neutral-400">{unit}</span></div>
    </div>
  )
}

export function WorkoutSimSection({ onHighlight, onTempo }: Props) {
  const [mode, setMode] = useState<'atlas' | 'exercise' | 'mechanics'>('atlas')
  const [region, setRegion] = useState<Region>('Hip')
  const [aktif, setAktif] = useState<Latihan | null>(null)
  const [jalan, setJalan] = useState(false)
  const [fase, setFase] = useState<'konsentrik' | 'eksentrik'>('konsentrik')
  const [loadKg, setLoadKg] = useState(40)
  const [momentArmCm, setMomentArmCm] = useState(30)
  const [angularVelocity, setAngularVelocity] = useState(1.5)
  const [contactTimeMs, setContactTimeMs] = useState(250)

  useEffect(() => {
    if (!aktif) { onHighlight([]); onTempo(0); return }
    const n = nodesForExercise(aktif)
    onHighlight(fase === 'konsentrik' ? [...n.utama, ...n.sinergis] : n.utama)
    const detik = aktif.tempo[0] + aktif.tempo[1]
    onTempo(jalan ? Math.round(60 / detik) : 0)
    // parent callbacks are stable by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, fase, jalan])

  useEffect(() => {
    if (!aktif || !jalan) return
    const ms = (fase === 'konsentrik' ? aktif.tempo[0] : aktif.tempo[1]) * 1000
    const id = setTimeout(() => setFase((f) => (f === 'konsentrik' ? 'eksentrik' : 'konsentrik')), ms)
    return () => clearTimeout(id)
  }, [aktif, jalan, fase])

  const grup = aktif ? groupsForExercise(aktif) : null
  const joint = JOINT_ATLAS.find((j) => j.region === region)!

  const mechanics = useMemo(() => {
    const g = 9.80665
    const force = loadKg * g
    const radius = momentArmCm / 100
    const torque = force * radius
    const power = torque * angularVelocity
    const impulse = force * (contactTimeMs / 1000)
    return { force, torque, power, impulse }
  }, [loadKg, momentArmCm, angularVelocity, contactTimeMs])

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Panacea Whole-Body Movement Atlas</div>
        <h3 className="mt-1 text-lg font-black text-ink dark:text-white">Functional anatomy + biomechanics</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Use the same whole-body 3D anatomy above, but study it as a moving system: joints, planes, axes, muscle roles, kinetic chains and explicit mechanics. This is educational biomechanics, not patient-specific inverse-dynamics analysis.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">
        {([
          ['atlas', 'Joint atlas'],
          ['exercise', 'Movement lab'],
          ['mechanics', 'Force lab'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} className={`rounded-lg px-2 py-2 text-[11px] font-bold transition ${mode === key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}>{label}</button>
        ))}
      </div>

      {mode === 'atlas' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {JOINT_ATLAS.map((j) => (
              <button key={j.region} onClick={() => setRegion(j.region)} className={`min-h-[32px] rounded-full border px-3 text-xs font-bold ${region === j.region ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>{j.region}</button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="text-xs font-bold text-brand">{joint.region}</div>
            <div className="mt-0.5 text-base font-black text-ink dark:text-white">{joint.joint}</div>
            <div className="mt-1 text-[11px] text-neutral-500">{joint.dof}</div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[11px]">
                <thead className="text-neutral-400"><tr><th className="pb-2">Motion</th><th className="pb-2">Typical ROM</th><th className="pb-2">Plane</th><th className="pb-2">Axis</th></tr></thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {joint.motions.map((m) => <tr key={m.name}><td className="py-2 font-bold text-ink dark:text-white">{m.name}</td><td className="py-2 text-neutral-500">{m.typical}</td><td className="py-2 text-neutral-500">{m.plane}</td><td className="py-2 text-neutral-500">{m.axis}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-brand/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Prime movers</div>
              <p className="mt-1 text-xs leading-relaxed text-ink dark:text-white">{joint.prime.join(' · ')}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Stabilizers</div>
              <p className="mt-1 text-xs leading-relaxed text-ink dark:text-white">{joint.stabilizers.join(' · ')}</p>
            </div>
          </div>

          <div className="rounded-xl border-l-4 border-brand bg-brand/5 p-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{joint.clinical}</div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Whole-body kinetic chains</div>
            <div className="mt-2 space-y-2">
              {CHAINS.map((c) => (
                <div key={c.name} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                  <div className="flex flex-wrap items-baseline gap-2"><span className="text-xs font-black text-ink dark:text-white">{c.name}</span><span className="text-[10px] font-semibold text-brand">{c.chain}</span></div>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{c.cue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'exercise' && (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-neutral-400">Pick a movement. Muscles illuminate on the shared 3D body by role, while the contraction animation follows the movement's concentric/eccentric timing.</p>
          <div className="flex flex-wrap gap-1.5">
            {LATIHAN.map((l) => (
              <button key={l.id} onClick={() => { setAktif(aktif?.id === l.id ? null : l); setFase('konsentrik') }} className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${aktif?.id === l.id ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>{l.nama}</button>
            ))}
          </div>

          {aktif && grup && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => setJalan(!jalan)} className={`min-h-[34px] rounded-full px-4 text-xs font-bold transition ${jalan ? 'bg-brand text-white' : 'border border-brand text-brand'}`}>{jalan ? '❚❚ Pause' : '▶ Run movement'}</button>
                <span className="text-[11px] text-neutral-400">{aktif.pola} · {aktif.tempo[0]}s concentric / {aktif.tempo[1]}s eccentric</span>
              </div>

              <div className={`rounded-xl p-2.5 ${fase === 'konsentrik' ? 'bg-brand/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{fase === 'konsentrik' ? 'Concentric phase' : 'Eccentric phase'}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink dark:text-white">{fase === 'konsentrik' ? aktif.konsentrik : aktif.eksentrik}</p>
              </div>

              {(['utama', 'sinergis', 'stabilisator'] as Peran[]).map((p) => grup[p].length ? (
                <div key={p}>
                  <div className="flex flex-wrap items-baseline gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${WARNA[p]}`}>{PERAN_LABEL[p].label}</span><span className="text-xs font-bold text-ink dark:text-white">{grup[p].join(', ')}</span></div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{PERAN_LABEL[p].jelas}</p>
                </div>
              ) : null)}

              <div className="rounded-xl bg-red-50 p-2.5 dark:bg-red-500/10"><div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Common mechanical error</div><p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">{aktif.kesalahan}</p></div>
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Real demonstration</div><FotoLatihan nama={aktif.nama} /></div>
            </div>
          )}
        </div>
      )}

      {mode === 'mechanics' && (
        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed text-neutral-500">Change the physical inputs and see how external load becomes joint moment and mechanical power. Values describe a simplified external-load model, not internal muscle force or joint-contact force.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-bold text-ink dark:text-white">External load: {loadKg} kg<input className="mt-2 w-full accent-[var(--brand)]" type="range" min="0" max="200" step="1" value={loadKg} onChange={(e) => setLoadKg(Number(e.target.value))} /></label>
            <label className="text-xs font-bold text-ink dark:text-white">Moment arm: {momentArmCm} cm<input className="mt-2 w-full accent-[var(--brand)]" type="range" min="1" max="100" step="1" value={momentArmCm} onChange={(e) => setMomentArmCm(Number(e.target.value))} /></label>
            <label className="text-xs font-bold text-ink dark:text-white">Angular velocity: {angularVelocity.toFixed(1)} rad/s<input className="mt-2 w-full accent-[var(--brand)]" type="range" min="0" max="6" step="0.1" value={angularVelocity} onChange={(e) => setAngularVelocity(Number(e.target.value))} /></label>
            <label className="text-xs font-bold text-ink dark:text-white">Force-contact time: {contactTimeMs} ms<input className="mt-2 w-full accent-[var(--brand)]" type="range" min="50" max="1000" step="10" value={contactTimeMs} onChange={(e) => setContactTimeMs(Number(e.target.value))} /></label>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric label="Force" value={mechanics.force.toFixed(0)} unit="N" />
            <Metric label="External torque" value={mechanics.torque.toFixed(1)} unit="N·m" />
            <Metric label="Mechanical power" value={mechanics.power.toFixed(0)} unit="W" />
            <Metric label="Impulse" value={mechanics.impulse.toFixed(0)} unit="N·s" />
          </div>

          <div className="rounded-2xl bg-neutral-950 p-4 text-neutral-100">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Equations</div>
            <div className="mt-2 grid gap-2 font-mono text-xs md:grid-cols-2">
              <div>F = m·g = {loadKg} × 9.80665</div>
              <div>τ = F·r = {mechanics.force.toFixed(1)} × {(momentArmCm / 100).toFixed(2)}</div>
              <div>P = τ·ω = {mechanics.torque.toFixed(1)} × {angularVelocity.toFixed(1)}</div>
              <div>J = F·Δt = {mechanics.force.toFixed(1)} × {(contactTimeMs / 1000).toFixed(2)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Internal joint loading can be several times larger than this external moment because muscle moment arms are short and co-contraction adds compressive force. Accurate patient-specific joint kinetics require motion capture or validated inertial sensing plus force data and inverse dynamics.
          </div>
        </div>
      )}

      <div className="border-t border-neutral-100 pt-3 text-[10px] leading-relaxed text-neutral-400 dark:border-white/5">
        Reference framework: classical rigid-body mechanics (F = m·a; τ = r×F; P = τ·ω; J = ∫Fdt) and standard clinical kinesiology conventions for planes, axes and approximate adult joint ROM. ROM varies with measurement method, age, sex, position and individual anatomy; values here are teaching ranges, not diagnostic thresholds.
      </div>
    </div>
  )
}

export default WorkoutSimSection
