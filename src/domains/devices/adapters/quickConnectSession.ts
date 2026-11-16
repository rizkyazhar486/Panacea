/**
 * Shared 1-Click Auto-Connect Wearable session bridge for Home Dashboard and
 * Body Exposure Local Hub. Reuses canonical Bluetooth GATT parsers and pushes
 * real incoming heart-rate / R-R interval RMSSD updates to unified vitals stores.
 */

import { rmssd } from '../engine/beatIntervals.ts'
import { autoConnectWearable, bluetoothAvailability, type BluetoothLike, type ConnectedWearable } from './webBluetooth.ts'
import { recordConnectedDevice } from './deviceRegistry.ts'
import { mergeVitals } from '../../../lib/healthVitals.ts'
import { mergeHealthCache } from '../../../lib/profile.ts'

export interface QuickConnectState {
  readonly status: 'connecting' | 'connected' | 'unavailable' | 'cancelled' | 'error'
  readonly deviceName?: string | null
  readonly bpm?: number
  readonly hrvMs?: number
  readonly batteryPercent?: number | null
  readonly message: string
}

let activeWearable: ConnectedWearable | null = null

export function disconnectQuickWearable(): void {
  activeWearable?.disconnect()
  activeWearable = null
}

/**
 * Connect or auto-reconnect a Bluetooth LE wearable in one tap and stream
 * live Heart Rate + derived RMSSD HRV directly into unified longitudinal vitals.
 */
export async function triggerQuickWearableConnect(
  onUpdate: (state: QuickConnectState) => void,
): Promise<ConnectedWearable | null> {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    onUpdate({ status: 'unavailable', message: 'Bluetooth is only available in browser sessions.' })
    return null
  }
  const navBt = (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth
  const avail = bluetoothAvailability({ bluetooth: navBt, isSecureContext: window.isSecureContext })
  if (avail !== 'available' || !navBt) {
    onUpdate({
      status: 'unavailable',
      message:
        avail === 'insecure-page'
          ? 'HTTPS is required for Web Bluetooth — open via https://panaceamed.id.'
          : 'Web Bluetooth is unavailable on this browser (use Chrome/Edge or Health Import).',
    })
    return null
  }

  activeWearable?.disconnect()
  activeWearable = null
  onUpdate({ status: 'connecting', message: 'Scanning & reconnecting paired wearable…' })

  const rrWindow: number[] = []
  let deviceLabel = 'Bluetooth Wearable'

  const outcome = await autoConnectWearable(navBt, {
    onPacket(packet) {
      if (!packet.ok) return
      const hr = packet.reading.bpm
      for (const rr of packet.reading.rrMs) {
        if (Number.isFinite(rr) && rr > 250 && rr < 2500) rrWindow.push(rr)
      }
      if (rrWindow.length > 90) rrWindow.splice(0, rrWindow.length - 90)
      const hrvResult = rrWindow.length >= 6 ? rmssd(rrWindow) : null
      const hrvMs = hrvResult != null ? Math.round(hrvResult) : undefined

      const nowIso = new Date().toISOString()
      const patch = {
        heartRate: hr,
        restingHr: hr,
        ...(hrvMs !== undefined ? { hrvMs, hrvRmssdMs: hrvMs } : {}),
        source: deviceLabel,
        measuredAt: nowIso,
      }
      mergeVitals(patch)
      mergeHealthCache(patch)
      recordConnectedDevice({
        id: `ble:${deviceLabel.toLowerCase()}`,
        name: deviceLabel,
        transport: 'ble_gatt',
        lastMetrics: hrvMs !== undefined ? ['heartRate', 'restingHr', 'hrvMs'] : ['heartRate', 'restingHr'],
        pairedInBrowser: true,
      })
      try {
        window.dispatchEvent(new Event('panacea:body-character-updated'))
      } catch {
        /* ignore */
      }

      onUpdate({
        status: 'connected',
        deviceName: deviceLabel,
        bpm: hr,
        hrvMs,
        message: `${deviceLabel}: ${hr} bpm${hrvMs ? ` · HRV ${hrvMs} ms` : ''}`,
      })
    },
    onDisconnected() {
      activeWearable = null
    },
  })

  if (!outcome.ok) {
    const cancelled = outcome.reason === 'cancelled'
    onUpdate({
      status: cancelled ? 'cancelled' : 'error',
      message: cancelled
        ? 'Wearable picker closed. Tap anytime to pair or auto-reconnect.'
        : `Wearable connection refused (${outcome.reason}). Check Bluetooth permissions.`,
    })
    return null
  }

  activeWearable = outcome.wearable
  deviceLabel = outcome.wearable.name || outcome.wearable.model || 'Bluetooth Wearable'
  recordConnectedDevice({
    id: `ble:${deviceLabel.toLowerCase()}`,
    name: deviceLabel,
    transport: 'ble_gatt',
    manufacturer: outcome.wearable.manufacturer,
    model: outcome.wearable.model,
    sensorLocation: outcome.wearable.sensorLocation,
    batteryPercent: outcome.wearable.batteryPercent,
    pairedInBrowser: true,
  })
  onUpdate({
    status: 'connected',
    deviceName: deviceLabel,
    batteryPercent: outcome.wearable.batteryPercent,
    message: `Connected to ${deviceLabel}${outcome.wearable.batteryPercent != null ? ` (${outcome.wearable.batteryPercent}%)` : ''} · awaiting live beats…`,
  })
  return outcome.wearable
}
