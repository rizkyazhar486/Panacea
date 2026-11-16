// Pemulihan otomatis saat boot menyalin cache perangkat ke cakupan akun. Untuk akun non-pemilik itu
// menjadikan data akun lain sebagai data pasien ini (smoke Poli: detak 173 bocor). Hanya akun pemilik boleh.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

export function pelanggaranPemulihan(src: string): string[] {
  const out: string[] = []
  const i = src.indexOf('rememberAccountProfile(acc)')
  const blok = i < 0 ? '' : src.slice(i, src.indexOf('recoverSameUserVitalsIntoScope(acc', i))
  if (!blok) out.push('efek pemulihan boot tidak ditemukan')
  if (!/if \(!acc\.isOwner\) return/.test(blok)) out.push('pemulihan boot tidak dibatasi ke akun pemilik')
  return out
}

const src = readFileSync(new URL('../../src/lib/store.tsx', import.meta.url), 'utf8')
assert.deepEqual(pelanggaranPemulihan(src), [], 'pemulihan boot harus khusus pemilik')

const mutasi: Array<[string, (s: string) => string, RegExp]> = [
  ['penjaga dihapus', (s) => s.replace('if (!acc.isOwner) return', ''), /tidak dibatasi ke akun pemilik/],
  ['penjaga dibalik', (s) => s.replace('if (!acc.isOwner) return', 'if (acc.isOwner) return'), /tidak dibatasi ke akun pemilik/],
  ['penjaga hanya untuk non-pemilik lain', (s) => s.replace('if (!acc.isOwner) return', 'if (!acc.email) return'), /tidak dibatasi ke akun pemilik/],
]
for (const [nama, rusak, harap] of mutasi) {
  const hasil = pelanggaranPemulihan(rusak(src))
  assert.ok(hasil.some((p) => harap.test(p)), `mutasi "${nama}" lolos tanpa terdeteksi: ${JSON.stringify(hasil)}`)
}
console.log('store-boot-recovery-owner-only: aturan nyata lulus; 3/3 mutasi terdeteksi dengan nama')
