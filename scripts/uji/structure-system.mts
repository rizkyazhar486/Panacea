// Struktur atlas → sistem tubuh: memilih struktur di 3D harus membuka fisiologi sistem yang benar, dan struktur
// yang tidak tercakup harus berkata begitu — tidak meminjam sistem tetangga.
//   - aturan diuji berpasangan (yang diterima hanya berbeda pada kondisi yang menolak);
//   - cakupan diukur pada indeks tubuh SUNGGUHAN (src/lib/bodyIndex.gen.ts) dan dikunci sebagai ratchet:
//     enam lapisan 100% terpetakan ke tepat satu sistem; visceral ≤29 tak terpetakan, ≤1 ambigu (pankreas).
import assert from 'node:assert/strict'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import { MAX_STRUCTURE_NAME_LENGTH, systemsForStructure } from '../../src/domains/body-exposure/engine/system-physiology/structureSystem.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const sistem = (nama: unknown, lapisan: unknown) => {
  const hasil = systemsForStructure(nama, lapisan)
  assert.equal(hasil.ok, true, `${String(nama)} @ ${String(lapisan)} ditolak: ${JSON.stringify(hasil)}`)
  return hasil as Extract<typeof hasil, { ok: true }>
}

gagal('menerima_petunjuk_terpanjang_menang', () => {
  assert.deepEqual(sistem('Optic nerve (II)', 'nervous'), { ok: true, systems: ['sensory-ent'], basis: 'hint' }, '"optic nerve" mengalahkan "nerve"')
  assert.deepEqual(sistem('Sciatic nerve', 'nervous'), { ok: true, systems: ['nervous'], basis: 'hint' }, 'berpasangan: saraf lain tetap saraf')
  assert.deepEqual(sistem('Gallbladder', 'visceral'), { ok: true, systems: ['digestive'], basis: 'hint' }, '"gallbladder" mengalahkan "bladder"')
  assert.deepEqual(sistem('Urinary bladder', 'visceral'), { ok: true, systems: ['urinary'], basis: 'hint' }, 'berpasangan: kandung kemih tetap urinarius')
  assert.deepEqual(sistem('Lateral rectus muscle', 'muscular'), { ok: true, systems: ['sensory-ent'], basis: 'hint' }, 'otot ekstraokular → indra')
  assert.deepEqual(sistem('Rectus abdominis muscle', 'muscular'), { ok: true, systems: ['musculoskeletal'], basis: 'hint' }, 'berpasangan: "rectus" saja bukan petunjuk mata')
  assert.deepEqual(sistem('Diaphragm', 'muscular'), { ok: true, systems: ['respiratory'], basis: 'hint' })
})

gagal('menerima_seri_tepat_menyimpan_semua_sistem_berurutan_kanonik', () => {
  assert.deepEqual(sistem('Pancreas', 'visceral').systems, ['digestive', 'endocrine'], 'pankreas eksokrin dan endokrin')
  assert.deepEqual(sistem('Thyroid gland', 'visceral').systems, ['endocrine'], 'berpasangan: kelenjar endokrin tunggal')
})

gagal('menerima_berkas_menentukan_kandidat', () => {
  // "pelvis" adalah petunjuk kerangka; di berkas visceral ia bukan petunjuk apa pun.
  assert.deepEqual(sistem('Renal pelvis', 'visceral'), { ok: true, systems: [], basis: 'unmatched' })
  assert.deepEqual(sistem('Pelvis', 'skeletal'), { ok: true, systems: ['musculoskeletal'], basis: 'hint' }, 'berpasangan: di berkas kerangka ia petunjuk')
})

gagal('menerima_pengecualian_bernama_hanya_di_berkas_saraf', () => {
  assert.deepEqual(sistem('Lacrimal gland', 'nervous'), { ok: true, systems: ['sensory-ent'], basis: 'named-exception' })
  assert.deepEqual(sistem('Auditory tube', 'nervous'), { ok: true, systems: ['sensory-ent'], basis: 'named-exception' })
  assert.deepEqual(sistem('Lacrimal gland', 'visceral'), { ok: true, systems: [], basis: 'unmatched' }, 'berpasangan: di berkas lain pengecualian tidak berlaku')
})

gagal('menerima_bawaan_berkas_dan_pemilik_tunggal', () => {
  assert.deepEqual(sistem('Hippocampus', 'nervous'), { ok: true, systems: ['nervous'], basis: 'file-default' })
  assert.deepEqual(sistem('Adductor longus', 'muscular'), { ok: true, systems: ['musculoskeletal'], basis: 'file-default' })
  assert.deepEqual(sistem('Left coronary artery', 'cardiovascular'), { ok: true, systems: ['cardiovascular'], basis: 'single-owner' })
  assert.deepEqual(sistem('Femur', 'skeletal'), { ok: true, systems: ['musculoskeletal'], basis: 'hint' })
  assert.deepEqual(sistem('Spleen', 'lymphoid'), { ok: true, systems: ['lymphatic-immune'], basis: 'hint' })
  // surface.glb ditandai allSourceNodes: petunjuknya ("surface") tidak dipakai, pemilik tunggal yang menentukan.
  assert.deepEqual(sistem('Zygomatic region', 'surface'), { ok: true, systems: ['integumentary-surface'], basis: 'single-owner' })
  assert.deepEqual(sistem('Surface of trunk', 'surface'), { ok: true, systems: ['integumentary-surface'], basis: 'single-owner' })
})

gagal('menolak_tanpa_menebak_di_berkas_banyak_pemilik', () => {
  assert.deepEqual(sistem('Greater omentum', 'visceral'), { ok: true, systems: [], basis: 'unmatched' })
})

gagal('menerima_tanpa_peduli_huruf_dan_spasi', () => {
  assert.deepEqual(sistem('  PANCREAS  ', 'visceral'), sistem('Pancreas', 'visceral'))
  assert.deepEqual(sistem('optic   NERVE', 'nervous'), sistem('Optic nerve', 'nervous'))
})

gagal('menolak_nama_tidak_sah', () => {
  for (const buruk of ['', '   ', 42, null, undefined, {}, ['Pancreas']]) {
    assert.deepEqual(systemsForStructure(buruk, 'visceral'), { ok: false, reason: 'invalid-name' }, `nama ${JSON.stringify(buruk)}`)
  }
})

gagal('batas_panjang_nama', () => {
  const tepat = 'x'.repeat(MAX_STRUCTURE_NAME_LENGTH)
  assert.deepEqual(systemsForStructure(tepat, 'cardiovascular'), { ok: true, systems: ['cardiovascular'], basis: 'single-owner' }, 'tepat di batas diterima')
  assert.deepEqual(systemsForStructure(`${tepat}x`, 'cardiovascular'), { ok: false, reason: 'invalid-name' }, 'satu lewat batas ditolak')
})

gagal('menolak_lapisan_tidak_dikenal', () => {
  for (const buruk of ['bogus', 'visceral.glb', 'Visceral', '', null, undefined, 3]) {
    assert.deepEqual(systemsForStructure('Pancreas', buruk), { ok: false, reason: 'unknown-layer' }, `lapisan ${JSON.stringify(buruk)}`)
  }
  assert.equal(systemsForStructure('Pancreas', 'visceral').ok, true, 'berpasangan: lapisan yang dikenal diterima')
})

gagal('nama_tidak_sah_diperiksa_sebelum_lapisan', () => {
  assert.deepEqual(systemsForStructure('', 'bogus'), { ok: false, reason: 'invalid-name' })
})

gagal('deterministik', () => {
  assert.deepEqual(systemsForStructure('Pancreas', 'visceral'), systemsForStructure('Pancreas', 'visceral'))
})

// ── cakupan pada indeks sungguhan ──
gagal('cakupan_indeks_nyata', () => {
  const unik = new Map<string, { b: string; l: string }>()
  for (const struktur of INDEKS_TUBUH) unik.set(`${struktur.l}|${struktur.b}`, struktur)
  const perLapisan: Record<string, { total: number; satu: number; ambigu: string[]; kosong: string[] }> = {}
  for (const { b, l } of unik.values()) {
    const hasil = systemsForStructure(b, l)
    assert.equal(hasil.ok, true, `struktur indeks ditolak: ${b} @ ${l}`)
    if (!hasil.ok) continue
    const catat = (perLapisan[l] ??= { total: 0, satu: 0, ambigu: [], kosong: [] })
    catat.total += 1
    if (hasil.systems.length === 1) catat.satu += 1
    else if (hasil.systems.length > 1) catat.ambigu.push(b)
    else catat.kosong.push(b)
  }
  for (const lapisan of ['muscular', 'nervous', 'cardiovascular', 'lymphoid', 'surface', 'skeletal']) {
    const catat = perLapisan[lapisan]
    assert.ok(catat && catat.total > 0, `lapisan ${lapisan} kosong di indeks`)
    assert.equal(catat.satu, catat.total, `${lapisan}: ${catat.total - catat.satu} struktur tidak terpetakan ke tepat satu sistem (${[...catat.ambigu, ...catat.kosong].slice(0, 5).join(', ')})`)
  }
  const visceral = perLapisan.visceral
  assert.ok(visceral.kosong.length <= 29, `visceral tak terpetakan naik ke ${visceral.kosong.length} (batas 29, hanya boleh turun)`)
  assert.deepEqual(visceral.ambigu, ['Pancreas'], 'satu-satunya struktur ambigu adalah pankreas')
  assert.ok(visceral.satu >= 72, `visceral terpetakan turun ke ${visceral.satu} (terukur 72)`)
})

console.log('structure → system: hint/longest/tie/file/exception rules paired; real index — 6 layers fully mapped, visceral ≤29 unmapped, 1 ambiguous (pancreas)')
