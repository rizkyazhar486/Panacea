// Riwayat lab → status longitudinal kanonik (panaceaLongitudinalState).
//
// Sebelum ini hasil lab hidup hanya di log lab-nya sendiri: status pasien yang
// kanonik tidak pernah melihatnya, jadi tidak ada tampilan lintas-domain yang
// bisa menaruh lab di samping vital, VO₂max, atau tidur. Jembatan ini murni:
// tidak membaca penyimpanan, tidak memanggil jaringan.
//
// Batas yang dijaga:
// - asal: angka disalin pasien dari lembar lab (method + tag), BUKAN dari lab;
// - tinjauan: domain lab butuh tinjauan klinisi → 'pending', tidak pernah
//   'accepted' dari sini (tinjauan dokter tersimpan terpisah di server);
// - satuan: dari JENIS_LAB; butir jenis tak dikenal dilewati, bukan ditebak;
// - kepercayaan ingest diberikan pemanggil, tidak dikarang dari angkanya.
import { JENIS_LAB, type ButirLab } from './lab.ts'
import { tanggalKalenderSah } from './tanggal.ts'
import type { ConsentEnvelope, LongitudinalEvent } from './panaceaLongitudinalState.ts'

export interface LabBridgeContext {
  consent: ConsentEnvelope
  receivedAt: string
  confidence: number
}

export function labLogToLongitudinalEvents(
  lab: Record<string, readonly ButirLab[]>,
  subjectId: string,
  context: LabBridgeContext,
): { events: LongitudinalEvent<number>[]; skipped: { jenis: string; id: string; reason: string }[] } {
  const events: LongitudinalEvent<number>[] = []
  const skipped: { jenis: string; id: string; reason: string }[] = []
  const penerimaan = Date.parse(context.receivedAt)
  for (const [jenis, daftar] of Object.entries(lab)) {
    const j = JENIS_LAB.find((x) => x.id === jenis)
    for (const b of daftar) {
      if (!j) { skipped.push({ jenis, id: b.id, reason: 'unknown-lab-type' }); continue }
      if (!tanggalKalenderSah(b.tanggal) || !Number.isFinite(b.nilai) || b.nilai <= 0) { skipped.push({ jenis, id: b.id, reason: 'invalid-record' }); continue }
      const recordedAt = `${b.tanggal}T00:00:00.000Z`
      // Tanggal ambil darah bisa "hari ini" di zona waktu pengguna tetapi besok di UTC.
      if (Date.parse(recordedAt) > penerimaan + 5 * 60_000) { skipped.push({ jenis, id: b.id, reason: 'future-date' }); continue }
      events.push({
        id: `lab:${subjectId}:${jenis}:${b.id}`,
        subjectId,
        domain: 'lab',
        metric: `lab.${jenis}`,
        value: b.nilai,
        unit: j.satuan,
        recordedAt,
        confidence: context.confidence,
        provenance: {
          sourceKind: 'manual',
          sourceId: 'panaceamed:lab-log',
          capturedAt: recordedAt,
          receivedAt: context.receivedAt,
          method: 'patient-transcribed-lab-report',
        },
        consent: context.consent,
        review: { state: 'pending' },
        tags: ['patient-transcribed', `lab:${jenis}`],
      })
    }
  }
  return { events, skipped }
}

/** Latest transcribed lab values for Body Exposure overlay — not organ anatomy. */
export interface LabBodyExposureSignal {
  id: string
  label: string
  value: string
  unit: string
  /** Blood-draw date (yyyy-mm-dd), not save time. */
  recordedAt: string
  truthClass: 'patient-recorded'
  source: 'lab-log'
  method: 'patient-transcribed-lab-report'
  jenisId: string
}

/**
 * Project the newest valid analyte per known type into overlay signals.
 * Unknown types, non-positive values, bad dates, and future draws (vs nowISO)
 * are skipped — never invented. Does not map labs onto atlas geometry.
 */
export function labLogToBodyExposureSignals(
  lab: Record<string, readonly ButirLab[]>,
  opts: { max?: number; nowISO?: string } = {},
): LabBodyExposureSignal[] {
  const max = opts.max ?? 5
  if (!(max > 0) || !Number.isFinite(max)) return []
  const nowMs = opts.nowISO ? Date.parse(`${opts.nowISO.slice(0, 10)}T23:59:59.999Z`) : Number.POSITIVE_INFINITY
  if (opts.nowISO && !Number.isFinite(nowMs)) return []

  const terbaru: LabBodyExposureSignal[] = []
  for (const jenis of JENIS_LAB) {
    const daftar = lab[jenis.id]
    if (!Array.isArray(daftar) || daftar.length === 0) continue
    let best: ButirLab | null = null
    for (const b of daftar) {
      if (!b || !tanggalKalenderSah(b.tanggal) || !Number.isFinite(b.nilai) || !(b.nilai > 0)) continue
      const t = Date.parse(`${b.tanggal}T00:00:00.000Z`)
      if (!Number.isFinite(t) || t > nowMs) continue
      if (!best || b.tanggal > best.tanggal) best = b
    }
    if (!best) continue
    terbaru.push({
      id: `lab-overlay:${jenis.id}:${best.id}`,
      label: jenis.nama,
      value: String(best.nilai),
      unit: jenis.satuan,
      recordedAt: best.tanggal,
      truthClass: 'patient-recorded',
      source: 'lab-log',
      method: 'patient-transcribed-lab-report',
      jenisId: jenis.id,
    })
  }
  return terbaru
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || a.jenisId.localeCompare(b.jenisId))
    .slice(0, Math.floor(max))
}
