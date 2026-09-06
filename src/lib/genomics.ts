// ─────────────────────────────────────────────────────────────────────────────
// INTI GENOMIKA — urutan, kodon, dan akibat varian terhadap protein.
//
// Semua di berkas ini adalah PERHITUNGAN, bukan tabel hasil yang disalin: tabel
// kodon standar, translasi, pembacaan bingkai, dan penerapan varian dihitung
// dari urutan yang diberikan. Itu penting karena keluaran yang salah di sini
// tidak terlihat salah — "MVHLTPEEK" dan "MVHLTPVEK" sama-sama tampak seperti
// protein, padahal yang kedua adalah sel sabit.
//
// Yang TIDAK dikerjakan berkas ini, dan tidak boleh dikira dikerjakan:
// pemanggilan basa (basecalling) dari sinyal nanopore, penyejajaran ke genom
// rujukan, dan penilaian patogenisitas varian baru. Ketiganya butuh model dan
// basis data yang tidak ada di dalam aplikasi ini.
// ─────────────────────────────────────────────────────────────────────────────

export type Basa = 'A' | 'C' | 'G' | 'T' | 'U' | 'N'

const KOMPLEMEN: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G', U: 'A', N: 'N',
  a: 't', t: 'a', g: 'c', c: 'g', u: 'a', n: 'n',
}

/** Bersihkan urutan: buang spasi, angka, dan baris judul FASTA. */
export function bersihkanUrutan(teks: string): string {
  return teks
    .split('\n')
    .filter((b) => !b.startsWith('>') && !b.startsWith(';'))
    .join('')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
}

export function komplemenBalik(urutan: string): string {
  let out = ''
  for (let i = urutan.length - 1; i >= 0; i--) out += KOMPLEMEN[urutan[i]] ?? 'N'
  return out
}

export function persenGC(urutan: string): number {
  if (!urutan.length) return 0
  let gc = 0
  for (const b of urutan) if (b === 'G' || b === 'C' || b === 'g' || b === 'c') gc++
  return Number(((gc / urutan.length) * 100).toFixed(2))
}

/** Tabel kodon standar (NCBI translation table 1). */
export const KODON: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W', CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
}

/** Nama tiga huruf asam amino, untuk penulisan varian gaya HGVS. */
export const ASAM_AMINO: Record<string, string> = {
  A: 'Ala', R: 'Arg', N: 'Asn', D: 'Asp', C: 'Cys', E: 'Glu', Q: 'Gln', G: 'Gly',
  H: 'His', I: 'Ile', L: 'Leu', K: 'Lys', M: 'Met', F: 'Phe', P: 'Pro', S: 'Ser',
  T: 'Thr', W: 'Trp', Y: 'Tyr', V: 'Val', '*': 'Ter',
}

/** Terjemahkan urutan pengkode menjadi protein. Berhenti di kodon stop. */
export function terjemahkan(urutan: string, berhentiDiStop = true): string {
  let out = ''
  for (let i = 0; i + 2 < urutan.length; i += 3) {
    const aa = KODON[urutan.slice(i, i + 3)] ?? 'X'
    if (aa === '*' && berhentiDiStop) return out
    out += aa
  }
  return out
}

export interface ORF {
  /** Untai: +1..+3 atau -1..-3, seperti penulisan bingkai baca yang lazim. */
  bingkai: number
  /** Posisi mulai pada untai maju, berbasis 1. */
  mulai: number
  panjang: number
  protein: string
}

/**
 * Cari kerangka baca terbuka pada keenam bingkai.
 *
 * Panjang minimum ada alasannya: tanpa batas, urutan acak apa pun menghasilkan
 * puluhan "gen" pendek yang tidak berarti apa-apa, dan daftar yang penuh
 * kebisingan lebih buruk daripada daftar kosong.
 */
export function cariORF(urutan: string, minAsamAmino = 30): ORF[] {
  const out: ORF[] = []
  const maju = urutan.toUpperCase()
  const balik = komplemenBalik(maju)
  for (const arah of [1, -1]) {
    const s = arah === 1 ? maju : balik
    for (let f = 0; f < 3; f++) {
      let i = f
      while (i + 2 < s.length) {
        if (s.slice(i, i + 3) === 'ATG') {
          let j = i
          let protein = ''
          while (j + 2 < s.length) {
            const aa = KODON[s.slice(j, j + 3)] ?? 'X'
            if (aa === '*') break
            protein += aa
            j += 3
          }
          if (protein.length >= minAsamAmino) {
            const mulai = arah === 1 ? i + 1 : s.length - (j + 3) + 1
            out.push({ bingkai: arah * (f + 1), mulai, panjang: protein.length * 3 + 3, protein })
            i = j + 3
            continue
          }
        }
        i += 3
      }
    }
  }
  return out.sort((a, b) => b.protein.length - a.protein.length)
}

/**
 * Suhu leleh primer.
 *
 * Untuk primer pendek (<14 basa) dipakai aturan Wallace; untuk yang lebih
 * panjang dipakai rumus dengan koreksi garam (Howley), yang jauh lebih dekat
 * dengan kenyataan pada kondisi PCR biasa. Aturan Wallace pada primer 25 basa
 * meleset belasan derajat — cukup untuk membuat reaksi gagal.
 */
export function suhuLeleh(primer: string, konsentrasiNaMol = 0.05): number {
  const s = primer.toUpperCase()
  const n = s.length
  if (!n) return 0
  let gc = 0
  for (const b of s) if (b === 'G' || b === 'C') gc++
  if (n < 14) return 2 * (n - gc) + 4 * gc
  const fraksiGC = gc / n
  const tm = 81.5 + 16.6 * Math.log10(konsentrasiNaMol) + 41 * fraksiGC - 500 / n
  return Number(tm.toFixed(1))
}

export type JenisVarian = 'silent' | 'missense' | 'nonsense' | 'frameshift' | 'in-frame indel' | 'start-lost'

export interface AkibatVarian {
  jenis: JenisVarian
  proteinRujukan: string
  proteinVarian: string
  /** Posisi asam amino pertama yang berubah, berbasis 1; 0 kalau tidak ada. */
  posisiAA: number
  aaRujukan: string
  aaVarian: string
  /** Penulisan gaya HGVS protein, mis. p.Glu7Val. */
  hgvsProtein: string
}

/**
 * Terapkan satu varian pada urutan pengkode dan hitung akibatnya pada protein.
 *
 * `posisi` berbasis 1 terhadap urutan pengkode (c.), sesuai kebiasaan HGVS.
 * Substitusi memakai `alt` sepanjang `ref`; insersi memakai ref kosong; delesi
 * memakai alt kosong.
 */
export function terapkanVarian(
  cds: string, posisi: number, ref: string, alt: string,
): AkibatVarian {
  const s = cds.toUpperCase()
  const i = posisi - 1
  const sebelum = s.slice(0, i)
  const sesudah = s.slice(i + ref.length)
  const varian = sebelum + alt.toUpperCase() + sesudah

  const pRujukan = terjemahkan(s)
  const pVarian = terjemahkan(varian)

  const geser = (alt.length - ref.length) % 3 !== 0
  let posisiAA = 0
  for (let k = 0; k < Math.max(pRujukan.length, pVarian.length); k++) {
    if (pRujukan[k] !== pVarian[k]) { posisiAA = k + 1; break }
  }
  const aaR = posisiAA ? pRujukan[posisiAA - 1] ?? '' : ''
  const aaV = posisiAA ? pVarian[posisiAA - 1] ?? '' : ''

  let jenis: JenisVarian
  if (geser) jenis = 'frameshift'
  else if (posisiAA === 1 && aaR === 'M' && aaV !== 'M') jenis = 'start-lost'
  else if (alt.length !== ref.length) jenis = 'in-frame indel'
  else if (pRujukan === pVarian) jenis = 'silent'
  else if (pVarian.length < pRujukan.length && aaV === '') jenis = 'nonsense'
  else jenis = 'missense'

  const hgvsProtein = posisiAA === 0
    ? 'p.(=)'
    : jenis === 'frameshift'
      ? `p.${ASAM_AMINO[aaR] ?? aaR}${posisiAA}${ASAM_AMINO[aaV] ?? (aaV || 'Xaa')}fs`
      : jenis === 'nonsense'
        ? `p.${ASAM_AMINO[aaR] ?? aaR}${posisiAA}Ter`
        : `p.${ASAM_AMINO[aaR] ?? aaR}${posisiAA}${ASAM_AMINO[aaV] ?? aaV}`

  return { jenis, proteinRujukan: pRujukan, proteinVarian: pVarian, posisiAA, aaRujukan: aaR, aaVarian: aaV, hgvsProtein }
}

export interface RingkasBacaan {
  jumlah: number
  totalBasa: number
  panjangRerata: number
  n50: number
  gcPersen: number
  mutuRerata: number | null
}

/**
 * Ringkasan mutu sekumpulan bacaan — ukuran yang benar-benar dipakai untuk
 * menilai satu proses sekuensing nanopore: N50, bukan panjang rata-rata.
 *
 * N50 adalah panjang bacaan yang, bila seluruh bacaan diurut dari panjang ke
 * pendek, setengah dari total basa berada pada bacaan sepanjang itu atau lebih.
 * Ia dipakai karena rata-rata mudah ditipu oleh ribuan bacaan pendek.
 */
export function ringkasBacaan(bacaan: Array<{ seq: string; qual?: string }>): RingkasBacaan {
  if (!bacaan.length) return { jumlah: 0, totalBasa: 0, panjangRerata: 0, n50: 0, gcPersen: 0, mutuRerata: null }
  const panjang = bacaan.map((r) => r.seq.length).sort((a, b) => b - a)
  const total = panjang.reduce((a, b) => a + b, 0)
  let jalan = 0
  let n50 = 0
  for (const p of panjang) {
    jalan += p
    if (jalan >= total / 2) { n50 = p; break }
  }
  let gc = 0
  for (const r of bacaan) for (const b of r.seq.toUpperCase()) if (b === 'G' || b === 'C') gc++

  // Skor Phred berbasis ASCII 33 (Sanger/Illumina 1.8+ dan FASTQ nanopore).
  // Rata-rata diambil atas PELUANG GALAT, bukan atas skornya: skor Phred adalah
  // logaritma, dan merata-ratakan logaritma memberi angka yang terlalu bagus.
  let jumlahQ = 0, nQ = 0
  for (const r of bacaan) {
    if (!r.qual) continue
    for (const c of r.qual) { jumlahQ += Math.pow(10, -(c.charCodeAt(0) - 33) / 10); nQ++ }
  }
  const mutuRerata = nQ ? Number((-10 * Math.log10(jumlahQ / nQ)).toFixed(2)) : null

  return {
    jumlah: bacaan.length,
    totalBasa: total,
    panjangRerata: Math.round(total / bacaan.length),
    n50,
    gcPersen: Number(((gc / total) * 100).toFixed(2)),
    mutuRerata,
  }
}

/** Baca FASTQ sederhana (empat baris per bacaan). */
export function bacaFastq(teks: string): Array<{ nama: string; seq: string; qual: string }> {
  const baris = teks.split('\n').map((b) => b.trim()).filter(Boolean)
  const out: Array<{ nama: string; seq: string; qual: string }> = []
  for (let i = 0; i + 3 < baris.length; i += 4) {
    if (!baris[i].startsWith('@')) continue
    out.push({ nama: baris[i].slice(1), seq: baris[i + 1].toUpperCase(), qual: baris[i + 3] })
  }
  return out
}
