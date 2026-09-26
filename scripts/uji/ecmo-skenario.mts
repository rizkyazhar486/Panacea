// Skenario krisis ECMO: petunjuk dihitung dari keadaan; penyelesaian dinilai dari fisiologi, bukan jawaban.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SKENARIO, DASAR, jalankan, petunjuk, type KeadaanSkenario } from '../../src/lib/ecmo/skenario.ts'

const d = jalankan(DASAR)
assert.ok(d.h.sah && d.v.status === 'tunak', 'keadaan dasar skenario harus tunak')
const cari = (id: string) => { const s = SKENARIO.find((x) => x.id === id); assert.ok(s, `skenario ${id} hilang`); return s! }
const uji = (id: string, petunjukWajib: string[], perbaikan: (k: KeadaanSkenario) => KeadaanSkenario, salah?: (k: KeadaanSkenario) => KeadaanSkenario) => {
  const s = cari(id), k = s.terapkan(DASAR), g = jalankan(k)
  const ids = petunjuk(d, g).map((p) => p.id)
  for (const w of petunjukWajib) assert.ok(ids.includes(w), `${id}: petunjuk '${w}' tidak muncul dari keadaan (ada: ${ids.join(',')})`)
  assert.equal(s.selesai(d, g, k), false, `${id}: krisis tidak boleh langsung dianggap selesai`)
  const kb = perbaikan(k); assert.equal(s.selesai(d, jalankan(kb), kb), true, `${id}: tindakan yang benar harus menyelesaikan krisis`)
  if (salah) { const ks = salah(k); assert.equal(s.selesai(d, jalankan(ks), ks), false, `${id}: tindakan yang salah tidak boleh menyelesaikan krisis`) }
}
uji('drainase', ['pdrain', 'q'], (k) => ({ ...k, hemo: { ...k.hemo, volumeDarah: k.hemo.volumeDarah + 550 } }),
  (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 5000 } } }))
uji('sweep', ['paco2', 'o2'], (k) => ({ ...k, gas: { ...k.gas, sweep: 3 } }), (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 5000 } } }))
uji('pompa', ['q', 'map'], (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 4000 } } }), (k) => ({ ...k, gas: { ...k.gas, sweep: 6 } }))
uji('trombosis', ['dp', 'q'], (k) => ({ ...k, jamBekuan: 0 }), (k) => ({ ...k, gas: { ...k.gas, sweep: 8 } }))
uji('distensi-lv', ['katup', 'pp'], (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 3000 } } }),
  (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 5500 }, volumeDarah: k.hemo.volumeDarah + 300 } }))
// Trombosis: ΔP naik sementara drainase kurang negatif (pola pembeda dari masalah drainase).
{ const g = jalankan(cari('trombosis').terapkan(DASAR)), p = petunjuk(d, g)
  const dp = p.find((x) => x.id === 'dp')!, pd = p.find((x) => x.id === 'pdrain')!
  assert.ok(dp.ke > dp.dari && pd.ke > pd.dari, 'trombosis: ΔP naik dan drainase kurang negatif') }
{ const g = jalankan(cari('drainase').terapkan(DASAR)), pd = petunjuk(d, g).find((x) => x.id === 'pdrain')!
  assert.ok(pd.ke < pd.dari, 'drainase: tekanan drainase lebih negatif') }
// Tanpa perubahan tidak ada petunjuk palsu.
assert.deepEqual(petunjuk(d, jalankan(DASAR)), [], 'keadaan tak berubah → tanpa petunjuk')
// Tiap skenario menyatakan batasnya.
for (const s of SKENARIO) assert.ok(s.batas.length > 20, `${s.id}: batas simulasi harus dinyatakan`)
// UI tidak punya tombol "jawaban".
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.doesNotMatch(ui, /correct answer|jawaban benar/i, 'skenario tidak boleh berupa kuis tombol-jawaban')
assert.match(ui, /data-ecmo-skenario/, 'skenario harus terpasang di panel')
console.log('ecmo-skenario: lulus')
