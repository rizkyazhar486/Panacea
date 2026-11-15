// The Web Bluetooth boundary (src/domains/devices/adapters/webBluetooth.ts) against an in-memory fake of the browser
// API: what is requested, what is read, how every failure is named, and that nothing arrives after a disconnect.
// The fake speaks only the standard services; all values are synthetic.
import assert from 'node:assert/strict'
import {
  bluetoothAvailability, connectHeartRateWearable, type BluetoothLike, type HeartRateParse,
} from '../../src/domains/devices/index.ts'

const gagal = async (nama: string, f: () => Promise<void> | void) => {
  try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) }
}

class FakeTarget {
  listeners = new Map<string, Set<() => void>>()
  addEventListener(type: string, l: () => void) { (this.listeners.get(type) ?? this.listeners.set(type, new Set()).get(type)!).add(l) }
  removeEventListener(type: string, l: () => void) { this.listeners.get(type)?.delete(l) }
  fire(type: string) { for (const l of [...(this.listeners.get(type) ?? [])]) l() }
  count(type: string) { return this.listeners.get(type)?.size ?? 0 }
}
class FakeCharacteristic extends FakeTarget {
  value: DataView | null = null
  notifying = false
  constructor(private readonly initial: number[] = [], private readonly canNotify = true) { super() }
  async readValue() { return new DataView(Uint8Array.from(this.initial).buffer) }
  async startNotifications() { if (!this.canNotify) throw Object.assign(new Error('no notify'), { name: 'NotSupportedError' }); this.notifying = true }
  emit(bytes: number[]) { this.value = new DataView(Uint8Array.from(bytes).buffer); this.fire('characteristicvaluechanged') }
}
const notFound = () => Object.assign(new Error('not found'), { name: 'NotFoundError' })
function service(chars: Record<string, FakeCharacteristic>) {
  return { async getCharacteristic(name: string) { const c = chars[name]; if (!c) throw notFound(); return c } }
}

function fakeDevice(opts: { name?: string; withInfo?: boolean; withBattery?: boolean; withHeartRate?: boolean } = {}) {
  const measurement = new FakeCharacteristic()
  const battery = new FakeCharacteristic([80])
  const services: Record<string, ReturnType<typeof service>> = {}
  if (opts.withHeartRate !== false) {
    services.heart_rate = service({ heart_rate_measurement: measurement, body_sensor_location: new FakeCharacteristic([1]) })
  }
  if (opts.withInfo !== false) {
    services.device_information = service({
      manufacturer_name_string: new FakeCharacteristic([...new TextEncoder().encode('Acme\u0000')]),
      model_number_string: new FakeCharacteristic([...new TextEncoder().encode('Strap One')]),
    })
  }
  if (opts.withBattery !== false) services.battery_service = service({ battery_level: battery })
  let disconnects = 0
  const device = Object.assign(new FakeTarget(), {
    name: opts.name ?? 'Strap One',
    gatt: {
      connected: true,
      async connect() { return this },
      disconnect() { disconnects += 1 },
      async getPrimaryService(name: string) { const s = services[name]; if (!s) throw notFound(); return s },
    },
  })
  const requests: unknown[] = []
  const bluetooth: BluetoothLike = { async requestDevice(o) { requests.push(o); return device } }
  return { bluetooth, device, measurement, battery, requests, disconnects: () => disconnects }
}

function recorder() {
  const packets: [HeartRateParse, number][] = []
  const battery: number[] = []
  let disconnected = 0
  return {
    packets, battery, get disconnected() { return disconnected },
    handlers: { onPacket: (p: HeartRateParse, t: number) => { packets.push([p, t]) }, onBattery: (b: number) => { battery.push(b) }, onDisconnected: () => { disconnected += 1 } },
  }
}

await gagal('ketersediaan_menurut_platform', () => {
  const bt = { requestDevice() {} }
  assert.equal(bluetoothAvailability({ bluetooth: bt, isSecureContext: true }), 'available')
  assert.equal(bluetoothAvailability({ bluetooth: undefined, isSecureContext: true }), 'no-web-bluetooth')
  assert.equal(bluetoothAvailability({ bluetooth: {}, isSecureContext: true }), 'no-web-bluetooth')
  assert.equal(bluetoothAvailability({ bluetooth: bt, isSecureContext: false }), 'insecure-page')
})

await gagal('tersambung_membaca_info_baterai_dan_lokasi', async () => {
  const f = fakeDevice()
  const r = recorder()
  const out = await connectHeartRateWearable(f.bluetooth, r.handlers, () => 1234)
  assert.equal(out.ok, true)
  if (!out.ok) return
  assert.deepEqual(f.requests, [{ filters: [{ services: ['heart_rate'] }], optionalServices: ['battery_service', 'device_information'] }])
  const { name, manufacturer, model, sensorLocation, batteryPercent } = out.wearable
  assert.deepEqual({ name, manufacturer, model, sensorLocation, batteryPercent },
    { name: 'Strap One', manufacturer: 'Acme', model: 'Strap One', sensorLocation: 'chest', batteryPercent: 80 })
  assert.equal(f.measurement.notifying, true)
})

await gagal('notifikasi_diurai_dan_diberi_waktu', async () => {
  const f = fakeDevice()
  const r = recorder()
  let clock = 100
  const out = await connectHeartRateWearable(f.bluetooth, r.handlers, () => clock)
  assert.equal(out.ok, true)
  f.measurement.emit([0x16, 64, 0x00, 0x04])
  clock = 1100
  f.measurement.emit([0x01, 0x3c])
  assert.deepEqual(r.packets, [
    [{ ok: true, reading: { bpm: 64, contact: 'detected', energyExpendedKj: null, rrMs: [1000] } }, 100],
    [{ ok: false, reason: 'truncated' }, 1100],
  ])
  f.battery.emit([55])
  f.battery.emit([150])
  assert.deepEqual(r.battery, [55], 'an out-of-range battery value is not passed on')
})

await gagal('tanpa_layanan_opsional_tetap_tersambung', async () => {
  const f = fakeDevice({ withInfo: false, withBattery: false })
  const out = await connectHeartRateWearable(f.bluetooth, recorder().handlers)
  assert.equal(out.ok, true)
  if (!out.ok) return
  assert.deepEqual([out.wearable.manufacturer, out.wearable.model, out.wearable.batteryPercent], [null, null, null])
})

await gagal('kegagalan_diberi_nama', async () => {
  const failing = (name: string): BluetoothLike => ({ async requestDevice() { throw Object.assign(new Error(name), { name }) } })
  const reason = async (bt: BluetoothLike | null) => { const o = await connectHeartRateWearable(bt, recorder().handlers); return o.ok ? 'ok' : o.reason }
  assert.equal(await reason(failing('NotFoundError')), 'cancelled')
  assert.equal(await reason(failing('SecurityError')), 'blocked')
  assert.equal(await reason(failing('NotAllowedError')), 'blocked')
  assert.equal(await reason(failing('NotSupportedError')), 'unavailable')
  assert.equal(await reason(failing('NetworkError')), 'failed')
  assert.equal(await reason(null), 'unavailable')
})

await gagal('tanpa_layanan_detak_ditolak_dan_diputus', async () => {
  const f = fakeDevice({ withHeartRate: false })
  const out = await connectHeartRateWearable(f.bluetooth, recorder().handlers)
  assert.deepEqual(out, { ok: false, reason: 'no-heart-rate-service' })
  assert.equal(f.disconnects(), 1)
})

await gagal('putus_dari_perangkat_sekali_dan_tanpa_paket_sesudahnya', async () => {
  const f = fakeDevice()
  const r = recorder()
  await connectHeartRateWearable(f.bluetooth, r.handlers)
  f.device.fire('gattserverdisconnected')
  f.device.fire('gattserverdisconnected')
  f.measurement.emit([0x00, 70])
  assert.equal(r.disconnected, 1)
  assert.equal(r.packets.length, 0)
  assert.equal(f.measurement.count('characteristicvaluechanged'), 0, 'listeners removed')
})

await gagal('putus_manual_sekali', async () => {
  const f = fakeDevice()
  const r = recorder()
  const out = await connectHeartRateWearable(f.bluetooth, r.handlers)
  assert.equal(out.ok, true)
  if (!out.ok) return
  out.wearable.disconnect()
  out.wearable.disconnect()
  f.measurement.emit([0x00, 70])
  assert.equal(f.disconnects(), 1)
  assert.equal(r.disconnected, 1)
  assert.equal(r.packets.length, 0)
})

await gagal('nama_perangkat_dibersihkan', async () => {
  const f = fakeDevice({ name: '\u0007Band\u0000' })
  const out = await connectHeartRateWearable(f.bluetooth, recorder().handlers)
  assert.equal(out.ok && out.wearable.name, 'Band')
})

console.log('ble web bluetooth adapter: requests only the standard services, reads what the device offers, names every failure, and delivers nothing after a disconnect')
