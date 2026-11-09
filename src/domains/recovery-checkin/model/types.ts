/** Penilaian subjektif kualitas tidur, 1 (sangat buruk) .. 5 (sangat baik). Bukan pengukuran, bukan skor kesiapan. */
export type SleepQuality = 1 | 2 | 3 | 4 | 5

/** Emoji sama dengan halaman Readiness (urutan 1..5) supaya satu nilai terlihat sama di kedua tempat. */
export const SLEEP_FACES: ReadonlyArray<{ readonly value: SleepQuality; readonly face: string; readonly label: string }> = [
  { value: 1, face: '😫', label: 'Very bad' },
  { value: 2, face: '😕', label: 'Bad' },
  { value: 3, face: '😐', label: 'Okay' },
  { value: 4, face: '🙂', label: 'Good' },
  { value: 5, face: '😴', label: 'Very good' },
]

export type RecordResult =
  | { readonly ok: true; readonly json: string }
  | { readonly ok: false; readonly reason: 'bad-quality' | 'bad-date' | 'store-unreadable' }
