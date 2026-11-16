// Connect the person's own heart-rate band or strap over standard Bluetooth, see the live reading, record HRV for
// 5 minutes and save it to their health data. One main action at a time; the limits are stated where they apply.
import { useState } from 'react'
import { useBluetoothWearable } from './useBluetoothWearable.ts'
import { LiveTrace } from './LiveTrace.tsx'
import { deviceLabel, type SensorLocation } from '../engine/gattCommon.ts'
import { vitalsPatchFrom, type WearableSavePatch } from '../engine/liveSession.ts'
import { recordConnectedDevice } from '../adapters/deviceRegistry.ts'
import type { ConnectRefusal, BluetoothAvailability } from '../adapters/webBluetooth.ts'

export interface BluetoothWearablePanelProps {
  onSave(patch: WearableSavePatch): void | Promise<void>
  /** The person's earlier RMSSD readings in ms, oldest first: the only comparison this panel shows. */
  previousRmssd?: readonly number[]
  /** Where iPhone and iPad users set up Apple Health sync instead. */
  appleHealthHref?: string
}

const LOCATION: Record<SensorLocation, string> = {
  other: 'Other position', chest: 'Chest', wrist: 'Wrist', finger: 'Finger', hand: 'Hand', 'ear-lobe': 'Ear lobe', foot: 'Foot',
}

const REFUSAL: Record<Exclude<ConnectRefusal, 'cancelled'>, string> = {
  unavailable: "This browser can't connect to Bluetooth devices.",
  blocked: 'Bluetooth is blocked for this site — allow it in the browser’s site settings, then try again.',
  'no-heart-rate-service': 'This device doesn’t offer standard Bluetooth heart rate, so its data can only come through its own app or an export.',
  failed: 'Couldn’t connect — make sure the device is on, close by and not connected to another app, then try again.',
}

function appleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const oneDecimal = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

// The app's button look (components/ui Button), by its global classes: domain UI does not import components.
const buttonBase = 'liquid-glass-btn inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-black tracking-[-.01em] shadow-sm'
const primary = `${buttonBase} liquid-glass-btn--primary text-white`
const secondary = `${buttonBase} liquid-glass-btn--outline text-brand-dark dark:text-emerald-300`
const note = 'text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400'

function Unavailable({ availability, appleHealthHref }: { availability: BluetoothAvailability; appleHealthHref: string }) {
  if (availability === 'insecure-page') {
    return <p className={note} data-ble="unavailable">Bluetooth needs a secure (https) page.</p>
  }
  if (appleMobile()) {
    return (
      <div className="space-y-2" data-ble="unavailable">
        <p className={note}>iPhone and iPad browsers can’t use Bluetooth — if your band’s app saves to Apple Health, sync that instead.</p>
        <a href={appleHealthHref} className={secondary}>Set up Apple Health sync</a>
      </div>
    )
  }
  return (
    <p className={note} data-ble="unavailable">
      This browser can’t use Bluetooth — open Panacea in Chrome or Edge on Android, Windows, Mac or a Chromebook.
    </p>
  )
}

export function BluetoothWearablePanel({ onSave, previousRmssd = [], appleHealthHref = '#/health-data/tutorial' }: BluetoothWearablePanelProps) {
  const ble = useBluetoothWearable()
  const [save, setSave] = useState<{ state: 'idle' | 'saving' | 'saved' | 'failed'; atMs: number | null }>({ state: 'idle', atMs: null })
  const { summary, device, hrv } = ble
  const latest = summary.latest
  const hrvResult = hrv.phase === 'done' ? hrv.result : null
  const patch = vitalsPatchFrom(latest, hrvResult, deviceLabel(device))
  const savedThis = save.state === 'saved' && save.atMs === (latest?.atMs ?? null)

  async function saveReading() {
    if (!patch || !latest || save.state === 'saving') return
    setSave({ state: 'saving', atMs: latest.atMs })
    try {
      await onSave({ ...patch, measuredAt: ble.wallTimeOf(latest.atMs) })
      recordConnectedDevice({
        id: `ble:${deviceLabel(device).toLowerCase()}`,
        name: deviceLabel(device),
        transport: 'ble_gatt',
        manufacturer: device?.manufacturer,
        model: device?.model,
        sensorLocation: device?.sensorLocation,
        batteryPercent: device?.batteryPercent,
        lastMetrics: Object.keys(patch).filter((k) => k !== 'source' && k !== 'measuredAt'),
        pairedInBrowser: true,
      })
      setSave({ state: 'saved', atMs: latest.atMs })
    } catch {
      setSave({ state: 'failed', atMs: null })
    }
  }

  if (ble.availability !== 'available') return <Unavailable availability={ble.availability} appleHealthHref={appleHealthHref} />

  const connected = ble.status === 'connected'
  return (
    <div className="space-y-3" data-ble={ble.status}>
      {!device && (
        <p className={note}>Heart rate and HRV from a strap or band that broadcasts standard Bluetooth heart rate.</p>
      )}

      {device && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
          <span className="text-[13px] font-black text-ink dark:text-ink" data-ble-device>{device.name ?? deviceLabel(device)}</span>
          {(device.manufacturer || device.model) && <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-white/10">{deviceLabel(device)}</span>}
          {device.sensorLocation && <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-white/10">{LOCATION[device.sensorLocation]}</span>}
          {device.batteryPercent !== null && <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-white/10">Battery {device.batteryPercent}%</span>}
          {!connected && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">Disconnected</span>}
        </div>
      )}

      {device && (
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[34px] font-black leading-none tabular-nums text-ink dark:text-ink" data-ble-bpm>{latest ? latest.bpm : '—'}</span>
              <span className="ml-1 text-[12px] font-bold text-neutral-500">bpm</span>
            </div>
            <span role="status" className="text-[11px] font-bold" data-ble-live={summary.live ? 'live' : 'not-live'}>
              {summary.live ? <span className="text-brand-dark dark:text-emerald-300">● Live</span>
                : latest?.contact === 'not-detected' ? <span className="text-amber-700 dark:text-amber-300">Off the skin</span>
                  : <span className="text-neutral-500">{connected ? 'Waiting for the device…' : 'Last reading'}</span>}
            </span>
          </div>
          <div className="mt-2"><LiveTrace values={summary.chart.map((p) => p.bpm)} label="Heart rate over the last minute" /></div>
          {summary.minBpm !== null && summary.maxBpm !== null && (
            <p className={note}>Last minute {summary.minBpm}–{summary.maxBpm} bpm</p>
          )}
        </div>
      )}

      {connected && summary.sendsBeatIntervals === false && hrv.phase === 'idle' && (
        <p className={note} data-ble-hrv="no-intervals">This device doesn’t send beat-to-beat timing, so HRV can’t be measured from it.</p>
      )}

      {connected && summary.sendsBeatIntervals === true && hrv.phase === 'idle' && (
        <div className="space-y-1.5">
          <button type="button" className={secondary} onClick={ble.startHrv}>Measure HRV · 5 min</button>
          <p className={note}>Sit still and breathe normally; moving or loosening the strap stops the recording.</p>
        </div>
      )}

      {hrv.phase === 'recording' && (
        <div className="space-y-1.5" data-ble-hrv="recording">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
            <span>Recording HRV · {clock(hrv.remainingMs)} left</span>
            <button type="button" className="min-h-[44px] px-2 text-brand-dark hover:underline dark:text-emerald-300" onClick={ble.cancelHrv}>Cancel</button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10" role="progressbar"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hrv.fraction * 100)} aria-label="HRV recording progress">
            <div className="h-full bg-brand" style={{ width: `${Math.round(hrv.fraction * 100)}%` }} />
          </div>
          <LiveTrace values={hrv.intervals} label="Beat-to-beat intervals recorded so far" />
        </div>
      )}

      {hrv.phase === 'done' && !hrv.result.ok && (
        <div className="space-y-1.5" data-ble-hrv="interrupted">
          <p className={note}>Stopped: skin contact was lost or a reading failed, so the beats were not continuous — start again.</p>
          {connected && <button type="button" className={secondary} onClick={ble.startHrv}>Measure again</button>}
        </div>
      )}

      {hrv.phase === 'done' && hrv.result.ok && (
        <div className="space-y-1" data-ble-hrv="done">
          <div className="text-[13px] font-black text-ink dark:text-ink">
            HRV (RMSSD) <span data-ble-rmssd className="tabular-nums">{oneDecimal(hrv.result.rmssdMs)}</span> ms
          </div>
          <LiveTrace values={hrv.intervals} label="Beat-to-beat intervals of this recording" />
          <p className={note}>From {hrv.result.intervals} beats over 5 minutes · intervals not edited for artifacts — a spike in the line is a missed or extra beat, so measure again.</p>
          <p className={note} data-ble-previous>
            {previousRmssd.length
              ? `Your previous readings: ${previousRmssd.slice(-5).map(oneDecimal).join(' · ')} ms`
              : 'Compare it only with your own readings from this device, taken the same way.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!connected && (
          <button type="button" className={primary} onClick={() => { void ble.connect() }} disabled={ble.status === 'connecting'}>
            {ble.status === 'connecting' ? 'Choose your device…' : device ? 'Connect again' : 'Connect device'}
          </button>
        )}
        {patch && latest && (
          <button type="button" className={connected ? primary : secondary} onClick={() => { void saveReading() }}
            disabled={save.state === 'saving' || savedThis} data-ble-save>
            {save.state === 'saving' ? 'Saving…' : savedThis ? 'Saved ✓' : 'Save to my health data'}
          </button>
        )}
        {connected && <button type="button" className={secondary} onClick={ble.disconnect}>Disconnect</button>}
      </div>
      {save.state === 'failed' && <p className="text-[11px] font-bold text-rose-600" role="alert">Couldn’t save. Try again.</p>}
      {ble.refusal && <p className="text-[11px] font-bold text-rose-600" role="alert" data-ble-refusal={ble.refusal}>{REFUSAL[ble.refusal]}</p>}

      <details className="text-[11px] text-neutral-500 dark:text-neutral-400">
        <summary className="min-h-[44px] cursor-pointer py-3 font-bold">How this works</summary>
        <ul className="list-disc space-y-1 pl-4 leading-relaxed">
          <li>Panacea reads only the Bluetooth standard for heart rate, plus battery and the device’s name. A device’s own private data — sleep stages, steps — needs its app or an export.</li>
          <li>Heart rate is what the device measured. HRV (RMSSD) is calculated from its beat-to-beat timing over 5 minutes, the conventional minimum recording (Shaffer & Ginsberg 2017).</li>
          <li>Wrist and finger sensors time beats less precisely than chest straps. Readings are for your own trends, not a diagnosis.</li>
          <li>Nothing is sent anywhere until you press Save; it then joins your health data on this account.</li>
        </ul>
      </details>
    </div>
  )
}
