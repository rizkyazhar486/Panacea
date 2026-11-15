// Standard Bluetooth characteristics read from a person's wearable (src/domains/devices/engine). Byte layouts follow
// the Bluetooth SIG GATT Specification Supplement; every refusal is paired with a twin that differs only there.
//   - Heart Rate Measurement 0x2A37: flags, UINT8/UINT16 rate, contact states, Energy Expended, RR in 1/1024 s;
//   - Battery Level 0x2A19 (0-100), Body Sensor Location 0x2A38 (0-6), device text (cleaned, capped).
// All values are synthetic.
import assert from 'node:assert/strict'
import {
  parseHeartRateMeasurement, parseBatteryLevel, parseBodySensorLocation, cleanDeviceText, DEVICE_TEXT_MAX,
  type HeartRateParse, type HeartRateReading,
} from '../../src/domains/devices/index.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hr = (...bytes: number[]) => parseHeartRateMeasurement(Uint8Array.from(bytes))
const ok = (r: HeartRateParse): HeartRateReading => { assert.equal(r.ok, true, JSON.stringify(r)); return (r as Extract<HeartRateParse, { ok: true }>).reading }
const refused = (r: HeartRateParse, reason: string) => assert.deepEqual(r, { ok: false, reason })

gagal('detak_uint8_dengan_kontak_terdeteksi', () => {
  assert.deepEqual(ok(hr(0x06, 72)), { bpm: 72, contact: 'detected', energyExpendedKj: null, rrMs: [] })
})

gagal('bit_format_menentukan_lebar_detak', () => {
  assert.equal(ok(hr(0x01, 0x3c, 0x01)).bpm, 316, 'UINT16 little-endian 0x013C')
  // Twin: the same bytes with the format bit clear read one byte; the RR flag is clear, so the rest is not a field.
  assert.equal(ok(hr(0x00, 0x3c, 0x01)).bpm, 60)
})

gagal('kontak_kulit_tiga_keadaan', () => {
  assert.equal(ok(hr(0x00, 70)).contact, 'not-supported')
  assert.equal(ok(hr(0x02, 70)).contact, 'not-supported', 'detected bit without the supported bit means not supported')
  assert.equal(ok(hr(0x04, 70)).contact, 'not-detected')
  assert.equal(ok(hr(0x06, 70)).contact, 'detected')
})

gagal('energi_dan_rr_dibaca_berurutan', () => {
  assert.deepEqual(ok(hr(0x18, 65, 0x02, 0x01, 0x00, 0x04, 0x00, 0x02)),
    { bpm: 65, contact: 'not-supported', energyExpendedKj: 258, rrMs: [1000, 500] })
  // RR without energy: the intervals start right after the rate.
  assert.deepEqual(ok(hr(0x10, 65, 0x00, 0x04)).rrMs, [1000])
})

gagal('rr_dari_satuan_1_per_1024_detik_eksak', () => {
  assert.deepEqual(ok(hr(0x10, 60, 0x01, 0x00)).rrMs, [0.9765625])
  assert.deepEqual(ok(hr(0x10, 60, 0xff, 0xff)).rrMs, [63999.0234375])
  assert.deepEqual(ok(hr(0x10, 60, 0x00, 0x04, 0xcd, 0x03)).rrMs, [1000, 950.1953125])
})

gagal('bit_cadangan_diabaikan', () => {
  assert.deepEqual(ok(hr(0xe6, 72)), ok(hr(0x06, 72)))
})

gagal('menolak_paket_kosong', () => {
  refused(hr(), 'empty')
})

gagal('menolak_detak_terpotong', () => {
  refused(hr(0x01, 0x3c), 'truncated')
  refused(hr(0x00), 'truncated')
  assert.equal(ok(hr(0x01, 0x3c, 0x00)).bpm, 60)
})

gagal('menolak_energi_terpotong', () => {
  refused(hr(0x08, 60, 0x01), 'truncated')
  assert.equal(ok(hr(0x08, 60, 0x01, 0x00)).energyExpendedKj, 1)
})

gagal('menolak_byte_rr_ganjil', () => {
  refused(hr(0x10, 60, 0x00, 0x04, 0x00), 'odd-rr-bytes')
  assert.deepEqual(ok(hr(0x10, 60, 0x00, 0x04)).rrMs, [1000])
})

gagal('menolak_interval_rr_nol', () => {
  refused(hr(0x10, 60, 0x00, 0x00), 'zero-rr')
  refused(hr(0x10, 60, 0x00, 0x04, 0x00, 0x00), 'zero-rr')
  assert.deepEqual(ok(hr(0x10, 60, 0x01, 0x00)).rrMs, [0.9765625])
})

gagal('detak_nol_bukan_bacaan', () => {
  refused(hr(0x06, 0), 'no-heart-rate')
  refused(hr(0x01, 0x00, 0x00), 'no-heart-rate')
  assert.equal(ok(hr(0x06, 1)).bpm, 1, 'the smallest non-zero rate is a reading')
})

gagal('baterai_nol_sampai_seratus', () => {
  assert.equal(parseBatteryLevel(Uint8Array.from([0])), 0)
  assert.equal(parseBatteryLevel(Uint8Array.from([100])), 100)
  assert.equal(parseBatteryLevel(Uint8Array.from([101])), null)
  assert.equal(parseBatteryLevel(Uint8Array.from([255])), null)
  assert.equal(parseBatteryLevel(Uint8Array.from([])), null)
  assert.equal(parseBatteryLevel(Uint8Array.from([50, 0])), null)
})

gagal('lokasi_sensor_tujuh_kode_sisanya_tidak_diketahui', () => {
  const at = (b: number) => parseBodySensorLocation(Uint8Array.from([b]))
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(at), ['other', 'chest', 'wrist', 'finger', 'hand', 'ear-lobe', 'foot'])
  assert.equal(at(7), null)
  assert.equal(at(255), null)
  assert.equal(parseBodySensorLocation(Uint8Array.from([])), null)
  assert.equal(parseBodySensorLocation(Uint8Array.from([1, 2])), null)
})

gagal('teks_perangkat_dibersihkan_dan_dibatasi', () => {
  const utf8 = (s: string) => new TextEncoder().encode(s)
  assert.equal(cleanDeviceText(utf8('Strap One\u0000\u0000')), 'Strap One')
  assert.equal(cleanDeviceText(utf8('Ba\u0007nd')), 'Band')
  assert.equal(cleanDeviceText('  Ring 2  '), 'Ring 2')
  assert.equal(cleanDeviceText(utf8('   ')), null)
  assert.equal(cleanDeviceText(Uint8Array.from([0xff, 0xfe])), null, 'invalid UTF-8 is unknown, not mojibake')
  assert.equal(cleanDeviceText(null), null)
  assert.equal(cleanDeviceText(undefined), null)
  assert.equal(cleanDeviceText('x'.repeat(100)), 'x'.repeat(DEVICE_TEXT_MAX))
  assert.equal(cleanDeviceText('x'.repeat(DEVICE_TEXT_MAX)), 'x'.repeat(DEVICE_TEXT_MAX))
  // The cap counts characters, so it never splits a character in two.
  assert.equal(cleanDeviceText('😀'.repeat(70)), '😀'.repeat(DEVICE_TEXT_MAX))
})

const { parseHeartRateMeasurement: workoutParse } = await import('../../src/lib/useLiveHeartRate.ts')
gagal('parser_latihan_memakai_parser_domain', () => {
  const view = (...b: number[]) => new DataView(Uint8Array.from(b).buffer)
  assert.equal(workoutParse(view(0x00, 72)), 72)
  assert.equal(workoutParse(view(0x01, 0x3c, 0x01)), 316)
  // Before: a truncated UINT16 packet threw a RangeError inside the Bluetooth event handler. Now it is no reading.
  assert.equal(workoutParse(view(0x01, 0x3c)), 0)
  assert.equal(workoutParse(view(0x06, 0)), 0)
  // A view into the middle of a larger buffer reads only its own bytes.
  const big = Uint8Array.from([0xff, 0x00, 0x48, 0xff])
  assert.equal(workoutParse(new DataView(big.buffer, 1, 2)), 72)
})

console.log('ble gatt parsers: heart rate (UINT8/UINT16, contact, energy, RR in 1/1024 s), battery, sensor location and device text follow the standard; malformed packets are refused whole')
