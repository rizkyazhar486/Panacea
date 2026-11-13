// Sintesis bukti: pengelompokan beratribusi yang gagal tertutup. Semua sumber di bawah adalah FIKSTUR UJI (identifier 'fixture:*'),
// bukan sitasi nyata; mesinnya sendiri tidak pernah membuat sumber.
import assert from 'node:assert/strict'
import { synthesize, MAX_CLAIMS, MAX_QUESTION_CHARS, MAX_SOURCES, MAX_TEXT_CHARS, EVIDENCE_KINDS } from '../../src/domains/evidence-synthesis/engine/synthesize.ts'
import type { ClaimRecord, SourceRecord, SynthesisInput, SourceKind } from '../../src/domains/evidence-synthesis/model/types.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const NOW = Date.UTC(2026, 10, 9, 12, 0, 0)
const src = (id: string, kind: SourceKind, extra: Partial<SourceRecord> = {}): SourceRecord => ({ id, title: `Fixture ${id}`, kind, identifier: `fixture:${id}`, licence: 'test-fixture', retrievedAt: '2026-11-01T00:00:00Z', ...extra })
const clm = (id: string, sourceId: string, stance: ClaimRecord['stance'], certainty?: ClaimRecord['certainty'], extra: Partial<ClaimRecord> = {}): ClaimRecord => ({ id, sourceId, text: `Fixture claim ${id}`, stance, ...(certainty ? { certainty } : {}), ...extra })
const base = (): SynthesisInput => ({
  question: 'Does fixture intervention X change fixture outcome Y?', nowMs: NOW,
  sources: [src('g1', 'guideline'), src('t1', 'trial'), src('o1', 'observational')],
  claims: [clm('c2', 't1', 'supports', 'moderate'), clm('c1', 'g1', 'supports', 'high'), clm('c3', 'o1', 'opposes', 'low')],
})
const ok = (i: SynthesisInput) => { const r = synthesize(i); assert.equal(r.ok, true, JSON.stringify(r)); return r as Extract<ReturnType<typeof synthesize>, { ok: true }> }
const alasan = (i: unknown) => { const r = synthesize(i as SynthesisInput); return r.ok ? 'ok' : r.reason }

// ── positif ──
gagal('kelompok-dan-urutan', () => {
  const r = ok(base())
  assert.equal(r.status, 'graded-evidence')
  assert.deepEqual(r.supports.claims.map((c) => c.claimId), ['c1', 'c2'])  // high sebelum moderate
  assert.equal(r.supports.strongest, 'high'); assert.equal(r.opposes.strongest, 'low'); assert.equal(r.neutral.strongest, null)
  assert.equal(r.contested, true)   // mendukung DAN menentang
  assert.deepEqual(r.gaps, ['systematic-review', 'mechanism', 'expert-opinion', 'dataset'])  // celah tampak
  assert.equal(r.truthClass, 'reference'); assert.match(r.boundary, /Not a verdict/); assert.equal(r.sourceCount, 3)
})
gagal('atribusi-lengkap-di-setiap-klaim', () => { for (const c of ok(base()).supports.claims) { assert.ok(c.source.identifier.startsWith('fixture:')); assert.equal(c.source.licence, 'test-fixture'); assert.ok(c.source.retrievedAt) } })
gagal('tanpa-garis-bawah-gabungan', () => { const keys = Object.keys(ok(base())); for (const k of ['bottomLine', 'verdict', 'score', 'recommendation', 'conclusion', 'strength']) assert.ok(!keys.includes(k), k) })
gagal('deterministik-dan-tak-peduli-urutan-masukan', () => { const a = ok(base()); const b = base(); b.claims.reverse(); b.sources.reverse(); assert.deepEqual(ok(b), a); assert.deepEqual(ok(base()), a) })
// seri tingkat kepastian: urutan HARUS ditentukan oleh id, bukan oleh urutan masukan (celah yang ditemukan sabotase)
gagal('urutan-seri-deterministik', () => {
  const i = base(); i.claims = [clm('cb', 'g1', 'supports', 'moderate'), clm('ca', 't1', 'supports', 'moderate'), clm('cc', 'o1', 'supports', 'moderate')]
  const a = ok(i); assert.deepEqual(a.supports.claims.map((c) => c.claimId), ['ca', 'cb', 'cc'])
  const j = base(); j.claims = [...i.claims].reverse(); assert.deepEqual(ok(j), a)
})
// batas kebijakan dipatok sebagai angka literal: mengubah konstanta tidak boleh menggeser kedua sisi uji sekaligus
gagal('batas-kebijakan-literal', () => { assert.equal(MAX_CLAIMS, 200); assert.equal(MAX_SOURCES, 100); assert.equal(MAX_QUESTION_CHARS, 500); assert.equal(MAX_TEXT_CHARS, 2000) })
gagal('tanpa-efek-samping', () => { const i = base(); const salin = JSON.stringify(i); synthesize(i); assert.equal(JSON.stringify(i), salin) })
gagal('hanya-sumber-yang-diberikan', () => { const i = base(); const ids = new Set(i.sources.map((s) => s.id)); const r = ok(i); for (const g of [r.supports, r.opposes, r.neutral]) for (const c of g.claims) assert.ok(ids.has(c.source.id)) })

// ── kontestasi: berpasangan, hanya satu kondisi yang berbeda ──
gagal('tidak-diperdebatkan-bila-hanya-mendukung', () => { const i = base(); i.claims = [clm('c1', 'g1', 'supports', 'high'), clm('c2', 't1', 'supports', 'moderate')]; assert.equal(ok(i).contested, false) })
gagal('diperdebatkan-bila-menentang-muncul', () => { const i = base(); i.claims = [clm('c1', 'g1', 'supports', 'high'), clm('c3', 'o1', 'opposes', 'low')]; assert.equal(ok(i).contested, true) })
gagal('netral-tidak-membuat-diperdebatkan', () => { const i = base(); i.claims = [clm('c1', 'g1', 'supports', 'high'), clm('c4', 'o1', 'neutral', 'low')]; assert.equal(ok(i).contested, false) })
gagal('sumber-bertanda-diperdebatkan', () => { const i = base(); i.claims = [clm('c1', 'g1', 'supports', 'high')]; i.sources = [src('g1', 'guideline', { contested: true }), src('t1', 'trial')]; const r = ok(i); assert.equal(r.contested, true); assert.deepEqual(r.contestedSources, ['g1']) })
gagal('sumber-bertanda-tapi-tak-dipakai-tidak-dihitung', () => { const i = base(); i.claims = [clm('c1', 'g1', 'supports', 'high')]; i.sources = [src('g1', 'guideline'), src('t1', 'trial', { contested: true })]; assert.equal(ok(i).contested, false) })

// ── ajaran/kitab/tuntunan: dinisbahkan, tidak dinilai, tidak dicampur dengan bukti ──
const ajaran = (): SynthesisInput => ({ question: 'What does this tradition say about fasting?', nowMs: NOW, sources: [src('a1', 'teaching', { lens: 'Fixture tradition A', edition: 'fixture translation 1' })], claims: [clm('p1', 'a1', 'neutral')] })
gagal('ajaran-dinisbahkan-bukan-dinilai', () => { const r = ok(ajaran()); assert.equal(r.status, 'no-graded-evidence'); assert.equal(r.teachings.length, 1); assert.equal(r.teachings[0].source.lens, 'Fixture tradition A'); assert.equal(r.supports.claims.length + r.opposes.claims.length + r.neutral.claims.length, 0) })
gagal('ajaran-tak-mengisi-celah-bukti', () => assert.deepEqual(ok(ajaran()).gaps, [...EVIDENCE_KINDS]))
gagal('ajaran-tak-masuk-kelompok-bukti', () => { const i = base(); i.sources.push(src('a1', 'teaching', { lens: 'Fixture tradition A' })); i.claims.push(clm('p1', 'a1', 'opposes')); const r = ok(i); assert.equal(r.opposes.claims.length, 1); assert.equal(r.opposes.claims[0].claimId, 'c3'); assert.equal(r.teachings.length, 1) })
gagal('ajaran-dengan-kepastian-ditolak', () => { const i = ajaran(); i.claims = [clm('p1', 'a1', 'neutral', 'high')]; assert.equal(alasan(i), 'teaching-claim-has-certainty') })
gagal('ajaran-tanpa-lensa-ditolak', () => { const i = ajaran(); i.sources = [src('a1', 'teaching')]; assert.equal(alasan(i), 'teaching-source-has-no-lens'); i.sources = [src('a1', 'teaching', { lens: '   ' })]; assert.equal(alasan(i), 'teaching-source-has-no-lens') })
gagal('lensa-tak-diperlukan-untuk-bukti', () => assert.equal(alasan(base()), 'ok'))
gagal('ajaran-bertanda-diperdebatkan-tampak', () => { const i = ajaran(); i.sources = [src('a1', 'teaching', { lens: 'L', contested: true })]; const r = ok(i); assert.equal(r.contested, true); assert.deepEqual(r.contestedSources, ['a1']) })

// ── negatif: setiap aturan dengan alasan bernama ──
for (const [nama, f, alas] of [
  ['tanpa-identifier', (i: SynthesisInput) => { i.sources[0].identifier = '' }, 'source-incomplete'],
  ['identifier-spasi', (i: SynthesisInput) => { i.sources[0].identifier = '   ' }, 'source-incomplete'],
  ['tanpa-lisensi', (i: SynthesisInput) => { i.sources[0].licence = '' }, 'source-incomplete'],
  ['tanpa-judul', (i: SynthesisInput) => { i.sources[0].title = '' }, 'source-incomplete'],
  ['tanpa-id-sumber', (i: SynthesisInput) => { i.sources[0].id = '' }, 'source-incomplete'],
  ['jenis-tak-dikenal', (i: SynthesisInput) => { (i.sources[0] as { kind: string }).kind = 'prophecy' }, 'source-invalid-kind'],
  ['id-sumber-ganda', (i: SynthesisInput) => { i.sources[1].id = i.sources[0].id }, 'duplicate-source-id'],
  ['id-klaim-ganda', (i: SynthesisInput) => { i.claims[1].id = i.claims[0].id }, 'duplicate-claim-id'],
  ['klaim-menyitir-sumber-tak-ada', (i: SynthesisInput) => { i.claims[0].sourceId = 'tidak-ada' }, 'claim-unknown-source'],
  ['klaim-tanpa-kepastian', (i: SynthesisInput) => { delete i.claims[0].certainty }, 'evidence-claim-missing-certainty'],
  ['kepastian-tak-valid', (i: SynthesisInput) => { (i.claims[0] as { certainty: string }).certainty = 'certain' }, 'evidence-claim-missing-certainty'],
  ['sikap-tak-valid', (i: SynthesisInput) => { (i.claims[0] as { stance: string }).stance = 'maybe' }, 'claim-invalid'],
  ['teks-klaim-kosong', (i: SynthesisInput) => { i.claims[0].text = '  ' }, 'claim-invalid'],
  ['id-klaim-kosong', (i: SynthesisInput) => { i.claims[0].id = '' }, 'claim-invalid'],
  ['pertanyaan-kosong', (i: SynthesisInput) => { i.question = '   ' }, 'invalid-question'],
  ['tanpa-klaim', (i: SynthesisInput) => { i.claims = [] }, 'no-claims'],
  ['waktu-tak-terbatas', (i: SynthesisInput) => { i.nowMs = Number.NaN }, 'invalid-input'],
  ['waktu-takhingga', (i: SynthesisInput) => { i.nowMs = Infinity }, 'invalid-input'],
  ['tanggal-tanpa-zona', (i: SynthesisInput) => { i.sources[0].retrievedAt = '2026-11-01' }, 'source-invalid-retrieval'],
  ['tanggal-mustahil', (i: SynthesisInput) => { i.sources[0].retrievedAt = '2026-02-30T00:00:00Z' }, 'source-invalid-retrieval'],
  ['tanggal-teks-bebas', (i: SynthesisInput) => { i.sources[0].retrievedAt = 'kemarin' }, 'source-invalid-retrieval'],
] as const) gagal(`ditolak:${nama}`, () => { const i = base(); f(i); assert.equal(alasan(i), alas) })
for (const buruk of [null, undefined, 'x', 7, {}, { question: 'q', sources: [], claims: [] }]) gagal(`masukan-buruk:${String(buruk)}`, () => assert.equal(synthesize(buruk as never).ok, false))
gagal('penolakan-tanpa-efek-samping-dan-berdetail', () => { const i = base(); i.sources[0].identifier = ''; const salin = JSON.stringify(i); const r = synthesize(i); assert.equal(r.ok, false); if (!r.ok) assert.ok(r.detail.includes('g1')); assert.equal(JSON.stringify(i), salin) })

// ── batas: tepat di batas diterima, ±1 di luar ditolak ──
gagal('batas-pertanyaan', () => { const i = base(); i.question = 'q'.repeat(MAX_QUESTION_CHARS); assert.equal(alasan(i), 'ok'); i.question = 'q'.repeat(MAX_QUESTION_CHARS + 1); assert.equal(alasan(i), 'invalid-question') })
gagal('batas-teks-klaim', () => { const i = base(); i.claims[0].text = 't'.repeat(MAX_TEXT_CHARS); assert.equal(alasan(i), 'ok'); i.claims[0].text = 't'.repeat(MAX_TEXT_CHARS + 1); assert.equal(alasan(i), 'claim-invalid') })
gagal('batas-jumlah-sumber', () => { const mk = (n: number) => { const i = base(); i.sources = Array.from({ length: n }, (_, k) => src(`s${k}`, 'trial')); i.claims = [clm('c', 's0', 'supports', 'low')]; return i }; assert.equal(alasan(mk(MAX_SOURCES)), 'ok'); assert.equal(alasan(mk(MAX_SOURCES + 1)), 'too-many-sources') })
gagal('batas-jumlah-klaim', () => { const mk = (n: number) => { const i = base(); i.claims = Array.from({ length: n }, (_, k) => clm(`c${k}`, 'g1', 'supports', 'low')); return i }; assert.equal(alasan(mk(MAX_CLAIMS)), 'ok'); assert.equal(alasan(mk(MAX_CLAIMS + 1)), 'too-many-claims') })
gagal('batas-waktu-pengambilan', () => { const i = base(); i.sources[0].retrievedAt = '2026-11-09T12:00:00Z'; assert.equal(alasan(i), 'ok'); i.sources[0].retrievedAt = '2026-11-09T12:00:01Z'; assert.equal(alasan(i), 'source-retrieved-in-future') })
gagal('zona-waktu-dihormati', () => { const i = base(); i.sources[0].retrievedAt = '2026-11-09T19:00:00+07:00'; assert.equal(alasan(i), 'ok'); i.sources[0].retrievedAt = '2026-11-09T19:00:01+07:00'; assert.equal(alasan(i), 'source-retrieved-in-future') })

// ── keamanan: teks apa pun hanyalah data, tidak diubah ──
gagal('teks-tidak-dimodifikasi', () => { const i = base(); const aneh = '<script>alert(1)</script> ${1+1} ‮'; i.claims[0].text = aneh; const r = ok(i); assert.ok([...r.supports.claims, ...r.opposes.claims].some((c) => c.text === aneh)) })
// ── kemurnian dan arah dependensi (CLAUDE.md §2) ──
import { readFileSync } from 'node:fs'
for (const f of ['engine/synthesize.ts', 'model/types.ts'])
  gagal(`murni:${f}`, () => assert.ok(!/Date\.now\(|Math\.random\(|fetch\(|localStorage|document\.|window\.|XMLHttpRequest/.test(readFileSync(`src/domains/evidence-synthesis/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), f))  // komentar (baris dan blok) dikecualikan: boleh menyebut larangannya
gagal('model-hanya-impor-tipe-dari-lib', () => { const m = readFileSync('src/domains/evidence-synthesis/model/types.ts', 'utf8'); for (const l of m.split('\n').filter((s) => /^import /.test(s))) assert.match(l, /^import type /, l) })
gagal('pintu-publik', async () => { const idx = readFileSync('src/domains/evidence-synthesis/index.ts', 'utf8'); for (const n of ['synthesize', 'SYNTHESIS_BOUNDARY', 'SynthesisResult', 'SourceRecord']) assert.ok(idx.includes(n), n) })
console.log('evidence-synthesis: OK')
