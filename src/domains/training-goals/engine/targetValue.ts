// Valor do alvo de treino digitado pelo usuário. Antes `Math.max(0, Number(x) || 0)`: campo vazio
// virava alvo 0 e `kemajuanTarget` tratava alvo ≤ 0 como "no caminho certo" — um falso positivo.
// Faixa = sanidade de entrada (km, minutos ou nº de sessões por período), não meta recomendada.

export const TARGET_MIN = 1
export const TARGET_MAX = 100_000

export type TargetParse = { ok: true; value: number } | { ok: false; problem: string }

export function parseTargetValue(text: unknown): TargetParse {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, problem: 'Enter a target of at least 1' }
  const v = Number(text)
  if (!Number.isFinite(v)) return { ok: false, problem: 'Target must be a number' }
  if (v < TARGET_MIN || v > TARGET_MAX) return { ok: false, problem: `Target must be ${TARGET_MIN}–${TARGET_MAX}` }
  return { ok: true, value: v }
}
