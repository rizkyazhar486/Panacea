import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  evaluateEthicalOpenCoreEntitlement,
  HUMANITARIAN_FREE_CORE_FEATURES,
} from '../../src/domains/science/reproducibleValidationEngine.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('ethical open-core: Humanitarian Free-Forever Core is NEVER paywalled across any tier', () => {
  assert.equal(HUMANITARIAN_FREE_CORE_FEATURES.length, 5)
  for (const feature of HUMANITARIAN_FREE_CORE_FEATURES) {
    for (const tier of ['free_core', 'pro_twin', 'clinic_saas', 'research_api']) {
      const d = evaluateEthicalOpenCoreEntitlement(tier, feature)
      assert.equal(d.allowed, true)
      assert.equal(d.humanitarianFreeCore, true)
      assert.equal(d.paywallProhibited, true)
      assert.equal(d.personalDataSaleAllowed, false)
      assert.equal(d.emergencySafetyPaywallAllowed, false)
    }
  }

  // Commercial tiers gate strictly commercial capabilities while preserving bans on data sale
  const proBlocked = evaluateEthicalOpenCoreEntitlement('free_core', 'pro_twin_cloud_sync')
  assert.equal(proBlocked.allowed, false)
  assert.equal(proBlocked.personalDataSaleAllowed, false)

  const clinicAllowed = evaluateEthicalOpenCoreEntitlement('clinic_saas', 'clinic_satusehat_visit_os')
  assert.equal(clinicAllowed.allowed, true)
})

test('2000-2100 Constitution document & SQL 002 commercial constraint exist and match hard invariants', () => {
  const doc = readFileSync(join(ROOT, 'DOCS/legacy/PANACEAMED_CONSTITUTION_2000_2100.md'), 'utf8')
  assert.match(doc, /HUMANITARIAN COVENANT/i)
  assert.match(doc, /ETHICAL OPEN-CORE COMMERCIALIZATION/i)
  assert.match(doc, /GENERATIONAL SUCCESSION/i)

  const sql002 = readFileSync(join(ROOT, 'sql/002_panaceamed_legacy_governance.sql'), 'utf8')
  assert.match(sql002, /CHECK \(humanitarian_free_core = TRUE\)/)
  assert.match(sql002, /CHECK \(personal_data_sale_allowed = FALSE\)/)
  assert.match(sql002, /ENABLE ROW LEVEL SECURITY/)
})
