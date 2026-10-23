// ─────────────────────────────────────────────────────────────────────────────
// Obat yang disebut di tatalaksana tetapi belum punya mekanisme.
//
// MENGAPA BERKAS INI ADA. Permintaannya "untuk semua obat yang ada", dan satu
// satunya cara mengetahui apakah sudah semua adalah MEMERIKSANYA, bukan
// merasa sudah. Kamus mekanisme akan selalu tertinggal setiap kali entri
// tatalaksana baru ditambahkan, dan tertinggalnya tidak terlihat dari mana pun
// kecuali dari daftar ini.
//
// CARA MENGENALI NAMA OBAT. Bukan dengan daftar kata terlarang yang panjang —
// percobaan itu menghasilkan 2.300 kandidat yang 95%-nya kata Indonesia biasa.
// Yang dipakai: sebuah kata dianggap NAMA OBAT bila berdiri tepat sebelum
// angka dosis (Amoksisilin 3x500 mg), atau berakhiran khas nama obat
// (-misin, -silin, -olol, -pril, -sartan, -azol, -tidin, -parin, -statin,
// -kain, -mid, -zepam, -piridin). Aturan bentuk seperti ini jauh lebih sedikit
// melesetnya daripada menyaring kata umum satu per satu.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'child_process'

const hasil = JSON.parse(
  execFileSync('npx', ['tsx', '-e', `
    import { SKDI_ENTRIES } from './src/lib/skdiTherapyReference'
    import { MEKANISME_OBAT, obatDalam } from './src/lib/mekanismeObat'

    const WAKTU = /^(hari|jam|menit|minggu|bulan|tahun|tiap|selama|dalam|sampai|maks|maksimal|minimal|usia|lanjut|trimester|lini|atau|dibagi|kali|oral|setelah|mulai|step|level|dosis|dose|loading|bolus|dengan|sendiri|reguler|nebul|rektal|diulang|continuous|krim|salep|tetes|gula|elemental|derajat|grade|stadium|fase|kelas|kategori|golongan|sesudah|sebelum|hingga|kurang|lebih|total|berat|badan|dewasa|anak|bayi|neonatus|ibu|hamil|menyusui)$/i
    const AKHIRAN = /(misin|misin|silin|sillin|olol|pril|sartan|azol|azole|tidin|parin|statin|kaina?|zepam|piridin|dipin|vastatin|floksasin|floxacin|siklin|cycline|mycin|prazol|setamol|kodon|fenak|profen|kortison|metason|nisolon|tiazid|semid|osin|triptan|virin|vir|prost|glitazon|formin|glinid|gliptin)$/i

    const semua = new Map()
    for (const e of SKDI_ENTRIES) {
      const teks = e.therapy
      /*
       * (a) kata tepat sebelum angka dosis, TETAPI harus berhuruf besar di
       * awal dan bukan kata waktu maupun satuan. Tanpa dua syarat itu, aturan
       * ini menangkap "hari 3", "tiap 8 jam", dan "selama 5 hari" — 46 kali
       * untuk kata "hari" saja, dan daftar kerjanya menjadi tidak terbaca.
       */
      for (const m of teks.matchAll(/([A-Z][a-zA-Z-]{3,})\\s+(?:\\d|\\d+x)/g)) {
        if (WAKTU.test(m[1])) continue
        semua.set(m[1], (semua.get(m[1]) || 0) + 1)
      }
      // (b) kata berakhiran khas nama obat
      for (const w of teks.match(/[A-Za-z][a-zA-Z-]{4,}/g) || []) if (AKHIRAN.test(w)) semua.set(w, (semua.get(w) || 0) + 1)
    }

    const belum = []
    for (const [kata, n] of semua) if (obatDalam(kata).length === 0) belum.push({ kata, n })
    belum.sort((a, b) => b.n - a.n)

    let entriAda = 0, entriObat = 0
    const nonObat = /rujuk|bedah|operasi|insisi|drainase|eksisi|fisioterapi|edukasi|observasi|konseling|diet|latihan|imunisasi|skrining|kateter|bidai|resusitasi|hemodialisis|reposisi|ekstraksi|kompres|irigasi|ortosis|pembedahan|kolposkopi|biopsi|krioterapi|jahit|self-limiting/i
    for (const e of SKDI_ENTRIES) {
      const punya = obatDalam(e.therapy).length > 0
      if (!nonObat.test(e.therapy)) { entriObat++; if (punya) entriAda++ }
    }
    console.log(JSON.stringify({ belum, kamus: MEKANISME_OBAT.length, entriAda, entriObat }))
  `], { maxBuffer: 64 * 1024 * 1024 }).toString().trim().split('\n').pop(),
)

console.log(`Kamus mekanisme          : ${hasil.kamus} obat`)
console.log(`Entri terapi berobat     : ${hasil.entriAda} / ${hasil.entriObat} = ${Math.round((hasil.entriAda / hasil.entriObat) * 100)}% punya mekanisme`)
console.log(`Nama obat belum dikenali : ${hasil.belum.length}`)
if (hasil.belum.length) {
  console.log('\n── belum punya mekanisme ──')
  for (const b of hasil.belum.slice(0, Number(process.argv[2] || 40))) {
    console.log('  ' + String(b.n).padStart(2) + 'x  ' + b.kata)
  }
}
