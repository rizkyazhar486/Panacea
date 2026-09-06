export type LearningMode = 'awam' | 'school' | 'medschool' | 'professional' | 'specialist' | 'professor'

export interface LearningModeProfile {
  id: LearningMode
  label: string
  shortLabel: string
  description: string
  vocabulary: string
  emphasis: string
}

export const LEARNING_MODES: LearningModeProfile[] = [
  { id: 'awam', label: 'Awam', shortLabel: 'Everyday', description: 'Plain language, practical meaning, minimal jargon.', vocabulary: 'Everyday language', emphasis: 'What it means · when to seek help · what to do next' },
  { id: 'school', label: 'Sekolah', shortLabel: 'School', description: 'Build the biology from first principles with analogies.', vocabulary: 'Foundational science', emphasis: 'Concept · analogy · key terms · simple quiz' },
  { id: 'medschool', label: 'Med School', shortLabel: 'Med', description: 'Clinical framework for pre-clinical, clerkship and exams.', vocabulary: 'Medical terminology', emphasis: 'Etiology · pathophysiology · presentation · diagnosis · treatment' },
  { id: 'professional', label: 'Professional', shortLabel: 'Pro', description: 'Action-oriented clinical reference for day-to-day practice.', vocabulary: 'Clinical shorthand', emphasis: 'Assessment · differential · red flags · guideline-aligned management' },
  { id: 'specialist', label: 'Specialist', shortLabel: 'Specialist', description: 'Subspecialty nuance, imaging, procedures and evidence detail.', vocabulary: 'Subspecialty terminology', emphasis: 'Phenotype · staging · imaging · procedural decisions · evidence quality' },
  { id: 'professor', label: 'Professor', shortLabel: 'Professor', description: 'Mechanistic and research-level view with uncertainty and controversies.', vocabulary: 'Research terminology', emphasis: 'Mechanism · methods · limitations · conflicting evidence · open questions' },
]

const KEY = 'pmd_learning_mode_v2'
const EVENT = 'pmd-learning-mode'

export function getLearningMode(): LearningMode {
  try {
    const value = localStorage.getItem(KEY) as LearningMode | null
    return LEARNING_MODES.some((m) => m.id === value) ? value! : 'medschool'
  } catch {
    return 'medschool'
  }
}

export function setLearningMode(mode: LearningMode) {
  try { localStorage.setItem(KEY, mode) } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: mode }))
}

export function subscribeLearningMode(listener: (mode: LearningMode) => void) {
  const onCustom = (event: Event) => listener((event as CustomEvent<LearningMode>).detail)
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener(getLearningMode())
  }
  window.addEventListener(EVENT, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export function learningModeProfile(mode: LearningMode) {
  return LEARNING_MODES.find((m) => m.id === mode) ?? LEARNING_MODES[2]
}
