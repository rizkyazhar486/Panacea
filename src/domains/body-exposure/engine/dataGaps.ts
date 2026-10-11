// Daftar data yang BELUM tersedia di Body Exposure dan alasannya, supaya antarmuka menyatakan "tidak ada" alih-alih menampilkan pengganti.
// Murni: tanpa DOM/jaringan. Gagal-tertutup: entri tanpa alasan atau tanpa kelas ditolak oleh validator; tidak ada anatomi dewasa yang diskalakan menjadi
// kehamilan, janin utuh, anak atau lansia, dan tidak ada gerak yang dikarang.

export type GapKind = 'anatomy' | 'motion'
export type GapStatus = 'no_source' | 'licence_unverified' | 'not_separable' | 'blocked_review'
export interface DataGap {
  id: string
  kind: GapKind
  label: string
  status: GapStatus
  /** satu kalimat: kenapa tidak ada */
  reason: string
  /** satu kalimat: apa yang membuka blokir */
  unblock: string
}

export const DATA_GAPS: readonly DataGap[] = [
  { id: 'heartbeat', kind: 'motion', label: 'Heartbeat', status: 'licence_unverified', reason: 'Validated cardiac motion needs cine MRI or 4D CT; the candidate sets (ACDC, DIR-Lab) have usage terms that were not verified, so none is ingested.', unblock: 'Read the usage terms from the original download, or provide a licensed cardiac cine dataset.' },
  { id: 'pregnancy', kind: 'anatomy', label: 'Pregnancy', status: 'no_source', reason: 'No open maternal anatomy (uterus, placenta) with a fetus is available; the fetal MRI atlas holds fetal organs only.', unblock: 'A licensed pregnant-female phantom or imaging-derived maternal-fetal dataset.' },
  { id: 'fetal_3d_development', kind: 'anatomy', label: 'Fetal and embryonic 3D development by gestational age', status: 'no_source', reason: 'Published growth references (biometry from 14 to 40 weeks) are available, but no open 3D anatomy of a developing fetus or embryo by gestational age; no shape is scaled or invented from the growth tables.', unblock: 'An open imaging-derived fetal atlas series across gestational ages, or embryo reconstructions with redistribution rights.' },
  { id: 'fetal_skeleton_skin', kind: 'anatomy', label: 'Fetal skeleton, skin, brain and heart', status: 'no_source', reason: 'The fetal atlas segments ten organs only.', unblock: 'A fetal MRI or CT atlas with these structures under an open licence.' },
  { id: 'older_adult', kind: 'anatomy', label: 'Older adult: whole body, brain, limbs and skin', status: 'no_source', reason: 'Only two partial individuals exist (a 73-year-old woman and a 72-year-old man, both from the neck to the upper thighs with only a cut piece of the skull); neither has a brain, limbs below mid-thigh or skin, and an adult model is never rescaled to stand in.', unblock: 'Wider coverage from another age-representative whole-body dataset with redistribution rights.' },
  { id: 'hand_bones_individual', kind: 'anatomy', label: 'Individual hand bones (female)', status: 'not_separable', reason: 'The CT shows the hand skeleton but the joint gaps are too small for a reliable automatic split, and no manual segmentation exists.', unblock: 'Manual or reviewed segmentation of carpals, metacarpals and phalanges.' },
  { id: 'right_forearm_proximal', kind: 'anatomy', label: 'Right forearm bones near the elbow (female)', status: 'no_source', reason: 'The CT block cuts the right arm there, so the bone is not in the data.', unblock: 'A different scan of the same donor covering the right elbow, if one exists.' },
  { id: 'clinical_review', kind: 'anatomy', label: 'Clinical review of any structure', status: 'blocked_review', reason: 'No qualified reviewer is registered, so every structure stays unreviewed.', unblock: 'The owner registers an authorised reviewer and the reviewer approves a specific asset version.' },
]

const STATUSES: readonly GapStatus[] = ['no_source', 'licence_unverified', 'not_separable', 'blocked_review']
const KINDS: readonly GapKind[] = ['anatomy', 'motion']
const nonEmpty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0

/** Validasi daftar celah: id unik, kelas dikenal, alasan dan jalan keluar tidak kosong. Mengembalikan daftar masalah (kosong = sah). */
export function validateGaps(gaps: readonly DataGap[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const g of gaps) {
    if (!nonEmpty(g.id)) { problems.push('gap without id'); continue }
    if (seen.has(g.id)) problems.push(`${g.id}: duplicate id`)
    seen.add(g.id)
    if (!KINDS.includes(g.kind)) problems.push(`${g.id}: unknown kind`)
    if (!STATUSES.includes(g.status)) problems.push(`${g.id}: unknown status`)
    for (const k of ['label', 'reason', 'unblock'] as const) if (!nonEmpty(g[k])) problems.push(`${g.id}: ${k} missing`)
  }
  return problems
}

export const GAP_STATUS_LABEL: Record<GapStatus, string> = {
  no_source: 'No source',
  licence_unverified: 'Licence not verified',
  not_separable: 'Not separable',
  blocked_review: 'Awaiting review',
}
