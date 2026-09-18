import type { BodyClinicalSystemFinding } from './bodyClinicalBridge'

const BODY_SYSTEMS: readonly {
  key: string
  label: string
  x: number
  y: number
  keywords: readonly string[]
}[] = [
  { key: 'mata', label: 'Eyes', x: 60, y: 9, keywords: ['mata', 'pupil', 'konjungtiva', 'sklera', 'visus', 'vod', 'vos'] },
  { key: 'tht', label: 'ENT', x: 38, y: 10, keywords: ['telinga', 'hidung', 'tenggorok', 'faring', 'tonsil', 'mukosa', 'nasofaring'] },
  { key: 'kepala', label: 'Head', x: 50, y: 5, keywords: ['kepala', 'normosefali', 'wajah', 'facies'] },
  { key: 'leher', label: 'Neck', x: 50, y: 17, keywords: ['leher', 'kgb', 'trakea', 'tiroid', 'jvp'] },
  { key: 'paru', label: 'Lungs', x: 37, y: 32, keywords: ['paru', 'vesikuler', 'ronki', 'rhonki', 'wheezing', 'fremitus', 'sonor'] },
  { key: 'jantung', label: 'Heart', x: 61, y: 34, keywords: ['jantung', 'cardio', 'iktus', 'ictus', 's1s2', 'murmur', 'gallop'] },
  { key: 'abdomen', label: 'Abdomen', x: 50, y: 47, keywords: ['abdomen', 'bising usus', 'hepatomegali', 'splenomegali', 'nyeri tekan', 'supel'] },
  { key: 'kulit', label: 'Skin', x: 28, y: 58, keywords: ['kulit', 'spider nevi', 'eritema', 'pucat', 'sianosis'] },
  { key: 'ekstremitas', label: 'Extremities', x: 72, y: 82, keywords: ['ekstremitas', 'akral', 'crt', 'edema'] },
] as const

const ABNORMAL_HINTS = [
  '(+)',
  'menurun',
  'prolaps',
  'massa',
  'pembesaran',
  'deviasi',
  'ikterik',
  'edema (+)',
  'anemis (+)',
  'ronki (+',
  'wheezing (+',
  'murmur (+',
  'asites',
] as const

export function buildBodyClinicalFindings(perSystem: string): BodyClinicalSystemFinding[] {
  const lines = perSystem.split('\n').map((line) => line.trim()).filter(Boolean)

  return BODY_SYSTEMS.map((system) => {
    const matched = lines.filter((line) => {
      const lower = line.toLowerCase()
      return system.keywords.some((keyword) => lower.includes(keyword))
    })

    if (matched.length === 0) {
      return { key: system.key, label: system.label, x: system.x, y: system.y, status: 'unchecked' }
    }

    const note = matched.join(' ')
    const lower = note.toLowerCase()
    const abnormal = ABNORMAL_HINTS.some((hint) => lower.includes(hint))

    return {
      key: system.key,
      label: system.label,
      x: system.x,
      y: system.y,
      status: abnormal ? 'abnormal' : 'normal',
      note,
    }
  })
}
