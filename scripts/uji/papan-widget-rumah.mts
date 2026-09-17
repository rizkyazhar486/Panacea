import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// PAPAN WIDGET YANG BISA DIGESER — DAN BENAR-BENAR BERGESER.
//
// Papan ini hilang dari layar bukan karena dihapus: Beranda, satu-satunya
// halaman yang memasangnya, tidak lagi punya rute setelah Home disusun ulang.
// Seluruh PapanWidget dan Tumpukan tetap ada di repositori, tidak terjangkau.
//
// Setelah dipasang kembali, tiga cacat muncul dan ketiganya membuat "bisa
// digeser" menjadi klaim kosong. Semuanya terukur di peramban pada 390x844:
//
//   1. Tombol › memulai gulir mulus ke 357px, lalu penyelarasan ulang 60 ms
//      kemudian membaca posisi setengah jalan (~50px), membulatkannya ke 0,
//      dan menariknya kembali. Gulirannya berhenti tersangkut di 121px.
//   2. Slide yang kosong tetap ada di DOM dan disembunyikan, jadi indeks ke-n
//      dalam daftar yang TERLIHAT bukan slide ke-n dalam DOM. Menggulir ke
//      `n * lebar` mendarat di widget yang salah — pada Home yang penuh,
//      sepuluh slide tersembunyi.
//   3. Daftar yang terlihat menyusut sendiri (23 → 13) saat widget selesai
//      dimuat. Selama "yang aktif" hanya disimpan sebagai nomor urut,
//      penyusutan itu memindahkan pembaca ke widget lain di tengah geseran.
// ─────────────────────────────────────────────────────────────────────────────

const tumpukan = readFileSync(new URL('../../src/components/Tumpukan.tsx', import.meta.url), 'utf8')
const home = readFileSync(new URL('../../src/pages/HomeSocialWorkspace.tsx', import.meta.url), 'utf8')
const rel = readFileSync(new URL('../../src/components/RelWidgetRumah.tsx', import.meta.url), 'utf8')

// ── 1. Papannya benar-benar terpasang di Home ────────────────────────────
assert.ok(/import \{ RelWidgetRumah \} from '\.\.\/components\/RelWidgetRumah'/.test(home),
  'Home no longer imports the widget rail')
assert.ok(/<RelWidgetRumah \/>/.test(home),
  'the widget rail is imported but never rendered — that is exactly how it disappeared the first time')
assert.ok(/PapanWidget/.test(rel), 'the rail no longer mounts the existing widget board')

// ── 2. Menggulir ke POSISI slide, bukan ke nomor urut kali lebar ─────────
assert.ok(/const kiriSlide = \(n: number\): number \| null/.test(tumpukan),
  'the slide-offset lookup is gone')
assert.ok(/el\.scrollTo\(\{ left: kiriSlide\(next\) \?\? next \* el\.clientWidth/.test(tumpukan),
  'the carousel scrolls to index times width again; with hidden slides that lands on the wrong widget')
assert.ok(/const target = digeser\.current \? \(kiriSlide\(dituju\.current\) \?\? /.test(tumpukan),
  're-alignment reads something other than the intended slide position again')

// ── 3. Yang aktif disimpan sebagai KUNCI ─────────────────────────────────
assert.ok(/const kunciAktif = useRef<string \| null>\(null\)/.test(tumpukan),
  'the active widget is no longer remembered by key')
assert.ok(/const n = kunci \? tampil\.findIndex\(\(t\) => t\.kunci === kunci\) : -1/.test(tumpukan),
  'when the visible list shrinks, the board no longer looks the same widget up again by key')

// ── 4. Geseran yang diminta tidak boleh dibatalkan pembacaan sendiri ─────
assert.ok(/const gulirTerkunci = useRef\(0\)/.test(tumpukan), 'the in-flight scroll guard is gone')
assert.ok(/if \(Date\.now\(\) < gulirTerkunci\.current\) return/.test(tumpukan),
  'the scroll listener reads the halfway position again and cancels the slide it was asked for')
// Jari pengguna harus mengalahkan geseran yang sedang berjalan.
assert.ok(/const tandai = \(\) => \{ digeser\.current = true; gulirTerkunci\.current = 0 \}/.test(tumpukan),
  'a touch or wheel no longer overrides an in-flight programmatic scroll')

// ── 5. Titik posisi bukan tab ────────────────────────────────────────────
const blokTitik = tumpukan.match(/widget-instrument-dots-v5[\s\S]{0,700}?<\/div>/)?.[0] ?? ''
assert.ok(blokTitik.length > 0, 'the position dots disappeared')
assert.ok(/aria-current=\{i === aktif \? 'true' : undefined\}/.test(blokTitik),
  'the dots no longer mark the current widget with aria-current')
assert.ok(!/role="tab"/.test(blokTitik) && !/aria-selected/.test(blokTitik),
  'the dots are marked as tabs again; panacea-control-grading-v46 then paints every selected control as a ' +
  'white neumorphic capsule, which is far larger than the 6px dot inside it')
assert.ok(/onClick=\{\(\) => ke\(i\)\}/.test(blokTitik),
  'the dots became decoration: they no longer move the carousel')

// ── 6. Jendela titik: tujuh, dan tidak pernah keluar batas ──────────────
// Pemuat uji tidak bisa mengimpor .tsx, jadi aturannya ditulis ulang di sini
// DAN dicocokkan dengan sumbernya — kalau salah satunya berubah sendiri,
// pemeriksaan di bawah kehilangan artinya.
assert.ok(
  /const separuh = Math\.floor\(lebar \/ 2\)[\s\S]{0,160}?const mulai = Math\.max\(0, Math\.min\(aktif - separuh, jumlah - lebar\)\)/.test(tumpukan),
  'jendelaTitik no longer centres its window the way this gate re-implements it',
)
function jendelaTitik(aktif: number, jumlah: number, lebar = 7): number[] {
  if (jumlah <= lebar) return Array.from({ length: jumlah }, (_, i) => i)
  const separuh = Math.floor(lebar / 2)
  const mulai = Math.max(0, Math.min(aktif - separuh, jumlah - lebar))
  return Array.from({ length: lebar }, (_, i) => mulai + i)
}
assert.deepEqual(jendelaTitik(0, 3), [0, 1, 2], 'a short list should show every dot')
assert.deepEqual(jendelaTitik(0, 23), [0, 1, 2, 3, 4, 5, 6], 'the window should start at the beginning')
assert.deepEqual(jendelaTitik(11, 23), [8, 9, 10, 11, 12, 13, 14], 'the window should centre on the active slide')
assert.deepEqual(jendelaTitik(22, 23), [16, 17, 18, 19, 20, 21, 22], 'the window should stop at the last slide')
for (const [aktif, jumlah] of [[0, 1], [5, 9], [40, 41]] as [number, number][]) {
  const w = jendelaTitik(aktif, jumlah)
  assert.ok(w.every((i) => i >= 0 && i < jumlah), `window ${w} escapes the list of ${jumlah}`)
  assert.ok(w.includes(Math.min(aktif, jumlah - 1)), 'the active slide fell outside its own window')
}

console.log('papan-widget-rumah: ok (rail mounted on Home; carousel scrolls by slide position, tracks by key)')
