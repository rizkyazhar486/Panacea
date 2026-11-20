import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ASTRAL_BLOCKED_ROUTES,
  BODY_MEDIATOR_PORTALS,
  WORKFLOW_LENSES,
  buildAstralCatalog,
  filterAstralCatalog,
  focusedIndexForYaw,
  normalizeAngleDeg,
  projectOrbit360,
  shortestAngularDeltaDeg,
  stepOrbitPhysics,
  targetYawForIndex,
} from '../../src/domains/navigation/astralOrbit360.ts'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'
import { gabungKatalog, type SumberNav } from '../../src/lib/katalogLengkap.ts'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'

const SAMPLE_NAV: SumberNav[] = [
  { to: '/body-exposure', label: 'Body Exposure 3D Atlas', group: 'Your Body', roles: ['pasien', 'dokter', 'owner'] },
  { to: '/osce-ukmppd', label: 'Exam Practice', group: 'Learn & Look Up', roles: ['dokter', 'owner'] },
  { to: '/med-study', label: 'Medical Library', group: 'Learn & Look Up', roles: ['pasien', 'dokter', 'owner'] },
  { to: '/hospitals', label: 'Health Facilities', group: 'Services', roles: ['pasien', 'dokter'] },
  { to: '/visit-os', label: 'Visit OS', group: 'Clinical & AI', roles: ['pasien', 'dokter', 'owner'] },
  { to: '/poli', label: 'Poli Flow', group: 'Clinical & AI', roles: ['dokter', 'owner'] },
  { to: '/owner', label: 'Owner', group: 'Manage', roles: ['owner'] },
  { to: '/admin', label: 'Admin', group: 'Manage', roles: ['admin'] },
]

// ── 1. Positive tests ──────────────────────────────────────────────────────────
const combinedEntries = gabungKatalog(FITUR_DARI_HUB, SAMPLE_NAV)
const patientCatalog = buildAstralCatalog(combinedEntries, 'pasien')
const doctorCatalog = buildAstralCatalog(combinedEntries, 'dokter')
const ownerCatalog = buildAstralCatalog(combinedEntries, 'owner')

assert.ok(patientCatalog.totalFeatures >= 100, `expected >= 100 surfaced patient features, got ${patientCatalog.totalFeatures}`)
assert.equal(patientCatalog.realms.length, SUPER_PAGES.length)
assert.equal(BODY_MEDIATOR_PORTALS.length, 4)
assert.deepEqual(
  BODY_MEDIATOR_PORTALS.map((p) => p.label),
  ['Your Body', 'Clinical', 'For You', 'Open 3D'],
)
assert.deepEqual(
  WORKFLOW_LENSES.map((l) => l.id),
  ['all', 'healthcare', 'sport-medicine', 'education'],
)

const healthFiltered = filterAstralCatalog(patientCatalog, 'healthcare', '')
const sportFiltered = filterAstralCatalog(patientCatalog, 'sport-medicine', '')
const eduFiltered = filterAstralCatalog(patientCatalog, 'education', '')
assert.ok(healthFiltered.matchingTotal >= 30, `expected >= 30 healthcare features, got ${healthFiltered.matchingTotal}`)
assert.ok(sportFiltered.matchingTotal >= 20, `expected >= 20 sport-medicine features, got ${sportFiltered.matchingTotal}`)
assert.ok(eduFiltered.matchingTotal >= 20, `expected >= 20 education features, got ${eduFiltered.matchingTotal}`)

const doctorOsceSearch = filterAstralCatalog(doctorCatalog, 'education', 'Exam Practice')
assert.ok(doctorOsceSearch.matchingFeatures.some((f) => f.canonicalTo === '/osce-ukmppd'))

const nodes0 = projectOrbit360(7, 0, -18)
assert.equal(nodes0.length, 7)
assert.equal(nodes0[0].isFront, true)
for (let i = 1; i < nodes0.length; i++) {
  assert.ok(nodes0[0].zIndex >= nodes0[i].zIndex, 'front node must lead zIndex')
  assert.ok(nodes0[0].scale >= nodes0[i].scale, 'front node must lead scale')
}

let sim = { yawDeg: 0, velocityDegPerSec: 0, targetYawDeg: targetYawForIndex(7, 3) }
for (let step = 0; step < 60; step++) {
  const out = stepOrbitPhysics(sim, 0.016)
  sim = { ...sim, yawDeg: out.yawDeg, velocityDegPerSec: out.velocityDegPerSec }
  if (out.settled) break
}
assert.equal(focusedIndexForYaw(7, sim.yawDeg), 3)

const inertiaStep = stepOrbitPhysics({ yawDeg: 10, velocityDegPerSec: 120, targetYawDeg: null }, 0.016)
assert.ok(inertiaStep.yawDeg > 10 && inertiaStep.velocityDegPerSec < 120 && inertiaStep.velocityDegPerSec > 0)

// ── 2. Negative & role/safety gate tests ──────────────────────────────────────
for (const catalog of [patientCatalog, doctorCatalog, ownerCatalog]) {
  for (const blocked of ASTRAL_BLOCKED_ROUTES) {
    assert.ok(
      !catalog.allFeatures.some((f) => f.to === blocked || f.canonicalTo === blocked),
      `Blocked route ${blocked} leaked into catalog`,
    )
  }
}
assert.ok(
  !patientCatalog.allFeatures.some((f) => f.canonicalTo === '/osce-ukmppd'),
  'doctor-only /osce-ukmppd must remain hidden from pasien catalog',
)

const nanStep = stepOrbitPhysics({ yawDeg: Number.NaN, velocityDegPerSec: Number.POSITIVE_INFINITY, targetYawDeg: null }, 999)
assert.equal(Number.isFinite(nanStep.yawDeg), true)
assert.equal(Number.isFinite(nanStep.velocityDegPerSec), true)

const emptySearch = filterAstralCatalog(patientCatalog, 'all', 'zxqv-nonexistent-query-12345')
assert.equal(emptySearch.matchingTotal, 0)

// ── 3. Boundary tests ──────────────────────────────────────────────────────────
assert.equal(normalizeAngleDeg(-1), 359)
assert.equal(normalizeAngleDeg(0), 0)
assert.equal(normalizeAngleDeg(359), 359)
assert.equal(normalizeAngleDeg(360), 0)
assert.equal(normalizeAngleDeg(725), 5)

assert.equal(shortestAngularDeltaDeg(355, 5), 10)
assert.equal(shortestAngularDeltaDeg(5, 355), -10)
assert.equal(projectOrbit360(0, 0).length, 0)
const single = projectOrbit360(1, 45)
assert.equal(single.length, 1)
assert.equal(single[0].isFront, true)

// ── 4. Source contracts & Self-Sabotage proofs ────────────────────────────────
function validateAstralSources(sources: {
  domain: string
  launcher: string
  hub: string
  core3d: string
  css: string
}): string[] {
  const issues: string[] = []
  if (/window\.|document\.|Date\.now\(|new Date\(|Math\.random\(/.test(sources.domain)) {
    issues.push('astralOrbit360.ts must remain pure without DOM, clock, or randomness')
  }
  if (!/ASTRAL_BLOCKED_ROUTES/.test(sources.domain) || !sources.domain.includes("'/visit-os'")) {
    issues.push('astralOrbit360.ts must fail closed on ASTRAL_BLOCKED_ROUTES')
  }
  if (!/SUPER_PAGES\.map\(/.test(sources.launcher)) {
    issues.push('SuperPageLauncher.tsx must preserve SUPER_PAGES.map(')
  }
  if (/from\s+['"][^'"]*Body3D['"]|from\s+['"]three['"]/.test(sources.launcher)) {
    issues.push('SuperPageLauncher.tsx must not eagerly import Body3D or three')
  }
  if (/from\s+['"][^'"]*Body3D['"]|from\s+['"]three['"]/.test(sources.hub)) {
    issues.push('AstralOrbit360Hub.tsx must lazy-load 3D mesh rather than eagerly importing Body3D/three')
  }
  if (!/className="dark\s+pmd-astral-360"/.test(sources.hub)) {
    issues.push('AstralOrbit360Hub.tsx must apply explicit dark marker on pmd-astral-360 cosmic surface')
  }
  if (!/prefers-reduced-motion:\s*reduce/.test(sources.hub) || !/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(sources.css)) {
    issues.push('Astral 360 hub and CSS must honor prefers-reduced-motion: reduce')
  }
  if (!/BODY_MEDIATOR_PORTALS/.test(sources.hub) || !/WORKFLOW_LENSES/.test(sources.hub)) {
    issues.push('AstralOrbit360Hub.tsx must render Body Mediator portals and Workflow lenses')
  }
  for (const chart of ['gauge', 'area', 'stacked-column', 'radar', 'donut', 'waterfall', 'comparison', 'vein', 'heatmap', 'bubble', 'diverging']) {
    if (!sources.hub.includes(`'${chart}'`)) {
      issues.push(`AstralOrbit360Hub.tsx missing dynamic chart family: ${chart}`)
    }
  }
  if (!/FeatureErrorBoundary/.test(sources.core3d)) {
    issues.push('AstralLive3DBodyCore.tsx must wrap Body3D in FeatureErrorBoundary')
  }
  return issues
}

const realSources = {
  domain: readFileSync(new URL('../../src/domains/navigation/astralOrbit360.ts', import.meta.url), 'utf8'),
  launcher: readFileSync(new URL('../../src/components/ui/SuperPageLauncher.tsx', import.meta.url), 'utf8'),
  hub: readFileSync(new URL('../../src/components/ui/AstralOrbit360Hub.tsx', import.meta.url), 'utf8'),
  core3d: readFileSync(new URL('../../src/components/ui/AstralLive3DBodyCore.tsx', import.meta.url), 'utf8'),
  css: readFileSync(new URL('../../src/styles/astral-orbit-360.css', import.meta.url), 'utf8'),
}

assert.deepEqual(validateAstralSources(realSources), [], 'Live Astral 360 sources must pass all contracts')

const sabotages: [string, Partial<typeof realSources>, RegExp][] = [
  [
    'dropped SUPER_PAGES.map( in SuperPageLauncher',
    { launcher: realSources.launcher.replace('SUPER_PAGES.map(', '[].map(') },
    /SUPER_PAGES\.map\(/,
  ],
  [
    'eagerly imported Body3D in AstralOrbit360Hub',
    { hub: "import { Body3D } from '../bodyhub/Body3D'\n" + realSources.hub },
    /must lazy-load 3D mesh/,
  ],
  [
    'removed explicit dark marker on pmd-astral-360',
    { hub: realSources.hub.replace('className="dark pmd-astral-360"', 'className="pmd-astral-360"') },
    /explicit dark marker/,
  ],
  [
    'weakened ASTRAL_BLOCKED_ROUTES guard',
    { domain: realSources.domain.replace("'/visit-os'", "'/safe-only'") },
    /ASTRAL_BLOCKED_ROUTES/,
  ],
  [
    'removed prefers-reduced-motion in astral-orbit-360.css',
    { css: realSources.css.replace('prefers-reduced-motion: reduce', 'min-width: 1px') },
    /prefers-reduced-motion/,
  ],
]

for (const [name, patch, pattern] of sabotages) {
  const result = validateAstralSources({ ...realSources, ...patch })
  assert.ok(result.some((msg) => pattern.test(msg)), `Self-sabotage check MUST fail for: ${name}`)
}

console.log(`astral-orbit-360: ok (${patientCatalog.totalFeatures} patient features, ${doctorCatalog.totalFeatures} doctor features, ${sabotages.length} self-sabotage proofs passed)`)
