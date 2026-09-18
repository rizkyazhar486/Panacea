import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const clinical = readFileSync('src/pages/ClinicalHub.tsx', 'utf8')

// The clinical landing is a command surface, not a dashboard of equally
// weighted glass cards. Complex visual anatomy remains behind Body Explorer.
assert.doesNotMatch(clinical, /framer-motion|<motion\.|AnimatePresence/,
  'Clinical reintroduced ornamental layout animation')
assert.doesNotMatch(clinical, /backdrop-blur|bg-gradient|blur-3xl|shadow-\[/,
  'Clinical reintroduced glass/gradient/shadow card-mosaic decoration')

// High-frequency tasks are one direct interaction from Clinical.
for (const path of ['/chatbot', '/emr', '/emergency', '/care-episode', '/body-explorer']) {
  assert.ok(clinical.includes(`to: '${path}'`) || clinical.includes(`to="${path}"`),
    `Clinical lost one-tap access to ${path}`)
}

// Reference work stays directly reachable without forcing another dashboard.
for (const path of ['/radiology', '/genome-lab', '/evidence', '/med-study', '/frontier-health']) {
  assert.ok(clinical.includes(`to: '${path}'`) || clinical.includes(`to="${path}"`),
    `Clinical reference path ${path} is not directly represented`)
}
assert.ok(clinical.includes("to: '/rujukan?t=obat'"), 'Clinical lost direct drug reference access')

// Inline tools must remain functional and deterministic.
// The literal identifiers were renamed (weight/height -> kg/cm) in
// 017e579 "fix(clinical): keep quick calculators empty until input" so the
// hook can guard on empty input before computing; the arithmetic itself is
// still exactly weight_kg / (height_m) ** 2, so the contract follows the
// renamed-but-equivalent source rather than asserting on identifier names.
assert.match(clinical, /kg \/ \(\(cm \/ 100\) \*\* 2\)/,
  'BMI calculation is missing or changed')
// Same 017e579 rename: sbp/dbp -> systolic/diastolic, same (SBP + 2*DBP)/3 arithmetic.
assert.match(clinical, /\(systolic \+ 2 \* diastolic\) \/ 3/,
  'MAP calculation is missing or changed')
assert.match(clinical, /if \(value < min\) return 'LOW'/,
  'Lab range low boundary is missing')
assert.match(clinical, /if \(value > max\) return 'HIGH'/,
  'Lab range high boundary is missing')

// The long tail remains reachable through the existing capability rail.
assert.match(clinical, /<SuperPageCapabilityRail domain="clinical" initialLimit=\{28\} \/>/,
  'Clinical long-tail capability reachability was removed')

console.log('clinical-simplicity-contract: one command surface, one-tap core actions, flat inline tools, direct references, and preserved long-tail reachability.')
