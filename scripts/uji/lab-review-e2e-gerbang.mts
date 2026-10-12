import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Gerbang untuk gerbang: bukti B7 (E2E klinisi terhadap server nyata) hanya berarti bila CI benar-benar menjalankannya.
// Gagal dengan nama bila langkah itu hilang dari Stabilization Acceptance atau tidak lagi memanggil skrip gerbang.
export function langkahGerbangLab(yaml: string): { ada: boolean; menjalankanGerbang: boolean; sebelumUpload: boolean } {
  const i = yaml.indexOf('Alpha B7 clinician lab-result review E2E')
  if (i < 0) return { ada: false, menjalankanGerbang: false, sebelumUpload: false }
  const blok = yaml.slice(i, yaml.indexOf('\n      - name:', i + 10) > 0 ? yaml.indexOf('\n      - name:', i + 10) : undefined)
  return {
    ada: true,
    menjalankanGerbang: /run:\s*node scripts\/qa\/lab-result-review-e2e-gate\.mjs/.test(blok),
    sebelumUpload: i < yaml.indexOf('Upload Body Exposure mobile QA artifact'),
  }
}

const wf = readFileSync(new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url), 'utf8')
// Positif.
assert.deepEqual(langkahGerbangLab(wf), { ada: true, menjalankanGerbang: true, sebelumUpload: true }, 'langkah E2E lab hilang dari stabilization-acceptance.yml')
// Negatif berpasangan: tiap pelanggaran dilaporkan sendiri.
assert.equal(langkahGerbangLab(wf.replace('Alpha B7 clinician lab-result review E2E', 'Alpha B7 renamed')).ada, false)
assert.equal(langkahGerbangLab(wf.replace('run: node scripts/qa/lab-result-review-e2e-gate.mjs', 'run: echo skipped')).menjalankanGerbang, false)
assert.equal(langkahGerbangLab('').ada, false)
// Tidak boleh dilonggarkan: bukan continue-on-error, dan memakai Playwright yang dipasang langkah sebelumnya.
const blok = wf.slice(wf.indexOf('Alpha B7 clinician lab-result review E2E'), wf.indexOf('Upload Body Exposure mobile QA artifact'))
assert.doesNotMatch(blok, /continue-on-error/, 'gerbang B7 tidak boleh continue-on-error')
assert.match(blok, /PLAYWRIGHT_MODULE: \$\{\{ runner\.temp \}\}\/panacea-playwright\/node_modules\/playwright\/index\.mjs/)
// Skrip gerbang ada dan menamai tiga kegagalannya.
const gate = readFileSync(new URL('../qa/lab-result-review-e2e-gate.mjs', import.meta.url), 'utf8')
for (const nama of ['SERVER_TIDAK_SIAP', 'VITE_TIDAK_SIAP', 'E2E_GAGAL']) assert.match(gate, new RegExp(nama), nama)
assert.match(gate, /process\.exit\(kode\)/); assert.match(gate, /let kode = 1/, 'default keluar harus gagal')
console.log('lab-review-e2e-gerbang: ok')
