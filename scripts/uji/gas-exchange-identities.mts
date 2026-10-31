import assert from 'node:assert/strict'
import { deadSpaceFraction, shuntFraction, GAS_EXCHANGE_IDENTITY_SOURCES } from '../../src/domains/physiology/engine/gasExchangeIdentities.ts'

// dead space — positif (nilai tepat) + berpasangan, batas, negatif
const d = deadSpaceFraction(40, 28); assert.ok(d.ok); assert.equal(d.fraction, 0.3); assert.equal(d.truthClass, 'derived')
assert.equal((deadSpaceFraction(40, 0) as any).fraction, 1)        // batas atas: tidak ada CO2 terekspirasi
assert.equal((deadSpaceFraction(40, 40) as any).fraction, 0)       // batas bawah: sama persis
assert.equal((deadSpaceFraction(5.3, 3.71) as any).fraction, (5.3 - 3.71) / 5.3) // kPa, satuan konsisten tetap benar
for (const [a, e] of [[0, 1], [-1, 1], [NaN, 1], [40, NaN], [Infinity, 1], [40, -1]] as const) assert.deepEqual(deadSpaceFraction(a, e).ok, false, `${a},${e}`)
assert.deepEqual(deadSpaceFraction(40, 40.0001), { ok: false, reason: 'impossible-combination', detail: (deadSpaceFraction(40, 40.0001) as any).detail }) // pasangan tepat di atas batas

// shunt
const s = shuntFraction(20, 18, 14); assert.ok(s.ok); assert.ok(Math.abs(s.fraction - 1 / 3) < 1e-12)
assert.equal((shuntFraction(20, 20, 14) as any).fraction, 0)       // batas: Ca = Cc
assert.equal((shuntFraction(20, 14, 14) as any).fraction, 1)       // batas: Ca = Cv
for (const args of [[20, 20.0001, 14], [20, 13.9999, 14], [14, 14, 14], [13, 12, 14], [NaN, 1, 1], [20, 0, 14], [20, 18, -1], [Infinity, 18, 14]] as const) assert.equal(shuntFraction(...args).ok, false, args.join())
assert.equal((shuntFraction(20, 20.0001, 14) as any).reason, 'impossible-combination')
assert.equal((shuntFraction(NaN, 1, 1) as any).reason, 'invalid-input')

// sumber dan batasan terbawa di setiap hasil yang berhasil (dan tidak ada di penolakan)
const dsOk = deadSpaceFraction(40, 28); assert.ok(dsOk.ok)
assert.deepEqual([...dsOk.sourcePmids], ['28223465', '16126784']); assert.match(dsOk.formula, /Enghoff/)
assert.ok(dsOk.limitations.some((l) => /shunt and V\/Q maldistribution inflate/.test(l)))
const shOk = shuntFraction(20, 18, 14); assert.ok(shOk.ok)
assert.deepEqual([...shOk.sourcePmids], ['8599295', '964271'])
assert.ok(shOk.limitations.some((l) => /venous admixture, not pure shunt/.test(l)) && shOk.limitations.some((l) => /not printed in any abstract/.test(l)))
for (const bad of [deadSpaceFraction(NaN, 1), shuntFraction(20, 21, 14)]) { assert.equal(bad.ok, false); assert.equal('sourcePmids' in bad, false) }
// jujur tentang status verifikasi: hanya abstrak, bentuk persamaan belum terverifikasi dari teks sumber
for (const k of ['deadSpace', 'shunt'] as const) { assert.equal(GAS_EXCHANGE_IDENTITY_SOURCES[k].verifiedFrom, 'abstract'); assert.equal(GAS_EXCHANGE_IDENTITY_SOURCES[k].formVerified, false); assert.ok(GAS_EXCHANGE_IDENTITY_SOURCES[k].pmids.every((id) => /^\d{6,8}$/.test(id))) }
assert.throws(() => { (GAS_EXCHANGE_IDENTITY_SOURCES.shunt.pmids as string[]).push('1') }, TypeError)
console.log('gas-exchange-identities: Bohr–Enghoff dan Qs/Qt tepat, batas, penolakan masukan mustahil tanpa jepit')
