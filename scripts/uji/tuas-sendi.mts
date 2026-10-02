// Uji mesin tuas sendi kelas tiga.
//
// Tiap pernyataan di bawah menjaga satu cacat yang benar-benar bisa terjadi:
// lengan momen yang tidak nol di ujung gerak, kerugian mekanis yang hilang
// karena geometri dibalik, kesetimbangan yang tidak pernah diperiksa, dan
// lengan momen nol yang dicetak sebagai angka besar alih-alih ditolak.
import assert from 'node:assert/strict'
import {
  JOINT_LEVER_PRESETS,
  JOINT_LEVER_RANGES,
  effectiveMomentArmCm,
  muscleTorqueNm,
  solveJointLever,
  torqueCurve,
  type JointLeverInput,
} from '../../src/lib/tuasSendi.ts'

const dasar: JointLeverInput = { muscleInsertionCm: 5, loadDistanceCm: 32, jointAngleDeg: 90, loadMassKg: 5 }

// 1. Lengan momen efektif: nol di 0° dan 180°, maksimum di 90°.
assert.equal(effectiveMomentArmCm(5, 0), 0)
assert.ok(Math.abs(effectiveMomentArmCm(5, 180)) < 1e-12)
assert.ok(Math.abs(effectiveMomentArmCm(5, 90) - 5) < 1e-12)
for (let a = 1; a < 180; a += 1) {
  if (a === 90) continue
  assert.ok(effectiveMomentArmCm(5, a) < effectiveMomentArmCm(5, 90), `r_eff harus puncak di 90°, gagal di ${a}°`)
  assert.ok(effectiveMomentArmCm(5, a) > 0, `r_eff harus positif di dalam rentang gerak, gagal di ${a}°`)
}

// 2. Torsi mengikuti lengan momen: kurva sama-sama memuncak di 90° dan nol di ujung.
const kurva = torqueCurve(dasar, 181)
assert.equal(kurva.length, 181)
assert.equal(kurva[0]?.angleDeg, 0)
assert.equal(kurva[180]?.angleDeg, 180)
assert.equal(kurva[0]?.torquePer100NNm, 0)
assert.ok(Math.abs(kurva[180]!.torquePer100NNm) < 1e-12)
const puncak = kurva.reduce((a, b) => (b.torquePer100NNm > a.torquePer100NNm ? b : a))
assert.equal(puncak.angleDeg, 90)
// Kurva dan angka harus berasal dari fungsi yang sama.
for (const titik of kurva) {
  assert.equal(titik.torquePer100NNm, muscleTorqueNm(100, dasar.muscleInsertionCm, titik.angleDeg))
  assert.equal(titik.effectiveMomentArmCm, effectiveMomentArmCm(dasar.muscleInsertionCm, titik.angleDeg))
}

// 3. Kerugian mekanis adalah INVARIAN, bukan satu contoh: untuk tiap geometri
//    kelas tiga yang realistis (insersi lebih dekat ke sendi daripada beban),
//    gaya otot melampaui beban, dan reaksi sendi melampaui beban pula.
for (const r of [1, 2, 3, 4, 5, 6, 8]) {
  for (const d of [15, 20, 25, 32, 40, 50]) {
    if (!(d / r > 2)) continue
    for (const massa of [1, 5, 10, 25]) {
      for (let sudut = 5; sudut <= 175; sudut += 5) {
        const s = solveJointLever({ muscleInsertionCm: r, loadDistanceCm: d, jointAngleDeg: sudut, loadMassKg: massa })
        assert.ok(s.feasible)
        assert.ok(s.requiredMuscleForceN > s.loadForceN, `gaya otot harus > beban (r=${r} d=${d} θ=${sudut})`)
        assert.ok(s.forceMultiple > 1)
        assert.ok(s.mechanicalAdvantage < 1, 'tuas kelas tiga selalu rugi gaya')
        assert.ok(s.jointReactionN > s.loadForceN, `reaksi sendi harus > beban (r=${r} d=${d} θ=${sudut})`)
        assert.ok(s.jointReactionMultiple > 1)
        // 4. Kesetimbangan statis: momen netto nol dalam toleransi float.
        assert.ok(Math.abs(s.netMomentNm) < 1e-9, `momen netto harus nol (r=${r} d=${d} θ=${sudut})`)
        assert.ok(Math.abs(s.muscleTorqueNm - s.loadMomentNm) < 1e-9)
      }
    }
  }
}

// 5. Kontrol negatif: lengan momen nol harus tak-hingga dan DITOLAK, bukan angka.
for (const sudut of [0, 180]) {
  const s = solveJointLever({ ...dasar, jointAngleDeg: sudut })
  assert.equal(s.feasible, false)
  assert.ok(!Number.isFinite(s.requiredMuscleForceN))
  assert.ok(!Number.isFinite(s.jointReactionN))
  assert.ok(Number.isNaN(s.netMomentNm))
  assert.ok(typeof s.refusal === 'string' && s.refusal.length > 40, 'penolakan wajib menjelaskan sebabnya')
}
// Insersi nol juga tidak punya pengungkit pada sudut mana pun.
const tanpaInsersi = solveJointLever({ ...dasar, muscleInsertionCm: 0 })
assert.equal(tanpaInsersi.feasible, false)
assert.ok(!Number.isFinite(tanpaInsersi.requiredMuscleForceN))

// 6. Kasus rujukan siku: siku 90° menahan 5 kg pada 32 cm dengan insersi 5 cm.
const siku = solveJointLever(dasar)
assert.ok(Math.abs(siku.forceMultiple - 32 / 5) < 1e-9)
assert.ok(siku.requiredMuscleForceN > 300 && siku.requiredMuscleForceN < 320)
assert.ok(siku.jointReactionN >= siku.requiredMuscleForceN - siku.loadForceN)

// 7. Preset tetap berada di dalam batas penggeser panel, dan tetap kelas tiga.
for (const p of JOINT_LEVER_PRESETS) {
  assert.ok(p.muscleInsertionCm > JOINT_LEVER_RANGES.muscleInsertionCm.min)
  assert.ok(p.muscleInsertionCm <= JOINT_LEVER_RANGES.muscleInsertionCm.max)
  assert.ok(p.loadDistanceCm >= JOINT_LEVER_RANGES.loadDistanceCm.min)
  assert.ok(p.loadDistanceCm <= JOINT_LEVER_RANGES.loadDistanceCm.max)
  assert.ok(p.loadMassKg <= JOINT_LEVER_RANGES.loadMassKg.max)
  assert.ok(p.loadDistanceCm / p.muscleInsertionCm > 2, `${p.id} harus geometri kelas tiga yang realistis`)
}

console.log(`OK tuas-sendi: r_eff/torsi, invarian kerugian mekanis, kesetimbangan, penolakan lengan-nol (siku 5 kg -> ${siku.requiredMuscleForceN.toFixed(0)} N otot, reaksi sendi ${siku.jointReactionN.toFixed(0)} N)`)
