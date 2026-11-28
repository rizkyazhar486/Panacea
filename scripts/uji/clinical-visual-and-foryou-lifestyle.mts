import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// 1. All 9 real Z-Anatomy clinical specialty organ cards present & wired to canonical Body systems
const clinicalDeck = readFileSync('src/components/clinical/ClinicalVisualAtlasDeck.tsx', 'utf8')
for (const organId of ['heart', 'brain', 'lungs', 'kidneys', 'liver', 'intestine', 'pancreas', 'eyeball', 'skin']) {
  assert.ok(clinicalDeck.includes(`id: '${organId}'`), `missing clinical visual organ card: ${organId}`)
}
assert.match(clinicalDeck, /dark space-y-3/)
assert.match(clinicalDeck, /\/body-explorer\?system=/)
assert.match(clinicalDeck, /returnTo=\/clinical-hub/)
assert.match(clinicalDeck, /'organ', 'location', 'microscopic', 'compare'/)

// 2. ClinicalHub mounts Visual Atlas lazily via WhenOpened without violating clinical-simplicity-contract
const clinicalHub = readFileSync('src/pages/clinical/ClinicalHub.tsx', 'utf8')
assert.match(clinicalHub, /<Fold label="Visual Atlas">[\s\S]*<WhenOpened>[\s\S]*ClinicalVisualAtlasDeck/)
assert.doesNotMatch(clinicalHub, /backdrop-blur|bg-gradient|blur-3xl|shadow-\[/)

// 3. For You Lifestyle Deck enforces non-medical privacy isolation (zero medical/biometric default sharing)
const forYouDeck = readFileSync('src/components/foryou/ForYouLifestyleDeck.tsx', 'utf8')
for (const cat of ['social', 'hobbies', 'sports', 'travel', 'creativity', 'productivity']) {
  assert.ok(forYouDeck.includes(`category: '${cat}'`), `missing lifestyle category: ${cat}`)
}
assert.match(forYouDeck, /data-medical-records-shared="false"/)
assert.match(forYouDeck, /data-biometric-twin-shared="false"/)
assert.match(forYouDeck, /dark space-y-3/)

const forYouHub = readFileSync('src/pages/social/ForYouHub.tsx', 'utf8')
assert.match(forYouHub, /ForYouLifestyleDeck/)
assert.doesNotMatch(forYouHub, /bg-gradient|backdrop-blur|shadow-\[/)

console.log('clinical-visual-and-foryou-lifestyle: 9-organ Z-Anatomy Clinical Atlas bridge + 6-space non-medical For You privacy shield PASS')
