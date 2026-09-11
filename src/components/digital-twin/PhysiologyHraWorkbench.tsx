import { useEffect, useMemo, useState } from 'react'
import { HraContextBridge } from './HraContextBridge'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'
import { useVitals } from '../../lib/useVitals'
import { vitalsAge } from '../../lib/healthVitals'
import {
  PHYSIOLOGY_STATES,
  PHYSIOLOGY_SYSTEMS,
  cardiacOutputLMin,
  meanArterialPressure,
  minuteVentilationLMin,
  physiologyState,
  pulsePressure,
  type PhysiologyProvenance,
  type PhysiologyStateKey,
  type PhysiologySystem,
  type PhysiologySystemKey,
} from '../../lib/bodyPhysiology'

type DisplayState = 'connected' | PhysiologyStateKey

type MetricItem = {
  label: string
  value: string
  provenance: PhysiologyProvenance
  detail: string
}

const PROVENANCE_STYLE: Record<PhysiologyProvenance, string> = {
  measured: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200',
  derived: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200',
  educational: 'bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200',
  unavailable: 'bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-300',
}

function toNormalSystem(system: PhysiologySystem): PhysiologySystem {
  if (system.key === 'thermoregulation') {
    return {
      ...system,
      label: 'Thermoregulation',
      subtitle: 'Thermal sensing → hypothalamic integration → vasomotor/sweat/shiver responses → heat balance',
      phases: system.phases.filter((phase) => !phase.toLowerCase().includes('pyrogen') && !phase.toLowerCase().includes('fever')),
      explanation: 'Normal thermoregulation links thermal sensing, hypothalamic integration, skin blood flow, sweating, shivering and environmental heat exchange. Fever and hyperthermia pathophysiology are intentionally separated from this normal-physiology workspace.',
    }
  }

  if (system.key === 'immune-allergy') {
    return {
      ...system,
      label: 'Immune physiology',
      subtitle: 'Barrier surveillance → innate recognition → antigen presentation → adaptive response → memory/resolution',
      phases: system.phases.filter((phase) => !phase.toLowerCase().includes('allerg')),
      explanation: 'Normal immune physiology is shown as barrier surveillance, innate recognition, antigen presentation, adaptive activation, effector function, memory and resolution. Allergy and autoimmune pathology belong in the pathology layer.',
    }
  }

  if (system.key === 'endocrine') {
    return {
      ...system,
      formulae: system.formulae.filter((formula) => !formula.name.toLowerCase().includes('homa')),
      explanation: 'Normal endocrine physiology is represented as sensing, hormone synthesis/release, transport, receptor response and feedback. Disease surrogates and diagnostic thresholds are intentionally excluded from this workspace.',
    }
  }

  return system
}

const NORMAL_SYSTEMS = PHYSIOLOGY_SYSTEMS
  .filter((system) => system.key !== 'shock')
  .map(toNormalSystem)

const NORMAL_METRICS: Partial<Record<PhysiologySystemKey, MetricItem[]>> = {
  neuromuscular: [
    { label: 'Motor pathway', value: 'UMN → LMN → NMJ → muscle', provenance: 'educational', detail: 'Motor cortex, descending tract, anterior horn, peripheral nerve, neuromuscular junction and muscle remain distinct stages.' },
    { label: 'Motor-unit recruitment', value: 'Task dependent', provenance: 'educational', detail: 'Recruitment depends on force demand, task, fatigue and neural drive; no activation percentage is invented.' },
    { label: 'Joint torque', value: 'τ = r × F', provenance: 'unavailable', detail: 'A numeric torque requires measured force and a defensible moment arm.' },
  ],
  sensory: [
    { label: 'Vision', value: 'Optics → retina → visual pathway', provenance: 'educational', detail: 'Optical focusing, retinal transduction and central processing are kept as separate physiological stages.' },
    { label: 'Hearing', value: 'Sound → cochlea → CN VIII', provenance: 'educational', detail: 'Mechanical conduction, cochlear transduction and neural encoding are separated.' },
    { label: 'Smell / voice', value: 'Receptor / airflow pathways', provenance: 'educational', detail: 'Olfaction and phonation are represented as receptor or biomechanical sequences without patient-specific perception claims.' },
  ],
  neurovascular: [
    { label: 'Synaptic transmission', value: 'AP → Ca²⁺ → transmitter → receptor', provenance: 'educational', detail: 'Release, receptor action and clearance are normal cellular mechanisms.' },
    { label: 'BBB physiology', value: 'Selective neurovascular barrier', provenance: 'educational', detail: 'Endothelium, tight junctions, pericytes, astrocyte-endfoot context and transport remain selective rather than all-or-none.' },
    { label: 'Patient permeability', value: 'Not available', provenance: 'unavailable', detail: 'No permeability value is inferred without an appropriate validated measurement.' },
  ],
  gastrointestinal: [
    { label: 'Motility', value: 'Regional sequence', provenance: 'educational', detail: 'Swallowing, gastric mixing, intestinal segmentation/peristalsis and colonic propulsion are treated as regional functions.' },
    { label: 'Digestion', value: 'Luminal + brush-border processing', provenance: 'educational', detail: 'Mechanical and enzymatic processing precedes segment-specific absorption.' },
    { label: 'Transit time', value: 'Not available', provenance: 'unavailable', detail: 'A patient-specific transit time requires an appropriate measurement or validated model.' },
  ],
  'hepatic-metabolism': [
    { label: 'Fed ↔ fasting', value: 'State-dependent pathways', provenance: 'educational', detail: 'Glycogenesis, glycogenolysis, gluconeogenesis, lipid handling and amino-acid/nitrogen pathways are shown as normal state-dependent physiology.' },
    { label: 'Portal handling', value: 'Input → processing → export', provenance: 'educational', detail: 'Portal substrate delivery is coupled to hepatic storage, synthesis, oxidation and export.' },
    { label: 'Measured hepatic flux', value: 'Not available', provenance: 'unavailable', detail: 'Routine laboratory values do not directly quantify whole-liver metabolic flux.' },
  ],
  renal: [
    { label: 'Nephron sequence', value: 'Filter → reabsorb → secrete → excrete', provenance: 'educational', detail: 'Glomerulus, proximal tubule, loop, distal nephron and collecting duct remain distinct functional segments.' },
    { label: 'ADH / RAAS', value: 'Normal control loops', provenance: 'educational', detail: 'Water balance, sodium handling, vascular tone and aldosterone signaling are linked without assigning fabricated hormone values.' },
    { label: 'eGFR', value: 'Not available', provenance: 'unavailable', detail: 'Requires creatinine/cystatin C and the inputs required by a validated equation.' },
  ],
  endocrine: [
    { label: 'Hormonal axes', value: 'Sensor → signal → target → feedback', provenance: 'educational', detail: 'Pituitary, thyroid, adrenal, pancreatic, gonadal and water-regulatory physiology are treated as distinct feedback systems.' },
    { label: 'Insulin physiology', value: 'β-cell → insulin → target response', provenance: 'educational', detail: 'Glucose sensing, insulin secretion, receptor signaling and GLUT4 recruitment are separate mechanisms.' },
    { label: 'Hormone concentration', value: 'Not available', provenance: 'unavailable', detail: 'No hormone concentration is synthesized without a laboratory or validated connected source.' },
  ],
  'acid-base-electrolyte': [
    { label: 'Acid-base', value: 'HCO₃⁻ ↔ CO₂', provenance: 'educational', detail: 'Buffering, pulmonary CO₂ handling and renal bicarbonate/H⁺ handling form one coupled system.' },
    { label: 'Electrolytes', value: 'Na⁺ · K⁺ · Ca²⁺ · PO₄³⁻', provenance: 'educational', detail: 'Distribution and regulation involve water balance, kidney, hormones, bone, gut and transcellular shifts.' },
    { label: 'Patient laboratory values', value: 'Not available', provenance: 'unavailable', detail: 'Requires measured blood gas and/or laboratory electrolytes.' },
  ],
  hematologic: [
    { label: 'Hematopoiesis', value: 'Marrow → circulating cells', provenance: 'educational', detail: 'Erythroid, myeloid and megakaryocytic production connects marrow to circulating blood-cell functions.' },
    { label: 'Hemostasis', value: 'Platelet → thrombin → fibrin → fibrinolysis', provenance: 'educational', detail: 'Primary hemostasis, coagulation and fibrinolysis are distinct but interacting normal processes.' },
    { label: 'CBC / coagulation', value: 'Not available', provenance: 'unavailable', detail: 'No hematology or coagulation values are fabricated.' },
  ],
  'immune-allergy': [
    { label: 'Barrier surveillance', value: 'Tissue → innate recognition', provenance: 'educational', detail: 'Normal immune surveillance begins at tissue barriers and innate sensing.' },
    { label: 'Adaptive response', value: 'APC → T/B → effector/memory', provenance: 'educational', detail: 'Antigen presentation, lymphocyte activation, effector function, memory and resolution are represented separately.' },
    { label: 'Universal immune score', value: 'Not generated', provenance: 'unavailable', detail: 'Normal immune function cannot be reduced to one valid generic percentage.' },
  ],
  reproductive: [
    { label: 'HPG axis', value: 'GnRH → LH/FSH → gonad → feedback', provenance: 'educational', detail: 'Hypothalamic, pituitary and gonadal physiology are linked while preserving sex-specific anatomy and outputs.' },
    { label: 'Gametogenesis / cycle', value: 'Normal reproductive processes', provenance: 'educational', detail: 'Spermatogenesis and ovarian/endometrial cycling are represented as distinct physiological processes.' },
    { label: 'Individual fertility state', value: 'Not inferred', provenance: 'unavailable', detail: 'Requires relevant history, examination and appropriate measurements.' },
  ],
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function format(value: number, digits = 0) {
  return digits ? value.toFixed(digits) : String(Math.round(value))
}

export function PhysiologyHraWorkbench() {
  const vitals = useVitals()
  const [systemKey, setSystemKey] = useState<PhysiologySystemKey>('cardiovascular')
  const [stateKey, setStateKey] = useState<DisplayState>('rest')
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [playing, setPlaying] = useState(() => typeof window === 'undefined' ? false : !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const system = useMemo(
    () => NORMAL_SYSTEMS.find((item) => item.key === systemKey) ?? NORMAL_SYSTEMS[0],
    [systemKey],
  )
  const reference = physiologyState(stateKey === 'connected' ? 'rest' : stateKey)
  const age = vitalsAge(vitals)

  const hrMeasured = finite(vitals.heartRate) ?? finite(vitals.restingHr)
  const rrMeasured = finite(vitals.respRate)
  const sbpMeasured = finite(vitals.systolic)
  const dbpMeasured = finite(vitals.diastolic)
  const tempMeasured = finite(vitals.bodyTempC)
  const spo2Measured = finite(vitals.spo2Pct)
  const hrvMeasured = finite(vitals.hrvMs)
  const vo2Measured = finite(vitals.vo2max)
  const hasConnected = Boolean(hrMeasured || rrMeasured || sbpMeasured || dbpMeasured || tempMeasured || spo2Measured || hrvMeasured || vo2Measured)
  const connected = stateKey === 'connected' && hasConnected

  const hr = connected ? (hrMeasured ?? reference.heartRate) : reference.heartRate
  const rr = connected ? (rrMeasured ?? reference.respRate) : reference.respRate
  const sbp = connected ? (sbpMeasured ?? reference.systolic) : reference.systolic
  const dbp = connected ? (dbpMeasured ?? reference.diastolic) : reference.diastolic
  const temp = connected ? (tempMeasured ?? reference.bodyTempC) : reference.bodyTempC
  const sourceTerms = useMemo(() => [...system.focusKeywords], [system])

  useEffect(() => {
    setPhaseIndex(0)
  }, [systemKey])

  useEffect(() => {
    if (!playing || system.phases.length < 2) return
    const timer = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % system.phases.length)
    }, 2300)
    return () => window.clearInterval(timer)
  }, [playing, system.phases.length])

  const metrics = useMemo<MetricItem[]>(() => {
    const measuredOrReference = (actual: number | undefined): PhysiologyProvenance => connected && actual != null ? 'measured' : 'educational'

    if (systemKey === 'cardiovascular') {
      const map = meanArterialPressure(sbp, dbp)
      const pp = pulsePressure(sbp, dbp)
      const co = cardiacOutputLMin(hr, reference.strokeVolumeMl)
      return [
        { label: 'Heart rate', value: `${format(hr)} bpm`, provenance: measuredOrReference(hrMeasured), detail: connected && hrMeasured ? 'Connected heart-rate measurement.' : 'Selected educational reference state.' },
        { label: 'Blood pressure', value: `${format(sbp)}/${format(dbp)} mmHg`, provenance: connected && sbpMeasured && dbpMeasured ? 'measured' : 'educational', detail: connected && sbpMeasured && dbpMeasured ? 'Connected systolic/diastolic pressure.' : 'Selected educational reference state.' },
        { label: 'Mean arterial pressure', value: `${format(map)} mmHg`, provenance: 'derived', detail: 'MAP ≈ DBP + (SBP − DBP) / 3 using the displayed pressures.' },
        { label: 'Pulse pressure', value: `${format(pp)} mmHg`, provenance: 'derived', detail: 'PP = SBP − DBP.' },
        { label: 'Cardiac-output context', value: `${format(co, 1)} L/min`, provenance: 'derived', detail: `CO = HR × SV using ${reference.strokeVolumeMl} mL educational stroke-volume context; this is not a measured cardiac output.` },
        { label: 'HRV', value: connected && hrvMeasured ? `${format(hrvMeasured)} ms` : 'Not available', provenance: connected && hrvMeasured ? 'measured' : 'unavailable', detail: 'HRV is shown only when a connected value exists.' },
      ]
    }

    if (systemKey === 'respiratory') {
      const ventilation = minuteVentilationLMin(rr, reference.tidalVolumeMl)
      return [
        { label: 'Respiratory rate', value: `${format(rr)} /min`, provenance: measuredOrReference(rrMeasured), detail: connected && rrMeasured ? 'Connected respiratory rate.' : 'Selected educational reference state.' },
        { label: 'SpO₂', value: connected && spo2Measured ? `${format(spo2Measured)}%` : 'Not available', provenance: connected && spo2Measured ? 'measured' : 'unavailable', detail: 'No oxygen saturation is invented when the sensor value is absent.' },
        { label: 'Tidal-volume context', value: `${reference.tidalVolumeMl} mL`, provenance: 'educational', detail: 'Teaching context only; not spirometry.' },
        { label: 'Minute ventilation', value: `${format(ventilation, 1)} L/min`, provenance: 'derived', detail: 'V̇E = RR × VT using the displayed RR and educational VT context.' },
        { label: 'FEV₁ / FVC', value: 'Requires spirometry', provenance: 'unavailable', detail: 'A numeric ratio requires a valid forced expiratory maneuver and appropriate reference interpretation.' },
        { label: 'VO₂max', value: connected && vo2Measured ? `${format(vo2Measured, 1)} mL/kg/min` : 'Not available', provenance: connected && vo2Measured ? 'measured' : 'unavailable', detail: 'Shown only when a connected VO₂max value exists.' },
      ]
    }

    if (systemKey === 'thermoregulation') {
      return [
        { label: 'Body temperature', value: `${format(temp, 1)} °C`, provenance: measuredOrReference(tempMeasured), detail: connected && tempMeasured ? 'Connected temperature measurement.' : 'Selected educational reference state.' },
        { label: 'Heat balance', value: 'S = M − W ± R ± C ± K − E', provenance: 'educational', detail: 'Normal heat-storage relation; it is not solved without metabolic and environmental inputs.' },
        { label: 'Sweat rate', value: 'Not available', provenance: 'unavailable', detail: 'No sweat rate is fabricated without an appropriate measurement.' },
        { label: 'Cutaneous blood flow', value: 'Not available', provenance: 'unavailable', detail: 'No skin perfusion value is inferred from temperature alone.' },
      ]
    }

    return NORMAL_METRICS[systemKey] ?? [
      { label: 'Mechanism', value: 'Anatomy-linked normal physiology', provenance: 'educational', detail: system.explanation },
      { label: 'Patient-specific state', value: 'Not available', provenance: 'unavailable', detail: 'Requires relevant measured inputs and a validated interpretation model.' },
    ]
  }, [connected, dbp, dbpMeasured, hr, hrMeasured, hrvMeasured, reference, rr, rrMeasured, sbp, sbpMeasured, spo2Measured, system, systemKey, temp, tempMeasured, vo2Measured])

  function chooseSystem(next: PhysiologySystemKey) {
    setSystemKey(next)
    setPhaseIndex(0)
  }

  const stateNote = connected
    ? `Connected measurements${age ? ` · ${age}` : ''}. Only variables actually present are marked measured; missing variables stay educational or unavailable.`
    : reference.note

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Whole-body normal physiology</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Anatomy → function → timing → equations → measured context.</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">This workspace is deliberately limited to normal physiology. Shock, fever pathophysiology, structural lesions, disease comparison and drugs are separated from this layer. HRA anatomy stays fixed; physiological timing is represented by explicit phases rather than organ wobble or decorative pulsing.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-400">{stateNote}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-[10px] leading-relaxed text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-300/[.07] dark:text-emerald-100">
          <span className="font-black">Boundary enforced:</span> {NORMAL_SYSTEMS.length} normal domains are available here. Pathological anatomy is not rendered inside the normal-physiology route.
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {NORMAL_SYSTEMS.map((item) => (
            <button key={item.key} onClick={() => chooseSystem(item.key)} className={`min-w-[168px] shrink-0 rounded-2xl border p-3 text-left transition ${item.key === systemKey ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/30 dark:bg-emerald-300/10' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
            </button>
          ))}
        </div>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button disabled={!hasConnected} onClick={() => setStateKey('connected')} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${stateKey === 'connected' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'} disabled:cursor-not-allowed disabled:opacity-35`}>Connected data</button>
          {PHYSIOLOGY_STATES.map((state) => (
            <button key={state.key} onClick={() => setStateKey(state.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${stateKey === state.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{state.label}</button>
          ))}
        </div>
      </section>

      <HraResolvedAnatomyViewer
        title={`${system.label} · source anatomy`}
        description="Static upstream HRA geometry. Changing normal physiological state, phase or connected metrics never morphs this source model."
        terms={sourceTerms}
        maxResults={16}
      />

      <HraContextBridge title={`${system.label} · mapped source structures`} terms={sourceTerms} maxResults={14} />

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Normal physiology cycle</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{system.label}</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{system.explanation}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPlaying((value) => !value)} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{playing ? 'Pause phases' : 'Play phases'}</button>
            <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">Phase {phaseIndex + 1}/{system.phases.length}</div>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {system.phases.map((phase, index) => (
            <button key={phase} onClick={() => { setPhaseIndex(index); setPlaying(false) }} className={`min-w-[190px] shrink-0 rounded-2xl border p-3 text-left ${index === phaseIndex ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{String(index + 1).padStart(2, '0')}</div>
              <div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{phase}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((item) => (
            <article key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{item.label}</div>
                <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${PROVENANCE_STYLE[item.provenance]}`}>{item.provenance}</span>
              </div>
              <div className="mt-2 text-lg font-black text-neutral-950 dark:text-white">{item.value}</div>
              <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.detail}</p>
            </article>
          ))}
        </div>

        {system.formulae.length > 0 && (
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {system.formulae.map((formula) => (
              <article key={formula.name} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{formula.name}</div>
                <div className="mt-1 font-mono text-[12px] font-black text-neutral-950 dark:text-white">{formula.formula}</div>
                <p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{formula.meaning}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Scale bridge</div>
        <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Keep the same mechanism coherent across scale.</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Anatomy</div><div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{sourceTerms.slice(0, 4).join(' · ')}</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">Named source structures remain the spatial anchor.</p></article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Function</div><div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{system.phases[phaseIndex]}</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">The active phase shows timing without deforming anatomy.</p></article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Quantitation</div><div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">{system.formulae[0]?.formula ?? 'Measurement dependent'}</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">Equations are shown only with their assumptions and measurement boundaries.</p></article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">Provenance</div><div className="mt-1 text-[11px] font-black text-neutral-950 dark:text-white">Measured · derived · educational · unavailable</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">No patient value is synthesized just to fill a card.</p></article>
        </div>
      </section>
    </div>
  )
}
