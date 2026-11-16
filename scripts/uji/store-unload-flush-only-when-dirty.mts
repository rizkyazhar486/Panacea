// Regresi 71957cd: pagehide/beforeunload menulis ulang state lama ke localStorage tanpa perubahan,
// sehingga menimpa data yang lebih baru (tab lain, impor, pemulihan). Penulisan harus bergantung
// pada penanda "ada perubahan belum tersimpan". Uji sumber berpasangan: aturan nyata + mutasi yang harus ditolak.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

export function pelanggaranFlush(src: string): string[] {
  const out: string[] = []
  const i = src.indexOf('const flushPersist = useCallback')
  const flush = i < 0 ? '' : src.slice(i, src.indexOf('}, [])', i))
  if (!flush) out.push('flushPersist tidak ditemukan')
  if (!/if \(!dirtyRef\.current\) return/.test(flush)) out.push('flush tidak berhenti saat tidak ada perubahan (menimpa data baru)')
  if (!/fingerprint === lastWrittenRef\.current/.test(flush)) out.push('flush tidak melewati penulisan identik (tulis berulang)')
  if (!/localStorage\.setItem\(STORAGE_KEY[\s\S]*dirtyRef\.current = false/.test(flush)) out.push('dirty tidak dikosongkan setelah penulisan berhasil')
  if (!/dirtyRef\.current = true\s*\n\s*const t = setTimeout\(flushPersist, 400\)/.test(src)) out.push('perubahan state tidak menandai dirty dan menjadwalkan penulisan')
  if (!/addEventListener\('beforeunload', flushPersist\)/.test(src)) out.push('penulisan saat beforeunload hilang (data perubahan terakhir bisa hilang)')
  if (!/\}, \[visibilityDocument, flushPersist\]\)/.test(src)) out.push('pendengar unload tidak dipasang sekali (bergantung pada state)')
  return out
}

const src = readFileSync(new URL('../../src/lib/store.tsx', import.meta.url), 'utf8')
assert.deepEqual(pelanggaranFlush(src), [], 'store.tsx harus menulis hanya saat dirty')

// Mutasi: setiap satu perusakan harus terdeteksi dengan namanya.
const mutasi: Array<[string, (s: string) => string, RegExp]> = [
  ['tanpa penjaga dirty', (s) => s.replace('if (!dirtyRef.current) return', ''), /tidak berhenti saat tidak ada perubahan/],
  ['tanpa lewati identik', (s) => s.replace('fingerprint === lastWrittenRef.current', 'false'), /melewati penulisan identik/],
  ['dirty tak dikosongkan', (s) => s.replace('lastWrittenRef.current = fingerprint\n      dirtyRef.current = false', 'lastWrittenRef.current = fingerprint'), /tidak dikosongkan/],
  ['perubahan tak menandai dirty', (s) => s.replace('dirtyRef.current = true\n    const t', 'const t'), /tidak menandai dirty/],
  ['beforeunload dihapus', (s) => s.replace("window.addEventListener('beforeunload', flushPersist)", ''), /beforeunload hilang/],
  ['pendengar bergantung pada state', (s) => s.replace('}, [visibilityDocument, flushPersist])', '}, [state, visibilityDocument, flushPersist])'), /dipasang sekali/],
]
for (const [nama, rusak, harap] of mutasi) {
  const hasil = pelanggaranFlush(rusak(src))
  assert.ok(hasil.some((p) => harap.test(p)), `mutasi "${nama}" lolos tanpa terdeteksi: ${JSON.stringify(hasil)}`)
}
console.log('store-unload-flush-only-when-dirty: aturan nyata lulus; 6/6 mutasi terdeteksi dengan nama')
