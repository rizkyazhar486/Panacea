import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  exportPendingReviews, type ReviewEntry, type ReviewRegistry,
} from '../../src/domains/clinical-calculators/engine/reviewRegistry.ts'

const pending = (id: string): ReviewEntry => ({ id, review_status: 'PENDING_CLINICAL_REVIEW', clinically_reviewed: false, reviewer: null, reviewed_at: null, evidence: null })
const reviewed = (id: string): ReviewEntry => ({ id, review_status: 'CLINICALLY_REVIEWED', clinically_reviewed: true, reviewer: 'dr. Contoh', reviewed_at: '2026-10-10', evidence: 'note:1' })
const reg = (entries: ReviewEntry[], exempt: string[] = []): ReviewRegistry => ({ entries, exempt })

// positif: hanya yang pending, terurut, dengan jalur berkas; yang sah ditinjau tidak ikut
{
  const r = exportPendingReviews(reg([pending('b'), reviewed('c'), pending('a')]), ['a', 'b', 'c'])
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.deepEqual(r.rows.map((x) => x.id), ['a', 'b'])
    assert.equal(r.csv, 'engine_id,review_status,engine_path\n'
      + 'a,PENDING_CLINICAL_REVIEW,src/domains/clinical-calculators/engine/a.ts\n'
      + 'b,PENDING_CLINICAL_REVIEW,src/domains/clinical-calculators/engine/b.ts\n')
  }
}
// positif: semua sudah ditinjau → hanya baris judul
{
  const r = exportPendingReviews(reg([reviewed('a')]), ['a'])
  assert.equal(r.ok && r.csv, 'engine_id,review_status,engine_path\n')
}
// negatif berpasangan: registri tidak sah tidak diekspor (mesin tanpa entri; ditinjau tanpa peninjau)
{
  const r = exportPendingReviews(reg([pending('a')]), ['a', 'b'])
  assert.deepEqual(r, { ok: false, errors: ['b: engine-without-review-entry'] })
  const bad = { ...reviewed('a'), reviewer: null }
  const r2 = exportPendingReviews(reg([bad]), ['a'])
  assert.deepEqual(r2, { ok: false, errors: ['a: reviewer-missing'] })
  assert.equal(exportPendingReviews(reg([pending('a')]), ['a']).ok, true, 'pasangan: tanpa kondisi itu, ekspor berhasil')
}
// negatif: sel CSV berisi koma/kutip di-escape, bukan merusak kolom
{
  const r = exportPendingReviews(reg([pending('a,"x"')]), ['a,"x"'])
  assert.equal(r.ok && r.csv.split('\n')[1], '"a,""x""",PENDING_CLINICAL_REVIEW,"src/domains/clinical-calculators/engine/a,""x"".ts"')
}
// determinisme + registri nyata: semua mesin kalkulator tercantum, tidak ada yang tampak ditinjau
{
  const dir = new URL('../../src/domains/clinical-calculators/engine/', import.meta.url)
  const ids = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'reviewRegistry.ts').map((f) => f.slice(0, -3))
  const real: ReviewRegistry = JSON.parse(readFileSync(new URL('../../governance/CALCULATOR_REVIEW_REGISTRY.json', import.meta.url), 'utf8'))
  const a = exportPendingReviews(real, ids), b = exportPendingReviews(real, ids)
  assert.deepEqual(a, b)
  assert.equal(a.ok && a.rows.length, real.entries.length, 'semua entri nyata masih pending')
}
console.log('calculator-pending-review-export: hanya yang pending, fail closed pada registri tidak sah, CSV aman')
