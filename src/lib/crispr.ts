import { komplemenBalik, persenGC } from './genomics'

// ─────────────────────────────────────────────────────────────────────────────
// PERANCANG PANDUAN CRISPR-Cas9 (SpCas9, PAM = NGG).
//
// Yang dihitung di sini nyata dan bisa diperiksa: letak PAM pada kedua untai,
// protospacer 20 nukleotida di hulunya, letak potongan tumpul tiga basa dari
// PAM, kandungan GC, adanya rangkaian TTTT yang menghentikan transkripsi U6,
// homopolimer, dan pencarian sasaran-lain (off-target) DI DALAM urutan yang
// diberikan berdasarkan kecocokan wilayah benih.
//
// YANG TIDAK DIHITUNG, dan tidak boleh dikira dihitung: sasaran-lain di
// SELURUH genom manusia. Itu memerlukan indeks genom utuh, bukan satu urutan
// yang ditempelkan pengguna. Panduan yang bersih di sini tetap WAJIB diperiksa
// terhadap genom sebelum dipakai untuk apa pun. Skor di sini adalah penyaring
// awal untuk merancang dan belajar, bukan izin untuk memotong DNA.
// ─────────────────────────────────────────────────────────────────────────────

export interface Panduan {
  /** Protospacer 20 nt, 5'->3' pada untai yang ditargetkan. */
  spacer: string
  pam: string
  untai: '+' | '-'
  /** Posisi awal spacer pada untai maju, berbasis 1. */
  posisi: number
  /** Potongan tumpul Cas9: tiga basa di hulu PAM. */
  posisiPotong: number
  gc: number
  /** Kecocokan wilayah benih di tempat lain PADA URUTAN INI saja. */
  sasaranLain: number
  /** 0..100 — penyaring awal, bukan jaminan. */
  skor: number
  catatan: string[]
}

const PANJANG_SPACER = 20
const PANJANG_BENIH = 12

function homopolimerTerpanjang(s: string): number {
  let maks = 1, jalan = 1
  for (let i = 1; i < s.length; i++) {
    jalan = s[i] === s[i - 1] ? jalan + 1 : 1
    if (jalan > maks) maks = jalan
  }
  return maks
}

/** Berapa kali benih muncul pada kedua untai urutan ini. */
function hitungKemunculanBenih(urutan: string, benih: string): number {
  let n = 0
  for (const s of [urutan, komplemenBalik(urutan)]) {
    let i = s.indexOf(benih)
    while (i >= 0) { n++; i = s.indexOf(benih, i + 1) }
  }
  return n
}

/**
 * Cari panduan pada satu urutan.
 *
 * Aturan penilaian diambil dari hal-hal yang berulang kali terbukti penting:
 * GC 40–70% (terlalu rendah membuat ikatan lemah, terlalu tinggi membuatnya
 * lengket dan kurang khas), tidak ada TTTT (penghenti Pol III yang memotong
 * sgRNA di tengah), tidak ada homopolimer panjang, dan tidak ada kecocokan
 * benih di tempat lain.
 */
export function rancangPanduan(urutanMentah: string, maks = 20): Panduan[] {
  const urutan = urutanMentah.toUpperCase().replace(/[^ACGT]/g, '')
  const out: Panduan[] = []

  const tambah = (spacer: string, pam: string, untai: '+' | '-', posisi: number, posisiPotong: number) => {
    if (spacer.length !== PANJANG_SPACER || /[^ACGT]/.test(spacer)) return
    const gc = persenGC(spacer)
    const benih = spacer.slice(-PANJANG_BENIH)
    // Dirinya sendiri selalu ikut terhitung sekali; sisanya adalah sasaran lain.
    const sasaranLain = Math.max(0, hitungKemunculanBenih(urutan, benih) - 1)
    const catatan: string[] = []
    let skor = 100
    if (gc < 40) { skor -= 25; catatan.push('GC below 40% — weak, unstable binding') }
    else if (gc > 70) { skor -= 20; catatan.push('GC above 70% — sticky and less specific') }
    if (/TTTT/.test(spacer)) { skor -= 40; catatan.push('Contains TTTT, which terminates U6 transcription of the sgRNA') }
    const homo = homopolimerTerpanjang(spacer)
    if (homo >= 5) { skor -= 15; catatan.push(`Homopolymer run of ${homo}`) }
    if (sasaranLain > 0) { skor -= Math.min(40, sasaranLain * 20); catatan.push(`${sasaranLain} seed match(es) elsewhere in this sequence`) }
    if (spacer.startsWith('G')) { skor += 3; catatan.push('Starts with G — transcribes efficiently from a U6 promoter') }
    out.push({ spacer, pam, untai, posisi, posisiPotong, gc, sasaranLain, skor: Math.max(0, Math.min(100, skor)), catatan })
  }

  // Untai maju: PAM NGG, spacer 20 nt tepat di hulunya.
  for (let i = PANJANG_SPACER; i + 2 < urutan.length; i++) {
    if (urutan[i + 1] === 'G' && urutan[i + 2] === 'G') {
      tambah(urutan.slice(i - PANJANG_SPACER, i), urutan.slice(i, i + 3), '+', i - PANJANG_SPACER + 1, i - 3 + 1)
    }
  }
  // Untai balik: PAM di untai balik tampak sebagai CCN pada untai maju.
  for (let i = 0; i + 3 + PANJANG_SPACER <= urutan.length; i++) {
    if (urutan[i] === 'C' && urutan[i + 1] === 'C') {
      const wilayah = urutan.slice(i + 3, i + 3 + PANJANG_SPACER)
      tambah(komplemenBalik(wilayah), komplemenBalik(urutan.slice(i, i + 3)), '-', i + 4, i + 3 + 3)
    }
  }

  return out.sort((a, b) => b.skor - a.skor || a.posisi - b.posisi).slice(0, maks)
}

export interface TemplateHDR {
  kiri: string
  sisipan: string
  kanan: string
  panjangTotal: number
  jarakKePotongan: number
  catatan: string[]
}

/**
 * Susun templat perbaikan terarah homologi untuk mengubah satu posisi.
 *
 * Jarak titik ubah ke letak potongan dilaporkan karena efisiensi HDR jatuh
 * cepat begitu jaraknya melewati sekitar sepuluh basa — sebab kegagalan yang
 * sering tidak disadari saat percobaan tidak membuahkan hasil.
 */
export function templateHDR(
  urutanMentah: string, posisiUbah: number, basaBaru: string, posisiPotong: number, panjangLengan = 40,
): TemplateHDR | null {
  const urutan = urutanMentah.toUpperCase().replace(/[^ACGT]/g, '')
  const i = posisiUbah - 1
  if (i < 0 || i >= urutan.length) return null
  const kiri = urutan.slice(Math.max(0, i - panjangLengan), i)
  const kanan = urutan.slice(i + 1, i + 1 + panjangLengan)
  const jarak = Math.abs(posisiUbah - posisiPotong)
  const catatan = [`The edit sits ${jarak} bp from the cut site`]
  if (jarak > 10) catatan.push('More than 10 bp from the cut — HDR efficiency falls steeply beyond this')
  if (kiri.length < panjangLengan || kanan.length < panjangLengan) catatan.push('Homology arm truncated by the end of the supplied sequence')
  catatan.push('A silent PAM or seed mutation is usually needed so the repaired allele is not cut again')
  return {
    kiri, sisipan: basaBaru.toUpperCase(), kanan,
    panjangTotal: kiri.length + basaBaru.length + kanan.length,
    jarakKePotongan: jarak, catatan,
  }
}
