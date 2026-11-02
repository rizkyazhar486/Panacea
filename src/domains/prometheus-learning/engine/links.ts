import type { LearningCatalog } from '../model/types.ts'
import type { LessonLink } from '../../biological-concept-graph/index.ts'
/** Derive concept→lesson links from the catalog so linking has a single source of truth (no hand-maintained duplicate list). */
export const lessonLinksOf = (c: LearningCatalog): LessonLink[] => c.lessons.flatMap((l) => l.conceptIds.map((conceptId) => ({ conceptId, lessonId: l.id })))
