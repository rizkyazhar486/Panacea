// Sintesis bukti lintas sumber: bentuk data. Murni, tanpa I/O.
// Prinsip: sintesis hanya MENGELOMPOKKAN dan MENGATRIBUSI sumber yang diberikan. Ia tidak membuat sitasi,
// tidak menyimpulkan "garis bawah", dan tidak menghitung satu skor kebenaran.
import type { Certainty } from '../../../lib/evidence'

export type { Certainty }

/** Jenis sumber. 'teaching' (ajaran/kitab/tuntunan) tidak pernah dinilai sebagai bukti klinis. */
export type SourceKind =
  | 'guideline' | 'systematic-review' | 'trial' | 'observational' | 'mechanism' | 'expert-opinion' | 'dataset' | 'teaching'

export const SOURCE_KINDS: readonly SourceKind[] = [
  'guideline', 'systematic-review', 'trial', 'observational', 'mechanism', 'expert-opinion', 'dataset', 'teaching',
]
export const CERTAINTIES: readonly Certainty[] = ['high', 'moderate', 'low', 'very-low']
export type Stance = 'supports' | 'opposes' | 'neutral'
export const STANCES: readonly Stance[] = ['supports', 'opposes', 'neutral']

export interface SourceRecord {
  id: string
  title: string
  kind: SourceKind
  /** Pengarang/penerbit/lembaga; boleh kosong hanya bila `identifier` ada. */
  publisher?: string
  /** DOI, PMID, ISBN, URL atau kode lain yang dapat ditelusuri oleh manusia. WAJIB ada. */
  identifier: string
  licence: string
  /** ISO 8601 dengan zona waktu: kapan sumber ini diambil. */
  retrievedAt: string
  /** Hanya untuk 'teaching': tradisi/mazhab, edisi atau terjemahan, agar sudut pandangnya tidak disamarkan. */
  lens?: string
  edition?: string
  /** Sumber ini diketahui diperdebatkan oleh para ahli/komunitasnya. */
  contested?: boolean
}

export interface ClaimRecord {
  id: string
  sourceId: string
  text: string
  stance: Stance
  /** Wajib untuk sumber bukti; DILARANG untuk 'teaching'. */
  certainty?: Certainty
  population?: string
}

export interface SynthesisInput {
  question: string
  sources: SourceRecord[]
  claims: ClaimRecord[]
  /** Injeksi waktu (ms epoch): tanpa Date.now() tersembunyi. */
  nowMs: number
}

export type RejectReason =
  | 'invalid-input' | 'invalid-question' | 'no-claims' | 'too-many-sources' | 'too-many-claims'
  | 'duplicate-source-id' | 'duplicate-claim-id' | 'source-incomplete' | 'source-invalid-kind' | 'source-invalid-retrieval'
  | 'source-retrieved-in-future' | 'claim-invalid' | 'claim-unknown-source' | 'evidence-claim-missing-certainty'
  | 'teaching-claim-has-certainty' | 'teaching-source-has-no-lens'

export interface Rejection { ok: false; reason: RejectReason; detail: string }

export interface AttributedClaim {
  claimId: string
  text: string
  stance: Stance
  certainty: Certainty
  population?: string
  source: SourceRecord
}

export interface AttributedTeaching {
  claimId: string
  text: string
  source: SourceRecord
}

export interface StanceGroup { claims: AttributedClaim[]; strongest: Certainty | null }

export interface Synthesis {
  ok: true
  question: string
  /** 'no-graded-evidence' bila tidak ada klaim bukti: tidak diketahui tetap tidak diketahui. */
  status: 'graded-evidence' | 'no-graded-evidence'
  supports: StanceGroup
  opposes: StanceGroup
  neutral: StanceGroup
  /** Ada klaim mendukung DAN menentang, atau ada sumber yang ditandai diperdebatkan. */
  contested: boolean
  contestedSources: string[]
  /** Jenis sumber bukti yang TIDAK ada di antara yang diberikan (celah yang harus tampak). */
  gaps: SourceKind[]
  teachings: AttributedTeaching[]
  sourceCount: number
  truthClass: 'reference'
  boundary: string
}

export type SynthesisResult = Synthesis | Rejection
