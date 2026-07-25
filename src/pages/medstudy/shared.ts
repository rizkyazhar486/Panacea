// Shared helpers for the Med Study Hub sections (kept in their own module so
// the lazily-loaded section chunks can share them without duplication).

export function levelTone(level: string): 'critical' | 'brand' | 'low' | 'neutral' {
  if (level.startsWith('4')) return 'critical'
  if (level.startsWith('3')) return 'brand'
  if (level.startsWith('2')) return 'low'
  return 'neutral'
}
export function levelLabel(level: string): string {
  if (level === '4' || level === '4A') return '4A — Mandiri, tuntas'
  if (level === '3B') return '3B — Supervisi, gawat darurat'
  if (level === '3' || level === '3A') return '3A — Supervisi, bukan gawat darurat'
  if (level === '2') return '2 — Pernah melihat'
  return '1 — Tahu teori'
}
