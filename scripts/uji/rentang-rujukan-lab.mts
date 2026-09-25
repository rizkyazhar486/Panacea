import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JENIS_LAB, periksaRujukanLab, rentangUntuk } from '../../src/lib/lab.ts'
import { analisisTrenLab } from '../../src/lib/labTrend.ts'

// Setiap lab mencetak rentang rujukannya sendiri. Dulu tanda "di luar rentang"
// selalu memakai satu rentang umum; kini rentang dari lembar hasil menang bila diisi.
const gdp = JENIS_LAB.find((j) => j.id === 'gdp')!
assert.deepEqual(periksaRujukanLab('', ''), { ok: true })
assert.deepEqual(periksaRujukanLab('74', '106'), { ok: true, bawah: 74, atas: 106 })
assert.deepEqual(periksaRujukanLab('3,9', ''), { ok: true, bawah: 3.9 })
for (const [b, a] of [['106', '74'], ['x', ''], ['70 mg', '100'], ['', '0']]) assert.equal(periksaRujukanLab(b, a).ok, false, `rentang buruk diterima: ${b}–${a}`)

// Rentang dari lab dipakai; tanpa itu jatuh ke rentang umum dan ditandai.
assert.deepEqual(rentangUntuk({ id: 'a', tanggal: '2026-09-20', nilai: 104, rujukanBawah: 74, rujukanAtas: 106 }, gdp), { bawah: 74, atas: 106, dariLab: true })
assert.equal(rentangUntuk({ id: 'a', tanggal: '2026-09-20', nilai: 104 }, gdp).dariLab, false)

// 104 mg/dL: di luar rentang umum 70–100, tetapi DI DALAM rentang lab 74–106.
const riwayat = (akhir: { rujukanBawah?: number; rujukanAtas?: number }) => [
  { id: '1', tanggal: '2026-01-01', nilai: 103 }, { id: '2', tanggal: '2026-02-01', nilai: 104 },
  { id: '3', tanggal: '2026-03-01', nilai: 103 }, { id: '4', tanggal: '2026-04-01', nilai: 104, ...akhir },
]
assert.equal(analisisTrenLab(riwayat({}), gdp)!.diLuarRentangPopulasi, true)
assert.equal(analisisTrenLab(riwayat({ rujukanBawah: 74, rujukanAtas: 106 }), gdp)!.diLuarRentangPopulasi, false, 'rentang dari lembar lab diabaikan oleh mesin tren')

const ui = readFileSync('src/components/UbinLab.tsx', 'utf8')
assert.match(ui, /aria-label="Reference range low \(from your report\)"/, 'isian rentang dari lembar lab hilang')
assert.match(ui, /from your report/, 'tampilan tidak membedakan rentang dari lab vs rentang umum')
assert.match(readFileSync('server/src/labFhir.ts', 'utf8'), /As printed on the laboratory report \(patient-transcribed\)/, 'referenceRange FHIR tanpa keterangan asal')
console.log('rentang-rujukan-lab: rentang dari lembar lab divalidasi, dipakai mesin tren dan FHIR, rentang umum hanya cadangan')
