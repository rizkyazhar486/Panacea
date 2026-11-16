import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('src/components/bodyhub/UniversalCompactBodyCockpit.tsx', 'utf8')
const KARANGAN: Array<[RegExp, string]> = [
  [/118\/76/, 'tekanan darah bawaan 118/76'], [/\?\?\s*(54|98|48\.5|7\.4|62)\b/, 'nilai vital bawaan lewat ??'],
  [/94 \/ 100/, 'skor postur tertulis mati'], [/Recommended Dose/i, 'label dosis rekomendasi'],
  [/Permenkes/i, 'klaim kepatuhan regulasi'], [/EMVCo|Alipay|Visa/i, 'klaim pass/jaringan pembayaran tanpa adapter teruji'],
  [/hrvMs \* 1\.15|spo2Pct: 99/, 'nilai pasca-sesi rekaan'], [/bioAgeDelta|dailyReadiness/, 'skor tanpa sumber tervalidasi'],
  [/ready for SATUSEHAT|SATUSEHAT bridging/i, 'klaim integrasi SATUSEHAT siap'],
]
for (const [re, nama] of KARANGAN) assert.doesNotMatch(src, re, `cockpit tidak boleh memuat: ${nama}`)
// aksesibilitas: aria-label pada <div> tanpa peran membuat axe melaporkan `incomplete`; teks kosong memakai sr-only
assert.doesNotMatch(src, /<div[^>]*\baria-label=/, 'aria-label pada div tanpa peran')
assert.match(src, /className="sr-only">not recorded/)
// positif (berpasangan): yang harus ada
assert.match(src, /buildCockpitReadout/); assert.match(src, /not recorded/); assert.match(src, /BatasKlaimKesehatan/)
assert.match(src, /not reviewed by a clinician/)
console.log('body-cockpit-no-fabrication: OK')
