import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readiness = readFileSync('src/pages/Readiness.tsx', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const surfaces = JSON.parse(readFileSync('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const recoverySurface = surfaces.surfaces.find((entry) => entry.domainId === 'recovery-stress')
assert.deepEqual(recoverySurface, {
  domainId: 'recovery-stress',
  route: '/readiness',
  surface: 'dedicated',
  label: 'Readiness & Recovery',
})

// The recovery workbench must remain route-lazy rather than inflating the initial bundle.
assert.match(main, /const Readiness = lazy\(\(\) => import\('\.\/pages\/Readiness'\)/)
assert.match(main, /path="\/readiness"/)

// Recorded-data/offline contract: one local record per date, with no direct network path.
assert.match(readiness, /const KEY = 'pmd_readiness_v1'/)
assert.match(readiness, /localStorage\.getItem\(KEY\)/)
assert.match(readiness, /localStorage\.setItem\(KEY, JSON\.stringify\(store\)\)/)
assert.doesNotMatch(readiness, /\bfetch\s*\(/)
assert.doesNotMatch(readiness, /axios\./)

// Device values are accepted only when positive; manual corrections preserve source + timestamp.
assert.match(readiness, /if \(v > 0\) p\.hrv = Math\.round\(v\)/)
assert.match(readiness, /if \(v > 0\) p\.rhr = v/)
assert.match(readiness, /if \(v > 0\) p\.sleepH = Math\.round\(v \* 10\) \/ 10/)
assert.match(readiness, /source: 'Manual', measuredAt: new Date\(\)\.toISOString\(\)/)

// All historical scans used by the current page are bounded. These guards deliberately validate
// software behavior only; they do NOT validate the physiological meaning of any readiness formula.
assert.match(readiness, /for \(let i = 1; i <= 14; i\+\+\)/)
assert.match(readiness, /for \(let i = 1; i <= 7; i\+\+\)/)
assert.match(readiness, /for \(let i = 0; i <= 30; i\+\+\)/)
assert.match(readiness, /Array\.from\(\{ length: 7 \}/)
assert.match(readiness, /\.slice\(0, 5\)/)

// Academic Accuracy fail-closed guard: the source itself must continue to disclose that its
// combined recovery weighting is an author choice and not a published validated readiness formula.
assert.match(readiness, /pilihan penulis, bukan hasil penelitian/)
assert.match(readiness, /tidak ada[\s\S]{0,120}rumus kesiapan yang diterbitkan dan tervalidasi/)

console.log('feature-factory recovery recorded-data contract: ok')
