// Ratchet arsitektur (CLAUDE.md §2.3 poin 3-4): pelanggaran lama dicatat di baseline,
// CI hanya menolak pelanggaran BARU. Baseline hanya boleh menyusut (`--update` memangkas).
//
// Yang dijaga:
//  - flatLib / flatServer: src/lib/*.ts dan server/src/*.ts datar dibekukan (tidak ada berkas baru).
//  - impure: kemurnian src/lib (tanpa jam/jaringan/DOM/acak tersembunyi).
// Deteksi berbasis teks setelah komentar dibuang: kasar, sengaja. Pemakaian sah yang sudah ada
// masuk baseline; berkas BARU dengan pola yang sama harus menginjeksi now/rng/fetch.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BASELINE_PATH = join(ROOT, 'governance', 'arch-ratchet-baseline.json')

export const IMPURE_PATTERNS = {
  'Date.now': /\bDate\.now\(/,
  'new Date()': /\bnew Date\(\)/,
  'Math.random': /\bMath\.random\(/,
  fetch: /(?<![\w.$])fetch\(/,
  // Harus diikuti pengenal: kata "window." di akhir kalimat dalam string bukan akses DOM.
  window: /(?<![\w.$])window\.[A-Za-z_$]/,
  document: /(?<![\w.$])document\.[A-Za-z_$]/,
}

const KODE = /\.tsx?$/
const BUKAN_KODE = /\.(test|uji)\.|\.d\.ts$/

// Buang komentar blok dan baris agar kata di komentar tidak dihitung.
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

export function detectImpure(src) {
  const bersih = stripComments(src)
  return Object.entries(IMPURE_PATTERNS).filter(([, re]) => re.test(bersih)).map(([nama]) => nama)
}

const flatFiles = (dir) =>
  readdirSync(join(ROOT, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && KODE.test(e.name) && !BUKAN_KODE.test(e.name))
    .map((e) => e.name)
    .sort()

function walk(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : KODE.test(e.name) && !BUKAN_KODE.test(e.name) ? [join(dir, e.name)] : [],
  )
}

export function scanRepo() {
  const impure = Object.fromEntries(Object.keys(IMPURE_PATTERNS).map((k) => [k, []]))
  for (const f of walk('src/lib').sort()) {
    for (const nama of detectImpure(readFileSync(join(ROOT, f), 'utf8'))) impure[nama].push(f.replace(/^src\/lib\//, ''))
  }
  return { flatLib: flatFiles('src/lib'), flatServer: flatFiles('server/src'), impure }
}

// Murni: bandingkan keadaan sekarang dengan baseline.
// baru = ada di sekarang, tidak di baseline (GAGAL); usang = ada di baseline, sudah hilang (info).
export function evaluate(current, baseline) {
  const baru = []
  const usang = []
  const bandingkan = (label, now, base) => {
    const b = new Set(base)
    const n = new Set(now)
    for (const f of now) if (!b.has(f)) baru.push(`${label}: ${f}`)
    for (const f of base) if (!n.has(f)) usang.push(`${label}: ${f}`)
  }
  bandingkan('flatLib', current.flatLib, baseline.flatLib ?? [])
  bandingkan('flatServer', current.flatServer, baseline.flatServer ?? [])
  for (const nama of Object.keys(IMPURE_PATTERNS)) bandingkan(`impure[${nama}]`, current.impure[nama] ?? [], baseline.impure?.[nama] ?? [])
  return { ok: baru.length === 0, baru, usang }
}

const hitung = (s) => s.flatLib.length + s.flatServer.length + Object.values(s.impure).reduce((a, l) => a + l.length, 0)

function main(argv) {
  const sekarang = scanRepo()
  if (argv.includes('--update')) {
    // Hanya memangkas: entri baru tidak pernah ditambahkan otomatis.
    const lama = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
    const { baru } = evaluate(sekarang, lama)
    if (baru.length) {
      console.error(`Menolak --update: ada pelanggaran baru (${baru.length}). Perbaiki dulu.\n  ${baru.join('\n  ')}`)
      process.exit(1)
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(sekarang, null, 2) + '\n')
    console.log(`Baseline dipangkas: ${hitung(lama)} -> ${hitung(sekarang)} entri.`)
    return
  }
  if (argv.includes('--init')) {
    writeFileSync(BASELINE_PATH, JSON.stringify(sekarang, null, 2) + '\n')
    console.log(`Baseline dibuat: ${hitung(sekarang)} entri.`)
    return
  }
  const hasil = evaluate(sekarang, JSON.parse(readFileSync(BASELINE_PATH, 'utf8')))
  if (!hasil.ok) {
    console.error(
      `Ratchet arsitektur GAGAL: ${hasil.baru.length} pelanggaran baru.\n  ${hasil.baru.join('\n  ')}\n` +
        'Berkas lib baru harus di domains/ (bukan src/lib datar) dan murni: injeksikan now/rng/fetch.',
    )
    process.exit(1)
  }
  console.log(`Ratchet arsitektur OK (${hitung(sekarang)} entri baseline${hasil.usang.length ? `, ${hasil.usang.length} usang: jalankan --update` : ''}).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
