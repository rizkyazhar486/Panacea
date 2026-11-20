/**
 * Dari bacaan tensimeter/termometer standar (sudah di-decode bleGattHealth) ke isian data kesehatan yang boleh disimpan.
 * Murni dan deterministik. Fail-closed: unit di luar yang disimpan app (mmHg, °C) tidak dikonversi diam-diam, dan
 * bacaan yang oleh perangkatnya sendiri ditandai bermasalah mutu tidak disimpan — orangnya diminta mengukur ulang.
 * Tidak ada ambang klinis di sini; satu-satunya cek nilai adalah konsistensi fisik (sistolik > diastolik > 0).
 */
import type { BacaanSuhu, BacaanTekananDarah, Hasil, MasalahMutuTekanan } from './bleGattHealth.ts'

export type MeasurementKind = 'blood-pressure' | 'thermometer'

export type MeasurementReading =
  | { readonly kind: 'blood-pressure'; readonly result: Hasil<BacaanTekananDarah> }
  | { readonly kind: 'thermometer'; readonly result: Hasil<BacaanSuhu> }

export type MeasurementVitalsPatch =
  | { readonly systolic: number; readonly diastolic: number; readonly source: string }
  | { readonly bodyTempC: number; readonly source: string }

export type MeasurementSaveRefusal =
  /** Paket tidak bisa dibaca sesuai standar (terpotong, nilai khusus NaN/NRes, panjang salah). */
  | 'unreadable'
  /** Perangkat melapor kPa / °F; app menyimpan mmHg / °C dan tidak mengonversi diam-diam. */
  | 'unit-not-stored'
  /** Perangkat menandai gerakan, manset longgar atau posisi salah. */
  | 'measure-again'
  /** Angka tidak konsisten secara fisik (mis. diastolik ≥ sistolik). */
  | 'implausible'

export type MeasurementSaveDecision =
  | { readonly ok: true; readonly patch: MeasurementVitalsPatch; readonly irregularPulse: boolean }
  | { readonly ok: false; readonly reason: MeasurementSaveRefusal }

// Status yang membuat angka itu sendiri tidak bisa dipercaya; nadi ireguler tidak termasuk (angkanya tetap terukur).
const MUTU_UKUR_ULANG: readonly MasalahMutuTekanan[] = ['gerakan-tubuh', 'manset-longgar', 'posisi-tidak-tepat']

const positif = (n: number) => Number.isFinite(n) && n > 0
const satuDesimal = (n: number) => Math.round(n * 10) / 10

export function measurementSaveDecision(reading: MeasurementReading, sourceLabel: string): MeasurementSaveDecision {
  const source = `Bluetooth · ${sourceLabel}`
  if (reading.kind === 'blood-pressure') {
    if (!reading.result.ok) return { ok: false, reason: 'unreadable' }
    const bp = reading.result.value
    if (bp.unit !== 'mm[Hg]') return { ok: false, reason: 'unit-not-stored' }
    if (bp.qualityConcerns.some((q) => MUTU_UKUR_ULANG.includes(q))) return { ok: false, reason: 'measure-again' }
    if (!positif(bp.systolic) || !positif(bp.diastolic) || bp.diastolic >= bp.systolic) return { ok: false, reason: 'implausible' }
    return {
      ok: true,
      patch: { systolic: satuDesimal(bp.systolic), diastolic: satuDesimal(bp.diastolic), source },
      irregularPulse: bp.qualityConcerns.includes('nadi-ireguler'),
    }
  }
  if (!reading.result.ok) return { ok: false, reason: 'unreadable' }
  const t = reading.result.value
  if (t.unit !== 'Cel') return { ok: false, reason: 'unit-not-stored' }
  if (!positif(t.value)) return { ok: false, reason: 'implausible' }
  return { ok: true, patch: { bodyTempC: satuDesimal(t.value), source }, irregularPulse: false }
}
