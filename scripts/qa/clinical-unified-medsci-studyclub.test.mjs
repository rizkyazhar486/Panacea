import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const hub = readFileSync(new URL('../../src/pages/clinical/ClinicalHub.tsx', import.meta.url), 'utf8')
const studio = readFileSync(
  new URL('../../src/components/clinical/ClinicalMedSciStudyStudio.tsx', import.meta.url),
  'utf8',
)

test('ClinicalHub lazy-loads ClinicalMedSciStudyStudio behind Fold and WhenOpened', () => {
  assert.match(hub, /const ClinicalMedSciStudyStudio = lazy\(\(\) => import\('\.\.\/\.\.\/components\/clinical\/ClinicalMedSciStudyStudio'\)\)/)
  assert.match(hub, /<Fold label="MedSciHub & StudyClub"[\s\S]*?<WhenOpened>[\s\S]*?<ClinicalMedSciStudyStudio \/>/)
})

test('ClinicalHub replaces dead static html prototype links with live SPA routes', () => {
  assert.doesNotMatch(hub, /\.html["']/)
  assert.match(hub, /to: '\/med-study', label: 'MedSciHub'/)
})

test('ClinicalMedSciStudyStudio integrates SKDI diseases, INN catalog, StudyClub quiz, BODY bridge, and clinical boundary', () => {
  for (const symbol of ['SKDI_DISEASE_LIST', 'cariObat', 'dosisSkdi', 'QUIZ_BANK', '/fitness-hub', '/body-explorer', '/emr', '/rujukan?t=obat', '/med-study']) {
    assert.ok(studio.includes(symbol), `missing studio integration token: ${symbol}`)
  }
  assert.match(studio, /clinically_reviewed=false/)
})
