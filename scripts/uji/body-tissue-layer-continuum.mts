import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { TISSUE_SUBTYPES } from '../../src/lib/anatomyHierarchy.ts'
import { fascialLayerManifestNodeCount } from '../../src/lib/anatomy/fascialLayerManifestAudit.ts'
import {
  currentSuperficialFasciaEvidenceTier,
  superficialFasciaEvidenceMayPromoteSystem,
} from '../../src/lib/anatomy/fascialSourceEvidenceLadder.ts'
import { CURRENT_ARTICULAR_CONVERSION_READINESS } from '../../src/lib/anatomy/articularConversionReceipt.ts'

const panel = await readFile(new URL('../../src/pages/bodyhub/TissueLayerContinuumPanel.tsx', import.meta.url), 'utf8')
const vertical = await readFile(new URL('../../src/pages/bodyhub/VertikalMolekulerPanel.tsx', import.meta.url), 'utf8')

assert.ok(fascialLayerManifestNodeCount() >= 70, 'fascial discovery must retain the broad pinned manifest inventory')
assert.equal(currentSuperficialFasciaEvidenceTier(), 'bundle-metadata-compatible')
assert.equal(superficialFasciaEvidenceMayPromoteSystem(), false, 'discovery evidence must not promote fascia geometry')
assert.equal(CURRENT_ARTICULAR_CONVERSION_READINESS.status, 'receipt-missing')
assert.equal(CURRENT_ARTICULAR_CONVERSION_READINESS.readyForQualifiedReview, false)
assert.ok(TISSUE_SUBTYPES.some((item) => item.key === 'dense-regular'), 'tendon/ligament histology identity must remain available')
assert.ok(TISSUE_SUBTYPES.some((item) => item.key === 'hyaline-cartilage'), 'articular cartilage histology identity must remain available')
assert.ok(TISSUE_SUBTYPES.some((item) => item.key === 'fibrocartilage'), 'fibrocartilage histology identity must remain available')

assert.match(vertical, /TissueLayerContinuumPanel/, 'the tissue continuum must be mounted in the user-reachable Tissue → gene workspace')
assert.match(panel, /data-tissue-layer-continuum="v1"/, 'the continuum needs a deterministic browser identity')
assert.match(panel, /Surface → fascia → muscle → joint → neurovascular → organ → histology/, 'the visible continuum must span gross to microscopic tissue context')
assert.match(panel, /Manifest and bundle metadata do not promote fascia to verified geometry/, 'fascia must stay fail-closed')
assert.match(panel, /never by itself proves cartilage, capsule or ligament anatomy/, 'articular conversion bookkeeping must not masquerade as anatomy')
assert.match(panel, /representation continuum, not a universal incision order/, 'regional layer-order variation must stay explicit')
assert.match(panel, /min-h-11/, 'mobile touch targets must preserve the 44px interaction floor')
assert.doesNotMatch(panel, /patient-specific injury risk|diagnoses this|safe surgical plane/i, 'the continuum must not make patient or procedure claims')

console.log('body-tissue-layer-continuum: reachable gross→tissue map stays source-aware and fail-closed')
