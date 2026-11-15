// Tekanan transpulmoner metode elastance-derived. Fungsi murni: tanpa waktu, jaringan, atau keadaan.
// Sumber relasi: Grieco DL, Chen L, Brochard L. Ann Transl Med 2017;5(14):285 (PMID 28828360, doi:10.21037/atm.2017.07.22):
// "P_L can also be estimated from airway pressure plateau and the ratio of lung to respiratory elastance".
// Karena elastansi paru (E_L) dan dinding dada (E_cw) tersusun seri, E_rs = E_L + E_cw dan tekanan jalan napas terbagi
// menurut rasio elastansi. Tidak ada konstanta yang dikarang: E_L dan E_cw wajib diberikan (diukur pada pasien, mis.
// dengan manometri esofagus); tanpa keduanya hasilnya tidak dihitung.
export const TRANSPULMONARY_SOURCE = {
  pmid: '28828360', doi: '10.21037/atm.2017.07.22',
  claim: 'Transpulmonary pressure can be estimated from airway plateau pressure and the ratio of lung to respiratory elastance.',
} as const

export const TRANSPULMONARY_BOUNDARY =
  'Derived from supplied elastances; it is not a measured pleural or esophageal pressure, and it assumes linear series lung and chest-wall elastances. No target, setting or recommendation.'

export interface TranspulmonaryInput {
  /** Elastansi paru, cmH2O/L (terukur). */
  lungElastanceCmH2OPerL: number
  /** Elastansi dinding dada, cmH2O/L (terukur). */
  chestWallElastanceCmH2OPerL: number
  /** Tekanan plateau akhir-inspirasi pada jalan napas, cmH2O (relatif terhadap atmosfer). */
  plateauAirwayPressureCmH2O: number
  /** PEEP total akhir-ekspirasi, cmH2O (relatif terhadap atmosfer). */
  peepCmH2O: number
}

export type TranspulmonaryResult =
  | {
      ok: true
      truthClass: 'derived'
      respiratoryElastanceCmH2OPerL: number
      lungFraction: number
      endInspiratoryTranspulmonaryCmH2O: number
      endExpiratoryTranspulmonaryCmH2O: number
      lungDrivingPressureCmH2O: number
      endInspiratoryPleuralCmH2O: number
      source: typeof TRANSPULMONARY_SOURCE
      boundary: typeof TRANSPULMONARY_BOUNDARY
    }
  | { ok: false; reason: 'invalid-input' | 'plateau-below-peep'; detail: string }

// Batas hanya untuk menolak salah ketik (mis. unit salah); bukan rentang normal atau target klinis.
const MAKS_ELASTANSI = 100
const MAKS_TEKANAN = 100

const mati = (detail: string): TranspulmonaryResult => ({ ok: false, reason: 'invalid-input', detail })
const hingga = (v: unknown, nama: string): string | null =>
  typeof v === 'number' && Number.isFinite(v) ? null : `${nama} must be a finite number`

export function transpulmonaryPressure(input: TranspulmonaryInput): TranspulmonaryResult {
  if (input === null || typeof input !== 'object') return mati('input must be an object')
  const { lungElastanceCmH2OPerL: el, chestWallElastanceCmH2OPerL: ecw, plateauAirwayPressureCmH2O: pplat, peepCmH2O: peep } = input
  for (const [v, n] of [[el, 'lungElastance'], [ecw, 'chestWallElastance'], [pplat, 'plateauAirwayPressure'], [peep, 'peep']] as const) {
    const e = hingga(v, n); if (e) return mati(e)
  }
  if (el <= 0 || el > MAKS_ELASTANSI) return mati(`lungElastance must be > 0 and <= ${MAKS_ELASTANSI} cmH2O/L`)
  if (ecw <= 0 || ecw > MAKS_ELASTANSI) return mati(`chestWallElastance must be > 0 and <= ${MAKS_ELASTANSI} cmH2O/L`)
  if (peep < 0 || peep > MAKS_TEKANAN) return mati(`peep must be >= 0 and <= ${MAKS_TEKANAN} cmH2O`)
  if (pplat < 0 || pplat > MAKS_TEKANAN) return mati(`plateauAirwayPressure must be >= 0 and <= ${MAKS_TEKANAN} cmH2O`)
  if (pplat < peep) return { ok: false, reason: 'plateau-below-peep', detail: 'plateau pressure cannot be below PEEP' }
  const ers = el + ecw
  const lungFraction = el / ers
  return {
    ok: true, truthClass: 'derived', respiratoryElastanceCmH2OPerL: ers, lungFraction,
    endInspiratoryTranspulmonaryCmH2O: pplat * lungFraction,
    endExpiratoryTranspulmonaryCmH2O: peep * lungFraction,
    lungDrivingPressureCmH2O: (pplat - peep) * lungFraction,
    endInspiratoryPleuralCmH2O: pplat * (ecw / ers),
    source: TRANSPULMONARY_SOURCE, boundary: TRANSPULMONARY_BOUNDARY,
  }
}
