export const ACTS = [
  { key: 'whole', label: 'Seluruh Tubuh', eyebrow: 'ATLAS ANATOMI DIGITAL', title: 'Satu Tubuh. Seluruh Sistem Terhubung.' },
  { key: 'exploded', label: 'Eksplorasi Organ', eyebrow: 'PERSPEKTIF MULTI-LAYER', title: 'Pahami Keterkaitan Organ Vital.' },
  { key: 'systems', label: 'Sistem Fisiologis', eyebrow: 'JARINGAN METABOLISME', title: 'Sistem Tubuh Bergerak Selaras.' },
  { key: 'unified', label: 'Digital Health Twin', eyebrow: 'DIGITAL BODY TWIN', title: 'Satu Representasi Kesehatan Terpadu.' },
] as const

export type Stage = (typeof ACTS)[number]['key']
