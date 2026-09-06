// ─────────────────────────────────────────────────────────────────────────────
// TEKSTUR JARINGAN — kenapa anatomi tiga dimensi terlihat seperti lilin.
//
// Bahan jaringan di aplikasi ini sudah memakai model fisis lengkap: kekasaran,
// lapisan bening, kilau, sedikit tembus cahaya. Meski begitu hasilnya tetap
// terbaca seperti model lilin, dan penyebabnya satu hal yang tidak bisa
// diperbaiki oleh parameter bahan mana pun: SETIAP PERMUKAAN BERWARNA RATA.
//
// Otot sungguhan tidak pernah berwarna rata. Ia bergaris mengikuti arah
// seratnya, pucat di tempat serat berubah menjadi tendon, gelap di celah
// antar berkas, dan mengilap tidak merata karena fasia yang membungkusnya
// basah di sebagian tempat dan kering di tempat lain. Bintik-bintik itulah
// yang dikenali mata sebagai "jaringan"; tanpanya, permukaan sehalus apa pun
// akan terbaca sebagai bahan buatan.
//
// Berkas ini membangkitkan bintik itu sebagai TEKSTUR, dihitung dan bukan
// diunduh — tidak ada satu bita tambahan yang dikirim ke pengguna, pada
// halaman yang geometrinya saja sudah puluhan megabita.
//
// Semua tekstur dibuat BISA DIULANG (periodik): triplanar menyusunnya
// berdampingan berkali-kali di permukaan tubuh, dan pola yang tidak periodik
// akan memperlihatkan garis sambungan di setiap batas ubin.
// ─────────────────────────────────────────────────────────────────────────────

export type JenisJaringan = 'otot' | 'tulang' | 'organ' | 'pembuluh' | 'lemak' | 'tendon' | 'saraf'

/**
 * Hash bilangan bulat -> [0,1). Tanpa keadaan, sehingga hasilnya selalu sama.
 *
 * Seluruh pencampuran memakai Math.imul, yaitu perkalian 32-bit sungguhan.
 * Versi pertama memakai perkalian bilangan pecahan biasa, dan hasilnya
 * TERUKUR miring: tekstur yang resepnya simetris (7x7) tetap berubah kira-kira
 * satu setengah kali lebih cepat pada satu sumbu daripada sumbu lainnya,
 * karena kedua pengali membungkus berbeda saat dipotong ke 32 bit. Bias itu
 * tidak pernah tampak sebagai galat — ia hanya membuat parenkim organ
 * bergaris seolah berserat, padahal parenkim tidak berserat.
 */
function hash2(x: number, y: number, benih: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(benih | 0, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const halus = (t: number) => t * t * (3 - 2 * t)

/**
 * Derau nilai PERIODIK.
 *
 * Periodenya dipakai untuk membungkus kisi: titik pada x = periode
 * mengambil nilai yang sama dengan x = 0, sehingga ubinnya menyambung tanpa
 * garis. Derau biasa akan menampakkan kotak-kotak di seluruh tubuh.
 */
function derauPeriodik(x: number, y: number, periodeX: number, periodeY: number, benih: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const fx = halus(x - x0), fy = halus(y - y0)
  const bungkus = (v: number, p: number) => ((v % p) + p) % p
  const xa = bungkus(x0, periodeX), xb = bungkus(x0 + 1, periodeX)
  const ya = bungkus(y0, periodeY), yb = bungkus(y0 + 1, periodeY)
  const v00 = hash2(xa, ya, benih), v10 = hash2(xb, ya, benih)
  const v01 = hash2(xa, yb, benih), v11 = hash2(xb, yb, benih)
  return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy
}

export interface Resep {
  /** Berapa kali pola berulang pada satu ubin, arah U dan V. */
  ulangU: number
  ulangV: number
  /** Jumlah oktaf fBm; makin banyak makin halus perinciannya. */
  oktaf: number
  /** Seberapa kuat variasi terangnya, 0..1. */
  kontras: number
  /** Variasi kekasaran; inilah yang memecah kilau menjadi tidak rata. */
  variasiKasar: number
}

// Angka-angka ini adalah pilihan visual, bukan pengukuran, dan ditulis begitu.
// Oktaf jaringan BERSERAT sengaja sedikit. Dengan empat oktaf, oktaf
// tertingginya berperiode 208 pada tekstur selebar 512 — sekitar dua setengah
// piksel per sel — dan derau sehalus itu praktis tak berarah lagi. Ia menutupi
// keterarahan oktaf dasarnya, sehingga hasilnya teranyam seperti kain alih-alih
// berserat seperti otot. Parenkim boleh berlapis-lapis justru karena ia memang
// tidak berarah.
//
// Nilai pertama terlalu lemah dan itu TERUKUR: energi perincian gambar hanya
// naik dari 13,77 ke 14,68 — teksturnya sampai ke piksel, tetapi tidak cukup
// untuk terbaca sebagai jaringan. Nilai sekarang kira-kira satu setengah kali
// lipatnya, masih di bawah setengah supaya tekstur menghias permukaan dan
// bukan menggantikan warnanya.
// Yang TIDAK sembarang adalah perbandingan ulangU terhadap ulangV: rasio
// itulah arah seratnya. Otot 26:3 berarti garis memanjang; organ 7:7 berarti
// bercak tanpa arah, karena parenkim memang tidak berserat searah.
export const RESEP: Record<JenisJaringan, Resep> = {
  otot: { ulangU: 30, ulangV: 2, oktaf: 2, kontras: 0.48, variasiKasar: 0.44 },
  tendon: { ulangU: 38, ulangV: 2, oktaf: 2, kontras: 0.3, variasiKasar: 0.34 },
  tulang: { ulangU: 9, ulangV: 9, oktaf: 5, kontras: 0.2, variasiKasar: 0.34 },
  organ: { ulangU: 7, ulangV: 7, oktaf: 4, kontras: 0.34, variasiKasar: 0.36 },
  pembuluh: { ulangU: 22, ulangV: 3, oktaf: 2, kontras: 0.24, variasiKasar: 0.28 },
  lemak: { ulangU: 5, ulangV: 5, oktaf: 3, kontras: 0.4, variasiKasar: 0.26 },
  saraf: { ulangU: 26, ulangV: 2, oktaf: 2, kontras: 0.22, variasiKasar: 0.24 },
}

/** Peta tinggi fBm periodik, nilai 0..1, ukuran N x N. */
export function petaTinggi(jenis: JenisJaringan, N: number, benih = 1): Float32Array {
  const r = RESEP[jenis]
  // Tiap oktaf menggandakan periode kisinya. Begitu periode itu melewati
  // separuh lebar tekstur, satu piksel melompati lebih dari satu sel kisi:
  // deraunya tidak lagi tersampel, ia beralias — dan alias itu memutus
  // periodisitas, sehingga ubinnya memperlihatkan garis sambungan. Oktafnya
  // karena itu dibatasi oleh resolusi, bukan dipakai apa adanya.
  const batas = Math.max(1, Math.floor(Math.log2(N / (2 * Math.max(r.ulangU, r.ulangV)))) + 1)
  const oktafSah = Math.max(1, Math.min(r.oktaf, batas))
  const out = new Float32Array(N * N)
  let min = Infinity, maks = -Infinity
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      let amp = 1, jum = 0, total = 0
      let pu = r.ulangU, pv = r.ulangV
      for (let o = 0; o < oktafSah; o++) {
        const x = (i / N) * pu, y = (j / N) * pv
        jum += amp * derauPeriodik(x, y, pu, pv, benih + o * 977)
        total += amp
        amp *= 0.5
        // Oktaf berikutnya menggandakan periode; periode harus tetap bulat
        // supaya kisinya tetap membungkus dan ubinnya tetap menyambung.
        pu *= 2; pv *= 2
      }
      const v = jum / total
      out[j * N + i] = v
      if (v < min) min = v
      if (v > maks) maks = v
    }
  }
  // Dinormalkan supaya rentangnya penuh, apa pun oktafnya.
  const rentang = Math.max(1e-6, maks - min)
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - min) / rentang
  return out
}

/**
 * Peta pola: peta tinggi disimpan APA ADANYA pada 0..255.
 *
 * Versi pertama menyimpan PENGALI yang berpusat di 1,0, dan itu keliru secara
 * mendasar: satu kanal 8-bit hanya mewakili 0..1, sehingga separuh rentangnya
 * terpotong di 255. Terukur: rata-rata teksturnya menjadi 247,6 dari 255 —
 * nyaris putih polos — sehingga permukaannya kembali rata tanpa satu pun tanda
 * kesalahan; shadernya tetap berjalan, teksturnya tetap terikat, polanya saja
 * yang sudah musnah sebelum sampai ke GPU.
 *
 * Yang disimpan sekarang adalah POLANYA pada rentang penuh. Pemusatan di
 * sekitar satu dikerjakan di shader, tempat angkanya tidak dibatasi 0..1.
 */
export function petaPola(tinggi: Float32Array, N: number): Uint8Array {
  const px = new Uint8Array(N * N * 4)
  for (let i = 0; i < N * N; i++) {
    const b = Math.max(0, Math.min(255, Math.round(tinggi[i] * 255)))
    px[i * 4] = b; px[i * 4 + 1] = b; px[i * 4 + 2] = b; px[i * 4 + 3] = 255
  }
  return px
}

export interface Tekstur {
  /** Pola 0..255 pada keempat kanal; pemusatannya dikerjakan di shader. */
  pola: Uint8Array
  ukuran: number
  /** Amplitudo modulasi terang dan kekasaran, diteruskan ke shader. */
  kontras: number
  variasiKasar: number
}

export function buatTekstur(jenis: JenisJaringan, N = 256, benih = 1): Tekstur {
  const t = petaTinggi(jenis, N, benih)
  const r = RESEP[jenis]
  return { pola: petaPola(t, N), ukuran: N, kontras: r.kontras, variasiKasar: r.variasiKasar }
}

/** Seberapa "berarah" sebuah tekstur — dipakai menguji bahwa serat memang searah. */
export function keterarahan(tinggi: Float32Array, N: number): number {
  let bedaU = 0, bedaV = 0
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const c = tinggi[j * N + i]
      bedaU += Math.abs(c - tinggi[j * N + ((i + 1) % N)])
      bedaV += Math.abs(c - tinggi[((j + 1) % N) * N + i])
    }
  }
  // > 1 berarti berubah lebih cepat searah U, jadi garisnya membujur di V.
  return bedaU / Math.max(1e-9, bedaV)
}
