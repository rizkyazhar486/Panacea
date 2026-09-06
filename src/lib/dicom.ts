// ─────────────────────────────────────────────────────────────────────────────
// PEMBACA DICOM — berkas asli dari CD rumah sakit, dibaca di dalam peramban.
//
// Radiologi adalah satu-satunya bagian aplikasi ini yang datanya TIDAK boleh
// dikarang: gambar contoh yang terlihat seperti CT tetapi bukan CT pasiennya
// tidak berguna bagi siapa pun. Karena itu di sini tidak ada satu pun berkas
// bawaan. Yang ada hanya pembaca: pengguna membuka berkas .dcm miliknya
// sendiri, dan seluruh piksel tetap berada di dalam perangkatnya.
//
// Yang dibaca: DICOM Part 10 tanpa mampatan — Implicit VR Little Endian
// (1.2.840.10008.1.2) dan Explicit VR Little Endian (1.2.840.10008.1.2.1),
// yang merupakan bentuk hampir semua CT dan MR yang keluar dari PACS.
//
// Yang DITOLAK, dengan menyebutkan alasannya: sintaks termampat (JPEG, JPEG
// 2000, RLE) dan Explicit VR Big Endian. Menolak lebih jujur daripada
// menggambar piksel yang tidak pernah dibaca dengan benar — citra rusak dalam
// radiologi tidak terlihat seperti galat, ia terlihat seperti temuan.
// ─────────────────────────────────────────────────────────────────────────────

export type Hasil<T> = { ok: true; data: T } | { ok: false; alasan: string }

/** Nilai satu berkas DICOM setelah rescale — untuk CT satuannya Hounsfield. */
export interface Citra {
  baris: number
  kolom: number
  bingkai: number
  modalitas: string
  /** Nilai per piksel SETELAH slope/intercept: HU untuk CT, nilai mentah untuk lainnya. */
  nilai: Float32Array
  minimum: number
  maksimum: number
  /** Window center/width bawaan berkas, kalau ada. */
  pusatBawaan?: number
  lebarBawaan?: number
  /** MONOCHROME1 berarti nilai besar = gelap, kebalikan dari MONOCHROME2. */
  terbalik: boolean
  /** mm per piksel [baris, kolom], kalau tercatat. */
  jarakPiksel?: [number, number]
  tebalIrisMm?: number
  nomorIris?: number
  /** Posisi irisan pada sumbu pasien — dipakai mengurutkan satu seri. */
  posisiZ?: number
  deskripsiSeri?: string
}

const SINTAKS_IMPLISIT = '1.2.840.10008.1.2'
const SINTAKS_EKSPLISIT = '1.2.840.10008.1.2.1'
const SINTAKS_BIG_ENDIAN = '1.2.840.10008.1.2.2'

// Nama yang dikenali supaya penolakannya bisa menyebut penyebabnya, bukan
// sekadar "tidak didukung".
const NAMA_MAMPAT: Record<string, string> = {
  '1.2.840.10008.1.2.4.50': 'JPEG Baseline',
  '1.2.840.10008.1.2.4.51': 'JPEG Extended',
  '1.2.840.10008.1.2.4.57': 'JPEG Lossless',
  '1.2.840.10008.1.2.4.70': 'JPEG Lossless SV1',
  '1.2.840.10008.1.2.4.80': 'JPEG-LS Lossless',
  '1.2.840.10008.1.2.4.81': 'JPEG-LS Lossy',
  '1.2.840.10008.1.2.4.90': 'JPEG 2000 Lossless',
  '1.2.840.10008.1.2.4.91': 'JPEG 2000',
  '1.2.840.10008.1.2.5': 'RLE Lossless',
}

// VR yang panjangnya ditulis dalam 4 oktet setelah 2 oktet cadangan.
const VR_PANJANG = new Set(['OB', 'OW', 'OF', 'OD', 'OL', 'SQ', 'UT', 'UN', 'UC', 'UR'])

const tagDari = (grup: number, elemen: number) => (grup << 16) | elemen
const T = {
  sintaksTransfer: tagDari(0x0002, 0x0010),
  panjangMetaGrup: tagDari(0x0002, 0x0000),
  modalitas: tagDari(0x0008, 0x0060),
  deskripsiSeri: tagDari(0x0008, 0x103e),
  tebalIris: tagDari(0x0018, 0x0050),
  nomorIris: tagDari(0x0020, 0x0013),
  posisiPasien: tagDari(0x0020, 0x0032),
  baris: tagDari(0x0028, 0x0010),
  kolom: tagDari(0x0028, 0x0011),
  jumlahBingkai: tagDari(0x0028, 0x0008),
  sampelPerPiksel: tagDari(0x0028, 0x0002),
  fotometrik: tagDari(0x0028, 0x0004),
  jarakPiksel: tagDari(0x0028, 0x0030),
  bitDialokasikan: tagDari(0x0028, 0x0100),
  representasiPiksel: tagDari(0x0028, 0x0103),
  pusatJendela: tagDari(0x0028, 0x1050),
  lebarJendela: tagDari(0x0028, 0x1051),
  intersep: tagDari(0x0028, 0x1052),
  kemiringan: tagDari(0x0028, 0x1053),
  dataPiksel: tagDari(0x7fe0, 0x0010),
  akhirRuntun: tagDari(0xfffe, 0xe0dd),
  akhirButir: tagDari(0xfffe, 0xe00d),
  butir: tagDari(0xfffe, 0xe000),
} as const

interface Unsur { vr: string; awal: number; panjang: number }

// Pada Implicit VR, berkas TIDAK menyebutkan jenis tiap nilai; jenisnya harus
// diketahui dari kamus. Tanpa ini, Rows yang berupa bilangan 16-bit akan dibaca
// sebagai teks dan menghasilkan ukuran citra yang ngawur — bukan galat,
// melainkan gambar yang salah bentuk.
const VR_IMPLISIT: Record<number, string> = {
  [tagDari(0x0028, 0x0010)]: 'US', [tagDari(0x0028, 0x0011)]: 'US',
  [tagDari(0x0028, 0x0100)]: 'US', [tagDari(0x0028, 0x0101)]: 'US',
  [tagDari(0x0028, 0x0102)]: 'US', [tagDari(0x0028, 0x0103)]: 'US',
  [tagDari(0x0028, 0x0002)]: 'US',
  [tagDari(0x0028, 0x0008)]: 'IS', [tagDari(0x0020, 0x0013)]: 'IS',
  [tagDari(0x0028, 0x1050)]: 'DS', [tagDari(0x0028, 0x1051)]: 'DS',
  [tagDari(0x0028, 0x1052)]: 'DS', [tagDari(0x0028, 0x1053)]: 'DS',
  [tagDari(0x0028, 0x0030)]: 'DS', [tagDari(0x0018, 0x0050)]: 'DS',
  [tagDari(0x0020, 0x0032)]: 'DS',
  [tagDari(0x0008, 0x0060)]: 'CS', [tagDari(0x0028, 0x0004)]: 'CS',
  [tagDari(0x0008, 0x103e)]: 'LO',
  [tagDari(0x7fe0, 0x0010)]: 'OW',
}

/**
 * Menyusuri satu dataset dan mencatat letak tiap unsur.
 *
 * Runtun (SQ) dilewati utuh, termasuk yang panjangnya tidak ditentukan, karena
 * isinya tidak pernah dibutuhkan untuk menampilkan citra — sementara masuk ke
 * dalamnya berisiko menyalahartikan tag anak sebagai tag tingkat atas.
 */
function susuri(dv: DataView, mulai: number, akhir: number, eksplisit: boolean): Map<number, Unsur> {
  const peta = new Map<number, Unsur>()
  let p = mulai
  while (p + 8 <= akhir) {
    const grup = dv.getUint16(p, true)
    const elemen = dv.getUint16(p + 2, true)
    const tag = tagDari(grup, elemen)
    p += 4

    let vr = ''
    let panjang: number
    // Penanda butir dan penanda akhir selalu implisit, bahkan di dataset eksplisit.
    if (grup === 0xfffe) {
      panjang = dv.getUint32(p, true); p += 4
      if (tag === T.butir) continue // masuk ke isi butir
      continue
    }
    if (eksplisit) {
      vr = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1))
      p += 2
      if (VR_PANJANG.has(vr)) { p += 2; panjang = dv.getUint32(p, true); p += 4 }
      else { panjang = dv.getUint16(p, true); p += 2 }
    } else {
      vr = VR_IMPLISIT[tag] ?? ''
      panjang = dv.getUint32(p, true); p += 4
    }

    if (panjang === 0xffffffff) {
      // Panjang tak ditentukan: hanya sah untuk runtun dan untuk data piksel
      // terkapsul. Keduanya dilewati sampai penanda akhirnya.
      const batas = lewatiTakTentu(dv, p, akhir)
      peta.set(tag, { vr: vr || 'SQ', awal: p, panjang: batas - p })
      p = batas
      continue
    }
    if (panjang < 0 || p + panjang > akhir) break
    peta.set(tag, { vr, awal: p, panjang })
    // Isi runtun tidak ditelusuri; lihat keterangan di atas.
    p += panjang
  }
  return peta
}

function lewatiTakTentu(dv: DataView, mulai: number, akhir: number): number {
  let p = mulai
  let dalam = 1
  while (p + 8 <= akhir) {
    const tag = tagDari(dv.getUint16(p, true), dv.getUint16(p + 2, true))
    const panjang = dv.getUint32(p + 4, true)
    p += 8
    if (tag === T.akhirRuntun) { dalam--; if (dalam === 0) return p }
    else if (panjang === 0xffffffff) dalam++
    else if (tag !== T.akhirButir) p += panjang
  }
  return akhir
}

function teks(dv: DataView, u?: Unsur): string | undefined {
  if (!u || u.panjang <= 0) return undefined
  let s = ''
  for (let i = 0; i < u.panjang; i++) s += String.fromCharCode(dv.getUint8(u.awal + i))
  return s.replace(/\0+$/, '').trim()
}

/** Angka dari VR teks (DS/IS) maupun biner (US/SS/UL/SL/FL/FD). */
function angka(dv: DataView, u?: Unsur): number | undefined {
  if (!u || u.panjang <= 0) return undefined
  if (u.vr === 'US') return dv.getUint16(u.awal, true)
  if (u.vr === 'SS') return dv.getInt16(u.awal, true)
  if (u.vr === 'UL') return dv.getUint32(u.awal, true)
  if (u.vr === 'SL') return dv.getInt32(u.awal, true)
  if (u.vr === 'FL') return dv.getFloat32(u.awal, true)
  if (u.vr === 'FD') return dv.getFloat64(u.awal, true)
  const t = teks(dv, u)
  if (t == null) return undefined
  // Nilai bernilai jamak ditulis dipisah "\": ambil yang pertama.
  const x = Number.parseFloat(t.split('\\')[0])
  return Number.isFinite(x) ? x : undefined
}

export function bacaDicom(buffer: ArrayBuffer): Hasil<Citra> {
  if (buffer.byteLength < 140) return { ok: false, alasan: 'File is too small to be a DICOM image' }
  const dv = new DataView(buffer)

  // Berkas Part 10 diawali 128 oktet kosong lalu tanda "DICM".
  const tanda = String.fromCharCode(dv.getUint8(128), dv.getUint8(129), dv.getUint8(130), dv.getUint8(131))
  if (tanda !== 'DICM') {
    return { ok: false, alasan: 'Not a DICOM Part 10 file — the DICM marker is missing. Raw PACS streams and other image formats are not read here.' }
  }

  // Grup meta selalu Explicit VR Little Endian, apa pun sintaks datasetnya.
  const meta = susuri(dv, 132, buffer.byteLength, true)
  const panjangMeta = angka(dv, meta.get(T.panjangMetaGrup))
  const sintaks = teks(dv, meta.get(T.sintaksTransfer)) ?? SINTAKS_IMPLISIT

  if (NAMA_MAMPAT[sintaks]) {
    return { ok: false, alasan: `This file is ${NAMA_MAMPAT[sintaks]} compressed. Only uncompressed DICOM is read here — decoding it wrongly would produce an image that looks like a finding rather than an error. Ask for an uncompressed export.` }
  }
  if (sintaks === SINTAKS_BIG_ENDIAN) {
    return { ok: false, alasan: 'This file is Explicit VR Big Endian, a retired transfer syntax that is not read here.' }
  }
  if (sintaks !== SINTAKS_IMPLISIT && sintaks !== SINTAKS_EKSPLISIT) {
    return { ok: false, alasan: `Unsupported transfer syntax ${sintaks}` }
  }

  const metaAkhir = panjangMeta != null && meta.get(T.panjangMetaGrup)
    ? meta.get(T.panjangMetaGrup)!.awal + meta.get(T.panjangMetaGrup)!.panjang + panjangMeta
    : 132
  const ds = susuri(dv, metaAkhir, buffer.byteLength, sintaks === SINTAKS_EKSPLISIT)

  const baris = angka(dv, ds.get(T.baris))
  const kolom = angka(dv, ds.get(T.kolom))
  if (!baris || !kolom) return { ok: false, alasan: 'The file carries no image dimensions (Rows/Columns)' }

  const sampel = angka(dv, ds.get(T.sampelPerPiksel)) ?? 1
  if (sampel !== 1) {
    return { ok: false, alasan: 'Colour images (ultrasound, screenshots) are not read here — only single-channel CT, MR, CR and DX.' }
  }

  const piksel = ds.get(T.dataPiksel)
  if (!piksel || piksel.panjang <= 0) return { ok: false, alasan: 'The file carries no pixel data' }
  if (piksel.vr === 'SQ') {
    return { ok: false, alasan: 'Pixel data is encapsulated, which means it is compressed. Only uncompressed DICOM is read here.' }
  }

  const bitAlokasi = angka(dv, ds.get(T.bitDialokasikan)) ?? 16
  if (bitAlokasi !== 8 && bitAlokasi !== 16) {
    return { ok: false, alasan: `Unsupported bit depth (${bitAlokasi} bits allocated)` }
  }
  const bertanda = (angka(dv, ds.get(T.representasiPiksel)) ?? 0) === 1
  const oktetPerPiksel = bitAlokasi / 8
  const bingkai = Math.max(1, Math.floor(angka(dv, ds.get(T.jumlahBingkai)) ?? 1))
  const perBingkai = baris * kolom
  const total = perBingkai * bingkai

  if (piksel.panjang < total * oktetPerPiksel) {
    return { ok: false, alasan: 'Pixel data is shorter than the stated image size — the file is truncated' }
  }

  const kemiringan = angka(dv, ds.get(T.kemiringan)) ?? 1
  const intersep = angka(dv, ds.get(T.intersep)) ?? 0

  const nilai = new Float32Array(total)
  let minimum = Infinity, maksimum = -Infinity
  for (let i = 0; i < total; i++) {
    const off = piksel.awal + i * oktetPerPiksel
    const mentah = oktetPerPiksel === 1
      ? (bertanda ? dv.getInt8(off) : dv.getUint8(off))
      : (bertanda ? dv.getInt16(off, true) : dv.getUint16(off, true))
    const v = mentah * kemiringan + intersep
    nilai[i] = v
    if (v < minimum) minimum = v
    if (v > maksimum) maksimum = v
  }

  const jarak = teks(dv, ds.get(T.jarakPiksel))?.split('\\').map(Number)
  const posisi = teks(dv, ds.get(T.posisiPasien))?.split('\\').map(Number)

  return {
    ok: true,
    data: {
      baris, kolom, bingkai,
      modalitas: teks(dv, ds.get(T.modalitas)) ?? 'OT',
      nilai, minimum, maksimum,
      pusatBawaan: angka(dv, ds.get(T.pusatJendela)),
      lebarBawaan: angka(dv, ds.get(T.lebarJendela)),
      terbalik: (teks(dv, ds.get(T.fotometrik)) ?? 'MONOCHROME2') === 'MONOCHROME1',
      jarakPiksel: jarak && jarak.length >= 2 && jarak.every(Number.isFinite) ? [jarak[0], jarak[1]] : undefined,
      tebalIrisMm: angka(dv, ds.get(T.tebalIris)),
      nomorIris: angka(dv, ds.get(T.nomorIris)),
      posisiZ: posisi && posisi.length >= 3 && Number.isFinite(posisi[2]) ? posisi[2] : undefined,
      deskripsiSeri: teks(dv, ds.get(T.deskripsiSeri)),
    },
  }
}

// ── Jendela (VOI LUT) ───────────────────────────────────────────────────────

export interface Jendela { nama: string; pusat: number; lebar: number; catatan: string }

// Ambang dalam Hounsfield, jadi hanya sahih untuk CT. Pada MR nilai piksel
// tidak punya satuan mutlak — angka yang sama tidak berarti jaringan yang
// sama — sehingga preset ini SENGAJA tidak ditawarkan di luar CT.
export const JENDELA_CT: Jendela[] = [
  { nama: 'Lung', pusat: -600, lebar: 1500, catatan: 'Air, emphysema, nodules and interstitial pattern' },
  { nama: 'Mediastinum', pusat: 50, lebar: 400, catatan: 'Vessels, nodes, fat planes' },
  { nama: 'Abdomen', pusat: 60, lebar: 400, catatan: 'Solid organs and bowel wall' },
  { nama: 'Liver', pusat: 60, lebar: 150, catatan: 'Narrow — makes low-contrast liver lesions visible' },
  { nama: 'Bone', pusat: 300, lebar: 1500, catatan: 'Cortex and trabeculae; soft tissue is deliberately lost' },
  { nama: 'Brain', pusat: 40, lebar: 80, catatan: 'Grey-white differentiation' },
  { nama: 'Stroke', pusat: 35, lebar: 35, catatan: 'Very narrow — early ischaemic hypodensity' },
  { nama: 'Subdural', pusat: 50, lebar: 130, catatan: 'Thin collections that a brain window hides against bone' },
  { nama: 'Temporal bone', pusat: 700, lebar: 4000, catatan: 'Ossicles and the otic capsule' },
  { nama: 'CT angiography', pusat: 300, lebar: 600, catatan: 'Opacified lumen against wall and calcium' },
]

/**
 * Jendela linear DICOM (PS3.3 C.11.2.1.2) — rumusnya persis seperti yang
 * ditulis standar, bukan penskalaan min-maks.
 *
 * Ini bukan kerewelan: penskalaan min-maks membuat setiap citra tampak
 * "bagus" dan justru menghapus informasi yang menjadi inti radiologi. Perbedaan
 * antara materi kelabu dan putih hanya sekitar 10 HU pada rentang 4.000 HU;
 * hanya jendela sempit yang menampakkannya, dan hanya nilai HU yang sebenarnya
 * yang membuat "hipodens" punya arti.
 */
export function terapkanJendela(
  citra: Citra, pusat: number, lebar: number, bingkai = 0,
): Uint8ClampedArray {
  const n = citra.baris * citra.kolom
  const mulai = Math.min(Math.max(0, bingkai), citra.bingkai - 1) * n
  const keluar = new Uint8ClampedArray(n)
  const l = Math.max(1, lebar)
  const bawah = pusat - 0.5 - (l - 1) / 2
  const atas = pusat - 0.5 + (l - 1) / 2
  for (let i = 0; i < n; i++) {
    const v = citra.nilai[mulai + i]
    let y: number
    if (v <= bawah) y = 0
    else if (v > atas) y = 255
    else y = ((v - (pusat - 0.5)) / (l - 1) + 0.5) * 255
    keluar[i] = citra.terbalik ? 255 - y : y
  }
  return keluar
}

/** Jendela awal: ikut berkas kalau ada, kalau tidak dari sebaran nilainya. */
export function jendelaAwal(citra: Citra): { pusat: number; lebar: number } {
  if (citra.pusatBawaan != null && citra.lebarBawaan != null && citra.lebarBawaan > 0) {
    return { pusat: citra.pusatBawaan, lebar: citra.lebarBawaan }
  }
  const lebar = Math.max(1, citra.maksimum - citra.minimum)
  return { pusat: citra.minimum + lebar / 2, lebar }
}

/** Satu seri diurutkan menurut posisi pada sumbu pasien, bukan nama berkas. */
export function urutkanSeri<T extends { citra: Citra }>(irisan: T[]): T[] {
  return [...irisan].sort((a, b) => {
    const za = a.citra.posisiZ, zb = b.citra.posisiZ
    if (za != null && zb != null && za !== zb) return za - zb
    return (a.citra.nomorIris ?? 0) - (b.citra.nomorIris ?? 0)
  })
}

/** Nilai di satu titik — angka HU inilah yang membuat sebuah temuan bisa dinamai. */
export function nilaiDi(citra: Citra, x: number, y: number, bingkai = 0): number | null {
  if (x < 0 || y < 0 || x >= citra.kolom || y >= citra.baris) return null
  const n = citra.baris * citra.kolom
  return citra.nilai[bingkai * n + y * citra.kolom + x]
}

// Rentang Hounsfield yang disepakati luas. Dipakai untuk MENAMAI angka yang
// terbaca, bukan untuk menegakkan diagnosis — lemak dan darah segar bisa
// bertumpang tindih dengan jaringan lunak, dan itu ikut dikatakan.
const RENTANG_HU: Array<[number, number, string]> = [
  [-1100, -900, 'Air'],
  [-900, -500, 'Lung parenchyma'],
  [-500, -100, 'Fat (upper part of this range overlaps soft tissue)'],
  [-100, -30, 'Fat'],
  [-30, 15, 'Water / simple fluid'],
  [15, 40, 'Soft tissue'],
  [40, 60, 'Muscle, or acute haemorrhage'],
  [60, 100, 'Acute blood, or contrast-enhanced tissue'],
  [100, 300, 'Contrast, or early calcification'],
  [300, 3000, 'Bone or dense calcification'],
]

export function tafsirHu(hu: number): string {
  for (const [a, b, nama] of RENTANG_HU) if (hu >= a && hu < b) return nama
  return hu < -1100 ? 'Below air — outside the scanned volume' : 'Metal or beam-hardening artefact'
}
