// Multiscale Educational Search Engine for PanaceaMed.
// Enables deep, faceted, multiscale exploration across the biological knowledge graph,
// Prometheus learning catalog, teachable causal figures, clinical simulation cases, and competitive arena drills.
// Pure & deterministic. No external network queries or browser DOM dependencies.

import type { ConceptGraph, ConceptNode, Scale } from '../../biological-concept-graph/index.ts'
import { descendants, pathFromRoot } from '../../biological-concept-graph/index.ts'
import type { LearningCatalog, Lesson, Question } from '../model/types.ts'
import type { ClinicalCase } from './caseMachine.ts'
import { listTeachableFigures, type TeachableFigureDef } from './teachableFigureEngine.ts'

export type SearchResultKind =
  | 'biological_concept'
  | 'prometheus_lesson'
  | 'clinical_case'
  | 'teachable_figure'
  | 'assessment_question'
  | 'arena_drill'

export interface EducationalSearchResult {
  readonly id: string
  readonly kind: SearchResultKind
  readonly title: string
  readonly subtitle: string
  readonly snippet: string
  readonly scale?: Scale
  readonly conceptId?: string
  readonly referenceIds: readonly string[]
  readonly deepLink: string
  readonly score: number
  readonly badges: readonly string[]
  readonly multiscaleContext?: {
    readonly ancestors: readonly string[]
    readonly descendantsCount: number
  }
}

export interface EducationalSearchFilters {
  readonly scale?: Scale
  readonly kind?: SearchResultKind
  readonly referenceId?: string
  readonly conceptId?: string
  readonly minScore?: number
}

export interface SearchFacetCounts {
  readonly byKind: Record<SearchResultKind, number>
  readonly byScale: Partial<Record<Scale, number>>
  readonly totalMatches: number
}

export interface EducationalSearchOutput {
  readonly query: string
  readonly filtersApplied: EducationalSearchFilters
  readonly results: readonly EducationalSearchResult[]
  readonly facets: SearchFacetCounts
  readonly expandedConceptIds: readonly string[]
}

const NORMALIZE_REGEX = /[^a-z0-9\s]/g

export function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .replace(NORMALIZE_REGEX, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

/** Parses query string for facets like "scale:cell", "kind:lesson", or "ref:openstax-ap2e". */
export function parseSearchQuery(rawQuery: string): {
  cleanQuery: string
  filters: EducationalSearchFilters
} {
  const parts = rawQuery.trim().split(/\s+/)
  const cleanTokens: string[] = []
  let scale: Scale | undefined
  let kind: SearchResultKind | undefined
  let referenceId: string | undefined
  let conceptId: string | undefined

  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).toLowerCase()
      const val = part.slice(colonIdx + 1).toLowerCase()
      if (key === 'scale') {
        scale = val as Scale
      } else if (key === 'kind' || key === 'type') {
        kind = val as SearchResultKind
      } else if (key === 'ref') {
        referenceId = val.startsWith('ref:') ? val : `ref:${val}`
      } else if (key === 'concept') {
        conceptId = val.startsWith('pcg:') ? val : `pcg:${val}`
      } else {
        cleanTokens.push(part)
      }
    } else {
      cleanTokens.push(part)
    }
  }

  return {
    cleanQuery: cleanTokens.join(' '),
    filters: {
      scale,
      kind,
      referenceId,
      conceptId,
    },
  }
}

export function searchEducationalUniverse(
  rawQuery: string,
  context: {
    readonly graph: ConceptGraph
    readonly catalog: LearningCatalog
    readonly cases?: readonly ClinicalCase[]
    readonly teachableFigures?: readonly TeachableFigureDef<any, any>[]
  },
  explicitFilters?: EducationalSearchFilters
): EducationalSearchOutput {
  const { cleanQuery, filters: parsedFilters } = parseSearchQuery(rawQuery)
  const filters: EducationalSearchFilters = {
    ...parsedFilters,
    ...explicitFilters,
  }

  const queryTokens = tokenize(cleanQuery)
  const results: EducationalSearchResult[] = []
  const { graph, catalog } = context
  const cases = context.cases ?? []
  const figures = context.teachableFigures ?? listTeachableFigures()

  // Track expanded concept IDs when query matches a biological structure
  const expandedConceptIds = new Set<string>()

  // Helper score calculator
  function computeScore(fields: {
    readonly title: string
    readonly subtitle?: string
    readonly text?: string
    readonly tags?: readonly string[]
  }): number {
    if (queryTokens.length === 0) return 1.0 // Return everything with base score if empty query

    let matchedCount = 0
    let totalScore = 0

    const titleTokens = tokenize(fields.title)
    const subTokens = fields.subtitle ? tokenize(fields.subtitle) : []
    const bodyTokens = fields.text ? tokenize(fields.text) : []
    const tagTokens = fields.tags ? fields.tags.flatMap(tokenize) : []

    for (const q of queryTokens) {
      if (titleTokens.includes(q)) {
        totalScore += 10
        matchedCount++
      } else if (titleTokens.some((t) => t.includes(q) || q.includes(t))) {
        totalScore += 6
        matchedCount++
      } else if (subTokens.some((t) => t.includes(q))) {
        totalScore += 4
        matchedCount++
      } else if (tagTokens.includes(q)) {
        totalScore += 4
        matchedCount++
      } else if (bodyTokens.some((t) => t.includes(q))) {
        totalScore += 2
        matchedCount++
      }
    }

    if (matchedCount === 0) return 0
    return Math.round((totalScore / queryTokens.length) * 10) / 10
  }

  // 1. Search Biological Concept Graph
  for (const node of graph.nodes.values()) {
    if (filters.scale && node.scale !== filters.scale) continue
    if (filters.kind && filters.kind !== 'biological_concept') continue
    if (filters.referenceId && !node.referenceIds.includes(filters.referenceId)) continue
    if (filters.conceptId && node.id !== filters.conceptId) continue

    const score = computeScore({
      title: node.label,
      subtitle: `${node.scale.replace('_', ' ')} ${node.ontologyId ?? ''}`,
      text: `${node.definition} ${node.function ?? ''} ${node.pathophysiology ?? ''} ${node.learningObjectives.join(' ')}`,
      tags: [node.scale, node.visualization.representation],
    })

    if (score > 0) {
      expandedConceptIds.add(node.id)
      const pathRes = pathFromRoot(graph, node.id)
      const ancestors = pathRes.ok ? pathRes.value.map((a) => a.label) : []
      const descRes = descendants(graph, node.id)
      const descendantsCount = descRes.ok ? descRes.value.length : 0

      results.push({
        id: node.id,
        kind: 'biological_concept',
        title: node.label,
        subtitle: `Scale: ${node.scale.replace('_', ' ').toUpperCase()} • ${node.ontologyId ?? 'Panacea Model'}`,
        snippet: node.definition,
        scale: node.scale,
        conceptId: node.id,
        referenceIds: node.referenceIds,
        deepLink: `/body?concept=${encodeURIComponent(node.id)}&surface=body&v=${encodeURIComponent(graph.schemaVersion)}`,
        score,
        badges: [node.scale, node.visualization.representation],
        multiscaleContext: {
          ancestors,
          descendantsCount,
        },
      })
    }
  }

  // 2. Search Prometheus Lessons
  for (const lesson of catalog.lessons) {
    if (filters.kind && filters.kind !== 'prometheus_lesson') continue
    if (filters.scale) {
      const matchesScale = lesson.conceptIds.some((cid) => graph.nodes.get(cid)?.scale === filters.scale)
      if (!matchesScale) continue
    }
    if (filters.referenceId && !lesson.referenceIds.includes(filters.referenceId)) continue
    if (filters.conceptId && !lesson.conceptIds.includes(filters.conceptId)) continue

    const conceptLabels = lesson.conceptIds
      .map((cid) => graph.nodes.get(cid)?.label ?? cid)
      .join(' ')

    const score = computeScore({
      title: lesson.title,
      subtitle: `Lesson (Difficulty ${lesson.difficulty})`,
      text: `${conceptLabels} ${lesson.objectives.join(' ')}`,
      tags: ['lesson', `diff_${lesson.difficulty}`],
    })

    if (score > 0) {
      results.push({
        id: lesson.id,
        kind: 'prometheus_lesson',
        title: lesson.title,
        subtitle: `Prometheus Lesson • Difficulty ${lesson.difficulty}/3`,
        snippet: lesson.objectives[0] ?? 'Interactive structured learning module.',
        conceptId: lesson.conceptIds[0],
        referenceIds: lesson.referenceIds,
        deepLink: `/learn?concept=${encodeURIComponent(lesson.conceptIds[0] ?? 'pcg:heart')}&lesson=${encodeURIComponent(lesson.id)}&surface=lesson`,
        score,
        badges: ['lesson', `difficulty_${lesson.difficulty}`],
      })
    }
  }

  // 3. Search Teachable Causal Figures
  for (const fig of figures) {
    if (filters.kind && filters.kind !== 'teachable_figure') continue
    if (filters.scale && graph.nodes.get(fig.targetConceptId)?.scale !== filters.scale) continue
    if (filters.referenceId && !fig.referenceIds.some((r) => r === filters.referenceId)) continue
    if (filters.conceptId && fig.targetConceptId !== filters.conceptId) continue

    const score = computeScore({
      title: fig.title,
      subtitle: 'Interactive Causal Teachable Figure',
      text: `${fig.description} ${fig.coreMisconception} ${fig.predictionQuestion.stem}`,
      tags: ['teachable_figure', 'causal_simulation', 'predict_try_explain'],
    })

    if (score > 0) {
      results.push({
        id: fig.id,
        kind: 'teachable_figure',
        title: fig.title,
        subtitle: 'Causal Teachable Figure • Predict → Try → Explain',
        snippet: fig.description,
        scale: graph.nodes.get(fig.targetConceptId)?.scale,
        conceptId: fig.targetConceptId,
        referenceIds: fig.referenceIds,
        deepLink: `/learn?figure=${encodeURIComponent(fig.id)}&concept=${encodeURIComponent(fig.targetConceptId)}`,
        score: score + 1.5, // Slight priority for interactive simulation
        badges: ['interactive', 'causal_model'],
      })
    }
  }

  // 4. Search Clinical Simulation Cases
  for (const c of cases) {
    if (filters.kind && filters.kind !== 'clinical_case') continue
    if (filters.scale) {
      const matchesScale = c.conceptIds.some((cid) => graph.nodes.get(cid)?.scale === filters.scale)
      if (!matchesScale) continue
    }
    if (filters.referenceId && !c.referenceIds.includes(filters.referenceId)) continue
    if (filters.conceptId && !c.conceptIds.includes(filters.conceptId)) continue

    const score = computeScore({
      title: c.presentation,
      subtitle: `Clinical Case Vignette (${c.id})`,
      text: `${c.candidates.map((d) => d.label).join(' ')} ${c.history.map((h) => h.label).join(' ')}`,
      tags: ['clinical_case', 'synthetic_vignette'],
    })

    if (score > 0) {
      results.push({
        id: c.id,
        kind: 'clinical_case',
        title: 'Synthetic Clinical Vignette',
        subtitle: `Differential Diagnosis Practice • ${c.candidates.length} Candidate Diagnoses`,
        snippet: c.presentation,
        scale: graph.nodes.get(c.conceptIds[0])?.scale,
        conceptId: c.conceptIds[0],
        referenceIds: c.referenceIds,
        deepLink: `/learn?case=${encodeURIComponent(c.id)}&concept=${encodeURIComponent(c.conceptIds[0] ?? 'pcg:heart')}`,
        score,
        badges: ['case_study', 'synthetic'],
      })
    }
  }

  // 5. Search Assessment Questions
  for (const q of catalog.questions) {
    if (filters.kind && filters.kind !== 'assessment_question') continue
    if (filters.scale && graph.nodes.get(q.conceptId)?.scale !== filters.scale) continue
    if (filters.referenceId && !q.referenceIds.includes(filters.referenceId)) continue
    if (filters.conceptId && q.conceptId !== filters.conceptId) continue

    const score = computeScore({
      title: q.stem,
      subtitle: `Assessment Question (${q.id})`,
      text: q.options.map((o) => `${o.text} ${o.rationale}`).join(' '),
      tags: ['question', 'active_recall'],
    })

    if (score > 0) {
      results.push({
        id: q.id,
        kind: 'assessment_question',
        title: q.stem,
        subtitle: `Assessment Item • Question ${q.id}`,
        snippet: `Options: ${q.options.map((o) => o.text).join(' | ')}`,
        scale: graph.nodes.get(q.conceptId)?.scale,
        conceptId: q.conceptId,
        referenceIds: q.referenceIds,
        deepLink: `/learn?question=${encodeURIComponent(q.id)}&lesson=${encodeURIComponent(q.lessonId)}`,
        score,
        badges: ['question', 'quiz'],
      })
    }
  }

  // Sort results by score descending, tie break by title
  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  // Calculate facets
  const facets: SearchFacetCounts = {
    totalMatches: results.length,
    byKind: {
      biological_concept: 0,
      prometheus_lesson: 0,
      clinical_case: 0,
      teachable_figure: 0,
      assessment_question: 0,
      arena_drill: 0,
    },
    byScale: {},
  }

  for (const r of results) {
    facets.byKind[r.kind] = (facets.byKind[r.kind] ?? 0) + 1
    if (r.scale) {
      facets.byScale[r.scale] = (facets.byScale[r.scale] ?? 0) + 1
    }
  }

  return {
    query: cleanQuery,
    filtersApplied: filters,
    results,
    facets,
    expandedConceptIds: Array.from(expandedConceptIds),
  }
}
