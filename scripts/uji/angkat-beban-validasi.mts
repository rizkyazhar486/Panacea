import assert from 'node:assert/strict'

// localStorage minimal: tanpa jaringan, tanpa waktu nyata.
const simpan = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => simpan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpan.set(k, v) },
  removeItem: (k: string) => { simpan.delete(k) },
}
const { alasanSesiDitolak, simpanSesi, ambilSesi, setSah, volumeSesi } = await import('../../src/lib/angkatBeban.ts')

const SEKARANG = Date.parse('2026-10-10T12:00:00Z')
const ok = { id: 'a', tanggal: '2026-10-10', gerakan: 'Squat', set: [{ ulangan: 5, kg: 100 }] }
const reset = () => simpan.clear()

// positif
assert.equal(alasanSesiDitolak(ok, SEKARANG), null, 'menerima_sesi_sah')
assert.equal(volumeSesi(ok), 500)

// negatif berpasangan: hanya satu kondisi yang berbeda dari `ok`
const tolak = (ubah: object) => alasanSesiDitolak({ ...ok, ...ubah } as typeof ok, SEKARANG)
assert.match(tolak({ gerakan: '   ' })!, /movement name is required/, 'menolak_gerakan_kosong')
assert.match(tolak({ gerakan: 'x'.repeat(61) })!, /at most 60/, 'menolak_gerakan_terlalu_panjang')
assert.equal(tolak({ gerakan: 'x'.repeat(60) }), null, 'menerima_gerakan_pada_batas_60')
assert.match(tolak({ tanggal: '2026-02-30' })!, /real date/, 'menolak_tanggal_tak_nyata')
assert.match(tolak({ tanggal: '10/10/2026' })!, /real date/, 'menolak_format_tanggal')
assert.match(tolak({ tanggal: '2026-10-11' })!, /not in the future/, 'menolak_tanggal_masa_depan')
assert.equal(tolak({ tanggal: '2026-10-10' }), null, 'menerima_tanggal_hari_ini')
assert.match(tolak({ set: [] })!, /at least one set/, 'menolak_tanpa_set')

// batas ulangan / beban: tepat di batas dan ±1 langkah
assert.equal(setSah({ ulangan: 1, kg: 1 }), true)
assert.equal(setSah({ ulangan: 0, kg: 1 }), false)
assert.equal(setSah({ ulangan: 100, kg: 1 }), true)
assert.equal(setSah({ ulangan: 101, kg: 1 }), false)
assert.equal(setSah({ ulangan: 2.5, kg: 1 }), false, 'ulangan_pecahan_ditolak')
assert.equal(setSah({ ulangan: 5, kg: 1000 }), true)
assert.equal(setSah({ ulangan: 5, kg: 1000.5 }), false)
assert.equal(setSah({ ulangan: 5, kg: 0 }), false)
assert.equal(setSah({ ulangan: 5, kg: 0.5 }), true)
for (const buruk of [NaN, Infinity, -Infinity, -5, '5', null, undefined]) {
  assert.equal(setSah({ ulangan: buruk, kg: 50 }), false, `ulangan ${String(buruk)}`)
  assert.equal(setSah({ ulangan: 5, kg: buruk }), false, `kg ${String(buruk)}`)
}
assert.equal(setSah(null), false)
assert.match(tolak({ set: [{ ulangan: 5, kg: 100 }, { ulangan: 5, kg: NaN }] })!, /every set/, 'satu_set_buruk_menolak_sesi')

// simpanSesi fail-closed: tak ada efek samping pada penyimpanan
reset()
simpanSesi(ok, SEKARANG)
assert.equal(ambilSesi().length, 1)
const sebelum = simpan.get('pmd_beban_v1')
const hasil = simpanSesi({ ...ok, id: 'b', tanggal: '2027-01-01' }, SEKARANG)
assert.equal(hasil.length, 1, 'sesi_tak_sah_tidak_ditambahkan')
assert.equal(simpan.get('pmd_beban_v1'), sebelum, 'penyimpanan_tak_berubah')
// pasangan: sesi yang hanya berbeda pada tanggal (sah) diterima
assert.equal(simpanSesi({ ...ok, id: 'c', tanggal: '2026-10-09' }, SEKARANG).length, 2)

// regresi: data tersimpan rusak dibuang dan tidak meracuni volume
reset()
simpan.set('pmd_beban_v1', JSON.stringify([
  { id: 'x', tanggal: '2026-10-01', gerakan: 'Bench', set: [{ ulangan: 5, kg: 60 }, { ulangan: -3, kg: 60 }, { ulangan: 5, kg: null }, { ulangan: 'a', kg: 5 }] },
  { id: 'y', tanggal: '2026-10-02', gerakan: 'Deadlift', set: [{ ulangan: 0, kg: 0 }] },
]))
const dibaca = ambilSesi()
assert.equal(dibaca.length, 1, 'sesi_tanpa_set_sah_dibuang')
assert.deepEqual(dibaca[0].set, [{ ulangan: 5, kg: 60 }])
assert.equal(volumeSesi(dibaca[0]), 300)

// determinisme
assert.deepEqual(tolak({ tanggal: '2026-02-30' }), tolak({ tanggal: '2026-02-30' }))
console.log('angkat-beban-validasi: ok')
