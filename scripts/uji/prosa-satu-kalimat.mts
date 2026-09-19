import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// SATU KALIMAT DI SCROLL UTAMA; SISANYA DI BALIK ℹ️.
//
// CLAUDE.md menyatakannya sebagai aturan produk: UI yang digulir terus-menerus
// mendapat satu kalimat ringkas per widget, dan tafsiran yang lebih panjang
// tinggal di balik kontrol kontekstual. Komponen `Prosa` sudah menyediakan
// kontrol itu — ia memotong ke satu baris dan memasang tombol "i".
//
// Aturannya ada; yang tidak ada adalah penegaknya. Saat berkas ini ditulis,
// 447 paragraf prosa mentah berisi lebih dari satu kalimat masih tampil
// langsung di layar, tersebar di 248 berkas. Itulah bentuk terukur dari
// keluhan "masih banyak tulisan".
//
// MENGAPA INI RATCHET, BUKAN AMBANG NOL.
// Memperbaiki 447 sekaligus berarti menyentuh 248 berkas dalam satu perubahan
// besar yang mustahil ditinjau dan pasti bertabrakan dengan agen lain. Jadi
// berkas ini mengunci angkanya sebagai BATAS ATAS: jumlahnya boleh turun, dan
// setiap penurunan menurunkan batasnya. Menambah prosa baru menggagalkan uji.
//
// Peringatan keselamatan DIKECUALIKAN dengan sengaja: CLAUDE.md membebaskannya
// ketika meringkas justru menyembunyikan risiko, dan menyembunyikan dosis,
// kontraindikasi atau batas klinis di balik satu ketukan adalah kemunduran,
// bukan penyederhanaan.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Batas atas jumlah paragraf prosa mentah bertingkat.
 * TURUNKAN angka ini setiap kali prosa dipindahkan ke balik disclosure.
 * JANGAN PERNAH menaikkannya untuk membuat uji hijau.
 */
const BATAS = 447

const src = fileURLToPath(new URL('../../src/', import.meta.url))

function berkasTsx(dir: string, keluar: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) berkasTsx(p, keluar)
    else if (nama.endsWith('.tsx')) keluar.push(p)
  }
  return keluar
}

/** Kata yang menandai teks keselamatan; dikecualikan dari aturan ini. */
const PENANDA_KESELAMATAN = /\b(warning|danger|emergency|overdose|contraindicat|do not|never|fatal|toxic|lethal|seek (immediate|urgent)|call (911|112|119|emergency))\b/i

interface Temuan { berkas: string; kalimat: number; kata: number; cuplik: string }

const temuan: Temuan[] = []
for (const f of berkasTsx(src)) {
  const t = readFileSync(f, 'utf8')
  for (const m of t.matchAll(/<p\b[^>]*>([\s\S]{40,600}?)<\/p>/g)) {
    const isi = m[1]
    // Hanya prosa literal: yang memuat ekspresi atau komponen bukan sasaran
    // aturan ini, karena isinya tidak dapat dinilai secara statis.
    if (/[{<]/.test(isi)) continue
    const bersih = isi.replace(/\s+/g, ' ').trim()
    if (PENANDA_KESELAMATAN.test(bersih)) continue
    const kalimat = bersih.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.length > 12)
    if (kalimat.length < 2) continue
    temuan.push({
      berkas: f.replace(src, ''),
      kalimat: kalimat.length,
      kata: bersih.split(/\s+/).length,
      cuplik: bersih.slice(0, 70),
    })
  }
}

assert.ok(
  temuan.length > 0,
  'tidak ada paragraf prosa terbaca sama sekali — pemindaian rusak dan uji ini kehilangan artinya',
)

const terpanjang = [...temuan].sort((a, b) => b.kata - a.kata).slice(0, 5)
assert.ok(
  temuan.length <= BATAS,
  `prosa mentah bertingkat di scroll utama naik menjadi ${temuan.length}, melewati batas ${BATAS}. ` +
    `Pindahkan penjelasan panjang ke balik <Prosa> alih-alih menaikkan batas.\n` +
    terpanjang.map((x) => `  ${x.kata} kata  ${x.berkas}: ${x.cuplik}…`).join('\n'),
)

// Sisi kedua ratchet: begitu jumlahnya turun, BATAS wajib ikut turun. Tanpa
// ini, ruang kendur menumpuk diam-diam dan prosa baru bisa masuk kembali
// tanpa terdeteksi.
assert.ok(
  BATAS - temuan.length <= 15,
  `prosa mentah kini ${temuan.length} sementara batas masih ${BATAS}. ` +
    `Turunkan BATAS ke ${temuan.length} supaya ruang kendur tidak dipakai prosa baru.`,
)

/** Komponen disclosure harus tetap ada dan tetap memasang kontrolnya. */
const prosa = readFileSync(new URL('../../src/components/Prosa.tsx', import.meta.url), 'utf8')
assert.match(prosa, /aria-label=\{buka \? 'Hide context' : 'Show context'\}/, 'Prosa kehilangan kontrol disclosure-nya')
assert.match(prosa, /WebkitLineClamp/, 'Prosa berhenti memotong teks panjang, jadi ia tidak lagi menyembunyikan apa pun')

console.log(
  `prosa-satu-kalimat: ${temuan.length} paragraf mentah bertingkat (batas ${BATAS}), ` +
    `${new Set(temuan.map((x) => x.berkas)).size} berkas; peringatan keselamatan dikecualikan`,
)
