import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bacaDicom, urutkanSeri } from '../../src/lib/dicom.ts'
import { buatVolumeMpr } from '../../src/lib/dicomMpr.ts'
import { jendelaAwalVolume, susunVolumeTekstur, ambangKeTekstur } from '../../src/lib/volumeTekstur.ts'
import { KELAS_JARINGAN } from '../../src/lib/pencitraanVolumetrik.ts'
import { lapisanAwalCt, lapisanAwalRelatif, lapisanKeUniform, MAKS_LAPISAN } from '../../src/lib/lapisanVolume.ts'
import { irisanFantom } from './fantomDicom.ts'

// 1. Rentang awal CT diturunkan dari kelas HU bersumber, bukan diketik ulang.
const k = (a: string) => KELAS_JARINGAN.find((x) => x.nama.startsWith(a))!
const ct = lapisanAwalCt()
assert.deepEqual([ct[1].bawah, ct[1].atas], [k('Cancellous').min, k('Cortical').maks], 'rentang tulang tidak diturunkan dari KELAS_JARINGAN')
assert.deepEqual([ct[0].bawah, ct[0].atas], [k('Fat').min, k('Liver').maks])
assert.equal(ct[2].aktif, false, 'lapisan kontras menyala bawaan — padahal hanya ada bila kontras diberikan')
assert.ok(ct[0].opasitas < 1 && ct[1].opasitas === 1, 'kulit harus tembus pandang di atas tulang')
// MRI: tanpa skala mutlak → tanpa nama jaringan.
const mr = lapisanAwalRelatif({ bawah: 0, atas: 1000 })
assert.ok(mr.every((l) => /^Layer \d$/.test(l.nama)), 'lapisan MRI memakai nama jaringan tanpa skala mutlak')

// 2. Jalur penuh: fantom DICOM → pengurai → volume → tekstur → uniform.
const citra = Array.from({ length: 48 }, (_, z) => { const h = bacaDicom(irisanFantom(z)); assert.ok(h.ok, 'fantom tidak terbaca'); return h.data })
const vol = buatVolumeMpr(urutkanSeri(citra.map((c) => ({ citra: c }))).map((x) => x.citra))
assert.ok(vol.ok, 'volume fantom gagal')
const jendela = jendelaAwalVolume(vol.volume)
const tek = susunVolumeTekstur(vol.volume, jendela)
assert.ok(tek.ok)
const u = lapisanKeUniform(ct, tek.tekstur.jendela)
assert.equal(u.jumlah, 2, 'lapisan aktif tidak sampai ke shader')
assert.equal(u.rentang[1][0], ambangKeTekstur(ct[1].bawah, tek.tekstur.jendela), 'konversi HU→tekstur tidak memakai jendela tekstur')
// Fraksi voksel yang benar-benar jatuh di rentang tulang harus ada (fantom punya silinder 900 HU).
const d = tek.tekstur.data
let tulang = 0, lunak = 0
for (let i = 0; i < d.length; i++) {
  const t = d[i] / 255
  if (t >= u.rentang[1][0] && t <= u.rentang[1][1]) tulang++
  else if (t >= u.rentang[0][0] && t <= u.rentang[0][1]) lunak++
}
assert.ok(tulang > 0 && lunak > tulang, `lapisan tidak memisahkan fantom (tulang ${tulang}, lunak ${lunak})`)

// 3. Lapisan rusak dibuang, bukan dipaksa masuk; maksimum tiga.
const rusak = lapisanKeUniform([{ ...ct[0], bawah: 500, atas: 100 }, { ...ct[1], bawah: 5000, atas: 6000 }], { bawah: -1000, atas: 1000 })
assert.equal(rusak.jumlah, 0, 'rentang terbalik/di luar jendela tetap digambar')
assert.equal(lapisanKeUniform([...ct, ...ct].map((l) => ({ ...l, aktif: true })), jendela).jumlah, MAKS_LAPISAN)

// 4. Shader & UI.
const komp = readFileSync('src/components/VolumeDicom3D.tsx', 'utf8')
assert.match(komp, /if \(uMode == 4\)/, 'mode lapisan tidak ada di shader')
assert.match(komp, /akum\.rgb \+= \(1\.0 - akum\.a\) \* a \* uLapisanWarna\[k\]/, 'lapisan tidak dikomposit depan-ke-belakang')
assert.match(komp, /gradien\(p, uLangkah \* uHalus\)/, 'penghalusan tidak memengaruhi bayangan')
const ui = readFileSync('src/pages/bodyhub/VolumeDicomBagian.tsx', 'utf8')
assert.match(ui, /lapisanAwalCt\(\) : lapisanAwalRelatif\(jendela\)/, 'MRI diberi lapisan HU CT')
assert.match(ui, /aria-label="Surface smoothing"/)
console.log(`lapisan-volume: rentang dari kelas HU bersumber, fantom → ${tulang} voksel tulang / ${lunak} lunak, komposit depan-ke-belakang, MRI tanpa nama jaringan`)
