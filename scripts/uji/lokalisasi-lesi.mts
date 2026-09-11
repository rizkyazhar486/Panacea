import assert from 'node:assert/strict'
import {
  lokalisasi, tempatTerbaik, sisiTerkena, TINGKAT_SARAF_KRANIAL, DI_LUAR_MODEL,
  type Temuan,
} from '../../src/lib/lokalisasiLesi.ts'
import { readFile } from 'node:fs/promises'

// Uji ini punya satu tujuan utama: membuktikan mesinnya MENALAR, bukan
// menghafal.
//
// Sindrom bernama tidak boleh ada di dalam kodenya. Kalau ada, mesin ini hanya
// tabel pencarian bersamaran, dan ia akan gagal pada pola apa pun yang belum
// pernah diberi nama. Jadi hal pertama yang diperiksa adalah bahwa namanya
// memang tidak ada di sana -- lalu sindrom-sindrom itu harus tetap keluar
// benar.

const sumber = await readFile(new URL('../../src/lib/lokalisasiLesi.ts', import.meta.url), 'utf8')

// Nama sindrom boleh disebut di komentar penjelas -- memang di situlah ia
// menjelaskan maksud berkasnya. Yang tidak boleh adalah namanya muncul di
// dalam KODE, karena di sana ia berarti pencocokan pola yang dihafal.
{
  const barisKode = sumber.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*'))
  const kode = barisKode.join('\n')
  for (const nama of ['Sequard', 'Séquard', 'Wallenberg', 'Weber']) {
    assert.ok(!kode.includes(nama), `"${nama}" muncul di dalam kode, bukan hanya di komentar.`)
  }
}

// ── 1. Aturan penyilangan itu sendiri ───────────────────────────────────────
//
// Semua yang lain diturunkan dari sini, jadi kalau ini salah, sisanya ikut.
assert.equal(sisiTerkena('motorik', 'medula-spinalis', 'kanan'), 'kanan',
  'Di bawah piramis, motorik ipsilateral.')
assert.equal(sisiTerkena('motorik', 'pons', 'kanan'), 'kiri',
  'Di atas piramis, motorik kontralateral.')
assert.equal(sisiTerkena('getar-posisi', 'medula-spinalis', 'kanan'), 'kanan',
  'Kolumna dorsalis belum menyilang di medula spinalis.')
assert.equal(sisiTerkena('getar-posisi', 'medula', 'kanan'), 'kiri',
  'Sudah menyilang di medula.')
assert.equal(sisiTerkena('nyeri-suhu', 'medula-spinalis', 'kanan'), 'kiri',
  'Spinotalamikus menyilang di dalam medula spinalis, jadi defisitnya kontralateral.')

// ── 2. Hemiseksi medula spinalis harus JATUH SENDIRI ────────────────────────
//
// Pola: kelemahan dan hilang rasa getar SISI YANG SAMA dengan lesi, hilang
// nyeri-suhu SISI SEBERANG. Tidak ada tempat lain di seluruh neuraksis yang
// menghasilkan kombinasi ini, dan itulah kenapa ia bisa dilokalisasi sama
// sekali.
{
  const temuan: Temuan[] = [
    { modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' },
    { modalitas: 'getar-posisi', sisi: 'kanan', wilayah: 'badan' },
    { modalitas: 'nyeri-suhu', sisi: 'kiri', wilayah: 'badan' },
  ]
  const t = tempatTerbaik(lokalisasi(temuan))
  assert.ok(t, 'Harus ada satu tempat yang menjelaskan seluruh pola.')
  assert.equal(t.tingkat, 'medula-spinalis')
  assert.equal(t.sisi, 'kanan')
}

// ── 3. Sindrom medula lateral harus JATUH SENDIRI ───────────────────────────
//
// Pola bersilang yang menjadi ciri batang otak: nyeri-suhu WAJAH ipsilateral,
// nyeri-suhu BADAN kontralateral. Tidak mungkin di atas atau di bawah batang
// otak.
{
  const t = tempatTerbaik(lokalisasi(
    [
      { modalitas: 'nyeri-suhu', sisi: 'kiri', wilayah: 'wajah' },
      { modalitas: 'nyeri-suhu', sisi: 'kanan', wilayah: 'badan' },
    ],
    [{ saraf: 9, sisi: 'kiri' }],
  ))
  assert.ok(t, 'Pola bersilang harus punya tempat tunggal.')
  assert.equal(t.tingkat, 'medula')
  assert.equal(t.sisi, 'kiri')
}

// ── 4. Sindrom midbrain harus JATUH SENDIRI ─────────────────────────────────
//
// Saraf kranial III ipsilateral + hemiparesis kontralateral. Nukleus III-lah
// yang menetapkan tingkatnya; tanpa itu, kelemahan kontralateral saja bisa
// berasal dari mana pun di atas piramis.
{
  const t = tempatTerbaik(lokalisasi(
    [{ modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' }],
    [{ saraf: 3, sisi: 'kiri' }],
  ))
  assert.ok(t)
  assert.equal(t.tingkat, 'midbrain')
  assert.equal(t.sisi, 'kiri')
}

// Saraf kranial VII menggeser tingkat yang sama menjadi pons -- satu-satunya
// yang berubah adalah sarafnya, dan jawabannya ikut berubah. Inilah bukti
// bahwa tingkatnya benar-benar dinalar.
{
  const t = tempatTerbaik(lokalisasi(
    [{ modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' }],
    [{ saraf: 7, sisi: 'kiri' }],
  ))
  assert.ok(t)
  assert.equal(t.tingkat, 'pons')
  assert.equal(t.sisi, 'kiri')
}
assert.equal(TINGKAT_SARAF_KRANIAL[12], 'medula')

// ── 5. Pola yang TIDAK punya lesi tunggal harus dikatakan begitu ────────────
//
// Ini yang membedakan alat penalaran dari alat yang selalu menjawab. Kelemahan
// kanan DAN kiri sekaligus tidak berasal dari satu tempat pada model ini.
{
  const h = lokalisasi([
    { modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' },
    { modalitas: 'motorik', sisi: 'kiri', wilayah: 'badan' },
  ])
  assert.ok(h.tidakAdaLesiTunggal, 'Defisit bilateral tidak boleh dipaksakan ke satu tempat.')
  assert.equal(tempatTerbaik(h), null, 'Tidak ada jawaban lebih baik daripada jawaban yang dikarang.')
  assert.ok(h.catatan.some((c) => /multifocal|wrong side/i.test(c)),
    'Alasannya harus disebut, termasuk kemungkinan sisi yang salah dicatat.')
}

// ── 6. Alasan harus bisa diperiksa manusia ──────────────────────────────────
//
// Lokalisasi tanpa alasan tidak bisa dibantah, dan sesuatu yang tidak bisa
// dibantah tidak mengajarkan apa pun.
{
  const h = lokalisasi([{ modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' }])
  const t = h.kandidat[0]
  assert.ok(t.alasan.length > 0, 'Setiap kandidat harus membawa alasannya.')
  assert.ok(t.alasan.every((a) => a.length > 15), 'Alasan harus berupa kalimat, bukan kode.')
}

// ── 7. Batas model harus terlihat, bukan tersirat ───────────────────────────
assert.ok(DI_LUAR_MODEL.length >= 4, 'Yang tidak dimodelkan harus disebut.')
assert.ok(DI_LUAR_MODEL.some((s) => /forehead|upper motor neuron/i.test(s)),
  'Kelemahan wajah UMN adalah jebakan klasik dan harus disebut sebagai di luar model.')
assert.ok(DI_LUAR_MODEL.some((s) => /patient|imaging/i.test(s)),
  'Harus dinyatakan bahwa ini tidak bekerja pada pasien atau pencitraan.')

console.log('Lokalisasi lesi: hemiseksi korda, sindrom medula lateral, dan sindrom midbrain/pons semuanya jatuh sendiri dari aturan penyilangan; pola bilateral ditolak alih-alih dipaksakan.')

// ── 8. Kalimat alasan harus berbahasa Inggris ───────────────────────────────
//
// Pengenal internal berbahasa Indonesia ('motorik', 'kiri', 'kanan') dan itu
// benar: pengenal adalah data. Tetapi kalimat alasan dibaca pengguna, dan
// versi pertama membocorkan pengenalnya apa adanya -- terlihat di peramban
// sebagai "motorik on the kanan body follows from a kiri Pons lesion".
{
  const h = lokalisasi(
    [
      { modalitas: 'motorik', sisi: 'kanan', wilayah: 'badan' },
      { modalitas: 'nyeri-suhu', sisi: 'kiri', wilayah: 'wajah' },
      { modalitas: 'getar-posisi', sisi: 'kanan', wilayah: 'badan' },
    ],
    [{ saraf: 7, sisi: 'kiri' }],
  )
  const semua = h.kandidat.flatMap((k) => k.alasan)
  assert.ok(semua.length > 10, 'Harus ada banyak kalimat untuk diperiksa.')
  for (const kalimat of semua) {
    for (const bocor of ['motorik', 'nyeri-suhu', 'getar-posisi', ' kiri', ' kanan']) {
      assert.ok(!kalimat.includes(bocor),
        `Pengenal internal bocor ke kalimat antarmuka: "${kalimat}"`)
    }
  }
  assert.ok(semua.some((k) => /weakness/.test(k)), 'Modalitas harus muncul sebagai kata Inggris.')
  assert.ok(semua.some((k) => /\bleft\b|\bright\b/.test(k)), 'Sisi harus muncul sebagai kata Inggris.')
}

console.log('Alasan: seluruh kalimat berbahasa Inggris, pengenal internal tidak bocor ke antarmuka.')
