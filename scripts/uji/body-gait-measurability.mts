// ENG-D7-02: bukti per-fixture terukur/tidak terukur, dengan penyebab terukur. Laporan = jalan ulang; vonis jujur; tidak ada fixture yang
// "lulus" tanpa fase tumpu di kedua kaki. Di bawah Opsi A (D-D7-RUN), RUN kaki depan dinilai pada kompleks kontak kaki depan, dan
// ketiadaan heel strike dicatat sebagai not_applicable (bukan fabrikasi heel strike atau pelonggaran gate).
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
assert.deepEqual(committed.summary.measurable, [
  'adult_male:WALK',
  'adult_male:RUN',
  'vhf_denver_ct_adult_female:WALK',
  'vhf_denver_ct_adult_female:RUN'
], 'seluruh 4 fixture (jantan/betina x WALK/RUN) terukur pada Opsi A (D-D7-RUN)')

// Opsi A (D-D7-RUN): pada RUN tumit tidak pernah masuk fase tumpu (gerak CMU adalah lari kaki depan tanpa heel strike),
// sehingga tumit bernilai not_applicable dengan alasan forefoot_run_no_rearfoot_strike.
for (const b of ['adult_male', 'vhf_denver_ct_adult_female']) {
  const runHeel = fx(b, 'RUN').landmarks.heelCalcaneus
  assert.equal(runHeel.verdict, 'not_applicable')
  assert.equal(runHeel.reason, 'forefoot_run_no_rearfoot_strike')
  assert.equal(runHeel.per_side.L.stance_phases, 0)
  assert.equal(runHeel.per_side.R.stance_phases, 0)
  const runForefoot = fx(b, 'RUN').landmarks.ballMT1
  assert.equal(runForefoot.verdict, 'within')
}

// betina WALK terukur (T-D7-04): tumit diturunkan dari pose jalan, bola dari kombinasi metatarsal+falang
const fw = fx('vhf_denver_ct_adult_female', 'WALK').landmarks
for (const s of ['L', 'R']) {
  assert.ok(fw.heelCalcaneus.per_side[s].min_height_mm < 15)
  assert.ok(fw.ballMT1.per_side[s].min_height_mm < 15)
}
assert.equal(fw.heelCalcaneus.verdict, 'exceeds')
assert.equal(fw.ballMT1.verdict, 'within')

// pasangan positif: WALK jantan kedua landmark menapak di kedua kaki dan dinilai terhadap kriteria (placeholder penelitian)
const mw = fx('adult_male', 'WALK').landmarks
for (const k of ['heelCalcaneus', 'ballMT1']) for (const s of ['L', 'R']) assert.ok(mw[k].per_side[s].stance_phases >= 1 && mw[k].per_side[s].min_height_mm < 15)
assert.equal(mw.heelCalcaneus.verdict, 'within'); assert.equal(mw.ballMT1.verdict, 'within')
assert.match(committed.note, /not clinically validated/)
console.log('body-gait-measurability: 4/4 fixture terukur; WALK jantan & betina within; RUN forefoot within & heel not_applicable')
