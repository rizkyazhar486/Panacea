// Kernel kopling multi-skala: kontrak, penjadwalan multi-laju, dua arah, provenance, ketidakpastian.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { jalankanKopling, rantaiProvenans, rerata, validasiKomposisi, medanBaru, type KontrakKemampuan } from '../../src/lib/multiskala/kernelKopling.ts'
import { modulContoh, modulMolekul, modulSel, modulJaringan, PARAM_ILUSTRATIF as P, regangAwal, STATUS_KEBENARAN } from '../../src/lib/multiskala/contohKatupJaringan.ts'

// 1. Komposisi gagal tertutup.
assert.deepEqual(validasiKomposisi(modulContoh()), [])
const salahSatuan = { ...modulSel(P), consumes: [{ nama: 'molecular.occupancy', satuan: 'percent' }, { nama: 'tissue.strain', satuan: 'strain' }] }
assert.ok(validasiKomposisi([modulMolekul(P), salahSatuan, modulJaringan(P)]).some((g) => /unit mismatch/.test(g)), 'ketidakcocokan satuan antar-skala lolos')
assert.ok(validasiKomposisi([modulMolekul(P), modulSel(P)]).some((g) => /no module produces/.test(g)), 'medan tanpa produsen lolos')
assert.ok(validasiKomposisi([...modulContoh(), { ...modulJaringan(P), id: 'tissue.b' }]).some((g) => /more than one module/.test(g)), 'dua produsen untuk satu medan lolos')
assert.throws(() => jalankanKopling([modulMolekul(P), modulSel(P)], 10), /invalid multiscale composition/)
assert.throws(() => jalankanKopling(modulContoh(), 10), /initial condition/, 'medan tanpa kondisi awal dipakai diam-diam')

// 2. Deterministik & terbatas.
const a = jalankanKopling(modulContoh(), 600, [regangAwal(P)])
const b = jalankanKopling(modulContoh(), 600, [regangAwal(P)])
assert.deepEqual([...a.pesanTerakhir['tissue.stiffness'].medan.nilai], [...b.pesanTerakhir['tissue.stiffness'].medan.nilai], 'hasil tidak deterministik')
assert.equal(a.jejak.at(-1)!.id, b.jejak.at(-1)!.id, 'id provenance tidak deterministik')
for (const n of ['molecular.occupancy', 'cellular.activation']) for (const v of a.pesanTerakhir[n].medan.nilai) assert.ok(v >= 0 && v <= 1, `${n} keluar dari [0,1]`)
for (const v of a.pesanTerakhir['tissue.stiffness'].medan.nilai) assert.ok(v >= P.e0kPa && v <= P.e0kPa * (1 + P.gamma), 'kekakuan di luar batas model')

// 3. Multi-laju: molekul dt=1, sel dt=5, jaringan dt=10 selama 600 s (t=0 termasuk).
const hitung = (m: string) => a.jejak.filter((p) => p.modul === m).length
assert.deepEqual([hitung('molecular.binding'), hitung('cellular.activation'), hitung('tissue.mechanics')], [601, 121, 61 * 2], 'penjadwalan multi-laju salah')

// 4. Dua arah: mematikan umpan balik regangan ke bawah harus mengubah hasil molekul.
const atas = jalankanKopling(modulContoh({ ...P, hubungkanKeBawah: false }), 600, [regangAwal(P)])
const beda = Math.abs(rerata(a.pesanTerakhir['molecular.occupancy'].medan.nilai) - rerata(atas.pesanTerakhir['molecular.occupancy'].medan.nilai))
assert.ok(beda > 0.02, `kopling ke-bawah tidak berpengaruh (Δθ=${beda})`)

// 5. Ketidakpastian dirambatkan lintas skala (bukan nol) dan provenance menelusuri tiga skala.
assert.ok(rerata(a.pesanTerakhir['tissue.stiffness'].medan.sigma) > 0, 'ketidakpastian tidak sampai ke skala jaringan')
const rantai = rantaiProvenans(a, a.pesanTerakhir['tissue.stiffness'].provenans.id)
assert.ok(['tissue.mechanics', 'cellular.activation', 'molecular.binding', 'initial-condition'].every((m) => rantai.some((p) => p.modul === m)), 'rantai provenance tidak menjangkau semua skala')

// 6. Perhalusan adaptif dipicu dan tercatat.
assert.ok(a.perhalus.length > 0 && a.perhalus.every((r) => r.modul === 'molecular.binding' && r.sel.length > 0), 'perhalusan adaptif tidak tercatat')

// 7. Modul menghasilkan medan tak dideklarasikan / nilai tak hingga -> ditolak.
const nakal: KontrakKemampuan<null> = { id: 'x', versi: '1', skala: 'organ', dt: 1, produces: [{ nama: 'x.a', satuan: 'u' }], consumes: [], awal: () => null, step: () => ({ state: null, keluaran: [medanBaru('x.b', 'u', 1, 1)] }) }
assert.throws(() => jalankanKopling([nakal], 1), /undeclared field/)
const takHingga: KontrakKemampuan<null> = { ...nakal, step: () => { const m = medanBaru('x.a', 'u', 1, 1); m.nilai[0] = NaN; return { state: null, keluaran: [m] } } }
assert.throws(() => jalankanKopling([takHingga], 1), /non-finite/)

// 8. Batas kebenaran tampil di UI.
assert.match(STATUS_KEBENARAN, /simulated/)
assert.match(readFileSync('src/components/PanelKoplingMultiSkala.tsx', 'utf8'), /data-status-kebenaran>\{STATUS_KEBENARAN\}/, 'label simulasi tidak tampil')
assert.match(readFileSync('src/pages/BodyExposureOS.tsx', 'utf8'), /<PanelKoplingMultiSkala \/>/)
console.log(`kernel-kopling-multiskala: kontrak gagal tertutup, multi-laju 601/121/61, dua arah Δθ=${beda.toFixed(3)}, provenance lintas skala, ketidakpastian dirambatkan`)
