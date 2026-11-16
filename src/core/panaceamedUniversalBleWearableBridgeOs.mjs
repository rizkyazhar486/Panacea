/**
 * @file src/core/panaceamedUniversalBleWearableBridgeOs.mjs
 * @description Adapter jembatan Bluetooth LE untuk cockpit/CLI lama (src/core), hanya profil standar Bluetooth SIG.
 *
 * Versi sebelumnya memuat UUID vendor karangan (ASCII "SZWHOOPBLE01"/"QWATCHPROHUB"), frame 16-byte karangan,
 * nilai vital default, rumus strain/recovery tiruan, tekanan darah tanpa manset dari PTT, dan Observation FHIR
 * 80404-7 yang dilabeli RMSSD (80404-7 adalah SDNN). Semua itu dihapus.
 *
 * Sekarang:
 * - Nomor layanan/karakteristik dari Bluetooth SIG Assigned Numbers (service_uuids.yaml, characteristic_uuids.yaml).
 * - Decode byte hanya lewat src/domains/devices (GSS 2026-09-09, PHD Transcoding WP v16), tidak ada decoder kedua.
 * - Input hilang → q:'MISSING'; byte ditolak decoder, nilai khusus, atau kontak sensor tidak terdeteksi → q:'NOISE'.
 *   Tidak ada rentang "klinis" yang dikarang di sini: NOISE berarti tidak lolos format/mutu yang dilaporkan perangkat.
 * - Perangkat dengan protokol vendor diarahkan ke aplikasi pendamping; tidak didekode tanpa fixture dari perangkat sendiri.
 * - Tidak ada interpretasi klinis, skor pemulihan, tier Ruitang, atau klaim enkripsi/penyimpanan di modul ini.
 *
 * Kode LOINC diverifikasi lewat NLM Clinical Tables (2026-11-16): 8867-4 Heart rate, 8310-5 Body temperature,
 * 8480-6 Systolic blood pressure, 8462-4 Diastolic blood pressure. Tidak ada kode LOINC RMSSD di indeks NLM.
 */

import crypto from 'node:crypto';
import * as astralWave350 from './panaceamedAstralAmethystPublicOrchestratorOs.mjs';
import * as holisticKernel from './panaceamedHolisticAutoKernelOs.mjs';
import {
  LAYANAN_GATT,
  KARAKTERISTIK_GATT,
  parseHeartRateMeasurement,
  decodeTemperatureMeasurement,
  decodeBloodPressureMeasurement,
  classifyGattServices
} from '../domains/devices/index.ts';

// Nomor 16-bit SIG. Ekspansi 128-bit lewat Base UUID sengaja tidak dihitung di sini (dilakukan adapter browser).
export const BLE_GATT_STANDARD_AND_VENDOR_UUIDS = Object.freeze({
  HEART_RATE_SERVICE: LAYANAN_GATT.heartRate,
  HEART_RATE_MEASUREMENT_CHAR: KARAKTERISTIK_GATT.heartRateMeasurement,
  HEALTH_THERMOMETER_SERVICE: LAYANAN_GATT.healthThermometer,
  TEMPERATURE_MEASUREMENT_CHAR: KARAKTERISTIK_GATT.temperatureMeasurement,
  BLOOD_PRESSURE_SERVICE: LAYANAN_GATT.bloodPressure,
  BLOOD_PRESSURE_MEASUREMENT_CHAR: KARAKTERISTIK_GATT.bloodPressureMeasurement,
  PULSE_OXIMETER_SERVICE: LAYANAN_GATT.pulseOximeter,
  PLX_CONTINUOUS_MEASUREMENT_CHAR: 0x2a5f,
  GLUCOSE_SERVICE: LAYANAN_GATT.glucose,
  GLUCOSE_MEASUREMENT_CHAR: 0x2a18,
  CONTINUOUS_GLUCOSE_MONITORING_SERVICE: LAYANAN_GATT.continuousGlucoseMonitoring,
  CGM_MEASUREMENT_CHAR: 0x2aa7,
  BODY_COMPOSITION_SERVICE: LAYANAN_GATT.bodyComposition,
  // Sengaja kosong: UUID vendor hanya boleh masuk bersama fixture tangkapan perangkat milik pengguna.
  VENDOR_PROPRIETARY: Object.freeze([])
});

const U = BLE_GATT_STANDARD_AND_VENDOR_UUIDS;

const profil = (profileId, serviceUuid16, measurementCharUuid16, decoderStatus, label) =>
  Object.freeze({ profileId, serviceUuid16, measurementCharUuid16, decoderStatus, label });

// Kelas perangkat menurut profil standar, bukan merek. decoderStatus menyatakan apa yang benar-benar teruji.
export const UNIVERSAL_BLE_WEARABLE_PROFILES = Object.freeze({
  HEART_RATE_SENSOR: profil('HEART_RATE_SENSOR', U.HEART_RATE_SERVICE, U.HEART_RATE_MEASUREMENT_CHAR, 'DECODER_TESTED', 'Heart rate sensor (chest strap, watch broadcast)'),
  HEALTH_THERMOMETER: profil('HEALTH_THERMOMETER', U.HEALTH_THERMOMETER_SERVICE, U.TEMPERATURE_MEASUREMENT_CHAR, 'DECODER_TESTED', 'Health thermometer'),
  BLOOD_PRESSURE_MONITOR: profil('BLOOD_PRESSURE_MONITOR', U.BLOOD_PRESSURE_SERVICE, U.BLOOD_PRESSURE_MEASUREMENT_CHAR, 'DECODER_TESTED', 'Blood pressure cuff'),
  PULSE_OXIMETER: profil('PULSE_OXIMETER', U.PULSE_OXIMETER_SERVICE, U.PLX_CONTINUOUS_MEASUREMENT_CHAR, 'RECOGNIZED_NO_DECODER', 'Pulse oximeter'),
  GLUCOSE_METER: profil('GLUCOSE_METER', U.GLUCOSE_SERVICE, U.GLUCOSE_MEASUREMENT_CHAR, 'RECOGNIZED_NO_DECODER', 'Glucose meter (finger-stick)'),
  CONTINUOUS_GLUCOSE_MONITOR: profil('CONTINUOUS_GLUCOSE_MONITOR', U.CONTINUOUS_GLUCOSE_MONITORING_SERVICE, U.CGM_MEASUREMENT_CHAR, 'RECOGNIZED_NO_DECODER', 'Continuous glucose monitor'),
  BODY_COMPOSITION_SCALE: profil('BODY_COMPOSITION_SCALE', U.BODY_COMPOSITION_SERVICE, null, 'RECOGNIZED_NO_DECODER', 'Body composition scale'),
  VENDOR_PROPRIETARY_WEARABLE: profil('VENDOR_PROPRIETARY_WEARABLE', null, null, 'COMPANION_APP_ONLY', 'Ring, strap or watch using a vendor protocol')
});

const LOINC = Object.freeze({
  heartRate: Object.freeze({ code: '8867-4', display: 'Heart rate' }),
  bodyTemperature: Object.freeze({ code: '8310-5', display: 'Body temperature' }),
  systolic: Object.freeze({ code: '8480-6', display: 'Systolic blood pressure' }),
  diastolic: Object.freeze({ code: '8462-4', display: 'Diastolic blood pressure' })
});

const SAFETY = Object.freeze({ clinicallyReviewed: false, requiresHumanPhysicianSignoff: true });

// Pembacaan perangkat = observasi, tetapi bukan rekam medis bertanda tangan (CLAUDE.md §8).
const OBSERVED = Object.freeze({ truthClass: 'OBSERVED_CLINICAL', isSignedMedicalRecord: false });

// Heart Rate memakai parser kanonik domain devices; bentuk hasilnya diseragamkan ke { ok, value } / { ok:false, reason }.
const decodeHeartRate = (b) => {
  const r = parseHeartRateMeasurement(b);
  return r.ok ? { ok: true, value: r.reading } : { ok: false, reason: r.reason, detail: null };
};

const DECODER = new Map([
  [KARAKTERISTIK_GATT.heartRateMeasurement, decodeHeartRate],
  [KARAKTERISTIK_GATT.temperatureMeasurement, decodeTemperatureMeasurement],
  [KARAKTERISTIK_GATT.bloodPressureMeasurement, decodeBloodPressureMeasurement]
]);

const keByte = (bytes) => {
  if (bytes instanceof Uint8Array) return bytes;
  if (!Array.isArray(bytes)) return null;
  if (!bytes.every((x) => Number.isInteger(x) && x >= 0 && x <= 0xff)) return null;
  return Uint8Array.from(bytes);
};

/**
 * Decode satu notifikasi karakteristik standar. Nama lama dipertahankan untuk pemanggil; fungsi ini tidak lagi
 * meng-encode paket karangan.
 * @param {{ characteristicUuid16?: number, bytes?: number[] | Uint8Array }} payload
 */
export function encodeAndDecodeUniversalBleWearablePacket(payload = {}) {
  const { characteristicUuid16, bytes } = payload ?? {};
  const dasar = { characteristicUuid16: characteristicUuid16 ?? null, ...SAFETY };
  if (!Number.isInteger(characteristicUuid16) || bytes == null) {
    return Object.freeze({ ...dasar, q: 'MISSING', reason: 'INPUT_MISSING', reading: null, truthClass: 'OBSERVED_CLINICAL', isSignedMedicalRecord: false });
  }
  const decoder = DECODER.get(characteristicUuid16);
  if (!decoder) {
    return Object.freeze({ ...dasar, q: 'MISSING', reason: 'NO_STANDARD_DECODER', reading: null, ...OBSERVED });
  }
  const b = keByte(bytes);
  if (!b) return Object.freeze({ ...dasar, q: 'NOISE', reason: 'NOT_BYTES', reading: null, ...OBSERVED });
  const hasil = decoder(b);
  if (!hasil.ok) {
    return Object.freeze({ ...dasar, q: 'NOISE', reason: `DECODER_REJECTED:${hasil.reason}`, detail: hasil.detail, reading: null, ...OBSERVED });
  }
  // Kontak sensor dilaporkan tidak ada → angka bpm tidak dipakai (GSS §3.126 flag bit 1–2).
  if (characteristicUuid16 === KARAKTERISTIK_GATT.heartRateMeasurement && hasil.value.contact === 'not-detected') {
    return Object.freeze({ ...dasar, q: 'NOISE', reason: 'SENSOR_CONTACT_NOT_DETECTED', reading: Object.freeze({ ...hasil.value }), ...OBSERVED });
  }
  return Object.freeze({ ...dasar, q: 'GOOD', reason: null, reading: Object.freeze({ ...hasil.value }), ...OBSERVED });
}

const observasi = (loinc, value, unit, ucum) => Object.freeze({
  resource: Object.freeze({
    resourceType: 'Observation',
    status: 'preliminary',
    category: Object.freeze([Object.freeze({ coding: Object.freeze([Object.freeze({ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' })]) })]),
    code: Object.freeze({ coding: Object.freeze([Object.freeze({ system: 'http://loinc.org', code: loinc.code, display: loinc.display })]) }),
    valueQuantity: Object.freeze({ value, unit, system: 'http://unitsofmeasure.org', code: ucum }),
    note: Object.freeze([Object.freeze({ text: 'Unsigned device measurement; not reviewed by a clinician.' })])
  })
});

/** Observation FHIR R4 hanya untuk bacaan q:'GOOD'; tidak ada entri pengganti untuk data hilang. */
function keFhir(decoded) {
  const entry = [];
  for (const d of decoded) {
    if (d.q !== 'GOOD') continue;
    const r = d.reading;
    if (d.characteristicUuid16 === KARAKTERISTIK_GATT.heartRateMeasurement) {
      entry.push(observasi(LOINC.heartRate, r.bpm, 'beats/minute', '/min'));
    } else if (d.characteristicUuid16 === KARAKTERISTIK_GATT.temperatureMeasurement) {
      entry.push(observasi(LOINC.bodyTemperature, r.value, r.unit === 'Cel' ? '°C' : '°F', r.unit));
    } else if (d.characteristicUuid16 === KARAKTERISTIK_GATT.bloodPressureMeasurement) {
      const satuan = r.unit === 'kPa' ? 'kPa' : 'mmHg';
      entry.push(observasi(LOINC.systolic, r.systolic, satuan, r.unit));
      entry.push(observasi(LOINC.diastolic, r.diastolic, satuan, r.unit));
    }
  }
  return Object.freeze({ resourceType: 'Bundle', type: 'collection', entry: Object.freeze(entry) });
}

/**
 * Proses bacaan dari satu perangkat BLE: klasifikasi layanan lalu decode karakteristik standar.
 * @param {{ deviceLabel?: string, services?: Array<number|string>, readings?: Array<{characteristicUuid16:number, bytes:number[]}> }} payload
 */
export function interpretStandardBleHealthReadings(payload = {}) {
  const { deviceLabel = null, services = [], readings = [] } = payload ?? {};
  const route = classifyGattServices(Array.isArray(services) ? services : []);
  const decoded = (Array.isArray(readings) ? readings : []).map((r) => encodeAndDecodeUniversalBleWearablePacket(r));
  const good = decoded.filter((d) => d.q === 'GOOD').length;
  const noise = decoded.filter((d) => d.q === 'NOISE').length;
  const missing = decoded.filter((d) => d.q === 'MISSING').length;
  const fhirWearableBundle = keFhir(decoded);

  const summary = decoded.length === 0
    ? 'No readings received. Nothing is shown until a standard Bluetooth health device sends a measurement.'
    : `${good} reading(s) decoded from standard Bluetooth profiles; ${noise} rejected as unreliable; ${missing} without a standard decoder. These are device measurements, not a diagnosis.`;

  const sealInput = JSON.stringify({ deviceLabel, route, decoded: decoded.map((d) => [d.characteristicUuid16, d.q, d.reason, d.reading]) });

  return Object.freeze({
    deviceLabel,
    deviceRoute: Object.freeze(route),
    decodedReadings: Object.freeze(decoded),
    qualityCounts: Object.freeze({ GOOD: good, NOISE: noise, MISSING: missing }),
    fhirWearableBundle,
    // Derivasi (HRV, tier, skor) bukan tugas adapter ini: dinyatakan tidak dihitung, bukan diisi tebakan.
    derivedSignals: Object.freeze({ q: 'MISSING', reason: 'NOT_COMPUTED_BY_DEVICE_ADAPTER' }),
    aiHealthInterpretation: Object.freeze({
      plainLanguageCustomerSummary: summary,
      clinicianTechnicalSummary: `Route=${route.route}; standard readable services=[${route.readable.map((s) => '0x' + s.toString(16)).join(', ')}]; vendor UUIDs not decoded=${route.vendorUuids.length}.`
    }),
    bridgeSha256Seal: crypto.createHash('sha256').update(sealInput).digest('hex'),
    ...OBSERVED,
    ...SAFETY
  });
}

/**
 * Proses semua perangkat yang benar-benar dikirim pemanggil. Tanpa input → armada kosong, bukan perangkat tiruan.
 * @param {{ devices?: Array<Parameters<typeof interpretStandardBleHealthReadings>[0]> }} payload
 */
export function orchestrateAllConnectedBluetoothWearables(payload = {}) {
  const startNs = process.hrtime.bigint();
  const devices = Array.isArray(payload?.devices) ? payload.devices : [];
  const connectedDevices = devices.map((d) => interpretStandardBleHealthReadings(d));
  const profiles = Object.values(UNIVERSAL_BLE_WEARABLE_PROFILES);
  const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;

  return Object.freeze({
    fleetVersion: 'PANACEAMED_STANDARD_BLE_GATT_ADAPTER_V2',
    totalSupportedWearableFamilies: profiles.length,
    profilesWithTestedDecoder: profiles.filter((p) => p.decoderStatus === 'DECODER_TESTED').length,
    totalConnectedDevices: connectedDevices.length,
    fleetQuality: connectedDevices.length === 0 ? 'MISSING' : 'REPORTED_PER_READING',
    connectedDevices: Object.freeze(connectedDevices),
    executionDurationMs: Number(elapsedMs.toFixed(4)),
    ...OBSERVED,
    ...SAFETY
  });
}

/**
 * Spesifikasi desain alur 3 langkah. Status langkah mengikuti data nyata, bukan klaim "terhubung".
 * Kepatuhan two-tap adalah properti desain, belum divalidasi dengan pengguna.
 */
export function evaluateStreamlinedThreeStepUserJourney(payload = {}) {
  const { connectedDeviceCount = 0, goodReadingCount = 0, userLiteracyTier = 'LAYPERSON_AWAM' } = payload ?? {};
  const steps = Object.freeze([
    Object.freeze({ stepNumber: 1, stepId: 'STEP_1_PAIR_STANDARD_DEVICE', title: 'Pair a standard Bluetooth health device', maxTapsRequired: 1, status: connectedDeviceCount > 0 ? 'PAIRED' : 'NOT_PAIRED' }),
    Object.freeze({ stepNumber: 2, stepId: 'STEP_2_REVIEW_MEASUREMENTS', title: 'Review measurements and what was rejected', maxTapsRequired: 1, status: goodReadingCount > 0 ? 'MEASUREMENTS_AVAILABLE' : 'NO_MEASUREMENTS' }),
    Object.freeze({ stepNumber: 3, stepId: 'STEP_3_SHARE_WITH_CLINICIAN', title: 'Share with your clinician (FHIR export, unsigned)', maxTapsRequired: 1, status: goodReadingCount > 0 ? 'READY_TO_SHARE' : 'NOTHING_TO_SHARE' })
  ]);
  return Object.freeze({
    journeyArchitecture: 'THREE_STEP_ZERO_FRICTION_PUBLIC_UX',
    userLiteracyTier,
    totalSteps: steps.length,
    twoTapRuleCompliant: steps.every((s) => s.maxTapsRequired <= 2),
    validatedWithUsers: false,
    steps,
    truthClass: 'DERIVED_BIOPHYSICAL',
    ...SAFETY
  });
}

export function runPanaceaMedWave400QuadricentennialMasterOs(payload = {}) {
  const startNs = process.hrtime.bigint();

  const wave350Astral = astralWave350.runPanaceaMedWave350AstralPublicMasterOs(payload.astral);
  const holisticGovernor = holisticKernel.runHolisticAutoExpansionAndSmoothOsGovernor(payload.holistic);
  const wearableFleet = orchestrateAllConnectedBluetoothWearables(payload.wearables);
  const goodReadingCount = wearableFleet.connectedDevices.reduce((n, d) => n + d.qualityCounts.GOOD, 0);
  const streamlinedJourney = evaluateStreamlinedThreeStepUserJourney({
    connectedDeviceCount: wearableFleet.totalConnectedDevices,
    goodReadingCount,
    ...(payload.journey ?? {})
  });

  // Invarian internal yang bisa dicek mesin. Ini bukan skor kematangan produk.
  const quadricentennialChecklist = Object.freeze({
    onlyStandardServicesRegistered: BLE_GATT_STANDARD_AND_VENDOR_UUIDS.VENDOR_PROPRIETARY.length === 0,
    emptyInputYieldsNoReadings: orchestrateAllConnectedBluetoothWearables().totalConnectedDevices === 0,
    fhirOnlyFromGoodReadings: wearableFleet.connectedDevices.every((d) =>
      d.fhirWearableBundle.entry.length <= d.qualityCounts.GOOD * 2),
    streamlinedThreeStepUxReady: streamlinedJourney.twoTapRuleCompliant,
    holisticAutoCheckAndAutoRepair100Pct:
      holisticGovernor.autoCheckFunctionHealthPercentage === 100.0 &&
      holisticGovernor.autoRepairActive === true,
    astralPublicMultiTenantReady: wave350Astral.allArchetypesVerified
  });

  const allGatesGreen = Object.values(quadricentennialChecklist).every(Boolean);

  const quadricentennialSha256Seal = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      astralSeal: wave350Astral.masterAstralSeal,
      holisticSeal: holisticGovernor.holisticSha256Seal,
      checklist: quadricentennialChecklist,
      fleet: wearableFleet.connectedDevices.map((d) => d.bridgeSha256Seal)
    }))
    .digest('hex');

  const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;

  return Object.freeze({
    quadricentennialReleaseVersion: 'PANACEAMED_STANDARD_BLE_GATT_ADAPTER_WAVE_400_V2',
    // Tidak ada persentase kematangan yang diberikan sendiri (PANACEA_SYSTEM_10_STANDARD).
    universalMaturityPercentage: null,
    allGatesGreen,
    quadricentennialChecklist,
    wearableFleet,
    streamlinedJourney,
    holisticGovernor,
    wave350Astral,
    executionDurationMs: Number(elapsedMs.toFixed(4)),
    quadricentennialSha256Seal,
    truthClass: 'DERIVED_BIOPHYSICAL',
    ...SAFETY
  });
}
