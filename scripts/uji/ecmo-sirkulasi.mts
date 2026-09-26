// Sirkulasi berparameter-tergumpal: validasi numerik + golden hemodinamika VA.
import assert from 'node:assert/strict'
import { simulasiSirkulasi as S, SIRKULASI_NORMAL as N, SKENARIO_SYOK_KARDIOGENIK as CS, aliranPompa, type ParameterSirkulasi } from '../../src/lib/ecmo/sirkulasi.ts'

const di = (x: number, lo: number, hi: number, m: string) => assert.ok(x >= lo && x <= hi, `${m}: ${x.toFixed(2)} tidak dalam [${lo}, ${hi}]`)
const va = (p: ParameterSirkulasi, rpm: number, k: 'VA-perifer' | 'VA-sentral' = 'VA-perifer') => S({ ...p, ecmo: { konfigurasi: k, rpm } })

// Level 2: kekekalan massa, stabilitas, ketakbergantungan langkah waktu.
const n = S(N)
assert.ok(n.sah, 'normal harus sah')
assert.ok(Math.abs(n.volumeTotal - N.volumeDarah) < 1e-6, `volume tidak kekal: ${n.volumeTotal}`)
assert.ok(Math.abs(va(CS, 4000).volumeTotal - CS.volumeDarah) < 1e-6, 'volume kekal dengan ECMO (drainase = return)')
const halus = S(N, 60, 0.00025)
assert.ok(Math.abs(halus.map - n.map) / n.map < 0.01 && Math.abs(halus.coAsli - n.coAsli) / n.coAsli < 0.02, 'hasil tidak boleh bergantung pada langkah waktu')
assert.equal(S({ ...N, hr: 0 }).sah, false, 'HR 0 harus gagal-tertutup')
assert.equal(S({ ...N, volumeDarah: 1000 }).sah, false)

// Level 3: pita dewasa normal (kalibrasi ilustratif yang dikunci).
di(n.map, 70, 105, 'MAP normal'); di(n.coAsli, 4, 7, 'CO normal'); di(n.cvp, 1, 8, 'CVP normal')
di(n.pcwp, 6, 15, 'PCWP normal'); di(n.papMean, 10, 25, 'PAP rata-rata normal'); di(n.ef, 0.5, 0.7, 'EF normal'); di(n.lvedv, 100, 160, 'LVEDV normal')
di(n.coAsli * 1000 / N.hr, 55, 90, 'isi sekuncup')

// Syok kardiogenik menurut kriteria yang dipakai De Lazzari 2025 (BSA 1,9 m² diasumsikan).
const cs = S(CS)
assert.ok(cs.sbp < 90 && cs.pcwp > 15 && cs.coAsli / 1.9 < 2.2, `skenario syok tidak memenuhi kriteria: SBP ${cs.sbp} PCWP ${cs.pcwp} CI ${cs.coAsli / 1.9}`)

// RPM bukan aliran.
assert.ok(va(CS, 2500).qEcmo < 0.1, 'RPM rendah: head tidak melampaui tekanan arteri → aliran ≈ 0')
assert.ok(aliranPompa(4000, 5, 150) === 0, 'tekanan keluar melebihi head → aliran nol, bukan negatif palsu')
assert.ok(aliranPompa(4000, 5, 60) > aliranPompa(4000, 5, 90), 'RPM sama, afterload lebih tinggi → aliran lebih kecil')
assert.ok(aliranPompa(4000, 0, 70) < aliranPompa(4000, 6, 70), 'tekanan vena rendah (suck-down) → aliran turun')
assert.ok(va({ ...CS, volumeDarah: 4700 }, 4000).qEcmo < va(CS, 4000).qEcmo, 'hipovolemia membatasi aliran drainase')

// VA perifer: RPM↑ → aliran↑, MAP↑, beban LV↑, pulsatilitas↓ (arah sesuai ELSO VA & De Lazzari 2025).
const tangga = [3000, 3500, 4000, 4500].map((r) => va(CS, r))
for (let i = 1; i < tangga.length; i++) {
  const a = tangga[i - 1], b = tangga[i]
  assert.ok(b.qEcmo > a.qEcmo, 'RPM↑ → aliran ECMO↑'); assert.ok(b.map > a.map, 'aliran VA↑ → MAP↑')
  assert.ok(b.lvesv > a.lvesv, 'aliran VA↑ → LVESV↑ (afterload LV)'); assert.ok(b.pcwp > a.pcwp, 'aliran VA↑ → PCWP↑')
  assert.ok(b.pulsePressure < a.pulsePressure, 'aliran VA↑ → pulsatilitas↓'); assert.ok(b.coAsli < a.coAsli, 'aliran VA↑ → ejeksi LV asli↓')
  assert.ok(b.fraksiBukaKatupAorta <= a.fraksiBukaKatupAorta, 'aliran VA↑ → katup aorta lebih jarang membuka')
}
assert.ok(tangga[3].lvedv > cs.lvedv, 'LV distensi dibanding tanpa dukungan')
// Pemulihan kontraktilitas pada RPM sama → pulsatilitas kembali, ejeksi asli naik.
const pulih = va({ ...CS, lv: { ...CS.lv, ees: N.lv.ees * 0.7 } }, 4000)
assert.ok(pulih.pulsePressure > tangga[2].pulsePressure && pulih.coAsli > tangga[2].coAsli, 'LV pulih → pulsatilitas & curah asli naik')
// Geometri: return femoral mendorong darah retrograd ke arah arkus; return sentral tidak.
assert.ok(va(CS, 4500, 'VA-sentral').aliranArkusKeDistal > tangga[3].aliranArkusKeDistal + 1, 'sentral vs perifer: aliran arkus berbeda')
console.log('ecmo-sirkulasi: lulus')
