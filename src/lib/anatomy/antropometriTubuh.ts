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
//    Volume tubuh = massa / densitas, dan densitasnya sendiri diturunkan dari
//    persen lemak tubuh terukur lewat pembalikan persamaan Siri (1961) bila
//    tersedia. Jadi seluruh lingkar diskalakan
//    oleh satu faktor k sampai JUMLAH VOLUME SEGMEN — batang tubuh, dua
//    tungkai, dua lengan — sama dengan massa/densitas. Karena volume tumbuh
//    dengan kuadrat ukuran linear, k punya bentuk tertutup: k = sqrt(Vsasaran /
//    Vsatuan), tanpa iterasi.
//
//    Yang dijumlahkan adalah volume SEGMEN, sebagaimana lazimnya antropometri,
//    bukan volume gabungan permukaan yang dirender. Anggota badan sengaja
//    dipasang sedikit masuk ke dalam batang tubuh supaya tidak ada sambungan
//    yang terlihat; tumpang tindih di sendi itu urusan tampilan dan tidak
//    mengubah pembukuan volumenya.
//
//    Inilah bedanya dengan angka ajaib: hasilnya dapat difalsifikasi. Jumlahkan
//    volume segmen keluaran, bandingkan dengan massa/densitas; kalau meleset,
//    berkas ini salah. Penjaganya: scripts/uji/antropometri-tubuh.mts.
//
// 3. PEMBAGIAN ANTAR SEGMEN — fraksi massa Winter/Dempster. Kekekalan massa
//    saja masih membolehkan tungkai gemuk di atas batang tubuh kurus; patokan
//    ini yang menahannya, dan uji memeriksa selisihnya dalam satuan poin.
//
// 4. DISTRIBUSI LEMAK — pola android/gynoid. Tanpa ini, tinggi dan berat yang
//    sama selalu menghasilkan sosok yang sama persis, padahal komposisinya bisa
//    jauh berbeda. Distribusi hanya MEMINDAHKAN volume antar bagian; totalnya
//    tetap ditentukan kekekalan massa.
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

/**
 * Kisaran densitas tubuh utuh (g/cm3).
 *
 * KOREKSI TERHADAP VERSI SEBELUMNYA. Batasnya dulu ditulis 1.01-1.06 sebagai
 * "kisaran sempit", dan itu terlalu sempit sampai menolak tubuh nyata yang sah:
 * persamaan Siri memberi D = 1.088 pada 5% lemak tubuh dan D = 1.000 pada 45%.
 * Keduanya manusia yang benar-benar ada. Batas sekarang diturunkan dari Siri
 * pada rentang lemak tubuh yang memang dapat diukur (2-70%), bukan dari kesan.
 */
export const DENSITAS_TUBUH_MIN = 0.95
export const DENSITAS_TUBUH_MAKS = 1.10
export const DENSITAS_TUBUH_LAZIM = 1.035

/** Rentang lemak tubuh yang diterima, sama dengan validasi impor kesehatan. */
export const LEMAK_TUBUH_MIN_PCT = 2
export const LEMAK_TUBUH_MAKS_PCT = 70

/**
 * Densitas tubuh dari persen lemak tubuh — pembalikan persamaan Siri.
 *
 * Siri (1961), model dua kompartemen:  %BF = (4.95 / D - 4.50) * 100
 * dibalik menjadi:                     D   = 4.95 / (%BF/100 + 4.50)
 *
 * Ini yang membuat volume benar-benar personal. Dua orang dengan tinggi dan
 * berat sama tetapi komposisi berbeda BUKAN tubuh dengan volume sama: lemak
 * (~0.9 g/cm3) jauh lebih ringan per satuan volume daripada massa bebas lemak
 * (~1.1 g/cm3), jadi yang lemaknya lebih tinggi menempati ruang lebih besar
 * pada massa yang sama. Memakai satu densitas tetap menghapus perbedaan itu.
 */
export function densitasDariLemakTubuh(persenLemak: number): number {
  if (!Number.isFinite(persenLemak) || persenLemak < LEMAK_TUBUH_MIN_PCT || persenLemak > LEMAK_TUBUH_MAKS_PCT) {
    throw new Error(`lemak tubuh ${persenLemak}% di luar rentang yang dapat diukur (${LEMAK_TUBUH_MIN_PCT}-${LEMAK_TUBUH_MAKS_PCT})`)
  }
  return 4.95 / (persenLemak / 100 + 4.50)
}

export const SUMBER_DENSITAS =
  'Siri (1961), model dua kompartemen komposisi tubuh: %BF = (4.95/D - 4.50) x 100.'

export interface UkuranTubuh {
  tinggiCm: number
  massaKg: number
  /** 'L' | 'P'; memengaruhi rasio bahu-panggul, bukan tinggi segmen. */
  jenisKelamin?: 'L' | 'P'
  /**
   * Persen lemak tubuh terukur, bila ada. Menentukan densitas lewat Siri DAN
   * ke mana tambahan volume itu pergi. Tanpa ini model memakai densitas lazim
   * dan distribusi netral — tetap benar totalnya, hanya tidak personal.
   */
  lemakTubuhPct?: number
}

/**
 * Lemak tubuh acuan tempat distribusi dianggap netral. Di atas nilai ini
 * volume tambahan condong ke perut/panggul; di bawahnya, pinggang menyempit
 * relatif terhadap dada. Dipisah per jenis kelamin karena rentang sehatnya
 * memang berbeda, bukan sebagai penilaian.
 */
const LEMAK_ACUAN = { L: 18, P: 26 } as const

/**
 * Bobot penampang terhadap simpangan lemak tubuh dari acuan.
 *
 * Penambahan lemak TIDAK merata, dan polanya berbeda per jenis kelamin: pola
 * android (lebih lazim pada laki-laki) menumpuk di perut/pinggang, pola gynoid
 * (lebih lazim pada perempuan) di panggul dan paha. Tanpa ini, menaikkan lemak
 * tubuh hanya menggemukkan seluruh tubuh secara seragam — yang tidak pernah
 * terjadi pada tubuh sungguhan.
 *
 * Angka di bawah adalah bobot RELATIF, bukan ukuran: semuanya dinormalkan
 * kembali agar volume total tetap ditentukan kekekalan massa. Jadi distribusi
 * memindahkan volume antar bagian, tidak pernah menambah atau menguranginya.
 */
const BOBOT_LEMAK: Record<'L' | 'P', Record<string, number>> = {
  L: { pinggang: 1.00, panggul: 0.55, selangkangan: 0.45, dada: 0.35, bahu: 0.15, leher: 0.15 },
  P: { pinggang: 0.55, panggul: 1.00, selangkangan: 0.85, dada: 0.45, bahu: 0.12, leher: 0.12 },
}
const BOBOT_LEMAK_TUNGKAI: Record<'L' | 'P', Record<string, number>> = {
  L: { 'pangkal-paha': 0.40, 'paha-atas': 0.35, 'paha-bawah': 0.25, lutut: 0.10, betis: 0.18 },
  P: { 'pangkal-paha': 0.85, 'paha-atas': 0.75, 'paha-bawah': 0.45, lutut: 0.12, betis: 0.25 },
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
  /**
   * Penampang SATU lengan, dari pergelangan tangan ke bahu. Sama seperti
   * tungkai: dihitung dua kali dan dirender dua kali.
   */
  lengan: Penampang[]
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
function kerangka(tinggiM: number, jenisKelamin: 'L' | 'P'): { torso: Penampang[]; tungkai: Penampang[]; lengan: Penampang[] } {
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
  const KAL_LENGAN = 0.807

  // a = setengah lebar, b = setengah tebal, keduanya sebagai pecahan tinggi.
  const torso: Penampang[] = [
    { nama: 'selangkangan', y: 0.500 * H, a: 0.082 * H * KAL_TORSO * panggul, b: 0.070 * H * KAL_TORSO * panggul },
    { nama: 'panggul', y: 0.560 * H, a: (P.lebarPanggul / 2) * H * KAL_TORSO * panggul, b: 0.072 * H * KAL_TORSO * panggul },
    { nama: 'pinggang', y: 0.630 * H, a: 0.082 * H * KAL_TORSO, b: 0.062 * H * KAL_TORSO },
    { nama: 'dada', y: P.tinggiDada * H, a: 0.100 * H * KAL_TORSO * bahu, b: 0.075 * H * KAL_TORSO },
    { nama: 'bahu', y: P.tinggiBahu * H, a: (P.lebarBahu / 2) * H * KAL_TORSO * bahu, b: 0.068 * H * KAL_TORSO },
    { nama: 'leher', y: 0.850 * H, a: 0.035 * H * KAL_TORSO, b: 0.035 * H * KAL_TORSO },
    // TENGKORAK MEMBULAT, bukan kerucut. Versi pertama melompat dari 0.048H di
    // tengah kepala langsung ke 0.012H di puncak, yang menghasilkan ubun-ubun
    // lancip — dan menutup ujungnya tidak menolong, karena kubah di atas
    // kerucut tetap terbaca sebagai kerucut. Lebar kepala memuncak di sekitar
    // 0.93H lalu menyusut perlahan; tinggi kepala 0.130H pada tabel Drillis &
    // Contini konsisten dengan kepala yang bermula di sekitar 0.87H.
    { nama: 'rahang', y: 0.880 * H, a: 0.044 * H * KAL_TORSO, b: 0.048 * H * KAL_TORSO },
    { nama: 'kepala-tengah', y: 0.930 * H, a: 0.050 * H * KAL_TORSO, b: 0.054 * H * KAL_TORSO },
    { nama: 'kepala-atas', y: 0.972 * H, a: 0.044 * H * KAL_TORSO, b: 0.047 * H * KAL_TORSO },
    { nama: 'puncak-kepala', y: 1.0 * H, a: 0.026 * H * KAL_TORSO, b: 0.028 * H * KAL_TORSO },
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

  return { torso, tungkai, lengan: kerangkaLengan(H, KAL_LENGAN) }
}

/** Anggota badan diperlakukan terpisah: volumenya ikut dihitung, bukan diabaikan. */
/**
 * Penampang SATU lengan, dari pergelangan tangan ke bahu.
 *
 * Sebelumnya lengan hanya dihitung sebagai silinder elips seragam, dan
 * dirender sebagai silinder yang mengambang lepas dari bahu. Dua akibatnya
 * nyata: volumenya melebihi lengan sungguhan (lengan meruncing kuat dari
 * deltoid ke pergelangan, tidak seragam), dan sosoknya tidak terbaca sebagai
 * satu tubuh. Sekarang lengan memakai tangkai penampang yang sama seperti
 * tungkai, sehingga angka dan gambar berasal dari bentuk yang sama.
 *
 * Ketinggiannya memakai proporsi terbitan: bahu 0.818H, siku 0.630H,
 * pergelangan tangan 0.485H.
 */
function kerangkaLengan(tinggiM: number, kal: number): Penampang[] {
  const P = PROPORSI_DRILLIS_CONTINI
  const H = tinggiM
  return [
    { nama: 'pergelangan-tangan', y: P.tinggiPergelanganTangan * H, a: 0.020 * H * kal, b: 0.024 * H * kal },
    { nama: 'lengan-bawah', y: 0.560 * H, a: 0.028 * H * kal, b: 0.030 * H * kal },
    { nama: 'siku', y: P.tinggiSiku * H, a: 0.030 * H * kal, b: 0.032 * H * kal },
    { nama: 'lengan-atas', y: 0.720 * H, a: 0.036 * H * kal, b: 0.038 * H * kal },
    { nama: 'deltoid', y: P.tinggiBahu * H, a: 0.046 * H * kal, b: 0.048 * H * kal },
  ]
}

/**
 * Menyelesaikan bentuk tubuh dari ukuran nyata.
 *
 * Gagal-tertutup: menolak tinggi/massa di luar kisaran manusia, bukan
 * menghasilkan sosok yang tampak masuk akal dari masukan yang tidak masuk akal.
 */
export function selesaikanBentukTubuh(
  ukuran: UkuranTubuh,
  densitasPaksa?: number,
): BentukTubuh {
  const { tinggiCm, massaKg } = ukuran
  // Densitas berasal dari lemak tubuh terukur bila ada (Siri); nilai paksa
  // hanya dipakai kalau pemanggil memang menyebutkannya.
  const densitas =
    densitasPaksa ??
    (ukuran.lemakTubuhPct !== undefined
      ? densitasDariLemakTubuh(ukuran.lemakTubuhPct)
      : DENSITAS_TUBUH_LAZIM)
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
  const dasarAwal = kerangka(tinggiM, jenisKelamin)

  // DISTRIBUSI LEMAK — memindahkan volume antar bagian, tidak menambahnya.
  // Tiap penampang digeser menurut bobotnya, lalu seluruh bentuk diskalakan
  // ulang oleh kekekalan massa di bawah. Jadi berapa pun distribusinya, volume
  // akhir tetap ditentukan massa/densitas; yang berubah hanya SILUETNYA.
  const dasar = (() => {
    const bf = ukuran.lemakTubuhPct
    if (bf === undefined) return dasarAwal
    const simpangan = (bf - LEMAK_ACUAN[jenisKelamin]) / 100
    if (Math.abs(simpangan) < 1e-9) return dasarAwal
    const geser = (ps: Penampang[], bobot: Record<string, number>) =>
      ps.map((p) => {
        const w = bobot[p.nama] ?? 0
        // Faktor dibatasi supaya simpangan ekstrem tidak menghasilkan bentuk
        // yang mustahil; uji kewajaran lingkar menjaga sisanya.
        const f = Math.max(0.82, Math.min(1.70, 1 + w * simpangan * 1.8))
        return { ...p, a: p.a * f, b: p.b * f }
      })
    return {
      torso: geser(dasarAwal.torso, BOBOT_LEMAK[jenisKelamin]),
      tungkai: geser(dasarAwal.tungkai, BOBOT_LEMAK_TUNGKAI[jenisKelamin]),
      lengan: dasarAwal.lengan,
    }
  })()

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
    2 * volumeTangkaPenampang(dasar.lengan)
  if (volumeSatuan <= 0) throw new Error('volume kerangka dasar bukan bilangan positif')
  const skalaLingkar = Math.sqrt(volumeSasaranM3 / volumeSatuan)

  const skalakan = (ps: Penampang[]) => ps.map((p) => ({ ...p, a: p.a * skalaLingkar, b: p.b * skalaLingkar }))
  const penampang = skalakan(dasar.torso)
  const tungkai = skalakan(dasar.tungkai)
  const lengan = skalakan(dasar.lengan)
  const volumeM3 =
    volumeTangkaPenampang(penampang) +
    2 * volumeTangkaPenampang(tungkai) +
    2 * volumeTangkaPenampang(lengan)

  return {
    penampang,
    tungkai,
    lengan,
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
  opsi: { segmen?: number; sisipan?: number; tutupUjung?: boolean; tutupAtas?: boolean; tutupBawah?: boolean } = {},
): MeshTubuh {
  const segmen = Math.max(8, Math.floor(opsi.segmen ?? 48))
  const sisipan = Math.max(0, Math.floor(opsi.sisipan ?? 5))
  // Kendali per-ujung. Batang tubuh perlu ATAS tertutup supaya ubun-ubun
  // membulat alih-alih meruncing seperti kerucut, tetapi BAWAH harus tetap
  // terbuka karena di situlah tungkai menyambung. `tutupUjung` menutup
  // keduanya dan tetap ada untuk anggota badan.
  const tutupBawah = opsi.tutupBawah ?? opsi.tutupUjung ?? false
  const tutupAtas = opsi.tutupAtas ?? opsi.tutupUjung ?? false

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

  // TUTUP UJUNG. Tabung ter-loft ujungnya terbuka, jadi anggota badan berakhir
  // sebagai tepi datar yang terlihat seperti potongan. Ditutup dengan beberapa
  // cincin yang mengecil mengikuti seperempat elips, sehingga ujungnya
  // membulat alih-alih rata — dan normalnya tetap mulus karena cincinnya
  // dibangun oleh jalur yang sama, bukan oleh geometri kedua.
  if (tutupBawah || tutupAtas) {
    const LANGKAH_TUTUP = 4
    const kubah = (acuan: { y: number; a: number; b: number }, arah: -1 | 1) => {
      const out: { y: number; a: number; b: number }[] = []
      const tinggiKubah = Math.min(acuan.a, acuan.b) * 0.9
      for (let i = 1; i <= LANGKAH_TUTUP; i++) {
        const t = i / LANGKAH_TUTUP
        // Seperempat elips: jari-jari menyusut sebagai cos, tinggi sebagai sin.
        const sk = Math.cos((t * Math.PI) / 2)
        out.push({
          y: acuan.y + arah * tinggiKubah * Math.sin((t * Math.PI) / 2),
          a: Math.max(1e-4, acuan.a * sk),
          b: Math.max(1e-4, acuan.b * sk),
        })
      }
      return out
    }
    if (tutupAtas) cincin.push(...kubah(cincin[cincin.length - 1], 1))
    if (tutupBawah) cincin.unshift(...kubah(cincin[0], -1).reverse())
  }

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

/**
 * Perawakan acuan untuk geometri manusia terbitan.
 *
 * Lapisan permukaan Z-Anatomy adalah kumpulan tambalan topografis (regio
 * epigastrika, trigonum karotikum, dan seterusnya) — permukaan TERBUKA, bukan
 * cangkang kedap. Karena itu volumenya tidak dapat diukur dari mesh: mencoba
 * menjumlahkan volume tetrahedron di atasnya menghasilkan angka yang tidak
 * berarti. Berkas sumbernya juga tidak menyatakan massa orang yang dipindai.
 *
 * Jadi perawakannya DIPERKIRAKAN, bukan diukur, memakai Pria Dewasa Acuan
 * ICRP Publication 89: tinggi 1,76 m, massa 73 kg. Itu satu-satunya klaim yang
 * dapat dipertanggungjawabkan di sini, dan ia sengaja dinyatakan terbuka
 * sebagai perkiraan.
 */
export const TINGGI_ACUAN_ICRP89_M = 1.76
export const MASSA_ACUAN_ICRP89_KG = 73
export const IMT_ACUAN_ICRP89 = MASSA_ACUAN_ICRP89_KG / TINGGI_ACUAN_ICRP89_M ** 2
export const SUMBER_PERAWAKAN_ACUAN =
  'ICRP Publication 89 (2002), Reference Adult Male: tinggi 1,76 m, massa 73 kg.'

/**
 * Volume tubuh perawakan acuan pada tinggi tertentu, dengan densitas lazim.
 *
 * Dipakai sebagai penyebut saat menskalakan lingkar geometri terbitan: tinggi
 * disamakan persis, lalu lingkarnya diskalakan sebesar simpangan perawakan
 * pengguna terhadap acuan ini.
 */
export function volumeAcuanPerawakanM3(tinggiM: number): number {
  if (!Number.isFinite(tinggiM) || tinggiM <= 0) {
    throw new Error(`tinggi acuan ${tinggiM} m tidak dapat dipakai`)
  }
  return (IMT_ACUAN_ICRP89 * tinggiM ** 2) / (DENSITAS_TUBUH_LAZIM * 1000)
}

/**
 * Faktor skala lingkar agar geometri manusia terbitan, setelah tingginya
 * disamakan, punya volume sama dengan massa/densitas orangnya.
 *
 * Volume tumbuh dengan kuadrat skala lingkar, jadi bentuknya tertutup.
 * Mengembalikan null bila salah satu volumenya tidak masuk akal, atau bila
 * hasilnya jatuh di luar pita perawakan manusia: lebih baik memakai sosok
 * parametrik yang benar daripada menarik paksa geometri terbitan ke bentuk
 * yang tidak pernah ada.
 */
export function skalaLingkarUntukVolume(
  volumeAcuanM3: number,
  volumeSasaranM3: number,
): number | null {
  if (!Number.isFinite(volumeAcuanM3) || volumeAcuanM3 <= 0) return null
  if (!Number.isFinite(volumeSasaranM3) || volumeSasaranM3 <= 0) return null
  const k = Math.sqrt(volumeSasaranM3 / volumeAcuanM3)
  // Di luar pita ini, geometrinya bukan tubuh manusia berskala wajar dan
  // menariknya paksa akan menghasilkan sosok yang tidak benar.
  if (!Number.isFinite(k) || k < 0.55 || k > 1.85) return null
  return k
}

export const BATAS_KEBENARAN_BENTUK =
  'Bentuk ini diturunkan dari tinggi, massa dan jenis kelamin yang diberikan pengguna melalui proporsi segmen terbitan dan kekekalan massa. Ia bukan pemindaian, bukan rekonstruksi fotogrametrik, dan bukan ukuran klinis.'
