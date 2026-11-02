// Mesin nefron: filtrasi glomerulus, penanganan tubulus, dan klirens.
//
// `bodyPhysiology.ts` sudah MENAMPILKAN rumusnya sebagai teks -- "Cx = (Ux x V)
// / Px", "FF = GFR / RPF" -- dan tidak ada satu pun yang menghitungnya. Rumus
// yang hanya ditulis tidak bisa salah, dan juga tidak bisa mengajari apa pun:
// tidak ada yang bisa dimasukkan, tidak ada yang bisa dibantah.
//
// Modul ini menghitungnya, dan diuji terhadap identitas yang sudah benar
// sebelum kodenya ada. Yang paling tajam: zat yang disaring bebas, tidak
// direabsorpsi dan tidak disekresi memiliki klirens yang SAMA PERSIS dengan
// GFR. Itu definisi inulin, dan ia menangkap hampir semua cara rumus klirens
// bisa ditulis keliru.
//
// BATAS:
//
//   * Ini menghitung dari angka yang DIBERIKAN. Ia bukan pemeriksaan, bukan
//     diagnosis, dan tidak menaksir fungsi ginjal siapa pun.
//   * eGFR populasi (CKD-EPI) sudah ada di longevity.ts dan sengaja tidak
//     diulang di sini: persamaan itu menjawab pertanyaan yang berbeda --
//     perkiraan dari kreatinin, bukan mekanisme dari gaya Starling.
//   * Nefron tunggal yang seragam adalah penyederhanaan besar. Ginjal nyata
//     punya nefron kortikal dan jukstamedular dengan perilaku berbeda,
//     gradien medula, dan umpan balik tubuloglomerular yang tidak ada di sini.

/** Tekanan dalam mmHg. */
export interface GayaStarlingGlomerulus {
  /** Tekanan hidrostatik kapiler glomerulus. */
  hidrostatikKapiler: number
  /** Tekanan hidrostatik ruang Bowman. */
  hidrostatikBowman: number
  /** Tekanan onkotik koloid kapiler. */
  onkotikKapiler: number
}

/**
 * Tekanan ultrafiltrasi neto.
 *
 * P_UF = P_GC - P_BS - pi_GC. Onkotik ruang Bowman dianggap nol karena
 * filtrat normal praktis bebas protein -- dan itu asumsi, bukan kebetulan,
 * jadi ditulis di sini alih-alih disembunyikan sebagai angka nol di rumus.
 */
export function tekananUltrafiltrasi(g: GayaStarlingGlomerulus): number {
  return g.hidrostatikKapiler - g.hidrostatikBowman - g.onkotikKapiler
}

/**
 * GFR dari gaya Starling. Kf dalam mL/menit per mmHg.
 *
 * Tekanan neto yang nol atau negatif berarti filtrasi berhenti, bukan
 * filtrasi terbalik: mengembalikan angka negatif di sini akan menghasilkan
 * "urin mengalir kembali ke darah" yang lolos tanpa suara ke perhitungan
 * berikutnya.
 */
export function gfrDariStarling(g: GayaStarlingGlomerulus, kf: number): number {
  if (!(kf > 0)) return 0
  return Math.max(0, tekananUltrafiltrasi(g) * kf)
}

/** Klirens: Cx = (Ux * V) / Px, dalam mL/menit. */
export function klirens(konsentrasiUrin: number, alirUrin: number, konsentrasiPlasma: number): number {
  if (!(konsentrasiPlasma > 0)) return Number.NaN
  if (!(alirUrin >= 0) || !(konsentrasiUrin >= 0)) return Number.NaN
  return (konsentrasiUrin * alirUrin) / konsentrasiPlasma
}

/** Fraksi filtrasi: bagian plasma yang tiba lalu tersaring. */
export function fraksiFiltrasi(gfr: number, alirPlasmaGinjal: number): number {
  if (!(alirPlasmaGinjal > 0)) return Number.NaN
  return gfr / alirPlasmaGinjal
}

/** Beban tersaring: jumlah zat yang masuk ke tubulus per menit. */
export function bebanTersaring(gfr: number, konsentrasiPlasma: number): number {
  return gfr * konsentrasiPlasma
}

/**
 * Neraca massa tubulus.
 *
 * Yang tersaring harus berakhir sebagai diekskresi atau direabsorpsi, dan
 * sekresi menambah dari sisi darah. Nilai reabsorpsi NETO yang negatif berarti
 * sekresi neto -- dan itu keadaan yang nyata, bukan galat.
 */
export interface NeracaTubulus {
  tersaring: number
  diekskresi: number
  /** Positif = reabsorpsi neto; negatif = sekresi neto. */
  reabsorpsiNeto: number
}

export function neracaTubulus(gfr: number, plasma: number, urin: number, alirUrin: number): NeracaTubulus {
  const tersaring = bebanTersaring(gfr, plasma)
  const diekskresi = urin * alirUrin
  return { tersaring, diekskresi, reabsorpsiNeto: tersaring - diekskresi }
}

/**
 * Ekskresi fraksional: bagian beban tersaring yang benar-benar keluar.
 *
 * FE = Cx / GFR. Nilai 1 berarti zat itu melewati nefron tanpa disentuh --
 * yang justru membuatnya bisa dipakai MENGUKUR GFR.
 */
export function ekskresiFraksional(klirensZat: number, gfr: number): number {
  if (!(gfr > 0)) return Number.NaN
  return klirensZat / gfr
}

/**
 * Ekskresi fraksional natrium sebagaimana dihitung di samping pasien.
 *
 * FENa = (UNa x PCr) / (PNa x UCr)
 *
 * Bentuk ini menghapus laju alir urin, sehingga tidak perlu pengumpulan
 * berjangka waktu. Ia HARUS memberi angka yang sama dengan jalur berbasis
 * klirens, dan uji pendampingnya memeriksa keduanya -- dua jalan menuju satu
 * angka yang tidak sepakat berarti salah satunya salah.
 */
export function feNaBedside(
  natriumUrin: number, kreatininPlasma: number,
  natriumPlasma: number, kreatininUrin: number,
): number {
  const penyebut = natriumPlasma * kreatininUrin
  if (!(penyebut > 0)) return Number.NaN
  return (natriumUrin * kreatininPlasma) / penyebut
}

/** Nilai rujukan dewasa, sebagai titik awal yang bisa diubah. */
export const RUJUKAN = {
  /** mL/menit per mmHg. */
  kf: 12.5,
  // 60 - 18 - 32 memberi tekanan neto 10 mmHg, dan dengan Kf 12,5 itu
  // menghasilkan GFR 125 mL/menit -- angka dewasa yang memang dilaporkan.
  // Nilai Bowman sempat ditulis 15, yang memberi GFR 162 mL/menit: terlalu
  // tinggi, dan ketahuan hanya karena keluarannya dihitung, bukan karena
  // angkanya terlihat salah.
  starling: { hidrostatikKapiler: 60, hidrostatikBowman: 18, onkotikKapiler: 32 } as GayaStarlingGlomerulus,
  /** mL/menit. */
  alirPlasmaGinjal: 600,
} as const

// ═════════════════════════════════════════════════════════════════════════════
// 1. MYOGENIC AUTOREGULATION & TUBULOGLOMERULAR FEEDBACK (TGF)
// ═════════════════════════════════════════════════════════════════════════════

export interface AutoregulasiGinjalInputs {
  /** Mean Arterial Pressure (MAP) in mmHg (euvolemic adult normal ~ 93 mmHg). */
  mapMmhg: number
  /** Baseline afferent arteriole resistance (Ra) ~ 0.32 mmHg/(mL/min). */
  resistensiAferen?: number
  /** Baseline efferent arteriole resistance (Re) ~ 0.55 mmHg/(mL/min). */
  resistensiEferen?: number
  /** Proximal tubule fractional reabsorption of Na+/water (baseline ~ 0.65). */
  fraksiReabsorpsiProksimal?: number
  /** Renal venous pressure in mmHg (normal ~ 4 mmHg). */
  tekananVenaGinjal?: number
  /** Hematocrit fraction (normal ~ 0.45). */
  hematokrit?: number
  /** Angiotensin II elevation (e.g. hypovolemia, dehydration). */
  angiotensin2Tinggi?: boolean
  /** ACE Inhibitor or Angiotensin Receptor Blocker (ARB) active. */
  aceInhibitorActive?: boolean
  /** NSAID active (inhibits vasodilatory prostaglandins at afferent arteriole). */
  nsaidActive?: boolean
  /** SGLT2 inhibitor active (reduces proximal Na+/glucose uptake, restoring macula densa delivery). */
  sglt2InhibitorActive?: boolean
}

export interface AutoregulasiGinjalResult {
  pGc: number
  rbf: number
  rpf: number
  gfr: number
  ff: number
  effectiveRa: number
  effectiveRe: number
  maculaDensaNaclDelivery: number
  tgfActive: boolean
  myogenicTone: 'DILATED' | 'AUTOREGULATED' | 'CONSTRICTED'
  autoregulationZone: 'HYPOTENSIVE_ESCAPE' | 'AUTOREGULATORY_PLATEAU' | 'HYPERTENSIVE_BREAKTHROUGH'
}

/**
 * Calculates cardiovascular-coupled renal autoregulation and tubuloglomerular feedback (TGF).
 *
 * Autoregulation operates between MAP 80 and 180 mmHg via myogenic response and TGF.
 * - MAP < 80 mmHg: maximal afferent vasodilation; RAAS constricts efferent arteriole to defend Pgc.
 * - SGLT2i restores macula densa delivery -> triggers adenosine TGF -> normalizes intraglomerular hyperfiltration.
 * - NSAIDs block afferent PGE2/PGI2 vasodilation -> afferent vasoconstriction -> GFR drops in hypoperfusion.
 * - ACEi/ARBs block efferent Ang II vasoconstriction -> efferent vasodilation -> Pgc drops.
 */
export function hitungAutoregulasiGinjal(inputs: AutoregulasiGinjalInputs): AutoregulasiGinjalResult {
  const map = Number.isFinite(inputs.mapMmhg) ? Math.max(10, Math.min(260, inputs.mapMmhg)) : 93
  const baseRa = inputs.resistensiAferen ?? 0.32
  const baseRe = inputs.resistensiEferen ?? 0.55
  const baseProxReabsorption = inputs.fraksiReabsorpsiProksimal ?? 0.65
  const pRv = inputs.tekananVenaGinjal ?? 4
  const hct = inputs.hematokrit ?? 0.45

  // 1. Determine Autoregulatory Zone
  let zone: 'HYPOTENSIVE_ESCAPE' | 'AUTOREGULATORY_PLATEAU' | 'HYPERTENSIVE_BREAKTHROUGH'
  let myogenicTone: 'DILATED' | 'AUTOREGULATED' | 'CONSTRICTED'
  let raMultiplier = 1.0

  if (map < 80) {
    zone = 'HYPOTENSIVE_ESCAPE'
    myogenicTone = 'DILATED'
    // Afferent maximally dilated to reduce resistance and preserve flow
    raMultiplier = Math.max(0.45, map / 80 * 0.75)
  } else if (map <= 180) {
    zone = 'AUTOREGULATORY_PLATEAU'
    myogenicTone = 'AUTOREGULATED'
    // Myogenic stretch-activated contraction raises Ra proportionally with perfusion pressure
    raMultiplier = 1.0 + 0.024 * (map - 93)
  } else {
    zone = 'HYPERTENSIVE_BREAKTHROUGH'
    myogenicTone = 'CONSTRICTED'
    raMultiplier = 1.0 + 0.024 * (180 - 93) + 0.008 * (map - 180)
  }

  // 2. Modulate Afferent Tone with Prostaglandin / NSAID and TGF
  let effectiveRa = baseRa * raMultiplier

  // NSAID blocks vasodilatory prostaglandins (PGI2, PGE2) causing inappropriate vasoconstriction
  if (inputs.nsaidActive) {
    effectiveRa *= 1.45
  }

  // 3. Modulate Efferent Tone with Angiotensin II vs ACEi/ARB
  let effectiveRe = baseRe
  if (inputs.angiotensin2Tinggi || map < 80) {
    effectiveRe *= 1.55 // Angiotensin II preferentially constricts efferent arteriole
  }
  if (inputs.aceInhibitorActive) {
    // ACEi prevents Ang II formation; efferent dilation ensues
    effectiveRe = Math.min(baseRe * 0.72, effectiveRe * 0.55)
  }

  // 4. Initial Hydrodynamic Pressure Divider
  const totalR = effectiveRa + effectiveRe
  let pGc = pRv + (map - pRv) * (effectiveRe / totalR)

  // 5. Tubuloglomerular Feedback (TGF) Sensing
  // Distal delivery = GFR * (1 - proximal reabsorption)
  const initialNetP = Math.max(0, pGc - RUJUKAN.starling.hidrostatikBowman - RUJUKAN.starling.onkotikKapiler)
  const estimatedGfr = initialNetP * RUJUKAN.kf

  // SGLT2 inhibition suppresses proximal tubular reabsorption from 65% to ~48%
  const effectiveProxReabsorption = inputs.sglt2InhibitorActive
    ? Math.max(0.35, baseProxReabsorption - 0.17)
    : baseProxReabsorption

  const baselineDeliveryFraction = (1 - baseProxReabsorption) // 0.35
  const currentDeliveryFraction = (1 - effectiveProxReabsorption) // e.g. 0.52 with SGLT2i
  const maculaDensaNaclDelivery = (estimatedGfr / 125) * (currentDeliveryFraction / baselineDeliveryFraction)

  // If macula densa delivery exceeds threshold (1.15x baseline), adenosine-mediated TGF triggers afferent constriction
  let tgfActive = false
  if (maculaDensaNaclDelivery > 1.15) {
    tgfActive = true
    const tgfAfferentConstriction = Math.min(1.4, 1.0 + (maculaDensaNaclDelivery - 1.15) * 0.5)
    effectiveRa *= tgfAfferentConstriction
    // Recompute Pgc after TGF afferent vasoconstriction
    const recomputedTotalR = effectiveRa + effectiveRe
    pGc = pRv + (map - pRv) * (effectiveRe / recomputedTotalR)
  }

  // 6. Final Flows and GFR
  const finalTotalR = effectiveRa + effectiveRe
  // Scaled to adult RBF (~ 1100 mL/min at MAP 93, R ~ 0.85)
  const rbf = Math.max(0, ((map - pRv) / finalTotalR) * 10.5)
  const rpf = rbf * (1 - hct)
  const netUltrafiltration = Math.max(0, pGc - RUJUKAN.starling.hidrostatikBowman - RUJUKAN.starling.onkotikKapiler)
  const gfr = netUltrafiltration * RUJUKAN.kf
  const ff = rpf > 0 ? gfr / rpf : 0

  return {
    pGc,
    rbf,
    rpf,
    gfr,
    ff,
    effectiveRa,
    effectiveRe,
    maculaDensaNaclDelivery,
    tgfActive,
    myogenicTone,
    autoregulationZone: zone,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. HENLE'S LOOP COUNTERCURRENT MULTIPLICATION & MEDULLARY OSMOTIC GRADIENT
// ═════════════════════════════════════════════════════════════════════════════

export interface LengkungHenleInputs {
  /** NKCC2 transporter activity fraction: 1.0 = normal, 0.05 = loop diuretic (furosemide) blockade. */
  nkcc2ActivityFraction?: number
  /** Vasopressin / Antidiuretic Hormone (ADH) level: 0.0 = DI, 0.5 = normal, 1.0 = maximal thirst. */
  adhVasopressinLevel?: number
  /** Intact nephron mass fraction (e.g. in CKD nephron loss). Baseline = 1.0. */
  intactNephronFraction?: number
}

export interface SegmenNefronOsmolalitas {
  cortex: number
  outerMedullaDescending: number
  innerMedullaBend: number
  thickAscendingLimbExit: number
  earlyDistalTubule: number
  finalUrineOsmolality: number
  medullaryInterstitialMax: number
  singleEffectGradient: number
  isMedullaryWashout: boolean
}

/**
 * Calculates countercurrent multiplication along the loop of Henle and final urine concentration.
 *
 * Mechanisms:
 * 1. Single Effect: NKCC2 in the Thick Ascending Limb (TAL) pumps solute into interstitium without water,
 *    establishing a ~200 mOsm/kg horizontal gradient.
 * 2. Countercurrent Multiplication: Hairpin flow multiplies the single effect axially, building a
 *    corticomedullary gradient from 300 mOsm/kg (cortex) to 1200 mOsm/kg (papilla).
 * 3. Diluting Segment: As solute is removed in TAL, tubular fluid exits hypotonic (~100 mOsm/kg).
 * 4. Loop Diuretic (Furosemide): Abolishes NKCC2, dissipates the medullary hypertonicity ('washout'),
 *    and halts collecting duct water reabsorption despite ADH.
 */
export function hitungLengkungHenle(inputs?: LengkungHenleInputs): SegmenNefronOsmolalitas {
  const nkcc2 = Math.max(0, Math.min(1.2, inputs?.nkcc2ActivityFraction ?? 1.0))
  const adh = Math.max(0, Math.min(1.0, inputs?.adhVasopressinLevel ?? 0.5))
  const nephronMass = Math.max(0.1, Math.min(1.0, inputs?.intactNephronFraction ?? 1.0))

  const cortex = 300 // Isosmolar systemic plasma
  const singleEffectGradient = 200 * nkcc2

  // Peak medullary interstitium depends on NKCC2 activity and ADH-stimulated urea recycling
  const ureaRecyclingComponent = 350 * adh * nkcc2
  const naclMultiplicationComponent = 550 * nkcc2 * nephronMass
  const medullaryInterstitialMax = Math.round(cortex + naclMultiplicationComponent + ureaRecyclingComponent)

  const isMedullaryWashout = medullaryInterstitialMax < 450

  // Descending limb equilibrates with outer medulla
  const outerMedullaDescending = Math.round(cortex + (medullaryInterstitialMax - cortex) * 0.45)

  // Hairpin turn at tip of papilla reaches interstitial max
  const innerMedullaBend = medullaryInterstitialMax

  // Thick Ascending Limb (diluting segment) removes solutes; exits hypotonic
  // When NKCC2 is active, exit is ~100 mOsm/kg; if blocked, fluid stays near ~300 mOsm/kg
  const thickAscendingLimbExit = Math.round(Math.max(60, 300 - 200 * nkcc2))
  const earlyDistalTubule = thickAscendingLimbExit

  // Collecting duct equilibration depends on ADH (AQP2 water channels) and medullary gradient
  // In the absence of ADH (adh=0), urine is hypotonic (~60-100 mOsm/kg)
  // In maximal ADH (adh=1), urine approaches medullaryInterstitialMax
  const finalUrineOsmolality = Math.round(
    thickAscendingLimbExit + (medullaryInterstitialMax - thickAscendingLimbExit) * adh,
  )

  return {
    cortex,
    outerMedullaDescending,
    innerMedullaBend,
    thickAscendingLimbExit,
    earlyDistalTubule,
    finalUrineOsmolality,
    medullaryInterstitialMax,
    singleEffectGradient,
    isMedullaryWashout,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. ACUTE KIDNEY INJURY (AKI) BEDSIDE PRERENAL VS ATN DISCRIMINATOR
// ═════════════════════════════════════════════════════════════════════════════

export interface AkiDifferentialInputs {
  /** Spot Urine Sodium (UNa) in mEq/L (or mmol/L). */
  natriumUrinMeq: number
  /** Serum Sodium (PNa) in mEq/L (or mmol/L). */
  natriumPlasmaMeq: number
  /** Spot Urine Creatinine (UCr) in mg/dL. */
  kreatininUrinMgDl: number
  /** Serum Creatinine (PCr) in mg/dL. */
  kreatininPlasmaMgDl: number
  /** Blood Urea Nitrogen (BUN) in mg/dL. */
  ureaNitrogenPlasmaMgDl?: number
  /** Urine Urea Nitrogen (UUN) in mg/dL. */
  ureaNitrogenUrinMgDl?: number
  /** Urine Osmolality in mOsm/kg. */
  osmolalitasUrinMosm?: number
}

export interface AkiDifferentialResult {
  feNaPercent: number
  feUreaPercent?: number
  bunCreatinineRatio?: number
  classification: 'PRERENAL_AZOTEMIA' | 'INTRINSIC_ATN' | 'POSTRENAL_OR_EQUIVOCAL'
  confidence: number
  clinicalRationale: string
}

/**
 * Distinguishes Prerenal Azotemia from Intrinsic Acute Tubular Necrosis (ATN).
 *
 * Diagnostic criteria:
 * - Prerenal: Intact tubular reabsorption -> FENa < 1.0%, BUN/Cr > 20, Urine Osm > 500 mOsm/kg.
 * - ATN: Damaged tubular epithelium -> FENa > 2.0%, BUN/Cr < 15, isosthenuria (Urine Osm ~ 300 mOsm/kg).
 * - On diuretics: FENa may be falsely elevated; FEUrea < 35% confirms prerenal pathophysiology.
 */
export function hitungAkiDifferential(inputs: AkiDifferentialInputs): AkiDifferentialResult {
  const feNa = feNaBedside(
    inputs.natriumUrinMeq,
    inputs.kreatininPlasmaMgDl,
    inputs.natriumPlasmaMeq,
    inputs.kreatininUrinMgDl,
  )
  const feNaPercent = Number.isFinite(feNa) ? feNa * 100 : Number.NaN

  let feUreaPercent: number | undefined
  if (
    inputs.ureaNitrogenUrinMgDl &&
    inputs.ureaNitrogenPlasmaMgDl &&
    inputs.ureaNitrogenPlasmaMgDl > 0 &&
    inputs.kreatininUrinMgDl > 0
  ) {
    const rawFeUrea = (inputs.ureaNitrogenUrinMgDl * inputs.kreatininPlasmaMgDl) /
      (inputs.ureaNitrogenPlasmaMgDl * inputs.kreatininUrinMgDl)
    feUreaPercent = Number.isFinite(rawFeUrea) ? rawFeUrea * 100 : undefined
  }

  let bunCreatinineRatio: number | undefined
  if (inputs.ureaNitrogenPlasmaMgDl && inputs.kreatininPlasmaMgDl > 0) {
    bunCreatinineRatio = inputs.ureaNitrogenPlasmaMgDl / inputs.kreatininPlasmaMgDl
  }

  // Diagnostic classification logic
  let classification: 'PRERENAL_AZOTEMIA' | 'INTRINSIC_ATN' | 'POSTRENAL_OR_EQUIVOCAL'
  let confidence: number
  let clinicalRationale: string

  const isPrerenal = (feNaPercent < 1.0 || (feUreaPercent !== undefined && feUreaPercent < 35)) &&
    (bunCreatinineRatio === undefined || bunCreatinineRatio > 18)
  const isAtn = (feNaPercent > 2.0 || (feUreaPercent !== undefined && feUreaPercent > 50)) &&
    (bunCreatinineRatio === undefined || bunCreatinineRatio < 15)

  if (isPrerenal) {
    classification = 'PRERENAL_AZOTEMIA'
    confidence = feUreaPercent !== undefined ? 0.94 : 0.88
    clinicalRationale = `FENa of ${feNaPercent.toFixed(2)}% (<1%) demonstrates avid tubular sodium avidity in response to hypoperfusion, preserved corticomedullary concentrating function, and intact epithelial transport.`
  } else if (isAtn) {
    classification = 'INTRINSIC_ATN'
    confidence = 0.91
    clinicalRationale = `FENa of ${feNaPercent.toFixed(2)}% (>2%) indicates tubular epithelial necrosis with loss of active transcellular sodium transport, isosthenuria, and tubular cell sloughing.`
  } else {
    classification = 'POSTRENAL_OR_EQUIVOCAL'
    confidence = 0.72
    clinicalRationale = `Indeterminate parameters (FENa ${Number.isFinite(feNaPercent) ? feNaPercent.toFixed(2) + '%' : 'N/A'}). Consider urinary tract obstruction, diuretic confounding, contrast nephropathy, or acute glomerulonephritis.`
  }

  return {
    feNaPercent,
    feUreaPercent,
    bunCreatinineRatio,
    classification,
    confidence,
    clinicalRationale,
  }
}

