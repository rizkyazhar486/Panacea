// Status longitudinal kanonik untuk pasien yang BERBAGI dengan dokter, dibangun
// di peramban dokter dari sumber yang disimpan server (bundel FHIR lab, rencana +
// laporan cek harian, tinjauan) lewat jembatan yang sama persis dengan sisi
// pasien. Server menyimpan sumber; kernel yang sama menyusun status di mana pun.
// Tujuan izin: 'clinical-support' — pasien memberi akses baca ke dokter ini.
import { labLogToLongitudinalEvents } from './labLongitudinalBridge.ts'
import { careToLongitudinalEvents, type TinjauanMasuk } from './careLongitudinalBridge.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type ConsentEnvelope, type LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import type { ContinuousCarePlan, DailyAnamnesisSubmissionInput } from './continuousCareOperatingSystem.ts'
import type { ButirLab } from './lab.ts'

interface ObsMinimal {
  resourceType?: string
  identifier?: { system: string; value: string }[]
  effectiveDateTime?: string
  valueQuantity?: { value: number }
  referenceRange?: { low?: { value: number }; high?: { value: number } }[]
}

/** Bundel FHIR lab (Observation ber-identifier `<jenis>/<id>`) → bentuk log lab. */
export function logDariBundel(entries: readonly { resource: ObsMinimal }[]): Record<string, ButirLab[]> {
  const log: Record<string, ButirLab[]> = {}
  for (const { resource: r } of entries) {
    if (r.resourceType !== 'Observation') continue
    const kunci = r.identifier?.find((i) => i.system.endsWith('/lab-entry'))?.value
    if (!kunci || !r.effectiveDateTime || typeof r.valueQuantity?.value !== 'number') continue
    const [jenis, ...sisa] = kunci.split('/')
    const rr = r.referenceRange?.[0]
    ;(log[jenis] ??= []).push({
      id: sisa.join('/'), tanggal: r.effectiveDateTime.slice(0, 10), nilai: r.valueQuantity.value,
      ...(rr?.low ? { rujukanBawah: rr.low.value } : {}), ...(rr?.high ? { rujukanAtas: rr.high.value } : {}),
    })
  }
  return log
}

export function statusPasienUntukDokter(
  entries: readonly { resource: ObsMinimal }[],
  care: { plan: ContinuousCarePlan | null; reports: readonly DailyAnamnesisSubmissionInput[] },
  reviews: readonly TinjauanMasuk[],
  izin: { dibuat: string; berakhir: string },
  kini: string,
): { state: LongitudinalPatientState; labels: Record<string, string>; skipped: number } {
  const subjectId = 'shared-patient'
  const consent: ConsentEnvelope = { granted: true, purposes: ['clinical-support'], grantedAt: izin.dibuat, expiresAt: izin.berakhir }
  let state = createLongitudinalPatientState(subjectId, kini)
  const lab = labLogToLongitudinalEvents(logDariBundel(entries), subjectId, { consent, receivedAt: kini, confidence: 1 })
  const cr = careToLongitudinalEvents(care.plan ? [{ plan: care.plan, reports: care.reports }] : [], reviews, subjectId, consent, kini)
  let skipped = lab.skipped.length + cr.skipped
  for (const e of [...lab.events, ...cr.events]) {
    try { state = ingestLongitudinalEvent(state, e).state } catch { skipped++ }
  }
  return { state, labels: cr.labels, skipped }
}
