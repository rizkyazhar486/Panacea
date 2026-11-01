// Fail-closed validation of a learning catalog against the shared concept graph and physiology model.
import { CARDIAC_OUTPUT_MODEL, computeCardiacOutput, type ConceptGraph } from '../../biological-concept-graph/index.ts'
import { LEARNING_SCHEMA_VERSION, type CatalogIssue, type LearningCatalog } from '../model/types.ts'

const LESSON_ID = /^les:[a-z][a-z0-9_]{1,63}$/, QUESTION_ID = /^q:[a-z][a-z0-9_]{1,63}$/

export function validateCatalog(c: LearningCatalog, g: ConceptGraph): readonly CatalogIssue[] {
  const out: CatalogIssue[] = []
  const add = (code: CatalogIssue['code'], subject: string, message: string) => out.push({ code, subject, message })
  if (c.schemaVersion.split('.')[0] !== LEARNING_SCHEMA_VERSION.split('.')[0]) add('schema_version_incompatible', 'catalog', c.schemaVersion)

  const lessons = new Map<string, (typeof c.lessons)[number]>(), questions = new Map<string, (typeof c.questions)[number]>()
  for (const l of c.lessons) { if (!LESSON_ID.test(l.id)) add('bad_id', l.id, 'lesson id'); else if (lessons.has(l.id)) add('duplicate_id', l.id, 'duplicate lesson'); lessons.set(l.id, l) }
  for (const q of c.questions) { if (!QUESTION_ID.test(q.id)) add('bad_id', q.id, 'question id'); else if (questions.has(q.id)) add('duplicate_id', q.id, 'duplicate question'); questions.set(q.id, q) }

  const checkRefs = (subject: string, ids: readonly string[]) => {
    if (!ids.length) add('no_reference', subject, 'at least one scientific reference is required')
    for (const r of ids) if (!g.references.has(r)) add('unknown_reference', subject, r)
  }

  for (const l of c.lessons) {
    if (!l.objectives.length) add('no_objectives', l.id, 'lesson has no objectives')
    checkRefs(l.id, l.referenceIds)
    for (const cid of l.conceptIds) if (!g.nodes.has(cid)) add('unknown_concept', l.id, cid)
    for (const p of l.prerequisites) if (!lessons.has(p)) add('unknown_prerequisite', l.id, p)
    for (const qid of l.questionIds) { const q = questions.get(qid); if (!q) add('unknown_question', l.id, qid); else if (q.lessonId !== l.id) add('question_lesson_mismatch', qid, `belongs to ${q.lessonId}`) }
    l.objectives.forEach((_, i) => { if (!l.questionIds.some((qid) => questions.get(qid)?.objectiveIndex === i)) add('objective_without_question', l.id, `objective ${i} is unassessed`) })
  }
  for (const l of c.lessons) { // prerequisite cycles
    const seen = new Set<string>(); const stack = [...l.prerequisites]
    while (stack.length) { const p = stack.pop()!; if (p === l.id) { add('prerequisite_cycle', l.id, 'cycle'); break }; if (seen.has(p)) continue; seen.add(p); stack.push(...(lessons.get(p)?.prerequisites ?? [])) }
  }
  for (const q of c.questions) {
    const l = lessons.get(q.lessonId)
    if (!l) add('question_lesson_mismatch', q.id, `unknown lesson ${q.lessonId}`)
    else {
      if (q.objectiveIndex < 0 || q.objectiveIndex >= l.objectives.length) add('objective_index_out_of_range', q.id, String(q.objectiveIndex))
      if (!l.conceptIds.includes(q.conceptId)) add('concept_not_in_lesson', q.id, q.conceptId)
    }
    if (!g.nodes.has(q.conceptId)) add('unknown_concept', q.id, q.conceptId)
    checkRefs(q.id, q.referenceIds)
    if (q.options.length < 3) add('too_few_options', q.id, `${q.options.length} options`)
    if (new Set(q.options.map((o) => o.id)).size !== q.options.length) add('duplicate_option_id', q.id, 'option ids not unique')
    if (!q.options.some((o) => o.id === q.correctOptionId)) add('missing_correct_option', q.id, q.correctOptionId)
    for (const o of q.options) if (!o.rationale.trim()) add('missing_rationale', q.id, `option ${o.id}`)
    if (q.modelCheck) {
      const r = computeCardiacOutput({ hrBpm: q.modelCheck.hrBpm, svMl: q.modelCheck.svMl })
      if (!r.ok) add('model_check_invalid', q.id, r.reason)
      else if (Math.abs(r.coLMin - q.modelCheck.expectedCoLMin) > 1e-9) add('model_check_mismatch', q.id, `model gives ${r.coLMin}`)
      if (q.conceptId !== CARDIAC_OUTPUT_MODEL.conceptId) add('model_check_invalid', q.id, 'modelCheck must be bound to the model concept')
    }
  }
  return out
}
