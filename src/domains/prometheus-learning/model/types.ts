// Prometheus learning contract. Lessons/questions reference the shared biological concept graph by id; they never redefine biology.
// Pure types: no DOM, network, clock or RNG (the caller injects an integer `day`).
export const LEARNING_SCHEMA_VERSION = '1.0.0' as const

export interface AnswerOption { id: string; text: string; /** Why this option is right/wrong — required for every option (distractor explanations). */ rationale: string }
export interface ModelCheck { hrBpm: number; svMl: number; expectedCoLMin: number }
export interface Question {
  id: string
  lessonId: string
  conceptId: string
  /** Index into the lesson's objectives that this item assesses. */
  objectiveIndex: number
  stem: string
  options: readonly AnswerOption[]
  correctOptionId: string
  referenceIds: readonly string[]
  /** If present, the keyed answer must agree with the physiology model (checked at catalog validation). */
  modelCheck?: ModelCheck
}
export interface Lesson {
  id: string
  title: string
  conceptIds: readonly string[]
  prerequisites: readonly string[]
  objectives: readonly string[]
  referenceIds: readonly string[]
  questionIds: readonly string[]
  difficulty: 1 | 2 | 3
  /** Authored by engineering from cited sources; not reviewed by an authorised educator/clinician. */
  contentStatus: 'draft_unreviewed'
}
export interface LearningCatalog { schemaVersion: string; version: string; lessons: readonly Lesson[]; questions: readonly Question[] }

export type CatalogIssueCode =
  | 'schema_version_incompatible' | 'bad_id' | 'duplicate_id' | 'unknown_concept' | 'unknown_reference' | 'no_reference' | 'unknown_prerequisite' | 'prerequisite_cycle'
  | 'no_objectives' | 'objective_index_out_of_range' | 'question_lesson_mismatch' | 'unknown_question' | 'too_few_options' | 'duplicate_option_id' | 'missing_correct_option'
  | 'missing_rationale' | 'model_check_mismatch' | 'model_check_invalid' | 'objective_without_question' | 'concept_not_in_lesson'
export interface CatalogIssue { code: CatalogIssueCode; subject: string; message: string }

export interface Attempt { attemptId: string; optionId: string; correct: boolean; day: number }
export interface ReviewState { box: number; dueDay: number }
export interface LearningProgress {
  schemaVersion: string
  userId: string
  attempts: Readonly<Record<string, readonly Attempt[]>>
  review: Readonly<Record<string, ReviewState>>
  startedLessons: readonly string[]
}
