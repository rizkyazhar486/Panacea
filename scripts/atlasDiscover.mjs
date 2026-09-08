#!/usr/bin/env node
// Read only BodyParts3D atlas metadata and report exact source names that could
// deepen each Panacea organ close-up. This script does not generate geometry;
// it exists so extractor regexes are based on real atlas names, not guesses.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const source = process.argv[2]
const output = process.argv[3] ?? 'artifacts/atlas-organ-candidates.json'
if (!source) throw new Error('Usage: node scripts/atlasDiscover.mjs <human-atlas-folder> [output.json]')

const atlas = JSON.parse(readFileSync(join(source, 'public/models/atlas.json'), 'utf8'))
const names = atlas.parts.map((part) => String(part.name)).filter(Boolean)

const TARGETS = {
  heart: [/heart/i, /atrium/i, /ventricle/i, /interventricular/i, /atrioventricular/i, /papillary muscle/i, /chorda tendin/i, /cardiac valve/i, /aortic valve/i, /pulmonary valve/i, /^aorta$/i, /vena cava/i, /pulmonary trunk/i],
  lungs: [/\blung\b/i, /bronch/i, /^trachea$/i, /pulmonary/i, /pleura/i],
  liver: [/\bliver\b/i, /hepatic/i, /portal vein/i],
  kidneys: [/kidney/i, /renal/i, /nephron/i, /renal pelvis/i, /calyx/i, /ureter/i],
  'small-intestine': [/duodenum/i, /jejunum/i, /\bileum\b/i, /ileocecal/i],
  'large-intestine': [/colon/i, /cecum/i, /caecum/i, /rectum/i, /vermiform appendix/i, /anal canal/i, /colic flexure/i],
  pancreas: [/pancrea/i],
  thyroid: [/thyroid/i],
  brain: [/gyrus/i, /sulcus/i, /cerebell/i, /thalam/i, /hypothalam/i, /hippocamp/i, /amygdal/i, /corpus callosum/i, /midbrain/i, /mesenceph/i, /^pons$/i, /medulla oblongata/i, /basal gang/i],
  'spinal-cord': [/spinal cord/i, /conus medullaris/i, /cauda equina/i],
  ear: [/cochlea/i, /vestibul/i, /semicircular/i, /tympanic/i, /^malleus/i, /^incus/i, /^stapes/i, /auditory tube/i, /pharyngotympanic/i],
  'external-nose': [/nasal region/i, /nose/i, /nostril/i, /naris/i, /ala of nose/i],
  'external-ear': [/auricle/i, /auricular region/i, /antihelix/i, /antitragus/i, /\btragus\b/i, /auricular concha/i, /lobule of auricle/i],
  eardrum: [/tympanic membrane/i, /pars tensa/i, /pars flaccida/i, /chorda tympani/i, /manubrium of malleus/i],
  'inner-ear-nerve': [/cochlear nerve/i, /vestibular nerve/i, /vestibulocochlear/i, /cochlear nucleus/i, /vestibular nuclei?/i],
  breast: [/mammary/i, /nipple/i, /areola/i, /lactiferous/i],
  'lymph-nodes': [/lymph node/i],
  'peripheral-nerves': [/plexus/i, /median nerve/i, /ulnar nerve/i, /radial nerve/i, /femoral nerve/i, /sciatic nerve/i, /tibial nerve/i, /fibular nerve/i, /peroneal nerve/i],
}

const report = {
  source: 'ashemag/human-atlas / BodyParts3D 4.0 packaging',
  totalAtlasParts: names.length,
  generatedAt: new Date().toISOString(),
  targets: {},
}

for (const [key, patterns] of Object.entries(TARGETS)) {
  const matches = [...new Set(names.filter((name) => patterns.some((pattern) => pattern.test(name))))]
    .sort((a, b) => a.localeCompare(b))
  report.targets[key] = { count: matches.length, names: matches }
  console.log(`\n## ${key} (${matches.length})`)
  for (const name of matches.slice(0, 120)) console.log(name)
  if (matches.length > 120) console.log(`… ${matches.length - 120} more in JSON artifact`)
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`\nWrote ${output}`)
