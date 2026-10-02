// ─────────────────────────────────────────────────────────────────────────────
// BIOLISTRIK JANTUNG — jaringan eksitabel yang benar-benar dihitung, bukan
// animasi yang dibuat menyerupai aritmia.
//
// Ini bagian yang selama ini tidak ada di Panacea. Aplikasi ini sudah bisa
// menggambar jantung, mengalirkan darah lewat ruang-ruangnya, dan menghitung
// skor klinis; tetapi tidak satu pun dari itu menjelaskan MENGAPA aritmia
// terjadi. Alasannya bukan anatomi dan bukan angka — alasannya listrik yang
// berjalan di atas jaringan, dan sifat listrik itu hanya muncul kalau
// persamaannya benar-benar diintegrasikan.
//
// Model: Aliev & Panfilov (1996), "A simple two-variable model of cardiac
// excitation", Chaos Solitons Fractals 7:293-301. Dua variabel:
//
//   du/dt = div(D grad u) - k*u*(u-a)*(u-1) - u*v
//   dv/dt = eps(u,v) * ( -v - kv*u*(u-a-1) )
//   eps(u,v) = eps0 + mu1*v/(u + mu2)
//
// u adalah tegangan tanpa dimensi (0 = istirahat, 1 = puncak depolarisasi),
// v adalah variabel pemulihan yang memerankan refrakteritas. Dipilih justru
// karena sederhana: dua variabel muat berjalan waktu-nyata di telepon genggam,
// sementara restitusi APD dan dinamika ujung gelombang spiralnya sudah cocok
// dengan pengukuran jaringan sungguhan — itulah yang dinilai di makalah
// aslinya.
//
// Yang TIDAK dilakukan berkas ini, dan tidak boleh diklaim di antarmuka:
//   - Ini bukan peta listrik pasien. Tidak ada geometri jantung orang tertentu,
//     tidak ada arah serat, tidak ada Purkinje.
//   - Dua variabel tidak punya arus ion terpisah, jadi tidak bisa memunculkan
//     early afterdepolarization. Risiko torsade hanya bisa DITANDAI dari APD
//     yang memanjang, bukan disimulasikan.
//   - Rencana ablasi di sini adalah eksperimen pada jaringan model. Bukan
//     rencana tindakan.
//
// Semuanya angka murni, tanpa DOM dan tanpa three.js, supaya bisa diuji tanpa
// peramban — dan memang diuji di server/uji/bioelectric.uji.ts. Kesalahan pada
// simulasi seperti ini tidak pernah kelihatan di tangkapan layar: gelombang
// yang berputar tetap indah sambil memakai kecepatan konduksi yang keliru.
// ─────────────────────────────────────────────────────────────────────────────

export interface Parameter {
  /** Ambang eksitasi. Di bawah a rangsangan padam, di atas a merambat. */
  a: number
  /** Kekuatan arus masuk cepat. Di model dua-variabel, I_Na melebur ke sini. */
  k: number
  /**
   * Skala penggerak pemulihan. Di makalah asli ini adalah k yang sama, dipakai
   * di dua tempat sekaligus: amplitudo arus masuk cepat DAN kuatnya dorongan
   * terhadap v. Kedua peran itu dipisah di sini, dan pemisahan ini disengaja.
   * Penyekat kanal natrium hanya menyentuh yang pertama; kalau keduanya ikut
   * turun, memblok natrium justru MEMANJANGKAN potensial aksi sampai 640 ms
   * (terukur) — artefak model yang membalik arah kesimpulan klinisnya. Dengan
   * kv tetap, blok natrium menurunkan CV dan membiarkan APD hampir utuh,
   * seperti yang tercatat pada flecainide.
   */
  kv: number
  /** Laju pemulihan dasar: makin kecil, potensial aksi makin panjang. */
  eps0: number
  mu1: number
  mu2: number
  /** Kopling antar-sel (difusi). Turun berarti konduksi melambat. */
  D: number
}

export const PARAMETER_BAKU: Parameter = { a: 0.15, k: 8, kv: 8, eps0: 0.002, mu1: 0.2, mu2: 0.3, D: 25 }

// Penskalaan waktu dari makalah Aliev-Panfilov: satu satuan waktu model = 12.9 ms.
export const MS_PER_SATUAN = 12.9

// Penskalaan ruang dikalibrasi, bukan ditebak. Dua besaran mengunci satu sama
// lain: kecepatan konduksi model sebanding dengan akar D, dan ukuran fisik satu
// sel dipilih supaya CV planar pada parameter baku jatuh di 0,5 mm/ms — angka
// rujukan untuk miokardium ventrikel manusia yang sehat. D = 25 dipilih justru
// supaya satu sel keluar di sekitar 1 mm, sehingga grid 128 sel benar-benar
// sepotong jaringan 13 cm, bukan lembaran seluas meja.
//
// Yang TIDAK dikalibrasi, dan karena itu menjadi bukti bahwa modelnya waras:
// APD keluar 316 ms dari penskalaan waktu makalah tanpa disetel sama sekali —
// dan APD90 ventrikel manusia memang di kisaran 300 ms.
export const MM_PER_SEL = 0.9289

export interface Jaringan {
  lebar: number
  tinggi: number
  /** Tegangan tanpa dimensi per sel. */
  u: Float32Array
  /** Variabel pemulihan per sel. */
  v: Float32Array
  /** 1 = jaringan menghantar, 0 = parut padat atau lesi ablasi. */
  eksitabel: Uint8Array
  /** Pengali kopling lokal 0..1 — fibrosis difus menurunkannya tanpa memutus. */
  kopling: Float32Array
  /** Waktu model berjalan, dalam satuan waktu Aliev-Panfilov. */
  t: number
  par: Parameter
  /**
   * Blok konduksi sementara: indeks sel yang ditutup, dan waktu model saat
   * mereka dibuka lagi. Inilah yang membuat blok satu arah bisa dibuat dengan
   * jujur — di jantung pun blok itu sementara, ditinggalkan denyut sebelumnya,
   * lalu pulih. Kalau ia permanen, yang dibuat bukan aritmia melainkan lesi.
   */
  _gerbang: Uint32Array | null
  _gerbangSampai: number
  /** Penyangga kerja; jangan dibaca dari luar. */
  _un: Float32Array
  _vn: Float32Array
}

export function buatJaringan(lebar: number, tinggi: number, par: Parameter = PARAMETER_BAKU): Jaringan {
  const n = lebar * tinggi
  const kopling = new Float32Array(n)
  kopling.fill(1)
  const eksitabel = new Uint8Array(n)
  eksitabel.fill(1)
  return {
    lebar, tinggi,
    u: new Float32Array(n),
    v: new Float32Array(n),
    eksitabel,
    kopling,
    t: 0,
    par: { ...par },
    _gerbang: null,
    _gerbangSampai: 0,
    _un: new Float32Array(n),
    _vn: new Float32Array(n),
  }
}

export function bersihkan(j: Jaringan): void {
  j.u.fill(0)
  j.v.fill(0)
  j.t = 0
}

/** Kembalikan jaringan ke keadaan awal termasuk parut dan lesi. */
export function ulangDariAwal(j: Jaringan): void {
  bersihkan(j)
  j.eksitabel.fill(1)
  j.kopling.fill(1)
  j._gerbang = null
  j._gerbangSampai = 0
}

// ── Integrator ───────────────────────────────────────────────────────────────
//
// Euler maju dengan Laplacian lima titik dan dx = 1. Syarat kestabilan difusi
// eksplisit di dua dimensi adalah dt <= dx^2/(4D); dengan D = 25 itu berarti
// dt <= 0,01, dan DT_BAKU diambil di bawahnya dengan margin.
export const DT_BAKU = 0.004

function satuLangkah(j: Jaringan, dt: number): void {
  const { lebar, tinggi, u, v, eksitabel, kopling, _un, _vn } = j
  const { a, k, kv, eps0, mu1, mu2, D } = j.par

  for (let y = 0; y < tinggi; y++) {
    const baris = y * lebar
    for (let x = 0; x < lebar; x++) {
      const i = baris + x
      if (!eksitabel[i]) { _un[i] = 0; _vn[i] = 0; continue }

      const ui = u[i]
      const vi = v[i]
      const gi = kopling[i]

      // Batas tanpa-fluks: tetangga di luar grid atau tetangga yang tidak
      // eksitabel diperlakukan sebagai cermin, sehingga parut dan lesi ablasi
      // benar-benar menyekat, bukan sekadar menggelapkan warna.
      let lap = 0
      if (x > 0 && eksitabel[i - 1]) lap += D * 0.5 * (gi + kopling[i - 1]) * (u[i - 1] - ui)
      if (x < lebar - 1 && eksitabel[i + 1]) lap += D * 0.5 * (gi + kopling[i + 1]) * (u[i + 1] - ui)
      if (y > 0 && eksitabel[i - lebar]) lap += D * 0.5 * (gi + kopling[i - lebar]) * (u[i - lebar] - ui)
      if (y < tinggi - 1 && eksitabel[i + lebar]) lap += D * 0.5 * (gi + kopling[i + lebar]) * (u[i + lebar] - ui)

      const eps = eps0 + (mu1 * vi) / (ui + mu2)
      _un[i] = ui + dt * (lap - k * ui * (ui - a) * (ui - 1) - ui * vi)
      _vn[i] = vi + dt * eps * (-vi - kv * ui * (ui - a - 1))
    }
  }
  j.u.set(_un)
  j.v.set(_vn)
  j.t += dt
}

export function langkah(j: Jaringan, dt: number = DT_BAKU, kali = 1): void {
  for (let n = 0; n < kali; n++) {
    satuLangkah(j, dt)
    if (j._gerbang && j.t >= j._gerbangSampai) {
      for (const i of j._gerbang) j.eksitabel[i] = 1
      j._gerbang = null
    }
  }
}

/** Semua nilai masih berhingga dan dalam rentang yang masuk akal. */
export function stabil(j: Jaringan): boolean {
  for (let i = 0; i < j.u.length; i++) {
    const ui = j.u[i], vi = j.v[i]
    if (!Number.isFinite(ui) || !Number.isFinite(vi)) return false
    if (ui < -0.5 || ui > 1.5 || vi < -0.5 || vi > 6) return false
  }
  return true
}

// ── Rangsangan ───────────────────────────────────────────────────────────────

export function rangsang(j: Jaringan, x0: number, y0: number, lebar: number, tinggi: number, kuat = 1): void {
  for (let y = Math.max(0, y0); y < Math.min(j.tinggi, y0 + tinggi); y++) {
    for (let x = Math.max(0, x0); x < Math.min(j.lebar, x0 + lebar); x++) {
      const i = y * j.lebar + x
      if (j.eksitabel[i]) j.u[i] = kuat
    }
  }
}

/** Rangsang seluruh setengah bidang — dipakai untuk S2 pada protokol silang. */
export function rangsangSetengah(j: Jaringan, sumbu: 'x' | 'y', batas: number, kuat = 1): void {
  for (let y = 0; y < j.tinggi; y++) {
    for (let x = 0; x < j.lebar; x++) {
      const lewat = sumbu === 'x' ? x < batas : y < batas
      if (!lewat) continue
      const i = y * j.lebar + x
      if (j.eksitabel[i]) j.u[i] = kuat
    }
  }
}

// ── Substrat: parut, fibrosis, lesi ablasi ───────────────────────────────────

function acakTetap(benih: number): () => number {
  let s = benih >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Parut padat: bulatan jaringan mati yang menjadi jangkar rotor. */
export function pasangParut(j: Jaringan, cx: number, cy: number, jari: number): void {
  for (let y = 0; y < j.tinggi; y++) {
    for (let x = 0; x < j.lebar; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= jari * jari) j.eksitabel[y * j.lebar + x] = 0
    }
  }
}

/**
 * Fibrosis difus: sebagian sel diputus dan sisanya melemah kopling-nya.
 * Inilah substrat yang membuat jantung tua atau pascainfark rentan — konduksi
 * melambat dan berkelok, bukan karena ada satu lubang besar.
 */
export function pasangFibrosis(j: Jaringan, fraksi: number, benih = 1): void {
  const acak = acakTetap(benih)
  for (let i = 0; i < j.eksitabel.length; i++) {
    if (acak() < fraksi) j.eksitabel[i] = 0
    else j.kopling[i] = 1 - 0.5 * fraksi * acak()
  }
}

/** Lesi ablasi: garis tebal jaringan yang dimatikan. */
export function garisAblasi(j: Jaringan, x0: number, y0: number, x1: number, y1: number, tebal = 3): void {
  const panjang = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  const r = Math.max(1, tebal / 2)
  for (let s = 0; s <= panjang; s++) {
    const cx = x0 + ((x1 - x0) * s) / panjang
    const cy = y0 + ((y1 - y0) * s) / panjang
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (x < 0 || y < 0 || x >= j.lebar || y >= j.tinggi) continue
        const dx = x - cx, dy = y - cy
        if (dx * dx + dy * dy <= r * r) j.eksitabel[y * j.lebar + x] = 0
      }
    }
  }
}

// ── Cincin: reentri anatomik yang bisa dibuktikan, bukan disugestikan ────────
//
// Lembaran dua dimensi memberi rotor fungsional yang berkelana; letaknya
// berpindah dan tidak ada satu pun garis ablasi yang pasti mengenainya. Cincin
// jaringan memberi hal lain: satu-satunya lintasan tertutup diketahui. Ini
// bentuk yang sama dengan flutter atrium yang berputar mengelilingi anulus
// trikuspid — dan alasan mengapa satu garis ablasi dari anulus ke vena kava
// menghentikannya adalah topologi, bukan keberuntungan.

export function buatCincin(lebar: number, tinggi: number, jariDalam: number, jariLuar: number, par: Parameter = PARAMETER_BAKU): Jaringan {
  const j = buatJaringan(lebar, tinggi, par)
  const cx = lebar / 2, cy = tinggi / 2
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy
      const r = Math.hypot(dx, dy)
      if (r < jariDalam || r > jariLuar) j.eksitabel[y * lebar + x] = 0
    }
  }
  return j
}

/** Keliling garis tengah cincin, dalam sel. Ini "panjang lintasan" reentri. */
export function kelilingCincin(jariDalam: number, jariLuar: number): number {
  return 2 * Math.PI * ((jariDalam + jariLuar) / 2)
}

function busur(j: Jaringan, dari: number, sampai: number, kerja: (i: number) => void): void {
  const cx = j.lebar / 2, cy = j.tinggi / 2
  for (let y = 0; y < j.tinggi; y++) {
    for (let x = 0; x < j.lebar; x++) {
      const i = y * j.lebar + x
      if (!j.eksitabel[i]) continue
      let a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx)
      if (a < 0) a += 2 * Math.PI
      let d = dari; if (d < 0) d += 2 * Math.PI
      let s = sampai; if (s < 0) s += 2 * Math.PI
      const di = d <= s ? a >= d && a <= s : a >= d || a <= s
      if (di) kerja(i)
    }
  }
}

/**
 * Blok satu arah yang berumur pendek. Ruas jaringan ditutup sementara, lalu
 * dibuka kembali sendiri pada waktu yang ditentukan — meniru ruas yang masih
 * refrakter ketika denyut prematur lewat, dan sudah pulih ketika gelombang
 * kembali satu putaran kemudian.
 */
export function blokSementara(j: Jaringan, dariSudut: number, sampaiSudut: number, durasi: number): void {
  const kena: number[] = []
  busur(j, dariSudut, sampaiSudut, (i) => { j.u[i] = 0; j.v[i] = 0; j.eksitabel[i] = 0; kena.push(i) })
  j._gerbang = Uint32Array.from(kena)
  j._gerbangSampai = j.t + durasi
}

/** Lama blok satu arah bertahan, dalam satuan waktu model (~65 ms). */
export const DURASI_BLOK = 5

/**
 * Profil satu potensial aksi: u dan v sebagai fungsi waktu SEJAK aktivasi,
 * diambil dari pita jaringan yang benar-benar dijalankan. Dipakai untuk
 * memasang gelombang yang sudah berputar tanpa harus menyalakannya lebih dulu.
 */
export interface ProfilAP { u: Float32Array; v: Float32Array; dt: number; cvModel: number }

export function profilPotensialAksi(par: Parameter, dt = DT_BAKU): ProfilAP {
  const L = 160
  const j = buatJaringan(L, 3, par)
  rangsang(j, 0, 0, 3, 3, 1)
  const x = 40, i = 1 * L + x
  const u: number[] = [], v: number[] = []
  let mulai = -1
  const batas = 250 / dt
  for (let n = 0; n < batas; n++) {
    satuLangkah(j, dt)
    if (mulai < 0) { if (j.u[i] > 0.5) mulai = j.t } else { u.push(j.u[i]); v.push(j.v[i]) }
    if (mulai >= 0 && j.t - mulai > 60) break
  }
  const ukur = ukurPlanar(par, dt)
  return { u: Float32Array.from(u), v: Float32Array.from(v), dt, cvModel: ukur.cvModel || 1 }
}

/**
 * Pasang gelombang yang SUDAH berputar di cincin, bukan menyalakannya.
 *
 * Ini pilihan yang disengaja. Protokol rangsangan apa pun membawa artefaknya
 * sendiri — blok yang bocor, dua gelombang yang bertabrakan — dan artefak itu
 * bisa membunuh reentri karena alasan yang tidak ada hubungannya dengan
 * pertanyaannya. Dengan memasang keadaan awal berupa satu gelombang utuh yang
 * bergerak searah, satu-satunya hal yang menentukan apakah ia bertahan adalah
 * apakah kepalanya bertemu ekornya sendiri: yaitu panjang gelombang terhadap
 * keliling. Persis hukum yang ingin diperlihatkan, tanpa perantara.
 */
export function pasangGelombangBerputar(j: Jaringan, profil: ProfilAP, jariDalam: number, jariLuar: number): void {
  const cx = j.lebar / 2, cy = j.tinggi / 2
  const rTengah = (jariDalam + jariLuar) / 2
  const panjangProfil = profil.u.length
  for (let y = 0; y < j.tinggi; y++) {
    for (let x = 0; x < j.lebar; x++) {
      const i = y * j.lebar + x
      if (!j.eksitabel[i]) continue
      let a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx)
      if (a < 0) a += 2 * Math.PI
      // Kepala gelombang di sudut 0 dan bergerak ke arah sudut membesar;
      // jaringan di belakangnya diaktifkan lebih dulu, jadi jedanya sebanding
      // dengan jarak yang sudah ditempuh sejak melewatinya.
      const jarak = (2 * Math.PI - a) * rTengah
      const jeda = jarak / profil.cvModel
      const n = Math.round(jeda / profil.dt)
      if (n >= 0 && n < panjangProfil) { j.u[i] = profil.u[n]; j.v[i] = profil.v[n] }
      else { j.u[i] = 0; j.v[i] = 0 }
    }
  }
}

/**
 * Nyalakan reentri di cincin lewat rangsangan: satu ruas diblok sementara,
 * lalu jaringan tepat di sebelahnya dirangsang. Dipakai di antarmuka karena
 * inilah yang benar-benar dilakukan di laboratorium elektrofisiologi.
 */
export function induksiCincin(j: Jaringan, sudut = 0): void {
  blokSementara(j, sudut, sudut + 0.42, DURASI_BLOK)
  busur(j, sudut - 0.62, sudut - 0.02, (i) => { j.u[i] = 1 })
}

/** Ablasi radial memotong cincin dari tepi dalam sampai tepi luar. */
export function ablasiRadial(j: Jaringan, sudut: number, tebal = 5): void {
  const cx = j.lebar / 2, cy = j.tinggi / 2
  const r = Math.max(j.lebar, j.tinggi)
  garisAblasi(j, cx, cy, cx + Math.cos(sudut) * r, cy + Math.sin(sudut) * r, tebal)
}

/** Nilai tertinggi u di seluruh jaringan — 0 berarti semua aktivitas padam. */
export function puncakAktivitas(j: Jaringan): number {
  let m = 0
  for (let i = 0; i < j.u.length; i++) if (j.u[i] > m) m = j.u[i]
  return m
}

/** Bagian jaringan yang masih menghantar, 0..1. */
export function fraksiEksitabel(j: Jaringan): number {
  let n = 0
  for (let i = 0; i < j.eksitabel.length; i++) if (j.eksitabel[i]) n++
  return n / j.eksitabel.length
}

// ── Elektrokardiogram semu ───────────────────────────────────────────────────
//
// Rumus baku pendekatan sumber dipol (Gima & Rudy 2002): potensial di satu
// titik jauh sebanding dengan integral grad(u) . grad(1/r) di seluruh jaringan.
// Elektroda sengaja diletakkan di luar bidang (z > 0) supaya r tidak pernah nol.
export function pseudoEkg(j: Jaringan, ex: number, ey: number, ez = 20): number {
  const { lebar, tinggi, u, eksitabel } = j
  let jumlah = 0
  for (let y = 1; y < tinggi - 1; y++) {
    for (let x = 1; x < lebar - 1; x++) {
      const i = y * lebar + x
      if (!eksitabel[i]) continue
      const ux = (u[i + 1] - u[i - 1]) * 0.5
      const uy = (u[i + lebar] - u[i - lebar]) * 0.5
      const dx = x - ex, dy = y - ey
      const r2 = dx * dx + dy * dy + ez * ez
      const r3 = r2 * Math.sqrt(r2)
      jumlah -= (ux * dx + uy * dy) / r3
    }
  }
  return jumlah
}

// ── Titik singular fase: menghitung rotor, bukan menebaknya ──────────────────
//
// Ujung gelombang spiral adalah titik tempat fase tidak terdefinisi. Cara baku
// menemukannya (Bray & Wikswo 2002) adalah menghitung muatan topologis: fase
// dijumlahkan mengelilingi satu kotak 2x2, dan bila hasilnya +-2*pi berarti ada
// satu titik singular di dalamnya. Jumlah titik singular = jumlah rotor, dan
// itulah satu-satunya cara jujur menjawab "apakah aritmia ini masih berjalan".

const U_ACUAN = 0.35
const V_ACUAN = 1.1

function fase(u: number, v: number): number {
  return Math.atan2(v - V_ACUAN, u - U_ACUAN)
}

function selisihFase(a: number, b: number): number {
  let d = b - a
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

export interface TitikSingular { x: number; y: number; muatan: number }

export function titikSingular(j: Jaringan): TitikSingular[] {
  const { lebar, tinggi, u, v, eksitabel } = j
  const hasil: TitikSingular[] = []
  for (let y = 0; y < tinggi - 1; y++) {
    for (let x = 0; x < lebar - 1; x++) {
      const i00 = y * lebar + x, i10 = i00 + 1, i01 = i00 + lebar, i11 = i01 + 1
      if (!eksitabel[i00] || !eksitabel[i10] || !eksitabel[i01] || !eksitabel[i11]) continue
      const f00 = fase(u[i00], v[i00])
      const f10 = fase(u[i10], v[i10])
      const f11 = fase(u[i11], v[i11])
      const f01 = fase(u[i01], v[i01])
      const lingkar = selisihFase(f00, f10) + selisihFase(f10, f11) + selisihFase(f11, f01) + selisihFase(f01, f00)
      const muatan = Math.round(lingkar / (2 * Math.PI))
      if (muatan !== 0) hasil.push({ x, y, muatan })
    }
  }
  return gabungBerdekatan(hasil)
}

// Satu rotor bisa memunculkan beberapa kotak bermuatan yang bersebelahan.
// Tanpa penggabungan ini, satu rotor terhitung sebagai empat.
function gabungBerdekatan(titik: TitikSingular[], radius = 4): TitikSingular[] {
  const hasil: TitikSingular[] = []
  for (const t of titik) {
    const dekat = hasil.find((h) => Math.abs(h.x - t.x) <= radius && Math.abs(h.y - t.y) <= radius && h.muatan === t.muatan)
    if (!dekat) hasil.push({ ...t })
  }
  return hasil
}

export function jumlahRotor(j: Jaringan): number {
  return titikSingular(j).length
}

// ── Pengukuran: kecepatan konduksi, APD, panjang gelombang ───────────────────
//
// Ketiganya diukur dari simulasi yang benar-benar dijalankan pada sebuah pita
// jaringan, bukan dibaca dari tabel. Itu sebabnya efek obat di antarmuka tidak
// perlu dipercaya begitu saja: angkanya keluar dari persamaan yang sama dengan
// yang menggerakkan gambarnya.

export interface UkuranJaringan {
  /** Kecepatan konduksi dalam sel per satuan waktu model. */
  cvModel: number
  /** Kecepatan konduksi dalam mm/ms — sama dengan m/s. */
  cvMmPerMs: number
  /** Durasi potensial aksi 90% dalam satuan waktu model. */
  apdModel: number
  /** APD90 dalam milidetik. */
  apdMs: number
  /** Panjang gelombang = CV x APD, dalam mm. Inti dari seluruh reentri. */
  panjangGelombangMm: number
  /** Benar bila gelombang gagal merambat sama sekali (blok konduksi). */
  blok: boolean
}

const PITA_PANJANG = 120
const PITA_TINGGI = 3

/**
 * Waktu saat u melewati 0,5, diinterpolasi linear di antara dua langkah.
 *
 * Jatuh kembali ke waktu langkah bila kedua sampelnya sama, sehingga tidak
 * pernah membagi nol.
 */
function lintasAmbang(t0: number, t1: number, u0: number, u1: number): number {
  const beda = u1 - u0
  if (!Number.isFinite(beda) || beda === 0) return t1
  const pecahan = (0.5 - u0) / beda
  if (!Number.isFinite(pecahan) || pecahan < 0 || pecahan > 1) return t1
  return t0 + (t1 - t0) * pecahan
}

export function ukurPlanar(par: Parameter, dt = DT_BAKU): UkuranJaringan {
  const j = buatJaringan(PITA_PANJANG, PITA_TINGGI, par)
  rangsang(j, 0, 0, 3, PITA_TINGGI, 1)

  const xA = 15, xB = 45
  const iA = 1 * PITA_PANJANG + xA
  const iB = 1 * PITA_PANJANG + xB
  // Waktu kedatangan diinterpolasi di ANTARA dua langkah, bukan dibulatkan ke
  // langkah terdekat.
  //
  // Kenapa ini penting dan bukan sekadar kerapian: kecepatan konduksi dihitung
  // dari selisih dua waktu kedatangan. Kalau keduanya dibulatkan ke kelipatan
  // dt, selisihnya ikut terkuantisasi, dan CV yang keluar berderau mengikuti
  // ukuran langkah. Terukur pada studi refinement dt = 0,016 sampai 0,0005:
  // orde konvergensi CV yang teramati keluar sebagai 35,80, -34,39, 1,58, 0,41
  // -- angka yang tidak berarti apa-apa. Dengan interpolasi linear pada
  // perlintasan ambang, orde yang sama menjadi 0,98, 0,99, 1,00, 1,00, yaitu
  // orde pertama persis seperti yang diramalkan untuk Euler maju.
  //
  // Jadi yang berderau selama ini adalah PENGUKURANNYA, bukan solvernya.
  let tA = -1, tB = -1
  let uAsebelum = j.u[iA], uBsebelum = j.u[iB], tSebelum = j.t
  const jejak: number[] = []
  const waktu: number[] = []

  // 250 satuan waktu ~ 3,2 detik: cukup untuk gelombang yang sangat lambat
  // sekalipun mencapai xB dan menyelesaikan satu potensial aksi penuh di xA.
  const batas = 250 / dt
  // Berhenti begitu kedua kedatangan tercatat DAN potensial aksi di xA sudah
  // selesai repolarisasi. Tanpa keluar lebih awal, satu pengukuran memakan
  // 62.500 langkah dan panel obat di antarmuka akan membeku setiap kali
  // penggeser digerakkan; dengan ini biasanya cukup sepersepuluhnya.
  let puncakA = 0
  for (let n = 0; n < batas; n++) {
    satuLangkah(j, dt)
    const uA = j.u[iA]
    const uB = j.u[iB]
    if (tA < 0 && uA > 0.5) tA = lintasAmbang(tSebelum, j.t, uAsebelum, uA)
    if (tB < 0 && uB > 0.5) tB = lintasAmbang(tSebelum, j.t, uBsebelum, uB)
    uAsebelum = uA; uBsebelum = uB; tSebelum = j.t
    if (tA >= 0) { jejak.push(uA); waktu.push(j.t); puncakA = Math.max(puncakA, uA) }
    if (!Number.isFinite(uA)) break
    if (tA >= 0 && tB >= 0 && puncakA > 0.5 && uA < 0.02 * puncakA) break
  }

  if (tA < 0 || tB < 0 || tB <= tA) {
    return { cvModel: 0, cvMmPerMs: 0, apdModel: 0, apdMs: 0, panjangGelombangMm: 0, blok: true }
  }

  const cvModel = (xB - xA) / (tB - tA)

  // APD90: dari saat u melewati 0,5 saat naik sampai u turun kembali di bawah
  // 10% puncaknya. Ambang menyusul puncak yang terukur, bukan angka tetap,
  // karena obat mengubah tinggi potensial aksinya juga.
  let puncak = 0
  for (const s of jejak) puncak = Math.max(puncak, s)
  const ambang = 0.1 * puncak
  let apdModel = 0
  for (let n = 1; n < jejak.length; n++) {
    if (jejak[n] < ambang && jejak[n - 1] >= ambang) { apdModel = waktu[n] - tA; break }
  }
  if (apdModel === 0) apdModel = waktu[waktu.length - 1] - tA

  const cvMmPerMs = (cvModel * MM_PER_SEL) / MS_PER_SATUAN
  const apdMs = apdModel * MS_PER_SATUAN
  return {
    cvModel,
    cvMmPerMs,
    apdModel,
    apdMs,
    panjangGelombangMm: cvMmPerMs * apdMs,
    blok: false,
  }
}

// ── Obat antiaritmia ─────────────────────────────────────────────────────────
//
// Pemetaan ke parameter, dan alasan tiap pemetaan:
//
//   Kelas I (penyekat kanal natrium) menurunkan kecepatan naik potensial aksi.
//     Di model dua-variabel, arus masuk cepat itu ada di dalam k, jadi blok
//     natrium diwakili sebagai k yang turun — dan hasilnya memang CV yang
//     turun, persis yang diukur pada jaringan sungguhan.
//   Kelas III (penyekat arus kalium) memperlambat repolarisasi: eps0 turun,
//     APD memanjang.
//   Kelas IV (penyekat kanal kalsium) memendekkan plateau: eps0 naik.
//
// Yang membuat panel ini layak ada sama sekali adalah akibatnya. Panjang
// gelombang = CV x APD. Kelas I memendekkan panjang gelombang, dan panjang
// gelombang yang lebih pendek MEMUDAHKAN reentri di jaringan yang sudah
// berparut. Itulah hasil CAST (Echt dkk., N Engl J Med 1991): flecainide dan
// encainide menekan ektopi pascainfark, lalu menaikkan angka kematian. Di sini
// sebabnya bisa dilihat, bukan dihafal.

export interface Obat {
  /**
   * Fraksi blok kanal natrium, 0..0,9 (kelas I). Antarmuka hanya membuka
   * 0..0,6 sebagai rentang terapeutik; di atas ~0,7 konduksi berhenti sama
   * sekali, dan itu bukan kegagalan simulasi melainkan bentuk toksisitas
   * kelas I — QRS melebar sampai tidak ada lagi yang merambat.
   */
  natrium: number
  /** Fraksi blok arus kalium, 0..0,8 (kelas III). */
  kalium: number
  /** Fraksi blok kanal kalsium, 0..0,6 (kelas IV). */
  kalsium: number
}

export const TANPA_OBAT: Obat = { natrium: 0, kalium: 0, kalsium: 0 }

export function terapkanObat(par: Parameter, obat: Obat): Parameter {
  const natrium = Math.min(Math.max(obat.natrium, 0), 0.9)
  const kalium = Math.min(Math.max(obat.kalium, 0), 0.8)
  const kalsium = Math.min(Math.max(obat.kalsium, 0), 0.6)
  return {
    ...par,
    k: par.k * (1 - natrium),
    eps0: (par.eps0 * (1 + 1.5 * kalsium)) / (1 + 2.5 * kalium),
  }
}

/**
 * APD di atas ambang ini menandai wilayah tempat pemanjangan repolarisasi
 * berhenti melindungi dan mulai membahayakan (QT panjang, torsade de pointes).
 * Model dua-variabel tidak bisa memunculkan afterdepolarization, jadi ini
 * memang penanda, bukan simulasi — dan ditulis begitu di antarmuka.
 */
export const APD_MS_RISIKO_TORSADE = 400

export type Vonis = 'aman' | 'rentan-reentri' | 'risiko-repolarisasi' | 'blok'

/**
 * Penilaian substrat: apakah panjang gelombang masih lebih besar daripada
 * lintasan yang tersedia di sekeliling parut. Bila panjang gelombang lebih
 * pendek daripada keliling halangan, ujung gelombang menemukan jaringan yang
 * sudah pulih ketika ia kembali — dan berputar terus.
 */
export function nilaiSubstrat(ukur: UkuranJaringan, kelilingHalanganMm: number): Vonis {
  if (ukur.blok) return 'blok'
  if (ukur.apdMs > APD_MS_RISIKO_TORSADE) return 'risiko-repolarisasi'
  if (ukur.panjangGelombangMm < kelilingHalanganMm) return 'rentan-reentri'
  return 'aman'
}
