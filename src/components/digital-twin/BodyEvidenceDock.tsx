import { lazy, Suspense } from 'react'
import { MedicalEvidenceExplorer } from '../MedicalEvidenceExplorer'

const PhysiologyScaleExplorer = lazy(() =>
  import('./PhysiologyScaleExplorer').then((module) => ({ default: module.PhysiologyScaleExplorer })),
)

export type BodyEvidenceMode =
  | 'digital-twin'
  | 'realistic-atlas'
  | 'physiology'
  | 'cell-genome'
  | 'workout-4d'
  | 'surgery'
  | 'surgery-rehearsal'
  | 'counterfactual'
  | 'regeneration'

const QUERY: Record<BodyEvidenceMode, { term: string; title: string; subtitle: string }> = {
  'realistic-atlas': {
    term: 'human anatomy heart lung vasculature',
    title: 'Atlas references',
    subtitle: 'Terminology and anatomy evidence are pulled live from EMBL-EBI OLS and Europe PMC.',
  },
  physiology: {
    term: 'human physiology cardiovascular respiratory renal gastrointestinal thermoregulation',
    title: 'Whole-body physiology references',
    subtitle: 'Live literature sits beside the 4D physiology model so educational motion and published evidence remain separate.',
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

function PhysiologyLoading() {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center text-sm font-semibold text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading tissue, cellular and DNA physiology…
    </div>
  )
}

export function BodyEvidenceDock({ mode }: { mode: BodyEvidenceMode }) {
  const config = QUERY[mode]
  const showMicrophysiology = mode === 'digital-twin' || mode === 'cell-genome'

  return (
    <div className="space-y-4">
      {showMicrophysiology && (
        <Suspense fallback={<PhysiologyLoading />}>
          <PhysiologyScaleExplorer initialScale={mode === 'digital-twin' ? 'tissue' : 'gene'} />
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
