export type RenalTubularTransportInputs = {
  filteredSodiumDelivery: number
  proximalTransportCapacity: number
  distalSaltTransportCapacity: number
  collectingDuctWaterPermeability: number
}

export const RENAL_TUBULAR_TRANSPORT_DEFAULTS: RenalTubularTransportInputs = {
  filteredSodiumDelivery: 0.62,
  proximalTransportCapacity: 0.68,
  distalSaltTransportCapacity: 0.55,
  collectingDuctWaterPermeability: 0.48,
}

export const RENAL_TUBULAR_TRANSPORT_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '23908456',
    citation: 'Curthoys NP, Moe OW. Clin J Am Soc Nephrol. 2014;9(9):1627-1638.',
    supports: 'Proximal tubular bulk sodium, water, bicarbonate and nutrient reabsorption and the role of basolateral Na+/K+-ATPase.',
    reviewState: 'Published peer-reviewed review; not Panaceamed clinical validation or human review.',
  },
  {
    source: 'PubMed',
    pmid: '25589264',
    citation: 'McCormick JA, Ellison DH. Compr Physiol. 2015;5(1):45-98.',
    supports: 'Distal convoluted tubule sodium-chloride transport, relative water impermeability and hormonal regulation.',
    reviewState: 'Published peer-reviewed review; not Panaceamed clinical validation or human review.',
  },
  {
    source: 'PubMed',
    pmid: '32152499',
    citation: 'Vallon V, Thomson SC. Nat Rev Nephrol. 2020;16(6):317-336.',
    supports: 'Tubuloglomerular coupling between proximal sodium/glucose reabsorption, macula-densa delivery and filtration behavior.',
    reviewState: 'Published peer-reviewed review; not Panaceamed clinical validation or human review.',
  },
] as const

export const RENAL_TUBULAR_TRANSPORT_BOUNDARY =
  'Educational nephron transport model using synthetic dimensionless signals. It does not calculate electrolyte excretion, serum sodium, osmolality, eGFR, drug response, diuretic dose, acid-base status, dialysis settings, diagnosis, prognosis, or patient-specific renal function. Segment outputs are conceptual relationships rather than validated quantitative physiology.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeRenalTubularTransportInputs(input: Partial<RenalTubularTransportInputs>): RenalTubularTransportInputs {
  return {
    filteredSodiumDelivery: clamp01(input.filteredSodiumDelivery ?? RENAL_TUBULAR_TRANSPORT_DEFAULTS.filteredSodiumDelivery),
    proximalTransportCapacity: clamp01(input.proximalTransportCapacity ?? RENAL_TUBULAR_TRANSPORT_DEFAULTS.proximalTransportCapacity),
    distalSaltTransportCapacity: clamp01(input.distalSaltTransportCapacity ?? RENAL_TUBULAR_TRANSPORT_DEFAULTS.distalSaltTransportCapacity),
    collectingDuctWaterPermeability: clamp01(input.collectingDuctWaterPermeability ?? RENAL_TUBULAR_TRANSPORT_DEFAULTS.collectingDuctWaterPermeability),
  }
}

export type RenalTubularTransportSignals = {
  proximalReabsorptionSignal: number
  distalDeliverySignal: number
  distalReabsorptionSignal: number
  collectingDuctDeliverySignal: number
  relativeWaterRetentionSignal: number
}

export function deriveRenalTubularTransport(raw: RenalTubularTransportInputs): RenalTubularTransportSignals {
  const input = normalizeRenalTubularTransportInputs(raw)
  const proximalReabsorptionSignal = clamp01(input.filteredSodiumDelivery * input.proximalTransportCapacity)
  const distalDeliverySignal = clamp01(input.filteredSodiumDelivery - proximalReabsorptionSignal)
  const distalReabsorptionSignal = clamp01(distalDeliverySignal * input.distalSaltTransportCapacity)
  const collectingDuctDeliverySignal = clamp01(distalDeliverySignal - distalReabsorptionSignal)
  const relativeWaterRetentionSignal = clamp01(collectingDuctDeliverySignal * input.collectingDuctWaterPermeability)
  return { proximalReabsorptionSignal, distalDeliverySignal, distalReabsorptionSignal, collectingDuctDeliverySignal, relativeWaterRetentionSignal }
}
