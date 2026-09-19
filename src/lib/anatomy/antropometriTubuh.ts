// ─────────────────────────────────────────────────────────────────────────────
// Bentuk tubuh parametrik dari ukuran nyata — bukan angka ajaib.
//
// MENGAPA BERKAS INI ADA.
// Avatar personal sebelumnya dirakit dari bola, silinder dan kotak bertumpuk
// dengan jari-jari yang ditulis langsung di kode: 0.68 untuk bahu, 0.43 untuk
// pinggang, 0.52 untuk panggul. Angka-angka itu tidak berasal dari mana pun.
// Akibatnya dua orang dengan tinggi dan berat yang sangat berbeda tetap
// menghasilkan sosok yang hampir sama, dan tidak ada satu pun bilangan di layar
// yang dapat ditelusuri ke ukuran tubuh siapa pun.
//
// DUA LANDASAN YANG DIPAKAI DI SINI, KEDUANYA DAPAT DIPERIKSA.
//
// 1. PANJANG SEGMEN — proporsi Drillis & Contini (1966) terhadap tinggi badan,
//    sebagaimana direproduksi di Winter, "Biomechanics and Motor Control of
//    Human Movement". Ini tabel baku biomekanika, bukan tafsiran: tinggi bahu
//    0.818H, tinggi trokanter 0.530H, tinggi lutut 0.285H, dan seterusnya.
//    Tabel ini memberi KERANGKA (di mana tiap penampang berada secara
//    vertikal). Ia tidak memberi KETEBALAN.
//
// 2. KETEBALAN — tidak ditebak, melainkan diikat oleh kekekalan massa.
//    Volume tubuh = massa / densitas. Densitas tubuh manusia utuh berada di
//    kisaran sempit ~1.01-1.06 g/cm3 (dasar yang sama dipakai persamaan
//    Siri dan Brozek untuk komposisi tubuh). Jadi seluruh lingkar diskalakan
//    oleh satu faktor k yang diselesaikan secara numerik sampai VOLUME MESH
//    YANG BENAR-BENAR DIHASILKAN sama dengan massa/densitas.
//
//    Inilah bedanya dengan angka ajaib: hasilnya dapat difalsifikasi. Hitung
//    volume mesh keluaran, bandingkan dengan massa/densitas; kalau meleset,
//    berkas ini salah. Penjaganya: scripts/uji/antropometri-tubuh.mts.
//
// YANG TIDAK DIKLAIM BERKAS INI.
// Ini BUKAN pemindaian, bukan rekonstruksi fotogrametrik, dan bukan ukuran
// klinis. Ia model parametrik yang digerakkan ukuran yang diberikan pengguna.
// Bentuk yang dihasilkan sejauh ukuran masukannya — tidak lebih. Ketika suatu
// saat ada backend rekonstruksi sungguhan, yang diganti adalah SUMBER BENTUK
// di sini, bukan perendernya.
// ─────────────────────────────────────────────────────────────────────────────

/** Proporsi tinggi-badan (H) dari Drillis & Contini (1966), via Winter. */
export const PROPORSI_DRILLIS_CONTINI = {
  tinggiKepala: 0.130,
  tinggiBahu: 0.818,
  lebarBahu: 0.259,
  tinggiDada: 0.720,
  tinggiSiku: 0.630,
  tinggiPergelanganTangan: 0.485,
  tinggiTrokanter: 0.530,
  lebarPanggul: 0.191,
  tinggiLutut: 0.285,
  tinggiPergelanganKaki: 0.039,
  panjangLenganAtas: 0.186,
  panjangLenganBawah: 0.146,
  panjangPaha: 0.245,
  panjangBetis: 0.246,
  panjangTelapakKaki: 0.152,
} as const

/**
 * Fraksi massa segmen terhadap massa tubuh total (Winter, dari studi kadaver
 * Dempster). Dipakai sebagai PATOKAN KEDUA yang dapat diperiksa: dengan
 * anggapan densitas hampir seragam antar segmen, pembagian VOLUME model harus
 * mendekati pembagian massa terbitan ini.
 *
 * Tanpa patokan ini, kekekalan massa saja masih membolehkan sosok dengan
 * tungkai terlalu gemuk dan batang tubuh terlalu kurus — total volumenya benar,
 * tetapi pembagiannya salah. Itu benar-benar terjadi pada versi pertama.
 */
export const FRAKSI_MASSA_WINTER = {
  kepalaLeher: 0.081,
  batangTubuh: 0.497,
  lenganAtas: 0.028,
  lenganBawah: 0.016,
  tangan: 0.006,
  paha: 0.100,
  betis: 0.0465,
  telapakKaki: 0.0145,
} as const

/** Kepala+batang tubuh, dua lengan penuh, dua tungkai penuh. */
export const BAGIAN_MASSA = {
  torso: FRAKSI_MASSA_WINTER.kepalaLeher + FRAKSI_MASSA_WINTER.batangTubuh,
  lengan: 2 * (FRAKSI_MASSA_WINTER.lenganAtas + FRAKSI_MASSA_WINTER.lenganBawah + FRAKSI_MASSA_WINTER.tangan),
  tungkai: 2 * (FRAKSI_MASSA_WINTER.paha + FRAKSI_MASSA_WINTER.betis + FRAKSI_MASSA_WINTER.telapakKaki),
} as const

export const SUMBER_MASSA =
  'Winter, Biomechanics and Motor Control of Human Movement — fraksi massa segmen terhadap massa tubuh total (Dempster).'

export const SUMBER_PROPORSI =
  'Drillis & Contini (1966), proporsi segmen terhadap tinggi badan, sebagaimana direproduksi di Winter, Biomechanics and Motor Control of Human Movement.'

/** Kisaran densitas tubuh utuh (g/cm3) yang dipakai literatur komposisi tubuh. */
export const DENSITAS_TUBUH_MIN = 1.01
export const DENSITAS_TUBUH_MAKS = 1.06
export const DENSITAS_TUBUH_LAZIM = 1.035

export interface UkuranTubuh {
  tinggiCm: number
  massaKg: number
  /** 'L' | 'P'; memengaruhi rasio bahu-panggul, bukan tinggi segmen. */
  jenisKelamin?: 'L' | 'P'
}

/**
 * Satu penampang melintang tubuh: elips pada ketinggian tertentu.
 * Penampang tubuh mendekati elips jauh lebih baik daripada lingkaran — itulah
 * sebabnya lingkar dada dan lebar dada bisa sangat berbeda pada orang yang sama.
 */
export interface Penampang {
  nama: string
  /** Ketinggian dari telapak kaki, dalam meter. */
  y: number
  /** Setengah-sumbu sisi (lebar/2), meter. */
  a: number
  /** Setengah-sumbu depan-belakang (tebal/2), meter. */
  b: number
}

export interface BentukTubuh {
  /** Penampang batang tubuh, dari selangkangan ke puncak kepala. */
  penampang: Penampang[]
  /**
   * Penampang SATU tungkai, dari pergelangan kaki ke selangkangan.
   * Volumenya dihitung dua kali, dan dirender dua kali. Kalau tungkai ikut
   * dimasukkan ke `penampang`, tubuh bagian bawah menjadi satu kolom tunggal:
   * volumenya konsisten secara aritmetika tetapi sosoknya berkaki satu.
   */
  tungkai: Penampang[]
  /** Faktor skala lingkar hasil penyelesaian kekekalan massa. */
  skalaLingkar: number
  /** Volume mesh hasil, m3. */
  volumeM3: number
  /** Volume sasaran dari massa/densitas, m3. */
  volumeSasaranM3: number
  /** Selisih relatif |volume - sasaran| / sasaran. */
  residuRelatif: number
  densitasDipakai: number
  sumber: string
}

/**
 * Keliling elips — aproksimasi Ramanujan, galat < 1e-5 untuk rasio sumbu yang
 * ditemui pada tubuh manusia. Dipakai agar "lingkar dada" yang dilaporkan
 * benar-benar keliling penampangnya, bukan keliling lingkaran pengganti.
 */
export function kelilingElips(a: number, b: number): number {
  if (a < 0 || b < 0) throw new Error('setengah-sumbu elips tidak boleh negatif')
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
}

/**
 * Volume benda putar bertingkat: tiap pasang penampang berdekatan diperlakukan
 * sebagai frustum elips. Rumusnya kelanjutan langsung dari frustum kerucut,
 * dengan luas lingkaran (pi r^2) diganti luas elips (pi a b):
 *
 *   V = (h/3) * pi * (a1*b1 + a2*b2 + sqrt(a1*b1*a2*b2))
 *
 * Ini yang dipakai sebagai definisi volume tubuh di sini, dan yang sama persis
 * dipakai uji untuk memverifikasi kekekalan massanya.
 */
export function volumeTangkaPenampang(penampang: Penampang[]): number {
  const urut = [...penampang].sort((x, y) => x.y - y.y)
  let total = 0
  for (let i = 0; i + 1 < urut.length; i++) {
    const bawah = urut[i]
    const atas = urut[i + 1]
    const h = atas.y - bawah.y
    if (h <= 0) continue
    const l1 = bawah.a * bawah.b
    const l2 = atas.a * atas.b
    total += (h / 3) * Math.PI * (l1 + l2 + Math.sqrt(l1 * l2))
  }
  return total
}

/**
 * Kerangka penampang pada skala lingkar = 1. Ketinggian tiap penampang berasal
 * dari proporsi Drillis & Contini; rasio lebar-terhadap-tebal per bagian tubuh
 * ditetapkan di sini sebagai bentuk dasar yang kemudian DISKALAKAN SERAGAM
 * sampai volumenya benar. Nilai rasio itu sengaja konservatif dan hanya
 * menentukan proporsi relatif, bukan ukuran mutlak.
 */
function kerangka(tinggiM: number, jenisKelamin: 'L' | 'P'): { torso: Penampang[]; tungkai: Penampang[] } {
  const P = PROPORSI_DRILLIS_CONTINI
  const H = tinggiM
  // Perempuan: panggul relatif lebih lebar terhadap bahu. Satu-satunya tempat
  // jenis kelamin ikut menentukan bentuk; tinggi segmen tidak dibedakan.
  const bahu = jenisKelamin === 'P' ? 0.92 : 1.0
  const panggul = jenisKelamin === 'P' ? 1.10 : 1.0
  // Kalibrasi: bentuk dasar di bawah menentukan bagaimana volume total terbagi
  // antar segmen, dan versi pertama membaginya salah — tungkai 36.9% terhadap
  // batang tubuh 51.7%, padahal fraksi massa terbitan Winter adalah 32.2% dan
  // 57.8%. Karena volume tumbuh dengan kuadrat ukuran linear, koreksinya adalah
  // akar dari rasio fraksi: sqrt(57.8/51.7)=1.057 dan sqrt(32.2/36.9)=0.934.
  // Bukan angka selera: uji memeriksa pembagian hasilnya terhadap tabel Winter.
  const KAL_TORSO = 1.057
  const KAL_TUNGKAI = 0.934

  // a = setengah lebar, b = setengah tebal, keduanya sebagai pecahan tinggi.
  const torso: Penampang[] = [
    { nama: 'selangkangan', y: 0.500 * H, a: 0.082 * H * KAL_TORSO * panggul, b: 0.070 * H * KAL_TORSO * panggul },
    { nama: 'panggul', y: 0.560 * H, a: (P.lebarPanggul / 2) * H * KAL_TORSO * panggul, b: 0.072 * H * KAL_TORSO * panggul },
    { nama: 'pinggang', y: 0.630 * H, a: 0.082 * H * KAL_TORSO, b: 0.062 * H * KAL_TORSO },
    { nama: 'dada', y: P.tinggiDada * H, a: 0.100 * H * KAL_TORSO * bahu, b: 0.075 * H * KAL_TORSO },
    { nama: 'bahu', y: P.tinggiBahu * H, a: (P.lebarBahu / 2) * H * KAL_TORSO * bahu, b: 0.068 * H * KAL_TORSO },
    { nama: 'leher', y: 0.850 * H, a: 0.035 * H * KAL_TORSO, b: 0.035 * H * KAL_TORSO },
    { nama: 'kepala-tengah', y: 0.935 * H, a: 0.048 * H * KAL_TORSO, b: 0.052 * H * KAL_TORSO },
    { nama: 'puncak-kepala', y: 1.0 * H, a: 0.012 * H * KAL_TORSO, b: 0.013 * H * KAL_TORSO },
  ]

  // SATU tungkai. Lebarnya kira-kira separuh lebar tubuh bawah, karena ada dua.
  const tungkai: Penampang[] = [
    { nama: 'pergelangan-kaki', y: P.tinggiPergelanganKaki * H, a: 0.026 * H * KAL_TUNGKAI, b: 0.030 * H * KAL_TUNGKAI },
    { nama: 'betis', y: 0.165 * H, a: 0.040 * H * KAL_TUNGKAI, b: 0.042 * H * KAL_TUNGKAI },
    { nama: 'lutut', y: P.tinggiLutut * H, a: 0.036 * H * KAL_TUNGKAI, b: 0.038 * H * KAL_TUNGKAI },
    { nama: 'paha-bawah', y: 0.380 * H, a: 0.048 * H * KAL_TUNGKAI, b: 0.050 * H * KAL_TUNGKAI },
    { nama: 'paha-atas', y: 0.450 * H, a: 0.058 * H * KAL_TUNGKAI, b: 0.060 * H * KAL_TUNGKAI },
    // Puncak tungkai adalah SELANGKANGAN (0.500H), bukan trokanter (0.530H):
    // trokanter adalah penanda tulang di sisi panggul dan letaknya lebih TINGGI
    // daripada selangkangan, jadi memakainya sebagai ujung atas kaki membuat
    // tungkai menembus panggul. Uji menangkap persis kekeliruan itu.
    { nama: 'pangkal-paha', y: 0.500 * H, a: 0.062 * H * KAL_TUNGKAI, b: 0.064 * H * KAL_TUNGKAI },
  ]

  return { torso, tungkai }
}

/** Anggota badan diperlakukan terpisah: volumenya ikut dihitung, bukan diabaikan. */
function volumeAnggotaBadan(tinggiM: number, skala: number): number {
  const P = PROPORSI_DRILLIS_CONTINI
  const H = tinggiM
  // Empat silinder elips: 2 lengan (atas+bawah digabung) dan 2 tungkai sudah
  // termasuk di tangkai penampang, jadi di sini HANYA lengan yang dihitung.
  const panjangLengan = (P.panjangLenganAtas + P.panjangLenganBawah) * H
  const a = 0.028 * 0.937 * H * skala
  const b = 0.030 * 0.937 * H * skala
  return 2 * Math.PI * a * b * panjangLengan
}

/**
 * Menyelesaikan bentuk tubuh dari ukuran nyata.
 *
 * Gagal-tertutup: menolak tinggi/massa di luar kisaran manusia, bukan
 * menghasilkan sosok yang tampak masuk akal dari masukan yang tidak masuk akal.
 */
export function selesaikanBentukTubuh(
  ukuran: UkuranTubuh,
  densitas: number = DENSITAS_TUBUH_LAZIM,
): BentukTubuh {
  const { tinggiCm, massaKg } = ukuran
  if (!Number.isFinite(tinggiCm) || tinggiCm < 50 || tinggiCm > 260) {
    throw new Error(`tinggi ${tinggiCm} cm di luar kisaran manusia yang dapat dimodelkan (50-260)`)
  }
  if (!Number.isFinite(massaKg) || massaKg < 3 || massaKg > 400) {
    throw new Error(`massa ${massaKg} kg di luar kisaran manusia yang dapat dimodelkan (3-400)`)
  }
  if (!Number.isFinite(densitas) || densitas < DENSITAS_TUBUH_MIN || densitas > DENSITAS_TUBUH_MAKS) {
    throw new Error(`densitas ${densitas} g/cm3 di luar kisaran tubuh utuh (${DENSITAS_TUBUH_MIN}-${DENSITAS_TUBUH_MAKS})`)
  }

  const tinggiM = tinggiCm / 100
  const jenisKelamin = ukuran.jenisKelamin === 'P' ? 'P' : 'L'
  const dasar = kerangka(tinggiM, jenisKelamin)

  // densitas g/cm3 -> kg/m3 dikali 1000. volume m3 = massa / (densitas*1000).
  const volumeSasaranM3 = massaKg / (densitas * 1000)

  // Volume tumbuh dengan kuadrat skala lingkar (a dan b masing-masing linear),
  // jadi penyelesaiannya tertutup, tanpa perlu iterasi:
  //   V(k) = k^2 * V(1)  ->  k = sqrt(Vsasaran / V(1))
  // Tungkai dihitung DUA KALI: dua kaki yang benar-benar dirender harus ikut
  // dua kali dalam volume, kalau tidak klaim kekekalan massa tidak sesuai
  // dengan sosok yang muncul di layar.
  const volumeSatuan =
    volumeTangkaPenampang(dasar.torso) +
    2 * volumeTangkaPenampang(dasar.tungkai) +
    volumeAnggotaBadan(tinggiM, 1)
  if (volumeSatuan <= 0) throw new Error('volume kerangka dasar bukan bilangan positif')
  const skalaLingkar = Math.sqrt(volumeSasaranM3 / volumeSatuan)

  const skalakan = (ps: Penampang[]) => ps.map((p) => ({ ...p, a: p.a * skalaLingkar, b: p.b * skalaLingkar }))
  const penampang = skalakan(dasar.torso)
  const tungkai = skalakan(dasar.tungkai)
  const volumeM3 =
    volumeTangkaPenampang(penampang) +
    2 * volumeTangkaPenampang(tungkai) +
    volumeAnggotaBadan(tinggiM, skalaLingkar)

  return {
    penampang,
    tungkai,
    skalaLingkar,
    volumeM3,
    volumeSasaranM3,
    residuRelatif: Math.abs(volumeM3 - volumeSasaranM3) / volumeSasaranM3,
    densitasDipakai: densitas,
    sumber: SUMBER_PROPORSI,
  }
}

/** Lingkar terukur pada sebuah penampang bernama, dalam cm. */
export function lingkarPenampangCm(bentuk: BentukTubuh, nama: string): number {
  const p = bentuk.penampang.find((x) => x.nama === nama)
  if (!p) throw new Error(`penampang '${nama}' tidak ada pada bentuk ini`)
  return kelilingElips(p.a, p.b) * 100
}

/**
 * Interpolasi Catmull-Rom satu dimensi. Dipakai untuk menyisipkan cincin di
 * antara penampang terbitan supaya permukaannya melengkung mulus, bukan
 * bersudut di tiap penampang.
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

export interface MeshTubuh {
  /** xyz berurutan, meter, titik asal di antara kedua telapak kaki. */
  posisi: Float32Array
  indeks: Uint32Array
  /** Jumlah cincin setelah penghalusan. */
  jumlahCincin: number
  /** Titik per cincin. */
  titikPerCincin: number
}

/**
 * Membangun permukaan tubuh kontinu dengan me-loft penampang elips.
 *
 * Ini yang menggantikan bola/silinder/kotak bertumpuk pada avatar lama. Bentuk
 * yang dihasilkan adalah SATU permukaan menyambung, sehingga siluetnya berubah
 * mengikuti ukuran alih-alih memperlihatkan sambungan antar primitif.
 *
 * Geometri murni: tidak menyentuh Three.js, supaya dapat diuji tanpa WebGL.
 */
export function bangunMeshTubuh(
  sumber: BentukTubuh | Penampang[],
  opsi: { segmen?: number; sisipan?: number } = {},
): MeshTubuh {
  const segmen = Math.max(8, Math.floor(opsi.segmen ?? 48))
  const sisipan = Math.max(0, Math.floor(opsi.sisipan ?? 5))

  // Menerima bentuk utuh (batang tubuh) atau daftar penampang apa adanya,
  // supaya tungkai dapat di-loft dengan kode yang sama persis dan tidak ada
  // pembangun permukaan kedua yang bisa hanyut dari yang pertama.
  const masuk = Array.isArray(sumber) ? sumber : sumber.penampang
  const dasar = [...masuk].sort((x, y) => x.y - y.y)
  if (dasar.length < 3) throw new Error('perlu sedikitnya tiga penampang untuk membentuk permukaan')

  // Sisipkan cincin antara tiap pasang penampang dengan Catmull-Rom.
  const ambil = (i: number) => dasar[Math.max(0, Math.min(dasar.length - 1, i))]
  const cincin: { y: number; a: number; b: number }[] = []
  for (let i = 0; i + 1 < dasar.length; i++) {
    const p0 = ambil(i - 1), p1 = ambil(i), p2 = ambil(i + 1), p3 = ambil(i + 2)
    const langkah = sisipan + 1
    for (let s = 0; s < langkah; s++) {
      const t = s / langkah
      cincin.push({
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
        a: Math.max(1e-4, catmullRom(p0.a, p1.a, p2.a, p3.a, t)),
        b: Math.max(1e-4, catmullRom(p0.b, p1.b, p2.b, p3.b, t)),
      })
    }
  }
  cincin.push({ ...dasar[dasar.length - 1] })

  const posisi = new Float32Array(cincin.length * segmen * 3)
  let k = 0
  for (const c of cincin) {
    for (let s = 0; s < segmen; s++) {
      const sudut = (s / segmen) * Math.PI * 2
      posisi[k++] = Math.cos(sudut) * c.a
      posisi[k++] = c.y
      posisi[k++] = Math.sin(sudut) * c.b
    }
  }

  const indeks = new Uint32Array((cincin.length - 1) * segmen * 6)
  let j = 0
  for (let r = 0; r + 1 < cincin.length; r++) {
    for (let s = 0; s < segmen; s++) {
      const s2 = (s + 1) % segmen
      const a = r * segmen + s
      const b = r * segmen + s2
      const c = (r + 1) * segmen + s
      const d = (r + 1) * segmen + s2
      indeks[j++] = a; indeks[j++] = c; indeks[j++] = b
      indeks[j++] = b; indeks[j++] = c; indeks[j++] = d
    }
  }

  return { posisi, indeks, jumlahCincin: cincin.length, titikPerCincin: segmen }
}

export const BATAS_KEBENARAN_BENTUK =
  'Bentuk ini diturunkan dari tinggi, massa dan jenis kelamin yang diberikan pengguna melalui proporsi segmen terbitan dan kekekalan massa. Ia bukan pemindaian, bukan rekonstruksi fotogrametrik, dan bukan ukuran klinis.'
