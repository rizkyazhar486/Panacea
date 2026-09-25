// Pemeriksaan fisik terstruktur per sistem mengalahkan heuristik teks; asalnya jujur.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildBodyClinicalFindings, statusSistemFisik } from '../../src/lib/bodyClinicalFindings.ts'
const teks = 'Jantung: S1S2 tunggal, murmur (-)'
assert.deepEqual(statusSistemFisik('jantung', teks), { status: 'normal', origin: 'text-heuristic' })
assert.deepEqual(statusSistemFisik('jantung', teks, { statusSistem: { jantung: 'abnormal' }, doctorVerified: true, verifiedById: 'd1' }), { status: 'abnormal', origin: 'clinician-verified' }, 'tanda terstruktur klinisi kalah oleh heuristik teks')
assert.deepEqual(statusSistemFisik('jantung', teks, { statusSistem: { jantung: 'abnormal' }, doctorVerified: true }), { status: 'abnormal', origin: 'marked-unverified' }, 'tanda tanpa cap server diklaim diverifikasi klinisi')
assert.deepEqual(statusSistemFisik('paru', undefined, { statusSistem: { paru: 'not-examined' } }), { status: 'unchecked', origin: 'marked-unverified' })
assert.deepEqual(statusSistemFisik('paru', undefined, { statusSistem: { paru: 'bogus' as never } }), { status: 'unchecked' }, 'nilai status tak dikenal diterima')
const f = buildBodyClinicalFindings('', { statusSistem: { jantung: 'abnormal' }, doctorVerified: true, verifiedById: 'd1' })
assert.equal(f.find((x) => x.key === 'jantung')?.status, 'abnormal', 'Body Exposure/Clinical tidak memakai status terstruktur')
for (const b of ['src/components/BodyExposurePatientOverlay.tsx', 'src/components/ClinicalPatientContext.tsx']) assert.match(readFileSync(b, 'utf8'), /buildBodyClinicalFindings\(record\.physicalExam\?\.perSystem, record\.physicalExam\)/, `${b} mengabaikan status terstruktur`)
const emr = readFileSync('src/pages/EMR.tsx', 'utf8')
assert.match(emr, /const \{ status, origin \} = statusSistemFisik\(sys\.key, note, exam\)/)
assert.match(emr, /<StatusSistemEditor/, 'EMR tidak menyediakan penanda status per sistem')
assert.match(readFileSync('server/uji/rekamKlinis.uji.ts', 'utf8'), /status sistem yang diubah pasien tetap terlihat diverifikasi dokter/)
console.log('status-sistem-fisik: tanda klinisi mengalahkan heuristik teks di EMR/Clinical/Body Exposure; "verified" hanya dengan cap server')
