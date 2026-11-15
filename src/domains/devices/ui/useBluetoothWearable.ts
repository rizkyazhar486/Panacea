// State of one Bluetooth heart-rate connection for the card: the adapter feeds packets, the engine judges them.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  bluetoothAvailability, connectHeartRateWearable, type BluetoothAvailability, type BluetoothLike,
  type ConnectedWearable, type ConnectRefusal,
} from '../adapters/webBluetooth.ts'
import type { HeartRateParse } from '../engine/gattHeartRate.ts'
import { EMPTY_SESSION, addPacket, hrvProgress, summarize, type LiveSession, type LiveSummary } from '../engine/liveSession.ts'
import { RMSSD_MIN_RECORDING_MS, type HrvRecordingResult } from '../engine/beatIntervals.ts'

export type DeviceFacts = Pick<ConnectedWearable, 'name' | 'manufacturer' | 'model' | 'sensorLocation' | 'batteryPercent'>

export type HrvState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'recording'; readonly fraction: number; readonly remainingMs: number; readonly intervals: readonly number[] }
  | { readonly phase: 'done'; readonly result: HrvRecordingResult; readonly intervals: readonly number[] }

export interface BluetoothWearable {
  readonly availability: BluetoothAvailability
  readonly status: 'idle' | 'connecting' | 'connected'
  /** Why the last attempt did not connect (a cancelled chooser is not an error and is not kept). */
  readonly refusal: Exclude<ConnectRefusal, 'cancelled'> | null
  readonly device: DeviceFacts | null
  readonly summary: LiveSummary
  readonly hrv: HrvState
  connect(): Promise<void>
  disconnect(): void
  startHrv(): void
  cancelHrv(): void
  /** Wall-clock ISO time of a sample's monotonic timestamp. */
  wallTimeOf(atMs: number): string
}

type Action = { type: 'packet'; packet: HeartRateParse; atMs: number } | { type: 'reset' }
const reduce = (s: LiveSession, a: Action): LiveSession => (a.type === 'reset' ? EMPTY_SESSION : addPacket(s, a.packet, a.atMs))

const monotonic = () => performance.now()

export function useBluetoothWearable(): BluetoothWearable {
  const bluetooth = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth
  const availability = useMemo(() => bluetoothAvailability({
    bluetooth, isSecureContext: typeof window === 'undefined' ? undefined : window.isSecureContext,
  }), [bluetooth])
  const [status, setStatus] = useState<BluetoothWearable['status']>('idle')
  const [refusal, setRefusal] = useState<BluetoothWearable['refusal']>(null)
  const [device, setDevice] = useState<DeviceFacts | null>(null)
  const [session, dispatch] = useReducer(reduce, EMPTY_SESSION)
  const [now, setNow] = useState(monotonic)
  const [hrvStart, setHrvStart] = useState<number | null>(null)
  const [hrvDone, setHrvDone] = useState<{ result: HrvRecordingResult; intervals: readonly number[] } | null>(null)
  const wearableRef = useRef<ConnectedWearable | null>(null)
  const busy = useRef(false)

  const connect = useCallback(async () => {
    if (busy.current || wearableRef.current) return
    busy.current = true
    setRefusal(null)
    setStatus('connecting')
    const outcome = await connectHeartRateWearable(bluetooth, {
      onPacket: (packet, atMs) => dispatch({ type: 'packet', packet, atMs }),
      onBattery: (batteryPercent) => setDevice((d) => (d ? { ...d, batteryPercent } : d)),
      onDisconnected: () => {
        wearableRef.current = null
        setStatus('idle')
        setHrvStart(null)
      },
    }, monotonic)
    busy.current = false
    if (!outcome.ok) {
      setStatus('idle')
      setRefusal(outcome.reason === 'cancelled' ? null : outcome.reason)
      return
    }
    const { name, manufacturer, model, sensorLocation, batteryPercent } = outcome.wearable
    wearableRef.current = outcome.wearable
    dispatch({ type: 'reset' })
    setHrvStart(null)
    setHrvDone(null)
    setDevice({ name, manufacturer, model, sensorLocation, batteryPercent })
    setStatus('connected')
  }, [bluetooth])

  const disconnect = useCallback(() => { wearableRef.current?.disconnect() }, [])
  useEffect(() => () => { wearableRef.current?.disconnect() }, [])

  // Live status and the HRV countdown move with time, not only with packets.
  useEffect(() => {
    if (status !== 'connected') return
    const id = window.setInterval(() => setNow(monotonic()), 1000)
    return () => window.clearInterval(id)
  }, [status])

  const startHrv = useCallback(() => { setHrvDone(null); setHrvStart(monotonic()) }, [])
  const cancelHrv = useCallback(() => { setHrvStart(null); setHrvDone(null) }, [])

  // A recording ends at its first verdict that is final: done (5 minutes covered) or interrupted.
  const progress = useMemo(() => (hrvStart === null ? null : hrvProgress(session, hrvStart)), [session, hrvStart])
  useEffect(() => {
    if (!progress) return
    const final = progress.result.ok || progress.result.reason === 'interrupted'
    if (final) {
      setHrvDone({ result: progress.result, intervals: progress.intervals })
      setHrvStart(null)
    }
  }, [progress])

  const hrv: HrvState = hrvDone
    ? { phase: 'done', result: hrvDone.result, intervals: hrvDone.intervals }
    : progress
      ? {
          phase: 'recording',
          fraction: progress.fraction,
          remainingMs: Math.max(0, RMSSD_MIN_RECORDING_MS - progress.result.coveredMs),
          intervals: progress.intervals,
        }
      : { phase: 'idle' }

  const wallTimeOf = useCallback((atMs: number) => new Date(Date.now() - (monotonic() - atMs)).toISOString(), [])

  return {
    // A packet newer than the last tick is "now", so it reads as live the moment it arrives.
    availability, status, refusal, device, summary: summarize(session, Math.max(now, session.samples[session.samples.length - 1]?.atMs ?? now)),
    hrv, connect, disconnect, startHrv, cancelHrv, wallTimeOf,
  }
}
