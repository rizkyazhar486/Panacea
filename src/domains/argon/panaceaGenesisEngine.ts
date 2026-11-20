// API lama dipertahankan tanpa mengarang genom, energi ikatan, atau laju replikasi.
export interface GenomePair { position: number; nucleotideA: string; nucleotideB: string; bondStrength: number | null }
export interface GenesisReport {
  engineMode: 'UNAVAILABLE'
  clinicalAuthority: false
  clinicallyReviewed: false
  syntheticGenome: readonly GenomePair[] | null
  transcendenceIndex: number | null
  strainCode: string | null
  cytopathicEffect: string | null
  replicationRate: number | null
}

export function getGenesisEngineStatus() {
  return { engineMode: 'UNAVAILABLE' as const, clinicalAuthority: false as const, clinicallyReviewed: false as const }
}

export function synthesizeNewDNACode(seed: number, mutation: number): GenesisReport {
  // Batas ini mengikuti kontrol permintaan UI; bukan batas biologis.
  if (!Number.isSafeInteger(seed) || seed < 0 || typeof mutation !== 'number' || !Number.isFinite(mutation) || mutation < 0 || mutation > 2) {
    throw new TypeError('INVALID_GENESIS_REQUEST')
  }
  return { ...getGenesisEngineStatus(), syntheticGenome: null, transcendenceIndex: null, strainCode: null, cytopathicEffect: null, replicationRate: null }
}
