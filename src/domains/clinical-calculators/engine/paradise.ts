/**
 * Kriteria Paradise (Paradise et al., 1984) untuk tonsilektomi pada tonsilofaringitis berulang: ≥ 7 episode dalam 1
 * tahun, ATAU ≥ 5/tahun selama 2 tahun berturut-turut, ATAU ≥ 3/tahun selama 3 tahun berturut-turut, dengan setiap
 * episode terdokumentasi baik. Ambang dipindahkan dari halaman tanpa perubahan. Hanya menyatakan apakah kriteria
 * terpenuhi; bukan indikasi bedah.
 */
import { inRange } from './inputs'

// Satu episode per hari adalah batas atas yang masuk akal untuk jumlah episode per tahun (kewarasan, bukan klinis).
export const PARADISE_EPISODES = { min: 0, max: 365 } as const

export type ParadiseResult =
  | { ok: true; data: { meetsCriteria: boolean } }
  | { ok: false; reason: string }

export function paradiseCriteria(episodesThisYear: number, episodesLastYear: number, episodes2YearsAgo: number, everyEpisodeDocumented: boolean): ParadiseResult {
  const years: ReadonlyArray<readonly [string, number]> = [
    ['This year', episodesThisYear], ['Last year', episodesLastYear], ['Two years ago', episodes2YearsAgo],
  ]
  for (const [name, n] of years) {
    if (!inRange(n, PARADISE_EPISODES.min, PARADISE_EPISODES.max) || !Number.isInteger(n)) {
      return { ok: false, reason: `Episodes ${name.toLowerCase()} must be a whole number of ${PARADISE_EPISODES.min}–${PARADISE_EPISODES.max}` }
    }
  }
  if (typeof everyEpisodeDocumented !== 'boolean') return { ok: false, reason: 'Documentation must be yes or no' }
  const [y1, y2, y3] = [episodesThisYear, episodesLastYear, episodes2YearsAgo]
  const meetsCriteria = everyEpisodeDocumented && (y1 >= 7 || (y1 >= 5 && y2 >= 5) || (y1 >= 3 && y2 >= 3 && y3 >= 3))
  return { ok: true, data: { meetsCriteria } }
}
