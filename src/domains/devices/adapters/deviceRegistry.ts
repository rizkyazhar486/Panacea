/**
 * Persistent Connected Devices Registry for PanaceaMed.
 * Tracks every Bluetooth LE wearable, Apple Health / WHOOP / Garmin / Oura sync
 * source, and clinical home IoT device linked by the user so paired & previously
 * connected hardware stays visible and ready for 1-click reconnect across reloads.
 */

import type { BluetoothLike } from './webBluetooth.ts'

export const CONNECTED_DEVICES_KEY = 'panacea.connected_devices.v1'

export type DeviceTransportKind = 'ble_gatt' | 'health_sync' | 'file_import' | 'webhook'

export interface ConnectedDeviceRecord {
  readonly id: string
  readonly name: string
  readonly transport: DeviceTransportKind
  readonly manufacturer?: string | null
  readonly model?: string | null
  readonly sensorLocation?: string | null
  readonly batteryPercent?: number | null
  readonly lastConnectedAt: string
  readonly lastMetrics?: readonly string[]
  readonly ownerEmail?: string
  readonly pairedInBrowser?: boolean
}

function normalizeId(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function listSavedDevices(ownerEmail?: string): ConnectedDeviceRecord[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(CONNECTED_DEVICES_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    const cleanEmail = ownerEmail?.trim().toLowerCase()
    return (parsed as ConnectedDeviceRecord[]).filter((d) => {
      if (!d || typeof d.name !== 'string' || !d.name.trim()) return false
      if (!cleanEmail || !d.ownerEmail) return true
      return d.ownerEmail.toLowerCase() === cleanEmail
    })
  } catch {
    return []
  }
}

export function recordConnectedDevice(
  entry: Omit<ConnectedDeviceRecord, 'lastConnectedAt'> & { readonly lastConnectedAt?: string },
): ConnectedDeviceRecord[] {
  if (typeof localStorage === 'undefined' || !entry.name?.trim()) return []
  try {
    const all = JSON.parse(localStorage.getItem(CONNECTED_DEVICES_KEY) || '[]')
    const list: ConnectedDeviceRecord[] = Array.isArray(all) ? all : []
    const nextId = entry.id?.trim() || `dev:${normalizeId(entry.name)}`
    const existing = list.find(
      (d) => normalizeId(d.id) === normalizeId(nextId) || normalizeId(d.name) === normalizeId(entry.name),
    )
    const mergedMetrics = Array.from(
      new Set([...(existing?.lastMetrics ?? []), ...(entry.lastMetrics ?? [])]),
    ).slice(0, 12)
    const updated: ConnectedDeviceRecord = {
      id: nextId,
      name: entry.name.trim(),
      transport: entry.transport ?? existing?.transport ?? 'health_sync',
      manufacturer: entry.manufacturer ?? existing?.manufacturer ?? null,
      model: entry.model ?? existing?.model ?? null,
      sensorLocation: entry.sensorLocation ?? existing?.sensorLocation ?? null,
      batteryPercent: entry.batteryPercent ?? existing?.batteryPercent ?? null,
      lastConnectedAt: entry.lastConnectedAt ?? new Date().toISOString(),
      lastMetrics: mergedMetrics.length ? mergedMetrics : undefined,
      ownerEmail: entry.ownerEmail?.trim().toLowerCase() || existing?.ownerEmail,
      pairedInBrowser: entry.pairedInBrowser ?? existing?.pairedInBrowser,
    }
    const next = [
      updated,
      ...list.filter(
        (d) => normalizeId(d.id) !== normalizeId(nextId) && normalizeId(d.name) !== normalizeId(entry.name),
      ),
    ].slice(0, 30)
    localStorage.setItem(CONNECTED_DEVICES_KEY, JSON.stringify(next))
    try {
      window.dispatchEvent(new Event('panacea:devices-updated'))
    } catch {
      /* SSR / Node */
    }
    return next
  } catch {
    return []
  }
}

export function forgetSavedDevice(idOrName: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    const target = normalizeId(idOrName)
    const next = listSavedDevices().filter(
      (d) => normalizeId(d.id) !== target && normalizeId(d.name) !== target,
    )
    localStorage.setItem(CONNECTED_DEVICES_KEY, JSON.stringify(next))
    try {
      window.dispatchEvent(new Event('panacea:devices-updated'))
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

/**
 * Discover all devices associated with this user/browser:
 *  1) Persistent connected device registry (`panacea.connected_devices.v1`)
 *  2) Browser-permitted Web Bluetooth peripherals (`navigator.bluetooth.getDevices()`)
 *  3) Synced device sources present inside vitals & imported workout history
 */
export async function discoverConnectedDevices(options?: {
  readonly ownerEmail?: string
  readonly vitalsSource?: string
  readonly workoutSources?: readonly string[]
}): Promise<ConnectedDeviceRecord[]> {
  const byKey = new Map<string, ConnectedDeviceRecord>()
  const put = (d: ConnectedDeviceRecord) => {
    const k = normalizeId(d.name || d.id)
    if (!k) return
    const prev = byKey.get(k)
    if (!prev) {
      byKey.set(k, d)
      return
    }
    byKey.set(k, {
      ...prev,
      ...d,
      batteryPercent: d.batteryPercent ?? prev.batteryPercent,
      manufacturer: d.manufacturer ?? prev.manufacturer,
      model: d.model ?? prev.model,
      pairedInBrowser: d.pairedInBrowser || prev.pairedInBrowser,
      lastMetrics: Array.from(new Set([...(prev.lastMetrics ?? []), ...(d.lastMetrics ?? [])])),
    })
  }

  for (const saved of listSavedDevices(options?.ownerEmail)) put(saved)

  if (typeof navigator !== 'undefined') {
    const bt = (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth
    if (bt && typeof bt.getDevices === 'function') {
      try {
        const paired = await bt.getDevices()
        for (const p of paired) {
          const name = p?.name?.trim()
          if (!name) continue
          put({
            id: `ble:${normalizeId(name)}`,
            name,
            transport: 'ble_gatt',
            lastConnectedAt: new Date().toISOString(),
            pairedInBrowser: true,
            ownerEmail: options?.ownerEmail?.trim().toLowerCase(),
          })
        }
      } catch {
        /* browser refused getDevices without permission */
      }
    }
  }

  const addSource = (src: string | undefined, transport: DeviceTransportKind) => {
    const clean = src?.trim()
    if (!clean || /^(manual|health data)$/i.test(clean)) return
    put({
      id: `src:${normalizeId(clean)}`,
      name: clean,
      transport,
      lastConnectedAt: new Date().toISOString(),
      ownerEmail: options?.ownerEmail?.trim().toLowerCase(),
    })
  }
  addSource(options?.vitalsSource, 'health_sync')
  for (const ws of options?.workoutSources ?? []) addSource(ws, 'file_import')

  // Automatically surface saved `pmd_health_profile` sync source & `pmd_auto_sync_status_v2` bridge
  if (typeof localStorage !== 'undefined') {
    try {
      const hp = JSON.parse(localStorage.getItem('pmd_health_profile') || 'null') as Record<string, unknown> | null
      if (hp && typeof hp === 'object') {
        const hpSrc = typeof hp.deviceSyncSource === 'string' && hp.deviceSyncSource.trim()
          ? hp.deviceSyncSource.trim()
          : typeof hp.source === 'string' && hp.source.trim() ? hp.source.trim() : ''
        if (hpSrc && !/^(manual|health data)$/i.test(hpSrc)) {
          put({
            id: `hp:${normalizeId(hpSrc)}`,
            name: hpSrc,
            transport: 'health_sync',
            lastConnectedAt: typeof hp.lastDeviceSyncAt === 'string' ? hp.lastDeviceSyncAt : typeof hp.updatedAt === 'string' ? hp.updatedAt : new Date().toISOString(),
            ownerEmail: options?.ownerEmail?.trim().toLowerCase(),
          })
        }
      }
      const syncStatus = JSON.parse(localStorage.getItem('pmd_auto_sync_status_v2') || 'null') as {
        lastSuccess?: string
        profileFields?: number
        workoutsPulled?: number
      } | null
      if (syncStatus && (syncStatus.lastSuccess || (syncStatus.profileFields ?? 0) > 0 || (syncStatus.workoutsPulled ?? 0) > 0)) {
        put({
          id: 'sync:auto-health-bridge',
          name: 'Auto Health / Wearable Bridge',
          transport: 'webhook',
          lastConnectedAt: syncStatus.lastSuccess || new Date().toISOString(),
          lastMetrics: syncStatus.workoutsPulled ? ['wearable', 'workouts'] : ['wearable'],
          ownerEmail: options?.ownerEmail?.trim().toLowerCase(),
        })
      }
    } catch {
      /* ignore malformed localStorage metadata */
    }
  }

  return Array.from(byKey.values()).sort((a, b) => (a.lastConnectedAt < b.lastConnectedAt ? 1 : -1))
}
