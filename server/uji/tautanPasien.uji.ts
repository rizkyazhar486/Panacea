import assert from 'node:assert/strict'
import { bolehAksesPasien, hashKode, terbitkanKodeTaut, tebusKodeTaut, tertautKe, type KodeTaut, type TautanPasien } from '../src/aksesKlinis.js'
const kini = new Date('2026-09-26T10:00:00Z')
const dokter = { id: 'd1', klinisi: true }, pasien = { id: 'u1', email: 'siti@x.id', role: 'pasien' }, lain = { id: 'u2', email: 'lain@x.id', role: 'pasien' }
const acakTetap = () => Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

assert.deepEqual(terbitkanKodeTaut('pt-1', { id: 'u1', klinisi: false }, kini), { ok: false, alasan: 'not-clinician' }, 'pasien dapat menerbitkan kode tautan')
assert.deepEqual(terbitkanKodeTaut('self-sitixid', dokter, kini), { ok: false, alasan: 'no-patient' }, 'kode diterbitkan untuk rekam diri akun lain')
const t = terbitkanKodeTaut('pt-1', dokter, kini, acakTetap)
assert.ok(t.ok)
if (!t.ok) throw new Error()
assert.match(t.kode, /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/)
assert.ok(!JSON.stringify(t.catatan).includes(t.kode.replace('-', '')), 'kode mentah tersimpan di server')
assert.equal(t.catatan.hash, hashKode(t.kode.toLowerCase().replace('-', ' ')), 'kode tidak dinormalisasi (huruf kecil/spasi ditolak)')

const kodes: KodeTaut[] = [t.catatan], tautan: Record<string, TautanPasien> = {}
assert.deepEqual(tebusKodeTaut('XXXXX-XXXXX', pasien, kodes, tautan, kini), { ok: false, alasan: 'invalid' })
assert.deepEqual(tebusKodeTaut(t.kode, pasien, kodes, tautan, new Date(kini.getTime() + 8 * 864e5)), { ok: false, alasan: 'expired' }, 'kode kedaluwarsa diterima')
const r = tebusKodeTaut(t.kode, pasien, kodes, tautan, kini)
assert.ok(r.ok)
if (!r.ok) throw new Error()
tautan[r.tautan.patientId] = r.tautan; kodes[0] = { ...kodes[0], dipakaiPada: kini.toISOString(), dipakaiOleh: 'u1' }
assert.deepEqual(tebusKodeTaut(t.kode, lain, kodes, tautan, kini), { ok: false, alasan: 'used' }, 'kode sekali pakai dipakai ulang')
// Kode baru untuk pasien praktik yang sudah tertaut ke akun lain -> ditolak.
const t2 = terbitkanKodeTaut('pt-1', dokter, kini); if (!t2.ok) throw new Error()
assert.deepEqual(tebusKodeTaut(t2.kode, lain, [t2.catatan], tautan, kini), { ok: false, alasan: 'already-linked' }, 'pasien praktik tertaut ke dua akun')

// Akses: tautan membuka hanya pasien praktik itu, hanya untuk akun itu.
const boleh = (u: typeof pasien, pid: string) => bolehAksesPasien(u, pid, false, () => undefined, (p) => tertautKe(u, p, tautan))
assert.equal(boleh(pasien, 'pt-1'), true, 'akun tertaut tidak dapat membuka rekam praktiknya')
assert.equal(boleh(lain, 'pt-1'), false, 'akun lain membuka rekam praktik tertaut')
assert.equal(boleh(pasien, 'pt-2'), false, 'tautan membuka pasien praktik lain')
console.log('tautanPasien: kode sekali pakai (hash saja, 7 hari) menautkan satu pasien praktik ke satu akun; akses hanya untuk akun itu')
