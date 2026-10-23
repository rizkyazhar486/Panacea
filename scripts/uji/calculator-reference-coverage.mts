// ENG-C6-01: cakupan DIJAMIN, bukan diasumsikan. Setiap mesin di governance/CALCULATOR_REVIEW_REGISTRY.json harus punya
// sedikitnya satu fungsi yang diekspor dan dirujuk oleh uji acuan independen (scripts/uji/calculator-independent-reference*.mts).
// BATAS: ini mengukur bahwa acuan MENYENTUH mesin itu, bukan bahwa acuannya cukup kuat (itu tugas uji mutasi/matriks per mesin)
// dan bukan tinjauan klinis.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

const ROOT = new URL('../../', import.meta.url)
const ENGINE_DIR = new URL('src/domains/clinical-calculators/engine/', ROOT)
const UJI_DIR = new URL('scripts/uji/', ROOT)

/** Fungsi/konstanta huruf-kecil yang diekspor sebuah berkas mesin; tipe dan predikat bantu (is/has/get) tidak dihitung. */
export function exportedCalculators(source: string): string[] {
  return [...source.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/g)]
    .map((m) => m[1]!)
    .filter((n) => /^[a-z]/.test(n) && !/^(is|has|get)[A-Z]/.test(n))
}

const mentions = (haystack: string, name: string) => new RegExp(`(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)`).test(haystack)

/** Mesin yang tidak dirujuk satu pun uji acuan. Mesin tanpa ekspor yang dapat dihitung dianggap tidak tercakup (fail-closed). */
export function uncovered(engines: Record<string, string>, referenceSource: string): string[] {
  return Object.entries(engines)
    .filter(([, src]) => !exportedCalculators(src).some((n) => mentions(referenceSource, n)))
    .map(([id]) => id)
    .sort()
}

// ── Berkas nyata ─────────────────────────────────────────────────────────────────────────────────
const registry = JSON.parse(readFileSync(new URL('governance/CALCULATOR_REVIEW_REGISTRY.json', ROOT), 'utf8')) as { entries: Array<{ id: string }> }
const ids = registry.entries.map((e) => e.id)
const engines = Object.fromEntries(ids.map((id) => [id, readFileSync(new URL(`${id}.ts`, ENGINE_DIR), 'utf8')]))
const referenceFiles = readdirSync(UJI_DIR).filter((f) => /^calculator-independent-reference.*\.mts$/.test(f))
const referenceSource = referenceFiles.map((f) => readFileSync(new URL(f, UJI_DIR), 'utf8')).join('\n')

assert.equal(ids.length, 47, 'registry keeps all 47 engines')
assert.ok(referenceFiles.length >= 11, 'reference suites present')
assert.deepEqual(uncovered(engines, referenceSource), [], 'every registry engine is touched by an independent reference test')

// ── Kontrol negatif: pemeriksa ini sendiri harus bisa gagal ───────────────────────────────────────
// (a) mesin yang tidak disebut acuan mana pun terdeteksi, dan hanya itu.
{
  const eng = { alpha: 'export function alphaCalc() {}', beta: 'export const betaCalc = () => 1' }
  assert.deepEqual(uncovered(eng, 'uses alphaCalc(1)'), ['beta'])
  assert.deepEqual(uncovered(eng, 'uses alphaCalc(1) and betaCalc(2)'), [])
}
// (b) kecocokan nama utuh: awalan/akhiran bukan cakupan (alphaCalcExtra tidak menutup alphaCalc).
assert.deepEqual(uncovered({ alpha: 'export function alphaCalc() {}' }, 'alphaCalcExtra()'), ['alpha'])
assert.deepEqual(uncovered({ alpha: 'export function alphaCalc() {}' }, 'xalphaCalc()'), ['alpha'])
// (c) berkas mesin tanpa ekspor yang dapat dihitung (hanya tipe/predikat) fail-closed sebagai tidak tercakup.
assert.deepEqual(uncovered({ onlyTypes: 'export type T = number\nexport function isOk() {}' }, 'isOk T'), ['onlyTypes'])
// (d) mutasi pada kasus nyata: menghapus semua acuan pedsDose harus membuatnya tidak tercakup.
{
  const without = referenceSource.replace(/pedsDose/g, 'REMOVED')
  assert.ok(uncovered(engines, without).includes('pedsDose'), 'removing pedsDose references is detected')
}

console.log(`calculator-reference-coverage: ${ids.length}/47 engines covered by ${referenceFiles.length} independent reference suites; 4 negative controls`)
