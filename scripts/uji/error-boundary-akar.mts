import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Penjaga struktural untuk ErrorBoundary akar (layar "Something went wrong"). Kontras sebenarnya diukur di browser nyata
// saat perbaikan (judul 1,08:1 -> 18,6:1 pada tema gelap); uji ini menjaga PENYEBAB agar tidak kembali.
const SUMBER = new URL('../../src/components/layout/ErrorBoundary.tsx', import.meta.url)
export const periksa = (kode: string): string[] => {
  const masalah: string[] = []
  // 1. Crash akar harus sampai ke /api/owner/client-errors (sebelumnya hanya FeatureErrorBoundary yang melapor).
  if (!/componentDidCatch[\s\S]*?laporGalat\(\s*'boundary'\s*,\s*error\s*,\s*'root'\s*\)/.test(kode)) masalah.push('componentDidCatch tidak melaporkan galat akar lewat laporGalat(\'boundary\', error, \'root\')')
  // 2. Tanpa className: aturan global tombol/judul menargetkan kelas ("rounded"/"bg-"/"border"/token ink) dan menimpa tampilan layar ini.
  if (/className\s*=/.test(kode)) masalah.push('ErrorBoundary memakai className: aturan global menimpa tombol/judul (tombol jadi pil gelap, judul putih di latar terang)')
  // 3. Tema mengikuti kelas `dark` pada <html>; latar tidak boleh dikunci satu warna.
  if (!/classList\.contains\('dark'\)/.test(kode)) masalah.push('latar/teks tidak mengikuti tema (kelas dark pada <html>)')
  // 4. Pembaca layar: galat diumumkan.
  if (!/role="alert"/.test(kode)) masalah.push('wadah galat tanpa role="alert"')
  // 5. Detail teknis (rute + pesan terpangkas) tersedia untuk diagnosis.
  if (!/ringkasGalat\(/.test(kode) || !/Technical details/.test(kode)) masalah.push('detail teknis tidak ditampilkan')
  return masalah
}

const kode = readFileSync(SUMBER, 'utf8')
assert.deepEqual(periksa(kode), [], 'ErrorBoundary akar melanggar penjaga')

// Sabotase: tiap mutasi harus gagal DENGAN NAMA aturan yang tepat.
const mutan: Array<[string, string, RegExp]> = [
  ['tanpa laporan', kode.replace("laporGalat('boundary', error, 'root')", 'void 0'), /tidak melaporkan galat akar/],
  ['className kembali', kode.replace('<h1 style=', '<h1 className="text-ink" style='), /memakai className/],
  ['latar dikunci', kode.replace("classList.contains('dark')", "classList.contains('x')"), /tidak mengikuti tema/],
  ['tanpa role alert', kode.replace('role="alert"', ''), /tanpa role="alert"/],
  ['tanpa detail', kode.replace('Technical details', 'Detail'), /detail teknis tidak ditampilkan/],
]
for (const [nama, k, pola] of mutan) {
  assert.notEqual(k, kode, `mutan "${nama}" tidak mengubah apa pun (uji kehilangan makna)`)
  const m = periksa(k)
  assert.ok(m.some((x) => pola.test(x)), `mutan "${nama}" lolos tanpa gagal dengan nama: ${JSON.stringify(m)}`)
}
console.log('error-boundary-akar: laporan, tanpa className, tema, role alert, detail; 5 mutan gagal dengan nama; passed')
