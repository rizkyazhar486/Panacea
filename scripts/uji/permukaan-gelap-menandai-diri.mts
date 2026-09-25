import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─────────────────────────────────────────────────────────────────────────────
// PERMUKAAN YANG MEMAKSA DIRINYA GELAP HARUS MENGAKU GELAP.
//
// Tema aplikasi ini dipilih pemakai dan ditandai dengan kelas `.dark` di elemen
// html. SELURUH gaya gelap bergantung pada penanda itu: varian `dark:` milik
// Tailwind dan lapisan pemetaan `.dark .bg-white`, `.dark .bg-neutral-50` dan
// seterusnya di src/index.css.
//
// Tetapi banyak permukaan di aplikasi ini gelap TANPA SYARAT — ruang komando
// Clinical, kanvas Body, bengkel-bengkel bodyhub — karena memang begitulah
// rancangannya, apa pun tema pemakainya. Ketika temanya terang, penanda itu
// tidak ada, sehingga setiap komponen di dalam permukaan gelap tadi merender
// versi TERANGnya.
//
// Diukur di peramban pada 390x844, tema terang, halaman Clinical: panduan
// "How to use" dirender dengan latar oklch(0.985 0 0) — putih nyaris murni —
// sebagai lempengan menyilaukan di tengah halaman hitam. Bukan hanya satu:
// pemindaian pertama menemukan 48 permukaan semacam itu dan TIDAK SATU PUN
// menandai dirinya gelap.
//
// Inilah sebab sistemik di balik "UI-nya tidak rapi": bukan satu komponen yang
// salah, melainkan satu penanda yang hilang di 48 tempat sekaligus.
//
// Aturannya: className yang memaksa latar nyaris hitam DAN teks putih wajib
// ikut membawa `dark`, supaya keturunannya melihat konteks yang sebenarnya.
// ─────────────────────────────────────────────────────────────────────────────

const akar = fileURLToPath(new URL('../../', import.meta.url))

function telusuri(dir: string, keluar: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) telusuri(p, keluar)
    else if (p.endsWith('.tsx')) keluar.push(p)
  }
  return keluar
}

/** Latar nyaris hitam yang ditulis eksplisit, bukan lewat token tema. */
const LATAR_GELAP = /bg-\[#0[0-9a-fA-F]{5}\]|bg-black(?![/\w-])/
const TEKS_PUTIH = /(^|\s)text-white(\s|$)/
const SUDAH_MENANDAI = /(^|\s)dark(\s|$)/

export interface Temuan {
  berkas: string
  baris: number
  kelas: string
}

export function pindaiPermukaanGelap(berkasTsx: readonly string[]): Temuan[] {
  const temuan: Temuan[] = []
  for (const f of berkasTsx) {
    const s = readFileSync(f, 'utf8')
    const re = /className=\{?[`"]([^`"]*)[`"]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(s))) {
      const kelas = m[1]
      if (!LATAR_GELAP.test(kelas)) continue
      if (!TEKS_PUTIH.test(kelas)) continue
      if (SUDAH_MENANDAI.test(kelas)) continue
      temuan.push({
        berkas: relative(akar, f),
        baris: s.slice(0, m.index).split('\n').length,
        kelas: kelas.slice(0, 70),
      })
    }
  }
  return temuan
}

// ── Pemindainya sendiri harus punya gigi sebelum hasilnya dipercaya.
{
  const contoh = [
    // gelap + putih, tanpa penanda -> pelanggaran
    'className="rounded-2xl bg-[#020306] p-3 text-white"',
    // gelap + putih, sudah menandai -> bukan pelanggaran
    'className="dark rounded-2xl bg-[#020306] p-3 text-white"',
    // gelap tanpa teks putih -> bukan urusan aturan ini
    'className="rounded-2xl bg-[#020306] p-3"',
    // terang -> bukan urusan aturan ini
    'className="rounded-2xl bg-white p-3 text-ink"',
  ]
  const hasil = contoh.map((baris) => {
    const m = /className=\{?[`"]([^`"]*)[`"]/.exec(baris)!
    const kelas = m[1]
    return LATAR_GELAP.test(kelas) && TEKS_PUTIH.test(kelas) && !SUDAH_MENANDAI.test(kelas)
  })
  assert.deepEqual(
    hasil,
    [true, false, false, false],
    'pemindai permukaan gelap salah menggolongkan contoh yang jawabannya sudah pasti',
  )
}

// ── Tidak boleh ada permukaan gelap yang menyembunyikan jati dirinya.
{
  const berkas = telusuri(join(akar, 'src'))
  assert.ok(berkas.length > 100, `hanya ${berkas.length} berkas .tsx terbaca — penelusurannya rusak`)

  const temuan = pindaiPermukaanGelap(berkas)
  assert.deepEqual(
    temuan.map((t) => `${t.berkas}:${t.baris}`),
    [],
    `permukaan gelap tanpa penanda \`dark\` — komponen di dalamnya akan merender versi terangnya di atas latar hitam:\n` +
      temuan.map((t) => `  ${t.berkas}:${t.baris}  ${t.kelas}`).join('\n'),
  )
}

console.log('permukaan-gelap-menandai-diri: setiap permukaan gelap-paksa membawa penanda `dark`, sehingga keturunannya bergaya sesuai latarnya')
