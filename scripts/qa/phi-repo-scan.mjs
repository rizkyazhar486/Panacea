// E4 / Perlindungan data pasien — pemindai PHI/PII di repo. Mendeteksi (a) NIK Indonesia berstruktur sah, (b) nomor ponsel Indonesia,
// (c) alamat email dengan domain yang bukan domain sintetis/placeholder. Temuan yang disengaja HARUS terdaftar di
// governance/PHI_SCAN_ALLOWLIST.json lengkap dengan alasan; entri yang tidak lagi cocok apa pun juga gagal (daftar tidak boleh membusuk).
// Batas jujur: ini pemindai pola, bukan bukti tiadanya PHI; nama orang, alamat, dan data klinis bebas-teks tidak terdeteksi.
//   node scripts/qa/phi-repo-scan.mjs        (keluar 1 bila ada temuan tak terdaftar atau entri daftar-izin usang)
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKIP_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|glb|gltf|bin|woff2?|ttf|otf|pdf|mp[34]|wav|zip|gz|wasm|map|lock|nii|dcm|npy|blend|py)$/i
const SKIP_PREFIX = ['public/', 'node_modules/', 'bodyexposure/']
// Upper bound measured in JS UTF-16 code units, not bytes. >2M-character source files are fully scanned.
export const BATAS_PINDAI_KARAKTER = 16_000_000

// CI is shared and retained. Never echo the matched identifier or a filename
// (filenames can themselves contain PHI). This deterministic opaque reference
// lets engineers locate the file locally without publishing its contents.
export const refBerkasAman = (f) => createHash('sha256').update(String(f)).digest('hex').slice(0, 16)
const jenisAman = (x) => ['email', 'nik', 'ponsel'].includes(x) ? x : 'unknown'
// Berkas yang SENGAJA memuat nilai terlarang: fixture tes pemindai ini, dan daftar-izin itu sendiri (jika ikut dipindai ia mencocokkan dirinya
// sendiri sehingga entri usang tak pernah terdeteksi). Daftar dikunci oleh tes (harus persis ini).
export const BERKAS_FIXTURE = ['scripts/qa/phi-repo-scan.test.mjs', 'governance/PHI_SCAN_ALLOWLIST.json']
// Domain yang pasti sintetis/placeholder (RFC 2606 dan konvensi uji repo). Bukan izin untuk menaruh alamat nyata di domain ini.
const DOMAIN_SINTETIS = /^(example\.(com|org|net|test|invalid)|.*\.(test|invalid|example|localhost)|localhost|x\.(id|com|co|test)|a\.b|b\.id|email\.com|domain\.com|test\.com)$/i

const RE_EMAIL = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9][A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g
const RE_NIK = /(?<![\d.])(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{4})(?![\d.])/g
const RE_HP = /(?<![\d.])(?:\+62|62|0)8\d{8,11}(?![\d.])/g
// Pola nomor yang jelas buatan: urutan naik, satu digit berulang, atau blok 1234567xx.
const hpSintetis = (d) => { const s = d.replace(/^(\+62|62|0)/, ''); return /^(\d)\1+$/.test(s) || /12345678/.test(s) || /^8(0000|1111)/.test(s) }

export function pindaiTeks(teks) {
  const temuan = []
  for (const m of teks.matchAll(RE_EMAIL)) { if (!DOMAIN_SINTETIS.test(m[1])) temuan.push({ jenis: 'email', nilai: m[0].toLowerCase() }) }
  for (const m of teks.matchAll(RE_NIK)) {
    const [prov, , , dd, mm] = m.slice(1, 6).map(Number)
    const hari = dd > 40 ? dd - 40 : dd // perempuan: tanggal + 40
    if (prov >= 11 && prov <= 94 && hari >= 1 && hari <= 31 && mm >= 1 && mm <= 12) temuan.push({ jenis: 'nik', nilai: m[0] })
  }
  for (const m of teks.matchAll(RE_HP)) if (!hpSintetis(m[0])) temuan.push({ jenis: 'ponsel', nilai: m[0] })
  return temuan
}

export function daftarBerkasTerlacak(jalankanGit = execFileSync) {
  // Child-process exceptions may contain tracked filenames or sensitive output.
  // Keep the scan fail-closed without exposing untrusted subprocess diagnostics.
  let keluaran
  try {
    keluaran = jalankanGit('git', ['ls-files', '-z'], { cwd: AKAR, stdio: 'pipe', maxBuffer: 1 << 28 })
  } catch {
    throw new Error('PHI scan gagal mendapatkan daftar berkas terlacak; pemindaian dibatalkan')
  }
  if (!Buffer.isBuffer(keluaran) && typeof keluaran !== 'string') {
    throw new TypeError('PHI scan menerima daftar berkas bukan teks; pemindaian dibatalkan')
  }
  return keluaran.toString().split('\0').filter(Boolean)
}

export function daftarBerkas(jalankanGit = execFileSync) {
  return daftarBerkasTerlacak(jalankanGit).filter((f) =>
    !SKIP_EXT.test(f) && !SKIP_PREFIX.some((p) => f.startsWith(p)) && !BERKAS_FIXTURE.includes(f))
}

// File-content exclusions must not exempt PHI embedded in tracked path names.
// Preserve the existing email/extension convention. Numeric identifiers need
// dot boundaries independent of file type, including unknown/compound suffixes.
// Do not log the filename or the detected identifier.
export function pindaiNamaBerkas(berkas = daftarBerkasTerlacak()) {
  const hasil = []
  for (const f of berkas) {
    const email = f.split('/').flatMap((part, index, parts) => {
      const candidate = index === parts.length - 1
        ? part.replace(/\.(?:tar\.)?(?:tsx?|jsx?|mjs|cjs|mts|cts|json|md|txt|html|css|svg|png|jpe?g|webp|avif|ico|glb|gltf|bin|pdf|mp[34]|wav|wasm|map|lock|nii|dcm|npy|blend|py|csv|zip|gz)$/i, '')
        : part
      // .md/.py can be an email domain. Check each path component separately
      // so a synthetic parent-directory email cannot suppress this fallback.
      const emailCandidate = [...candidate.matchAll(RE_EMAIL)].length ? candidate : part
      return pindaiTeks(emailCandidate).filter((x) => x.jenis === 'email')
    })
    const numeric = pindaiTeks(f.replace(/\./g, ' ')).filter((x) => x.jenis !== 'email')
    for (const x of [...email, ...numeric]) hasil.push({ berkas: f, ...x })
  }
  return hasil
}

export function pindaiRepo(berkas = daftarBerkas(), baca = (f) => readFileSync(join(AKAR, f), 'utf8')) {
  const hasil = []
  // All in-scope source files must be examined; never silently skip a failed read.
  // Keep a bounded fail-closed ceiling for pathological generated files.
  for (const f of berkas) {
    let t
    try { t = baca(f) } catch (error) {
      throw new Error(`PHI scan gagal membaca berkas ref=${refBerkasAman(f)}; hasil tidak boleh dinyatakan bersih`)
    }
    if (typeof t !== 'string') throw new TypeError(`PHI scan menerima konten bukan teks: ref=${refBerkasAman(f)}`)
    if (t.length > BATAS_PINDAI_KARAKTER) throw new Error(`PHI scan tidak memeriksa berkas >${BATAS_PINDAI_KARAKTER} karakter: ref=${refBerkasAman(f)}`)
    for (const x of pindaiTeks(t)) hasil.push({ berkas: f, ...x })
  }
  return hasil
}

// daftar-izin: [{ jenis, nilai, berkas?, alasan }]; cocok bila jenis & nilai sama (dan berkas bila diberikan)
export function bandingkan(temuan, daftarIzin) {
  const cocok = (t, e) => e.jenis === t.jenis && e.nilai.toLowerCase() === t.nilai.toLowerCase() && (!e.berkas || e.berkas === t.berkas)
  const takTerdaftar = temuan.filter((t) => !daftarIzin.some((e) => cocok(t, e)))
  const usang = daftarIzin.filter((e) => !temuan.some((t) => cocok(t, e)))
  const tanpaAlasan = daftarIzin.filter((e) => typeof e.alasan !== 'string' || e.alasan.trim().length < 10)
  return { takTerdaftar, usang, tanpaAlasan }
}

export function muatDaftarIzin(path = join(AKAR, 'governance', 'PHI_SCAN_ALLOWLIST.json')) {
  // JSON.parse/read errors can embed patient identifiers or private paths.
  // Replace all parser/file-system diagnostics with static fail-closed errors.
  let d
  try {
    d = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error('daftar izin tidak dapat dibaca atau JSON tidak valid; pemindaian dibatalkan')
  }
  if (!d || typeof d !== 'object' || !Array.isArray(d.entri) ||
    d.entri.some((e) => !e || typeof e !== 'object' ||
      !['nik', 'ponsel', 'email'].includes(e.jenis) ||
      typeof e.nilai !== 'string' || typeof e.alasan !== 'string' ||
      (e.berkas !== undefined && typeof e.berkas !== 'string'))) {
    throw new Error('daftar izin memiliki struktur tidak valid; pemindaian dibatalkan')
  }
  return d.entri
}

// A failure should still be actionable (kind, count, stable file reference),
// without turning a privacy check into a second PHI disclosure in CI logs.
export function ringkasKegagalanTanpaPHI({ takTerdaftar = [], usang = [], tanpaAlasan = [] }) {
  const baris = []
  for (const x of takTerdaftar.slice(0, 20)) {
    baris.push(`PHI tak terdaftar: jenis=${jenisAman(x.jenis)} nilai=[REDACTED] ref=${refBerkasAman(x.berkas)}`)
  }
  for (const x of usang) baris.push(`entri daftar-izin usang: jenis=${jenisAman(x.jenis)} nilai=[REDACTED]`)
  for (const x of tanpaAlasan) baris.push(`entri tanpa alasan memadai: jenis=${jenisAman(x.jenis)} nilai=[REDACTED]`)
  return baris
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const t = [...pindaiNamaBerkas(), ...pindaiRepo()]; const { takTerdaftar, usang, tanpaAlasan } = bandingkan(t, muatDaftarIzin())
  console.log(JSON.stringify({ temuan: t.length, takTerdaftar: takTerdaftar.length, usang: usang.length, tanpaAlasan: tanpaAlasan.length }))
  if (takTerdaftar.length || usang.length || tanpaAlasan.length) {
    for (const line of ringkasKegagalanTanpaPHI({ takTerdaftar, usang, tanpaAlasan })) console.error(line)
    process.exit(1)
  }
}
