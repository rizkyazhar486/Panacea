import { INDEKS_TUBUH, type StrukturTubuh } from './bodySearch'

export interface BodyLabelOption {
  key: string
  label: string
}

export interface BodyLabelChallenge {
  target: StrukturTubuh
  targetKey: string
  targetLabel: string
  options: BodyLabelOption[]
  source: 'whole-body-geometry-index'
}

function baseLabel(s: StrukturTubuh): string {
  return s.b.charAt(0).toUpperCase() + s.b.slice(1)
}

function stableSlot(value: string, size: number): number {
  if (size <= 1) return 0
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash % size
}

/**
 * Builds a deterministic label challenge from names that already exist in the
 * whole-body geometry index. Left/right meshes are intentionally treated as one
 * base anatomical label because `pasangan()` highlights both sides together.
 * Distractors are therefore never invented anatomy terms.
 */
export function buildBodyLabelChallenge(target: StrukturTubuh, optionCount = 4): BodyLabelChallenge {
  const targetLabel = baseLabel(target)
  const targetKey = `${target.l}:${target.b}`
  const wanted = Math.max(2, optionCount)

  const representatives = new Map<string, StrukturTubuh>()
  for (const s of INDEKS_TUBUH) {
    const key = `${s.l}:${s.b}`
    if (!representatives.has(key)) representatives.set(key, s)
  }

  const distractors = [...representatives.entries()]
    .filter(([key]) => key !== targetKey)
    .sort(([, a], [, b]) => {
      const aTier = a.l === target.l && a.w === target.w ? 0 : a.l === target.l ? 1 : 2
      const bTier = b.l === target.l && b.w === target.w ? 0 : b.l === target.l ? 1 : 2
      if (aTier !== bTier) return aTier - bTier
      const aDistance = Math.abs(a.y - target.y)
      const bDistance = Math.abs(b.y - target.y)
      if (aDistance !== bDistance) return aDistance - bDistance
      return baseLabel(a).localeCompare(baseLabel(b))
    })
    .slice(0, wanted - 1)
    .map(([key, s]) => ({ key, label: baseLabel(s) }))

  const options: BodyLabelOption[] = [...distractors]
  const slot = stableSlot(targetKey, options.length + 1)
  options.splice(slot, 0, { key: targetKey, label: targetLabel })

  return {
    target,
    targetKey,
    targetLabel,
    options,
    source: 'whole-body-geometry-index',
  }
}

export function isBodyLabelAnswerCorrect(challenge: BodyLabelChallenge, optionKey: string): boolean {
  return optionKey === challenge.targetKey
}
