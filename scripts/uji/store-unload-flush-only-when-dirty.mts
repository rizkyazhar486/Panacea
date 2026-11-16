// Regresi 71957cd: pagehide/beforeunload menulis ulang state lama ke localStorage tanpa perubahan,
// sehingga menimpa data yang lebih baru (tab lain, impor, pemulihan). Penulisan harus bergantung
// pada penanda "ada perubahan belum tersimpan". Uji sumber berpasangan: aturan nyata + mutasi yang harus ditolak.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

export function pelanggaranFlush(src: string): string[] {
  const out: string[] = []
  const blok = src.slice(src.indexOf('Hanya tulis bila state tab ini berubah'))
  const flush = blok.slice(0, blok.indexOf('const t = setTimeout(flush, 400)'))
  if (!/let dirty = true/.test(flush)) out.push('penanda dirty tidak diawali true (perubahan pertama tak akan tertulis)')
  if (!/if \(!dirty\) return/.test(flush)) out.push('flush tidak berhenti saat tidak ada perubahan (menimpa data baru)')
  if (!/localStorage\.setItem\(STORAGE_KEY[\s\S]*dirty = false/.test(flush)) out.push('dirty tidak dikosongkan setelah penulisan berhasil')
  if (!/addEventListener\('beforeunload', flush\)/.test(src)) out.push('penulisan saat beforeunload hilang (data perubahan terakhir bisa hilang)')
  return out
}

const src = readFileSync(new URL('../../src/lib/store.tsx', import.meta.url), 'utf8')
assert.deepEqual(pelanggaranFlush(src), [], 'store.tsx harus menulis hanya saat dirty')

// Mutasi: setiap satu perusakan harus terdeteksi dengan namanya.
const mutasi: Array<[string, (s: string) => string, RegExp]> = [
  ['tanpa penjaga dirty', (s) => s.replace('if (!dirty) return', ''), /tidak berhenti saat tidak ada perubahan/],
  ['dirty awal false', (s) => s.replace('let dirty = true', 'let dirty = false'), /tidak diawali true/],
  ['dirty tak dikosongkan', (s) => s.replace('dirty = false\n      } catch', '\n      } catch'), /tidak dikosongkan/],
  ['beforeunload dihapus', (s) => s.replace("window.addEventListener('beforeunload', flush)", ''), /beforeunload hilang/],
]
for (const [nama, rusak, harap] of mutasi) {
  const hasil = pelanggaranFlush(rusak(src))
  assert.ok(hasil.some((p) => harap.test(p)), `mutasi "${nama}" lolos tanpa terdeteksi: ${JSON.stringify(hasil)}`)
}
console.log('store-unload-flush-only-when-dirty: aturan nyata lulus; 4/4 mutasi terdeteksi dengan nama')
