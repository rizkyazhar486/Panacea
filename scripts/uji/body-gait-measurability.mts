// ENG-D7-02: bukti per-fixture terukur/tidak terukur, dengan penyebab terukur. Laporan = jalan ulang; vonis jujur; tidak ada fixture yang
// "lulus" tanpa fase tumpu di kedua kaki. Status kriteria tetap FAIL selama RUN dan betina tidak terukur (sifat gerak/geometri sumber).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const regen = () => JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', 'scripts/qa/gait-measurability.mjs'], { encoding: 'utf8' }))
const committed = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gait_measurability.json', 'utf8'))
assert.deepEqual(regen(), committed, 'gait_measurability.json harus sama dengan jalan ulang: jalankan scripts/qa/gait-measurability.mjs --out')
assert.equal(committed.fixtures.length, 4, 'empat fixture: jantan/betina x WALK/RUN')
const fx = (body: string, clip: string) => committed.fixtures.find((f: any) => f.body === body && f.clip === clip)

// konsistensi: terukur <=> semua landmark punya vonis selain unmeasurable; tidak terukur selalu membawa alasan
for (const f of committed.fixtures) {
  assert.equal(f.measurable, Object.values(f.landmarks).every((l: any) => l.verdict !== 'unmeasurable'), `${f.body} ${f.clip}`)
  for (const l of Object.values(f.landmarks) as any[]) if (l.verdict === 'unmeasurable') assert.ok(['no_stance', 'too_few_phases', 'insufficient_frames', 'missing_values'].includes(l.reason))
}
assert.deepEqual(committed.summary.measurable, ['adult_male:WALK'], 'hanya WALK jantan yang terukur pada rig saat ini')

// penyebab terukur: pada RUN jantan tumit tidak pernah masuk jendela kontak 15 mm (bukan masalah ambang yang bisa "disetel")
const run = fx('adult_male', 'RUN').landmarks.heelCalcaneus.per_side
for (const s of ['L', 'R']) { assert.ok(run[s].min_height_mm > 15, `RUN tumit ${s} minimum ${run[s].min_height_mm} mm di atas lantai`); assert.equal(run[s].frames_within_window, 0) }
// betina: tumit di atas jendela pada WALK; bola tidak tersedia di sumber -> tidak terukur, tidak ditebak (kontrol negatif kriteria)
const fw = fx('vhf_denver_ct_adult_female', 'WALK').landmarks
for (const s of ['L', 'R']) { assert.ok(fw.heelCalcaneus.per_side[s].min_height_mm > 15); assert.deepEqual(fw.ballMT1.per_side[s], { available: false, reason: 'source has no separate bone for this landmark' }) }
assert.equal(fw.ballMT1.verdict, 'unmeasurable')
// pasangan positif: WALK jantan kedua landmark menapak di kedua kaki dan dinilai terhadap kriteria (placeholder penelitian)
const mw = fx('adult_male', 'WALK').landmarks
for (const k of ['heelCalcaneus', 'ballMT1']) for (const s of ['L', 'R']) assert.ok(mw[k].per_side[s].stance_phases >= 1 && mw[k].per_side[s].min_height_mm < 15)
assert.equal(mw.heelCalcaneus.verdict, 'within'); assert.equal(mw.ballMT1.verdict, 'within')
assert.match(committed.note, /not clinically validated/)
console.log('body-gait-measurability: 4 fixture; terukur hanya WALK jantan; RUN tumit >15 mm dari lantai, betina tumit >15 mm dan bola tidak ada di sumber')
