// ─────────────────────────────────────────────────────────────────────────────
// Kasus OSCE berulang yang TIDAK DAPAT DITEMUKAN di halaman tatalaksana.
//
// Ditulis setelah angina pektoris stabil ternyata tidak ada sama sekali di sana
// padahal catatan stasiunnya sudah lengkap. Skrip kelengkapan tidak dapat
// melihat kekurangan seperti itu karena ia hanya membaca satu berkas.
//
// DUA PERCOBAAN SEBELUMNYA SALAH, DAN CARANYA SALAH DENGAN CARA YANG SAMA.
// Keduanya menebak kemiripan nama: yang pertama memakai potongan teks berurutan
// dan melaporkan "Ankle sprain" tidak punya tatalaksana padahal entrinya
// bernama "Sprain / strain (ankle, lutut)"; yang kedua memakai kumpulan kata
// dan masih melaporkan Meniere, PPOK, dan Parkinson kosong padahal ketiganya
// ada. Daftar kerja palsu lebih buruk daripada tidak punya daftar sama sekali,
// karena ia membuat pekerjaan yang sudah selesai dikerjakan ulang.
//
// Yang dipakai sekarang bukan tebakan kemiripan melainkan MESIN PENCARI YANG
// SAMA PERSIS dengan yang dipakai halamannya — lihat SkdiTherapySection.tsx:
//
//     `${diagnosis} ${classification} ${therapy} ${system} ${sinonim}`.toLowerCase().includes(q)
//
// Salinan itu HARUS ikut berubah setiap kali filter halamannya berubah. Ketika
// medan sinonim ditambahkan dan salinan di sini tidak, skrip melaporkan BV dan
// GNAPS masih hilang padahal keduanya sudah dapat ditemukan — alat ukur yang
// tertinggal satu langkah menghasilkan laporan yang salah dengan meyakinkan.
//
// Pertanyaannya pun berubah menjadi pertanyaan yang benar: kalau orang mengetik
// nama kasus ini, apakah ia menemukan sesuatu? Itulah satu-satunya ukuran yang
// penting, dan itu tidak dapat keliru karena ia bukan tafsiran.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'

const kasus = JSON.parse(
  execFileSync('npx', ['tsx', '-e', `
    import { hitungKasus } from './src/lib/analisisOsce'
    import { SKDI_ENTRIES } from './src/lib/skdiTherapyReference'

    // Persis mesin pencari halamannya.
    const cari = (q) => {
      const s = q.toLowerCase().trim()
      if (!s) return 0
      return SKDI_ENTRIES.filter((e) =>
        \`\${e.diagnosis} \${e.classification ?? ''} \${e.therapy} \${e.system} \${(e.sinonim ?? []).join(' ')}\`
          .toLowerCase()
          .includes(s),
      ).length
    }

    /*
     * Nama kasus dibersihkan dari keterangan TINDAKAN dan administrasi ujian
     * sebelum dicari, karena itulah yang diketik orang: yang diketik adalah
     * "PPOK", bukan "PPOK Eksaserbasi Akut (Nebul)".
     */
    const bersih = (nama) =>
      nama
        .replace(/\\([^)]*\\)/g, ' ')
        .replace(/\\b(rme|nebul|infus|iv ?line|ivfd|tindakan|pasang|px|pemeriksaan|ekstraksi|hecting|kateter|ngt|sirkum|ekg|bidai|edukasi|kie|langkah|baca|interpretasi)\\b/gi, ' ')
        .replace(/\\be\\.?c\\.?\\b.*$/i, ' ')
        .replace(/[+\\/,-]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim()

    const out = hitungKasus().filter((k) => k.jumlah >= 2).map((k) => {
      const nama = bersih(k.label)
      // Dicoba dari yang paling panjang ke paling pendek: nama utuh, lalu
      // dipotong dari belakang, lalu kata terpanjangnya sendiri.
      const kata = nama.split(' ').filter(Boolean)
      const percobaan = []
      for (let n = kata.length; n >= 1; n--) percobaan.push(kata.slice(0, n).join(' '))
      const terpanjang = [...kata].sort((a, b) => b.length - a.length)[0]
      if (terpanjang) percobaan.push(terpanjang)
      let hasil = 0, dipakai = ''
      for (const q of percobaan) {
        // Batas 2 huruf, bukan 4. Batas sebelumnya membuat justru yang paling
        // sering diketik tidak pernah diuji sama sekali — BV, AF, UAP, KAD,
        // SVT, OMA, ANC, KPD — dan skrip melaporkannya 'tidak ketemu' padahal
        // ia tidak pernah mencarinya.
        if (q.length < 2) continue
        const n = cari(q)
        if (n > 0) { hasil = n; dipakai = q; break }
      }
      return { label: k.label, sistem: k.sistem, jumlah: k.jumlah, hasil, dipakai }
    })
    console.log(JSON.stringify(out))
  `], { maxBuffer: 64 * 1024 * 1024 }).toString().trim().split('\n').pop(),
)

const kosong = kasus.filter((k) => k.hasil === 0)
console.log(`Kasus OSCE berulang (>=2x): ${kasus.length}`)
console.log(`  ketemu saat dicari       : ${kasus.length - kosong.length}`)
console.log(`  TIDAK ketemu             : ${kosong.length}`)
const batas = Number(process.argv[2] || 40)
console.log(`\n── ${Math.min(batas, kosong.length)} teratas yang TIDAK ketemu saat dicari ──`)
for (const k of kosong.slice(0, batas)) {
  console.log('  ' + String(k.jumlah).padStart(2) + 'x  ' + k.label.slice(0, 48).padEnd(50) + k.sistem)
}
