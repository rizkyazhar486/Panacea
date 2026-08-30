import fs from 'fs'
import path from 'path'

/*
 * Pendeteksi sisa bahasa Indonesia — DIBALIK dari pemindai sebelumnya.
 *
 * Pemindai lama mencari kata Indonesia dari sebuah DAFTAR. Daftar semacam itu
 * selalu berlubang: "Pace acuan:" lolos berkali-kali semata karena "acuan"
 * tidak pernah dimasukkan ke daftarnya, dan cacat itu baru ketahuan dari
 * tangkapan layar. Yang tidak ada di daftar tidak akan pernah dilaporkan.
 *
 * Di sini kebalikannya: tiap kata pada teks yang tampak di layar diuji
 * terhadap kosakata INGGRIS. Kata yang bukan Inggris — apa pun kata itu —
 * ikut terhitung. Bahasa Indonesia tidak perlu dikenali lebih dulu.
 */
/*
 * Kamus Inggris (274 ribu kata) TIDAK disimpan di repositori — 2,7 MB, dan
 * bukan milik proyek ini. Ambil sekali sebelum menjalankan:
 *
 *   cd /tmp && npm pack word-list && tar xzf word-list-*.tgz
 *   KAMUS=/tmp/package/words.txt node alat/sisa-bahasa.mjs
 */
const KAMUS = process.env.KAMUS || '/tmp/package/words.txt'
if (!fs.existsSync(KAMUS)) {
  console.error(`Kamus tidak ditemukan di ${KAMUS}. Lihat keterangan di kepala berkas ini.`)
  process.exit(1)
}
const EN = new Set(fs.readFileSync(KAMUS, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean))

/*
 * Yang dikecualikan, beserta alasannya — semuanya BUKAN antarmuka:
 *   korpus SKDI/OSCE/UKMPPD dan rujukan terapi (memang berbahasa Indonesia),
 *   katalog nama obat/herbal/makanan dan sinonim penyakit (nama diri, INN),
 *   berkas terjemahan i18n dan locales (justru harus berbahasa Indonesia),
 *   sitasi terbitan Indonesia, dan leksikon sentimen.
 */
const KECUALI = /(skdi|osce|ukmppd|examBank|quizBank|mnemonik|manuverPF|\/icd|resepDokter|golonganObat|mekanismeObat|clinicalSkills|minimumDose|kisahNabi|kitab|quran|hadith|referensiSumber|katalogFitur|ownerAnalytics|obatKatalog|herbal|foods|sinonimPenyakit|locales|i18n|interaksi)/i
function bersih(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
          .replace(/^[ \t]*\/\/.*$/gm, (m) => ' '.repeat(m.length))
}
function teksTampak(baris, jsx) {
  const out = []
  for (const m of baris.matchAll(/(?:title|subtitle|label|placeholder|judul|ringkas|subjudul|aria-label|alt)=["'{]?["']([^"'\n]{4,})["']/g)) out.push(m[1])
  for (const m of baris.matchAll(/>([^<>{}\n]{4,})</g)) out.push(m[1])
  // Simpul teks JSX yang membentang beberapa baris tidak punya '>' di barisnya
  // sendiri. Tanpa pola ini, "Pace acuan:" lolos berkali-kali.
  // HANYA untuk .tsx. Pada .ts, pola ini menangkap baris objek literal seperti
  // `nama: 'Upper trapezius stretch',` dan melaporkan nama propertinya sebagai
  // teks — stretching.ts terbaca 86 temuan yang hampir semuanya nama properti.
  if (jsx) {
    const awal = baris.match(/^\s{6,}([A-Za-z][^<>{}\n]{4,})(?:<|$)/)
    if (awal && !/^\s*\w+:/.test(awal[1])) out.push(awal[1])
  }
  // Petik dipasangkan dengan menyusuri baris, BUKAN dengan regex bergantian.
  // Regex /'([^']+)'/ pada `nama: 'Jalan', met: 2.5, int: 'ringan'` ikut
  // menangkap ", met: 2.5, int: " — potongan KODE di antara dua string — lalu
  // melaporkannya sebagai teks Indonesia. Itu membuat olahraga.ts terbaca 283
  // temuan yang hampir seluruhnya bukan teks.
  for (const q of ["'", '"', '`']) {
    let i = 0
    while (i < baris.length) {
      const a = baris.indexOf(q, i)
      if (a < 0) break
      const b = baris.indexOf(q, a + 1)
      if (b < 0) break
      const isi = baris.slice(a + 1, b)
      if (isi.length >= 4) out.push(isi)
      i = b + 1
    }
  }
  return out
}
const hasil = []
function telusur(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) telusur(p)
    else if (/\.(ts|tsx)$/.test(f.name) && !/\.d\.ts$/.test(f.name)) periksa(p)
  }
}
function periksa(p) {
  if (KECUALI.test(p)) return
  const src = bersih(fs.readFileSync(p, 'utf8'))
  src.split('\n').forEach((b, i) => {
    for (const t of teksTampak(b, /\.tsx$/.test(p))) {
      if (/^[\w.\/#-]+$/.test(t)) continue
      if (/\$\{/.test(t) && t.replace(/\$\{[^}]*\}/g, '').trim().length < 8) continue
      // Buang daftar kelas dan jalur.
      const tok = t.trim().split(/[\s/·—–,.:;!?()"'’“”|]+/).filter((w) => /^[A-Za-z]{3,}$/.test(w))
      // Label SATU KATA ("Kemajuan", "Tenggat") dulu dilewati karena syaratnya
      // dua kata. Itu melewatkan justru bentuk label yang paling lazim di
      // antarmuka; keduanya baru ketahuan dari tangkapan layar.
      if (tok.length < 1) continue
      const util = t.trim().split(/\s+/).filter((k) => /^(dark:|hover:|focus:|active:|sm:|md:|lg:|group-)/.test(k) || /^(text|bg|border|rounded|flex|grid|min|max|w|h|p|m|px|py|mt|mb|ml|mr|gap|font|leading|tracking|shadow|ring|space|items|justify|overflow|absolute|relative|inline|shrink|transition|opacity|z|whitespace|truncate|uppercase|tabular|place|cursor|select|pointer|backdrop|animate|duration|ease|scale|translate|t-)(-|$)/.test(k)).length
      if (util > 0) continue
      // Potongan KODE bukan teks. Penandanya khas dan tidak muncul di kalimat.
      if (/(^|\s)(const|let|var|return|function|await|typeof)\s|=>|\)\s*\.|\.\w+\(|===|!==|\?\?/.test(t)) continue
      const asing = tok.filter((w) => !EN.has(w.toLowerCase()))
        // Akronim dan singkatan (BMI, TDEE, CSV) memang bukan kata kamus.
        .filter((w) => !/^[A-Z0-9]+$/.test(w))
        // Nama diri diawali huruf besar di tengah kalimat; nama hidangan dan
        // nama orang lolos di sini, dan memang bukan kalimat Indonesia.
        .filter((w) => !/^[A-Z][a-z]+$/.test(w))
      if (asing.length >= 2 || (asing.length === 1 && tok.length <= 4)) {
        hasil.push({ p, i: i + 1, t: t.trim().slice(0, 88), asing: [...new Set(asing)].slice(0, 5) })
      }
    }
  })
}
telusur('src')
const per = {}
for (const x of hasil) (per[x.p] ??= []).push(x)
const urut = Object.entries(per).sort((a, b) => b[1].length - a[1].length)
console.log('TOTAL', hasil.length, 'di', urut.length, 'berkas')
if (process.env.FILE) { for (const x of per[process.env.FILE] || []) console.log(`${x.i}\t${x.t}\t[${x.asing}]`) }
else for (const [f, xs] of urut.slice(0, Number(process.env.N || 25))) console.log(String(xs.length).padStart(4), f)
