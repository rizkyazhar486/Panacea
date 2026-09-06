export type LibraryKind = 'book' | 'story' | 'motivation'

export interface EnrichmentItem {
  id: string
  kind: LibraryKind
  title: string
  author?: string
  tag: string
  summary: string
  note?: string
}

export const ENRICHMENT_LIBRARY: EnrichmentItem[] = [
  { id: 'gray-anatomy', kind: 'book', title: "Gray's Anatomy for Students", author: 'Drake, Vogl & Mitchell', tag: 'Anatomy', summary: 'Use it as a spatial reference: structure → relationship → clinical relevance. PanaceaMed should turn each chapter into an atlas journey rather than a wall of text.', note: 'Metadata and original study guidance only.' },
  { id: 'robbins', kind: 'book', title: 'Robbins & Cotran Pathologic Basis of Disease', author: 'Kumar, Abbas & Aster', tag: 'Pathology', summary: 'Best approached as mechanism chains: insult → molecular response → cell injury → tissue pattern → symptoms. Pair each mechanism with histology and imaging.' },
  { id: 'guyton', kind: 'book', title: 'Guyton and Hall Textbook of Medical Physiology', author: 'Hall', tag: 'Physiology', summary: 'Convert long physiology chapters into dynamic loops: input → sensor → controller → effector → feedback. Then animate the loop in 4D.' },
  { id: 'harrison', kind: 'book', title: "Harrison's Principles of Internal Medicine", author: 'McGraw Hill editors', tag: 'Medicine', summary: 'Use after you understand mechanisms. Focus on presentation patterns, differential diagnosis, evidence-informed management and exceptions.' },
  { id: 'netter', kind: 'book', title: 'Atlas of Human Anatomy', author: 'Frank H. Netter', tag: 'Anatomy', summary: 'A visual relationship reference. PanaceaMed should complement—not reproduce—published plates with interactive licensed/open 3D anatomy.' },
  { id: 'cell-story', kind: 'story', title: 'A Cell Runs Out of Energy', tag: 'Cell biology', summary: 'Follow one stressed cell from falling ATP and ion-pump failure to swelling, mitochondrial dysfunction, inflammatory signaling and tissue-level consequences. A fictional teaching story, grounded in standard cell biology.' },
  { id: 'plaque-story', kind: 'story', title: 'The Plaque That Took Decades', tag: 'Cardiovascular', summary: 'A fictional artery ages from endothelial stress to lipid retention, inflammation, fibrous-cap remodeling and an acute event—showing why prevention acts years before symptoms.' },
  { id: 'retina-story', kind: 'story', title: 'A Night in the Retina', tag: 'Ophthalmology', summary: 'Travel from photon capture in a photoreceptor through bipolar and ganglion cells to the optic nerve, then see how edema or ischemia alters the signal.' },
  { id: 'mot-1', kind: 'motivation', title: 'Make the next rep obvious', tag: 'Consistency', summary: 'When motivation is low, shrink the task until starting is easier than avoiding it. Ten focused minutes still keeps the learning or training identity alive.' },
  { id: 'mot-2', kind: 'motivation', title: 'Measure the process, not your worth', tag: 'Resilience', summary: 'A score is feedback about a system at one moment. Use it to choose the next action; do not turn it into a verdict about yourself.' },
  { id: 'mot-3', kind: 'motivation', title: 'Build evidence of who you are becoming', tag: 'Identity', summary: 'Every logged workout, review session and completed case is a small piece of evidence. Consistency compounds before it becomes visible.' },
]
