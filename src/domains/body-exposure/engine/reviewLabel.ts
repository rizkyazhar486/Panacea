// Label status tinjauan klinis untuk sebuah struktur anatomi, dari metadata GLB (extras glTF).
// Gagal-tertutup: sebuah struktur dianggap BELUM ditinjau kecuali metadata menyatakan tinjauan secara eksplisit
// (`panacea_clinically_reviewed === true`). Nilai hilang, bertipe lain ("true", 1), atau status `review_required`
// semuanya berarti belum ditinjau. Fungsi ini hanya menampilkan apa yang tercatat; tidak pernah menyetujui apa pun
// (persetujuan hanya lewat catatan tinjauan di structureReview.ts).
export interface ReviewLabel {
  reviewed: boolean
  text: string
}

export function reviewLabel(userData: Record<string, unknown> | null | undefined): ReviewLabel {
  const u = userData ?? {}
  if (u.panacea_clinically_reviewed === true && u.panacea_review_status !== 'review_required') return { reviewed: true, text: 'Clinically reviewed' }
  return { reviewed: false, text: 'Not clinically reviewed' }
}
