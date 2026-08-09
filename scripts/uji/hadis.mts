// Hadis — yang dijaga di sini terutama BUKAN teknis.
//
// Menampilkan riwayat lemah dalam bentuk yang sama persis dengan riwayat sahih
// adalah kesalahan yang tidak akan pernah muncul sebagai galat. Karena itu yang
// diuji lebih dulu adalah pembagian kitabnya, lalu keutuhan teksnya.
const simpanan = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => simpanan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpanan.set(k, v) },
  removeItem: (k: string) => { simpanan.delete(k) },
}

let jawab: (url: string) => unknown = () => ({})
let permintaan: string[] = []
;(globalThis as Record<string, unknown>).fetch = async (url: string) => {
  permintaan.push(url)
  const body = jawab(url)
  if (body === null) return { ok: false, status: 404, json: async () => ({}) }
  return { ok: true, status: 200, json: async () => body }
}

const {
  KITAB, periksaHadis, bacaBagian, daftarBagian, PERINGATAN_DERAJAT, CATATAN_SAHIH,
  PENYEDIA_HADIS,
} = await import('../../src/lib/hadis.js')

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, ket = '') {
  if (benar) { lulus++; console.log('PASS', nama, String(ket).slice(0, 90)) }
  else { gagal++; console.log('FAIL', nama, String(ket).slice(0, 200)) }
}
const bersih = () => { simpanan.clear(); permintaan = [] }

// ── 1. Pembagian derajat ────────────────────────────────────────────────────
const sahih = KITAB.filter((k) => k.derajat === 'sahih-kitab').map((k) => k.id)
cek('hanya Bukhari dan Muslim yang berderajat kitab',
  sahih.length === 2 && sahih.includes('bukhari') && sahih.includes('muslim'), sahih.join(','))
cek('empat Sunan ditandai bercampur derajat',
  KITAB.filter((k) => k.derajat === 'campuran-tanpa-penilaian').length === 4)
cek('tiap kitab menyebut penyusunnya', KITAB.every((k) => k.penyusun.length > 8))
cek('tiap kitab punya edisi Inggris dan Arab',
  KITAB.every((k) => k.edisiInggris.startsWith('eng-') && k.edisiArab.startsWith('ara-')))
cek('peringatan menyebut derajat bercampur dan larangan mengamalkan begitu saja',
  /differing grades/i.test(PERINGATAN_DERAJAT) && /before you act on it/i.test(PERINGATAN_DERAJAT))
cek('catatan sahih menjelaskan kenapa tanpa label per hadis',
  /consensus/i.test(CATATAN_SAHIH) && /no per-report grading/i.test(CATATAN_SAHIH))
cek('penyedia menyatakan ia tidak membawa penilaian derajat',
  /does not carry per-hadith gradings/i.test(PENYEDIA_HADIS.catatan))
cek('rujukan pemeriksaan derajat disebutkan', /sunnah\.com/.test(PENYEDIA_HADIS.periksaDerajat.situs))

// ── 2. Keutuhan ─────────────────────────────────────────────────────────────
const H = (n: number, t = `report ${n}`, arab?: string) => ({ nomor: n, teks: t, arab })
cek('hadis wajar lolos', periksaHadis([H(1), H(2)], [1, 2]).utuh)
cek('teks kosong ditolak', !periksaHadis([H(1, '')], [1]).utuh)
cek('kosong seluruhnya ditolak', !periksaHadis([], [1]).utuh)
cek('pengodean rusak ditolak', !periksaHadis([H(1, 'ab�cd')], [1]).utuh)
cek('halaman web ditolak', !periksaHadis([H(1, '<html><body>404</body></html>')], [1]).utuh)
cek('teks Arab yang bukan aksara Arab ditolak',
  !periksaHadis([H(1, 'a report', 'this is not arabic')], [1]).utuh)
cek('teks Arab yang benar lolos', periksaHadis([H(1, 'a report', 'حَدَّثَنَا')], [1]).utuh)
cek('nomor yang meleset seluruhnya ditolak', !periksaHadis([H(9), H(10)], [1, 2]).utuh)

// ── 3. Pembacaan bagian ─────────────────────────────────────────────────────
const bagianIng = (dari: number, n: number) => ({
  metadata: { name: 'Sahih al-Bukhari', last_hadithnumber: 7563 },
  hadiths: Array.from({ length: n }, (_, i) => ({ hadithnumber: dari + i, text: `report ${dari + i}` })),
})
const bagianAra = (dari: number, n: number, acak = false) => {
  const h = Array.from({ length: n }, (_, i) => ({ hadithnumber: dari + i, text: `حديث ${dari + i}` }))
  if (acak) h.reverse()
  return { metadata: { name: 'صحيح البخاري', last_hadithnumber: 7563 }, hadiths: h }
}

bersih()
jawab = (u) => (/ara-/.test(u) ? bagianAra(1, 5) : bagianIng(1, 5))
{
  const r = await bacaBagian('bukhari', 1)
  cek('bagian terbaca', r.hadis.length === 5 && r.dari === 1 && r.sampai === 5)
  cek('teks Arab ikut terpasang', r.hadis.every((h) => /^حديث/.test(h.arab ?? '')))
  cek('tidak ada bagian yang gagal', r.gagalSebagian.length === 0, r.gagalSebagian.join(','))
  cek('total dari penyedia terbawa', r.total === 7563)
}

// Arab datang teracak: pemasangan harus tetap menurut NOMOR, bukan urutan.
bersih()
jawab = (u) => (/ara-/.test(u) ? bagianAra(1, 5, true) : bagianIng(1, 5))
{
  const r = await bacaBagian('bukhari', 1)
  cek('urutan Arab teracak tidak menukar riwayat',
    r.hadis.every((h) => h.arab === `حديث ${h.nomor}`),
    r.hadis.map((h) => `${h.nomor}:${h.arab}`).join(' | '))
}

// Arab tidak tersedia: bacaan tetap jalan, tetapi kegagalannya DISEBUTKAN.
bersih()
jawab = (u) => (/ara-/.test(u) ? null : bagianIng(1, 5))
{
  const r = await bacaBagian('bukhari', 1)
  cek('tanpa teks Arab bacaan tetap jalan', r.hadis.length === 5)
  cek('hilangnya teks Arab tidak didiamkan',
    r.gagalSebagian.includes('Arabic text'), r.gagalSebagian.join(','))
}

// Jawaban rusak: ditolak, dan TIDAK mengendap di cache.
bersih()
jawab = (u) => (/ara-/.test(u) ? null : { metadata: {}, hadiths: [{ hadithnumber: 1, text: '' }] })
{
  let pesan = ''
  try { await bacaBagian('bukhari', 1) } catch (e) { pesan = (e as Error).message }
  cek('jawaban rusak ditolak', /nothing is shown/i.test(pesan), pesan)
  cek('yang gagal tidak tersimpan', !(simpanan.get('pmd-hadis-v1') ?? '').includes('hadithnumber'))

  const sebelum = permintaan.length
  jawab = (u) => (/ara-/.test(u) ? bagianAra(1, 5) : bagianIng(1, 5))
  const r = await bacaBagian('bukhari', 1)
  cek('percobaan ulang benar-benar mengambil ulang', permintaan.length > sebelum)
  cek('percobaan ulang berhasil setelah penyedia pulih', r.hadis.length === 5)
}

// ── 4. Daftar bab ───────────────────────────────────────────────────────────
bersih()
jawab = () => ({ metadata: { sections: { '0': '', '1': 'Revelation', '2': 'Belief' } }, hadiths: [] })
{
  const d = await daftarBagian('bukhari')
  cek('daftar bab terbaca', d.length === 2 && d[0].nama === 'Revelation', JSON.stringify(d))
  cek('bab kosong dibuang', !d.some((x) => !x.nama))
}
bersih()
jawab = () => ({ metadata: { sections: {} }, hadiths: [] })
{
  let pesan = ''
  try { await daftarBagian('bukhari') } catch (e) { pesan = (e as Error).message }
  cek('daftar bab kosong ditolak', /nothing is shown/i.test(pesan), pesan)
}

cek('kitab tak dikenal ditolak',
  await bacaBagian('tidakada', 1).then(() => false).catch(() => true))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
