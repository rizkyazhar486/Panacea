import { MedicalEvidenceExplorer } from '../MedicalEvidenceExplorer'

export type BodyEvidenceMode =
  | 'digital-twin'
  | 'realistic-atlas'
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
  'digital-twin': {
    term: 'human tissue cell atlas organ cell type',
    title: 'Body → Cell references',
    subtitle: 'Cross-check organ, tissue and cell concepts against live ontology and literature sources.',
  },
  'cell-genome': {
    term: 'single cell genomics human sequencing',
    title: 'Cell → DNA references',
    subtitle: 'Live literature, ontology terms and registered studies for genomics and sequencing concepts.',
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

export function BodyEvidenceDock({ mode }: { mode: BodyEvidenceMode }) {
  const config = QUERY[mode]
  return (
    <MedicalEvidenceExplorer
      key={mode}
      compact
      autoRun
      initialQuery={config.term}
      title={config.title}
      subtitle={config.subtitle}
    />
  )
}

export default BodyEvidenceDock
