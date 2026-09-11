import { lazy, Suspense } from 'react'
import { MedicalEvidenceExplorer } from '../MedicalEvidenceExplorer'

const PhysiologyScaleExplorer = lazy(() =>
  import('./PhysiologyScaleExplorer').then((module) => ({ default: module.PhysiologyScaleExplorer })),
)
const OcularMotility4D = lazy(() =>
  import('./OcularMotility4D').then((module) => ({ default: module.OcularMotility4D })),
)

export type BodyEvidenceMode =
  | 'digital-twin'
  | 'realistic-atlas'
  | 'physiology'
  | 'vision'
  | 'cell-genome'
  | 'workout-4d'
  | 'surgery'
  | 'surgery-rehearsal'
  | 'counterfactual'
  | 'regeneration'

const QUERY: Record<BodyEvidenceMode, { term: string; title: string; subtitle: string }> = {
  'realistic-atlas': {
    term: 'human anatomy integument skin adipose fascia skeletal muscle bone joint nervous cardiovascular organ anatomy',
    title: 'Whole-body atlas references',
    subtitle: 'Live terminology and anatomy evidence sit beside the HRA source geometry and end-to-end layer navigator.',
  },
  physiology: {
    term: 'normal human physiology cardiovascular respiratory renal gastrointestinal thermoregulation endocrine hepatic metabolism autonomic immune reproductive',
    title: 'Whole-body normal physiology references',
    subtitle: 'Published evidence remains separate from the normal-physiology workbench. Pathology, disease comparison and drugs are intentionally deferred to their own later layers.',
  },
  vision: {
    term: 'ocular anatomy extraocular muscle cornea iris lens aqueous vitreous retina macula fovea optic nerve optic chiasm visual acuity refraction color vision stereopsis visual field perimetry',
    title: 'Ocular anatomy & visual physiology references',
    subtitle: 'Live literature and ontology evidence accompany HRA globe/extraocular-muscle geometry, optical teaching, motility and functional examination modules.',
  },
  'digital-twin': {
    term: 'human tissue cell atlas organ cell type physiology gas exchange membrane potential',
    title: 'Body → Cell references',
    subtitle: 'Cross-check organ, tissue, cell and physiology concepts against live ontology and literature sources.',
  },
  'cell-genome': {
    term: 'single cell genomics human sequencing transcription translation gene expression',
    title: 'Cell → DNA references',
    subtitle: 'Live literature, ontology terms and registered studies for genomics, gene expression and sequencing concepts.',
  },
  'workout-4d': {
    term: 'exercise physiology skeletal muscle cardiovascular adaptation',
    title: 'Exercise physiology references',
    subtitle: 'Live evidence for the physiology shown in the movement view.',
  },
  surgery: {
    term: 'surgical anatomy operative technique anatomy',
    title: 'Surgical anatomy references',
    subtitle: 'Live literature and registered studies sit beside the procedural visualization.',
  },
  'surgery-rehearsal': {
    term: 'surgical education simulation procedural anatomy',
    title: 'Surgical training references',
    subtitle: 'Evidence for simulation, anatomy and procedural education is fetched live.',
  },
  counterfactual: {
    term: 'precision medicine treatment response prediction',
    title: 'What-if evidence',
    subtitle: 'The simulation is separated from real published evidence and registered studies.',
  },
  regeneration: {
    term: 'regenerative medicine tissue engineering clinical trial',
    title: 'Regeneration evidence',
    subtitle: 'Experimental concepts are paired with current literature and registered studies.',
  },
}

function PhysiologyLoading({ label = 'tissue, cellular and DNA physiology' }: { label?: string }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center text-sm font-semibold text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading {label}…
    </div>
  )
}

export function BodyEvidenceDock({ mode }: { mode: BodyEvidenceMode }) {
  const config = QUERY[mode]
  const showMicrophysiology = mode === 'digital-twin' || mode === 'cell-genome'
  const showOcularMotility = mode === 'vision'

  return (
    <div className="space-y-4">
      {showMicrophysiology && (
        <Suspense fallback={<PhysiologyLoading />}>
          <PhysiologyScaleExplorer initialScale={mode === 'digital-twin' ? 'tissue' : 'gene'} />
        </Suspense>
      )}

      {showOcularMotility && (
        <Suspense fallback={<PhysiologyLoading label="HRA extraocular muscle and gaze mechanics" />}>
          <OcularMotility4D />
        </Suspense>
      )}

      <MedicalEvidenceExplorer
        key={mode}
        compact
        autoRun
        initialQuery={config.term}
        title={config.title}
        subtitle={config.subtitle}
      />
    </div>
  )
}

export default BodyEvidenceDock
