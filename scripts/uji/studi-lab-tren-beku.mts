import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { analisisTrenLab } from '../../src/lib/labTrend.ts'
import { JENIS_LAB } from '../../src/lib/lab.ts'

const { protokol, kasus } = JSON.parse(readFileSync('server/data-validasi/lab-tren-pribadi-v1.json', 'utf8'))
assert.equal(protokol.id, 'lab-tren-pribadi')
assert.ok(protokol.titikAkhir.length >= 4 && protokol.penilaiPerKasus >= 2, 'protokol tanpa titik akhir/penilai ganda')
assert.equal(protokol.etika.dataPasienNyata, false, 'set kasus beku ini harus sintetis')
assert.equal(new Set(kasus.map((k: { id: string }) => k.id)).size, kasus.length)
const versi = new Set(kasus.map((k: { versiSistem: string }) => k.versiSistem))
assert.equal(versi.size, 1, 'kasus beku dari versi sistem berbeda bercampur')
const blob = `labTrend.ts@${execSync('git hash-object src/lib/labTrend.ts').toString().trim()}`
if ([...versi][0] !== blob) {
  console.warn(`studi-lab-tren-beku: labTrend.ts changed since the frozen set (${[...versi][0]} vs ${blob}). The study remains valid for the frozen version; publish protocol v2 with regenerated cases before validating the new algorithm.`)
} else {
  // Versi sama: setiap keluaran beku harus dapat direproduksi persis dari masukannya.
  for (const k of kasus) {
    const j = JENIS_LAB.find((x) => x.id === k.masukan.tes)!
    const r = analisisTrenLab(k.masukan.seri.map((b: { tanggal: string; nilai: number }, i: number) => ({ id: `s${i}`, ...b })), j)
    assert.equal(r?.status ?? null, k.keluaran?.status ?? null, `${k.id}: frozen output does not reproduce with the recorded system version`)
    assert.equal(r?.alasan ?? null, k.keluaran?.alasan ?? null, `${k.id}: frozen reason does not reproduce`)
  }
}
console.log(`studi-lab-tren-beku: ${kasus.length} kasus, ${[...versi][0]}, keluaran dapat direproduksi`)
