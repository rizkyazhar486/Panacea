// Uji penurunan aliran VA (Aissaoui 2011): kriteria dari sirkulasi yang sama; TDSa tidak dipalsukan.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ujiPenurunanAliranVA, OPSI_WEANING_VA } from '../../src/lib/ecmo/weaningVA.ts'
import { SKENARIO_SYOK_KARDIOGENIK as CS, SIRKULASI_NORMAL as N } from '../../src/lib/ecmo/sirkulasi.ts'

const denganEes = (f: number) => ({ ...CS, lv: { ...CS.lv, ees: N.lv.ees * f }, ecmo: { konfigurasi: 'VA-perifer' as const, rpm: 4000 } })
const st = (r: ReturnType<typeof ujiPenurunanAliranVA>, id: string) => r.kriteria.find((k) => k.id === id)!.status
const lemah = ujiPenurunanAliranVA(denganEes(0.3)), pulih = ujiPenurunanAliranVA(denganEes(0.7))
assert.ok(lemah.h.qEcmo < OPSI_WEANING_VA.qTarget && pulih.h.qEcmo < OPSI_WEANING_VA.qTarget, 'uji dilakukan pada aliran < 1,5 L/menit')
assert.equal(st(lemah, 'lvef'), 'tidak', 'LV lemah: LVEF gagal'); assert.equal(st(lemah, 'vti'), 'tidak', 'LV lemah: VTI gagal')
assert.equal(st(pulih, 'lvef'), 'tercapai', 'LV pulih: LVEF tercapai'); assert.equal(st(pulih, 'vti'), 'tercapai', 'LV pulih: VTI tercapai')
assert.ok(pulih.vti > lemah.vti && pulih.h.ef > lemah.h.ef, 'pemulihan kontraktilitas menaikkan VTI dan LVEF (arah Aissaoui 2011)')
// VTI = SV / luas LVOT: LVOT lebih besar → VTI lebih kecil untuk SV yang sama.
const lvotBesar = ujiPenurunanAliranVA(denganEes(0.7), { ...OPSI_WEANING_VA, diameterLvotCm: 2.4 })
assert.ok(Math.abs(lvotBesar.vti - pulih.h.sv / (Math.PI * 1.2 ** 2)) < 1e-6, 'VTI = SV / (π·(d/2)²)')
// TDSa tidak dipalsukan; alat tidak pernah menyatakan siap disapih.
for (const r of [lemah, pulih]) { assert.equal(st(r, 'tdsa'), 'tidak-disimulasikan', 'TDSa harus dinyatakan tidak disimulasikan'); assert.equal(r.dapatDinyatakanSiap, false) }
// Ambang MAP adalah masukan pendidik dan benar-benar dipakai.
assert.equal(st(ujiPenurunanAliranVA(denganEes(0.3), { ...OPSI_WEANING_VA, mapMin: 90 }), 'map'), 'tidak', 'ambang MAP pendidik harus dipakai')
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /data-ecmo-weaning-va/); assert.match(ui, /cannot declare readiness/i)
console.log('ecmo-weaning-va: lulus')
