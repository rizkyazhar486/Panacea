// Uji gerbang ledger sitasi: fungsi murni (positif, negatif, batas, berpasangan), regresi untuk sembilan sitasi
// salah yang pernah ada di main, lalu keadaan repo nyata.
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  anchorsOf, auditCitations, bindingOf, DEBT_PATH, fold, identifiersOnLine, LEDGER_PATH, readJson, readSources,
  validateLedger,
} from './citation-ledger.mjs'

const ids = (line) => identifiersOnLine(line).map(({ kind, id }) => `${kind}:${id}`)
const rules = (violations) => violations.map((v) => v.rule)
const SUNAGAWA = { pmid: '6638199', authors: 'Sunagawa K, Maughan WL, Burkhoff D, et al.', title: 'Left ventricular interaction with arterial load studied in isolated canine ventricle.', source: 'Am J Physiol', pubDate: '1983-11', verifiedOn: '2026-11-13' }
const WOOLF = { pmid: '20961685', authors: 'Woolf CJ', title: 'Central sensitization: implications for the diagnosis and treatment of pain.', source: 'Pain', pubDate: '2011-03', pmcid: 'PMC3268359', verifiedOn: '2026-11-13' }
const BARO = { pmid: '30844199', authors: 'Denault D, Khalil B', title: 'Physiology, Baroreceptors.', book: 'StatPearls', publisher: 'StatPearls Publishing', pubDate: '2026-08-07', nbk: 'NBK538172', verifiedOn: '2026-11-13' }
const ledgerOf = (...entries) => ({ schemaVersion: 1, entries })

test('pengenal: bentuk teks, field, helper, URL, PMCID dan NBK semuanya terbaca', () => {
  assert.deepEqual(ids(' *   Am J Physiol. 1983;245(5):H773-H780. PMID: 6638199.'), ['pmid:6638199'])
  assert.deepEqual(ids("  pmid: '6638199',"), ['pmid:6638199'])
  assert.deepEqual(ids("evidence: [pubmed('19864948', 'Review'), pubmed('33833078', 'Review')]"), ['pmid:19864948', 'pmid:33833078'])
  assert.deepEqual(ids("{ kind: 'pubmed', id: '29524268', url: 'https://pubmed.ncbi.nlm.nih.gov/29524268/' }"), ['pmid:29524268', 'pmid:29524268'])
  assert.deepEqual(ids("{ pmid: '25201553', pmcid: 'PMC6932424', originalPmid: '11815441' }"), ['pmcid:PMC6932424', 'pmid:25201553', 'pmid:11815441'])
  assert.deepEqual(ids("reference: 'NCBI Bookshelf NBK538336 / PMID 30855920'"), ['nbk:NBK538336', 'pmid:30855920'])
})

test('pengenal: angka di DOI, ISBN, desimal dan baris tanpa PubMed tidak terbaca sebagai PMID', () => {
  assert.deepEqual(ids("pmid: '36375827', doi: '10.1136/bmj-2022-070750'"), ['pmid:36375827'])
  assert.deepEqual(ids("pmidOrDoi: 'ISBN: 978-0323597128' // PubMed has no record"), [])
  assert.deepEqual(ids('PubMed has no record; ISBN 978-0-323-59712-8'), [])
  assert.deepEqual(ids("modality: study['00080060']?.Value?.[0] ?? 'CT',"), [])
  assert.deepEqual(ids('PMID 6638199 reports a slope of 1.00412 and 0.98500'), ['pmid:6638199'])
  assert.deepEqual(identifiersOnLine(undefined), [])
  assert.deepEqual(identifiersOnLine(''), [])
})

test('pengenal batas: 5 dan 8 digit diterima, 4 dan 9 digit ditolak', () => {
  assert.deepEqual(ids('PMID 35496'), ['pmid:35496'])
  assert.deepEqual(ids('PMID 3549'), [])
  assert.deepEqual(ids('PMID 41979536'), ['pmid:41979536'])
  assert.deepEqual(ids('PMID 419795361'), [])
})

test('fold: diakritik hilang, camelCase dipecah, huruf Yunani dieja', () => {
  assert.equal(fold('Farré'), 'farre')
  assert.equal(fold('CoronaryBranch'), 'coronary branch')
  assert.equal(fold('β2-adrenoceptor').replace(/\s+/g, ' ').trim(), 'beta 2-adrenoceptor')
  assert.equal(fold(null), '')
})

test('jangkar: nama keluarga panjang berdiri sendiri, yang pendek butuh inisial, kolektif dan et al. dilewati', () => {
  assert.deepEqual(anchorsOf(SUNAGAWA).surnames, ['sunagawa', 'maughan', 'burkhoff'])
  assert.deepEqual(anchorsOf({ authors: 'Cho NH, Lee MW, McPhee RW, et al.', title: 'x' }).surnames, ['cho nh', 'lee mw', 'mc phee'])
  assert.deepEqual(anchorsOf({ authors: '2019-nCoV National Incident Room Surveillance Team', title: 'x' }).surnames, [])
  assert.deepEqual(anchorsOf({ authors: 'Woolf CJ', title: 'Central sensitization: implications for the diagnosis and treatment of pain.' }).titleWords, ['central', 'sensitization', 'pain'])
  assert.deepEqual(anchorsOf(undefined), { surnames: [], titleWords: [] })
})

test('ikatan: lolos lewat penulis, atau lewat dua kata judul; satu kata judul saja ditolak', () => {
  assert.equal(bindingOf(WOOLF, 'including Woolf plasticity (PMID: 20961685)').ok, true)
  assert.equal(bindingOf(WOOLF, 'central sensitization of dorsal horn neurons, PMID 20961685').ok, true)
  // kembaran: hanya berbeda satu kata judul
  assert.equal(bindingOf(WOOLF, 'sensitization of dorsal horn neurons, PMID 20961685').ok, false)
  assert.equal(bindingOf(WOOLF, '').ok, false)
  assert.equal(bindingOf(WOOLF, undefined).ok, false)
})

test('ikatan batas: judul satu kata cukup satu kata; nama pendek tanpa inisial tidak mengikat', () => {
  const oneWord = { authors: 'Chaker L, Bianco AC, Jonklaas J, et al.', title: 'Hypothyroidism.' }
  assert.equal(bindingOf(oneWord, 'overt hypothyroidism review, PMID 28336049').ok, true)
  assert.equal(bindingOf(oneWord, 'thyroid review, PMID 28336049').ok, false)
  const short = { authors: 'Cho NH', title: 'OpenCell: Endogenous tagging for the cartography of human cellular organization.' }
  assert.equal(bindingOf(short, 'Cho NH et al., PMID 35271311').ok, true)
  assert.equal(bindingOf(short, 'the echo of a cho rus, PMID 35271311').ok, false)
})

test('ikatan: entri tanpa jangkar sama sekali tidak pernah terikat, apa pun konteksnya', () => {
  // judul hanya berisi kata umum dan penulisnya tidak disebut: tidak ada yang bisa dicocokkan
  const anchorless = { authors: 'Anonymous', title: 'A review of clinical studies.' }
  assert.deepEqual(anchorsOf(anchorless).titleWords, [])
  assert.equal(bindingOf(anchorless, 'any text at all near PMID 12345678').ok, false)
  assert.equal(bindingOf({ authors: '', title: '' }, 'any text at all').ok, false)
  // kembaran: begitu penulisnya disebut, entri yang sama terikat
  assert.equal(bindingOf(anchorless, 'Anonymous, PMID 12345678').ok, true)
})

// Sembilan sitasi salah yang pernah ada di main: konteks asli + apa yang PubMed catat untuk pengenal itu.
// Gerbang harus menolak masing-masing, dan menerima kembarannya yang sudah dibetulkan.
const HISTORICAL = [
  ['sunagawa', ' * - Sunagawa K, et al. Left ventricular interaction with arterial load studied in isolated canine ventricle.\n *   Am J Physiol. 1983;245(5):H773-H780. PMID: 6638198.',
    { authors: 'Bkaily G, Sperelakis N, Elishalom Y, et al.', title: 'Effect of Na+- or Ca2+-filled liposomes on electrical activity of cultured heart cells.' }, SUNAGAWA],
  ['woolf', 'Mechanistic simulation of visceral afferent nociceptive convergence onto second-order spinothalamic neurons,\nincluding Woolf central sensitization plasticity (PMID: 21415174).',
    { authors: 'Murgatroyd SR, Ferguson C, Ward SA, et al.', title: 'Pulmonary O2 uptake kinetics as a determinant of high-intensity exercise tolerance in humans.' }, WOOLF],
  ['robinson', ' * - Robinson RO, Herzog W, Nigg BM. J Manipulative Physiol Ther. 1987;10(4):172-176. PMID: 3655546.',
    { authors: 'West JF, Idol L', title: 'School consultation (Part I): An interdisciplinary perspective on theory, models, and research.' },
    { authors: 'Robinson RO, Herzog W, Nigg BM', title: 'Use of force platform variables to quantify the effects of chiropractic manipulation on gait symmetry.' }],
  ['carter', ' * - Carter FJ, et al. Measurements of the in vivo properties of human liver and spleen. Med Image Anal. 2001;5(4):249-261. PMID: 11731275.',
    { authors: 'Chen Y, Sumiyoshi H, Oxford JT, et al.', title: 'Cis-acting elements regulate alternative splicing of exons 6A, 6B and 8 of the alpha1(XI) collagen gene and contribute to the regional diversification of collagen XI matrices.' },
    { authors: 'Carter FJ, Frank TG, Davies PJ, et al.', title: 'Measurements and modelling of the compliance of human and porcine organs.' }],
  ['weibel', "    authors: 'Weibel ER; West JB, Luks AM',\n    title: 'Morphometry of the Human Lung & West’s Respiratory Physiology (11th ed.)',\n    publication: 'Academic Press / Wolters Kluwer',\n    pmidOrDoi: 'PMID: 13999517 · PMC6269087',",
    { authors: 'WEIBULL C, LUNDIN BM', title: 'Morphology of pleuropneumonia-like organisms and bacterial L forms grown in liquid media.' },
    { authors: 'WEIBEL ER, GOMEZ DM', title: 'Architecture of the human lung. Use of quantitative methods establishes fundamental relations between size and number of lung structures.' }],
  ['baroreflex', "    id: 'pmid-24095187',\n    reference: 'PMID 24095187',\n    role: 'Review anchor for arterial baroreflex control of sympathetic and parasympathetic cardiovascular outflow.',",
    { authors: 'Watts G', title: 'Jeremy Farrar: Wellcome arrival from southeast Asia.' },
    { authors: 'Lanfranchi PA, Somers VK', title: 'Arterial baroreflex function and cardiovascular variability: interactions and implications.' }],
  ['hpg-axis', "evidence: [{ kind: 'pubmed', id: '32027812', note: 'Review describes neuroendocrine control of reproductive function through the hypothalamic-pituitary-gonadal axis.' }],",
    { authors: '2019-nCoV National Incident Room Surveillance Team', title: '2019-nCoV acute respiratory disease, Australia: Epidemiology Report 1 (Reporting week 26 January - 1 February 2020).' },
    { authors: 'Acevedo-Rodriguez A, Kauffman AS, Cherrington BD, et al.', title: 'Emerging insights into hypothalamic-pituitary-gonadal axis regulation and interaction with stress signalling.' }],
  ['gnrh', "evidence: [{ kind: 'pubmed', id: '35107214', note: 'Review discusses GnRH agonist and antagonist pharmacology in reproductive endocrine contexts.' }],",
    { authors: 'Hwang J, Jung Y, Moon S, et al.', title: 'Nanodisc-Mediated Conversion of Virustatic Antiviral Antibody to Disrupt Virus Envelope in Infected Cells.' },
    { authors: 'Griesinger G, Felberbaum R, Diedrich K', title: 'GnRH-antagonists in reproductive medicine.' }],
  ['endometriosis', "evidence: [{ kind: 'pubmed', id: '37163911', note: 'Review summarizes inflammatory, endocrine, immune, and tissue-remodeling mechanisms implicated in endometriosis.' }],",
    { authors: 'Ye X, Zheng T, Zhang W, et al.', title: 'Membrane engineering of Escherichia coli based on "Building bridges" and "Digging tunnels" to improve electro-fermentation of succinate.' },
    { authors: 'Burney RO, Giudice LC', title: 'Pathogenesis and pathophysiology of endometriosis.' }],
]
for (const [name, context, whatThatIdReallyIs, whatWasMeant] of HISTORICAL) {
  test(`regresi ${name}: konteks asli tidak terikat pada makalah yang sebenarnya ditunjuk pengenal lama`, () => {
    assert.equal(bindingOf(whatThatIdReallyIs, context).ok, false)
  })
  test(`regresi ${name}: konteks yang sama terikat pada makalah yang dimaksud`, () => {
    assert.equal(bindingOf(whatWasMeant, context).ok, true)
  })
}

test('ledger: bentuk yang benar tidak punya pelanggaran', () => {
  assert.deepEqual(validateLedger(ledgerOf(SUNAGAWA, WOOLF, BARO), { today: '2026-11-13' }), [])
})

test('ledger: skema rusak ditolak dengan nama, tanpa memeriksa entri', () => {
  for (const broken of [null, [], { schemaVersion: 2, entries: [] }, { schemaVersion: 1, entries: 'x' }]) {
    assert.deepEqual(rules(validateLedger(broken, { today: '2026-11-13' })), ['ledger-skema'])
  }
  assert.deepEqual(rules(validateLedger(ledgerOf(SUNAGAWA), { today: 'kemarin' })), ['ledger-skema'])
  assert.deepEqual(rules(validateLedger(ledgerOf(SUNAGAWA), {})), ['ledger-skema'])
})

test('ledger: pengenal berformat salah ditolak (pmid, pmcid, nbk, doi)', () => {
  const check = (patch) => rules(validateLedger(ledgerOf({ ...WOOLF, ...patch }), { today: '2026-11-13' }))
  assert.deepEqual(check({ pmid: 20961685 }), ['ledger-format-id'])
  assert.deepEqual(check({ pmid: '2096168x' }), ['ledger-format-id'])
  assert.deepEqual(check({ pmid: '123456789' }), ['ledger-format-id'])
  assert.deepEqual(check({ pmcid: '3268359' }), ['ledger-format-id'])
  assert.deepEqual(check({ nbk: 'BK538172' }), ['ledger-format-id'])
  assert.deepEqual(check({ doi: 'doi:10.1016/j.pain.2010.09.030' }), ['ledger-format-id'])
  assert.deepEqual(check({ doi: '10.1016/j.pain.2010.09.030' }), [])
})

test('ledger: entri tidak lengkap ditolak; kembarannya yang lengkap diterima', () => {
  const check = (entry) => rules(validateLedger(ledgerOf(entry), { today: '2026-11-13' }))
  assert.deepEqual(check({ ...SUNAGAWA, title: '  ' }), ['ledger-entri-tidak-lengkap'])
  assert.deepEqual(check({ ...SUNAGAWA, authors: undefined }), ['ledger-entri-tidak-lengkap'])
  assert.deepEqual(check({ ...SUNAGAWA, source: undefined }), ['ledger-entri-tidak-lengkap'])
  assert.deepEqual(check({ ...SUNAGAWA, source: undefined, book: 'StatPearls' }), [])
  assert.deepEqual(check({ ...SUNAGAWA, pubDate: 'Nov 1983' }), ['ledger-entri-tidak-lengkap'])
  assert.deepEqual(check({ ...SUNAGAWA, pubDate: '1983' }), [])
})

test('ledger batas tanggal verifikasi: hari ini diterima, besok ditolak, tanggal mustahil ditolak', () => {
  const check = (verifiedOn) => rules(validateLedger(ledgerOf({ ...SUNAGAWA, verifiedOn }), { today: '2026-11-13' }))
  assert.deepEqual(check('2026-11-13'), [])
  assert.deepEqual(check('2026-11-14'), ['ledger-tanggal-verifikasi'])
  assert.deepEqual(check('2026-02-30'), ['ledger-tanggal-verifikasi'])
  assert.deepEqual(check(undefined), ['ledger-tanggal-verifikasi'])
})

test('ledger: duplikat dan urutan menurun ditolak', () => {
  assert.deepEqual(rules(validateLedger(ledgerOf(SUNAGAWA, { ...WOOLF, pmcid: undefined }, { ...WOOLF }), { today: '2026-11-13' })), ['ledger-duplikat', 'ledger-urutan'])
  assert.deepEqual(rules(validateLedger(ledgerOf(WOOLF, SUNAGAWA), { today: '2026-11-13' })), ['ledger-urutan'])
  assert.deepEqual(rules(validateLedger(ledgerOf(SUNAGAWA, WOOLF, { ...BARO, pmcid: 'PMC3268359' }), { today: '2026-11-13' })), ['ledger-duplikat'])
})

const SOURCE = { path: 'src/a.ts', text: ' * Sunagawa K, et al. Am J Physiol. 1983. PMID: 6638199.\nconst provenance = { pmid: \'6638199\' }\n' }

test('audit: sitasi terdaftar dan terikat lolos; rujukan singkat berikutnya di berkas yang sama mewarisi', () => {
  const far = { path: 'src/a.ts', text: ` * Sunagawa K. PMID: 6638199.\n${'\n'.repeat(40)}const p = { pmid: '6638199' }\n` }
  for (const source of [SOURCE, far]) {
    const result = auditCitations({ sources: [source], ledger: ledgerOf(SUNAGAWA), debt: { identifiers: [] } })
    assert.deepEqual(result.violations, [])
    assert.equal(result.occurrences, 2)
  }
})

test('audit: pengenal yang tidak ada di ledger maupun utang ditolak; kembarannya di daftar utang diterima', () => {
  const source = { path: 'src/b.ts', text: 'PMID: 12345678 (Someone 2020)' }
  const refused = auditCitations({ sources: [source], ledger: ledgerOf(), debt: { identifiers: [] } })
  assert.deepEqual(rules(refused.violations), ['sitasi-tidak-terdaftar'])
  assert.match(refused.violations[0].message, /src\/b\.ts:1 cites pmid:12345678/)
  assert.deepEqual(auditCitations({ sources: [source], ledger: ledgerOf(), debt: { identifiers: ['pmid:12345678'] } }).violations, [])
})

test('audit: pengenal yang tertukar gagal ikatan dengan nama aturan dan lokasi', () => {
  const swapped = { path: 'src/c.ts', text: ' * Sunagawa K, et al. Left ventricular interaction with arterial load. PMID: 20961685.' }
  const result = auditCitations({ sources: [swapped, SOURCE, { path: 'src/d.ts', text: 'Woolf CJ. Pain 2011. PMID 20961685' }], ledger: ledgerOf(SUNAGAWA, WOOLF), debt: { identifiers: [] } })
  assert.deepEqual(rules(result.violations), ['sitasi-tidak-cocok-konteks'])
  assert.equal(result.violations[0].path, 'src/c.ts')
  assert.equal(result.violations[0].line, 1)
})

test('audit: PMCID dan NBK diperiksa sebagai alias entri; alias asing ditolak', () => {
  const ok = { path: 'src/e.ts', text: "Woolf CJ: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3268359/'\nDenault, baroreceptors: NBK538172" }
  assert.deepEqual(auditCitations({ sources: [ok], ledger: ledgerOf(WOOLF, BARO), debt: { identifiers: [] } }).violations, [])
  const foreign = { path: 'src/e.ts', text: "Woolf CJ: PMC3268359 and PMC1402719\nDenault: NBK538172 and NBK537171" }
  assert.deepEqual(rules(auditCitations({ sources: [foreign], ledger: ledgerOf(WOOLF, BARO), debt: { identifiers: [] } }).violations), ['sitasi-tidak-terdaftar', 'sitasi-tidak-terdaftar'])
})

test('audit: utang basi, daftar utang tak terurut, dan berkas utang tanpa daftar ditolak', () => {
  const run = (debt) => rules(auditCitations({ sources: [SOURCE, { path: 'src/f.ts', text: 'PMID 11111111, PMID 22222222' }], ledger: ledgerOf(SUNAGAWA), debt }).violations)
  assert.deepEqual(run({ identifiers: ['pmid:11111111', 'pmid:22222222'] }), [])
  assert.deepEqual(run({ identifiers: ['pmid:11111111', 'pmid:22222222', 'pmid:33333333'] }), ['utang-sitasi-basi'])
  assert.deepEqual(run({ identifiers: ['pmid:11111111', 'pmid:22222222', 'pmid:6638199'] }), ['utang-sitasi-basi'])
  assert.deepEqual(run({ identifiers: ['pmid:22222222', 'pmid:11111111'] }), ['utang-sitasi-skema'])
  assert.deepEqual(run({}), ['utang-sitasi-skema', 'sitasi-tidak-terdaftar', 'sitasi-tidak-terdaftar'])
})

test('audit: entri ledger yang tidak dikutip siapa pun ditolak', () => {
  const result = auditCitations({ sources: [SOURCE], ledger: ledgerOf(SUNAGAWA, WOOLF), debt: { identifiers: [] } })
  assert.deepEqual(rules(result.violations), ['ledger-entri-yatim'])
  assert.match(result.violations[0].message, /PMID 20961685/)
})

// Plafon utang: jumlah pengenal yang belum diverifikasi. HANYA BOLEH DITURUNKAN, seiring verifikasi berjalan.
const DEBT_CEILING = 249

test('repo nyata: ledger sah, setiap sitasi terdaftar dan terikat, utang tidak melebihi plafon', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const ledger = readJson(root, LEDGER_PATH)
  const debt = readJson(root, DEBT_PATH)
  const today = new Date().toISOString().slice(0, 10)
  assert.deepEqual(validateLedger(ledger, { today }).map((v) => v.message), [])
  const result = auditCitations({ sources: readSources(root), ledger, debt })
  assert.deepEqual(result.violations.map((v) => v.message), [])
  assert.ok(ledger.entries.length >= 96, `ledger shrank to ${ledger.entries.length} verified works`)
  assert.ok(debt.identifiers.length <= DEBT_CEILING, `unverified citations grew to ${debt.identifiers.length}, ceiling is ${DEBT_CEILING}`)
})
