// Stable cross-domain deep links (Body Exposure ⇄ Prometheus) and navigation context. Pure: URLs are built/parsed as strings.
// Every parse is validated against the graph so a stale or tampered link fails closed instead of landing on a guessed concept.
import type { ConceptGraph } from '../model/types.ts'
import { pathFromRoot } from './conceptGraph.ts'

export type Surface = 'body' | 'lesson'
export interface NavigationContext {
  surface: Surface
  conceptId: string
  /** Concept the learner left from; "return" restores exactly this anatomical focus. */
  returnConceptId: string | null
  schemaVersion: string
}
export type LinkError = 'unknown_concept' | 'unknown_return_concept' | 'bad_surface' | 'incompatible_version' | 'malformed'

export function buildDeepLink(g: ConceptGraph, basePath: string, ctx: Omit<NavigationContext, 'schemaVersion'>): { ok: true; url: string } | { ok: false; error: LinkError } {
  if (!g.nodes.has(ctx.conceptId)) return { ok: false, error: 'unknown_concept' }
  if (ctx.returnConceptId !== null && !g.nodes.has(ctx.returnConceptId)) return { ok: false, error: 'unknown_return_concept' }
  const q = new URLSearchParams({ concept: ctx.conceptId, surface: ctx.surface, v: g.schemaVersion })
  if (ctx.returnConceptId) q.set('return', ctx.returnConceptId)
  return { ok: true, url: `${basePath}?${q.toString()}` }
}

export function parseDeepLink(g: ConceptGraph, url: string): { ok: true; ctx: NavigationContext } | { ok: false; error: LinkError } {
  const i = url.indexOf('?')
  if (i < 0) return { ok: false, error: 'malformed' }
  const q = new URLSearchParams(url.slice(i + 1))
  const concept = q.get('concept'), surface = q.get('surface'), v = q.get('v'), ret = q.get('return')
  if (!concept || !surface || !v) return { ok: false, error: 'malformed' }
  if (surface !== 'body' && surface !== 'lesson') return { ok: false, error: 'bad_surface' }
  if (v.split('.')[0] !== g.schemaVersion.split('.')[0]) return { ok: false, error: 'incompatible_version' }
  if (!g.nodes.has(concept)) return { ok: false, error: 'unknown_concept' }
  if (ret !== null && !g.nodes.has(ret)) return { ok: false, error: 'unknown_return_concept' }
  return { ok: true, ctx: { surface: surface as Surface, conceptId: concept, returnConceptId: ret, schemaVersion: v } }
}

/** Breadcrumb ids from the whole body to the focused concept, used for "back to parent" without losing context. */
export function breadcrumb(g: ConceptGraph, conceptId: string): readonly string[] | null {
  const p = pathFromRoot(g, conceptId)
  return p.ok ? p.value.map((n) => n.id) : null
}

export interface LessonLink { conceptId: string; lessonId: string }
/** Resolve concept→lesson links against the real lesson catalogue. Unresolved links are reported, never silently dropped or invented. */
export function resolveLessonLinks(g: ConceptGraph, links: readonly LessonLink[], knownLessonIds: ReadonlySet<string>) {
  const resolved: LessonLink[] = [], broken: { link: LessonLink; reason: 'unknown_concept' | 'unknown_lesson' }[] = []
  for (const l of links) {
    if (!g.nodes.has(l.conceptId)) broken.push({ link: l, reason: 'unknown_concept' })
    else if (!knownLessonIds.has(l.lessonId)) broken.push({ link: l, reason: 'unknown_lesson' })
    else resolved.push(l)
  }
  return { resolved, broken }
}

/** Asset keys must exist in the repo-backed registry; a binding to a missing mesh is a failure, not a fallback. */
export function checkAssetBindings(g: ConceptGraph, knownAssetKeys: ReadonlySet<string>) {
  return [...g.nodes.values()].filter((n) => n.visualization.assetKey && !knownAssetKeys.has(n.visualization.assetKey)).map((n) => ({ conceptId: n.id, assetKey: n.visualization.assetKey! }))
}
