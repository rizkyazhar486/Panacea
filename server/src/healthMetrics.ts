// ─────────────────────────────────────────────────────────────────────────────
// Katalog metrik Apple Health / Health Auto Export.
//
// Sebelumnya server hanya mengenali 16 metrik. Ekspor yang benar-benar dikirim
// telepon memuat lebih dari seratus, jadi sebagian besar sampai lalu dibuang
// tanpa jejak. Berkas yang sama, bila diunggah lewat browser, menghasilkan
// jauh lebih banyak — sehingga telepon yang sama memberi hasil berbeda semata
// karena jalur yang ditempuhnya berbeda.
//
// Dua hal yang diperbaiki sekaligus di sini:
//
//   1. CAKUPAN. Katalog di bawah berusaha memuat setiap metrik yang bisa
//      dikirim Health Auto Export, bukan hanya yang kebetulan ada di formulir.
//
//   2. SATUAN. Server dulu mengambil angkanya mentah-mentah. Berat dalam pon
//      tersimpan sebagai kilogram, jarak dalam mil tersimpan sebagai kilometer,
//      energi dalam kilojoule tersimpan sebagai kilokalori — semuanya salah
//      diam-diam, dan justru pengguna dengan setelan imperial yang paling
//      dirugikan. Sekarang setiap nilai dikonversi menurut satuan yang
//      dinyatakan payload.
// ─────────────────────────────────────────────────────────────────────────────

export type Kanonik =
  | 'kg' | 'cm' | 'km' | 'm' | 'kcal' | 'C' | 'jam' | 'menit' | 'detik' | 'ms'
  | 'L' | 'kmh' | 'ms_kecepatan' | 'mgdl' | 'g' | 'mg' | 'mcg' | 'pct' | 'apaAdanya'

function n(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Konversi satu nilai ke satuan kanonik berdasarkan satuan yang dinyatakan
 * payload. Bila satuannya tidak dikenali, nilainya dibiarkan apa adanya —
 * menebak justru lebih berbahaya daripada menyimpan angka yang jujur mentah.
 */
/**
 * Normalisasi SATUAN, terpisah dari normalisasi nama metrik.
 *
 * Tidak boleh memakai n(): fungsi itu membuang setiap karakter non-alfanumerik,
 * sehingga "µg" runtuh menjadi "g" dan bertabrakan dengan gram. Akibatnya gram
 * dibagi sejuta — protein 110 g tersimpan sebagai 0. Karena itu µ dipetakan ke
 * "u" lebih dulu, barulah sisanya dibersihkan.
 */
function satuanNorm(satuan: string): string {
  return satuan
    .toLowerCase()
    .replace(/[µμ]/g, 'u')
    .replace(/[^a-z0-9/]/g, '')
    .replace(/\//g, '')
}

export function keKanonik(nilai: number, satuan: string | undefined, target: Kanonik): number {
  const u = satuanNorm(satuan ?? '')
  if (!u) return nilai
  switch (target) {
    case 'kg':
      if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') return nilai * 0.45359237
      if (u === 'g' || u === 'gram' || u === 'grams') return nilai / 1000
      if (u === 'oz' || u === 'ounces') return nilai * 0.0283495
      if (u === 'st' || u === 'stones') return nilai * 6.35029
      return nilai
    case 'cm':
      if (u === 'm' || u === 'metres' || u === 'meters') return nilai * 100
      if (u === 'in' || u === 'inch' || u === 'inches') return nilai * 2.54
      if (u === 'ft' || u === 'feet') return nilai * 30.48
      if (u === 'mm') return nilai / 10
      return nilai
    case 'km':
      if (u === 'm' || u === 'metres' || u === 'meters') return nilai / 1000
      if (u === 'mi' || u === 'mile' || u === 'miles') return nilai * 1.609344
      if (u === 'ft' || u === 'feet') return nilai * 0.0003048
      if (u === 'yd' || u === 'yards') return nilai * 0.0009144
      return nilai
    case 'm':
      if (u === 'km') return nilai * 1000
      if (u === 'cm') return nilai / 100
      if (u === 'ft' || u === 'feet') return nilai * 0.3048
      if (u === 'in' || u === 'inches') return nilai * 0.0254
      if (u === 'mi' || u === 'miles') return nilai * 1609.344
      return nilai
    case 'kcal':
      // Apple menulis kilojoule sebagai "kJ"; norm() membuatnya "kj".
      if (u === 'kj' || u === 'kilojoules') return nilai / 4.184
      if (u === 'j' || u === 'joules') return nilai / 4184
      if (u === 'cal' || u === 'calories') return nilai / 1000
      return nilai
    case 'C':
      if (u === 'degf' || u === 'f' || u === 'fahrenheit') return (nilai - 32) * (5 / 9)
      if (u === 'k' || u === 'kelvin') return nilai - 273.15
      return nilai
    case 'jam':
      if (u === 'min' || u === 'mins' || u === 'minutes') return nilai / 60
      if (u === 's' || u === 'sec' || u === 'seconds') return nilai / 3600
      if (u === 'ms') return nilai / 3_600_000
      return nilai
    case 'menit':
      if (u === 'hr' || u === 'h' || u === 'hours' || u === 'hour') return nilai * 60
      if (u === 's' || u === 'sec' || u === 'seconds') return nilai / 60
      if (u === 'ms') return nilai / 60_000
      return nilai
    case 'detik':
      if (u === 'min' || u === 'minutes') return nilai * 60
      if (u === 'hr' || u === 'hours') return nilai * 3600
      if (u === 'ms') return nilai / 1000
      return nilai
    case 'ms':
      if (u === 's' || u === 'sec' || u === 'seconds') return nilai * 1000
      return nilai
    case 'L':
      if (u === 'ml') return nilai / 1000
      if (u === 'floz' || u === 'flozus') return nilai * 0.0295735
      if (u === 'cup' || u === 'cups') return nilai * 0.236588
      return nilai
    case 'kmh':
      if (u === 'ms' || u === 'msec' || u === 'ms1') return nilai * 3.6
      if (u === 'mihr' || u === 'mph' || u === 'mih') return nilai * 1.609344
      if (u === 'kmhr' || u === 'kmh') return nilai
      return nilai
    case 'ms_kecepatan':
      if (u === 'kmhr' || u === 'kmh') return nilai / 3.6
      if (u === 'mihr' || u === 'mph') return nilai * 0.44704
      return nilai
    case 'mgdl':
      // mmol/L → mg/dL untuk glukosa.
      if (u === 'mmoll' || u === 'mmol') return nilai * 18.0182
      return nilai
    case 'g':
      if (u === 'mg') return nilai / 1000
      if (u === 'mcg' || u === 'ug') return nilai / 1_000_000
      if (u === 'kg') return nilai * 1000
      return nilai
    case 'mg':
      if (u === 'g' || u === 'grams') return nilai * 1000
      if (u === 'mcg' || u === 'ug') return nilai / 1000
      return nilai
    case 'mcg':
      if (u === 'mg') return nilai * 1000
      if (u === 'g' || u === 'grams') return nilai * 1_000_000
      return nilai
    case 'pct':
      // Apple mengirim rasio 0–1 untuk sebagian persentase.
      return nilai <= 1 ? nilai * 100 : nilai
    default:
      return nilai
  }
}

export interface DefinisiMetrik {
  /** Kunci yang dipakai di profil kesehatan dan di seluruh aplikasi. */
  kunci: string
  label: string
  kategori: string
  satuan: Kanonik
  /** Label satuan untuk ditampilkan. */
  tampil: string
  /** Nama-nama yang mungkin dikirim, sudah dinormalkan. */
  cocok: string[]
  /** Ambil nilai harian sebagai jumlah, bukan nilai terakhir. */
  jumlahkan?: boolean
}

const M = (
  kunci: string, label: string, kategori: string, satuan: Kanonik, tampil: string,
  cocok: string[], jumlahkan?: boolean,
): DefinisiMetrik => ({ kunci, label, kategori, satuan, tampil, cocok: cocok.map(n), jumlahkan })

/**
 * Katalog lengkap. Kunci yang sudah dipakai aplikasi dipertahankan apa adanya
 * agar layar yang ada tidak perlu diubah.
 */
export const KATALOG: DefinisiMetrik[] = [
  // ── Jantung & pembuluh darah ──
  M('heartRate', 'Detak jantung', 'Jantung', 'apaAdanya', 'bpm', ['heart_rate']),
  M('restingHr', 'Detak jantung istirahat', 'Jantung', 'apaAdanya', 'bpm', ['resting_heart_rate']),
  M('walkingHr', 'Detak jantung saat berjalan', 'Jantung', 'apaAdanya', 'bpm', ['walking_heart_rate_average']),
  M('hrvMs', 'Variabilitas detak jantung', 'Jantung', 'ms', 'ms', ['heart_rate_variability', 'heart_rate_variability_sdnn', 'hrv']),
  M('vo2max', 'VO₂max', 'Jantung', 'apaAdanya', 'ml/kg/mnt', ['vo2_max', 'vo2max']),
  M('cardioRecoveryBpm', 'Pemulihan kardio', 'Jantung', 'apaAdanya', 'bpm', ['cardio_recovery', 'heart_rate_recovery_one_minute']),
  M('systolic', 'Tekanan darah sistolik', 'Jantung', 'apaAdanya', 'mmHg', ['blood_pressure_systolic']),
  M('diastolic', 'Tekanan darah diastolik', 'Jantung', 'apaAdanya', 'mmHg', ['blood_pressure_diastolic']),
  M('afibBurdenPct', 'Beban fibrilasi atrium', 'Jantung', 'pct', '%', ['atrial_fibrillation_burden']),
  M('perfusionIndexPct', 'Indeks perfusi perifer', 'Jantung', 'pct', '%', ['peripheral_perfusion_index']),

  // ── Pernapasan ──
  M('spo2Pct', 'Saturasi oksigen', 'Pernapasan', 'pct', '%', ['blood_oxygen_saturation', 'oxygen_saturation']),
  M('respRate', 'Laju napas', 'Pernapasan', 'apaAdanya', '/mnt', ['respiratory_rate']),
  M('fev1L', 'FEV₁', 'Pernapasan', 'L', 'L', ['forced_expiratory_volume_1', 'forced_expiratory_volume1']),
  M('fvcL', 'Kapasitas vital paksa', 'Pernapasan', 'L', 'L', ['forced_vital_capacity']),
  M('peakFlow', 'Arus puncak ekspirasi', 'Pernapasan', 'apaAdanya', 'L/mnt', ['peak_expiratory_flow_rate']),
  M('breathingDisturbances', 'Gangguan napas saat tidur', 'Pernapasan', 'apaAdanya', '', ['breathing_disturbances']),

  // ── Komposisi tubuh ──
  M('weightKg', 'Berat badan', 'Tubuh', 'kg', 'kg', ['weight_body_mass', 'body_mass', 'weight']),
  M('heightCm', 'Tinggi badan', 'Tubuh', 'cm', 'cm', ['height']),
  M('bmi', 'Indeks massa tubuh', 'Tubuh', 'apaAdanya', '', ['body_mass_index']),
  M('bodyFatPct', 'Persen lemak tubuh', 'Tubuh', 'pct', '%', ['body_fat_percentage']),
  M('leanMassKg', 'Massa bebas lemak', 'Tubuh', 'kg', 'kg', ['lean_body_mass']),
  M('waistCm', 'Lingkar pinggang', 'Tubuh', 'cm', 'cm', ['waist_circumference']),

  // ── Suhu ──
  M('bodyTempC', 'Suhu tubuh', 'Suhu', 'C', '°C', ['body_temperature']),
  M('basalTempC', 'Suhu basal', 'Suhu', 'C', '°C', ['basal_body_temperature']),
  M('wristTempC', 'Suhu pergelangan saat tidur', 'Suhu', 'C', '°C', ['apple_sleeping_wrist_temperature']),

  // ── Aktivitas harian ──
  M('steps', 'Langkah', 'Aktivitas', 'apaAdanya', 'langkah', ['step_count'], true),
  M('distanceKm', 'Jarak jalan + lari', 'Aktivitas', 'km', 'km', ['walking_running_distance', 'distance_walking_running'], true),
  M('cyclingDistanceKm', 'Jarak bersepeda', 'Aktivitas', 'km', 'km', ['cycling_distance'], true),
  M('swimDistanceM', 'Jarak berenang', 'Aktivitas', 'm', 'm', ['swimming_distance'], true),
  M('swimStrokes', 'Kayuhan renang', 'Aktivitas', 'apaAdanya', 'kayuhan', ['swimming_stroke_count'], true),
  M('wheelchairDistanceKm', 'Jarak kursi roda', 'Aktivitas', 'km', 'km', ['wheelchair_distance'], true),
  M('pushCount', 'Dorongan kursi roda', 'Aktivitas', 'apaAdanya', 'dorongan', ['push_count'], true),
  M('snowDistanceKm', 'Jarak ski / snowboard', 'Aktivitas', 'km', 'km', ['distance_downhill_snow_sports'], true),
  M('flightsClimbed', 'Lantai ditapaki', 'Aktivitas', 'apaAdanya', 'lantai', ['flights_climbed'], true),
  M('exerciseMin', 'Menit olahraga', 'Aktivitas', 'menit', 'mnt', ['apple_exercise_time'], true),
  M('moveMin', 'Menit bergerak', 'Aktivitas', 'menit', 'mnt', ['apple_move_time'], true),
  M('standHours', 'Jam berdiri', 'Aktivitas', 'apaAdanya', 'jam', ['apple_stand_hour'], true),
  M('standMin', 'Menit berdiri', 'Aktivitas', 'menit', 'mnt', ['apple_stand_time'], true),
  M('activeKcal', 'Energi aktif', 'Aktivitas', 'kcal', 'kkal', ['active_energy'], true),
  M('basalKcal', 'Energi basal', 'Aktivitas', 'kcal', 'kkal', ['basal_energy_burned'], true),
  M('physicalEffort', 'Upaya fisik', 'Aktivitas', 'apaAdanya', 'MET', ['physical_effort']),
  M('underwaterDepthM', 'Kedalaman menyelam', 'Aktivitas', 'm', 'm', ['underwater_depth']),
  M('underwaterTempC', 'Suhu air', 'Aktivitas', 'C', '°C', ['underwater_temperature']),
  M('sixMinWalkM', 'Tes jalan 6 menit', 'Aktivitas', 'm', 'm', ['six_minute_walking_test_distance', 'six_minute_walk_test_distance']),
  M('fallCount', 'Jumlah terjatuh', 'Aktivitas', 'apaAdanya', 'kali', ['number_of_times_fallen'], true),

  // ── Bentuk lari ──
  M('runningPowerW', 'Daya lari', 'Lari', 'apaAdanya', 'W', ['running_power']),
  M('runningSpeedKmh', 'Kecepatan lari', 'Lari', 'kmh', 'km/j', ['running_speed']),
  M('runningStrideLengthM', 'Panjang langkah lari', 'Lari', 'm', 'm', ['running_stride_length']),
  M('runningGroundContactMs', 'Waktu kontak tanah', 'Lari', 'ms', 'ms', ['running_ground_contact_time']),
  M('runningVerticalOscCm', 'Osilasi vertikal', 'Lari', 'cm', 'cm', ['running_vertical_oscillation']),

  // ── Bersepeda ──
  M('cyclingCadence', 'Kadens sepeda', 'Sepeda', 'apaAdanya', 'rpm', ['cycling_cadence']),
  M('cyclingPowerW', 'Daya sepeda', 'Sepeda', 'apaAdanya', 'W', ['cycling_power']),
  M('cyclingSpeedKmh', 'Kecepatan sepeda', 'Sepeda', 'kmh', 'km/j', ['cycling_speed']),
  M('cyclingFtpW', 'FTP sepeda', 'Sepeda', 'apaAdanya', 'W', ['cycling_functional_threshold_power']),

  // ── Kualitas berjalan ──
  M('walkingSpeedKmh', 'Kecepatan berjalan', 'Gaya jalan', 'kmh', 'km/j', ['walking_speed']),
  M('walkingAsymmetryPct', 'Asimetri langkah', 'Gaya jalan', 'pct', '%', ['walking_asymmetry_percentage']),
  M('walkingDoubleSupportPct', 'Dua tumpuan', 'Gaya jalan', 'pct', '%', ['walking_double_support_percentage']),
  M('walkingStepLengthCm', 'Panjang langkah', 'Gaya jalan', 'cm', 'cm', ['walking_step_length']),
  M('stairSpeedUpMs', 'Kecepatan naik tangga', 'Gaya jalan', 'ms_kecepatan', 'm/s', ['stair_speed_up', 'stair_speed:_up']),
  M('stairSpeedDownMs', 'Kecepatan turun tangga', 'Gaya jalan', 'ms_kecepatan', 'm/s', ['stair_speed_down', 'stair_speed:_down']),

  // ── Metabolik ──
  M('bloodGlucoseMgdl', 'Glukosa darah', 'Metabolik', 'mgdl', 'mg/dL', ['blood_glucose']),
  M('insulinIU', 'Pemberian insulin', 'Metabolik', 'apaAdanya', 'IU', ['insulin_delivery'], true),
  M('bloodAlcoholPct', 'Kadar alkohol darah', 'Metabolik', 'pct', '%', ['blood_alcohol_content']),

  // ── Lingkungan ──
  M('audioExposureDb', 'Paparan suara sekitar', 'Lingkungan', 'apaAdanya', 'dB', ['environmental_audio_exposure']),
  M('headphoneAudioDb', 'Paparan suara headphone', 'Lingkungan', 'apaAdanya', 'dB', ['headphone_audio_exposure']),
  M('daylightMin', 'Waktu di bawah cahaya matahari', 'Lingkungan', 'menit', 'mnt', ['time_in_daylight'], true),
  M('uvIndex', 'Paparan UV', 'Lingkungan', 'apaAdanya', 'indeks', ['uv_exposure']),

  // ── Kebiasaan & pikiran ──
  M('mindfulMin', 'Menit hening', 'Pikiran', 'menit', 'mnt', ['mindful_minutes'], true),
  M('edaMicroS', 'Aktivitas elektrodermal', 'Pikiran', 'apaAdanya', 'µS', ['electrodermal_activity']),
  M('handwashSec', 'Cuci tangan', 'Kebiasaan', 'detik', 'dtk', ['handwashing'], true),
  M('toothbrushSec', 'Sikat gigi', 'Kebiasaan', 'detik', 'dtk', ['toothbrushing'], true),
  M('inhalerUsage', 'Pemakaian inhaler', 'Kebiasaan', 'apaAdanya', 'kali', ['inhaler_usage'], true),
  M('sexualActivity', 'Aktivitas seksual', 'Kebiasaan', 'apaAdanya', 'kali', ['sexual_activity'], true),

  // ── Gizi: makro ──
  M('dietKcal', 'Energi makanan', 'Gizi', 'kcal', 'kkal', ['dietary_energy'], true),
  M('carbsG', 'Karbohidrat', 'Gizi', 'g', 'g', ['carbohydrates'], true),
  M('proteinG', 'Protein', 'Gizi', 'g', 'g', ['protein'], true),
  M('fatG', 'Lemak total', 'Gizi', 'g', 'g', ['total_fat'], true),
  M('satFatG', 'Lemak jenuh', 'Gizi', 'g', 'g', ['saturated_fat'], true),
  M('monoFatG', 'Lemak tak jenuh tunggal', 'Gizi', 'g', 'g', ['monounsaturated_fat'], true),
  M('polyFatG', 'Lemak tak jenuh ganda', 'Gizi', 'g', 'g', ['polyunsaturated_fat'], true),
  M('cholesterolMg', 'Kolesterol', 'Gizi', 'mg', 'mg', ['cholesterol'], true),
  M('fiberG', 'Serat', 'Gizi', 'g', 'g', ['fiber'], true),
  M('sugarG', 'Gula', 'Gizi', 'g', 'g', ['dietary_sugar'], true),
  M('waterL', 'Air minum', 'Gizi', 'L', 'L', ['dietary_water'], true),
  M('caffeineMg', 'Kafein', 'Gizi', 'mg', 'mg', ['caffeine'], true),
  M('alcoholUnits', 'Konsumsi alkohol', 'Gizi', 'apaAdanya', 'unit', ['alcohol_consumption'], true),

  // ── Gizi: mineral ──
  M('sodiumMg', 'Natrium', 'Mineral', 'mg', 'mg', ['sodium'], true),
  M('potassiumMg', 'Kalium', 'Mineral', 'mg', 'mg', ['potassium'], true),
  M('calciumMg', 'Kalsium', 'Mineral', 'mg', 'mg', ['calcium'], true),
  M('ironMg', 'Zat besi', 'Mineral', 'mg', 'mg', ['iron'], true),
  M('magnesiumMg', 'Magnesium', 'Mineral', 'mg', 'mg', ['magnesium'], true),
  M('zincMg', 'Seng', 'Mineral', 'mg', 'mg', ['zinc'], true),
  M('phosphorusMg', 'Fosfor', 'Mineral', 'mg', 'mg', ['phosphorus'], true),
  M('chlorideMg', 'Klorida', 'Mineral', 'mg', 'mg', ['chloride'], true),
  M('copperMg', 'Tembaga', 'Mineral', 'mg', 'mg', ['copper'], true),
  M('manganeseMg', 'Mangan', 'Mineral', 'mg', 'mg', ['manganese'], true),
  M('seleniumMcg', 'Selenium', 'Mineral', 'mcg', 'µg', ['selenium'], true),
  M('iodineMcg', 'Iodium', 'Mineral', 'mcg', 'µg', ['iodine'], true),
  M('chromiumMcg', 'Kromium', 'Mineral', 'mcg', 'µg', ['chromium'], true),
  M('molybdenumMcg', 'Molibdenum', 'Mineral', 'mcg', 'µg', ['molybdenum'], true),

  // ── Gizi: vitamin ──
  M('vitAMcg', 'Vitamin A', 'Vitamin', 'mcg', 'µg', ['vitamin_a'], true),
  M('vitCMg', 'Vitamin C', 'Vitamin', 'mg', 'mg', ['vitamin_c'], true),
  M('vitDMcg', 'Vitamin D', 'Vitamin', 'mcg', 'µg', ['vitamin_d'], true),
  M('vitEMg', 'Vitamin E', 'Vitamin', 'mg', 'mg', ['vitamin_e'], true),
  M('vitKMcg', 'Vitamin K', 'Vitamin', 'mcg', 'µg', ['vitamin_k'], true),
  M('vitB6Mg', 'Vitamin B6', 'Vitamin', 'mg', 'mg', ['vitamin_b6'], true),
  M('vitB12Mcg', 'Vitamin B12', 'Vitamin', 'mcg', 'µg', ['vitamin_b12'], true),
  M('thiaminMg', 'Tiamin (B1)', 'Vitamin', 'mg', 'mg', ['thiamin'], true),
  M('riboflavinMg', 'Riboflavin (B2)', 'Vitamin', 'mg', 'mg', ['riboflavin'], true),
  M('niacinMg', 'Niasin (B3)', 'Vitamin', 'mg', 'mg', ['niacin'], true),
  M('pantothenicMg', 'Asam pantotenat (B5)', 'Vitamin', 'mg', 'mg', ['pantothenic_acid'], true),
  M('biotinMcg', 'Biotin (B7)', 'Vitamin', 'mcg', 'µg', ['biotin'], true),
  M('folateMcg', 'Folat (B9)', 'Vitamin', 'mcg', 'µg', ['folate'], true),
]

/**
 * Pencarian nama → definisi.
 *
 * Dibangun dua lapis: cocok persis dulu, baru cocok sebagian. Tanpa urutan itu
 * "heart_rate_variability" bisa tertangkap oleh "heart_rate" hanya karena
 * definisi itu lebih dulu ditulis di daftar.
 */
const PERSIS = new Map<string, DefinisiMetrik>()
for (const d of KATALOG) for (const c of d.cocok) if (!PERSIS.has(c)) PERSIS.set(c, d)

export function cariMetrik(nama: string): DefinisiMetrik | undefined {
  const key = n(nama)
  const persis = PERSIS.get(key)
  if (persis) return persis
  // Cocok sebagian: pilih pola TERPANJANG yang cocok, sehingga nama yang lebih
  // spesifik selalu menang atas nama yang lebih umum.
  let terbaik: DefinisiMetrik | undefined
  let panjang = 0
  for (const d of KATALOG) {
    for (const c of d.cocok) {
      if (c.length > panjang && (key.includes(c) || c.includes(key))) {
        terbaik = d
        panjang = c.length
      }
    }
  }
  return terbaik
}

export const KATEGORI = [...new Set(KATALOG.map((d) => d.kategori))]
export const JUMLAH_METRIK = KATALOG.length
