// Regresi: halaman Settings pernah menulis font-size akar sendiri (14px/18px) dan mengosongkannya saat pengguna keluar,
// sehingga skala pilihan hilang sampai muat ulang dan angkanya tidak sama dengan lib/theme (15px) atau CSS (19px).
// Aturan yang dijaga: lib/theme.ts adalah SATU-SATUNYA penulis font-size akar di src/.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const semua = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? semua(p) : /\.(ts|tsx)$/.test(n) ? [p] : [] })
const komentar = /\/\*[\s\S]*?\*\/|\/\/.*$/gm
/** Penulisan font-size pada elemen akar: `.style.fontSize =`, `setProperty('font-size'`, atau `style.cssText` yang memuatnya. */
export const penulis = (src: string) => src.replace(komentar, '').match(/style\.fontSize\s*=(?!=)|setProperty\(\s*['"]font-size['"]/g) ?? []

// ── positif: pemeriksa memang mengenali penulisan (pasangan negatif di bawah) ──
gagal('mengenali-tulis-langsung', () => assert.equal(penulis("root.style.fontSize = '18px'").length, 1))
gagal('mengenali-setProperty', () => assert.equal(penulis("root.style.setProperty('font-size', '18px')").length, 1))
gagal('mengenali-pengosongan', () => assert.equal(penulis("root.style.fontSize = ''").length, 1))
// ── negatif: komentar dan perbandingan bukan penulisan ──
gagal('komentar-bukan-penulisan', () => assert.equal(penulis("// root.style.fontSize = '1px'\n/* style.fontSize = 2 */").length, 0))
gagal('pembacaan-bukan-penulisan', () => assert.equal(penulis('if (root.style.fontSize === "16px") {}').length, 0))

// ── aturan repo ──
const pelanggar = semua('src').filter((f) => f !== join('src', 'lib', 'theme.ts')).filter((f) => penulis(readFileSync(f, 'utf8')).length > 0)
gagal('hanya-lib-theme-menulis-font-size-akar', () => assert.deepEqual(pelanggar, [], `penulis lain: ${pelanggar.join(', ')}`))
gagal('lib-theme-memang-menulis', () => assert.ok(penulis(readFileSync('src/lib/theme.ts', 'utf8')).length >= 1))
// Settings tetap memakai setter theme (kalau tidak, tombol skala tidak berefek setelah penulisnya dihapus).
gagal('settings-memanggil-setter-theme', () => { const s = readFileSync('src/pages/dashboard/Settings.tsx', 'utf8'); assert.match(s, /setTextScale\('sm'\)/); assert.match(s, /setSimpleMode\(v\)/) })
console.log('settings-text-scale-writer: OK')
