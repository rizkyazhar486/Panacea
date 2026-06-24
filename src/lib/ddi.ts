// Lightweight drug–drug interaction (DDI) checker. Demo knowledge base — a real
// deployment would back this with a curated DB (DrugBank/Micromedex).

export interface Interaction {
  a: string[] // keyword synonyms for drug A
  b: string[] // keyword synonyms for drug B
  severity: 'mayor' | 'moderat' | 'minor'
  effect: string
}

const TABLE: Interaction[] = [
  { a: ['warfarin'], b: ['aspirin', 'asetosal', 'nsaid', 'ibuprofen', 'ketorolac', 'natrium diklofenak'], severity: 'mayor', effect: 'Risiko perdarahan meningkat.' },
  { a: ['warfarin'], b: ['ciprofloxacin', 'metronidazole', 'flukonazol'], severity: 'mayor', effect: 'Peningkatan INR — risiko perdarahan.' },
  { a: ['ace', 'lisinopril', 'ramipril', 'captopril', 'arb', 'valsartan', 'candesartan', 'losartan'], b: ['spironolakton', 'spironolactone', 'kalium', 'potassium', 'amilorid'], severity: 'mayor', effect: 'Hiperkalemia.' },
  { a: ['digoksin', 'digoxin'], b: ['furosemide', 'furosemid', 'hidroklorotiazid', 'hct', 'thiazide'], severity: 'moderat', effect: 'Hipokalemia → toksisitas digoksin.' },
  { a: ['simvastatin', 'atorvastatin', 'statin'], b: ['klaritromisin', 'clarithromycin', 'eritromisin', 'erythromycin', 'gemfibrozil'], severity: 'mayor', effect: 'Risiko miopati/rhabdomiolisis.' },
  { a: ['metformin'], b: ['kontras', 'contrast', 'media kontras'], severity: 'moderat', effect: 'Risiko asidosis laktat — tahan sekitar prosedur kontras.' },
  { a: ['clopidogrel', 'klopidogrel'], b: ['omeprazole', 'omeprazol', 'esomeprazole'], severity: 'moderat', effect: 'Efek antiplatelet clopidogrel berkurang.' },
  { a: ['ssri', 'sertraline', 'fluoxetine', 'fluoxetin'], b: ['tramadol', 'triptan', 'mao'], severity: 'mayor', effect: 'Risiko sindrom serotonin.' },
  { a: ['ssri', 'sertraline', 'fluoxetine'], b: ['nsaid', 'aspirin', 'ibuprofen', 'warfarin'], severity: 'moderat', effect: 'Risiko perdarahan GI.' },
  { a: ['insulin'], b: ['propranolol', 'beta-bloker', 'beta blocker'], severity: 'moderat', effect: 'Beta-bloker menutupi gejala hipoglikemia.' },
]

export interface DDIHit {
  drugs: [string, string]
  severity: Interaction['severity']
  effect: string
}

function found(keys: string[], texts: string[]): string | null {
  for (const t of texts) {
    const low = t.toLowerCase()
    for (const k of keys) if (low.includes(k)) return k
  }
  return null
}

export function checkInteractions(texts: string[]): DDIHit[] {
  const hits: DDIHit[] = []
  for (const ix of TABLE) {
    const da = found(ix.a, texts)
    const db = found(ix.b, texts)
    if (da && db) hits.push({ drugs: [da, db], severity: ix.severity, effect: ix.effect })
  }
  return hits
}
