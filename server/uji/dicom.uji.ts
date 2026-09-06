// Uji pembaca DICOM.
//
// Pembaca berkas biner adalah tempat kesalahan paling sunyi di seluruh
// aplikasi ini: satu oktet meleset tidak melempar galat, ia menghasilkan
// gambar. Gambar yang salah baca tetap terlihat seperti CT, dan pada
// radiologi hal itu tidak terbaca sebagai kerusakan melainkan sebagai temuan.
// Karena itu di sini berkas DICOM sungguhan DIBANGUN oktet demi oktet lalu
// dibaca kembali, bukan sekadar memanggil fungsinya dengan data karangan.

import {
  bacaDicom, terapkanJendela, jendelaAwal, urutkanSeri, nilaiDi, tafsirHu,
  JENDELA_CT, type Citra,
} from '../../src/lib/dicom'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

// ── Pembangun berkas DICOM ──────────────────────────────────────────────────
type Nilai = { vr: string; bytes: Uint8Array }
const teksV = (vr: string, s: string): Nilai => {
  // Panjang nilai DICOM selalu genap; kekurangannya diisi spasi.
  const p = s.length % 2 ? s + ' ' : s
  return { vr, bytes: new Uint8Array([...p].map((c) => c.charCodeAt(0))) }
}
const us = (n: number): Nilai => {
  const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return { vr: 'US', bytes: b }
}
const i16 = (arr: number[]): Nilai => {
  const b = new Uint8Array(arr.length * 2); const dv = new DataView(b.buffer)
  arr.forEach((v, i) => dv.setInt16(i * 2, v, true))
  return { vr: 'OW', bytes: b }
}
const u8 = (arr: number[]): Nilai => ({ vr: 'OW', bytes: new Uint8Array(arr) })

const VR_PANJANG = new Set(['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'])

function unsur(grup: number, elemen: number, v: Nilai, eksplisit: boolean): Uint8Array {
  const kepala = eksplisit
    ? (VR_PANJANG.has(v.vr) ? 12 : 8)
    : 8
  const b = new Uint8Array(kepala + v.bytes.length)
  const dv = new DataView(b.buffer)
  dv.setUint16(0, grup, true); dv.setUint16(2, elemen, true)
  if (eksplisit) {
    b[4] = v.vr.charCodeAt(0); b[5] = v.vr.charCodeAt(1)
    if (VR_PANJANG.has(v.vr)) { dv.setUint32(8, v.bytes.length, true) }
    else { dv.setUint16(6, v.bytes.length, true) }
  } else {
    dv.setUint32(4, v.bytes.length, true)
  }
  b.set(v.bytes, kepala)
  return b
}

const SINTAKS_EKSPLISIT = '1.2.840.10008.1.2.1'
const SINTAKS_IMPLISIT = '1.2.840.10008.1.2'

function bangunDicom(
  isi: Array<[number, number, Nilai]>,
  sintaks = SINTAKS_EKSPLISIT,
  tanda = 'DICM',
): ArrayBuffer {
  const eksplisit = sintaks !== SINTAKS_IMPLISIT
  const metaIsi = unsur(0x0002, 0x0010, teksV('UI', sintaks), true)
  const metaPanjang = unsur(0x0002, 0x0000, { vr: 'UL', bytes: (() => {
    const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, metaIsi.length, true); return b
  })() }, true)
  const ds = isi.map(([g, e, v]) => unsur(g, e, v, eksplisit))
  const potongan = [metaPanjang, metaIsi, ...ds]
  const total = 132 + potongan.reduce((a, b) => a + b.length, 0)
  const out = new Uint8Array(total)
  for (let i = 0; i < 4; i++) out[128 + i] = tanda.charCodeAt(i)
  let p = 132
  for (const c of potongan) { out.set(c, p); p += c.length }
  return out.buffer
}

// Satu CT 4x4 dengan nilai mentah yang, setelah slope 1 / intercept −1024,
// menjadi rentang Hounsfield yang bisa dihitung dengan tangan.
const MENTAH = [
  0, 24, 1024, 1224,
  1024, 1024, 1024, 1024,
  1500, 1500, 2000, 3000,
  1024, 1074, 1084, 1024,
]
function ctDasar(sintaks = SINTAKS_EKSPLISIT, ubah: Array<[number, number, Nilai]> = []) {
  return bangunDicom([
    [0x0008, 0x0060, teksV('CS', 'CT')],
    [0x0008, 0x103e, teksV('LO', 'Thorax 1mm')],
    [0x0018, 0x0050, teksV('DS', '1.0')],
    [0x0020, 0x0013, teksV('IS', '7')],
    [0x0020, 0x0032, teksV('DS', '-150\\-160\\42.5')],
    [0x0028, 0x0002, us(1)],
    [0x0028, 0x0004, teksV('CS', 'MONOCHROME2')],
    [0x0028, 0x0010, us(4)],
    [0x0028, 0x0011, us(4)],
    [0x0028, 0x0030, teksV('DS', '0.7\\0.7')],
    [0x0028, 0x0100, us(16)],
    [0x0028, 0x0103, us(0)],
    [0x0028, 0x1050, teksV('DS', '50')],
    [0x0028, 0x1051, teksV('DS', '400')],
    [0x0028, 0x1052, teksV('DS', '-1024')],
    [0x0028, 0x1053, teksV('DS', '1')],
    ...ubah,
    [0x7fe0, 0x0010, i16(MENTAH)],
  ], sintaks)
}

// ── Pembacaan dasar ─────────────────────────────────────────────────────────
const h = bacaDicom(ctDasar())
ok('berkas DICOM eksplisit terbaca', h.ok, h.ok ? '' : h.alasan)
if (h.ok) {
  const c = h.data
  ok('ukuran citra terbaca', c.baris === 4 && c.kolom === 4)
  ok('modalitas terbaca', c.modalitas === 'CT')
  ok('deskripsi seri terbaca', c.deskripsiSeri === 'Thorax 1mm')
  ok('satu bingkai bila NumberOfFrames tidak ada', c.bingkai === 1)
  // Inilah inti pembacaan CT: 0 mentah dengan intercept −1024 adalah udara.
  ok('rescale diterapkan — 0 mentah menjadi −1024 HU', c.nilai[0] === -1024)
  ok('1024 mentah menjadi 0 HU (air)', c.nilai[2] === 0)
  ok('3000 mentah menjadi 1976 HU (tulang)', c.nilai[11] === 1976)
  ok('minimum dan maksimum benar', c.minimum === -1024 && c.maksimum === 1976)
  ok('window bawaan terbaca', c.pusatBawaan === 50 && c.lebarBawaan === 400)
  ok('MONOCHROME2 tidak dibalik', c.terbalik === false)
  ok('jarak piksel terbaca', c.jarakPiksel?.[0] === 0.7 && c.jarakPiksel?.[1] === 0.7)
  ok('tebal irisan terbaca', c.tebalIrisMm === 1)
  ok('nomor irisan terbaca', c.nomorIris === 7)
  ok('posisi sumbu Z diambil dari unsur ketiga', c.posisiZ === 42.5)
}

// Implicit VR tidak menuliskan jenis nilai sama sekali; hasilnya harus sama
// persis dengan berkas eksplisit yang isinya sama.
const hi = bacaDicom(ctDasar(SINTAKS_IMPLISIT))
ok('berkas Implicit VR terbaca', hi.ok, hi.ok ? '' : hi.alasan)
if (hi.ok && h.ok) {
  ok('Implicit VR memberi ukuran citra yang sama',
    hi.data.baris === h.data.baris && hi.data.kolom === h.data.kolom)
  ok('Implicit VR memberi nilai piksel yang sama',
    Array.from(hi.data.nilai).every((v, i) => v === h.data.nilai[i]))
  ok('Implicit VR memberi rescale yang sama', hi.data.minimum === h.data.minimum)
}

// ── Penolakan yang harus terjadi ────────────────────────────────────────────
ok('berkas tanpa tanda DICM ditolak', (() => {
  const r = bacaDicom(ctDasar(SINTAKS_EKSPLISIT, []) && bangunDicom([[0x0028, 0x0010, us(4)]], SINTAKS_EKSPLISIT, 'JUNK'))
  return !r.ok && r.alasan.includes('DICM')
})())
ok('berkas terlalu pendek ditolak', !bacaDicom(new ArrayBuffer(16)).ok)

for (const [sintaks, nama] of [
  ['1.2.840.10008.1.2.4.50', 'JPEG Baseline'],
  ['1.2.840.10008.1.2.4.91', 'JPEG 2000'],
  ['1.2.840.10008.1.2.5', 'RLE Lossless'],
] as const) {
  const r = bacaDicom(ctDasar(sintaks as string))
  ok(`sintaks termampat ${nama} ditolak dengan menyebut namanya`,
    !r.ok && r.alasan.includes(nama))
}
{
  const r = bacaDicom(ctDasar('1.2.840.10008.1.2.2'))
  ok('Explicit VR Big Endian ditolak', !r.ok && r.alasan.includes('Big Endian'))
}
{
  // Citra berwarna: menampilkannya sebagai satu kanal akan memberi gambar yang
  // salah, bukan gambar yang jelek.
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(3)], [0x0028, 0x0010, us(4)], [0x0028, 0x0011, us(4)],
    [0x7fe0, 0x0010, u8([1, 2, 3, 4])],
  ]))
  ok('citra berwarna ditolak', !r.ok && r.alasan.toLowerCase().includes('colour'))
}
{
  const r = bacaDicom(bangunDicom([[0x0008, 0x0060, teksV('CS', 'CT')]]))
  ok('berkas tanpa ukuran citra ditolak', !r.ok && r.alasan.includes('Rows'))
}
{
  // Data piksel lebih pendek daripada ukuran yang diakui: dulu ini menghasilkan
  // separuh gambar dan separuh nol tanpa peringatan apa pun.
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(1)], [0x0028, 0x0010, us(8)], [0x0028, 0x0011, us(8)],
    [0x0028, 0x0100, us(16)], [0x0028, 0x0103, us(0)],
    [0x7fe0, 0x0010, i16([1, 2, 3, 4])],
  ]))
  ok('berkas terpotong ditolak', !r.ok && r.alasan.includes('truncated'))
}
{
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(1)], [0x0028, 0x0010, us(2)], [0x0028, 0x0011, us(2)],
    [0x0028, 0x0100, us(32)], [0x0028, 0x0103, us(0)],
    [0x7fe0, 0x0010, u8(new Array(16).fill(0))],
  ]))
  ok('kedalaman bit yang tak didukung ditolak', !r.ok && r.alasan.includes('32'))
}

// ── Piksel bertanda dan 8-bit ───────────────────────────────────────────────
{
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(1)], [0x0028, 0x0010, us(1)], [0x0028, 0x0011, us(2)],
    [0x0028, 0x0100, us(16)], [0x0028, 0x0103, us(1)],
    [0x0028, 0x1052, teksV('DS', '0')], [0x0028, 0x1053, teksV('DS', '1')],
    [0x7fe0, 0x0010, i16([-800, 400])],
  ]))
  // PixelRepresentation 1 berarti bertanda: dibaca tak bertanda, −800 akan
  // menjadi 64.736 dan seluruh citra menjadi putih.
  ok('piksel bertanda dibaca sebagai bilangan bertanda',
    r.ok && r.data.nilai[0] === -800 && r.data.nilai[1] === 400)
}
{
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(1)], [0x0028, 0x0010, us(1)], [0x0028, 0x0011, us(4)],
    [0x0028, 0x0100, us(8)], [0x0028, 0x0103, us(0)],
    [0x7fe0, 0x0010, u8([0, 64, 128, 255])],
  ]))
  ok('citra 8-bit terbaca', r.ok && r.data.nilai[3] === 255 && r.data.nilai[0] === 0)
}
{
  const r = bacaDicom(ctDasar(SINTAKS_EKSPLISIT,
    [[0x0028, 0x0004, teksV('CS', 'MONOCHROME1')]]))
  // MONOCHROME1 dipakai banyak radiografi lama; tanpa pembalikan, paru tampak
  // putih dan tulang tampak hitam.
  ok('MONOCHROME1 ditandai terbalik', r.ok && r.data.terbalik === true)
}

// ── Jendela (VOI LUT) ───────────────────────────────────────────────────────
if (h.ok) {
  const c = h.data
  // Rumus DICOM: nilai di bawah (pusat − 0,5 − (lebar − 1)/2) menjadi 0,
  // di atas (pusat − 0,5 + (lebar − 1)/2) menjadi 255, dan pusat menjadi ~128.
  const paru = terapkanJendela(c, -600, 1500)
  // −1024 HU masih berada DI DALAM jendela paru, yang dasarnya −1350 HU, jadi
  // udara tampak kelabu gelap dan bukan hitam pekat. Justru itu gunanya:
  // jendela paru menyisakan gradasi di dalam udara supaya dinding dan
  // pembuluh halus tidak hilang tertelan hitam.
  ok('udara menjadi kelabu gelap, bukan hitam pekat, pada jendela paru',
    paru[0] > 40 && paru[0] < 70, String(paru[0]))
  ok('nilai di bawah dasar jendela dijepit menjadi hitam',
    terapkanJendela(c, 500, 400)[0] === 0)
  ok('tulang (1976 HU) menjadi putih pada jendela paru', paru[11] === 255)

  const sempit = terapkanJendela(c, 0, 100)
  ok('nilai di atas jendela sempit menjadi putih', sempit[2 + 8] === 255)
  ok('nilai jauh di bawah jendela sempit menjadi hitam', sempit[0] === 0)

  // Pusat jendela harus jatuh di sekitar tengah rentang kelabu.
  const tengah = terapkanJendela(c, 0, 400)[2]
  ok('nilai tepat di pusat jendela menjadi kelabu tengah',
    Math.abs(tengah - 128) <= 1, String(tengah))

  // Jendela lebih sempit = kontras lebih tinggi. Inilah alasan seluruh
  // preset ada; kalau sifat ini tidak berlaku, presetnya tidak ada gunanya.
  const lebar = terapkanJendela(c, 0, 2000)
  const kontrasSempit = Math.abs(terapkanJendela(c, 30, 60)[13] - terapkanJendela(c, 30, 60)[14])
  const kontrasLebar = Math.abs(lebar[13] - lebar[14])
  ok('jendela sempit memberi kontras lebih tinggi antara dua nilai berdekatan',
    kontrasSempit > kontrasLebar)

  // MONOCHROME1 harus membalik hasil akhirnya, bukan nilai HU-nya.
  const terbalik: Citra = { ...c, terbalik: true }
  ok('MONOCHROME1 membalik keluaran jendela',
    terapkanJendela(terbalik, -600, 1500)[0] === 255 - paru[0])

  ok('lebar jendela nol tidak membuat pembagian nol',
    Number.isFinite(terapkanJendela(c, 0, 0)[0]))

  const awal = jendelaAwal(c)
  ok('jendela awal mengikuti berkas bila tercatat', awal.pusat === 50 && awal.lebar === 400)
  const tanpa: Citra = { ...c, pusatBawaan: undefined, lebarBawaan: undefined }
  const awal2 = jendelaAwal(tanpa)
  ok('tanpa window bawaan, jendela awal mencakup seluruh rentang',
    awal2.lebar === c.maksimum - c.minimum && awal2.pusat === (c.maksimum + c.minimum) / 2)

  ok('nilai di satu titik dapat dibaca', nilaiDi(c, 2, 0) === 0)
  ok('titik di luar citra mengembalikan null', nilaiDi(c, 9, 0) === null && nilaiDi(c, -1, 0) === null)
}

// ── Bingkai jamak ───────────────────────────────────────────────────────────
{
  const r = bacaDicom(bangunDicom([
    [0x0028, 0x0002, us(1)], [0x0028, 0x0008, teksV('IS', '2')],
    [0x0028, 0x0010, us(2)], [0x0028, 0x0011, us(2)],
    [0x0028, 0x0100, us(16)], [0x0028, 0x0103, us(0)],
    [0x7fe0, 0x0010, i16([1, 2, 3, 4, 90, 91, 92, 93])],
  ]))
  ok('jumlah bingkai terbaca', r.ok && r.data.bingkai === 2)
  ok('bingkai kedua diambil dari bagian data yang benar',
    r.ok && terapkanJendela(r.data, 91, 4, 1)[0] < terapkanJendela(r.data, 91, 4, 1)[3])
  ok('bingkai di luar jangkauan dijepit, bukan membaca memori kosong',
    r.ok && Number.isFinite(terapkanJendela(r.data, 0, 100, 99)[0]))
}

// ── Urutan seri ─────────────────────────────────────────────────────────────
{
  const buat = (z: number | undefined, n: number): { citra: Citra } => ({
    citra: { baris: 1, kolom: 1, bingkai: 1, modalitas: 'CT', nilai: new Float32Array(1),
      minimum: 0, maksimum: 0, terbalik: false, posisiZ: z, nomorIris: n },
  })
  // Nama berkas dari CD rumah sakit sering berurutan secara abjad, bukan
  // anatomis. Yang menentukan urutan adalah posisi pada sumbu pasien.
  const urut = urutkanSeri([buat(30, 3), buat(10, 1), buat(20, 2)])
  ok('seri diurutkan menurut posisi sumbu Z',
    urut.map((x) => x.citra.posisiZ).join(',') === '10,20,30')
  const tanpaZ = urutkanSeri([buat(undefined, 5), buat(undefined, 2)])
  ok('tanpa posisi Z, urutan jatuh ke nomor irisan',
    tanpaZ.map((x) => x.citra.nomorIris).join(',') === '2,5')
}

// ── Penafsiran Hounsfield ───────────────────────────────────────────────────
ok('−1000 HU dikenali sebagai udara', tafsirHu(-1000) === 'Air')
ok('−700 HU dikenali sebagai parenkim paru', tafsirHu(-700).includes('Lung'))
ok('0 HU dikenali sebagai cairan/air', tafsirHu(0).includes('Water'))
ok('55 HU menyebut kemungkinan perdarahan akut', tafsirHu(55).includes('haemorrhage'))
ok('1200 HU dikenali sebagai tulang', tafsirHu(1200).includes('Bone'))
ok('nilai ekstrem dikenali sebagai artefak logam', tafsirHu(5000).includes('Metal'))
// Rentang lemak memang bertumpang tindih dengan jaringan lunak, dan itu harus
// dikatakan alih-alih disembunyikan di balik satu label yang terdengar pasti.
ok('tumpang tindih lemak dan jaringan lunak disebutkan',
  tafsirHu(-200).toLowerCase().includes('overlap'))

// ── Preset CT ───────────────────────────────────────────────────────────────
ok('sepuluh preset CT tersedia', JENDELA_CT.length === 10)
ok('semua preset punya lebar positif', JENDELA_CT.every((j) => j.lebar > 0))
ok('setiap preset menerangkan gunanya', JENDELA_CT.every((j) => j.catatan.length > 10))
ok('jendela paru berpusat di bawah nol HU',
  JENDELA_CT.find((j) => j.nama === 'Lung')!.pusat < 0)
ok('jendela stroke lebih sempit daripada jendela otak',
  JENDELA_CT.find((j) => j.nama === 'Stroke')!.lebar <
  JENDELA_CT.find((j) => j.nama === 'Brain')!.lebar)
ok('nama preset tidak berulang', new Set(JENDELA_CT.map((j) => j.nama)).size === JENDELA_CT.length)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
