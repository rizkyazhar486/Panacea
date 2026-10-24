// ENG-C6-03 (bagian yang bisa diperiksa mesin): setiap mesin kalkulator mencatat dasar sumbernya secara jujur, kutipan terikat ke kepala
// berkas mesin, dan setiap halaman yang memakai mesin menampilkan batas klaim "Not clinician-reviewed" selama registri belum menandai
// mesin itu ditinjau. BATAS: ini tidak memeriksa bahwa halaman menampilkan rumus dan satuan, dan sumber belum tampil di layar
// pengguna; lihat docs/governance/CALCULATOR_SOURCE_LABEL.md.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import {
  checkSourceRecords, engineHeader, incompleteSources, SOURCE_KINDS, type SourceRecord,
} from '../../src/domains/clinical-calculators/engine/sourceRecord.ts'
import { describeSource } from '../../src/domains/clinical-calculators/engine/sourceLine.ts'
import { reviewedCount, type ReviewRegistry } from '../../src/domains/clinical-calculators/engine/reviewRegistry.ts'
import { clinicalClaimDisclosure, clinicalClaimLabel, klaimPermukaanKesehatan } from '../../src/lib/clinicalClaimMaturity.ts'

const ROOT = new URL('../../', import.meta.url)
const ENGINE_DIR = new URL('src/domains/clinical-calculators/engine/', ROOT)
const reg: ReviewRegistry = JSON.parse(readFileSync(new URL('governance/CALCULATOR_REVIEW_REGISTRY.json', ROOT), 'utf8'))
const headers = Object.fromEntries(reg.entries.map((e) => [e.id, engineHeader(readFileSync(new URL(`${e.id}.ts`, ENGINE_DIR), 'utf8'))]))

// ── sumber ─────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const r = checkSourceRecords(reg.entries, headers)
  assert.deepEqual(r.errors, [], 'every registry engine declares an honest source record')
  assert.equal(Object.values(r.counts).reduce((a, b) => a + b, 0), reg.entries.length)
  assert.ok(r.counts.published > 0, 'published sources are recorded for the engines whose header cites one')
  const withPmid = reg.entries.filter((e) => e.source?.pmid)
  // 10 (#2752) + 7 (batch 1 C6-03: childPugh, framinghamInputs, graceScore, maddreyScore, paradise, serumOsmolality, sofaScore)
  // + 4 (batch 2: centor, electrolyteCorrection, meldNa, riskScreens; sumber kedua dicatat di basis) + 2 (batch 3: packYearScreen, qtc)
  assert.equal(withPmid.length, 23, 'PMID dicatat hanya untuk engine yang sudah dicari dan dicocokkan di PubMed')
  assert.ok(reg.entries.every((e) => !e.source?.pmid || e.source.kind === 'published'), 'identifier hanya pada sumber terbit')
  assert.ok(withPmid.every((e) => e.source!.lookup?.retrievedOn === '2026-10-24'))
  // Ratchet ENG-C6-03: daftar engine yang BELUM patuh hanya boleh menyusut. Kosong = kriteria dapat dicatat PASS.
  assert.deepEqual(incompleteSources(reg.entries), [
    'aaGradient', 'bloodDonationScreen', 'bloodGas', 'denverAge', 'fletcher', 'fluidElectrolytes', 'hollidaySegar', 'idealBodyWeight',
    'mcdonaldRule', 'midParentalHeight', 'naegele', 'parkland', 'pediatricDka', 'waistToHeight', 'widmarkBac',
  ], 'engine belum patuh berubah: perbarui daftar ini HANYA dengan menghapus id yang kini bersumber atau dinyatakan heuristik')
  console.log(`calculator-source-label: sources ${JSON.stringify(r.counts)}, pmid ${withPmid.length}`)
}

const pubRec: SourceRecord = { kind: 'published', citation: 'Contoh et al. 1999', anchor: 'Contoh et al. 1999', basis: 'b' }
const none = (kind: SourceRecord['kind']): SourceRecord => ({ kind, citation: null, anchor: null, basis: 'b' })
const H = { a: 'Skor contoh (Contoh et al. 1999): rumus.' }
const errs = (s: SourceRecord | undefined, headers = H) => checkSourceRecords([{ id: 'a', source: s }], headers).errors
// positif
assert.deepEqual(errs(pubRec), [])
for (const k of ['named-method', 'unattributed', 'arithmetic', 'repo-heuristic'] as const) assert.deepEqual(errs(none(k)), [], k)
// (identifier tanpa lookup kini ditolak; bentuk sahnya diuji di blok 'identifier ⇒ metadata' di bawah)
// negatif berpasangan: tiap aturan menolak sendiri
assert.deepEqual(errs(undefined), ['a: source-missing'])
assert.deepEqual(errs({ ...pubRec, kind: 'verified' as never }), ['a: unknown-source-kind'])
assert.deepEqual(errs({ ...pubRec, basis: '  ' }), ['a: basis-missing'])
assert.deepEqual(errs({ ...pubRec, citation: null }), ['a: citation-missing'])
assert.deepEqual(errs({ ...pubRec, anchor: null }), ['a: anchor-missing'])
assert.deepEqual(errs({ ...pubRec, anchor: 'Lain et al. 2001' }), ['a: anchor-not-in-engine-header'])
assert.deepEqual(errs(pubRec, { a: 'tanpa kutipan' }), ['a: anchor-not-in-engine-header'])
assert.deepEqual(errs({ ...none('unattributed'), citation: 'Karangan et al. 2020' }), ['a: unsourced-must-not-carry-citation'])
assert.deepEqual(errs({ ...none('arithmetic'), anchor: 'Contoh' }), ['a: unsourced-must-not-carry-citation'])
assert.deepEqual(errs({ ...none('named-method'), doi: '10.1000/x1' }), ['a: identifier-without-citation'])
assert.deepEqual(errs({ ...none('named-method'), pmid: '1' }), ['a: identifier-without-citation'])
assert.deepEqual(errs({ ...pubRec, doi: 'doi:10.1/x' }), ['a: doi-invalid', 'a: identifier-without-lookup'])
assert.deepEqual(errs({ ...pubRec, pmid: 'PMC1' }), ['a: pmid-invalid', 'a: identifier-without-lookup'])
assert.deepEqual(errs({ ...pubRec, doi: '' }), ['a: doi-invalid'])
// identifier ⇒ metadata hasil pencarian yang cocok dengan kutipan; tiap aturan menolak sendiri
const lk = { source: 'PubMed' as const, pmid: '12345' as string | null, doi: '10.1000/xyz123' as string | null, retrievedOn: '2026-10-24', title: 'Judul contoh', firstAuthor: 'Contoh', journal: 'J Contoh', year: 1999, pages: '1-9' }
const withId = (over: Partial<typeof lk> | null, ids: Partial<SourceRecord> = { pmid: '12345', doi: '10.1000/xyz123' }): SourceRecord =>
  ({ ...pubRec, ...ids, lookup: over === null ? undefined : { ...lk, ...over } })
assert.deepEqual(errs(withId({})), [])
assert.deepEqual(errs(withId({ doi: null }, { pmid: '12345', doi: null })), [], 'PMID tanpa DOI sah (mis. artikel lama tanpa DOI)')
assert.deepEqual(errs(withId({ pmid: '99999' })), ['a: lookup-pmid-mismatch'], 'PMID ditukar di satu sisi')
assert.deepEqual(errs(withId({ doi: '10.1000/lain' })), ['a: lookup-doi-mismatch'])
assert.deepEqual(errs(withId({ doi: null })), ['a: lookup-doi-mismatch'], 'DOI dibuang dari lookup tetapi ada di sumber')
assert.deepEqual(errs(withId(null)), ['a: identifier-without-lookup'])
assert.deepEqual(errs(withId(null, { doi: '10.1000/xyz123' })), ['a: identifier-without-lookup'])
assert.deepEqual(errs(withId({ source: 'Google' as never })), ['a: lookup-source-invalid'])
assert.deepEqual(errs(withId({ retrievedOn: '24-10-2026' })), ['a: lookup-date-invalid'])
assert.deepEqual(errs(withId({ title: ' ' })), ['a: lookup-title-missing'])
assert.deepEqual(errs(withId({ journal: '' })), ['a: lookup-journal-missing'])
assert.deepEqual(errs(withId({ pages: '' })), ['a: lookup-pages-missing'])
assert.deepEqual(errs(withId({ firstAuthor: 'Lain' })), ['a: lookup-author-not-in-citation'], 'PMID milik artikel lain ditolak')
assert.deepEqual(errs(withId({ year: 2001 })), ['a: lookup-year-not-in-citation'])
assert.deepEqual(errs(withId({ year: 1999.5 })), ['a: lookup-year-not-in-citation'])
assert.deepEqual(errs(pubRec), [], 'tanpa identifier, lookup tidak diwajibkan')

// terbitan tak terindeks (unindexed): hanya pada published tanpa PMID, dengan alasan, tanggal periksa, URL https atau null
const un = { reason: 'Laporan lembaga, tidak di PubMed', url: 'https://contoh.org/laporan', checkedOn: '2026-10-24' }
assert.deepEqual(errs({ ...pubRec, unindexed: un }), [])
assert.deepEqual(errs({ ...pubRec, unindexed: { ...un, url: null } }), [])
assert.deepEqual(errs({ ...none('named-method'), unindexed: un }), ['a: unindexed-on-unsourced'])
assert.deepEqual(errs({ ...pubRec, unindexed: { ...un, reason: ' ' } }), ['a: unindexed-reason-missing'])
assert.deepEqual(errs({ ...pubRec, unindexed: { ...un, url: 'http://contoh.org' } }), ['a: unindexed-url-invalid'])
assert.deepEqual(errs({ ...pubRec, unindexed: { ...un, checkedOn: 'kemarin' } }), ['a: unindexed-date-invalid'])
assert.ok(errs({ ...pubRec, pmid: '1', lookup: { source: 'PubMed', pmid: '1', doi: null, retrievedOn: '2026-10-24', title: 't', firstAuthor: 'Contoh', journal: 'j', year: 1999, pages: '1' }, unindexed: un }).includes('a: unindexed-with-pmid'))

// kelengkapan (aturan owner 2026-10-24): published ber-PMID / unindexed, atau arithmetic / repo-heuristic yang dinyatakan
const one = (s: SourceRecord) => incompleteSources([{ id: 'a', source: s }])
assert.deepEqual(one({ ...pubRec, unindexed: un }), [])
assert.deepEqual(one(pubRec), ['a'], 'published tanpa PMID dan tanpa unindexed belum patuh')
assert.deepEqual(one(none('arithmetic')), [])
assert.deepEqual(one(none('repo-heuristic')), [])
assert.deepEqual(one(none('named-method')), ['a'])
assert.deepEqual(one(none('unattributed')), ['a'])
assert.equal(SOURCE_KINDS.length, 5)
assert.equal(engineHeader('/** kepala */\nconst x = 1 /* bukan kepala */'), ' kepala ')
assert.equal(engineHeader('const x = 1'), '')

// ── label "not clinician-reviewed" pada setiap halaman pemakai mesin ────────────────────────────────────────────
const walk = (dir: URL, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const url = new URL(name + (statSync(new URL(name, dir)).isDirectory() ? '/' : ''), dir)
    if (statSync(url).isDirectory()) walk(url, out)
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\./.test(name)) out.push(url.pathname)
  }
  return out
}
const srcFiles = walk(new URL('src/', ROOT)).filter((f) => !f.includes('/domains/clinical-calculators/'))
const text = new Map(srcFiles.map((f) => [f, readFileSync(f, 'utf8')]))
const exportsOf = (id: string) => new Set([...readFileSync(new URL(`${id}.ts`, ENGINE_DIR), 'utf8').matchAll(/export (?:async )?(?:function|const) (\w+)/g)].map((m) => m[1]!))

/** Halaman (.tsx) yang mengimpor simbol sebuah mesin dari paket domain atau berkas mesin. */
export function pagesUsing(names: ReadonlySet<string>, files: ReadonlyMap<string, string>): string[] {
  const pages: string[] = []
  for (const [file, src] of files) {
    if (!file.endsWith('.tsx')) continue
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']*clinical-calculators[^']*)'/g)) {
      const imported = m[1]!.split(',').map((n) => n.trim().split(' as ')[0]!.trim())
      if (imported.some((n) => names.has(n))) { pages.push(file); break }
    }
  }
  return pages
}
const LABEL = /\bBatasKlaim(?:SkorTerbit|Kesehatan)\b/
export const unlabeled = (pages: string[], files: ReadonlyMap<string, string>) => pages.filter((p) => !LABEL.test(files.get(p) ?? ''))

const unlabeledByEngine: string[] = []
const consumers = new Set<string>()
for (const e of reg.entries) {
  const pages = pagesUsing(exportsOf(e.id), text)
  assert.ok(pages.length > 0, `${e.id}: no page renders this engine, so there is no surface to carry the label`)
  pages.forEach((p) => consumers.add(p))
  for (const p of unlabeled(pages, text)) unlabeledByEngine.push(`${e.id}: ${p.split('/src/')[1]}`)
}
assert.deepEqual(unlabeledByEngine, [], 'every page that renders an engine result shows the claim boundary')

// sumber terlihat: setiap halaman yang menampilkan sebuah mesin juga memuat <SumberKalkulator ids={[...]}> berisi id mesin itu
const SRC_TAG = /<SumberKalkulator\b[^>]*\bids=\{\[([^\]]*)\]\}/g
export const sourceIdsOn = (src: string) => new Set([...src.matchAll(SRC_TAG)].flatMap((m) => [...m[1]!.matchAll(/'(\w+)'/g)].map((x) => x[1]!)))
export const sourceMissing = (engineId: string, pages: string[], files: ReadonlyMap<string, string>) => pages.filter((p) => !sourceIdsOn(files.get(p) ?? '').has(engineId))
const sourceMissingByEngine: string[] = []
for (const e of reg.entries) for (const p of sourceMissing(e.id, pagesUsing(exportsOf(e.id), text), text)) sourceMissingByEngine.push(`${e.id}: ${p.split('/src/')[1]}`)
assert.deepEqual(sourceMissingByEngine, [], 'every page that renders an engine result lists that engine in its source disclosure')
{
  const pg = "import { SumberKalkulator } from '../components/ui/SumberKalkulator'\nexport const A = () => <SumberKalkulator ids={['fena', 'qtc']} />"
  assert.deepEqual([...sourceIdsOn(pg)], ['fena', 'qtc'])
  const fake = new Map([['/x/A.tsx', pg], ['/x/B.tsx', "export const B = () => <SumberKalkulator ids={['qtc']} />"], ['/x/C.tsx', 'export const C = () => null'], ['/x/D.tsx', "export const D = () => <SumberKalkulator ids={['fena']} className=\"x\" />"]])
  assert.deepEqual(sourceMissing('fena', ['/x/A.tsx', '/x/B.tsx', '/x/C.tsx', '/x/D.tsx'], fake), ['/x/B.tsx', '/x/C.tsx'], 'a page that lists other engines, or none, is named')
  assert.deepEqual(sourceMissing('qtc', ['/x/A.tsx', '/x/B.tsx'], fake), [], 'listing the engine is enough')
}

// teks sumber: kutipan tampil apa adanya, tautan hanya dari identifier yang tersimpan dan sah, sumber tak bernama tidak diberi kutipan
{
  const pub = describeSource('x', { kind: 'published', citation: 'Contoh 1999', anchor: 'Contoh 1999', basis: 'b', pmid: '12345', doi: '10.1000/abc' })
  assert.deepEqual(pub, { id: 'x', kind: 'published', label: 'Published source', text: 'Contoh 1999', pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/12345/', doiUrl: 'https://doi.org/10.1000/abc' })
  assert.equal(describeSource('x', { kind: 'published', citation: 'Contoh 1999', anchor: 'a', basis: 'b' }).pubmedUrl, null, 'tanpa PMID tersimpan tidak ada tautan')
  assert.equal(describeSource('x', { kind: 'published', citation: 'C', anchor: 'a', basis: 'b', pmid: 'PMC1', doi: 'doi:1' }).pubmedUrl, null, 'PMID tak sah tidak jadi tautan')
  assert.equal(describeSource('x', { kind: 'published', citation: 'C', anchor: 'a', basis: 'b', pmid: '1', doi: 'javascript:alert(1)' }).doiUrl, null, 'DOI tak sah tidak jadi tautan')
  const un = describeSource('x', { kind: 'unattributed', citation: null, anchor: null, basis: 'Standard equation; no publication named.', pmid: '999' })
  assert.deepEqual([un.label, un.text, un.pubmedUrl], ['No source recorded', 'Standard equation; no publication named.', null], 'sumber tak bernama tidak membawa tautan walau ada PMID nyasar')
  assert.equal(describeSource('x', undefined).kind, 'unknown')
  assert.equal(describeSource('x', { kind: 'verified' as never, citation: 'C', anchor: 'a', basis: 'b' }).kind, 'unknown', 'kind tak dikenal gagal tertutup')
  assert.equal(describeSource('x', null).text, 'No source record was found for this calculator.')
}

// negatif berpasangan: halaman tanpa label, halaman tanpa impor mesin
{
  const fake = new Map([['/x/A.tsx', "import { fena } from '../domains/clinical-calculators'\nexport const A = () => fena"], ['/x/B.tsx', "import { fena } from '../domains/clinical-calculators'\nimport { BatasKlaimSkorTerbit } from '../components/BatasKlaimSkorTerbit'"]])
  const fenaNames = new Set(['fena'])
  assert.deepEqual(pagesUsing(fenaNames, fake), ['/x/A.tsx', '/x/B.tsx'])
  assert.deepEqual(unlabeled(pagesUsing(fenaNames, fake), fake), ['/x/A.tsx'], 'a page without the label is named')
  assert.deepEqual(pagesUsing(new Set(['qtc']), fake), [], 'a page that does not import the engine is not counted')
  assert.deepEqual(pagesUsing(fenaNames, new Map([['/x/C.ts', "import { fena } from '../domains/clinical-calculators'"]])), [], 'a non-page module is not a surface')
}

// Label fail-closed: tanpa bukti, mesin tampil sebagai output teknis dan tidak ditinjau; tidak ada halaman yang mengklaim sebaliknya.
assert.equal(reviewedCount(reg), 0)
{
  const m = klaimPermukaanKesehatan('calculators.published-score')
  assert.equal(clinicalClaimLabel(m), 'Technical output')
  assert.match(clinicalClaimDisclosure(m), /Not clinician-reviewed/)
  assert.equal(klaimPermukaanKesehatan('calculators.published-score', { clinicianReviewed: true }), 'clinician-reviewed', 'only explicit evidence upgrades the label')
  const granting = [...consumers].filter((f) => /clinicianReviewed\s*:\s*true/.test(text.get(f) ?? '')).map((f) => f.split('/src/')[1])
  assert.deepEqual(granting, [], 'no page that renders an engine hands its surface reviewer evidence while the registry has no reviewed engine')
  assert.ok(consumers.size >= 30, `expected the calculator pages to be found, got ${consumers.size}`)
}

console.log(`calculator-source-label: ok (${reg.entries.length} engines: source recorded and bound to the engine header; every consuming page shows the not-reviewed label)`)
