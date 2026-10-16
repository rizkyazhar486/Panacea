// C2: pemindai semantik pelengkap untuk "kolom kosong / nilai hilang dibaca 0".
// Detektor asli (scripts/uji/angka-kosong-ratchet.mts) TIDAK diubah. Ia hanya memindai *.tsx dan regex-nya tidak melihat tanda kurung
// bersarang, sehingga `kkal += Number(f.kcal) || 0` di berkas .ts dan `Number(localStorage.getItem(K) || 0)` lolos. Pemindai ini memindai
// semua src/**/*.ts(x), mengerti kurung bersarang, dan mengabaikan komentar, string, teks templat dan regex literal (leksikal, bukan sekadar regex).
// Aturan: `Number|parseFloat|parseInt(...) || 0`, `Number|parseFloat|parseInt(... || 0)` / `(... ?? 0)`, dan `+x || 0`.
// Hasil harus NOL di luar DAFTAR_IZIN (sentinel/penghitung yang sah, masing-masing beralasan). Ini bukan bukti cakupan semantik penuh:
// `?? 0` pada penjumlahan pengukuran dan ternary NaN→0 dilaporkan, bukan digerbangkan (lihat docs/clinical-calculators/C2_SEMANTIC_AUDIT.md).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Ganti semua yang bukan kode (komentar, string, teks templat, regex literal) dengan spasi; kode di dalam `${}` tetap. */
export function kodeSaja(src: string): string {
  const out = src.split("")
  const blank = (a: number, b: number) => { for (let i = a; i < Math.min(b, out.length); i++) if (out[i] !== '\n') out[i] = ' ' }
  // Teks templat: kosongkan teksnya, tetapi pindai kode di dalam `${ ... }`.
  function templat(awal: number): number {
    blank(awal, awal + 1)
    let j = awal + 1
    while (j < src.length) {
      const ch = src[j]
      if (ch === '\\') { blank(j, j + 2); j += 2; continue }
      if (ch === '`') { blank(j, j + 1); return j + 1 }
      if (ch === '$' && src[j + 1] === '{') { blank(j, j + 2); j = kode(j + 2, true); blank(j, j + 1); j++; continue }
      blank(j, j + 1); j++
    }
    return j
  }
  // Pindai kode mulai dari `i`; bila `berhentiDiKurawal`, berhenti pada `}` yang menutup `${`.
  function kode(i: number, berhentiDiKurawal: boolean): number {
    let depth = 0
    let prev = '' // karakter kode bukan-spasi terakhir, untuk membedakan regex literal dari pembagian
    while (i < src.length) {
      const c = src[i]!, n = src[i + 1]
      if (c === '/' && n === '/') { const e = src.indexOf('\n', i); const stop = e < 0 ? src.length : e; blank(i, stop); i = stop; continue }
      if (c === '/' && n === '*') { const e = src.indexOf('*/', i + 2); const stop = e < 0 ? src.length : e + 2; blank(i, stop); i = stop; continue }
      if (c === "'" || c === '"') {
        let j = i + 1
        while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1
        blank(i, j + 1); i = j + 1; prev = c; continue
      }
      if (c === '`') { i = templat(i); prev = '`'; continue }
      if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\b(return|typeof|case|of|in)$/.test(src.slice(Math.max(0, i - 8), i).trimEnd()))) {
        let j = i + 1, kelas = false
        while (j < src.length && src[j] !== '\n') {
          const ch = src[j]!
          if (ch === '\\') { j += 2; continue }
          if (ch === '[') kelas = true; else if (ch === ']') kelas = false; else if (ch === '/' && !kelas) break
          j++
        }
        if (src[j] === '/') { j++; while (/[a-z]/.test(src[j] ?? '')) j++; blank(i, j); i = j; prev = '/'; continue }
      }
      if (c === '{') depth++
      if (c === '}') { if (berhentiDiKurawal && depth === 0) return i; depth-- }
      if (!/\s/.test(c)) prev = c
      i++
    }
    return i
  }
  kode(0, false)
  return out.join('')
}

export interface Temuan { baris: number; jenis: 'setelah' | 'di-dalam' | 'plus-unary'; potongan: string }
const KONVERSI = /(?<![.\w$])(Number|parseFloat|parseInt)\s*\(/g
const NOL = /^\s*\|\|\s*0(?![\d.\w])/

export function cariKoersi(src: string): Temuan[] {
  const kode = kodeSaja(src)
  const hasil: Temuan[] = []
  const baris = (pos: number) => src.slice(0, pos).split('\n').length
  const tambah = (pos: number, jenis: Temuan['jenis'], akhir: number) => hasil.push({ baris: baris(pos), jenis, potongan: src.slice(pos, akhir).replace(/\s+/g, ' ').trim() })
  for (const m of kode.matchAll(KONVERSI)) {
    const buka = m.index! + m[0].length - 1
    let d = 0, k = buka
    for (; k < kode.length; k++) { const ch = kode[k]; if (ch === '(') d++; else if (ch === ')') { d--; if (d === 0) break } }
    if (d !== 0) continue
    const args = kode.slice(buka + 1, k)
    // `|| 0` atau `?? 0` pada tingkat teratas argumen (bukan di dalam kurung bersarang/kurawal/siku)
    let lvl = 0
    for (let a = 0; a < args.length; a++) {
      const ch = args[a]!
      if ('([{'.includes(ch)) lvl++; else if (')]}'.includes(ch)) lvl--
      else if (lvl === 0 && (args.startsWith('||', a) || args.startsWith('??', a)) && /^\s*0(?![\d.\w])/.test(args.slice(a + 2))) { tambah(m.index!, 'di-dalam', k + 1); break }
    }
    if (NOL.test(kode.slice(k + 1))) tambah(m.index!, 'setelah', k + 1 + (kode.slice(k + 1).match(NOL)![0].length))
  }
  // `+x || 0` hanya bila `+` adalah operator unari: karakter kode bukan-spasi sebelumnya adalah pembuka ekspresi (atau awal berkas).
  for (const m of kode.matchAll(/\+\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\|\|\s*0(?![\d.\w])/g)) {
    const sebelum = kode.slice(0, m.index!).trimEnd()
    const unari = sebelum === '' || '(,=:[!&|?{};+-*%<>~^'.includes(sebelum.at(-1)!) || /\b(return|typeof|case|of|in)$/.test(sebelum)
    if (unari) tambah(m.index!, 'plus-unary', m.index! + m[0].length)
  }
  return hasil
}

// ── Kontrol: pemindai harus mengenai yang seharusnya dan tidak yang tidak seharusnya ───────────────
const n = (s: string) => cariKoersi(s).length
for (const positif of [
  'a(Number(x) || 0)', 'a(parseFloat(x)||0)', 'b(parseInt(y, 10)  ||  0)', 'kkal += Number(f.kcal) || 0', 'const v = Number(foo(bar)) || 0', "const v = Number(localStorage.getItem('k') || 0)",
  'Number(x ?? 0)', 'Number(a.b ?? 0)', 'const u = +x.y || 0', 'x = Number(\n  y\n) || 0', 'return `${Number(x) || 0} kcal`', 'Number(f(g(h(i)))) || 0', 'foo(Number(x) || 0, 2)',
]) assert.equal(n(positif), 1, `harus terdeteksi: ${positif}`)
for (const negatif of [
  'Number(x) || 1', 'Number(x) ?? 0', 'Number.isFinite(x) || 0', 'Number.parseFloat(x) || 0', '// Number(x) || 0', '/* Number(x) || 0 */', "const t = 'Number(x) || 0'", 'const t = "Number(x) || 0"',
  'const t = `teks Number(x) || 0`', 'const r = /Number\\(x\\) \\|\\| 0/', 'parseNumberField(x)', 'Number(x) || 0.5', 'Number(x) || 0n', 'const a = b || 0', 'Number(f(x || 0)) + 1',
  'x = Number(foo(a || 0))', 'Number(x, (y || 0))', 'a.Number(x) || 0', 'const N = (Number(x))', '/**\n * Number(x) || 0 di komentar JSDoc\n */\nconst ok = 1', 'foo(a) + b || 0',
]) assert.equal(n(negatif), 0, `tidak boleh terdeteksi: ${JSON.stringify(negatif)}`)
assert.equal(n('Number(a || 0) + Number(b) || 0'), 2, 'dua temuan pada satu baris')
assert.equal(cariKoersi('x\ny\nz = Number(q) || 0')[0]!.baris, 3, 'nomor baris benar')

// ── Pemindaian sumber ────────────────────────────────────────────────────────────────────────────
/** Sentinel/penghitung yang sah. Kunci: berkas + potongan kode persis (tahan terhadap pergeseran baris); tiap entri wajib masih cocok. */
export const DAFTAR_IZIN: readonly { berkas: string; potongan: string; alasan: string }[] = [
  { berkas: 'src/lib/ringkasan.ts', potongan: 'Number(localStorage.getItem(KUNCI_JEDA) || 0)', alasan: 'Stempel waktu pengiriman terakhir; 0 berarti "belum pernah dikirim" dan memang harus mengizinkan kiriman pertama.' },
  { berkas: 'src/components/tiles/UbinLanjutan.tsx', potongan: 'Number(localStorage.getItem(KUNCI_DUDUK) || 0)', alasan: 'Waktu mulai duduk; 0 berarti belum ada, lalu langsung dijaga `v > 0 ? v : Date.now()`.' },
  { berkas: 'src/components/dashboard/PanaceaGrowthWidgets.tsx', potongan: 'Number(localStorage.getItem(SHARE_KEY) || 0)', alasan: 'Penghitung peristiwa berbagi: nol berbagi adalah nol yang benar, bukan pengukuran yang hilang.' },
  { berkas: 'src/components/dashboard/PanaceaGrowthWidgets.tsx', potongan: 'Number(localStorage.getItem(SHARE_KEY) || 0) || 0', alasan: 'Sama: penghitung berbagi, dijepit nonnegatif.' },
  { berkas: 'src/domains/clinical-operations/model/poliPatientFlow.ts', potongan: 'Number(part ?? 0)', alasan: 'Grup regex opsional (offset zona waktu) hanya untuk pemeriksaan rentang; waktu sebenarnya berasal dari Date.parse atas stempel yang wajib berzona.' },
  { berkas: 'src/lib/hadis.ts', potongan: 'Number(d.metadata?.last_hadithnumber ?? 0)', alasan: 'Jumlah hadis dari metadata kitab, dengan cadangan `|| list.length`; konten referensi, bukan pengukuran pengguna.' },
]

/**
 * UTANG yang tercatat dan hanya boleh TURUN (bukan izin): temuan nyata yang belum dibenahi. Kunci: berkas -> jumlah temuan.
 * Menambah angka atau berkas baru gagal; setelah dibenahi, turunkan angkanya (dan hapus entrinya di nol).
 */
export const UTANG: Readonly<Record<string, { jumlah: number; catatan: string }>> = {
  'src/pages/finance/MoneyHub.tsx': { jumlah: 4, catatan: 'Simulator keuangan: tabungan/kebutuhan/cicilan minimum/setoran bulanan kosong dibaca 0 (mis. dana darurat "No buffer yet" untuk kolom kosong). Bukan data klinis; dibenahi di PR lanjutan.' },
}

function berkasSumber(akar: string): string[] {
  const hasil: string[] = []
  const jalan = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name).replaceAll('\\', '/')
      if (e.isDirectory()) { if (e.name !== 'node_modules') jalan(p) }
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec)\.|\.d\.ts$/.test(e.name)) hasil.push(p)
    }
  }
  jalan(akar)
  return hasil
}

const berkas = berkasSumber('src')
assert.ok(berkas.length > 1500, `pemindaian harus membaca sumber nyata, bukan hampa (${berkas.length} berkas)`)
assert.ok(berkas.some((f) => f.endsWith('.ts')) && berkas.some((f) => f.endsWith('.tsx')), 'harus mencakup .ts dan .tsx')
const dipakai = new Set<number>()
const pelanggaran: string[] = []
const utangNyata: Record<string, number> = {}
for (const f of berkas) {
  const isi = readFileSync(f, 'utf8')
  for (const t of cariKoersi(isi)) {
    const idx = DAFTAR_IZIN.findIndex((d) => d.berkas === f && t.potongan.replace(/\s+/g, ' ') === d.potongan)
    if (idx >= 0) { dipakai.add(idx); continue }
    if (UTANG[f]) { utangNyata[f] = (utangNyata[f] ?? 0) + 1; continue }
    pelanggaran.push(`${f}:${t.baris} [${t.jenis}] ${t.potongan}`)
  }
}
const basi = DAFTAR_IZIN.filter((_, i) => !dipakai.has(i)).map((d) => `${d.berkas}: ${d.potongan}`)
assert.deepEqual(basi, [], `entri DAFTAR_IZIN tidak lagi cocok (hapus): ${basi.join('; ')}`)
assert.deepEqual(pelanggaran, [], `nilai hilang dibaca 0 (perbaiki dengan penolakan/ketiadaan eksplisit, bukan menambah daftar izin):\n  ${pelanggaran.join('\n  ')}`)
for (const [f, u] of Object.entries(UTANG)) {
  const nyata = utangNyata[f] ?? 0
  assert.ok(nyata <= u.jumlah, `${f}: ${nyata} temuan > utang tercatat ${u.jumlah} (utang tidak boleh naik)`)
  assert.equal(nyata, u.jumlah, `${f}: temuan turun ke ${nyata}; turunkan UTANG menjadi ${nyata}${nyata === 0 ? ' dan hapus entrinya' : ''}`)
}
console.log(`angka-kosong-semantik: ${berkas.length} berkas .ts/.tsx dipindai secara leksikal; 0 koersi nilai-hilang→0 di luar ${DAFTAR_IZIN.length} sentinel/penghitung beralasan dan ${Object.values(UTANG).reduce((a, u) => a + u.jumlah, 0)} utang tercatat (hanya boleh turun); kontrol positif dan negatif lulus`)
