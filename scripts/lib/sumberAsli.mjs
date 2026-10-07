// Berkas di src/pages dan src/components kini tersebar per domain, dengan stub
// `export * from` di lokasi lama. Uji yang membaca isi sumber harus membaca
// berkas aslinya, bukan stub-nya.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = join(fileURLToPath(new URL('../../src/', import.meta.url)))

/** Baca sumber asli `src/<jenis>/**\/<nama>` (nama boleh tanpa .tsx). */
export function bacaSumber(jenis, nama) {
  const berkas = nama.includes('.') ? nama : `${nama}.tsx`
  const semua = readdirSync(join(src, jenis), { recursive: true }).filter(
    (p) => p === berkas || p.endsWith(`/${berkas}`),
  )
  const isi = semua.map((p) => readFileSync(join(src, jenis, p), 'utf8'))
  const asli = isi.find((t) => !t.startsWith('export * from'))
  if (asli === undefined) throw new Error(`sumber asli tidak ditemukan: ${jenis}/${berkas}`)
  return asli
}
