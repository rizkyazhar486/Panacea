import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Setiap panel yang MENCETAK ANGKA harus menyatakan batas modelnya.
//
// Panel-panel ini menghitung fisiologi dan menampilkan bilangan dengan satuan.
// Tanpa catatan penutup, sebuah bilangan terlihat seperti pengukuran, dan itu
// justru kebalikan dari maksudnya: semuanya dihitung dari angka yang diketik
// pengguna, bukan diukur dari siapa pun.
//
// KENAPA BERKAS INI TIDAK MEMERIKSA KATA-KATANYA.
//
// Versi pertama memeriksa kosakata batas ("not a diagnosis", "mechanism only",
// dan seterusnya). Versi itu MENUDUH TIGA PANEL YANG SEBENARNYA BENAR:
//
//   * TuasSendiPanel menyimpan batasnya di pustaka, dirender dari
//     JOINT_LEVER_DISCLOSURE, sehingga pencarian pada berkas panel tidak
//     melihatnya sama sekali;
//   * VentilasiSegmenPanel menulis "Nothing here is measured from a person",
//     yang lolos dari daftar kata saya hanya karena ada kata "here" di
//     tengahnya;
//   * NefronPanel menyatakan keterbatasannya dengan kalimatnya sendiri.
//
// Tiga kali salah tuduh dari satu daftar kata adalah bukti yang cukup bahwa
// aturan berbasis frasa itu keliru. Lebih buruk lagi, gerbang semacam itu
// mendorong orang MENEMPELKAN kalimat ajaib alih-alih memikirkan batas
// modelnya -- ia akan merusak kejujuran yang ia maksud lindungi.
//
// Jadi yang dijaga di sini adalah KONVENSINYA, bukan kalimatnya: setiap panel
// kuantitatif diakhiri dengan catatan keterbatasan, entah sebagai paragraf
// kecil bergaya redup atau sebagai blok pengungkapan terstruktur. Apa yang
// ditulis di dalamnya adalah tanggung jawab penulisnya, dan memang seharusnya
// begitu.

const DIR = 'src/pages/bodyhub'

const berkas = readdirSync(DIR).filter((f) => f.endsWith('.tsx')).sort()
assert.ok(berkas.length > 10, `hanya ${berkas.length} panel terbaca; pemindaiannya mungkin rusak`)

/** Panel kuantitatif: mencetak angka bersatuan DAN punya kendali. */
const kuantitatif = berkas.filter((f) => {
  const s = readFileSync(join(DIR, f), 'utf8')
  return /font-\[var\(--font-angka\)\]/.test(s) && /type="range"/.test(s)
})
assert.ok(
  kuantitatif.length >= 8,
  `hanya ${kuantitatif.length} panel kuantitatif ditemukan; penyaringannya mungkin rusak`,
)

// Catatan penutup HARUS dibedakan dari judul bagian.
//
// Versi pertama pemeriksaan ini hanya mencari "text-[11px] ... text-neutral-500"
// di mana pun, dan itu membuatnya TAUTOLOGI: setiap judul bagian pada panel
// memakai kelas yang sama persis, jadi gerbangnya lulus karena judulnya, bukan
// karena catatan keterbatasannya. Saya membuktikannya dengan MENGHAPUS catatan
// penutup dari satu panel -- dan gerbangnya tetap hijau.
//
// Yang membedakan keduanya adalah `leading-relaxed` (prosa yang dibaca) versus
// `font-black uppercase tracking` (judul). Pembeda itu yang dipakai sekarang,
// dan sabotase yang sama sekarang gagal seperti seharusnya.
const CATATAN = /className="[^"]*text-\[11(\.5)?px\][^"]*leading-relaxed[^"]*text-neutral-500[^"]*"/g

const tanpaCatatan: string[] = []
for (const f of kuantitatif) {
  const s = readFileSync(join(DIR, f), 'utf8')
  const paragraf = [...s.matchAll(CATATAN)].some((m) => !/font-black|uppercase/.test(m[0]))
  // Atau blok pengungkapan terstruktur, seperti JOINT_LEVER_DISCLOSURE.
  const blok = /DISCLOSURE/i.test(s)
  if (!paragraf && !blok) tanpaCatatan.push(f)
}

assert.deepEqual(
  tanpaCatatan, [],
  'these panels print numbers with units but end without any limitations note, so a computed ' +
  `figure can read as a measurement:\n  ${tanpaCatatan.join('\n  ')}\n` +
  'Close the panel with a short note on what the model is and is not. The wording is yours; ' +
  'this gate does not check it, and deliberately so.',
)

console.log(
  `OK panel-punya-keterbatasan: ${kuantitatif.length} panel kuantitatif dari ${berkas.length} panel, ` +
  'semuanya diakhiri catatan keterbatasan -- konvensinya yang dijaga, bukan kalimatnya.',
)
