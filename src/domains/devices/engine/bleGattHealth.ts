/**
 * Decoder karakteristik kesehatan Bluetooth LE standar (Bluetooth SIG), murni & fail-closed.
 *
 * Sumber byte-layout (dibaca langsung, bukan ingatan):
 * - GATT Specification Supplement (GSS), Bluetooth SIG, versi 2026-09-09:
 *   §2 urutan oktet dimulai dari oktet paling tidak signifikan (little-endian),
 *   §2.1.1 Tabel 2.1 nilai khusus medfloat32/medfloat16, §3.34 Blood Pressure Measurement,
 *   §3.80 Date Time, §3.239 Temperature Measurement.
 * - "Personal Health Devices Transcoding" white paper v16, Bluetooth SIG (2019) §2.2.1–2.2.2:
 *   FLOAT = eksponen 8-bit bertanda + mantisa 24-bit bertanda; SFLOAT = eksponen 4-bit + mantisa 12-bit,
 *   keduanya komplemen dua. Contoh emas: 36.4 °C = 0xFF00016C, 114 mmHg = 0x0072.
 * - Nomor layanan/karakteristik: Bluetooth SIG Assigned Numbers (service_uuids.yaml, characteristic_uuids.yaml).
 *
 * Heart Rate Measurement 0x2A37 TIDAK diulang di sini: decoder kanoniknya `parseHeartRateMeasurement`
 * (engine/gattHeartRate.ts) — satu sumber kebenaran per karakteristik.
 *
 * Batas: hanya profil standar SIG. Protokol vendor (mis. gelang "Whoop-class") TIDAK didekode di sini
 * tanpa fixture tangkapan perangkat milik pengguna; hasilnya adalah pengukuran perangkat, bukan rekam medis
 * bertanda tangan, dan tidak ada interpretasi klinis di modul ini.
 */

export type MedFloatKhusus = 'nan' | 'nres' | '+inf' | '-inf' | 'rfu'
export type MedFloat = { ok: true; value: number; mantissa: number; exponent: number } | { ok: false; reason: MedFloatKhusus }

export type AlasanTolak =
  | 'bukan-byte'
  | 'terlalu-pendek'
  | 'panjang-tidak-cocok'
  | 'nilai-khusus'
  | 'tanggal-tidak-sah'

export type Hasil<T> = { ok: true; value: T } | { ok: false; reason: AlasanTolak; detail: string }

const tolak = (reason: AlasanTolak, detail: string): { ok: false; reason: AlasanTolak; detail: string } => ({ ok: false, reason, detail })

/** Nomor layanan GATT 16-bit (Assigned Numbers). */
export const LAYANAN_GATT = {
  glucose: 0x1808,
  healthThermometer: 0x1809,
  deviceInformation: 0x180a,
  heartRate: 0x180d,
  battery: 0x180f,
  bloodPressure: 0x1810,
  bodyComposition: 0x181b,
  weightScale: 0x181d,
  continuousGlucoseMonitoring: 0x181f,
  pulseOximeter: 0x1822,
} as const

/** Nomor karakteristik 16-bit yang punya decoder teruji di domain devices (0x2A37 → gattHeartRate.ts). */
export const KARAKTERISTIK_GATT = {
  temperatureMeasurement: 0x2a1c,
  bloodPressureMeasurement: 0x2a35,
  heartRateMeasurement: 0x2a37,
} as const

const tandai = (raw: number, bit: number) => (raw & (1 << (bit - 1))) !== 0 ? raw - (1 << bit) : raw

// Pembagian untuk eksponen negatif menjaga nilai desimal persis (364 / 10 = 36.4, bukan 364 × 0.1).
const skala = (mantissa: number, exponent: number) => exponent >= 0 ? mantissa * 10 ** exponent : mantissa / 10 ** -exponent

/** SFLOAT / medfloat16 (GSS Tabel 2.1; PHD WP §2.2.2). */
export function decodeSfloat(raw: number): MedFloat {
  if (raw === 0x07ff) return { ok: false, reason: 'nan' }
  if (raw === 0x0800) return { ok: false, reason: 'nres' }
  if (raw === 0x07fe) return { ok: false, reason: '+inf' }
  if (raw === 0x0802) return { ok: false, reason: '-inf' }
  if (raw === 0x0801) return { ok: false, reason: 'rfu' }
  const mantissa = tandai(raw & 0x0fff, 12)
  const exponent = tandai((raw >> 12) & 0x0f, 4)
  return { ok: true, value: skala(mantissa, exponent), mantissa, exponent }
}

/** FLOAT / medfloat32 (GSS Tabel 2.1; PHD WP §2.2.1). */
export function decodeFloat(raw: number): MedFloat {
  const r = raw >>> 0
  if (r === 0x007fffff) return { ok: false, reason: 'nan' }
  if (r === 0x00800000) return { ok: false, reason: 'nres' }
  if (r === 0x007ffffe) return { ok: false, reason: '+inf' }
  if (r === 0x00800002) return { ok: false, reason: '-inf' }
  if (r === 0x00800001) return { ok: false, reason: 'rfu' }
  const mantissa = tandai(r & 0x00ffffff, 24)
  const exponent = tandai(r >>> 24, 8)
  return { ok: true, value: skala(mantissa, exponent), mantissa, exponent }
}

/** Waktu lokal perangkat (GSS §3.80): tanpa zona waktu; 0 pada tahun/bulan/hari berarti "tidak diketahui" → null. */
export type WaktuPerangkat = { year: number | null; month: number | null; day: number | null; hours: number; minutes: number; seconds: number; timezone: 'tidak-diketahui' }

export function decodeDateTime(b: Uint8Array, offset = 0): Hasil<WaktuPerangkat> {
  if (!(b instanceof Uint8Array)) return tolak('bukan-byte', 'Date Time harus Uint8Array')
  if (offset < 0 || b.length - offset < 7) return tolak('terlalu-pendek', 'Date Time butuh 7 oktet')
  const year = b[offset] | (b[offset + 1] << 8)
  const [month, day, hours, minutes, seconds] = [b[offset + 2], b[offset + 3], b[offset + 4], b[offset + 5], b[offset + 6]]
  if (year !== 0 && (year < 1582 || year > 9999)) return tolak('tanggal-tidak-sah', `tahun ${year} di luar 1582–9999`)
  if (month > 12) return tolak('tanggal-tidak-sah', `bulan ${month} di luar 0–12`)
  if (day > 31) return tolak('tanggal-tidak-sah', `hari ${day} di luar 0–31`)
  if (hours > 23 || minutes > 59 || seconds > 59) return tolak('tanggal-tidak-sah', `jam ${hours}:${minutes}:${seconds} di luar rentang`)
  return {
    ok: true,
    value: { year: year || null, month: month || null, day: day || null, hours, minutes, seconds, timezone: 'tidak-diketahui' },
  }
}

export type BacaanSuhu = {
  value: number
  /** Satuan sesuai laporan perangkat; tidak dikonversi. */
  unit: 'Cel' | '[degF]'
  timestamp: WaktuPerangkat | null
  /** Kode Temperature Type mentah (GSS §3.242); daftar nama belum dirujuk ke sumber, jadi tidak diterjemahkan. */
  temperatureTypeCode: number | null
  flags: number
}

/** Temperature Measurement 0x2A1C (GSS §3.239). */
export function decodeTemperatureMeasurement(b: Uint8Array): Hasil<BacaanSuhu> {
  if (!(b instanceof Uint8Array)) return tolak('bukan-byte', 'Temperature Measurement harus Uint8Array')
  if (b.length < 5) return tolak('terlalu-pendek', 'butuh flags + medfloat32')
  const flags = b[0]
  const nilai = decodeFloat((b[1] | (b[2] << 8) | (b[3] << 16) | (b[4] << 24)) >>> 0)
  if (!nilai.ok) return tolak('nilai-khusus', `suhu bernilai khusus: ${nilai.reason}`)
  let i = 5
  let timestamp: WaktuPerangkat | null = null
  if (flags & 0x02) {
    const t = decodeDateTime(b, i)
    if (!t.ok) return t
    timestamp = t.value
    i += 7
  }
  let temperatureTypeCode: number | null = null
  if (flags & 0x04) {
    if (b.length < i + 1) return tolak('terlalu-pendek', 'Temperature Type terpotong')
    temperatureTypeCode = b[i]
    i += 1
  }
  if (i !== b.length) return tolak('panjang-tidak-cocok', `panjang ${b.length}, diharapkan ${i}`)
  return { ok: true, value: { value: nilai.value, unit: flags & 0x01 ? '[degF]' : 'Cel', timestamp, temperatureTypeCode, flags } }
}

export type MasalahMutuTekanan =
  | 'gerakan-tubuh'
  | 'manset-longgar'
  | 'nadi-ireguler'
  | 'nadi-di-atas-batas'
  | 'nadi-di-bawah-batas'
  | 'rentang-nadi-rfu'
  | 'posisi-tidak-tepat'

export type BacaanTekananDarah = {
  systolic: number
  diastolic: number
  /** null bila perangkat mengirim nilai khusus (NaN/NRes/±inf) untuk MAP. */
  meanArterial: number | null
  /** Satuan sesuai laporan perangkat; kPa tidak dikonversi ke mmHg. */
  unit: 'mm[Hg]' | 'kPa'
  timestamp: WaktuPerangkat | null
  pulseRate: number | null
  /** 'tidak-diketahui' untuk 0xFF (GSS §3.34.2). */
  userId: number | 'tidak-diketahui' | null
  /** Status mutu yang dilaporkan perangkat (GSS §3.34.3); bukan penilaian klinis. */
  qualityConcerns: MasalahMutuTekanan[]
  flags: number
}

/** Blood Pressure Measurement 0x2A35 (GSS §3.34). */
export function decodeBloodPressureMeasurement(b: Uint8Array): Hasil<BacaanTekananDarah> {
  if (!(b instanceof Uint8Array)) return tolak('bukan-byte', 'Blood Pressure Measurement harus Uint8Array')
  if (b.length < 7) return tolak('terlalu-pendek', 'butuh flags + 3 medfloat16')
  const flags = b[0]
  const sf = (j: number) => decodeSfloat(b[j] | (b[j + 1] << 8))
  const [sys, dia, map] = [sf(1), sf(3), sf(5)]
  if (!sys.ok) return tolak('nilai-khusus', `sistolik bernilai khusus: ${sys.reason}`)
  if (!dia.ok) return tolak('nilai-khusus', `diastolik bernilai khusus: ${dia.reason}`)
  let i = 7
  let timestamp: WaktuPerangkat | null = null
  if (flags & 0x02) {
    const t = decodeDateTime(b, i)
    if (!t.ok) return t
    timestamp = t.value
    i += 7
  }
  let pulseRate: number | null = null
  if (flags & 0x04) {
    if (b.length < i + 2) return tolak('terlalu-pendek', 'Pulse Rate terpotong')
    const p = sf(i)
    pulseRate = p.ok ? p.value : null
    i += 2
  }
  let userId: BacaanTekananDarah['userId'] = null
  if (flags & 0x08) {
    if (b.length < i + 1) return tolak('terlalu-pendek', 'User ID terpotong')
    userId = b[i] === 0xff ? 'tidak-diketahui' : b[i]
    i += 1
  }
  const qualityConcerns: MasalahMutuTekanan[] = []
  if (flags & 0x10) {
    if (b.length < i + 2) return tolak('terlalu-pendek', 'Measurement Status terpotong')
    const s = b[i] | (b[i + 1] << 8)
    if (s & 0x01) qualityConcerns.push('gerakan-tubuh')
    if (s & 0x02) qualityConcerns.push('manset-longgar')
    if (s & 0x04) qualityConcerns.push('nadi-ireguler')
    const rentang = (s >> 3) & 0x03
    if (rentang === 0b01) qualityConcerns.push('nadi-di-atas-batas')
    if (rentang === 0b10) qualityConcerns.push('nadi-di-bawah-batas')
    if (rentang === 0b11) qualityConcerns.push('rentang-nadi-rfu')
    if (s & 0x20) qualityConcerns.push('posisi-tidak-tepat')
    i += 2
  }
  if (i !== b.length) return tolak('panjang-tidak-cocok', `panjang ${b.length}, diharapkan ${i}`)
  return {
    ok: true,
    value: {
      systolic: sys.value,
      diastolic: dia.value,
      meanArterial: map.ok ? map.value : null,
      unit: flags & 0x01 ? 'kPa' : 'mm[Hg]',
      timestamp,
      pulseRate,
      userId,
      qualityConcerns,
      flags,
    },
  }
}

export type JalurPerangkat = 'baca-langsung' | 'perlu-decoder' | 'aplikasi-pendamping'

export type KlasifikasiPerangkat = {
  /** Layanan standar yang punya decoder teruji di modul ini. */
  readable: number[]
  /** Layanan standar yang dikenali tetapi belum punya decoder (tidak boleh dipalsukan). */
  recognizedWithoutDecoder: number[]
  /** UUID non-standar (vendor): tidak didekode tanpa fixture dari perangkat milik pengguna. */
  vendorUuids: string[]
  route: JalurPerangkat
}

const BISA_DIBACA = new Set<number>([LAYANAN_GATT.heartRate, LAYANAN_GATT.healthThermometer, LAYANAN_GATT.bloodPressure])
const DIKENALI = new Set<number>([
  LAYANAN_GATT.pulseOximeter, LAYANAN_GATT.weightScale, LAYANAN_GATT.glucose,
  LAYANAN_GATT.continuousGlucoseMonitoring, LAYANAN_GATT.bodyComposition,
])

/**
 * Klasifikasi layanan yang ditemukan pada perangkat. `number` = nomor layanan 16-bit SIG (adapter browser yang
 * memetakan UUID 128-bit lewat BluetoothUUID); `string` = UUID 128-bit di luar daftar SIG.
 * Layanan informasi (Device Information, Battery) dan nomor 16-bit lain tidak mengubah jalur.
 */
export function classifyGattServices(services: ReadonlyArray<number | string>): KlasifikasiPerangkat {
  const readable: number[] = []
  const recognizedWithoutDecoder: number[] = []
  const vendorUuids: string[] = []
  for (const s of services) {
    if (typeof s === 'string') {
      const uuid = s.trim().toLowerCase()
      if (uuid && !vendorUuids.includes(uuid)) vendorUuids.push(uuid)
    } else if (Number.isInteger(s) && s >= 0 && s <= 0xffff) {
      if (BISA_DIBACA.has(s) && !readable.includes(s)) readable.push(s)
      else if (DIKENALI.has(s) && !recognizedWithoutDecoder.includes(s)) recognizedWithoutDecoder.push(s)
    }
  }
  const route: JalurPerangkat = readable.length > 0 ? 'baca-langsung' : recognizedWithoutDecoder.length > 0 ? 'perlu-decoder' : 'aplikasi-pendamping'
  return { readable, recognizedWithoutDecoder, vendorUuids, route }
}
