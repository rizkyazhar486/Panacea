// Temuan fisik teks bebas: tidak ada "normal" hanya karena tidak ada petunjuk (+).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBodyClinicalFindings, klasifikasiTemuan } from '../../src/lib/bodyClinicalFindings.ts'
assert.equal(klasifikasiTemuan('Kardiovaskular: murmur sistolik 2/6 di apeks'), 'abnormal', 'murmur terdokumentasi dianggap normal')
assert.equal(klasifikasiTemuan('Paru: vesikuler +/+, ronki -/-, wheezing -/-'), 'normal', 'negasi "-/-" tidak dikenali')
assert.equal(klasifikasiTemuan('Abdomen: supel, tidak ada nyeri tekan'), 'normal', 'negasi "tidak ada" tidak dikenali')
assert.equal(klasifikasiTemuan('Ekstremitas: edema tungkai bawah'), 'abnormal')
assert.equal(klasifikasiTemuan('Jantung: iktus kordis teraba di ICS 5'), 'recorded', 'catatan tanpa penanda normal diklaim normal')
assert.equal(klasifikasiTemuan('Jantung: S1S2 tunggal, murmur (-), gallop (-)'), 'normal')
assert.equal(klasifikasiTemuan('Ronki (+) basah halus basal'), 'abnormal')
const t = buildBodyClinicalFindings('Kardiovaskular: murmur sistolik 2/6 di apeks\nRespirasi: vesikuler, tidak ada ronki')
assert.deepEqual([t.find((x) => x.key === 'jantung')?.status, t.find((x) => x.key === 'paru')?.status], ['abnormal', 'normal'])

// Exam notes are not restricted to Indonesian shorthand; English documentation must
// resolve to the correct system and must not be silently dropped as "unchecked".
assert.equal(klasifikasiTemuan('Abdomen: tenderness in right upper quadrant'), 'abnormal', 'unnegated English abnormal term missed')
assert.equal(klasifikasiTemuan('Skin: jaundice noted'), 'abnormal')
assert.equal(klasifikasiTemuan('Extremities: 2+ edema bilaterally'), 'abnormal')
assert.equal(klasifikasiTemuan('Lungs: crackles at bilateral bases'), 'abnormal')
assert.equal(klasifikasiTemuan('Abdomen: soft, non-tender, no organomegaly'), 'normal', '"non-tender" negation not recognized')
assert.equal(klasifikasiTemuan('Heart: regular rate and rhythm, no murmurs'), 'normal')
assert.equal(klasifikasiTemuan('Extremities: no edema, pulses intact'), 'normal')
assert.equal(klasifikasiTemuan('Neck: supple, no lymphadenopathy'), 'recorded', 'unmapped English note wrongly claimed normal')
const en = buildBodyClinicalFindings(
  'Heart: regular rate and rhythm, no murmurs.\nLungs: clear to auscultation bilaterally, no wheezes.\nAbdomen: soft, non-tender, no organomegaly.\nExtremities: no edema, pulses intact.',
)
assert.deepEqual(
  ['jantung', 'paru', 'abdomen', 'ekstremitas'].map((key) => en.find((x) => x.key === key)?.status),
  ['normal', 'normal', 'normal', 'normal'],
  'English-language exam note left a documented system as "unchecked"',
)
assert.match(readFileSync('src/pages/EMR.tsx', 'utf8'), /statusSistemFisik\(sys\.key, note, exam\)/, 'EMR memakai klasifikasi salinan sendiri')
assert.doesNotMatch(readFileSync('src/pages/EMR.tsx', 'utf8'), /abnormal \? \('abnormal' as const\) : \('normal' as const\)/)
console.log('klasifikasi-temuan-fisik: murmur/edema terdokumentasi = temuan; normal hanya dengan penanda eksplisit; sisanya "recorded"')
