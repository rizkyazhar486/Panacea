import { BATAS_KG, BATAS_ULANGAN, setSah, type SetAngkat } from '../../../lib/angkatBeban'

export type StrengthSetDraft = { ulangan: string; kg: string }
export type StrengthDraftResult =
  | { kind: 'empty'; sets: [] }
  | { kind: 'invalid'; sets: []; reason: string }
  | { kind: 'valid'; sets: SetAngkat[] }

/** Blank rows are unused, while any started row must be complete and valid. */
export function parseStrengthDraft(rows: readonly StrengthSetDraft[]): StrengthDraftResult {
  const sets: SetAngkat[] = []
  for (const [index, row] of rows.entries()) {
    const reason = `Set ${index + 1} needs whole reps ${BATAS_ULANGAN.min}–${BATAS_ULANGAN.maks} and weight above 0 up to ${BATAS_KG.maks} kg.`
    if (!row || typeof row.ulangan !== 'string' || typeof row.kg !== 'string') return { kind: 'invalid', sets: [], reason }
    const reps = row.ulangan.trim(); const weight = row.kg.trim()
    if (!reps && !weight) continue
    if (!reps || !weight) return { kind: 'invalid', sets: [], reason }
    const parsed = { ulangan: Number(reps), kg: Number(weight) }
    if (!setSah(parsed)) return { kind: 'invalid', sets: [], reason }
    sets.push(parsed)
  }
  return sets.length ? { kind: 'valid', sets } : { kind: 'empty', sets: [] }
}
