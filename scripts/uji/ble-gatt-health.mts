import test from 'node:test'; import assert from 'node:assert/strict'
import {
  decodeSfloat, decodeFloat, decodeDateTime,
  decodeTemperatureMeasurement, decodeBloodPressureMeasurement,
  classifyGattServices, LAYANAN_GATT,
} from '../../src/domains/devices/index.ts'

const u8 = (...b: number[]) => Uint8Array.from(b)
const le16 = (v: number) => [v & 0xff, (v >> 8) & 0xff]
const le32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]
// 2026-11-15 18:08:11 (tanpa zona waktu, sesuai GSS §3.80)
const WAKTU = [...le16(2026), 11, 15, 18, 8, 11]

// --- medfloat: contoh emas dari white paper PHD Transcoding v16 (Bluetooth SIG) §2.2.1–2.2.2 ---
test('menerima_sfloat_contoh_emas_114_mmhg', () => {
  assert.deepEqual(decodeSfloat(0x0072), { ok: true, value: 114, mantissa: 114, exponent: 0 })
})
test('menerima_float_contoh_emas_36_4_celsius', () => {
  assert.deepEqual(decodeFloat(0xff00016c), { ok: true, value: 36.4, mantissa: 364, exponent: -1 })
})
test('sfloat_mantisa_dan_eksponen_negatif_komplemen_dua', () => {
  // eksponen 0xF = -1, mantisa 0xFFF = -1 → -0.1
  assert.deepEqual(decodeSfloat(0xffff), { ok: true, value: -0.1, mantissa: -1, exponent: -1 })
})
test('menolak_lima_nilai_khusus_sfloat_dan_float', () => {
  for (const [raw, r] of [[0x07ff, 'nan'], [0x0800, 'nres'], [0x07fe, '+inf'], [0x0802, '-inf'], [0x0801, 'rfu']] as const) {
    assert.deepEqual(decodeSfloat(raw), { ok: false, reason: r })
  }
  for (const [raw, r] of [[0x007fffff, 'nan'], [0x00800000, 'nres'], [0x007ffffe, '+inf'], [0x00800002, '-inf'], [0x00800001, 'rfu']] as const) {
    assert.deepEqual(decodeFloat(raw), { ok: false, reason: r })
  }
})
test('berpasangan_sfloat_tepat_di_sebelah_nan_masih_angka', () => {
  // 0x07FD hanya berbeda satu langkah dari +inf (0x07FE): mantisa 2045, eksponen 0
  assert.deepEqual(decodeSfloat(0x07fd), { ok: true, value: 2045, mantissa: 2045, exponent: 0 })
})

// --- Date Time (GSS §3.80) ---
test('menerima_date_time_lengkap', () => {
  const r = decodeDateTime(u8(...WAKTU))
  assert.deepEqual(r, { ok: true, value: { year: 2026, month: 11, day: 15, hours: 18, minutes: 8, seconds: 11, timezone: 'tidak-diketahui' } })
})
test('date_time_nol_berarti_tidak_diketahui_bukan_tebakan', () => {
  const r = decodeDateTime(u8(0, 0, 0, 0, 0, 0, 0))
  assert.ok(r.ok)
  assert.equal(r.value.year, null); assert.equal(r.value.month, null); assert.equal(r.value.day, null)
})
test('date_time_batas_tahun_1582_dan_9999_diterima_1581_dan_10000_ditolak', () => {
  assert.equal(decodeDateTime(u8(...le16(1582), 1, 1, 0, 0, 0)).ok, true)
  assert.equal(decodeDateTime(u8(...le16(9999), 12, 31, 23, 59, 59)).ok, true)
  assert.equal(decodeDateTime(u8(...le16(1581), 1, 1, 0, 0, 0)).ok, false)
  assert.deepEqual(decodeDateTime(u8(...le16(10000), 1, 1, 0, 0, 0)), { ok: false, reason: 'tanggal-tidak-sah', detail: 'tahun 10000 di luar 1582–9999' })
})
test('date_time_menolak_bulan_13_jam_24_menit_60', () => {
  assert.equal(decodeDateTime(u8(...le16(2026), 13, 1, 0, 0, 0)).ok, false)
  assert.equal(decodeDateTime(u8(...le16(2026), 1, 1, 24, 0, 0)).ok, false)
  assert.equal(decodeDateTime(u8(...le16(2026), 1, 1, 0, 60, 0)).ok, false)
})
test('date_time_menolak_kurang_dari_7_oktet', () => {
  assert.deepEqual(decodeDateTime(u8(...WAKTU.slice(0, 6))), { ok: false, reason: 'terlalu-pendek', detail: 'Date Time butuh 7 oktet' })
})

// --- Temperature Measurement 0x2A1C (GSS §3.239) ---
test('menerima_suhu_celsius_contoh_emas_tanpa_konversi', () => {
  assert.deepEqual(decodeTemperatureMeasurement(u8(0x00, ...le32(0xff00016c))), {
    ok: true, value: { value: 36.4, unit: 'Cel', timestamp: null, temperatureTypeCode: null, flags: 0 },
  })
})
test('berpasangan_flag_fahrenheit_hanya_mengganti_satuan', () => {
  const r = decodeTemperatureMeasurement(u8(0x01, ...le32(0xff00016c)))
  assert.ok(r.ok)
  assert.equal(r.value.unit, '[degF]')
  assert.equal(r.value.value, 36.4)
})
test('menerima_suhu_dengan_waktu_dan_kode_tipe_mentah', () => {
  const r = decodeTemperatureMeasurement(u8(0x06, ...le32(0xff00016c), ...WAKTU, 2))
  assert.ok(r.ok)
  assert.equal(r.value.timestamp?.year, 2026)
  assert.equal(r.value.temperatureTypeCode, 2)
})
test('menolak_suhu_nan_dari_perangkat', () => {
  assert.deepEqual(decodeTemperatureMeasurement(u8(0x00, ...le32(0x007fffff))), { ok: false, reason: 'nilai-khusus', detail: 'suhu bernilai khusus: nan' })
})
test('menolak_suhu_dengan_waktu_tidak_sah_atau_panjang_salah', () => {
  assert.equal(decodeTemperatureMeasurement(u8(0x02, ...le32(0xff00016c), ...le16(2026), 13, 1, 0, 0, 0)).reason, 'tanggal-tidak-sah')
  assert.equal(decodeTemperatureMeasurement(u8(0x00, ...le32(0xff00016c), 9)).reason, 'panjang-tidak-cocok')
  assert.equal(decodeTemperatureMeasurement(u8(0x04, ...le32(0xff00016c))).reason, 'terlalu-pendek')
})

// --- Blood Pressure Measurement 0x2A35 (GSS §3.34) ---
const BP_INTI = [...le16(0x0072), ...le16(0x0050), ...le16(0x005d)] // 114 / 80 / 93 mmHg
test('menerima_tekanan_darah_mmhg_minimal', () => {
  assert.deepEqual(decodeBloodPressureMeasurement(u8(0x00, ...BP_INTI)), {
    ok: true,
    value: { systolic: 114, diastolic: 80, meanArterial: 93, unit: 'mm[Hg]', timestamp: null, pulseRate: null, userId: null, qualityConcerns: [], flags: 0 },
  })
})
test('berpasangan_flag_kpa_tidak_mengonversi_nilai', () => {
  const r = decodeBloodPressureMeasurement(u8(0x01, ...BP_INTI))
  assert.ok(r.ok)
  assert.equal(r.value.unit, 'kPa')
  assert.equal(r.value.systolic, 114)
})
test('menerima_tekanan_lengkap_dengan_waktu_nadi_pengguna_dan_status', () => {
  // status 0x002B: gerakan (b0) + manset longgar (b1) + nadi di atas batas (b3-4 = 01) + posisi (b5)
  const r = decodeBloodPressureMeasurement(u8(0x1e, ...BP_INTI, ...WAKTU, ...le16(0x0048), 0xff, ...le16(0x002b)))
  assert.ok(r.ok)
  assert.equal(r.value.timestamp?.minutes, 8)
  assert.equal(r.value.pulseRate, 72)
  assert.equal(r.value.userId, 'tidak-diketahui')
  assert.deepEqual(r.value.qualityConcerns, ['gerakan-tubuh', 'manset-longgar', 'nadi-di-atas-batas', 'posisi-tidak-tepat'])
})
test('status_rentang_nadi_bawah_dan_rfu', () => {
  const bawah = decodeBloodPressureMeasurement(u8(0x10, ...BP_INTI, ...le16(0b10 << 3)))
  const rfu = decodeBloodPressureMeasurement(u8(0x10, ...BP_INTI, ...le16(0b11 << 3)))
  assert.ok(bawah.ok && rfu.ok)
  assert.deepEqual(bawah.value.qualityConcerns, ['nadi-di-bawah-batas'])
  assert.deepEqual(rfu.value.qualityConcerns, ['rentang-nadi-rfu'])
})
test('map_dan_nadi_bernilai_khusus_menjadi_null_bukan_angka', () => {
  const r = decodeBloodPressureMeasurement(u8(0x04, ...le16(0x0072), ...le16(0x0050), ...le16(0x07ff), ...le16(0x0800)))
  assert.ok(r.ok)
  assert.equal(r.value.meanArterial, null)
  assert.equal(r.value.pulseRate, null)
})
test('menolak_sistolik_atau_diastolik_bernilai_khusus', () => {
  assert.deepEqual(decodeBloodPressureMeasurement(u8(0x00, ...le16(0x07ff), ...le16(0x0050), ...le16(0x005d))), { ok: false, reason: 'nilai-khusus', detail: 'sistolik bernilai khusus: nan' })
  assert.deepEqual(decodeBloodPressureMeasurement(u8(0x00, ...le16(0x0072), ...le16(0x0800), ...le16(0x005d))), { ok: false, reason: 'nilai-khusus', detail: 'diastolik bernilai khusus: nres' })
})
test('menolak_tekanan_terpotong_atau_berlebih', () => {
  assert.equal(decodeBloodPressureMeasurement(u8(0x00, ...BP_INTI.slice(0, 5))).reason, 'terlalu-pendek')
  assert.equal(decodeBloodPressureMeasurement(u8(0x04, ...BP_INTI)).reason, 'terlalu-pendek')
  assert.equal(decodeBloodPressureMeasurement(u8(0x00, ...BP_INTI, 0)).reason, 'panjang-tidak-cocok')
})

// --- klasifikasi layanan ---
test('perangkat_standar_detak_dibaca_langsung', () => {
  assert.deepEqual(classifyGattServices([LAYANAN_GATT.heartRate, LAYANAN_GATT.battery, LAYANAN_GATT.deviceInformation]), {
    readable: [0x180d], recognizedWithoutDecoder: [], vendorUuids: [], route: 'baca-langsung',
  })
})
test('oksimeter_dikenali_tetapi_tidak_dipalsukan', () => {
  assert.deepEqual(classifyGattServices([LAYANAN_GATT.pulseOximeter]), {
    readable: [], recognizedWithoutDecoder: [0x1822], vendorUuids: [], route: 'perlu-decoder',
  })
})
test('cgm_dan_komposisi_tubuh_dikenali_tanpa_decoder', () => {
  assert.equal(LAYANAN_GATT.continuousGlucoseMonitoring, 0x181f)
  assert.equal(LAYANAN_GATT.bodyComposition, 0x181b)
  assert.deepEqual(classifyGattServices([LAYANAN_GATT.continuousGlucoseMonitoring, LAYANAN_GATT.bodyComposition]), {
    readable: [], recognizedWithoutDecoder: [0x181f, 0x181b], vendorUuids: [], route: 'perlu-decoder',
  })
})
test('cgm_bersama_detak_jantung_tetap_baca_langsung', () => {
  assert.deepEqual(classifyGattServices([LAYANAN_GATT.continuousGlucoseMonitoring, LAYANAN_GATT.heartRate]), {
    readable: [0x180d], recognizedWithoutDecoder: [0x181f], vendorUuids: [], route: 'baca-langsung',
  })
})
test('gelang_vendor_saja_diarahkan_ke_aplikasi_pendamping', () => {
  const r = classifyGattServices(['  0000FF01-AAAA-BBBB-CCCC-DDDDEEEEFFFF ', '0000ff01-aaaa-bbbb-cccc-ddddeeeeffff', LAYANAN_GATT.battery])
  assert.deepEqual(r, { readable: [], recognizedWithoutDecoder: [], vendorUuids: ['0000ff01-aaaa-bbbb-cccc-ddddeeeeffff'], route: 'aplikasi-pendamping' })
})
test('klasifikasi_mengabaikan_nomor_tidak_sah', () => {
  assert.equal(classifyGattServices([-1, 0x10000, 1.5, Number.NaN]).route, 'aplikasi-pendamping')
  assert.equal(classifyGattServices([]).route, 'aplikasi-pendamping')
})
test('deterministik_dua_kali_jalan_identik', () => {
  const p = u8(0x1e, ...BP_INTI, ...WAKTU, ...le16(0x0048), 3, ...le16(0x0001))
  assert.deepEqual(decodeBloodPressureMeasurement(p), decodeBloodPressureMeasurement(p))
})
