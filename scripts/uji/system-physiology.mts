// Fisiologi per sistem tubuh untuk panggung Body Exposure — satu mesin yang membaca sumber yang SUDAH ada di repo.
//   - pembaca sumber: setiap aturan penolakan diuji berpasangan (kasus yang diterima hanya berbeda pada kondisi itu);
//   - katalog bawaan: tidak ada sumber yang ditolak, 11 sistem lengkap, dan SETIAP sitasi yang ditampilkan sudah
//     terverifikasi di governance/LITERATURE_CITATION_LEDGER.json (diresolusi ke NCBI);
//   - perencana: gagal-tertutup bila katalog tidak mencakup setiap sistem; kopling dan celah dihitung dari data.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  citationFromReference,
  citationFromUrl,
  MIN_BOUNDARY_LENGTH,
  ORGAN_RELATIONSHIP_BOUNDARY,
  readEducationNetwork,
  readEducationSources,
  readOrganRelationships,
  readReferencedMechanism,
  type EducationNetworkLike,
  type EducationNodeLike,
  type OrganRelationshipLike,
  type PhysiologyMechanism,
} from '../../src/domains/body-exposure/engine/system-physiology/physiologySources.ts'
import { DOMAIN_PHYSIOLOGY, defaultPhysiologyCatalog } from '../../src/domains/body-exposure/engine/system-physiology/physiologyCatalog.ts'
import {
  checkCatalog,
  planSystemIndex,
  planSystemPhysiology,
  type SystemPhysiologyCatalog,
} from '../../src/domains/body-exposure/engine/system-physiology/systemPhysiology.ts'
import type { BodySystemId } from '../../src/domains/body-exposure/data/bodySystems.ts'
import { SYSTEM_SIMULATIONS, simulationsFor } from '../../src/domains/body-exposure/engine/system-physiology/systemSimulations.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const BATAS = 'Educational reference only; no person-level value, diagnosis or treatment is inferred here.'
const LABELS = new Map<BodySystemId, string>([['respiratory', 'Respiratory'], ['urinary', 'Urinary'], ['lymphatic-immune', 'Lymphatic / Immune']])
const node = (over: Partial<EducationNodeLike> = {}): EducationNodeLike => ({
  id: 'n1', label: 'Gas exchange', kind: 'physiology', evidenceState: 'literature-backed',
  evidence: [{ kind: 'pubmed', id: '37816345', url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/', note: 'Review.' }],
  boundary: BATAS, ...over,
})
const satuSumber = (n: EducationNodeLike, organ?: string) => readEducationSources([{ origin: 'x.ts', system: 'respiratory', ...(organ ? { organ } : {}), nodes: [n] }], LABELS)

// ── pembaca graf edukasi ──
gagal('graf_menerima_fisiologi_bersumber', () => {
  const hasil = satuSumber(node())
  assert.deepEqual(hasil.rejected, [])
  assert.deepEqual(hasil.mechanisms, [{
    id: 'n1', label: 'Gas exchange', systems: ['respiratory'], summary: [],
    citations: [{ kind: 'pubmed', id: '37816345', url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/', note: 'Review.' }],
    boundary: BATAS, origin: 'x.ts',
  }])
})
gagal('graf_menolak_klaim_literatur_tanpa_sumber', () => {
  for (const evidence of [[], undefined, [{ kind: 'atlas-source', id: 'visceral.glb', note: 'mesh' }], [{ kind: 'pubmed', id: 'abc', note: 'x' }], [{ kind: 'pubmed', id: '123456789', note: 'x' }]]) {
    const hasil = satuSumber(node({ evidence }))
    assert.deepEqual(hasil.mechanisms, [], JSON.stringify(evidence))
    assert.deepEqual(hasil.rejected, [{ id: 'n1', origin: 'x.ts', reason: 'literature-backed-without-source' }])
  }
  assert.equal(satuSumber(node({ evidence: [{ kind: 'pubmed', id: '12345678', note: 'x' }] })).mechanisms.length, 1, 'berpasangan: PMID 8 digit diterima')
})
gagal('graf_menolak_url_yang_menunjuk_id_lain', () => {
  const salah = satuSumber(node({ evidence: [{ kind: 'pubmed', id: '37816345', url: 'https://pubmed.ncbi.nlm.nih.gov/37816346/', note: 'x' }] }))
  assert.deepEqual(salah.rejected, [{ id: 'n1', origin: 'x.ts', reason: 'url-does-not-match-id' }])
  assert.deepEqual(salah.mechanisms, [])
  const tanpaUrl = satuSumber(node({ evidence: [{ kind: 'pubmed', id: '37816345', note: 'x' }] }))
  assert.equal(tanpaUrl.mechanisms[0].citations[0].url, 'https://pubmed.ncbi.nlm.nih.gov/37816345/', 'berpasangan: tanpa url → url kanonik dibangun dari id')
})
gagal('graf_batas_panjang_boundary', () => {
  const tepat = 'b'.repeat(MIN_BOUNDARY_LENGTH)
  assert.equal(satuSumber(node({ boundary: tepat })).mechanisms.length, 1, 'tepat di batas diterima')
  const kurang = satuSumber(node({ boundary: tepat.slice(1) }))
  assert.deepEqual(kurang.rejected, [{ id: 'n1', origin: 'x.ts', reason: 'boundary-missing' }], 'satu kurang ditolak')
  assert.deepEqual(satuSumber(node({ boundary: `   ${tepat.slice(3)}   ` })).rejected[0]?.reason, 'boundary-missing', 'spasi tidak dihitung')
})
gagal('graf_placeholder_menjadi_celah_bukan_mekanisme', () => {
  const sistemWide = satuSumber(node({ evidenceState: 'educational-only', evidence: undefined }))
  assert.deepEqual(sistemWide.mechanisms, [])
  assert.deepEqual(sistemWide.gaps, [{ id: 'n1', subject: 'Respiratory', system: 'respiratory', boundary: BATAS, origin: 'x.ts' }])
  assert.equal(satuSumber(node({ evidenceState: 'educational-only' }), 'Lung').gaps[0].subject, 'Lung', 'graf organ → subjek organ')
})
gagal('graf_hanya_membaca_simpul_fisiologi', () => {
  const hasil = satuSumber(node({ kind: 'pathophysiology' }))
  assert.deepEqual([hasil.mechanisms, hasil.gaps, hasil.rejected], [[], [], []])
  assert.equal(satuSumber(node({ evidenceState: 'source-backed' })).mechanisms.length, 0, 'status lain diabaikan, tidak dipromosikan')
})
gagal('graf_menolak_sistem_tidak_dikenal', () => {
  const hasil = readEducationSources([{ origin: 'y.ts', system: 'cardiovascular', nodes: [node()] }], LABELS)
  assert.deepEqual(hasil.rejected, [{ id: 'y.ts', origin: 'y.ts', reason: 'unknown-system' }])
  assert.deepEqual(hasil.mechanisms, [])
})
gagal('graf_menyimpan_organ_dan_claim_scope', () => {
  const hasil = satuSumber(node({ claimScope: '  Autoregulation context.  ' }), 'Kidney')
  assert.equal(hasil.mechanisms[0].organ, 'Kidney')
  assert.deepEqual(hasil.mechanisms[0].summary, ['Autoregulation context.'])
})

// ── referensi dan URL ──
gagal('referensi_bentuk_ketat', () => {
  assert.deepEqual(citationFromReference('PMID 12228049', 'n'), { kind: 'pubmed', id: '12228049', url: 'https://pubmed.ncbi.nlm.nih.gov/12228049/', note: 'n' })
  assert.equal(citationFromReference('PMID: 12228049', 'n')?.id, '12228049')
  assert.deepEqual(citationFromReference('NCBI Bookshelf NBK538172', 'n'), { kind: 'bookshelf', id: 'NBK538172', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538172/', note: 'n' })
  for (const buruk of ['NBK538172', 'PMID 123456789', 'see PMID 12228049 and more', 'pmid 12228049', 'NCBI Bookshelf NBK12', '', 12228049, null]) {
    assert.equal(citationFromReference(buruk, 'n'), null, JSON.stringify(buruk))
  }
})
gagal('url_bentuk_kanonik_saja', () => {
  assert.equal(citationFromUrl('https://pubmed.ncbi.nlm.nih.gov/23637307/', 't')?.id, '23637307')
  assert.equal(citationFromUrl('https://www.ncbi.nlm.nih.gov/books/NBK538339/', 't')?.kind, 'bookshelf')
  for (const buruk of ['http://pubmed.ncbi.nlm.nih.gov/23637307/', 'https://pubmed.ncbi.nlm.nih.gov/23637307', 'https://pubmed.ncbi.nlm.nih.gov/23637307/?x=1',
    'https://evil.example/pubmed.ncbi.nlm.nih.gov/23637307/', 'https://www.ncbi.nlm.nih.gov/books/538339/', undefined]) {
    assert.equal(citationFromUrl(buruk, 't'), null, String(buruk))
  }
})

// ── pembaca jaringan ──
const jaringan = (over: Partial<EducationNetworkLike> = {}): EducationNetworkLike => ({
  systemId: 'lymphatic', label: 'Lymphatic & immune transport', provenanceBoundary: BATAS,
  sources: [{ pmid: '32707093', title: 'Lymphatic vasculature review.' }, { pmid: '26863922', title: 'Lymphatic system in disease.' }],
  relationships: [
    { kind: 'fluid-homeostasis', statement: 'Return of interstitial fluid.', sourcePmids: ['32707093', '26863922'] },
    { kind: 'pathophysiology', statement: 'Lymphedema context.', sourcePmids: ['26863922'] },
    { kind: 'immune-trafficking', statement: 'Immune-cell trafficking.', sourcePmids: ['32707093'] },
  ],
  ...over,
})
const ALIAS = { lymphatic: 'lymphatic-immune' } as const
gagal('jaringan_menerima_dan_membuang_patofisiologi', () => {
  const { mechanism, rejected } = readEducationNetwork(jaringan(), 'n.ts', ALIAS, LABELS)
  assert.equal(rejected, null)
  assert.deepEqual(mechanism, {
    id: 'lymphatic-education-network', label: 'Lymphatic & immune transport', systems: ['lymphatic-immune'],
    summary: ['Return of interstitial fluid.', 'Immune-cell trafficking.'],
    citations: [
      { kind: 'pubmed', id: '32707093', url: 'https://pubmed.ncbi.nlm.nih.gov/32707093/', note: 'Lymphatic vasculature review.' },
      { kind: 'pubmed', id: '26863922', url: 'https://pubmed.ncbi.nlm.nih.gov/26863922/', note: 'Lymphatic system in disease.' },
    ],
    boundary: BATAS, origin: 'n.ts',
  })
})
gagal('jaringan_menolak_pmid_yang_tidak_didaftarkan', () => {
  const buruk = jaringan({ relationships: [{ kind: 'fluid-homeostasis', statement: 'x', sourcePmids: ['11111111'] }] })
  assert.deepEqual(readEducationNetwork(buruk, 'n.ts', ALIAS, LABELS), { mechanism: null, rejected: { id: 'lymphatic-education-network', origin: 'n.ts', reason: 'unreadable-reference' } })
})
gagal('jaringan_menolak_sistem_dan_boundary', () => {
  assert.equal(readEducationNetwork(jaringan(), 'n.ts', {}, LABELS).rejected?.reason, 'unknown-system', 'tanpa alias, "lymphatic" bukan sistem atlas')
  assert.equal(readEducationNetwork(jaringan({ systemId: 'urinary' }), 'n.ts', {}, LABELS).rejected, null, 'berpasangan: id sistem atlas langsung diterima')
  assert.equal(readEducationNetwork(jaringan({ provenanceBoundary: 'short' }), 'n.ts', ALIAS, LABELS).rejected?.reason, 'boundary-missing')
})
gagal('jaringan_hanya_patofisiologi_tidak_bersumber', () => {
  const hanyaPato = jaringan({ relationships: [{ kind: 'pathophysiology', statement: 'x', sourcePmids: ['26863922'] }] })
  assert.equal(readEducationNetwork(hanyaPato, 'n.ts', ALIAS, LABELS).rejected?.reason, 'literature-backed-without-source')
})

// ── pembaca atlas organ ──
const BENDERA = { educationalOnly: true, genericReference: true, patientSpecificInference: false, diagnosisOrTreatment: false, quantitativePatientClaim: false }
const relasi = (over: Partial<OrganRelationshipLike> = {}): OrganRelationshipLike => ({
  id: 'kidney-filtration', organ: 'kidney', from: 'glomerular capillary tuft', to: 'Bowman space', projections: ['anatomy', 'physiology'],
  teachingRelationship: 'Filtration across the barrier.', evidenceIds: ['renal'], evidenceState: 'source-checked', boundary: BENDERA, ...over,
})
const REFERENSI = [{ id: 'renal', title: 'Physiology, Renal', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538339/' }, { id: 'bad', title: 'Bad', url: 'https://example.org/renal' }]
const ORGAN = new Map([['kidney', { system: 'urinary' as BodySystemId, organ: 'Kidney' }]])
gagal('organ_menerima_relasi_terperiksa', () => {
  const hasil = readOrganRelationships([relasi()], REFERENSI, ORGAN, 'o.ts')
  assert.deepEqual(hasil.rejected, [])
  assert.deepEqual(hasil.mechanisms, [{
    id: 'kidney-filtration', label: 'Glomerular capillary tuft → Bowman space', systems: ['urinary'], organ: 'Kidney',
    summary: ['Filtration across the barrier.'],
    citations: [{ kind: 'bookshelf', id: 'NBK538339', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538339/', note: 'Physiology, Renal' }],
    boundary: ORGAN_RELATIONSHIP_BOUNDARY, origin: 'o.ts',
  }])
})
gagal('organ_melewati_yang_bukan_fisiologi_terperiksa', () => {
  assert.deepEqual(readOrganRelationships([relasi({ evidenceState: 'reference-only' }), relasi({ projections: ['anatomy'] })], REFERENSI, ORGAN, 'o.ts'), { mechanisms: [], rejected: [] })
})
gagal('organ_menolak_organ_tak_dikenal_bendera_dan_bukti', () => {
  const tolak = (r: OrganRelationshipLike) => readOrganRelationships([r], REFERENSI, ORGAN, 'o.ts').rejected.map((x) => x.reason)
  assert.deepEqual(tolak(relasi({ organ: 'heart' })), ['unknown-system'])
  assert.deepEqual(tolak(relasi({ boundary: { ...BENDERA, patientSpecificInference: true } })), ['boundary-missing'])
  assert.deepEqual(tolak(relasi({ boundary: { ...BENDERA, educationalOnly: false } })), ['boundary-missing'])
  assert.deepEqual(tolak(relasi({ evidenceIds: [] })), ['literature-backed-without-source'])
  assert.deepEqual(tolak(relasi({ evidenceIds: ['missing'] })), ['unreadable-reference'])
  assert.deepEqual(tolak(relasi({ evidenceIds: ['renal', 'bad'] })), ['unreadable-reference'], 'satu bukti buruk menolak semuanya')
  assert.deepEqual(tolak(relasi({ organ: 'Kidney' })), [], 'berpasangan: huruf besar organ tidak masalah')
})

// ── pembaca kopling bereferensi ──
const kopling = { id: 'baro', label: 'Baroreflex', systems: ['respiratory'] as BodySystemId[], summary: ['s'], references: [{ reference: 'NCBI Bookshelf NBK538172', note: 'a' }, { reference: 'PMID 12228049', note: 'b' }], boundary: BATAS, origin: 'c.ts' }
gagal('kopling_menerima_dan_menolak_utuh', () => {
  assert.deepEqual(readReferencedMechanism(kopling, LABELS).mechanism?.citations.map((c) => c.id), ['NBK538172', '12228049'])
  assert.deepEqual(readReferencedMechanism({ ...kopling, references: [...kopling.references, { reference: 'Guyton p. 12', note: 'c' }] }, LABELS), { mechanism: null, rejected: { id: 'baro', origin: 'c.ts', reason: 'unreadable-reference' } })
  assert.equal(readReferencedMechanism({ ...kopling, references: [] }, LABELS).rejected?.reason, 'literature-backed-without-source')
  assert.equal(readReferencedMechanism({ ...kopling, systems: ['respiratory', 'cardiovascular'] }, LABELS).rejected?.reason, 'unknown-system')
  assert.equal(readReferencedMechanism({ ...kopling, systems: [] }, LABELS).rejected?.reason, 'unknown-system')
  assert.equal(readReferencedMechanism({ ...kopling, boundary: 'x' }, LABELS).rejected?.reason, 'boundary-missing')
})

// ── katalog bawaan (data sungguhan) ──
const katalog = defaultPhysiologyCatalog()
const SISTEM: readonly BodySystemId[] = ['cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive', 'lymphatic-immune', 'musculoskeletal', 'sensory-ent', 'integumentary-surface']
const tampilan = (id: BodySystemId) => {
  const plan = planSystemPhysiology(id, katalog)
  assert.equal(plan.ok, true, `${id}: ${JSON.stringify(plan)}`)
  return (plan as Extract<typeof plan, { ok: true }>).view
}
gagal('katalog_bawaan_tanpa_sumber_ditolak_dan_lengkap', () => {
  assert.deepEqual(katalog.rejected, [], 'setiap modul sumber terbaca; yang rusak harus diperbaiki di sumbernya, bukan disembunyikan')
  assert.equal(checkCatalog(katalog), null)
  assert.deepEqual(katalog.systems.map((s) => s.id), SISTEM)
  assert.equal(defaultPhysiologyCatalog(), katalog, 'dibangun sekali')
})
gagal('katalog_bawaan_semua_sitasi_terverifikasi_ledger', () => {
  const ledger = JSON.parse(readFileSync(new URL('../../governance/LITERATURE_CITATION_LEDGER.json', import.meta.url), 'utf8')) as { entries: { pmid?: string; nbk?: string }[] }
  const terverifikasi = new Set(ledger.entries.flatMap((e) => [e.pmid, e.nbk].filter((x): x is string => typeof x === 'string')))
  let jumlah = 0
  for (const mechanism of katalog.mechanisms) {
    for (const citation of mechanism.citations) {
      jumlah += 1
      assert.ok(terverifikasi.has(citation.id), `${mechanism.id} menampilkan ${citation.id}, yang belum terverifikasi di ledger`)
      const kanonik = citation.kind === 'pubmed' ? `https://pubmed.ncbi.nlm.nih.gov/${citation.id}/` : `https://www.ncbi.nlm.nih.gov/books/${citation.id}/`
      assert.equal(citation.url, kanonik)
    }
  }
  assert.equal(jumlah, 46, 'jumlah sitasi yang ditampilkan (terukur: 24 mekanisme, 46 sitasi; 11 dari empat kopling fisiologi, 8 dari fisiologi muskuloskeletal dan indra)')
})
gagal('katalog_bawaan_jumlah_terukur', () => {
  // Diukur dari data saat mesin ini dibuat. Menambah fisiologi bersumber menaikkan angka ini — ubah secara sadar.
  assert.equal(katalog.mechanisms.length, 24)
  assert.equal(katalog.gaps.length, 17)
  const index = planSystemIndex(katalog)
  assert.equal(index.ok, true)
  if (!index.ok) return
  assert.deepEqual(index.rows.map((row) => [row.id, row.mechanismCount, row.gapCount, row.sourced]), [
    ['cardiovascular', 4, 0, true], ['nervous', 2, 0, true], ['respiratory', 5, 1, true], ['digestive', 3, 7, true],
    ['urinary', 3, 2, true], ['endocrine', 5, 2, true], ['reproductive', 1, 3, true], ['lymphatic-immune', 1, 2, true],
    ['musculoskeletal', 2, 0, true], ['sensory-ent', 2, 0, true], ['integumentary-surface', 1, 0, true],
  ])
})
gagal('kopling_dari_os_lewat_jembatan_dalam_urutan_atlas', () => {
  // OS: kardiovaskular berkopling ke respiratory, renal, nervous, endocrine, musculoskeletal → urutan atlas.
  assert.deepEqual(tampilan('cardiovascular').couplings.map((c) => c.id), ['nervous', 'respiratory', 'urinary', 'endocrine', 'musculoskeletal'])
  // Digestif majemuk (digestive + hepatic-metabolic): gabungan kopling kedua domain, tanpa dirinya sendiri.
  const digestif = tampilan('digestive')
  assert.deepEqual(digestif.domains.map((d) => d.id), ['digestive', 'hepatic-metabolic'])
  assert.ok(!digestif.couplings.some((c) => c.id === 'digestive'))
  for (const id of SISTEM) assert.ok(!tampilan(id).couplings.some((c) => c.id === 'sensory-ent'), `${id}: jembatan kontekstual tidak pernah mewakili domain`)
})
gagal('loop_hanya_yang_melewati_domain_sistem', () => {
  // OS: hanya loop volume-tekanan dan asam-basa yang melewati domain renal.
  assert.deepEqual(tampilan('urinary').loops.map((l) => l.id), ['volume-pressure', 'acid-base'])
  assert.deepEqual(tampilan('urinary').loops[1].path, ['Respiration', 'Renal', 'Circulation'], 'jalur memakai label pendek OS, berurutan')
})
gagal('kopling_tidak_pernah_lewat_jembatan_kontekstual', () => {
  // Jembatan kontekstual sengaja diletakkan PERTAMA: domain "respiratory" tetap diwakili sistem yang langsung.
  const c = {
    systems: [{ id: 'sensory-ent', label: 'Sensory' }, { id: 'respiratory', label: 'Respiratory' }, { id: 'urinary', label: 'Urinary' }],
    bridge: [
      { atlasSystemId: 'sensory-ent', physiologySystemIds: ['respiratory'], fidelity: 'contextual', rationale: 'r' },
      { atlasSystemId: 'respiratory', physiologySystemIds: ['respiratory'], fidelity: 'direct', rationale: 'r' },
      { atlasSystemId: 'urinary', physiologySystemIds: ['renal'], fidelity: 'direct', rationale: 'r' },
    ],
    domains: [
      { id: 'renal', label: 'Renal', shortLabel: 'Renal', primaryRole: 'r', anatomyAnchors: [], physiologyAnchors: [], couplingTargets: ['respiratory'], equation: 'e', equationNote: 'n' },
      { id: 'respiratory', label: 'Respiratory', shortLabel: 'Respiration', primaryRole: 'r', anatomyAnchors: [], physiologyAnchors: [], couplingTargets: [], equation: 'e', equationNote: 'n' },
    ],
    loops: [], mechanisms: [], gaps: [], rejected: [],
  } satisfies SystemPhysiologyCatalog
  const plan = planSystemPhysiology('urinary', c)
  assert.equal(plan.ok, true)
  if (plan.ok) assert.deepEqual(plan.view.couplings.map((x) => x.id), ['respiratory'])
})
gagal('jembatan_kontekstual_tidak_mengklaim_kopling', () => {
  const indra = tampilan('sensory-ent')
  assert.equal(indra.fidelity, 'contextual')
  assert.deepEqual([indra.couplings, indra.loops], [[], []])
  // Mekanismenya hanya miliknya sendiri (bersumber untuk sistem indra), tidak diwarisi dari domain saraf yang dijembatani.
  assert.deepEqual(indra.mechanisms.map((m) => m.id), ['retinal-phototransduction', 'inner-ear-hair-cell-mechanotransduction'])
  for (const m of indra.mechanisms) assert.ok(m.systems.includes('sensory-ent'), `${m.id} milik sistem indra`)
  assert.ok(!indra.mechanisms.some((m) => m.id === 'arterial-baroreflex' || m.id === 'cerebral-perfusion-pressure'), 'mekanisme saraf tidak ikut lewat jembatan')
  const saraf = tampilan('nervous')
  assert.ok(saraf.couplings.length > 0 && saraf.loops.length > 0, 'berpasangan: domain yang sama lewat jembatan langsung punya kopling')
})
gagal('mekanisme_bersama_muncul_di_kedua_sistem', () => {
  const baro = (id: BodySystemId) => tampilan(id).mechanisms.find((m) => m.id === 'arterial-baroreflex')
  assert.ok(baro('cardiovascular') && baro('cardiovascular') === baro('nervous'), 'objek yang sama, bukan salinan')
  assert.deepEqual(baro('cardiovascular')!.citations.map((c) => c.id), ['NBK538172', '12228049'])
  assert.equal(baro('cardiovascular')!.summary.at(-2), 'When arterial pressure rises: baroreceptor stretch increases, afferent firing increases, sympathetic outflow decreases, vagal outflow increases, heart rate decreases, contractility decreases, arteriolar tone decreases, venous tone decreases.')
})
gagal('kopling_fisiologi_tampil_di_setiap_sistem_yang_digabungkannya', () => {
  const ids = (id: BodySystemId) => tampilan(id).mechanisms.map((m) => m.id)
  assert.deepEqual(ids('cardiovascular'), ['arterial-baroreflex', 'pressure-flow-chain', 'cerebral-perfusion-pressure', 'fick-oxygen-mass-balance'])
  assert.deepEqual(ids('nervous'), ['arterial-baroreflex', 'cerebral-perfusion-pressure'])
  assert.deepEqual(ids('respiratory').slice(-2), ['acid-base-bicarbonate-buffer', 'fick-oxygen-mass-balance'])
  assert.deepEqual(ids('urinary').slice(-1), ['acid-base-bicarbonate-buffer'])
  const sumber = (id: string) => katalog.mechanisms.find((m) => m.id === id)!.citations.map((c) => c.id)
  assert.deepEqual(sumber('pressure-flow-chain'), ['NBK556075', 'NBK470455', 'NBK538226', 'NBK537271'])
  assert.deepEqual(sumber('cerebral-perfusion-pressure'), ['NBK537271', 'NBK482119'])
  assert.deepEqual(sumber('acid-base-bicarbonate-buffer'), ['NBK308', 'NBK493167', 'NBK536919'])
  assert.deepEqual(sumber('fick-oxygen-mass-balance'), ['NBK606091', 'NBK493219'])
  // Klaim tetap kata demi kata dari modul sumber; judul ditampilkan bila modul menyertakannya.
  assert.equal(katalog.mechanisms.find((m) => m.id === 'pressure-flow-chain')!.citations[0].note,
    'Physiology, Systemic Vascular Resistance: Systemic vascular resistance relates the mean arterial-to-venous pressure drop to cardiac output.')
  for (const m of katalog.mechanisms.filter((x) => x.origin.includes('/physiology/'))) assert.deepEqual(m.summary.length > 0, m.id === 'arterial-baroreflex', `${m.id}: ringkasan hanya dari data modul`)
})
gagal('celah_organ_parsial_bila_sebagian_bersumber', () => {
  const urinarius = tampilan('urinary')
  assert.deepEqual(urinarius.organGaps.map((g) => [g.subject, g.partial]), [['Kidney', true], ['Urinary bladder', false]])
  assert.deepEqual(urinarius.mechanisms.map((m: PhysiologyMechanism) => m.id), ['renal-autoregulation-context', 'kidney-glomerulus-filtration', 'acid-base-bicarbonate-buffer'])
})
gagal('fisiologi_domain_terbaca_utuh_kata_demi_kata', () => {
  // Setiap entri data/education terbaca tanpa ditolak, dari berkasnya sendiri, dengan ringkasan dan sumber persis datanya.
  const entri = DOMAIN_PHYSIOLOGY.flatMap(({ origin, entries }) => entries.map((entry) => ({ origin, entry })))
  assert.equal(entri.length, 4)
  for (const { origin, entry } of entri) {
    const m = katalog.mechanisms.find((x) => x.id === entry.id)
    assert.ok(m, `${entry.id} tidak terbaca`)
    assert.equal(m.origin, origin)
    assert.match(origin, /^src\/domains\/body-exposure\/data\/education\/[a-z]+Physiology\.ts$/)
    assert.ok(readFileSync(new URL(`../../${origin}`, import.meta.url), 'utf8').includes(`id: '${entry.id}'`), `${entry.id}: berkas asal yang tercatat memuat entri ini`)
    assert.deepEqual(m.summary, entry.summary, `${entry.id}: ringkasan kata demi kata`)
    assert.ok(m.summary.length >= 4, `${entry.id}: langkah-langkahnya ditulis`)
    assert.deepEqual(m.citations.map((c) => `PMID ${c.id}`), entry.references.map((r) => r.reference))
    assert.deepEqual(m.citations.map((c) => c.note), entry.references.map((r) => r.note))
    assert.deepEqual(m.systems, entry.systems)
  }
  const ids = (id: BodySystemId) => tampilan(id).mechanisms.map((m) => m.id)
  assert.deepEqual(ids('musculoskeletal'), ['skeletal-muscle-excitation-contraction-coupling', 'bone-remodelling-cycle'])
  assert.deepEqual(ids('endocrine').slice(-1), ['bone-remodelling-cycle'], 'pengatur hormonal remodeling tulang → tampil juga di endokrin')
  const tulang = (id: BodySystemId) => tampilan(id).mechanisms.find((m) => m.id === 'bone-remodelling-cycle')
  assert.ok(tulang('musculoskeletal') === tulang('endocrine'), 'objek yang sama, bukan salinan')
  assert.deepEqual(katalog.mechanisms.find((m) => m.id === 'bone-remodelling-cycle')!.citations.map((c) => c.id), ['29368538', '17308163'])
})

// ── perencana: gagal-tertutup ──
const minimal = (): SystemPhysiologyCatalog => ({
  systems: [{ id: 'urinary', label: 'Urinary' }, { id: 'respiratory', label: 'Respiratory' }],
  bridge: [
    { atlasSystemId: 'urinary', physiologySystemIds: ['renal'], fidelity: 'direct', rationale: 'r' },
    { atlasSystemId: 'respiratory', physiologySystemIds: ['respiratory'], fidelity: 'direct', rationale: 'r' },
  ],
  domains: [
    { id: 'renal', label: 'Renal', shortLabel: 'Kidney', primaryRole: 'Balance water.', anatomyAnchors: [], physiologyAnchors: ['GFR'], couplingTargets: ['respiratory', 'cardiovascular'], equation: 'e', equationNote: 'n' },
    { id: 'respiratory', label: 'Respiratory', shortLabel: 'Lungs', primaryRole: 'Exchange gas.', anatomyAnchors: [], physiologyAnchors: [], couplingTargets: ['renal'], equation: 'e', equationNote: 'n' },
  ],
  loops: [{ id: 'acid-base', label: 'Acid-base loop', path: ['respiratory', 'renal', 'cardiovascular'], teachingPoint: 't' }],
  mechanisms: [{ id: 'm', label: 'M', systems: ['urinary'], organ: 'kidney', summary: [], citations: [{ kind: 'pubmed', id: '1', url: 'u', note: 'n' }], boundary: BATAS, origin: 'o' }],
  gaps: [{ id: 'g1', subject: 'Kidney', system: 'urinary', boundary: BATAS, origin: 'o' }, { id: 'g2', subject: 'Bladder', system: 'urinary', boundary: BATAS, origin: 'o' }],
  rejected: [],
})
gagal('sistem_tanpa_sumber_tetap_terencana_dengan_jujur', () => {
  // Katalog sungguhan kini tidak punya sistem tanpa sumber, jadi aturan ini diuji pada katalog sintetis:
  // sistem tanpa mekanisme tetap terencana, tidak bersumber, dan tetap menampilkan peran serta relasi ajar dari OS.
  const plan = planSystemPhysiology('respiratory', minimal())
  assert.equal(plan.ok, true)
  if (!plan.ok) return
  assert.equal(plan.view.sourced, false)
  assert.deepEqual(plan.view.mechanisms, [])
  assert.deepEqual([plan.view.domains[0].role, plan.view.domains[0].equation], ['Exchange gas.', 'e'], 'peran dan relasi ajar tetap tampil dari OS')
  const berpasangan = planSystemPhysiology('urinary', minimal())
  assert.ok(berpasangan.ok && berpasangan.view.sourced && berpasangan.view.mechanisms.length === 1, 'berpasangan: sistem dengan mekanisme bersumber')
  for (const id of SISTEM) assert.ok(tampilan(id).mechanisms.length > 0, `${id}: setiap sistem atlas kini punya setidaknya satu mekanisme bersumber`)
})
gagal('perencana_menerima_katalog_minimal', () => {
  const plan = planSystemPhysiology('urinary', minimal())
  assert.equal(plan.ok, true)
  if (!plan.ok) return
  assert.deepEqual(plan.view.couplings, [{ id: 'respiratory', label: 'Respiratory' }], '"cardiovascular" tidak dipetakan ke sistem atlas mana pun → diabaikan, tidak ditebak')
  assert.deepEqual(plan.view.loops, [{ id: 'acid-base', label: 'Acid-base loop', teachingPoint: 't', path: ['Lungs', 'Kidney', 'cardiovascular'] }], 'domain tanpa model tampil dengan id-nya, bukan dikarang')
  assert.deepEqual(plan.view.organGaps.map((g) => g.partial), [true, false], 'organ "kidney" ↔ subjek "Kidney"')
})
gagal('perencana_menolak_sistem_tidak_dikenal', () => {
  for (const buruk of ['kidney', '', null, undefined, 42, 'cardiovascular']) {
    const plan = planSystemPhysiology(buruk, minimal())
    assert.equal(plan.ok, false, String(buruk))
    if (!plan.ok) assert.equal(plan.reason, 'unknown-system')
  }
})
gagal('perencana_gagal_tertutup_pada_katalog_tidak_lengkap', () => {
  const rusak: [string, (c: SystemPhysiologyCatalog) => SystemPhysiologyCatalog][] = [
    ['tanpa sistem', (c) => ({ ...c, systems: [] })],
    ['sistem ganda', (c) => ({ ...c, systems: [...c.systems, c.systems[0]] })],
    ['tanpa jembatan', (c) => ({ ...c, bridge: c.bridge.slice(1) })],
    ['jembatan ganda', (c) => ({ ...c, bridge: [...c.bridge, c.bridge[0]] })],
    ['jembatan tanpa domain', (c) => ({ ...c, bridge: [{ ...c.bridge[0], physiologySystemIds: [] }, c.bridge[1]] })],
    ['domain tak dijelaskan', (c) => ({ ...c, domains: c.domains.slice(1) })],
    ['jembatan sistem asing', (c) => ({ ...c, bridge: [...c.bridge, { atlasSystemId: 'nervous', physiologySystemIds: ['renal'], fidelity: 'direct', rationale: 'r' }] })],
    ['mekanisme tanpa sumber', (c) => ({ ...c, mechanisms: [{ ...c.mechanisms[0], citations: [] }] })],
    ['mekanisme sistem asing', (c) => ({ ...c, mechanisms: [{ ...c.mechanisms[0], systems: ['nervous'] }] })],
    ['mekanisme tanpa sistem', (c) => ({ ...c, mechanisms: [{ ...c.mechanisms[0], systems: [] }] })],
    ['celah sistem asing', (c) => ({ ...c, gaps: [{ ...c.gaps[0], system: 'nervous' }] })],
  ]
  for (const [nama, rusakkan] of rusak) {
    const katalogRusak = rusakkan(minimal())
    const plan = planSystemPhysiology('urinary', katalogRusak)
    assert.equal(plan.ok, false, nama)
    if (!plan.ok) assert.equal(plan.reason, 'catalog-incomplete', nama)
    assert.equal(planSystemIndex(katalogRusak).ok, false, `${nama}: indeks juga gagal-tertutup`)
  }
  assert.equal(planSystemIndex(minimal()).ok, true, 'berpasangan: katalog utuh diterima')
})
gagal('perencana_tidak_mengubah_katalog_dan_deterministik', () => {
  const c = minimal()
  const sebelum = JSON.stringify(c)
  const a = planSystemPhysiology('urinary', c)
  const b = planSystemPhysiology('urinary', c)
  assert.deepEqual(a, b)
  assert.equal(JSON.stringify(c), sebelum)
})

// ── simulasi panggung per sistem ──
gagal('simulasi_setiap_sistem_terdaftar_dan_valid', () => {
  assert.deepEqual(Object.keys(SYSTEM_SIMULATIONS).sort(), [...SISTEM].sort(), 'setiap sistem atlas punya entri, termasuk yang kosong')
  const tabSah = new Set(['palpation', 'diaphragm_excursion', 'peristalsis'])
  for (const [id, daftar] of Object.entries(SYSTEM_SIMULATIONS)) {
    assert.equal(new Set(daftar.map((s) => s.id)).size, daftar.length, `${id}: id unik`)
    for (const s of daftar) {
      assert.ok(['cardiopulmonary', 'soft_tissue', 'neuro'].includes(s.deck), `${id}/${s.id}: dek dikenal`)
      assert.ok(s.label.trim().length > 0, `${id}/${s.id}: berlabel`)
      if (s.softTissueTab !== undefined) {
        assert.equal(s.deck, 'soft_tissue', `${id}/${s.id}: tab jaringan lunak hanya untuk dek jaringan lunak`)
        assert.ok(tabSah.has(s.softTissueTab), `${id}/${s.id}: tab dikenal`)
      }
    }
  }
  // Terukur: lima sistem punya dek; enam tidak, dan kartunya berkata begitu.
  assert.deepEqual(SISTEM.filter((id) => SYSTEM_SIMULATIONS[id].length > 0), ['cardiovascular', 'nervous', 'respiratory', 'digestive', 'sensory-ent'])
  assert.deepEqual(SYSTEM_SIMULATIONS.respiratory.map((s) => [s.deck, s.softTissueTab]), [['cardiopulmonary', undefined], ['soft_tissue', 'diaphragm_excursion']])
})
gagal('simulasi_id_asing_tanpa_tebakan', () => {
  for (const buruk of ['kidney', 'toString', '__proto__', 'constructor', '', null, undefined, 3]) assert.deepEqual(simulationsFor(buruk), [], String(buruk))
  assert.equal(simulationsFor('digestive').length, 1, 'berpasangan: sistem atlas diterima')
  assert.equal(simulationsFor('digestive'), SYSTEM_SIMULATIONS.digestive, 'daftar yang sama, bukan salinan')
})

console.log(`system physiology: ${katalog.mechanisms.length} sourced mechanisms + ${katalog.gaps.length} organ placeholders across 11 systems, 0 sources rejected, every surfaced citation ledger-verified; planner fails closed`)
