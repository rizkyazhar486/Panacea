// Ekspor daftar mesin kalkulator yang menunggu tinjauan klinis (CSV ke stdout). Pakai:
//   node --experimental-strip-types scripts/qa/export-pending-calculator-reviews.mts > pending.csv
// Gagal (exit 1) bila registri tidak sah. Ini daftar kerja untuk peninjau, bukan bukti tinjauan.
import { readFileSync, readdirSync } from 'node:fs'
import { exportPendingReviews, type ReviewRegistry } from '../../src/domains/clinical-calculators/engine/reviewRegistry.ts'

const dir = new URL('../../src/domains/clinical-calculators/engine/', import.meta.url)
const ids = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'reviewRegistry.ts').map((f) => f.slice(0, -3))
const reg: ReviewRegistry = JSON.parse(readFileSync(new URL('../../governance/CALCULATOR_REVIEW_REGISTRY.json', import.meta.url), 'utf8'))
const r = exportPendingReviews(reg, ids)
if (!r.ok) { console.error(`registri tidak sah:\n${r.errors.join('\n')}`); process.exit(1) }
process.stdout.write(r.csv)
