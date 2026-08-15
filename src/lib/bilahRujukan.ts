// ─────────────────────────────────────────────────────────────────────────────
// Bilah rentang rujukan — bentuk yang dipakai alat komposisi tubuh.
//
// MENGAPA BARU SEKARANG, DAN MENGAPA HANYA UNTUK SEBAGIAN ANGKA.
//
// Logikanya sudah ada sejak lama di rujukanTubuh.ts, lengkap dengan populasi
// pembanding dan perubahan terkecil yang layak disebut nyata — tetapi hanya
// tampil sebagai teks di halaman /tubuh, tidak pernah sebagai gambar. Itu
// kekurangan yang nyata: bilah mendatar menyampaikan "di sebelah mana angka ini
// berada" dalam sekali lihat, dan kalimat sepanjang apa pun tidak dapat
// menandinginya.
//
// TETAPI BILAH ITU HANYA BOLEH DIGAMBAR UNTUK ANGKA YANG MEMANG PUNYA BATAS
// TERBIT. Inilah sebabnya ia tidak dipasang pada semua metrik. Saturasi oksigen,
// HRV, dan denyut istirahat tidak punya batas tunggal yang berlaku bagi semua
// orang — 48 bpm adalah kebugaran pada pelari dan gangguan hantaran pada lansia
// yang memakai penyekat beta, dan menggambar satu bilah untuk keduanya berarti
// menyatakan sesuatu yang tidak diketahui. Untuk metrik semacam itu, yang
// ditampilkan tetap rentang kebiasaan Anda sendiri.
//
// Yang di bawah ini punya batas yang benar-benar diterbitkan dan berlaku luas,
// dan populasinya disebutkan pada tiap bilah.
//
// TIGA HAL YANG SENGAJA BERBEDA DARI ALAT YANG MENJADI RUJUKAN BENTUK:
//
//   1. ZONA "NORMAL" TIDAK DIWARNAI HIJAU DAN "OVER" TIDAK DIWARNAI MERAH.
//      Warna itu menyatakan penilaian moral atas angka yang sebagian besarnya
//      tidak dapat diubah dalam sehari, dan pada orang yang sedang berjuang
//      dengan berat badannya, satu bilah merah setiap pagi bekerja persis
//      seperti hukuman. Zona dibedakan dengan tebal-tipis dan garis pemisah;
//      penandanya jelas, penilaiannya tidak ditempelkan.
//
//   2. NAMA ZONANYA DITULIS APA ADANYA, bukan "Under/Normal/Over" yang terbaca
//      seperti nilai rapor. Yang tertulis adalah batas angkanya.
//
//   3. POPULASI PEMBANDING SELALU IKUT. Batas IMT Asia-Pasifik berbeda dari
//      batas WHO umum, dan memakai yang keliru menggeser seseorang dari
//      "normal" menjadi "berlebih" tanpa satu gram pun berubah pada tubuhnya.
// ─────────────────────────────────────────────────────────────────────────────

export interface ZonaRujukan {
  /** Batas bawah zona ini. Zona pertama boleh mulai dari 0. */
  dari: number
  label: string
}

export interface BilahRujukan {
  kunci: string
  label: string
  /** Sudah DIBULATKAN sebagaimana ditampilkan — lihat catatan pada zonaDari. */
  nilai: number
  /** Berapa angka di belakang koma saat ditampilkan. */
  desimal: number
  satuan: string
  /** Ujung kiri dan kanan bilah — bukan batas normal, melainkan batas GAMBAR. */
  minGambar: number
  maksGambar: number
  zona: ZonaRujukan[]
  /** Zona tempat nilainya berada sekarang. */
  zonaKini: string
  populasi: string
  sumber: string
}

const SUMBER_WHO_ASIA = 'batas IMT Asia-Pasifik (WHO/IASO/IOTF 2000), dipakai luas di Indonesia'
const SUMBER_WHO_WHR = 'batas rasio pinggang-panggul WHO 2008'
const SUMBER_LEMAK = 'nilai lazim dalam ajaran gizi dan fisiologi olahraga baku, bukan kutipan satu penelitian'

/**
 * Zona tempat sebuah nilai berada.
 *
 * NILAI YANG DIPAKAI HARUS SUDAH DIBULATKAN SEPERTI YANG DITAMPILKAN. Percobaan
 * pertama menggolongkan memakai nilai penuh sementara layar menampilkan nilai
 * bulat, dan hasilnya terbaca sebagai pertentangan: rasio 0,8979 tampil sebagai
 * "0,9" tetapi digolongkan "di bawah batas (<0,9)". Pembaca yang melihat itu
 * akan menyimpulkan aplikasinya salah hitung — dan ia benar untuk curiga, sebab
 * angka yang ditampilkan memang bukan angka yang dinilai.
 */
function zonaDari(zona: ZonaRujukan[], nilai: number): string {
  let kini = zona[0]?.label ?? ''
  for (const z of zona) if (nilai >= z.dari) kini = z.label
  return kini
}

/** Bulatkan ke jumlah desimal tampilan, lalu golongkan dengan nilai itu juga. */
function bulat(n: number, desimal: number): number {
  const f = 10 ** desimal
  return Math.round(n * f) / f
}

/**
 * IMT dengan batas ASIA-PASIFIK, bukan batas WHO umum.
 *
 * Perbedaannya bukan perkara selera: pada batas WHO umum, kelebihan berat mulai
 * pada 25 dan obesitas pada 30; pada batas Asia-Pasifik, keduanya turun menjadi
 * 23 dan 25 karena pada perawakan Asia risiko kardiometabolik meningkat pada
 * IMT yang lebih rendah. Memakai batas yang keliru menggeser seseorang lintas
 * kategori tanpa satu gram pun berubah pada tubuhnya — karena itu batas yang
 * dipakai disebutkan pada bilahnya.
 */
export function bilahImt(beratKg?: number, tinggiCm?: number): BilahRujukan | null {
  if (!beratKg || !tinggiCm || tinggiCm < 50) return null
  const m = tinggiCm / 100
  const imt = beratKg / (m * m)
  if (!Number.isFinite(imt) || imt <= 0) return null
  const zona: ZonaRujukan[] = [
    { dari: 0, label: 'kurang (<18,5)' },
    { dari: 18.5, label: 'cukup (18,5-22,9)' },
    { dari: 23, label: 'berlebih (23-24,9)' },
    { dari: 25, label: 'obesitas (>=25)' },
  ]
  const tampil = bulat(imt, 1)
  return {
    kunci: 'imt',
    label: 'Indeks massa tubuh',
    nilai: tampil,
    desimal: 1,
    satuan: 'kg/m²',
    minGambar: 15,
    maksGambar: 35,
    zona,
    zonaKini: zonaDari(zona, tampil),
    populasi: 'dewasa Asia-Pasifik; batas berbeda pada anak, ibu hamil, dan atlet berotot besar',
    sumber: SUMBER_WHO_ASIA,
  }
}

export function bilahLemakTubuh(persen?: number, sex?: string): BilahRujukan | null {
  if (!persen || !Number.isFinite(persen)) return null
  const perempuan = sex === 'F'
  const zona: ZonaRujukan[] = perempuan
    ? [
        { dari: 0, label: 'sangat rendah (<21%)' },
        { dari: 21, label: 'lazim (21-32%)' },
        { dari: 33, label: 'tinggi (>=33%)' },
      ]
    : [
        { dari: 0, label: 'sangat rendah (<8%)' },
        { dari: 8, label: 'lazim (8-19%)' },
        { dari: 20, label: 'tinggi (>=20%)' },
      ]
  const tampilLemak = bulat(persen, 1)
  return {
    kunci: 'bodyFatPct',
    label: 'Lemak tubuh',
    nilai: tampilLemak,
    desimal: 1,
    satuan: '%',
    minGambar: 5,
    maksGambar: perempuan ? 45 : 40,
    zona,
    zonaKini: zonaDari(zona, tampilLemak),
    populasi: perempuan ? 'perempuan dewasa' : 'laki-laki dewasa',
    sumber: SUMBER_LEMAK,
  }
}

/**
 * Rasio pinggang-panggul.
 *
 * Batasnya berbeda menurut jenis kelamin, dan itu bukan penyesuaian sopan
 * santun melainkan perbedaan sebaran lemak yang nyata: penumpukan lemak
 * viseral pada laki-laki mulai memberi risiko pada rasio yang lebih tinggi
 * daripada pada perempuan.
 */
export function bilahRasioPinggang(pinggangCm?: number, panggulCm?: number, sex?: string): BilahRujukan | null {
  if (!pinggangCm || !panggulCm || panggulCm <= 0) return null
  const rasio = pinggangCm / panggulCm
  if (!Number.isFinite(rasio) || rasio <= 0) return null
  const batas = sex === 'F' ? 0.85 : 0.9
  const zona: ZonaRujukan[] = [
    { dari: 0, label: `di bawah batas (<${batas.toFixed(2).replace('.', ',')})` },
    { dari: batas, label: `di atas batas (>=${batas.toFixed(2).replace('.', ',')})` },
  ]
  const tampilRasio = bulat(rasio, 2)
  return {
    kunci: 'whr',
    label: 'Rasio pinggang-panggul',
    nilai: tampilRasio,
    desimal: 2,
    satuan: '',
    minGambar: 0.6,
    maksGambar: 1.2,
    zona,
    zonaKini: zonaDari(zona, tampilRasio),
    populasi: sex === 'F' ? 'perempuan dewasa' : 'laki-laki dewasa',
    sumber: SUMBER_WHO_WHR,
  }
}

/** Seluruh bilah yang dapat digambar dari angka yang ada. */
export function bilahTersedia(v: Record<string, unknown>): BilahRujukan[] {
  const n = (k: string) => (typeof v[k] === 'number' ? (v[k] as number) : undefined)
  const sex = typeof v.sex === 'string' ? v.sex : undefined
  return [
    bilahImt(n('weightKg'), n('heightCm')),
    bilahLemakTubuh(n('bodyFatPct'), sex),
    bilahRasioPinggang(n('waistCm'), n('hipCm'), sex),
  ].filter((b): b is BilahRujukan => b !== null)
}
