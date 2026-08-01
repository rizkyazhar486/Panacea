// Live heart rate for anything that records a workout.
//
// Before this hook the GPS tracker kept heart rate in a plain `useState(0)`
// that nothing but a manual number input ever wrote to. So every run recorded
// "No HR data" even when the watch had already synced a pulse into the shared
// vitals store, and % HR max / VO2max stayed blank for no reason the user
// could see. This hook is the single place that answers "what is the wearer's
// pulse right now, and where did it come from".
//
// Three sources, highest confidence first:
//
//   1. 'ble'    — a Bluetooth strap notifying us every beat. Real per-second
//                 data, the only source good enough to draw an HR curve.
//                 Web Bluetooth exists on Android Chrome and desktop Chrome;
//                 iOS Safari has no Web Bluetooth at all, which is exactly why
//                 an iPhone user sees no HR however good their watch is.
//   2. 'device' — whatever Apple Health / the webhook last merged into the
//                 shared vitals store. Not live: it is a recent reading, so we
//                 label it honestly rather than plotting it as a curve.
//   3. 'manual' — the user typed it. Always wins once set; a background sync
//                 must never yank a number out from under someone.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVitals } from './useVitals'

export type HrSource = 'ble' | 'device' | 'manual' | 'none'
export type BleStatus = 'idle' | 'connecting' | 'connected' | 'unsupported' | 'error'

export interface LiveHeartRate {
  /** Current bpm, or 0 when nothing is known. */
  bpm: number
  /** Always-current bpm for use inside long-lived callbacks (geolocation
   *  watchers, intervals) that would otherwise capture a stale value. */
  bpmRef: { readonly current: number }
  source: HrSource
  /** True while bpm is streaming beat-to-beat and worth sampling into a track. */
  isLive: boolean
  bleStatus: BleStatus
  bleSupported: boolean
  connectStrap: () => Promise<void>
  disconnectStrap: () => void
  /** Manual entry. Passing 0 clears it and hands control back to the device. */
  setManual: (n: number) => void
  /** Human-readable one-liner for the UI, e.g. "Chest strap · live". */
  label: string
}

const HR_SERVICE = 'heart_rate'
const HR_CHAR = 'heart_rate_measurement'

/** Parse a GATT Heart Rate Measurement value (spec 0x2A37). */
export function parseHeartRateMeasurement(dv: DataView): number {
  const flags = dv.getUint8(0)
  // Bit 0 selects the bpm width: 0 = uint8, 1 = uint16 little-endian.
  return flags & 0x1 ? dv.getUint16(1, true) : dv.getUint8(1)
}

export function useLiveHeartRate(): LiveHeartRate {
  const vitals = useVitals()
  const deviceBpm = typeof vitals.heartRate === 'number' ? vitals.heartRate : 0

  const [bleBpm, setBleBpm] = useState(0)
  const [manual, setManualState] = useState(0)
  const bleSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth
  const [bleStatus, setBleStatus] = useState<BleStatus>(bleSupported ? 'idle' : 'unsupported')
  const deviceRef = useRef<any>(null)

  const bpm = manual > 0 ? manual : bleBpm > 0 ? bleBpm : deviceBpm > 0 ? deviceBpm : 0
  const source: HrSource = manual > 0 ? 'manual' : bleBpm > 0 ? 'ble' : deviceBpm > 0 ? 'device' : 'none'

  // Callbacks that outlive a render (geolocation watchers) must not close over
  // a stale bpm — they read this ref instead.
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  const connectStrap = useCallback(async () => {
    const bt = (navigator as any).bluetooth
    if (!bt) { setBleStatus('unsupported'); return }
    try {
      setBleStatus('connecting')
      const device = await bt.requestDevice({ filters: [{ services: [HR_SERVICE] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(HR_SERVICE)
      const char = await service.getCharacteristic(HR_CHAR)
      await char.startNotifications()
      char.addEventListener('characteristicvaluechanged', (e: any) => {
        const next = parseHeartRateMeasurement(e.target.value as DataView)
        if (next > 0) setBleBpm(next)
      })
      device.addEventListener('gattserverdisconnected', () => {
        setBleStatus('idle')
        setBleBpm(0)
      })
      deviceRef.current = device
      setBleStatus('connected')
    } catch {
      setBleStatus('error')
    }
  }, [])

  const disconnectStrap = useCallback(() => {
    try { deviceRef.current?.gatt?.disconnect() } catch { /* already gone */ }
    deviceRef.current = null
    setBleBpm(0)
    setBleStatus(bleSupported ? 'idle' : 'unsupported')
  }, [bleSupported])

  // Release the radio when the page goes away.
  useEffect(() => () => { try { deviceRef.current?.gatt?.disconnect() } catch { /* ignore */ } }, [])

  const setManual = useCallback((n: number) => setManualState(n > 0 ? Math.round(n) : 0), [])

  const label =
    source === 'ble' ? 'Chest strap · live'
      : source === 'device' ? 'From your watch · last sync'
        : source === 'manual' ? 'Entered by hand'
          : bleSupported ? 'No HR source — connect a strap or type it'
            : 'No HR source — this browser cannot read Bluetooth straps'

  return {
    bpm,
    bpmRef,
    source,
    isLive: source === 'ble',
    bleStatus,
    bleSupported,
    connectStrap,
    disconnectStrap,
    setManual,
    label,
  }
}
