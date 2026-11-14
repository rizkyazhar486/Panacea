// Ke mana sebuah struktur yang dipilih membawa panggung Fisiologi dan Klinis.
//   - struktur yang dimodelkan dek → dek itu dan alat klinisnya (perutean #3036 tidak berubah);
//   - tanpa dek → kartu sistem tubuhnya dan TANPA target klinis (dulu: peta nyeri alih miokard jantung untuk
//     otot jari kaki, kelenjar limfe dan region kulit — 490 struktur);
//   - tanpa dek dan tanpa sistem → indeks sistem, "belum terpetakan";
//   - diukur pada indeks tubuh SUNGGUHAN (src/lib/bodyIndex.gen.ts) dan dikunci.
import assert from 'node:assert/strict'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import { describeStructure } from '../../src/domains/body-exposure/engine/atlas-stage/structureInfo.ts'
import { decksFor } from '../../src/domains/body-exposure/engine/atlasStageDecks.ts'
import { routePick, type PickRoute } from '../../src/domains/body-exposure/engine/atlas-stage/pickRoute.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const pilih = (nama: unknown, lapisan: unknown) => routePick(describeStructure(nama as string, lapisan as never))
const BELUM: PickRoute = { basis: 'unmapped', couplingContext: null, physiologyView: 'systems', systems: [], systemFocus: null, clinicalTool: null }

gagal('dek_yang_memodelkan_tetap_dibuka', () => {
  const hati = pilih('Liver', 'visceral')
  assert.deepEqual(hati, {
    basis: 'deck', couplingContext: decksFor(describeStructure('Liver', 'visceral')), physiologyView: 'soft_tissue',
    systems: ['digestive'], systemFocus: 'digestive', clinicalTool: 'referred_pain',
  })
  assert.equal(hati.couplingContext?.referredPainOrgan, 'liver-glisson-capsule')
  const koroner = pilih('Left coronary artery', 'cardiovascular')
  assert.deepEqual([koroner.basis, koroner.physiologyView, koroner.clinicalTool, koroner.systemFocus], ['deck', 'cardiopulmonary', 'vascular', 'cardiovascular'])
})

gagal('tanpa_dek_membuka_kartu_sistem_tanpa_target_klinis', () => {
  assert.equal(decksFor(describeStructure('Abductor hallucis', 'muscular')), null, 'tidak ada dek yang meminjam organ lain')
  assert.deepEqual(pilih('Abductor hallucis', 'muscular'), {
    basis: 'system', couplingContext: null, physiologyView: 'systems', systems: ['musculoskeletal'], systemFocus: 'musculoskeletal', clinicalTool: null,
  })
  assert.deepEqual([pilih('(Fibular node)', 'lymphoid').systemFocus, pilih('Anal region', 'surface').systemFocus], ['lymphatic-immune', 'integumentary-surface'])
})

gagal('berpasangan_lapisan_sama_hanya_dek_yang_berbeda', () => {
  // Visceral keduanya: hati dimodelkan dek, omentum tidak dan tidak dipetakan ke sistem mana pun.
  assert.equal(pilih('Liver', 'visceral').basis, 'deck')
  assert.deepEqual(pilih('Greater omentum', 'visceral'), BELUM)
})

gagal('berpasangan_nama_otot_yang_dimodelkan_dek', () => {
  // Diafragma ada di lapisan otot seperti abductor hallucis, tetapi dek jaringan lunak memodelkannya.
  const d = pilih('Diaphragm', 'muscular')
  assert.deepEqual([d.basis, d.couplingContext?.softTissueTab, d.systemFocus], ['deck', 'diaphragm_excursion', 'respiratory'])
})

gagal('struktur_dua_sistem_fokus_ke_yang_pertama', () => {
  const p = pilih('Pancreas', 'visceral')
  assert.deepEqual([p.basis, p.systems, p.systemFocus], ['deck', ['digestive', 'endocrine'], 'digestive'])
})

gagal('masukan_tidak_sah_gagal_tertutup', () => {
  assert.deepEqual(pilih('', 'muscular'), BELUM, 'nama kosong')
  assert.deepEqual(pilih(42, 'muscular'), BELUM, 'nama bukan string')
  assert.deepEqual(pilih('Abductor hallucis', null), BELUM, 'lapisan tidak diketahui')
  assert.deepEqual(pilih('Abductor hallucis', 'bogus'), BELUM, 'lapisan asing')
})

gagal('deterministik', () => {
  assert.deepEqual(pilih('Abductor hallucis', 'muscular'), pilih('Abductor hallucis', 'muscular'))
})

gagal('indeks_nyata_tanpa_target_pinjaman', () => {
  const unik = new Map<string, { b: string; l: string }>()
  for (const s of INDEKS_TUBUH) unik.set(`${s.l}|${s.b}`, s)
  const hitung = { deck: 0, system: 0, unmapped: 0 }
  for (const { b, l } of unik.values()) {
    const r = pilih(b, l)
    hitung[r.basis] += 1
    if (r.basis === 'deck') {
      assert.ok(r.couplingContext && r.clinicalTool === r.couplingContext.clinical && r.physiologyView === r.couplingContext.physiology, `${b} @ ${l}`)
      // Peta nyeri alih jantung hanya untuk struktur jantung, bukan target pinjaman.
      if (r.couplingContext.referredPainOrgan === 'heart-myocardium') assert.match(`${l} ${b}`, /cardio|heart|myocard/i, `${b} @ ${l} meminjam target jantung`)
    } else {
      assert.deepEqual([r.couplingContext, r.clinicalTool, r.physiologyView], [null, null, 'systems'], `${b} @ ${l}`)
      assert.equal(r.basis === 'system', r.systems.length > 0)
    }
  }
  // Terukur saat perbaikan: 1.494 struktur unik; 490 dulu jatuh ke target jantung. Menambah dek atau pemetaan
  // sistem mengubah angka ini — ubah secara sadar; "belum terpetakan" hanya boleh turun.
  assert.equal(unik.size, 1494)
  assert.deepEqual(hitung, { deck: 1004, system: 466, unmapped: 24 })
})

console.log('pick route: decks kept for the 1004 structures they model; 466 open their system card with no clinical target; 24 unmapped; invalid input fails closed')
