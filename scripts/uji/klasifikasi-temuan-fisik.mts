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
assert.match(readFileSync('src/pages/EMR.tsx', 'utf8'), /status: klasifikasiTemuan\(note\)/, 'EMR memakai klasifikasi salinan sendiri')
assert.doesNotMatch(readFileSync('src/pages/EMR.tsx', 'utf8'), /abnormal \? \('abnormal' as const\) : \('normal' as const\)/)
console.log('klasifikasi-temuan-fisik: murmur/edema terdokumentasi = temuan; normal hanya dengan penanda eksplisit; sisanya "recorded"')
