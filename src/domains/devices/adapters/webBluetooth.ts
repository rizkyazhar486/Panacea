/**
 * Web Bluetooth boundary: the only place the browser's Bluetooth radio is touched. Everything it receives goes
 * through the engine parsers before anyone sees it.
 *
 * What the platform allows (and therefore what this can promise):
 * - Web Bluetooth exists in Chromium browsers (Chrome, Edge) on Android, ChromeOS, macOS and Windows. iPhone and iPad
 *   browsers, Safari and Firefox do not have it: there the answer is "not available here", never a fake connection.
 * - The browser shows its own device chooser; nothing connects without the person picking a device. Only the
 *   standard services named below are reachable — a device's private protocol is not, and is not guessed.
 * - A secure (https) page is required.
 */
import { parseHeartRateMeasurement, type HeartRateParse } from '../engine/gattHeartRate.ts'
import { cleanDeviceText, parseBatteryLevel, parseBodySensorLocation, type SensorLocation } from '../engine/gattCommon.ts'

// Minimal structural types for the parts of Web Bluetooth used here (the DOM library does not declare them).
interface ValueEventTarget {
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}
export interface CharacteristicLike extends ValueEventTarget {
  readonly value?: DataView | null
  readValue(): Promise<DataView>
  startNotifications(): Promise<unknown>
  stopNotifications?(): Promise<unknown>
}
export interface ServiceLike {
  getCharacteristic(name: string): Promise<CharacteristicLike>
}
export interface GattServerLike {
  readonly connected?: boolean
  connect(): Promise<GattServerLike>
  disconnect(): void
  getPrimaryService(name: string): Promise<ServiceLike>
}
export interface DeviceLike extends ValueEventTarget {
  readonly name?: string | null
  readonly gatt?: GattServerLike | null
}
export interface BluetoothLike {
  requestDevice(options: {
    filters: readonly { services: readonly string[] }[]
    optionalServices: readonly string[]
  }): Promise<DeviceLike>
  getDevices?(): Promise<readonly DeviceLike[]>
}

export type BluetoothAvailability = 'available' | 'no-web-bluetooth' | 'insecure-page'

export function bluetoothAvailability(env: { bluetooth?: unknown; isSecureContext?: boolean }): BluetoothAvailability {
  if (env.isSecureContext === false) return 'insecure-page'
  const bt = env.bluetooth as { requestDevice?: unknown } | undefined
  return bt && typeof bt.requestDevice === 'function' ? 'available' : 'no-web-bluetooth'
}

export interface ConnectedWearable {
  /** Advertised name, manufacturer and model as the device reports them (cleaned), or null when not reported. */
  readonly name: string | null
  readonly manufacturer: string | null
  readonly model: string | null
  readonly sensorLocation: SensorLocation | null
  readonly batteryPercent: number | null
  /** Stops notifications and disconnects; safe to call more than once. */
  disconnect(): void
}

export type ConnectRefusal = 'cancelled' | 'unavailable' | 'blocked' | 'no-heart-rate-service' | 'failed'
export type ConnectOutcome =
  | { readonly ok: true; readonly wearable: ConnectedWearable }
  | { readonly ok: false; readonly reason: ConnectRefusal }

export interface WearableHandlers {
  /** Every heart-rate packet, already parsed; `atMs` from the injected clock. */
  onPacket(packet: HeartRateParse, atMs: number): void
  onBattery?(percent: number): void
  /** The device went away (out of range, switched off) or disconnect() was called. Called once. */
  onDisconnected(): void
}

const HEART_RATE = 'heart_rate'
const OPTIONAL = ['battery_service', 'device_information'] as const

const bytesOf = (view: DataView | null | undefined): Uint8Array =>
  view ? new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)) : new Uint8Array(0)

function refusalOf(error: unknown): ConnectRefusal {
  const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: unknown }).name) : ''
  if (name === 'NotFoundError') return 'cancelled'
  if (name === 'SecurityError' || name === 'NotAllowedError') return 'blocked'
  if (name === 'NotSupportedError') return 'unavailable'
  return 'failed'
}

/** Read one optional characteristic; a device without it simply has no value. */
async function readOptional<T>(service: ServiceLike | null, name: string, parse: (b: Uint8Array) => T | null): Promise<T | null> {
  if (!service) return null
  try {
    const characteristic = await service.getCharacteristic(name)
    return parse(bytesOf(await characteristic.readValue()))
  } catch {
    return null
  }
}

async function optionalService(server: GattServerLike, name: string): Promise<ServiceLike | null> {
  try { return await server.getPrimaryService(name) } catch { return null }
}

async function connectGattHeartRateDevice(
  device: DeviceLike,
  handlers: WearableHandlers,
  now: () => number,
): Promise<ConnectOutcome> {
  const gatt = device.gatt
  if (!gatt) return { ok: false, reason: 'failed' }

  let server: GattServerLike
  let heartRate: ServiceLike
  try {
    server = await gatt.connect()
  } catch (error) {
    return { ok: false, reason: refusalOf(error) === 'blocked' ? 'blocked' : 'failed' }
  }
  try {
    heartRate = await server.getPrimaryService(HEART_RATE)
  } catch {
    try { gatt.disconnect() } catch { /* already gone */ }
    return { ok: false, reason: 'no-heart-rate-service' }
  }

  const info = await optionalService(server, 'device_information')
  const batteryService = await optionalService(server, 'battery_service')
  const [manufacturer, model, sensorLocation, batteryPercent] = await Promise.all([
    readOptional(info, 'manufacturer_name_string', cleanDeviceText),
    readOptional(info, 'model_number_string', cleanDeviceText),
    readOptional(heartRate, 'body_sensor_location', parseBodySensorLocation),
    readOptional(batteryService, 'battery_level', parseBatteryLevel),
  ])

  let measurement: CharacteristicLike
  try {
    measurement = await heartRate.getCharacteristic('heart_rate_measurement')
    await measurement.startNotifications()
  } catch {
    try { gatt.disconnect() } catch { /* already gone */ }
    return { ok: false, reason: 'no-heart-rate-service' }
  }

  let ended = false
  let batteryLevel: CharacteristicLike | null = null
  const onMeasurement = () => { if (!ended) handlers.onPacket(parseHeartRateMeasurement(bytesOf(measurement.value)), now()) }
  const onBatteryLevel = () => {
    if (ended || !batteryLevel) return
    const percent = parseBatteryLevel(bytesOf(batteryLevel.value))
    if (percent !== null) handlers.onBattery?.(percent)
  }
  const end = () => {
    if (ended) return
    ended = true
    measurement.removeEventListener('characteristicvaluechanged', onMeasurement)
    batteryLevel?.removeEventListener('characteristicvaluechanged', onBatteryLevel)
    device.removeEventListener('gattserverdisconnected', end)
    handlers.onDisconnected()
  }
  measurement.addEventListener('characteristicvaluechanged', onMeasurement)
  device.addEventListener('gattserverdisconnected', end)

  if (batteryService && batteryPercent !== null) {
    try {
      batteryLevel = await batteryService.getCharacteristic('battery_level')
      await batteryLevel.startNotifications()
      batteryLevel.addEventListener('characteristicvaluechanged', onBatteryLevel)
    } catch {
      batteryLevel = null // battery updates are optional; the first reading stands
    }
  }

  return {
    ok: true,
    wearable: {
      name: cleanDeviceText(device.name),
      manufacturer,
      model,
      sensorLocation,
      batteryPercent,
      disconnect() {
        if (ended) return
        try { gatt.disconnect() } catch { /* already gone */ }
        end()
      },
    },
  }
}

export async function connectHeartRateWearable(
  bluetooth: BluetoothLike | null | undefined,
  handlers: WearableHandlers,
  now: () => number = () => performance.now(),
): Promise<ConnectOutcome> {
  if (!bluetooth || typeof bluetooth.requestDevice !== 'function') return { ok: false, reason: 'unavailable' }
  let device: DeviceLike
  try {
    device = await bluetooth.requestDevice({ filters: [{ services: [HEART_RATE] }], optionalServices: [...OPTIONAL] })
  } catch (error) {
    return { ok: false, reason: refusalOf(error) }
  }
  return connectGattHeartRateDevice(device, handlers, now)
}

/**
 * 1-Click Auto-Connect: reconnects to an already-paired Bluetooth LE heart-rate
 * wearable when the browser permits `getDevices()`, falling back seamlessly to the
 * standard browser chooser when no paired peripheral responds in range.
 */
export async function autoConnectWearable(
  bluetooth: BluetoothLike | null | undefined,
  handlers: WearableHandlers,
  now: () => number = () => performance.now(),
): Promise<ConnectOutcome> {
  if (!bluetooth) return { ok: false, reason: 'unavailable' }
  if (typeof bluetooth.getDevices === 'function') {
    try {
      const paired = await bluetooth.getDevices()
      for (const dev of paired) {
        if (!dev?.gatt) continue
        const attempt = await connectGattHeartRateDevice(dev, handlers, now)
        if (attempt.ok) return attempt
      }
    } catch {
      /* fall through to standard chooser */
    }
  }
  return connectHeartRateWearable(bluetooth, handlers, now)
}
