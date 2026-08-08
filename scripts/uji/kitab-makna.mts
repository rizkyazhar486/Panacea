// Kitab suci — dua cacat yang tidak berbunyi, dan buktinya sudah tertutup.
//
//   1. Terjemahan yang dipasangkan menurut URUTAN LARIK, bukan nomor ayat.
//      Satu ayat hilang di edisi terjemahan menggeser seluruh terjemahan
//      sesudahnya, dan hasilnya terlihat sempurna bagi pembaca yang tidak
//      menguasai bahasa Arab.
//   2. Jawaban rusak yang DISIMPAN LEBIH DULU, baru diperiksa. Cache berumur
//      tujuh hari, jadi satu gangguan jaringan sesaat merusak surah itu selama
//      sepekan dan memuat ulang halaman tidak menolong.

// ── Panggung: localStorage dan fetch tiruan ─────────────────────────────────
const simpanan = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => simpanan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpanan.set(k, v) },
  removeItem: (k: string) => { simpanan.delete(k) },
}

const BASMALAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'

function surahArab(n: number, jumlah: number, kirim = jumlah) {
  return {
    data: {
      number: n, englishName: 'Al-Faatiha', name: 'الفاتحة',
      englishNameTranslation: 'The Opening', numberOfAyahs: jumlah, revelationType: 'Meccan',
      ayahs: Array.from({ length: kirim }, (_, i) => ({ numberInSurah: i + 1, text: BASMALAH })),
    },
  }
}

function surahTerjemahan(n: number, jumlah: number, lewati: number[] = []) {
  const ayahs = Array.from({ length: jumlah }, (_, i) => i + 1)
    .filter((no) => !lewati.includes(no))
    .map((no) => ({ numberInSurah: no, text: `terjemahan ayat ${no}` }))
  return { data: { number: n, englishName: 'Al-Faatiha', name: 'الفاتحة', englishNameTranslation: 'The Opening', numberOfAyahs: jumlah, revelationType: 'Meccan', ayahs } }
}

let jawab: (url: string) => unknown = () => ({})
let permintaan: string[] = []
;(globalThis as Record<string, unknown>).fetch = async (url: string) => {
  permintaan.push(url)
  const body = jawab(url)
  if (body === null) return { ok: false, status: 502, json: async () => ({}) }
  return { ok: true, status: 200, json: async () => body }
}

const { bacaSurah, periksaTerjemahan } = await import(
  '../../src/lib/kitab.js')

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, ket = '') {
  if (benar) { lulus++; console.log('PASS', nama, ket.slice(0, 70)) }
  else { gagal++; console.log('FAIL', nama, ket.slice(0, 200)) }
}
function bersihkan() { simpanan.clear(); permintaan = [] }

// ── 1. Pemasangan menurut nomor, bukan urutan ───────────────────────────────
bersihkan()
jawab = (u) => u.includes('quran-uthmani') ? surahArab(1, 7) : surahTerjemahan(1, 7)
{
  const r = await bacaSurah(1, 'en.sahih')
  cek('surah utuh terbaca', r.ayat.length === 7)
  cek('tiap ayat memperoleh terjemahannya sendiri',
    r.ayat.every((a) => a.terjemahan === `terjemahan ayat ${a.nomor}`),
    r.ayat.map((a) => `${a.nomor}:${a.terjemahan}`).join(' | '))
}

// Terjemahan datang dengan urutan teracak. Pemasangan menurut nomor harus
// tetap benar; pemasangan menurut urutan larik akan salah seluruhnya.
bersihkan()
jawab = (u) => {
  if (u.includes('quran-uthmani')) return surahArab(1, 7)
  const t = surahTerjemahan(1, 7)
  t.data.ayahs.reverse()
  return t
}
{
  const r = await bacaSurah(1, 'en.sahih')
  cek('urutan terbalik tidak menukar makna',
    r.ayat.every((a) => a.terjemahan === `terjemahan ayat ${a.nomor}`),
    r.ayat.map((a) => `${a.nomor}:${a.terjemahan}`).join(' | '))
}

// ── 2. Terjemahan kurang satu ayat harus DITOLAK, bukan digeser ─────────────
bersihkan()
jawab = (u) => u.includes('quran-uthmani') ? surahArab(1, 7) : surahTerjemahan(1, 7, [3])
{
  let pesan = ''
  try { await bacaSurah(1, 'en.sahih'); pesan = '(tidak melempar)' }
  catch (e) { pesan = (e as Error).message }
  cek('terjemahan kurang satu ayat ditolak', /nothing is shown/i.test(pesan), pesan)
  cek('alasannya menyebut risiko salah pasang makna',
    /wrong meaning|did not line up|someone else/i.test(pesan), pesan)
}

// ── 3. Jawaban rusak tidak boleh mengendap di cache ─────────────────────────
bersihkan()
// Arab terpotong: menyatakan 7 ayat, mengirim 5.
jawab = (u) => u.includes('quran-uthmani') ? surahArab(1, 7, 5) : surahTerjemahan(1, 7)
{
  let pesan = ''
  try { await bacaSurah(1, 'en.sahih') } catch (e) { pesan = (e as Error).message }
  cek('jawaban terpotong ditolak', /nothing is shown/i.test(pesan), pesan)

  const isi = simpanan.get('pmd-kitab-v1') ?? '{}'
  cek('yang gagal periksa tidak tersimpan', !isi.includes('numberOfAyahs'), isi.slice(0, 120))

  // Penyedia pulih. Percobaan berikutnya harus benar-benar berhasil — bukan
  // membaca ulang jawaban rusak dari cache selama tujuh hari.
  const sebelum = permintaan.length
  jawab = (u) => u.includes('quran-uthmani') ? surahArab(1, 7) : surahTerjemahan(1, 7)
  const r = await bacaSurah(1, 'en.sahih')
  cek('percobaan ulang benar-benar mengambil ulang', permintaan.length > sebelum,
    `${permintaan.length - sebelum} permintaan baru`)
  cek('percobaan ulang berhasil setelah penyedia pulih', r.ayat.length === 7)
}

// ── 4. Yang lolos periksa memang disimpan (cache tetap berguna) ─────────────
{
  const sebelum = permintaan.length
  const r = await bacaSurah(1, 'en.sahih')
  cek('bacaan yang lolos dilayani dari cache', permintaan.length === sebelum && r.ayat.length === 7,
    `${permintaan.length - sebelum} permintaan baru`)
}

// ── 5. periksaTerjemahan berdiri sendiri ────────────────────────────────────
{
  const surah = { nomor: 1, nama: 'Al-Faatiha', namaArab: 'الفاتحة', arti: 'The Opening', jumlahAyat: 7, tempat: 'Meccan' }
  const utuh = Array.from({ length: 7 }, (_, i) => ({ nomor: i + 1, arab: BASMALAH, terjemahan: `t${i + 1}` }))
  cek('terjemahan lengkap lolos', periksaTerjemahan(surah, utuh, 7).utuh)
  cek('kelebihan ayat ditolak', !periksaTerjemahan(surah, utuh, 8).utuh)
  cek('terjemahan kosong ditolak',
    !periksaTerjemahan(surah, utuh.map((a, i) => (i === 4 ? { ...a, terjemahan: '  ' } : a)), 7).utuh)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
