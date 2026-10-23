// Registro diário digitado (minutos de NEAT, repetições de agachamento). Antes `Number(x) || 0`:
// texto inválido virava 0 em silêncio e valores negativos ou acima do máximo físico eram gravados.
// Campo vazio é o usuário apagando o registro do dia (0 explícito); qualquer outra entrada
// inválida é recusada e o chamador mantém o valor anterior. Limites = sanidade de entrada.

export const MINUTES_PER_DAY_MAX = 1440
export const REPS_PER_DAY_MAX = 500

export type DailyLogParse = { ok: true; value: number } | { ok: false; problem: string }

export function parseDailyLog(text: unknown, max: number, label: string): DailyLogParse {
  if (typeof text !== 'string') return { ok: false, problem: `${label} must be text input` }
  if (text.trim() === '') return { ok: true, value: 0 }
  const v = Number(text)
  if (!Number.isFinite(v)) return { ok: false, problem: `${label} must be a number` }
  if (!Number.isInteger(v)) return { ok: false, problem: `${label} must be a whole number` }
  if (v < 0 || v > max) return { ok: false, problem: `${label} must be 0–${max}` }
  return { ok: true, value: v }
}
