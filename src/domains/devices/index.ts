// Devices — standard Bluetooth health profiles read from the person's own wearables. Public API of the domain.

// ── ENGINE: standard GATT characteristics ──
export { parseHeartRateMeasurement } from './engine/gattHeartRate.ts'
export type { HeartRateParse, HeartRateReading, HeartRateRefusal, SensorContact } from './engine/gattHeartRate.ts'
export { parseBatteryLevel, parseBodySensorLocation, cleanDeviceText, deviceLabel, DEVICE_TEXT_MAX } from './engine/gattCommon.ts'
export type { SensorLocation } from './engine/gattCommon.ts'
export {
  LAYANAN_GATT, KARAKTERISTIK_GATT,
  decodeSfloat, decodeFloat, decodeDateTime,
  decodeTemperatureMeasurement, decodeBloodPressureMeasurement,
  classifyGattServices,
} from './engine/bleGattHealth.ts'
export type {
  MedFloat, MedFloatKhusus, AlasanTolak, Hasil, WaktuPerangkat,
  BacaanSuhu, BacaanTekananDarah, MasalahMutuTekanan, JalurPerangkat, KlasifikasiPerangkat,
} from './engine/bleGattHealth.ts'

// ── ENGINE: beat intervals and the live session ──
export { rmssd, rmssdOfRecording, RMSSD_MIN_RECORDING_MS } from './engine/beatIntervals.ts'
export type { HrvRecordingResult, HrvRecordingRefusal } from './engine/beatIntervals.ts'
export {
  EMPTY_SESSION, addPacket, summarize, hrvProgress, vitalsPatchFrom,
  SESSION_KEEP_MS, LIVE_WITHIN_MS, RR_ABSENT_AFTER_PACKETS,
} from './engine/liveSession.ts'
export type { LiveSample, LiveSession, LiveSummary, HrvProgress, WearableVitalsPatch, WearableSavePatch } from './engine/liveSession.ts'

export { tracePoints } from './engine/traceGeometry.ts'
export type { TracePoint } from './engine/traceGeometry.ts'

// ── ADAPTERS ──
export { bluetoothAvailability, connectHeartRateWearable } from './adapters/webBluetooth.ts'
export type {
  BluetoothAvailability, BluetoothLike, ConnectedWearable, ConnectOutcome, ConnectRefusal, WearableHandlers,
} from './adapters/webBluetooth.ts'

// ── UI (loaded on demand: the panel is React and only the health-data page shows it) ──
export const loadBluetoothWearablePanel = () =>
  import('./ui/BluetoothWearablePanel.tsx').then((module) => ({ default: module.BluetoothWearablePanel }))
