import assert from 'node:assert/strict'
import { faktaMilikOrgan, kunciMilikOrgan } from '../../src/domains/body-exposure/engine/faktaMilikOrgan.ts'

const organ = [
  {
    label: 'Lungs',
    keywords: [' lung', 'lung ', 'bronch'],
    definisi: 'Paired organs of gas exchange whose entire architecture exists to put air and blood within a fraction of a micrometre of each other.',
  },
  {
    label: 'Larynx',
    keywords: ['thyroid cartilage', 'larynx'],
    definisi: 'The valve at the top of the airway that protects the lungs and, secondarily, produces voice.',
  },
  {
    label: 'Thyroid',
    keywords: ['thyroid'],
    definisi: 'A butterfly-shaped gland across the front of the trachea that sets the metabolic rate of nearly every cell in the body.',
  },
]

const paru = faktaMilikOrgan(
  'Middle lobe of right lung',
  'part of the respiratory tract — it conducts air or forms a gas-exchange surface',
  organ,
)
assert.equal(paru?.startsWith('Middle lobe of right lung belongs to the Lungs:'), true)
assert.match(paru ?? '', /gas exchange/)

assert.equal(
  faktaMilikOrgan('Pulmonary vein', 'a vein — it returns blood towards the heart, at low pressure, and usually has valves', organ),
  null,
  'a vessel keeps its own class and does not inherit the lung definition',
)
assert.equal(faktaMilikOrgan('', 'part of the heart', organ), null)
assert.equal(faktaMilikOrgan('Heart', '', organ), null)
assert.equal(faktaMilikOrgan('Unknown mesh', 'an anatomical structure in the human body', organ), null)

const tulang = faktaMilikOrgan('Thyroid cartilage', 'cartilage — it bears load and lets surfaces glide', organ)
assert.equal(tulang, null, 'cartilage stays cartilage even when the name mentions an organ')

const laring = faktaMilikOrgan('Thyroid cartilage', 'an anatomical structure in the human body', organ)
assert.match(laring ?? '', /belongs to the Larynx/)
assert.doesNotMatch(laring ?? '', /butterfly-shaped/)

const calon = [
  { key: 'thyroid', keywords: ['thyroid'] },
  { key: 'larynx', keywords: ['thyroid cartilage', 'larynx'] },
  { key: 'stomach', keywords: ['stomach', 'eye'] },
]
assert.equal(
  kunciMilikOrgan('Stomach', 'an anatomical structure in the human body', calon),
  'stomach',
)
assert.equal(
  kunciMilikOrgan('Stomach', 'a vein — it returns blood towards the heart, at low pressure, and usually has valves', calon),
  null,
  'the same name is refused when the structure is a vessel',
)
assert.equal(kunciMilikOrgan('Eye', 'an anatomical structure in the human body', calon), null, 'a keyword shorter than 4 letters does not match')
assert.equal(
  kunciMilikOrgan('Thyroid cartilage', 'an anatomical structure in the human body', calon),
  'larynx',
  'the longer keyword wins',
)
assert.equal(kunciMilikOrgan('', 'an anatomical structure in the human body', calon), null)

console.log('fakta-milik-organ: organ parenchyma uses the written definition; vessels do not')
