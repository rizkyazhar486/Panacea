/**
 * @file clinicalInterop.ts
 * @description Pure HL7 FHIR R4 Collection Bundle & SOAP/SBAR draft builders.
 * Fails closed when readings are empty and stamps `clinically_reviewed=false`
 * until signed by an authorized STR clinician. Caller injects `now`.
 */

import { bangunBundel, keJson, type Bundel } from '../../../lib/fhir'
import type { Vitals } from '../../../lib/healthVitals'
import type { Account, Patient } from '../../../lib/types'

export interface ClinicalBundleOptions {
  vitals: Vitals
  patient?: Patient | null
  account?: Account | null
  sumberSystem?: string
  now?: Date
}

export function buildClinicalFhirBundle({
  vitals,
  patient,
  account,
  sumberSystem = 'https://panaceamed.id/fhir/device-hub',
  now,
}: ClinicalBundleOptions): Bundel {
  const bersih = (val: unknown): number | undefined =>
    typeof val === 'number' && Number.isFinite(val) && val > 0 ? val : undefined

  const weightVal = bersih(vitals.weightKg ?? patient?.weightKg)
  const heightVal = bersih(vitals.heightCm ?? patient?.heightCm)
  const computedBmi =
    bersih(vitals.bmi) ??
    (weightVal != null && heightVal != null ? Number((weightVal / ((heightVal / 100) ** 2)).toFixed(2)) : undefined)

  const nilai: Record<string, number | undefined> = {
    weightKg: weightVal,
    heightCm: heightVal,
    systolic: bersih(vitals.systolic),
    diastolic: bersih(vitals.diastolic),
    heartRate: bersih(vitals.heartRate ?? vitals.restingHr),
    spo2Pct: bersih(vitals.spo2Pct),
    respRate: bersih(vitals.respRate),
    bodyTempC: bersih(vitals.bodyTempC),
    bodyFatPct: bersih(vitals.bodyFatPct),
    bmi: computedBmi,
    steps: bersih(vitals.steps),
    vo2max: bersih(vitals.vo2max),
    hrvMs: bersih(vitals.hrvMs),
    sleepH: bersih(vitals.sleepH),
  }

  const rawSex = patient?.sex ?? account?.sex
  const patientKelamin: 'M' | 'F' | undefined =
    rawSex === 'P' ? 'F' : rawSex === 'L' ? 'M' : undefined

  const waktu = now ?? (vitals.measuredAt && !Number.isNaN(Date.parse(vitals.measuredAt)) ? new Date(vitals.measuredAt) : new Date(0))

  return bangunBundel({
    nilai,
    pasien: {
      nama: patient?.name || account?.name,
      kelamin: patientKelamin,
      lahir: patient?.dob,
    },
    waktu,
    sumber: {
      identifierSystem: sumberSystem,
      identifierValue: account?.id || patient?.id || 'panaceamed-draft-unauthenticated',
      display: `${patient?.name || account?.name || 'PanaceaMed Record'} (Draft · clinically_reviewed=false)`,
    },
  })
}

export function serializeClinicalFhirBundle(bundle: Bundel): string {
  return keJson(bundle)
}

export interface SoapSbarSummary {
  soapText: string
  sbarText: string
}

export function generateSoapSbarSummary({
  patient,
  vitals,
  account,
  primaryDiagnosis = 'Ringkasan Observasi Telemetri (Draft — belum merupakan diagnosis klinis)',
  treatmentPlan = 'Evaluasi tanda vital longitudinal bersama klinisi berizin sebelum keputusan terapi atau peresepan.',
  emrCount = 0,
  nowIso,
}: {
  patient?: Patient | null
  vitals: Vitals
  account?: Account | null
  primaryDiagnosis?: string
  treatmentPlan?: string
  emrCount?: number
  nowIso?: string
}): SoapSbarSummary {
  const timestamp = vitals.measuredAt || vitals.syncedAt || nowIso || 'Belum bertanda waktu'
  const patientName = patient?.name || account?.name || 'Catatan Pribadi (Tanpa Profil Pasien Aktif)'
  const mrn = patient?.mrn || '—'
  const doctorName = account?.role === 'dokter' ? account.name : 'Belum ditugaskan ke DPJP'
  const doctorStr = account?.str ? `${account.str} (${account.strStatus || 'pending'})` : 'Belum terverifikasi STR'

  const pos = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)
  const hr = pos(vitals.heartRate) ?? pos(vitals.restingHr)
  const hrv = pos(vitals.hrvMs)
  const spo2 = pos(vitals.spo2Pct)
  const temp = pos(vitals.bodyTempC)
  const rr = pos(vitals.respRate)
  const wt = pos(vitals.weightKg ?? patient?.weightKg)
  const ht = pos(vitals.heightCm ?? patient?.heightCm)
  const sys = pos(vitals.systolic)
  const dia = pos(vitals.diastolic)
  const sleep = pos(vitals.sleepH)
  const bmi = wt != null && ht != null ? `${(wt / ((ht / 100) ** 2)).toFixed(1)} kg/m2` : 'Belum diukur'

  const bpText = sys != null && dia != null ? `${Math.round(sys)}/${Math.round(dia)} mmHg` : 'Belum diukur'
  const hrText = hr != null ? `${Math.round(hr)} bpm` : 'Belum diukur'
  const hrvText = hrv != null ? `${Math.round(hrv)} ms (RMSSD)` : 'Belum diukur'
  const spo2Text = spo2 != null ? `${spo2.toFixed(1)}%` : 'Belum diukur'
  const tempText = temp != null ? `${temp.toFixed(1)} C` : 'Belum diukur'
  const rrText = rr != null ? `${Math.round(rr)}/min` : 'Belum diukur'
  const sleepText = sleep != null ? `${sleep.toFixed(1)} h` : 'Belum diukur'
  const weightText = wt != null ? `${wt.toFixed(1)} kg` : '—'
  const heightText = ht != null ? `${Math.round(ht)} cm` : '—'
  const allergiesText = patient?.allergies?.length ? patient.allergies.join(', ') : 'Tidak ada alergi tercatat'
  const conditionsText = patient?.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'Tidak ada catatan penyakit kronis'
  const riskText = patient?.riskFlags?.length ? patient.riskFlags.join(', ') : 'Belum dinilai / perlu evaluasi DPJP'

  const soapText = `=== DOKUMEN REKAM MEDIS RESUME SOAP (HL7 FHIR R4 ALIGNED) ===
Tanggal/Waktu : ${timestamp} (${vitals.source || 'Kanvas/Manual'})
Fasilitas     : PanaceaMed Tele-Klinik & Universal Hub
Pasien        : ${patientName} (MRN: ${mrn})
DPJP          : ${doctorName} (STR: ${doctorStr})
Batas Klinis  : DRAFT RESUME — Memerlukan Verifikasi & Tanda Tangan DPJP (clinically_reviewed=false)

[S] SUBJECTIVE:
Ringkasan     : Tindak lanjut longitudinal & sinkronisasi tanda vital pengguna.
Riwayat Alergi: ${allergiesText}
Penyakit Kronis: ${conditionsText}

[O] OBJECTIVE:
Tekanan Darah : ${bpText}
Denyut Jantung: ${hrText}
HRV (RMSSD)   : ${hrvText}
Saturasi O2   : ${spo2Text}
Laju Napas    : ${rrText}
Suhu Tubuh    : ${tempText}
Durasi Tidur  : ${sleepText}
Antropometri  : BB ${weightText} | TB ${heightText} | BMI ${bmi}
Catatan EMR   : ${emrCount}

[A] ASSESSMENT:
Ringkasan     : ${primaryDiagnosis}
Status Risiko : ${riskText}

[P] PLAN:
Rencana Tindak: ${treatmentPlan}
Interoperabilitas: HL7 FHIR R4 Bundle siap ditinjau sebelum sinkronisasi SATUSEHAT.
`

  const sbarText = `=== KOMUNIKASI KLINIS SBAR (HANDOFF / RUJUKAN) ===
Status        : DRAFT (clinically_reviewed=false)
[S] SITUATION:
Pasien ${patientName} (MRN: ${mrn}) dengan rekaman tanda vital terbaru (${timestamp}).

[B] BACKGROUND:
Riwayat alergi: ${allergiesText}. Kondisi kronis: ${conditionsText}. Risiko tercatat: ${riskText}.

[A] ASSESSMENT:
TD ${bpText}, HR ${hrText}, SpO2 ${spo2Text}, Temp ${tempText}, HRV ${hrvText}, Sleep ${sleepText}, BMI ${bmi}.
Ringkasan: ${primaryDiagnosis}.

[R] RECOMMENDATION:
Verifikasi pengukuran terbaru dengan klinisi berizin STR dan konfirmasi rencana terapi saat kunjungan DPJP.
`

  return { soapText, sbarText }
}
