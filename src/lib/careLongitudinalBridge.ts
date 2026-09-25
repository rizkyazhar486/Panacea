// Cek harian + tinjauan dokter → status longitudinal kanonik.
//
// - Cek harian memakai konverter resmi kernel (dailyAnamnesisToLongitudinalEvents),
//   bukan salinan logikanya. Server hanya mengirim rencana MILIK pengguna yang
//   sedang masuk, jadi subjek rencana (id pengguna server) aman dipetakan ke
//   subjek status lokal (account.patientId).
// - Tinjauan dokter adalah pernyataan klinisi: domain 'clinical-note', tinjauan
//   'accepted' oleh dokter penulisnya, terpisah dari angka lab pasien.
import { dailyAnamnesisToLongitudinalEvents, submitDailyAnamnesis, type ContinuousCarePlan, type DailyAnamnesisSubmissionInput } from './continuousCareOperatingSystem.ts'
import type { ConsentEnvelope, LongitudinalEvent } from './panaceaLongitudinalState.ts'

export interface TinjauanMasuk { id: string; tes: string; dokterEmail: string; ditinjau: string; catatan?: string; cekUlangSebelum?: string }

export function careToLongitudinalEvents(
  plans: readonly { plan: ContinuousCarePlan; reports: readonly DailyAnamnesisSubmissionInput[] }[],
  reviews: readonly TinjauanMasuk[],
  subjectId: string,
  consent: ConsentEnvelope,
  receivedAt: string,
): { events: LongitudinalEvent[]; labels: Record<string, string>; skipped: number } {
  const events: LongitudinalEvent[] = []
  const labels: Record<string, string> = {}
  let skipped = 0
  for (const { plan, reports } of plans) {
    const milik = { ...plan, subjectId }
    for (const q of milik.questions) labels[q.metric] = q.prompt
    for (const r of reports) {
      try {
        const laporan = submitDailyAnamnesis(milik, { ...r, subjectId })
        events.push(...dailyAnamnesisToLongitudinalEvents(milik, laporan, consent, receivedAt))
      } catch { skipped++ }
    }
  }
  for (const t of reviews) {
    if (!/^[a-z0-9_-]{1,32}$/.test(t.tes) || !Number.isFinite(Date.parse(t.ditinjau))) { skipped++; continue }
    const metric = `review.lab.${t.tes}`
    events.push({
      id: `lab-review:${t.id}`,
      subjectId,
      domain: 'clinical-note',
      metric,
      value: t.catatan ? t.catatan : t.cekUlangSebelum ? `Recheck by ${t.cekUlangSebelum}` : 'Reviewed',
      recordedAt: t.ditinjau,
      confidence: 1,
      provenance: { sourceKind: 'clinical-system', sourceId: 'panaceamed:lab-review', capturedAt: t.ditinjau, receivedAt, method: 'clinician-review' },
      consent,
      review: { state: 'accepted', reviewerId: t.dokterEmail, reviewedAt: t.ditinjau },
      tags: ['clinician-authored', `lab:${t.tes}`],
    })
  }
  return { events, labels, skipped }
}
