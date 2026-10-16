// E4 / Perlindungan data pasien — pemindai PHI/PII di repo. Mendeteksi (a) NIK Indonesia berstruktur sah, (b) nomor ponsel Indonesia,
// (c) alamat email dengan domain yang bukan domain sintetis/placeholder. Temuan yang disengaja HARUS terdaftar di
// governance/PHI_SCAN_ALLOWLIST.json lengkap dengan alasan; entri yang tidak lagi cocok apa pun juga gagal (daftar tidak boleh membusuk).
// Batas jujur: ini pemindai pola, bukan bukti tiadanya PHI; nama orang, alamat, dan data klinis bebas-teks tidak terdeteksi.
//   node scripts/qa/phi-repo-scan.mjs        (keluar 1 bila ada temuan tak terdaftar atau entri daftar-izin usang)
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKIP_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|glb|gltf|bin|woff2?|ttf|otf|pdf|mp[34]|wav|zip|gz|wasm|map|lock|nii|dcm|npy|blend|py)$/i
const SKIP_PREFIX = ['public/', 'node_modules/', 'bodyexposure/']
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

export function daftarBerkas() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: AKAR, maxBuffer: 1 << 28 }).toString().split('\0').filter((f) => f && !SKIP_EXT.test(f) && !SKIP_PREFIX.some((p) => f.startsWith(p)) && !BERKAS_FIXTURE.includes(f))
}

export function pindaiRepo(berkas = daftarBerkas(), baca = (f) => readFileSync(join(AKAR, f), 'utf8')) {
  const hasil = []
  for (const f of berkas) { let t; try { t = baca(f) } catch { continue } if (t.length > 2_000_000) continue; for (const x of pindaiTeks(t)) hasil.push({ berkas: f, ...x }) }
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
  if (!existsSync(path)) throw new Error(`daftar izin tidak ada: ${path}`)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(d.entri)) throw new Error('daftar izin tidak valid: entri harus larik')
  return d.entri
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const t = pindaiRepo(); const { takTerdaftar, usang, tanpaAlasan } = bandingkan(t, muatDaftarIzin())
  console.log(JSON.stringify({ temuan: t.length, takTerdaftar: takTerdaftar.length, usang: usang.length, tanpaAlasan: tanpaAlasan.length }))
  if (takTerdaftar.length || usang.length || tanpaAlasan.length) {
    for (const x of takTerdaftar.slice(0, 20)) console.error(`PHI tak terdaftar: ${x.jenis} ${x.nilai} di ${x.berkas}`)
    for (const x of usang) console.error(`entri daftar-izin usang: ${x.jenis} ${x.nilai}`)
    for (const x of tanpaAlasan) console.error(`entri tanpa alasan memadai: ${x.jenis} ${x.nilai}`)
    process.exit(1)
  }
}
