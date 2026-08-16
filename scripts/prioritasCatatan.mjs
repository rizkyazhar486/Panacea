// Daftar kerja yang diurutkan menurut SEBERAPA SERING KELUAR DI UJIAN, bukan
// menurut urutan abjad maupun urutan daftar SKDI.
//
// MENGAPA INI ADA. Ada 556 penyakit yang catatannya belum lengkap. Mengerjakan
// menurut urutan daftar berarti kasus yang keluar empat belas kali dalam
// sepuluh tahun dikerjakan sesudah kasus yang belum pernah keluar sekali pun,
// hanya karena huruf awalnya lebih belakang. Urutan pengerjaan adalah keputusan
// yang paling menentukan hasil di sini, dan keputusan itu pantas dihitung.
//
// Dijalankan: node scripts/prioritasCatatan.mjs [jumlah]
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']

function blokDari(teks, awalan = '') {
  const out = {}
  const idx = []
  const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: m[1], start: m.index })
  idx.forEach((x, i) => { out[awalan + x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

const notes = readFileSync('src/lib/skdiDiseaseNotes.ts', 'utf8')
const osce = readFileSync('src/lib/osceStationNotes.ts', 'utf8')
const aliasSrc = readFileSync('src/lib/skdiDiseaseNoteAliases.ts', 'utf8')
const alias = Object.fromEntries([...aliasSrc.matchAll(/^  '([^']+)':\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]))
const blok = { ...blokDari(notes), ...blokDari(osce, 'OSCE::') }

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const petaNorm = new Map()
for (const k of Object.keys(blok)) {
  const n = norm(k.replace(/^OSCE::/, ''))
  if (!petaNorm.has(n)) petaNorm.set(n, k)
}
/*
 * SINGKATAN DI DALAM TANDA KURUNG IKUT DIDAFTARKAN.
 *
 * Ini bukan aturan pencocokan longgar yang keenam; ini pembacaan atas apa yang
 * MEMANG SUDAH TERTULIS di kunci catatannya. Nama seperti
 *
 *   'Ventricular Ectopic (VES) - baca EKG'
 *   'Hyperosmolar Hyperglycemic State (HHS/HONK) - resusitasi cairan'
 *   'Ketoasidosis Diabetik (KAD) - resusitasi cairan'
 *
 * sudah memuat singkatan yang dipakai rekap ujian, tepat di dalam kurungnya —
 * tetapi pencocokan kata melewatkannya karena "ves" bukan bagian dari
 * "ventricular ectopic baca ekg" sebagai kata mandiri di awal. Akibatnya VES,
 * HONK, dan KAD dilaporkan "(tidak ketemu) 0/8" padahal catatannya ada dan
 * sebagian sudah lengkap. Itu kekeliruan yang MAHAL: nol dari delapan menuntun
 * orang menulis ulang catatan yang sudah jadi.
 *
 * Dipisah juga pada garis miring, sebab satu kurung kerap memuat dua singkatan
 * yang keduanya dipakai orang ('HHS/HONK').
 *
 * Aman karena mekanis: yang didaftarkan hanya rangkaian huruf yang penulis
 * catatannya sendiri tuliskan sebagai singkatan bagi nama itu. Tidak ada
 * penyamaan makna yang ditebak dari luar.
 *
 * DISIMPAN TERPISAH DARI petaNorm, dan itu bukan kerapian melainkan perbaikan
 * atas kekeliruan yang terjadi pada percobaan pertama. Menyisipkannya ke dalam
 * petaNorm menggeser URUTAN penelusuran, dan penelusuran longgar di cariSatu
 * mengembalikan padanan PERTAMA yang ditemukannya — sehingga 'Tension type
 * headache' yang tadinya menemukan catatan 8/8 berpindah ke stasiun 3/8, dan
 * jumlah yang lengkap justru turun dari 109 menjadi 108. Peta terpisah ini
 * hanya dibaca sebagai pencocokan PERSIS, sesudah petaNorm gagal, sehingga
 * tidak dapat mengubah hasil satu pun nama yang sudah ketemu sebelumnya.
 */
const petaSingkatan = new Map()
for (const k of Object.keys(blok)) {
  for (const m of k.matchAll(/\(([^)]+)\)/g)) {
    for (const potong of m[1].split('/')) {
      /*
       * HARUS BENAR-BENAR HURUF BESAR SEMUA. Saringan pertama hanya membatasi
       * panjangnya (2-8 huruf, satu kata), dan itu meloloskan kata biasa yang
       * kebetulan berada di dalam kurung: 'Pneumotoraks (Tension/Terbuka)'
       * mendaftarkan "tension" sebagai singkatan, sehingga 'Tension type
       * headache' — kasus yang PALING SERING keluar, sepuluh kali — berpindah
       * dari catatan 8/8 ke stasiun pneumotoraks 3/8, dan jumlah yang lengkap
       * turun dari 109 ke 108. Singkatan yang sesungguhnya ditulis kapital oleh
       * penulisnya sendiri: VES, HHS, HONK, KAD, TTH, APN.
       */
      if (!/^[A-Z0-9][A-Z0-9.\-]{1,7}$/.test(potong.trim())) continue
      const n = norm(potong)
      if (!n || n.includes(' ')) continue
      if (!petaNorm.has(n) && !petaSingkatan.has(n)) petaSingkatan.set(n, k)
    }
  }
}

for (const [k, v] of Object.entries(alias)) {
  const kunci = blok[v] ? v : blok['OSCE::' + v] ? 'OSCE::' + v : null
  if (kunci && !petaNorm.has(norm(k))) petaNorm.set(norm(k), kunci)
}

/*
 * 'rantai' DIHITUNG SETARA 'patofisiologi'.
 *
 * Keduanya menjawab pertanyaan yang sama — bagaimana penyakit ini terjadi —
 * hanya dalam dua bentuk: paragraf untuk yang ingin mengerti, rantai berpanah
 * untuk yang sedang menghafal untuk ujian lisan. Menghitung hanya paragrafnya
 * akan melaporkan catatan yang mekanismenya sudah ditulis sebagai rantai
 * sebagai '7/8', dan itu mengundang penulisan ulang atas pekerjaan yang sudah
 * selesai — kekeliruan yang sama yang sudah lima kali terjadi di skrip ini.
 */
const SETARA = { patofisiologi: ['patofisiologi', 'rantai'] }

const terisi = (kunci) => {
  const b = blok[kunci]
  if (!b) return 0
  return FIELD.filter((f) =>
    (SETARA[f] ?? [f]).some((nama) => new RegExp('^\\s{4}' + nama + ':', 'm').test(b)),
  ).length
}

/**
 * Pencocokan memakai aturan yang SAMA dengan cakupanDaftar.mjs, termasuk syarat
 * awalan berupa kata utuh untuk nama satu kata — aturan yang lahir dari tiga
 * kekeliruan berturut-turut di sana, dan tidak perlu diulangi di sini.
 */
function cariSatu(nama) {
  const n = norm(nama)
  if (!n) return null
  if (petaNorm.has(n)) return petaNorm.get(n)
  if (petaSingkatan.has(n)) return petaSingkatan.get(n)
  const kata = n.split(' ').filter((w) => w.length > 3)
  if (!kata.length) return null
  for (const [kn, kunci] of petaNorm) {
    if (!kata.every((w) => kn.includes(w))) continue
    if (kata.length === 1 && !(kn === kata[0] || kn.startsWith(kata[0] + ' '))) continue
    return kunci
  }
  return null
}

/**
 * Beberapa bentuk nama dicoba, dan yang PALING LENGKAP catatannya yang dipakai.
 *
 * Percobaan pertama hanya mencoba satu bentuk, dan itu melaporkan GNAPS sebagai
 * 3/8 padahal catatannya sudah 8/8. Sebabnya: nama bakunya menjadi
 * "glomerulonefritis akut pasca streptokokus", sedangkan catatan barunya
 * bernama "Glomerulonefritis akut" — kata "pasca" dan "streptokokus" tidak ada
 * di dalamnya, sehingga pencocokan kata gagal dan jatuh ke stasiun OSCE lama
 * yang memang baru 3/8. Daftar kerja yang melaporkan pekerjaan selesai sebagai
 * belum selesai akan membuat pekerjaan itu dikerjakan dua kali.
 */
/**
 * SINONIM YANG DIPERIKSA TANGAN, satu per satu, terhadap berkas catatannya.
 *
 * MENGAPA TABEL, BUKAN ATURAN LAIN LAGI. Sudah LIMA KALI berturut-turut alat
 * ini melaporkan pekerjaan yang sudah selesai sebagai belum, dan setiap kali
 * jawabannya adalah menambah satu aturan pencocokan baru: bentuk nama
 * berlapis, awalan kata utuh, singkatan, lalu ejaan sindroma/sindrom. Kelima
 * kalinya menunjukkan bahwa persoalannya bukan aturan yang kurang tepat,
 * melainkan bahwa NAMA DI REKAP UJIAN DAN NAMA DI DAFTAR SKDI MEMANG BERBEDA
 * KOSAKATANYA — "sistitis" berbanding "infeksi saluran kemih", "syok
 * anafilaktik" berbanding "reaksi anafilaktik". Tidak ada aturan umum yang
 * dapat menyeberangi jarak itu tanpa sekaligus menyatukan hal-hal yang memang
 * berbeda.
 *
 * Tabel ini kecil, dapat dibaca, dan setiap barisnya sudah dibuka berkasnya.
 * Bila keliru, kekeliruannya terlihat sebagai satu baris — bukan tersembunyi
 * di dalam sebuah regex.
 */
const SINONIM = {
  'sistitis': 'Infeksi saluran kemih',
  'sistitis akut': 'Infeksi saluran kemih',
  'syok anafilaktik': 'Reaksi anafilaktik',
  'anafilaksis': 'Reaksi anafilaktik',
  'kad': 'Ketoasidosis diabetikum nonketotik',
  'ketoasidosis diabetik': 'Ketoasidosis diabetikum nonketotik',
  'rheumatoid arthritis': 'Artritis reumatoid',
  'systemic lupus erythematosus': 'Lupus eritematosus sistemik',
  'graves disease': 'Tirotoksikosis',
  'penyakit graves': 'Tirotoksikosis',

  /*
   * Nama-nama di bawah ini ditemukan pada pemeriksaan LANGSUNG, bukan
   * diperkirakan. Daftar kerja melaporkan seluruhnya "(tidak ketemu) 0/8"
   * padahal catatannya ada — hanya bernama lain — dan enam kasus akan
   * dikerjakan ulang dari nol seandainya laporan itu dipercaya begitu saja.
   *
   * Ini kelima kalinya alat pencari nama melaporkan pekerjaan yang sudah
   * selesai sebagai belum. Setiap kali, penyebabnya bukan aturan pencocokan
   * yang kurang pintar melainkan kenyataan bahwa nama stasiun ujian dan nama
   * catatan memang berbeda — dan perbedaan itu hanya dapat diselesaikan dengan
   * memeriksa satu per satu, bukan dengan regex yang lebih rumit.
   */
  'anc': 'ANC Normal (Antenatal Care)',
  'antenatal care': 'ANC Normal (Antenatal Care)',
  'ab imminens': 'Abortus Imminens / Inkomplit',
  'abortus imminens': 'Abortus Imminens / Inkomplit',
  'gerd': 'Gastritis / Dispepsia / GERD',
  'dispepsia': 'Gastritis / Dispepsia / GERD',
  'dm tipe 2': 'Diabetes melitus tipe 2',
  'diabetes melitus tipe 2': 'Diabetes melitus tipe 2',
  'tb paru': 'Tuberkulosis Paru',
  'tuberkulosis paru': 'Tuberkulosis Paru',
  'pap smear': 'Suspek Ca Serviks — IVA test / Pap smear',
  'iva': 'Suspek Ca Serviks — IVA test / Pap smear',
  'vesikolithiasis': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'vesikolitiasis': 'Vesikolitiasis / Ureterolitiasis / Nefrolitiasis',
  'uretritis gonore': 'Servisitis / Uretritis Gonore',
  'uretritis go': 'Servisitis / Uretritis Gonore',
  /*
   * Diperiksa langsung pada berkasnya, sama seperti baris-baris di atas. Lima
   * dari enam yang dilaporkan "(tidak ketemu) 0/8" ternyata SUDAH ADA, hanya
   * bernama lain: singkatan Inggris berbanding nama Indonesia (ACS, AF, FDE),
   * dan ejaan candid- berbanding kandid-. Hanya CLM dan FDE yang benar-benar
   * belum ada, dan keduanya lalu ditulis.
   */
  /*
   * PENCOCOKAN YANG KELIRU LEBIH BERBAHAYA DARIPADA YANG GAGAL. 'Transient
   * Ischemic Attack' tercocokkan ke 'Transient tics disorder' — dua penyakit
   * yang tidak berhubungan sama sekali — hanya karena berbagi kata "transient"
   * dan "t...". Laporan "(tidak ketemu)" masih mengundang pemeriksaan; laporan
   * yang menunjuk catatan yang SALAH membuat pembacanya mengira TIA sudah
   * tertulis padahal yang ada catatan gangguan tik.
   */
  'omphalitis': 'Omfalitis',
  'omfalitis': 'Omfalitis',
  'paronikia ekstraksi kuku': 'Paronikia (ekstraksi kuku)',
  'paronikia': 'Paronikia (ekstraksi kuku)',
  'v fib rjp': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'v fib': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'vf': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'sirkumsisi': 'Sirkumsisi',
  'transient ischemic attack': 'Stroke Hemoragik / TIA',
  'tia': 'Stroke Hemoragik / TIA',

  'non alcoholic fatty liver disease': 'Perlemakan hepar',
  'nafld': 'Perlemakan hepar',
  'osteomyelitis': 'Osteomielitis',
  'pyelonefritis': 'Pielonefritis Akut',
  'pielonefritis': 'Pielonefritis Akut',
  'stemi anteroseptal': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'stemi inferior': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'varicella zoster': 'Varisela tanpa komplikasi',
  'varisela': 'Varisela tanpa komplikasi',
  'weils disease lepto': 'Leptospirosis / Weil Disease',
  'weil disease': 'Leptospirosis / Weil Disease',
  'pvc': 'Ventricular Ectopic (VES) — baca EKG',
  'ureteritis go': 'Servisitis / Uretritis Gonore',
  'pasang implan': 'Konseling & Pemasangan/Pelepasan KB (implan/IUD/suntik)',
  'pentabio opv kms': 'Imunisasi & Interpretasi KMS/Tumbang (anak)',

  'lbp': 'HNP / Low Back Pain',
  'lbp e c susp hnp': 'HNP / Low Back Pain',
  'low back pain': 'HNP / Low Back Pain',
  'mh tipe mb': 'Kusta (Morbus Hansen)',
  'mh tipe pb': 'Kusta (Morbus Hansen)',
  'morbus hansen': 'Kusta (Morbus Hansen)',
  'lepra': 'Kusta (Morbus Hansen)',
  'acs': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'sindrom koroner akut': 'STEMI / NSTEMI / UAP — baca & interpretasi EKG',
  'af': 'Atrial Fibrilasi — baca EKG',
  'candidiasis oral': 'Kandidiasis mulut',
  'candidiasis oral rme': 'Kandidiasis mulut',
  'candidosis vulvovaginal': 'Kandidiasis Vulvovaginalis',
  'candidiasis vulvovaginal': 'Kandidiasis Vulvovaginalis',
  'classic migrain': 'Migrain (dengan/tanpa aura)',
  'common migrain': 'Migrain (dengan/tanpa aura)',
  'clm': 'Cutaneous Larva Migrans (Creeping Eruption)',
  'creeping eruption': 'Cutaneous Larva Migrans (Creeping Eruption)',
  'fde': 'Fixed Drug Eruption (FDE)',
  'fixed drug eruption': 'Fixed Drug Eruption (FDE)',

  'honk': 'Hiperglikemia hiperosmolar nonketotik',
  'hhs': 'Hiperglikemia hiperosmolar nonketotik',
}

function cari(kunciBaku, label) {
  /*
   * Sinonim dicoba pada KEDUA ruang nama. Catatan penyakit memakai kunci
   * telanjang, catatan stasiun OSCE memakai awalan 'OSCE::'. Percobaan pertama
   * hanya memeriksa kunci telanjang, sehingga seluruh sinonim yang menunjuk ke
   * catatan stasiun — ANC, GERD, TB paru, pap smear, vesikolitiasis, uretritis
   * gonore — tetap dilaporkan "tidak ketemu" meski sudah dituliskan. Tabel
   * sinonim yang benar tetapi tidak pernah dipakai sama saja dengan tidak ada.
   */
  const langsung = SINONIM[norm(kunciBaku)] ?? SINONIM[norm(label)]
  if (langsung) {
    if (blok[langsung]) return langsung
    if (blok['OSCE::' + langsung]) return 'OSCE::' + langsung
  }

  const kata = norm(kunciBaku).split(' ')
  const calon = [
    label,
    kunciBaku,
    kata.slice(0, 3).join(' '),
    kata.slice(0, 2).join(' '),
    kata[0],
  ]
  let terbaik = null
  let terbaikIsi = -1
  for (const c of calon) {
    const k = cariSatu(c)
    if (!k) continue
    const isi = terisi(k)
    if (isi > terbaikIsi) { terbaik = k; terbaikIsi = isi }
    if (isi === 8) break
  }
  return terbaik
}

// Frekuensi OSCE diambil dari lapisan analisis yang sama dengan yang dipakai
// halaman /osce-ukmppd, supaya keduanya tidak pernah berselisih.
const kasus = JSON.parse(
  execFileSync('npx', ['tsx', '-e', `
    import { hitungKasus } from './src/lib/analisisOsce'
    console.log(JSON.stringify(hitungKasus().map((k) => ({ label: k.label, kunci: k.kunci, sistem: k.sistem, jumlah: k.jumlah, terakhir: k.periode[0] }))))
  `], { maxBuffer: 32 * 1024 * 1024 }).toString().trim().split('\n').pop(),
)

const batas = Number(process.argv[2] || 40)
const baris = []
for (const k of kasus) {
  // Kasus yang hanya sekali muncul dilewati: 79% daftar berada di sana, dan
  // memasukkannya membuat daftar kerja ini sama panjangnya dengan daftar SKDI.
  if (k.jumlah < 2) continue
  const kunci = cari(k.kunci, k.label)
  const n = kunci ? terisi(kunci) : 0
  baris.push({ ...k, n, kunci })
}

const belum = baris.filter((b) => b.n < 8)
console.log(`Kasus OSCE yang muncul >=2 kali: ${baris.length}`)
console.log(`  catatannya sudah lengkap 8/8 : ${baris.length - belum.length}`)
console.log(`  belum lengkap                : ${belum.length}\n`)
console.log(`── ${batas} teratas yang BELUM lengkap ──`)
console.log('  ke  isi  kasus                                        sistem')
for (const b of belum.slice(0, batas)) {
  console.log(
    '  ' + String(b.jumlah).padStart(2) + 'x  ' + String(b.n) + '/8  ' +
    b.label.slice(0, 40).padEnd(42) +
    // Kunci yang dipakai ikut dicetak. Tanpa ini, angka 3/8 tidak dapat
    // dibedakan antara "catatannya memang belum ditulis" dan "pencocokannya
    // yang meleset ke stasiun OSCE" — dan kelima kekeliruan sejauh ini
    // seluruhnya jenis kedua.
    (b.kunci ? String(b.kunci).slice(0, 46) : '(tidak ketemu)'),
  )
}
