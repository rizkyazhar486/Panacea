// ISNCSCI 2011: contoh-contoh dari teks sumber (PMC3232636) dijadikan uji.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { klasifikasiIsncsci as K, levelMotor, levelSensori, sisiDariPola as sisi, motorDariPola as mot, REVISI_ISNCSCI, type Pemeriksaan } from '../../src/lib/isncsci.ts'

const ok = <T,>(h: { ok: boolean }) => { assert.ok(h.ok, `seharusnya berhasil: ${JSON.stringify(h)}`); return (h as { nilai: T }).nilai }
const sama = (s: ReturnType<typeof sisi>, extra: Partial<Pemeriksaan> = {}): Pemeriksaan => ({ kanan: s, kiri: structuredClone(s), vac: false, dap: false, ...extra })

// Contoh 1-5 sumber (level motor).
assert.equal(ok(levelMotor(sisi('C4', 0, mot('C1', 0)))), 'C4', 'Contoh 1')
assert.equal(ok(levelMotor(sisi('C4', 0, mot('C1', 0, { C5: 3 })))), 'C5', 'Contoh 2')
assert.equal(ok(levelMotor(sisi('C3', 0, mot('C1', 0, { C5: 3 })))), 'C3', 'Contoh 3')
assert.equal(ok(levelMotor(sisi('T6', 0, mot('T1', 0)))), 'T6', 'Contoh 4')
assert.equal(ok(levelMotor(sisi('T6', 0, mot('T1', 0, { T1: 3 })))), 'T1', 'Contoh 5')
// Teks: "if no activity in C7 and C6 graded 3, motor level C6 providing C5 is 5".
assert.equal(ok(levelMotor(sisi('INT', 0, mot('C5', 0, { C6: 3 })))), 'C6')
// L2 hanya bisa jadi level motor bila sensori L1 ke atas utuh.
assert.equal(ok(levelMotor(sisi('T12', 0, mot('S1', 5)))), 'T12')
// Sensori abnormal di C2 → C1; utuh seluruhnya → INT.
assert.equal(ok(levelSensori(sisi('C1', 1, mot('S1', 5)))), 'C1')
assert.equal(ok(levelSensori(sisi('INT', 0, mot('S1', 5)))), 'INT')

// AIS A dengan ZPP; contoh sumber: sensori kanan C5, sensasi C6-C8 → ZPP C8.
const a = ok<any>(K(sama(sisi('C5', 0, mot('C5', 0), { C6: 1, C7: 1, C8: 1 }))))
assert.equal(a.ais, 'A'); assert.equal(a.lengkap, true); assert.equal(a.zpp.sensoriKanan, 'C8')
// Contoh sumber: NLI T4, sensasi kiri T6 → ZPP sensori kiri T6, ZPP motor tetap T4.
const kiriT6 = sisi('T4', 0, mot('T1', 0), { T6: 1 })
const t4 = ok<any>(K({ kanan: sisi('T4', 0, mot('T1', 0)), kiri: kiriT6, vac: false, dap: false }))
assert.equal(t4.nli, 'T4'); assert.equal(t4.zpp.sensoriKiri, 'T6'); assert.equal(t4.zpp.motorKiri, 'T4')

// Sparing sakral sensori tanpa motor jauh → B; DAP saja cukup untuk tidak lengkap.
const b = ok<any>(K(sama(sisi('T10', 0, mot('T1', 0), { 'S4-5': 1 }))))
assert.equal(b.ais, 'B'); assert.equal(b.zpp, 'NA')
assert.equal(ok<any>(K(sama(sisi('T10', 0, mot('T1', 0)), { dap: true }))).ais, 'B')
// VAC → motor tidak lengkap; proporsi otot ≥3 di bawah NLI memisahkan C dan D.
assert.equal(ok<any>(K(sama(sisi('T10', 1, mot('T1', 1)), { vac: true }))).ais, 'C')
assert.equal(ok<any>(K(sama(sisi('T10', 1, mot('T1', 3)), { vac: true }))).ais, 'D')
// Tepat separuh (≥3) adalah D ("half or more").
{ const kn = sisi('T12', 1, mot('T1', 1, { L4: 3, L5: 3, S1: 3 })), kr = sisi('T12', 1, mot('T1', 1, { L4: 3, L5: 3 }))
  const h = ok<any>(K({ kanan: kn, kiri: kr, vac: true, dap: false })); assert.equal(h.nli, 'T12'); assert.equal(h.ais, 'D', '5/10 harus D') }
// Sparing sensori + motor >3 level di bawah level motor → C, bukan B.
assert.equal(ok<any>(K(sama(sisi('C5', 1, mot('C5', 0, { L4: 2 }), { 'S4-5': 1 })))).ais, 'C')
// Utuh: E hanya dengan defisit terdokumentasi; tanpa itu AIS tidak berlaku.
assert.equal(ok<any>(K(sama(sisi('INT', 0, mot('S1', 5)), { defisitSebelumnya: true }))).ais, 'E')
assert.equal(ok<any>(K(sama(sisi('INT', 0, mot('S1', 5))))).ais, 'tidak-berlaku')

// Skor: UEMS/LEMS maks 25 per sisi; 56+56 sensori; NT membatalkan skor.
const u = ok<any>(K(sama(sisi('INT', 0, mot('S1', 5)), { defisitSebelumnya: true })))
assert.deepEqual(u.skor, { uemsKanan: 25, uemsKiri: 25, lemsKanan: 25, lemsKiri: 25, rabaan: 112, tusukan: 112 })

// Gagal-tertutup.
assert.equal(K(sama(sisi('T10', 0, mot('T1', 0), { T4: 'NT' }))).ok, false, 'NT di atas level harus menolak')
assert.equal(levelSensori(sisi('T10', 0, mot('T1', 0), { T4: 'NT' })).ok, false, 'NT sensori harus menolak')
assert.equal(K(sama(sisi('T10', 0, mot('T1', 0, { C7: 'NT' })))).ok, false)
assert.equal(K(sama(sisi('T10', 0, mot('T1', 0)), { vac: null })).ok, false, 'VAC tak tercatat harus menolak')
assert.equal(K(sama(sisi('T10', 0, mot('T1', 0), { 'S4-5': 'NT' }))).ok, false)
const ntBawah = ok<any>(K(sama(sisi('T10', 0, mot('T1', 0), { L3: 'NT' }))))
assert.equal(ntBawah.skor, null, 'skor tidak boleh dihitung dengan NT')

// Label revisi dan sumber tidak boleh hilang; aturan 2019 tidak dikodekan dari ingatan.
assert.equal(REVISI_ISNCSCI, '2011')
const src = readFileSync('src/lib/isncsci.ts', 'utf8')
assert.match(src, /PMC3232636/); assert.match(src, /10\.1179\/204577211X13207446293695/)
const panel = readFileSync('src/pages/bodyhub/PanelIsncsci.tsx', 'utf8')
assert.match(panel, /not a diagnosis/i); assert.match(panel, /2011/); assert.match(panel, /isncsci/i)
console.log('isncsci-klasifikasi: lulus')
