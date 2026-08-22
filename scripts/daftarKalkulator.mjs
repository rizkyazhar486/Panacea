// Menyalin judul tiap kalkulator dari ClinicalCalculators.tsx ke sebuah daftar
// yang dapat diindeks mesin pencari.
//
// MENGAPA DISALIN, BUKAN DIBACA LANGSUNG. Keempat puluh kalkulator itu adalah
// bagian DI DALAM satu halaman, bukan rute tersendiri; mesin pencari tidak
// punya cara menemukannya tanpa daftar. Daftar salinan selalu berisiko basi,
// jadi skrip ini juga dipakai sebagai PEMERIKSA: jalankan dengan --periksa dan
// ia mengembalikan kode keluar bukan nol bila daftarnya sudah tidak cocok.

import { readFileSync, writeFileSync } from 'node:fs'

const SUMBER = 'src/pages/ClinicalCalculators.tsx'
const TUJUAN = 'src/lib/daftarKalkulatorKlinis.ts'

const isi = readFileSync(SUMBER, 'utf8')
// Pola pertama memakai [^>]*? dan menghasilkan NOL judul: atribut icon berisi
// JSX ({<IconStethoscope size={18} />}) yang mengandung tanda >, sehingga
// pencocokan berhenti sebelum sampai ke title. Nol temuan pada berkas yang
// jelas berisi puluhan SectionTitle adalah tanda polanya rusak, bukan datanya.
const judul = [...isi.matchAll(/<SectionTitle[\s\S]{0,400}?title="([^"]+)"/g)].map((m) => m[1])
const unik = [...new Set(judul)].filter((j) => j && !/Kalkulator Klinis$/.test(j))

const berkas = `// DIBUAT OTOMATIS oleh scripts/daftarKalkulator.mjs — jangan disunting tangan.
//
// Judul tiap kalkulator di dalam halaman Kalkulator Klinis. Diperlukan karena
// kalkulator-kalkulator itu bagian di dalam satu halaman, bukan rute
// tersendiri, sehingga mesin pencari tidak dapat menemukannya tanpa daftar.
export const KALKULATOR_KLINIS: string[] = ${JSON.stringify(unik, null, 2)}
`

if (process.argv.includes('--periksa')) {
  const lama = (() => { try { return readFileSync(TUJUAN, 'utf8') } catch { return '' } })()
  if (lama.trim() !== berkas.trim()) {
    console.error(`Daftar kalkulator tidak cocok lagi dengan ${SUMBER}. Jalankan: node scripts/daftarKalkulator.mjs`)
    process.exit(1)
  }
  console.log(`${unik.length} kalkulator, daftar masih cocok.`)
} else {
  writeFileSync(TUJUAN, berkas)
  console.log(`${unik.length} kalkulator ditulis ke ${TUJUAN}`)
}
