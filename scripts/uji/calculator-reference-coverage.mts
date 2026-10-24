// ENG-C6-01: cakupan DIJAMIN, bukan diasumsikan. Setiap mesin di governance/CALCULATOR_REVIEW_REGISTRY.json harus punya
// sedikitnya satu fungsi yang diekspor dan DIPANGGIL (call-site) oleh uji acuan independen (scripts/uji/calculator-independent-reference*.mts).
// Komentar, string, dan pernyataan import TIDAK dihitung: hanya kode yang dapat dieksekusi (temuan review independen pada #2702).
// BATAS: ini mengukur bahwa acuan MEMANGGIL mesin itu, bukan bahwa acuannya cukup kuat (itu tugas uji mutasi/matriks per mesin)
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

/**
 * Sisakan kode yang dapat dieksekusi: komentar dibuang, isi string/regex-literal sederhana dikosongkan, `${...}` di dalam template
 * tetap diperlakukan sebagai kode, lalu pernyataan `import ... from ''` dibuang. Pemindai karakter (bukan regex tunggal) supaya
 * `//` di dalam string tidak memotong kode di sebelahnya.
 */
export function executableCode(src: string): string {
  let out = ''
  const braces: number[] = [] // tumpukan kedalaman kurung kurawal untuk ekspresi `${` dalam template
  let depth = 0
  let i = 0
  while (i < src.length) {
    const c = src[i]!
    const n = src[i + 1]
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (c === '/' && n === '*') { const end = src.indexOf('*/', i + 2); i = end < 0 ? src.length : end + 2; out += ' '; continue }
    if (c === "'" || c === '"') {
      i++
      while (i < src.length && src[i] !== c && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1
      i++; out += "''"; continue
    }
    if (c === '`') {
      i++; out += "''"
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === '$' && src[i + 1] === '{') { braces.push(depth); depth++; i += 2; out += ' ('; break }
        i++
      }
      if (src[i] === '`') i++
      continue
    }
    if (c === '{') depth++
    if (c === '}') {
      depth--
      if (braces.length && braces[braces.length - 1] === depth) { // akhir ekspresi `${...}`: lanjut membaca sisa template
        braces.pop(); out += ') '; i++
        while (i < src.length && src[i] !== '`') {
          if (src[i] === '\\') { i += 2; continue }
          if (src[i] === '$' && src[i + 1] === '{') { braces.push(depth); depth++; i += 2; out += ' ('; break }
          i++
        }
        if (src[i] === '`') i++
        continue
      }
    }
    out += c; i++
  }
  return out.replace(/\bimport\b[^;]*?\bfrom\s*''/g, ' ').replace(/\bimport\s*''/g, ' ')
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Apakah `name` DIPANGGIL (name( atau name<T>( ) di kode eksekusi; deklarasi `function name(` dan `obj.name(` bukan panggilan ke mesin. */
export function invokes(code: string, name: string): boolean {
  const re = new RegExp(`(^|[^A-Za-z0-9_$.])(${escape(name)})\\s*(<[^<>()]*>)?\\s*\\(`, 'g')
  for (let m = re.exec(code); m; m = re.exec(code)) {
    const before = code.slice(0, m.index + m[1]!.length)
    if (/\b(function|class)\s*\*?\s*$/.test(before)) continue
    return true
  }
  return false
}

/** Mesin yang tidak dipanggil satu pun uji acuan. Mesin tanpa ekspor yang dapat dihitung dianggap tidak tercakup (fail-closed). */
export function uncovered(engines: Record<string, string>, referenceSource: string): string[] {
  const code = executableCode(referenceSource)
  return Object.entries(engines)
    .filter(([, src]) => !exportedCalculators(src).some((n) => invokes(code, n)))
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
assert.deepEqual(uncovered(engines, referenceSource), [], 'every registry engine is invoked by an independent reference test')

// ── Kontrol negatif: pemeriksa ini sendiri harus bisa gagal ───────────────────────────────────────
const alpha = { alpha: 'export function alphaCalc() {}' }
// (a) mesin yang tidak dipanggil acuan mana pun terdeteksi, dan hanya itu.
{
  const eng = { alpha: 'export function alphaCalc() {}', beta: 'export const betaCalc = () => 1' }
  assert.deepEqual(uncovered(eng, 'const r = alphaCalc(1)'), ['beta'])
  assert.deepEqual(uncovered(eng, 'const r = alphaCalc(1); const s = betaCalc(2)'), [])
}
// (b) kecocokan nama utuh: awalan/akhiran bukan cakupan (alphaCalcExtra tidak menutup alphaCalc).
assert.deepEqual(uncovered(alpha, 'alphaCalcExtra()'), ['alpha'])
assert.deepEqual(uncovered(alpha, 'xalphaCalc()'), ['alpha'])
// (c) berkas mesin tanpa ekspor yang dapat dihitung (hanya tipe/predikat) fail-closed sebagai tidak tercakup.
assert.deepEqual(uncovered({ onlyTypes: 'export type T = number\nexport function isOk() {}' }, 'isOk() T'), ['onlyTypes'])
// (d) regresi review independen #2702: komentar, import saja, string, dan sekadar nama TANPA panggilan bukan cakupan.
assert.deepEqual(uncovered(alpha, '// TODO: alphaCalc(1) is not tested'), ['alpha'])
assert.deepEqual(uncovered(alpha, '/* alphaCalc(1) */ const x = 1'), ['alpha'])
assert.deepEqual(uncovered(alpha, "import { alphaCalc } from 'module'"), ['alpha'])
assert.deepEqual(uncovered(alpha, "import {\n  alphaCalc,\n} from '../../x.ts'\nconst u = 1"), ['alpha'])
assert.deepEqual(uncovered(alpha, "const s = 'alphaCalc(1)'"), ['alpha'])
assert.deepEqual(uncovered(alpha, 'const s = "alphaCalc(1)"'), ['alpha'])
assert.deepEqual(uncovered(alpha, 'const s = `alphaCalc(1)`'), ['alpha'])
assert.deepEqual(uncovered(alpha, 'const f = alphaCalc'), ['alpha'])
assert.deepEqual(uncovered(alpha, 'obj.alphaCalc(1)'), ['alpha'])
assert.deepEqual(uncovered(alpha, 'function alphaCalc(x) { return x }'), ['alpha'])
// Pasangan positif yang HANYA berbeda pada kondisi itu: panggilan nyata tetap terhitung, termasuk setelah komentar/string pada baris yang sama.
assert.deepEqual(uncovered(alpha, "const u = 'http://x'; const r = alphaCalc(1)"), [])
assert.deepEqual(uncovered(alpha, 'const r = alphaCalc<number>(1)'), [])
assert.deepEqual(uncovered(alpha, 'const r = `v=${alphaCalc(1)}`'), [])
assert.deepEqual(uncovered(alpha, 'const r = alphaCalc (1) // komentar'), [])
// (e) mutasi pada kasus nyata: menghapus semua panggilan pedsDose harus membuatnya tidak tercakup.
{
  const without = referenceSource.replace(/pedsDose\s*\(/g, 'REMOVED(')
  assert.ok(uncovered(engines, without).includes('pedsDose'), 'removing pedsDose calls is detected')
  // dan hanya menyisakan nama pada komentar tidak memulihkan cakupan
  assert.ok(uncovered(engines, `${without}\n// pedsDose( ) is tested elsewhere`).includes('pedsDose'), 'a comment cannot restore coverage')
}

console.log(`calculator-reference-coverage: ${ids.length}/47 engines invoked by ${referenceFiles.length} independent reference suites; comment/import/string/identifier-only mentions rejected`)
