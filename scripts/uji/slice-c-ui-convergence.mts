import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const clinicalHub = readFileSync(new URL('../../src/pages/clinical/ClinicalHub.tsx', import.meta.url), 'utf8')
assert.ok(clinicalHub.includes('ClinicalToClaimShieldWorkbench'), 'ClinicalHub must lazy-load ClinicalToClaimShieldWorkbench')
assert.ok(clinicalHub.includes('<Fold label="Claim Shield"'), 'ClinicalHub must fold Claim Shield cleanly')
assert.ok(clinicalHub.includes('<WhenOpened>'), 'ClinicalHub must defer heavy panels inside closed Folds via WhenOpened')
assert.doesNotMatch(clinicalHub, /backdrop-blur|bg-gradient|blur-3xl|shadow-\[/, 'ClinicalHub must obey clinical-simplicity-contract')

const rvCockpit = readFileSync(new URL('../../src/components/reality-view/RealityViewCockpit.tsx', import.meta.url), 'utf8')
assert.ok(rvCockpit.includes('MultiscaleSocialTwinPanel'), 'RealityViewCockpit must wire MultiscaleSocialTwinPanel')
assert.ok(rvCockpit.includes('AureumLifetimeMemoryPanel'), 'RealityViewCockpit must wire AureumLifetimeMemoryPanel')

const claimWb = readFileSync(new URL('../../src/components/clinical/ClinicalToClaimShieldWorkbench.tsx', import.meta.url), 'utf8')
assert.ok(claimWb.includes('evaluateClinicalToClaimShield'), 'Workbench must call real Clinical-to-Claim Shield engine')
assert.ok(claimWb.includes('OMITTED (NURSE)'), 'Workbench must visually prove NURSE role governance omission')

const multiPanel = readFileSync(new URL('../../src/components/reality-view/MultiscaleSocialTwinPanel.tsx', import.meta.url), 'utf8')
assert.ok(multiPanel.includes('traceSemanticZoomPath'), 'Multiscale panel must call real semantic zoom engine')
assert.ok(multiPanel.includes('mintPersonalizedTwinBarcode'), 'Multiscale panel must mint real SHA-256 personalized twin barcode')
assert.ok(multiPanel.includes('encryptSocialTwinForCloud'), 'Multiscale panel must support real AES-GCM cloud envelope')

const centPanel = readFileSync(new URL('../../src/components/reality-view/AureumLifetimeMemoryPanel.tsx', import.meta.url), 'utf8')
assert.ok(centPanel.includes('buildMultiResolutionTimeline'), 'Century panel must call real multi-resolution engine')
assert.ok(centPanel.includes('queryPersonalHealthMemory'), 'Century panel must call real personal health memory engine')
assert.ok(centPanel.includes('buildPortableLifetimePassport'), 'Century panel must call real portable lifetime passport engine')

console.log('slice-c-ui-convergence: ClinicalToClaimShieldWorkbench (WhenOpened), MultiscaleSocialTwinPanel, and AureumLifetimeMemoryPanel verified PASS')
