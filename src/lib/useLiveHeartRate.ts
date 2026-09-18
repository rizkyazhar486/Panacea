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
/** Sensor-contact status a Heart Rate Measurement notification reports, per spec 0x2A37. */
export type HeartRateSensorContact = 'detected' | 'not-detected' | 'unsupported'

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
  /** GATT-reported skin-contact status for the current BLE reading. */
  sensorContact: HeartRateSensorContact
  /** Honest device-reported signal quality in [0, 1], or null when the strap
   *  does not implement sensor-contact detection and no quality is known. */
  signalQuality: number | null
  connectStrap: () => Promise<void>
  disconnectStrap: () => void
  /** Manual entry. Passing 0 clears it and hands control back to the device. */
  setManual: (n: number) => void
  /** Timestamp + sequence of the latest BLE notification. */
  lastSampleAt: string | null
  sampleSequence: number
  /** Human-readable one-liner for the UI, e.g. "Chest strap · live". */
  label: string
}

const HR_SERVICE = 'heart_rate'
const HR_CHAR = 'heart_rate_measurement'

export interface ParsedHeartRateMeasurement {
  bpm: number
  sensorContact: HeartRateSensorContact
}

/** Parse a GATT Heart Rate Measurement value (spec 0x2A37). */
export function parseHeartRateMeasurement(dv: DataView): ParsedHeartRateMeasurement {
  const flags = dv.getUint8(0)
  // Bit 0 selects the bpm width: 0 = uint8, 1 = uint16 little-endian.
  const bpm = flags & 0x1 ? dv.getUint16(1, true) : dv.getUint8(1)
  // Bits 1-2: sensor contact status. 11 = skin contact detected, 10 = the
  // strap supports contact detection but is off the skin, 00/01 both mean
  // the strap does not report contact at all.
  const contactBits = (flags >> 1) & 0x3
  const sensorContact: HeartRateSensorContact =
    contactBits === 0b11 ? 'detected' : contactBits === 0b10 ? 'not-detected' : 'unsupported'
  return { bpm, sensorContact }
}

/**
 * Signal quality the Visit OS can trust, derived only from what the strap
 * itself reports over GATT. A strap that does not implement sensor-contact
 * detection stays unknown (null) rather than being scored as good — we never
 * invent a confidence number the device did not send.
 */
export function heartRateSignalQuality(sensorContact: HeartRateSensorContact): number | null {
  if (sensorContact === 'detected') return 1
  if (sensorContact === 'not-detected') return 0.2
  return null
}

export function useLiveHeartRate(): LiveHeartRate {
  const vitals = useVitals()
  const deviceBpm = typeof vitals.heartRate === 'number' ? vitals.heartRate : 0

  const [bleBpm, setBleBpm] = useState(0)
  const [sensorContact, setSensorContact] = useState<HeartRateSensorContact>('unsupported')
  const [lastSampleAt, setLastSampleAt] = useState<string | null>(null)
  const [sampleSequence, setSampleSequence] = useState(0)
  const [manual, setManualState] = useState(0)
  const bleSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth
  const [bleStatus, setBleStatus] = useState<BleStatus>(bleSupported ? 'idle' : 'unsupported')
  const deviceRef = useRef<any>(null)

  const bpm = manual > 0 ? manual : bleBpm > 0 ? bleBpm : deviceBpm > 0 ? deviceBpm : 0
  const source: HrSource = manual > 0 ? 'manual' : bleBpm > 0 ? 'ble' : deviceBpm > 0 ? 'device' : 'none'
  // An off-body strap is reporting noise, not a beat — never call that live.
  const isLive = source === 'ble' && sensorContact !== 'not-detected'
  const signalQuality = source === 'ble' ? heartRateSignalQuality(sensorContact) : null

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
        const parsed = parseHeartRateMeasurement(e.target.value as DataView)
        setSensorContact(parsed.sensorContact)
        // Off-body noise: keep reporting contact loss, but don't plot it as a beat.
        if (parsed.sensorContact === 'not-detected') return
        if (parsed.bpm > 0) {
          setBleBpm(parsed.bpm)
          setLastSampleAt(new Date().toISOString())
          setSampleSequence((current) => current + 1)
        }
      })
      device.addEventListener('gattserverdisconnected', () => {
        setBleStatus('idle')
        setBleBpm(0)
        setSensorContact('unsupported')
        setLastSampleAt(null)
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
    setSensorContact('unsupported')
    setLastSampleAt(null)
    setBleStatus(bleSupported ? 'idle' : 'unsupported')
  }, [bleSupported])

  // Release the radio when the page goes away.
  useEffect(() => () => { try { deviceRef.current?.gatt?.disconnect() } catch { /* ignore */ } }, [])

  const setManual = useCallback((n: number) => setManualState(n > 0 ? Math.round(n) : 0), [])

  const label =
    source === 'ble' && sensorContact === 'not-detected' ? 'Chest strap · off-body, waiting for contact'
      : source === 'ble' ? 'Chest strap · live'
        : source === 'device' ? 'From your watch · last sync'
          : source === 'manual' ? 'Entered by hand'
            : bleSupported ? 'No HR source — connect a strap or type it'
              : 'No HR source — this browser cannot read Bluetooth straps'

  return {
    bpm,
    bpmRef,
    source,
    isLive,
    bleStatus,
    bleSupported,
    sensorContact,
    signalQuality,
    connectStrap,
    disconnectStrap,
    setManual,
    lastSampleAt,
    sampleSequence,
    label,
  }
}
