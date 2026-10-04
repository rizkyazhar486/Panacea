/**
 * Kontrak kelayakan personalisasi parameter model fisiologi (Reality Engine §3: "tidak boleh mempersonalisasi parameter
 * yang tidak teridentifikasi hanya karena optimizer bisa menghasilkan angka").
 *
 * Kontrak ini hanya STRUKTUR. Tidak ada deklarasi parameter fisiologis nyata di sini: ambang jumlah observasi, batas
 * langkah dan sumber makna parameter adalah data kurasi milik domain yang mendeklarasikan parameter itu, bukan konstanta
 * yang dikarang gerbang ini. Tanpa deklarasi, tidak ada parameter yang boleh dipersonalisasi.
 */

/** Deklarasi kurasi untuk satu parameter model; disuplai oleh domain, versinya dipatok. */
export interface ParameterDeclaration {
  readonly parameterId: string
  readonly version: string
  /** Sumber yang mendukung makna parameter. Kosong = makna belum didukung bukti. */
  readonly meaningSourceIds: readonly string[]
  /** Jenis observasi yang membuat parameter ini teridentifikasi. Kosong = tidak teridentifikasi dari apa pun. */
  readonly identifiableFrom: readonly string[]
  /** Jumlah observasi berbeda minimum (bilangan bulat positif), dari deklarasi. */
  readonly minObservations: number
  /** Langkah relatif maksimum |diusulkan − populasi| / |populasi| (positif, hingga), dari deklarasi. */
  readonly maxRelativeStep: number
  readonly requiresHeldOutValidation: boolean
}

export interface PersonalizationObservation {
  /** Identitas observasi, supaya satu pengamatan yang dihitung dua kali tidak menambah jumlah. */
  readonly id: string
  readonly kind: string
}

export interface PersonalizationProposal {
  readonly parameterId: string
  readonly populationValue: number
  readonly proposedValue: number
  /** Interval ketidakpastian estimasi; null = tidak terkuantifikasi. */
  readonly uncertainty: { readonly lower: number; readonly upper: number } | null
  readonly provenanceId: string | null
  /** Versi sebelumnya yang dapat dikembalikan (rollback); null = tidak ada jalan kembali. */
  readonly priorVersionId: string | null
  readonly observations: readonly PersonalizationObservation[]
  readonly heldOutValidation: { readonly performed: boolean; readonly passed: boolean } | null
}

export type PersonalizationBlockerCode =
  | 'declaration-invalid'
  | 'proposal-invalid'
  | 'parameter-mismatch'
  | 'meaning-unsupported'
  | 'not-identifiable'
  | 'insufficient-observations'
  | 'uncertainty-missing'
  | 'uncertainty-inconsistent'
  | 'provenance-missing'
  | 'update-unbounded'
  | 'rollback-unavailable'
  | 'held-out-validation-missing'
  | 'held-out-validation-failed'

export interface PersonalizationBlocker {
  readonly code: PersonalizationBlockerCode
  readonly detail: string
}

export type PersonalizationDecision =
  | {
      readonly eligible: true
      readonly personalValue: number
      // Estimasi laten turunan model: bukan nilai terukur dan bukan catatan klinis.
      readonly truthClass: 'estimated-latent'
      readonly parameterId: string
      readonly declarationVersion: string
    }
  | {
      readonly eligible: false
      // Nilai usulan sengaja tidak dikembalikan: konsumen tidak boleh memakainya.
      readonly personalValue: null
      readonly use: 'population-reference'
      readonly blockers: readonly PersonalizationBlocker[]
    }
