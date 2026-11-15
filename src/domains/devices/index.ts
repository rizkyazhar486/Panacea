// Devices — standard Bluetooth health profiles read from the person's own wearables. Public API of the domain.

// ── ENGINE: standard GATT characteristics ──
export { parseHeartRateMeasurement } from './engine/gattHeartRate.ts'
export type { HeartRateParse, HeartRateReading, HeartRateRefusal, SensorContact } from './engine/gattHeartRate.ts'
export { parseBatteryLevel, parseBodySensorLocation, cleanDeviceText, DEVICE_TEXT_MAX } from './engine/gattCommon.ts'
export type { SensorLocation } from './engine/gattCommon.ts'

// ── ENGINE: beat intervals and the live session ──
export { rmssd, rmssdOfRecording, RMSSD_MIN_RECORDING_MS } from './engine/beatIntervals.ts'
export type { HrvRecordingResult, HrvRecordingRefusal } from './engine/beatIntervals.ts'
export {
  EMPTY_SESSION, addPacket, summarize, hrvProgress, vitalsPatchFrom,
  SESSION_KEEP_MS, LIVE_WITHIN_MS, RR_ABSENT_AFTER_PACKETS,
} from './engine/liveSession.ts'
export type { LiveSample, LiveSession, LiveSummary, HrvProgress } from './engine/liveSession.ts'

// ── ADAPTERS ──
export { bluetoothAvailability, connectHeartRateWearable } from './adapters/webBluetooth.ts'
export type {
  BluetoothAvailability, BluetoothLike, ConnectedWearable, ConnectOutcome, ConnectRefusal, WearableHandlers,
} from './adapters/webBluetooth.ts'
