// Obat yang disebut di dalam tatalaksana TANPA dosis DI DEKATNYA.
//
// MENGAPA SKRIP INI ADA, padahal dosisKurang.mjs sudah melaporkan nol.
// Skrip itu menyatakan sebuah entri sudah berdosis bila terdapat SATU ANGKA di
// mana pun dalam teksnya:
//
//     if (/\d/.test(t)) return false
//
// Dengan aturan itu, "Amoksisilin 500 mg 3x sehari; tambahkan parasetamol dan
// ambroksol" terhitung LENGKAP — padahal dua dari tiga obatnya tanpa dosis.
// Angka nol yang dilaporkannya karena itu tidak berarti pekerjaannya selesai;
// ia hanya berarti hampir setiap entri memuat sedikitnya satu angka. Ini bentuk
// kegagalan yang sama dengan yang berkali-kali terjadi di sini: alat ukur yang
// melaporkan pekerjaan sebagai selesai.
//
// CARA MENILAINYA. Nama obat diambil dari mekanismeObat.ts — satu-satunya
// daftar nama obat yang sudah diperiksa tangan di aplikasi ini. Untuk tiap nama
// yang muncul di dalam teks tatalaksana, diperiksa apakah ada DOSIS dalam
// jendela 60 huruf sesudahnya. Jendela dipakai, bukan seluruh kalimat, sebab
// dosis obat lain di ujung kalimat bukan dosis obat ini.
//
// Dijalankan: node scripts/dosisPerObat.mjs [jumlah]
import { readFileSync } from 'node:fs'

const terapi = readFileSync('src/lib/skdiTherapyReference.ts', 'utf8')
const mek = readFileSync('src/lib/mekanismeObat.ts', 'utf8')

// Nama baku + alias, dari kamus yang sudah diperiksa tangan.
const nama = new Set()
for (const m of mek.matchAll(/^\s*nama: '((?:[^'\\]|\\.)*)'/gm)) nama.add(m[1].replace(/\\'/g, "'"))
for (const m of mek.matchAll(/^\s*alias: \[([^\]]*)\]/gm)) {
  for (const a of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) nama.add(a[1].replace(/\\'/g, "'"))
}
// Nama yang terlalu umum atau terlalu pendek menimbulkan cocok palsu.
/*
 * BUKAN OBAT YANG PERLU DOSIS. 'Isolasi 7 hari', 'sampo bayi encer', 'penawar
 * pilihan', 'Ca glukonas sebagai antidot' — semuanya tindakan atau kata
 * penunjuk, bukan obat yang diresepkan dengan miligram. Menandainya berarti
 * mengarang pekerjaan yang tidak ada.
 */
const ABAIKAN = new Set(['isolasi', 'sampo', 'penawar', 'antidot', 'dekongestan', 'nsaid', 'oains',
  'benzodiazepin', 'fluorokuinolon', 'sulfonilurea', 'antihistamin', 'statin', 'nitrat',
  'penyekat beta', 'ace-inhibitor', 'adrenalin', 'kriopresipitat', 'antasida',
  'oksigen', 'besi', 'zinc', 'zink', 'ics', 'oralit', 'tiamin', 'air mata buatan',
  'antiseptik', 'pencahar', 'kortikosteroid', 'kortikosteroid topikal', 'kortikosteroid inhalasi',
  'antibiotik topikal', 'cairan kristaloid', 'karbo adsorben', 'vasopresor', 'antiretroviral',
  'penawar keracunan', 'obat diabetes oral lain', 'psikostimulan dan antidepresan lain',
  'bismut dan adsorben', 'kalsium dan vitamin d', 'sikloplegik', 'imunoglobulin intravena'])
const daftarObat = [...nama].map((n) => n.toLowerCase()).filter((n) => n.length >= 5 && !ABAIKAN.has(n))

const entri = []
const re = /^\s*\{\s*system:\s*'([^']*)',\s*diagnosis:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?therapy:\s*'((?:[^'\\]|\\.)*)'/gm
let m
while ((m = re.exec(terapi))) {
  entri.push({ sistem: m[1], diagnosis: m[2].replace(/\\'/g, "'"), terapi: m[3].replace(/\\'/g, "'") })
}

/*
 * Bentuk dosis yang diterima.
 *
 * DAFTAR SATUANNYA SEMPAT TERLALU PENDEK, dan itu melahirkan temuan palsu yang
 * hampir saya laporkan sebagai pekerjaan: 'Ampisilin 1gr/6 jam IV' dan
 * 'Penicillin G 1.5 jt unit' keduanya jelas berdosis, tetapi ditandai kurang
 * karena 'gr' dan 'jt' tidak ada di daftar. Satuan yang benar-benar dipakai
 * orang di resep — bukan hanya satuan baku — harus ikut dikenali, sebab yang
 * diukur adalah teks yang ditulis manusia.
 */
// Satuan berhuruf perlu batas kata supaya 'g' tidak cocok di dalam 'gagal';
// satuan bertanda seperti '%' JUSTRU RUSAK oleh \b, sebab sesudahnya biasanya
// spasi. Memakai satu pola untuk keduanya menandai 'Natrium diklofenak gel 1%'
// sebagai tanpa dosis — temuan palsu yang hampir saya laporkan.
const SATUAN = 'mg|g|gr|gram|mcg|µg|ug|ml|cc|l|iu|ui|unit|u|mmol|meq|tetes|gtt|puff|semprot|sachet|kaps(ul)?|tab(let)?|amp(ul)?|vial|kali|sendok( takar| makan| teh)?|cth|cp|kantong|bungkus|mci|joule|j'
const RE_DOSIS = new RegExp(
  [
    // 500 mg | 1gr | 0,5 ml | 1.5 jt unit | 2 juta unit
    `\\d+([.,]\\d+)?\\s*(jt|juta|ribu)?\\s*(${SATUAN})\\b`,
    // persen: tanpa \b, sebab sesudah '%' hampir selalu spasi
    `\\d+([.,]\\d+)?\\s*%`,
    // 4x500 | 3 x 1 | 2×1
    `\\d\\s*[x×]\\s*\\d`,
    /*
     * 2-3x/hari | 4x/hari | 1x sehari — bentuk aturan pakai yang PALING LAZIM
     * dalam bahasa Indonesia, dan semula tidak dikenali sama sekali: pola
     * angka-garis miring menuntut angka tepat sebelum '/', sedangkan di sini
     * ada 'x' di antaranya. Akibatnya 'salep Basitrasin dioleskan tipis
     * 2-3x/hari' ditandai tanpa dosis padahal aturan pakainya justru lengkap.
     */
    `\\d\\s*[x×]\\s*\\/?\\s*(hari|minggu|bulan|jam|sehari|seminggu|malam|pagi)`,
    // 1 dd | 3 dd
    `\\b\\d\\s*dd\\b`,
    // 1gr/6 jam | 200 mg/minggu | 5 mg/kgBB/hari | 3x/hari
    `\\d\\s*\\/\\s*(kg|kgbb|hari|jam|menit|minggu|bulan|dosis|kali)`,
    // mg/kgBB tanpa angka di depan satuannya
    `\\d[^\\s]*\\s*(mg|mcg|g|gr|ml|unit|iu)\\s*\\/\\s*kg`,
  ].join('|'),
  'i',
)

/*
 * OBAT YANG DISEBUT UNTUK DIHENTIKAN, DIHINDARI, ATAU SEBAGAI PENYEBAB
 * TIDAK PERLU DOSIS — dan menandainya sebagai kurang berarti mengarang
 * pekerjaan yang tidak ada.
 *
 * 'HENTIKAN dekongestan semprot (oksimetazolin, xilometazolin) — inilah
 * pengobatannya' adalah kalimat yang BENAR justru karena tidak berdosis.
 * Begitu pula spironolakton pada hiperkalemia: ia dihentikan, bukan diberikan.
 * Tanpa saringan ini, angka yang dilaporkan jauh lebih besar daripada
 * pekerjaan yang sesungguhnya ada.
 */
/*
 * TABRAKAN NAMA. 'oksida nitrat hirup' pada aspirasi mekonium bukan obat
 * golongan nitrat; ia nitric oxide. Frasa yang mendahuluinya harus diperiksa,
 * bukan hanya namanya.
 */
const RE_TABRAKAN = /\b(oksida|oxide|nitric)\s*$/i

/*
 * DOSIS YANG BUKAN MILIGRAM. Warfarin ditakar dengan SASARAN INR, insulin
 * dengan titrasi terhadap gula darah, oksigen dengan sasaran saturasi. Menuntut
 * angka bersatuan pada obat-obat itu berarti menuntut sesuatu yang justru salah
 * bila dituliskan.
 */
const RE_DOSIS_LAIN = /\b(inr|titrasi|dititrasi|sasaran|target|sesuai (berat|kultur|respons|sasaran)|hingga|sampai)\b/i

const RE_BUKAN_RESEP = /\b(hentikan|dihentikan|stop|hindari|dihindari|jangan|tidak boleh|dilarang|kontraindikasi|kontra-indikasi|waspada|hati-hati|akibat|dicetuskan|disebabkan|menyebabkan|memperberat|alergi|riwayat|bukan|tanpa|kurangi|turunkan|tapering|sapih|resistensi|gagal dengan|jika alergi|bila alergi|tidak lagi|sudah ditinggalkan|tidak dianjurkan|aman dan tidak|pernah memakai|bila pernah)\b/i

function tanpaDosis(teks) {
  const rendah = teks.toLowerCase()
  const keluar = []
  for (const obat of daftarObat) {
    let i = rendah.indexOf(obat)
    while (i >= 0) {
      // batas kata, supaya 'besi' tidak cocok di dalam 'obesitas'
      const sblm = i === 0 ? ' ' : rendah[i - 1]
      const ssdh = i + obat.length >= rendah.length ? ' ' : rendah[i + obat.length]
      if (!/[a-z0-9]/.test(sblm) && !/[a-z0-9]/.test(ssdh)) {
        const jendela = teks.slice(i, i + obat.length + 60)
        // Konteks SEBELUM nama obat menentukan apakah ia memang diresepkan.
        const sebelumnya = teks.slice(Math.max(0, i - 70), i)
        /*
         * Kalimat yang MENOLAK sebuah obat sering menaruh nama obatnya di
         * DEPAN: 'LAMIVUDIN TIDAK LAGI menjadi pilihan pertama', 'INTERFERON
         * DITINGGALKAN', 'statin AMAN dan tidak dilarang di sini'. Memeriksa
         * konteks sebelumnya saja melewatkan seluruh bentuk itu, dan ketiganya
         * ditandai sebagai kurang dosis padahal justru sedang ditolak.
         */
        const sesudahnya = teks.slice(i + obat.length, i + obat.length + 45)
        if (
          !RE_DOSIS.test(jendela) &&
          !RE_DOSIS_LAIN.test(jendela) &&
          !RE_BUKAN_RESEP.test(sebelumnya) &&
          !RE_BUKAN_RESEP.test(sesudahnya) &&
          !RE_TABRAKAN.test(sebelumnya)
        ) keluar.push(obat)
        break
      }
      i = rendah.indexOf(obat, i + 1)
    }
  }
  return [...new Set(keluar)]
}

/*
 * SUDAH DIPERIKSA MATA DAN MEMANG BENAR TANPA DOSIS.
 *
 * MENGAPA DAFTAR INI ADA, dan mengapa ia bukan cara menyembunyikan pekerjaan.
 * Penjaga yang berhenti di angka dua belas selamanya akan diabaikan orang, dan
 * begitu diabaikan ia tidak lagi menangkap kekurangan BARU — yang justru satu-
 * satunya alasan ia dibuat. Penjaga hanya berguna bila nol berarti nol.
 *
 * Tiap baris di bawah ini dibuka teksnya, dibaca, dan disimpulkan bahwa
 * menambahkan dosis di situ akan membuat kalimatnya KELIRU. Alasannya ditulis
 * supaya dapat dibantah, bukan dipercaya begitu saja.
 */
const DIPERIKSA = new Map([
  // Obat disebut sebagai KETERANGAN atau AKIBAT, bukan yang diresepkan.
  ['Neuropati Diabetik|metformin', 'lazim pada PEMAKAI metformin jangka panjang'],
  ['Obesitas|metformin', 'sama: pemakai metformin jangka panjang'],
  ['Obesitas|vitamin b12', 'diperiksa kadarnya, dosisnya ada pada entri bariatrik'],
  ['Hipertiroid (radioterapi pre-op)|levotiroksin', 'akibat yang diharapkan: memerlukan levotiroksin seumur hidup'],
  ['Glaukoma (akut, awal)|asetazolamid', 'syarat KCl: bila memakai asetazolamid dosis besar'],
  ['Hiperemesis gravidarum|dekstrosa', 'urutan: tiamin 100 mg SEBELUM dekstrosa'],
  ['Gastritis (H. pylori)|bismut', 'penunjuk paduan; dosisnya ada pada entri paduan bismut'],

  // Obat disebut untuk DITOLAK — menambahkan dosis justru menyesatkan.
  ['Hepatitis (hepatoprotektor)|parasetamol', 'termasuk yang HARUS DIHENTIKAN karena membebani hati'],
  ['Cluster Headache — abortif|ergotamin', 'disebut sudah jarang dipakai'],
  ['Gangguan Tidur (middle/maintenance insomnia)|fenobarbital', 'disebut TIDAK dipakai untuk insomnia'],

  // Urutan tindakan, bukan peresepan.
  ['TB — Drug-Induced Hepatitis, ikterus|rifampisin', 'urutan rechallenge, bukan dosis'],
  ['TB — Drug-Induced Hepatitis, ikterus|isoniazid', 'urutan rechallenge'],
  ['TB — Drug-Induced Hepatitis, ikterus|pirazinamid', 'urutan rechallenge'],
  ['Kejang Demam|diazepam', 'entri edukasi: mengajari keluarga memberi diazepam rektal di rumah'],
  ['Kejang Demam|diazepam rektal', 'sama'],

  // Dosisnya ada, hanya di luar jendela 60 huruf.
  ['ACT (kombinasi)|dihidroartemisinin', 'tabel berat badan menyusul di kalimat yang sama'],
  ['ACT (kombinasi)|piperakuin', 'sama'],
])

const kurang = []
let totalObat = 0
let totalTanpa = 0
for (const e of entri) {
  const t = tanpaDosis(e.terapi).filter((o) => !DIPERIKSA.has(`${e.diagnosis}|${o}`))
  const semua = daftarObat.filter((o) => new RegExp(`(^|[^a-z0-9])${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(e.terapi))
  totalObat += semua.length
  totalTanpa += t.length
  if (t.length) kurang.push({ ...e, obat: t })
}

console.log(`Entri tatalaksana                : ${entri.length}`)
console.log(`Penyebutan obat yang dikenali    : ${totalObat}`)
console.log(`  di antaranya TANPA dosis dekat : ${totalTanpa}`)
console.log(`Entri yang memuat sedikitnya satu: ${kurang.length}`)
console.log(`Sudah diperiksa & sengaja tanpa dosis: ${DIPERIKSA.size}`)
console.log('')
console.log('ANGKA DI ATAS ADALAH BATAS ATAS YANG MASIH HARUS DIPERIKSA TANGAN,')
console.log('bukan daftar pekerjaan yang siap dikerjakan. Empat kelas temuan palsu')
console.log('sudah disaring (satuan tak lazim, persen, obat yang dihentikan,')
console.log('tabrakan nama, dosis non-miligram) dan sisanya masih mungkin ada.')
console.log('Yang dijamin oleh skrip ini hanya satu hal: daftarnya DAPAT DIPERIKSA,')
console.log('sedangkan angka 0 dari dosisKurang.mjs tidak dapat diperiksa sama sekali.')

const perSistem = new Map()
for (const k of kurang) perSistem.set(k.sistem, (perSistem.get(k.sistem) ?? 0) + 1)
console.log('\n── per sistem ──')
for (const [s, n] of [...perSistem].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${s}`)

const batas = Number(process.argv[2] ?? 25)
console.log(`\n── ${Math.min(batas, kurang.length)} teratas ──`)
for (const k of kurang.slice(0, batas)) {
  console.log(`  ${k.diagnosis.slice(0, 42).padEnd(44)} ${k.obat.join(', ').slice(0, 60)}`)
}
