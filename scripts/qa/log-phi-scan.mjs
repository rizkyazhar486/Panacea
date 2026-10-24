// E4 / Perlindungan data pasien — gerbang log server. Memindai panggilan console.* di server/src dan menolak yang menyisipkan
// pengenal langsung (email, nama, telepon, NIK, tanggal lahir, diagnosis, kata sandi, token) tanpa melewati penandaLog (pseudonim HMAC).
// Batas jujur: pemindai statis per-baris; tidak melihat nilai runtime, log multi-baris, atau pengenal dengan nama variabel lain.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const RE_PANGGILAN = /console\.(?:log|warn|error|info|debug)\(/
// `nama`/`name` telanjang tidak dihitung (sering nama koleksi/literal tipe); hanya nama-orang (patientName, user.name, dst.); nama liga/koleksi tidak dihitung.
// Disisipkan sebagai ${...} atau dilempar sebagai argumen; teks statis seperti "Email: LIVE" tidak dihitung.
const RE_PENGENAL = /(?:\b(?:email|phone|telepon|hp|nik|birth|dob|lahir|diagnos\w*|keluhan|password|kataSandi|token|jwt|secret)\b|\b(?:patient|pasien|full|first|last|user|doctor|dokter|klien|client)(?:Name|Nama)\b|\b(?:user|u|patient|pasien|p|dokter)\.(?:name|nama)\b)/i
const RE_BUKAN_NILAI = /^\s*(['"`])(?:(?!\1).)*\1\s*$/

export function pindaiBarisLog(baris) {
  if (!RE_PANGGILAN.test(baris) || baris.includes('penandaLog(')) return null
  const isi = baris.slice(baris.search(RE_PANGGILAN))
  // Hanya ekspresi dinamis: isi ${...} atau argumen non-literal setelah koma pertama.
  const dinamis = [...isi.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1])
  const argumen = isi.replace(/^console\.\w+\(/, '').replace(/\)\s*;?\s*$/, '')
  const sisaArg = argumen.includes('`') ? [] : argumen.split(/,(?![^(]*\))/).slice(1).filter((a) => !RE_BUKAN_NILAI.test(a))
  const bocor = [...dinamis, ...sisaArg].find((e) => RE_PENGENAL.test(e))
  return bocor ? bocor.trim() : null
}

export function pindaiBerkas(nama, teks) {
  return teks.split('\n').flatMap((b, i) => { const x = pindaiBarisLog(b); return x ? [{ berkas: nama, baris: i + 1, ekspresi: x }] : [] })
}

export function pindaiServer() {
  const berkas = execFileSync('git', ['ls-files', 'server/src'], { cwd: AKAR }).toString().split('\n').filter((f) => /\.ts$/.test(f))
  return berkas.flatMap((f) => pindaiBerkas(f, readFileSync(join(AKAR, f), 'utf8')))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const temuan = pindaiServer()
  for (const t of temuan) console.error(`${t.berkas}:${t.baris} log memuat pengenal tanpa penandaLog: ${t.ekspresi}`)
  console.log(`log-phi-scan: ${temuan.length} temuan`)
  process.exit(temuan.length ? 1 : 0)
}
