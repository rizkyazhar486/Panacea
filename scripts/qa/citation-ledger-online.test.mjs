// Uji pemeriksa daring ledger sitasi. Jaringan dan waktu disuntikkan, jadi uji ini offline dan deterministik.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { CANARY, compareEntry, ESUMMARY, exitCodeOf, run, sameTitle, tokens, verifyCanary, verifyLedger } from './citation-ledger-online.mjs'

const rules = (list) => list.map((item) => item.rule)
const ENTRY = { pmid: '6638199', authors: 'Sunagawa K, Maughan WL, Burkhoff D, et al.', title: 'Left ventricular interaction with arterial load studied in isolated canine ventricle.', source: 'Am J Physiol', pubDate: '1983-11', doi: '10.1152/ajpheart.1983.245.5.H773', verifiedOn: '2026-11-13' }
const SUMMARY = {
  uid: '6638199', pubdate: '1983 Nov', source: 'Am J Physiol', sortfirstauthor: 'Sunagawa K',
  authors: [{ name: 'Sunagawa K', authtype: 'Author' }, { name: 'Maughan WL', authtype: 'Author' }],
  title: 'Left ventricular interaction with arterial load studied in isolated canine ventricle.',
  articleids: [{ idtype: 'pubmed', value: '6638199' }, { idtype: 'doi', value: '10.1152/ajpheart.1983.245.5.H773' }],
}
const KROGH = { pmid: '16993405', authors: 'Krogh A', title: 'The number and distribution of capillaries in muscles with calculations of the oxygen pressure head necessary for supplying the tissue.', source: 'J Physiol', pubDate: '1919-05-20', pmcid: 'PMC1402716', verifiedOn: '2026-11-13' }
const KROGH_SUMMARY = { uid: '16993405', pubdate: '1919 May 20', sortfirstauthor: 'Krogh A', title: KROGH.title, articleids: [{ idtype: 'pubmed', value: '16993405' }, { idtype: 'pmc', value: 'PMC1402716' }] }
const CHAPTER = { pmid: '30844199', authors: 'Denault D, Khalil B', title: 'Physiology, Baroreceptors.', book: 'StatPearls', publisher: 'StatPearls Publishing', pubDate: '2026-08-07', nbk: 'NBK538172', verifiedOn: '2026-11-13' }
const CHAPTER_SUMMARY = { uid: '30844199', pubdate: '2031 Jan', sortfirstauthor: 'Denault D', title: 'Physiology, Baroreceptors', booktitle: 'StatPearls', articleids: [{ idtype: 'pubmed', value: '30844199' }, { idtype: 'bookaccession', value: 'NBK538172' }] }

test('judul: markup, tanda baca, huruf besar dan angka menempel tidak membuat judul berbeda', () => {
  assert.deepEqual(tokens('The Lymphatic Vasculature in the 21<sup>st</sup> Century'), tokens('the lymphatic vasculature in the 21(st) century.'))
  assert.equal(sameTitle('β2-Adrenoceptor Function in Asthma.', 'beta2-adrenoceptor function in asthma'), true)
  assert.equal(sameTitle('[Ventricular contractility: Physiology and clinical projection].', 'Ventricular contractility: physiology and clinical projection'), true)
  assert.deepEqual(tokens(undefined), [])
})

test('judul batas: judul pendek harus sama persis; judul panjang menoleransi satu kata, bukan makalah lain', () => {
  assert.equal(sameTitle('Hypothyroidism.', 'Hypothyroidism'), true)
  assert.equal(sameTitle('Hypothyroidism.', 'Hyperthyroidism.'), false)
  assert.equal(sameTitle('Gas Exchange in the Lung.', 'Gas exchange and ventilation-perfusion relationships in the lung.'), false)
  const long = 'Vessel-specific coronary perfusion territories using a CT angiogram with a minimum cost path technique'
  assert.equal(sameTitle(long, `${long} revisited`), true)
  assert.equal(sameTitle(long, 'Effect of Na+- or Ca2+-filled liposomes on electrical activity of cultured heart cells.'), false)
  assert.equal(sameTitle('', ''), false)
  // judul pendek yang hampir sama tetap makalah lain, walau irisan katanya 4 dari 5
  assert.equal(sameTitle('Disorders of lymph flow.', 'Disorders of lymph flow regulation.'), false)
  // dua judul panjang yang berbagi separuh kata bukan makalah yang sama
  assert.equal(sameTitle('Gas exchange and ventilation-perfusion relationships in the lung.', 'Gas exchange and ventilation mechanics in the injured lung during anesthesia'), false)
})

test('bandingkan: artikel jurnal, alias PMC dan bab buku yang cocok tidak punya ketidakcocokan', () => {
  assert.deepEqual(compareEntry(ENTRY, SUMMARY), [])
  assert.deepEqual(compareEntry(KROGH, KROGH_SUMMARY), [])
  // bab buku: tahun NCBI (2031) berbeda dari ledger (2026) dan tetap diterima, karena bab diperbarui terus
  assert.deepEqual(compareEntry(CHAPTER, CHAPTER_SUMMARY), [])
})

test('bandingkan: rekaman tidak ada atau galat ditolak sebagai tidak ditemukan', () => {
  assert.deepEqual(rules(compareEntry(ENTRY, undefined)), ['daring-tidak-ditemukan'])
  assert.deepEqual(rules(compareEntry(ENTRY, { uid: '6638199', error: 'cannot get document summary' })), ['daring-tidak-ditemukan'])
  assert.deepEqual(rules(compareEntry(ENTRY, { uid: '6638199' })), ['daring-tidak-ditemukan'])
})

test('bandingkan: entri ledger karangan tertangkap — judul, penulis pertama dan tahun masing-masing dengan namanya', () => {
  // ledger mengaku PMID 6638198 adalah Sunagawa; NCBI mengembalikan makalah liposom Bkaily
  const fabricated = { ...ENTRY, pmid: '6638198' }
  const truth = { uid: '6638198', pubdate: '1983 Nov', sortfirstauthor: 'Bkaily G', title: 'Effect of Na+- or Ca2+-filled liposomes on electrical activity of cultured heart cells.', articleids: [{ idtype: 'doi', value: '10.1152/ajpheart.1983.245.5.H756' }] }
  assert.deepEqual(rules(compareEntry(fabricated, truth)), ['daring-judul-berbeda', 'daring-penulis-berbeda', 'daring-doi-berbeda'])
  assert.deepEqual(rules(compareEntry(ENTRY, { ...SUMMARY, sortfirstauthor: 'Sagawa K' })), ['daring-penulis-berbeda'])
  assert.deepEqual(rules(compareEntry(ENTRY, { ...SUMMARY, pubdate: '1984 Jan' })), ['daring-tahun-berbeda'])
  assert.match(compareEntry(fabricated, truth)[0].message, /PMID 6638198 — ledger says "Left ventricular.*NCBI says "Effect of Na/)
})

test('bandingkan: penulis pertama dibaca dari daftar penulis bila sortfirstauthor kosong', () => {
  assert.deepEqual(compareEntry(ENTRY, { ...SUMMARY, sortfirstauthor: '' }), [])
  assert.deepEqual(rules(compareEntry(ENTRY, { ...SUMMARY, sortfirstauthor: '', authors: [] })), ['daring-penulis-berbeda'])
})

test('bandingkan DOI: berbeda ditolak; NCBI tanpa DOI diterima; huruf besar-kecil diabaikan', () => {
  const withDoi = (value) => ({ ...SUMMARY, articleids: [{ idtype: 'doi', value }] })
  assert.deepEqual(rules(compareEntry(ENTRY, withDoi('10.1152/ajpheart.1983.245.5.H756'))), ['daring-doi-berbeda'])
  assert.deepEqual(compareEntry(ENTRY, withDoi('10.1152/AJPHEART.1983.245.5.h773')), [])
  assert.deepEqual(compareEntry(ENTRY, { ...SUMMARY, articleids: [] }), [])
})

test('bandingkan alias: PMCID dan NBK yang tidak tercantum di NCBI ditolak, tanpa asumsi', () => {
  assert.deepEqual(rules(compareEntry(KROGH, { ...KROGH_SUMMARY, articleids: [{ idtype: 'pmc', value: 'PMC1402719' }] })), ['daring-pmcid-berbeda'])
  assert.deepEqual(rules(compareEntry(KROGH, { ...KROGH_SUMMARY, articleids: undefined })), ['daring-pmcid-berbeda'])
  assert.deepEqual(rules(compareEntry(CHAPTER, { ...CHAPTER_SUMMARY, articleids: [{ idtype: 'bookaccession', value: 'NBK537171' }] })), ['daring-nbk-berbeda'])
  // bentuk lain yang juga memuat pengenalnya tetap diterima
  assert.deepEqual(compareEntry(KROGH, { ...KROGH_SUMMARY, articleids: [{ idtype: 'pmcid', value: 'pmc-id: PMC1402716;' }] }), [])
})

const ledgerOf = (...entries) => ({ schemaVersion: 1, entries })
const bodyFor = (...summaries) => ({ result: Object.fromEntries(summaries.map((s) => [s.uid, s])) })

test('verifikasi: semua cocok, dibagi per batch, dan URL hanya memuat PMID serta nama alat generik', async () => {
  const urls = []
  const fetchJson = async (url) => { urls.push(url); return bodyFor(SUMMARY, KROGH_SUMMARY, CHAPTER_SUMMARY) }
  const result = await verifyLedger({ ledger: ledgerOf(ENTRY, KROGH, CHAPTER), fetchJson, sleep: async () => {}, batchSize: 2 })
  assert.deepEqual(result, { checked: 3, mismatches: [], inconclusive: [] })
  assert.deepEqual(urls, [
    `${ESUMMARY}?db=pubmed&retmode=json&tool=citation-ledger-check&id=6638199,16993405`,
    `${ESUMMARY}?db=pubmed&retmode=json&tool=citation-ledger-check&id=30844199`,
  ])
  assert.equal(exitCodeOf(result), 0)
})

test('verifikasi: 429 lalu berhasil dicoba ulang dengan jeda yang membesar', async () => {
  const waits = []
  let calls = 0
  const fetchJson = async () => {
    calls += 1
    if (calls <= 2) throw Object.assign(new Error('HTTP 429'), { status: 429 })
    return bodyFor(SUMMARY)
  }
  const result = await verifyLedger({ ledger: ledgerOf(ENTRY), fetchJson, sleep: async (ms) => { waits.push(ms) } })
  assert.equal(calls, 3)
  assert.deepEqual(waits, [1000, 2000])
  assert.deepEqual(result, { checked: 1, mismatches: [], inconclusive: [] })
})

test('verifikasi: NCBI tak terjangkau = tidak terputuskan, tidak pernah dianggap cocok', async () => {
  let calls = 0
  const down = async () => { calls += 1; throw new Error('getaddrinfo ENOTFOUND') }
  const result = await verifyLedger({ ledger: ledgerOf(ENTRY, KROGH), fetchJson: down, sleep: async () => {}, attempts: 3 })
  assert.equal(calls, 3)
  assert.equal(result.checked, 0)
  assert.deepEqual(result.mismatches, [])
  assert.deepEqual(result.inconclusive.map((item) => item.pmid), ['6638199', '16993405'])
  assert.equal(exitCodeOf(result), 2)
})

test('verifikasi: galat klien (400) tidak dicoba ulang; badan tanpa result tidak terputuskan', async () => {
  let calls = 0
  const bad = async () => { calls += 1; throw Object.assign(new Error('HTTP 400'), { status: 400 }) }
  const refused = await verifyLedger({ ledger: ledgerOf(ENTRY), fetchJson: bad, sleep: async () => {} })
  assert.equal(calls, 1)
  assert.deepEqual(refused.inconclusive.map((item) => item.reason), ['400: HTTP 400'])
  const empty = await verifyLedger({ ledger: ledgerOf(ENTRY), fetchJson: async () => ({ header: {} }), sleep: async () => {} })
  assert.deepEqual(empty.inconclusive.map((item) => item.reason), ['response had no result object'])
})

test('verifikasi: ketidakcocokan mengalahkan tidak-terputuskan pada kode keluar', async () => {
  const fetchJson = async (url) => {
    if (url.endsWith('id=6638199')) return bodyFor({ ...SUMMARY, title: 'A different paper about something else entirely.' })
    throw new Error('timeout')
  }
  const result = await verifyLedger({ ledger: ledgerOf(ENTRY, KROGH), fetchJson, sleep: async () => {}, batchSize: 1, attempts: 1 })
  assert.deepEqual(rules(result.mismatches), ['daring-judul-berbeda'])
  assert.equal(result.inconclusive.length, 1)
  assert.equal(exitCodeOf(result), 1)
  assert.equal(exitCodeOf({ mismatches: [], inconclusive: [] }), 0)
})

const BKAILY = { uid: '6638198', pubdate: '1983 Nov', sortfirstauthor: 'Bkaily G', title: 'Effect of Na+- or Ca2+-filled liposomes on electrical activity of cultured heart cells.', articleids: [] }

test('kenari: pasangan yang diketahui salah tertangkap, dan hanya PMID kenari yang dikirim', async () => {
  const urls = []
  const state = await verifyCanary({ fetchJson: async (url) => { urls.push(url); return bodyFor(BKAILY) }, sleep: async () => {} })
  assert.deepEqual(state, { state: 'tertangkap', reason: '' })
  assert.deepEqual(urls, [`${ESUMMARY}?db=pubmed&retmode=json&tool=citation-ledger-check&id=6638198`])
  assert.equal(CANARY.pmid, '6638198')
})

test('kenari: bila pasangan salah itu lolos, hasil bersih tidak dipercaya (kode keluar 1)', async () => {
  // NCBI tiruan mengembalikan rekaman yang cocok dengan klaim salah: pemeriksa tidak lagi bisa membedakan
  const agreeing = { uid: '6638198', pubdate: '1983 Nov', sortfirstauthor: 'Sunagawa K', title: CANARY.title, articleids: [] }
  const passed = await verifyCanary({ fetchJson: async () => bodyFor(agreeing), sleep: async () => {} })
  assert.equal(passed.state, 'lolos')
  assert.equal(exitCodeOf({ mismatches: [], inconclusive: [] }, passed), 1)
  // hanya judul yang berbeda belum cukup: kenari menuntut judul DAN penulis pertama berbeda
  const half = await verifyCanary({ fetchJson: async () => bodyFor({ ...agreeing, title: BKAILY.title }), sleep: async () => {} })
  assert.equal(half.state, 'lolos')
  assert.match(half.reason, /got \[daring-judul-berbeda\]/)
})

test('kenari: NCBI tak terjangkau atau rekaman hilang = tidak terputuskan / lolos, tidak pernah lulus diam-diam', async () => {
  const down = await verifyCanary({ fetchJson: async () => { throw new Error('ENOTFOUND') }, sleep: async () => {}, attempts: 2 })
  assert.equal(down.state, 'tidak-terputuskan')
  assert.equal(exitCodeOf({ mismatches: [], inconclusive: [] }, down), 2)
  const missing = await verifyCanary({ fetchJson: async () => ({ result: {} }), sleep: async () => {} })
  assert.equal(missing.state, 'lolos')
  assert.equal(exitCodeOf({ mismatches: [], inconclusive: [] }, { state: 'tertangkap' }), 0)
  assert.equal(exitCodeOf({ mismatches: [], inconclusive: [] }), 0)
})

const runWith = async (fetchJson) => {
  const out = []
  const err = []
  const code = await run({ ledger: ledgerOf(ENTRY, KROGH), fetchJson, sleep: async () => {}, log: (line) => out.push(line), error: (line) => err.push(line) })
  return { code, out, err }
}
const ncbi = (canaryRecord, patch = {}) => async (url) => (url.endsWith('id=6638198') ? bodyFor(canaryRecord) : bodyFor({ ...SUMMARY, ...patch }, KROGH_SUMMARY))

test('jalankan: ledger cocok dan kenari tertangkap = kode 0, satu baris laporan, tanpa galat', async () => {
  const { code, out, err } = await runWith(ncbi(BKAILY))
  assert.equal(code, 0)
  assert.deepEqual(err, [])
  assert.deepEqual(out, ['citation-ledger-online: 2/2 entries re-resolved against NCBI, 0 mismatches, 0 inconclusive; known-wrong canary: tertangkap'])
})

test('jalankan: kenari lolos membuat run gagal walau ledger cocok', async () => {
  const { code, err } = await runWith(ncbi({ uid: '6638198', pubdate: '1983 Nov', sortfirstauthor: 'Sunagawa K', title: CANARY.title, articleids: [] }))
  assert.equal(code, 1)
  assert.equal(err.length, 1)
  assert.match(err[0], /daring-kenari-lolos: a pairing known to be wrong \(PMID 6638198/)
})

test('jalankan: entri tidak cocok dilaporkan dengan namanya dan kode 1', async () => {
  const { code, err, out } = await runWith(ncbi(BKAILY, { sortfirstauthor: 'Sagawa K' }))
  assert.equal(code, 1)
  assert.match(err[0], /daring-penulis-berbeda: PMID 6638199/)
  assert.match(out[0], /1 mismatches, 0 inconclusive; known-wrong canary: tertangkap/)
})

test('jalankan: NCBI tak terjangkau = kode 2 dan dua baris "NOT a pass" (ledger dan kenari)', async () => {
  const { code, err, out } = await runWith(async () => { throw Object.assign(new Error('HTTP 400'), { status: 400 }) })
  assert.equal(code, 2)
  assert.equal(err.length, 2)
  assert.match(err[0], /daring-tidak-terputuskan: 2 entries could not be checked \(400: HTTP 400\) — this is NOT a pass/)
  assert.match(err[1], /daring-tidak-terputuskan: the canary could not be checked/)
  assert.match(out[0], /0\/2 entries re-resolved/)
})

test('workflow: pemeriksa daring berjalan saat ledger berubah, terjadwal, dan hanya dengan izin baca', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/citation-ledger-online.yml', import.meta.url), 'utf8')
  assert.match(workflow, /pull_request:\s*\n\s*paths:\s*\n(\s*- .*\n)*\s*- 'governance\/LITERATURE_CITATION_LEDGER\.json'/)
  assert.match(workflow, /schedule:\s*\n\s*- cron:/)
  assert.match(workflow, /permissions:\s*\n\s*contents: read\b/)
  assert.doesNotMatch(workflow, /contents:\s*write|write-all|pull_request_target|continue-on-error/)
  assert.match(workflow, /run: node scripts\/qa\/citation-ledger-online\.mjs/)
})
