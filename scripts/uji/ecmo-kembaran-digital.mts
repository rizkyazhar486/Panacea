// ECMO digital twin — validasi numerik + golden fisiologis (arah), sesuai piramida validasi.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { saturasiDariPO2, po2DariSaturasi, kandunganO2, po2DariKandungan } from '../../src/lib/ecmo/oksigen.ts'
import { simulasiVV, simulasiVA, fraksiResirkulasi, jelaskanVV, jelaskanVA, CABANG_AORTA, type MasukanVV, type MasukanVA } from '../../src/lib/ecmo/mesin.ts'
import { MODEL, BUKTI, buktiUntuk } from '../../src/lib/ecmo/bukti.ts'

const dekat = (a: number, b: number, tol: number, m: string) => assert.ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b}`)

// ── Level 2: persamaan & satuan ──
dekat(saturasiDariPO2(26.8), 0.5, 0.01, 'P50 kurva baku ≈ 26.8 mmHg')
dekat(saturasiDariPO2(100), 0.977, 0.005, 'S(100 mmHg)')
for (const s of [0.3, 0.6, 0.9, 0.97]) dekat(saturasiDariPO2(po2DariSaturasi(s)), s, 1e-6, 'kebalikan ODC')
dekat(kandunganO2(15, 1, 100), 1.39 * 15 + 0.34, 1e-9, 'C = 1.39·Hb·S + 0.0034·PO2 (Hb g/dL)')
for (const c of [8, 14, 19]) dekat(kandunganO2(12, saturasiDariPO2(po2DariKandungan(c, 12)), po2DariKandungan(c, 12)), c, 1e-6, 'kebalikan kandungan')
assert.equal(saturasiDariPO2(0), 0); assert.equal(saturasiDariPO2(-5), 0)

const vv: MasukanVV = { co: 6, qEcmo: 4, jarakKanulaCm: 15, hb: 12, vo2: 250, shunt: 0.9, fio2: 0.3, va: 1, hco3: 26, fdo2: 1, sweep: 3, fungsiMembran: 1 }
const V = (x: Partial<MasukanVV> = {}) => simulasiVV({ ...vv, ...x })
const b = V()
assert.equal(b.status, 'tunak')
// Neraca O2 tertutup: VO2 = 10·CO·(Ca − Cv)
dekat(10 * vv.co * (b.cao2 - b.cvo2), vv.vo2, 1e-6, 'Fick tertutup')
// Tidak ada NaN/nilai mustahil di ruang masukan yang sah.
for (const co of [3, 6, 10]) for (const q of [0, 2, 5]) for (const d of [2, 10, 25]) for (const s of [0, 0.5, 1]) {
  const k = V({ co, qEcmo: q, jarakKanulaCm: d, shunt: s })
  if (k.status === 'pasokan-o2-tak-cukup') continue
  for (const x of [k.sao2, k.svo2, k.sPost, k.resirkulasi]) assert.ok(x >= 0 && x <= 1, `saturasi/fraksi di luar 0-1: co${co} q${q} d${d} s${s}`)
  assert.ok(Number.isFinite(k.do2) && k.do2 > 0, `DO2 tak terhingga/negatif: co${co} q${q} d${d} s${s}`)
  assert.ok(k.cvo2 > 0, `kandungan vena ≤ 0 tanpa status gagal-tertutup: co${co} q${q} d${d} s${s}`)
}
assert.equal(V({ hb: -1 }).status, 'masukan-tidak-sah')
assert.equal(V({ vo2: 2000, qEcmo: 0, shunt: 1 }).status, 'pasokan-o2-tak-cukup', 'VO2 mustahil harus gagal-tertutup, bukan angka palsu')

// ── Level 3: golden arah fisiologis ──
assert.ok(V({ sweep: 6 }).co2.paco2 < V({ sweep: 2 }).co2.paco2, 'sweep↑ → PaCO2↓')
assert.ok(V({ sweep: 6 }).co2.vco2Membran > V({ sweep: 2 }).co2.vco2Membran, 'sweep↑ → pembuangan CO2 membran↑')
assert.ok(V({ sweep: 6 }).co2.ph > V({ sweep: 2 }).co2.ph, 'PaCO2↓ → pH↑')
assert.ok(V({ sweep: 6 }).co2.aliranOtakRelatif < V({ sweep: 2 }).co2.aliranOtakRelatif, 'PaCO2↓ → aliran otak (arah)↓')
dekat(V({ sweep: 6 }).sao2, V({ sweep: 2 }).sao2, 0.01, 'oksigenasi terutama ditentukan aliran darah, bukan sweep')
assert.ok(V({ fdo2: 1 }).pPost > V({ fdo2: 0.5 }).pPost, 'FdO2↑ → PO2 pasca-oksigenator↑')
assert.ok(V({ fdo2: 1 }).sPost <= 1 && V({ fdo2: 0.8 }).sPost > 0.99, 'plafon saturasi fisik')
assert.equal(V({ sweep: 0 }).pPost, V({ sweep: 0 }).pPre, 'sweep 0 → tanpa transfer gas')
assert.ok(V({ qEcmo: 5, jarakKanulaCm: 25 }).sao2 > V({ qEcmo: 2, jarakKanulaCm: 25 }).sao2, 'aliran efektif↑ (resirkulasi rendah) → SaO2↑')
assert.ok(V({ co: 9 }).sao2 < V({ co: 5 }).sao2, 'CO↑ tanpa aliran ECMO↑ → Q/CO↓ → SaO2↓ (ELSO VV 2021)')
assert.ok(V({ jarakKanulaCm: 3 }).resirkulasi > V({ jarakKanulaCm: 20 }).resirkulasi, 'kanula berdekatan → resirkulasi↑')
assert.ok(V({ jarakKanulaCm: 3 }).sao2 < V({ jarakKanulaCm: 20 }).sao2, 'resirkulasi↑ → dukungan efektif↓')
{ // Paradoks ELSO: dengan kanula berdekatan, menaikkan aliran dapat MENURUNKAN SaO2.
  const r1 = V({ jarakKanulaCm: 4, co: 5, qEcmo: 3 }), r2 = V({ jarakKanulaCm: 4, co: 5, qEcmo: 6 })
  assert.ok(r2.resirkulasi > r1.resirkulasi, 'aliran↑ → fraksi resirkulasi↑')
  assert.ok(r2.qEfektif - r1.qEfektif < 6 - 3, 'aliran tambahan tidak semuanya efektif')
}
{ const h = V({ hb: 8 }), n = V({ hb: 12 })
  assert.ok(h.cao2 < n.cao2 && h.do2 < n.do2, 'Hb↓ → CaO2 & DO2↓'); dekat(h.sao2, n.sao2, 0.03, 'saturasi hampir tak berubah') }
assert.ok(V({ vo2: 350 }).oer > V({ vo2: 250 }).oer && V({ vo2: 350 }).svo2 < V({ vo2: 250 }).svo2, 'VO2↑ → OER↑, SvO2↓')
{ // Resirkulasi: metode kandungan memulihkan R model; metode saturasi menaksir berlebih (O2 terlarut diabaikan).
  const k = V({ jarakKanulaCm: 4 })
  const cPre = k.resirkulasi * kandunganO2(12, k.sPost, k.pPost) + (1 - k.resirkulasi) * k.cvo2
  dekat(cPre, kandunganO2(12, k.sPre, k.pPre), 1e-3, 'neraca kandungan pra-oksigenator')
  assert.ok(k.resirkulasiDariSaturasi > k.resirkulasi, 'rumus saturasi menaksir berlebih saat PO2 pasca-oksigenator sangat tinggi')
}
dekat(fraksiResirkulasi(10, 0, 6), 0, 0, 'tanpa aliran tak ada resirkulasi')

{ // Pita tipikal ELSO VV 2021: SaO2 "typically 80–90%", vena 60–80%; Q/CO < 60% sering dengan SaO2 < 90% pada ARDS.
  const t = simulasiVV({ ...vv, co: 7.5, qEcmo: 4, hb: 10, vo2: 320 })
  assert.ok(t.sao2 >= 0.8 && t.sao2 <= 0.95, `baseline di luar pita tipikal ELSO: ${t.sao2}`)
  assert.ok(t.svo2 >= 0.55 && t.svo2 <= 0.8, `SvO2 baseline di luar pita: ${t.svo2}`)
  assert.ok(simulasiVV({ ...vv, co: 7.5, qEcmo: 3.2, hb: 10, vo2: 320 }).sao2 < 0.9, 'Q/CO ≈ 0.43 → SaO2 < 90%')
}

// VA perifer: sirkulasi ganda
const va: MasukanVA = { qLv: 0.5, qEcmo: 4, hb: 12, vo2: 250, shunt: 0.8, fio2: 0.4, va: 3, hco3: 24, fdo2: 1, sweep: 3, fungsiMembran: 1 }
const A = (x: Partial<MasukanVA> = {}) => simulasiVA({ ...va, ...x })
const a0 = A(), a1 = A({ qLv: 3 })
assert.equal(a0.status, 'tunak', 'VA dasar harus tunak'); assert.equal(a1.status, 'tunak', 'VA dengan LV pulih harus tunak')
assert.ok(a0.cabang[0].fraksiAsli > 0.99 && a0.cabang[6].fraksiAsli < 0.01, 'aliran asli mengisi dari akar aorta, ECMO dari iliaka')
const idx = (k: ReturnType<typeof A>) => CABANG_AORTA.findIndex((c) => c.id === k.titikCampur)
assert.ok(idx(a1) > idx(a0), 'pemulihan LV → titik campur bergerak ke distal')
const s = (k: ReturnType<typeof A>, id: string) => k.cabang.find((c) => c.id === id)!.saturasi
assert.ok(s(a1, 'brakiosefal') < s(a0, 'brakiosefal') - 0.05, 'LV pulih + paru buruk → SO2 radial kanan turun')
assert.ok(s(a1, 'iliaka') > 0.97, 'tubuh bawah tetap dipasok darah ECMO')
assert.ok(s(a1, 'koroner') < s(a1, 'iliaka'), 'perbedaan atas-bawah muncul (sirkulasi ganda)')
assert.ok(s(A({ qLv: 3, shunt: 0.05 }), 'brakiosefal') > s(a1, 'brakiosefal'), 'paru asli pulih → perbedaan menutup')
assert.ok(A({ qEcmo: 5 }).fraksiAsliTotal < A({ qEcmo: 2 }).fraksiAsliTotal, 'aliran VA↑ → kontribusi ECMO pada aliran sistemik↑')
dekat(CABANG_AORTA.reduce((x, c) => x + c.fraksi, 0), 1, 1e-12, 'fraksi cabang = 1')
assert.ok(A().belumDisimulasikan.some((t) => /IABP|Impella/i.test(t)), 'perangkat unloading LV harus dinyatakan belum disimulasikan')
assert.ok(A().belumDisimulasikan.some((t) => /central-VA unloading/i.test(t) && /CARDIOSIM/.test(t)), 'ketidaksesuaian besaran dengan CARDIOSIM harus dinyatakan')
assert.ok(!A().belumDisimulasikan.some((t) => /afterload/i.test(t)), 'beban LV kini disimulasikan (sirkulasi.ts); jangan menyatakannya hilang')
assert.equal(A({ qLv: 0, qEcmo: 0 }).status, 'masukan-tidak-sah')

// Penjelasan berasal dari transisi keadaan, bukan teks generik.
const j = jelaskanVV(vv, V(), { ...vv, sweep: 6 }, V({ sweep: 6 })).map((x) => x.besaran)
assert.deepEqual(j.slice(0, 3), ['Sweep gas', 'Membrane CO₂ removal', 'PaCO₂']); assert.ok(j.includes('pH'))
assert.deepEqual(jelaskanVV(vv, V(), vv, V()), [], 'tanpa perubahan tak ada penjelasan')
const jva = jelaskanVA(va, a0, { ...va, qLv: 3 }, a1).map((x) => x.besaran)
assert.ok(jva[0] === 'Native LV output' && jva.some((t) => t.startsWith('Mixing point')), 'rantai VA memuat pergeseran titik campur')

// Provenans: setiap model menunjuk bukti yang ada; UI tidak memuat sitasi sendiri.
for (const id of Object.keys(MODEL)) if (MODEL[id].status !== 'verifikasi-sumber-tertunda' || MODEL[id].bukti.length) buktiUntuk(id)
for (const b of Object.values(BUKTI)) assert.ok(b.pmid && b.doi, `bukti ${b.id} tanpa PMID/DOI`)
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.doesNotMatch(ui, /doi\.org\/10\.|PMID \d/, 'UI tidak boleh menulis sitasi langsung')
assert.doesNotMatch(ui, /Math\.random/, 'tanpa angka acak di UI')
assert.match(ui, /not yet simulated/i); assert.doesNotMatch(ui, /ELSO[- ](endorsed|certified)/i)
console.log('ecmo-kembaran-digital: lulus')
