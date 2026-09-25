import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { getVitals } from './healthVitals'
import { ambilLab } from './lab'
import { labLogToLongitudinalEvents } from './labLongitudinalBridge'
import { careToLongitudinalEvents, type TinjauanMasuk } from './careLongitudinalBridge'
import { emrRecordToLongitudinalEvents, emrVitalsToLongitudinalEvents, LABEL_METRIK_VITAL_EMR, type ServerAcceptedEmrRecord, type VitalTercatat } from './emrLongitudinalBridge'
import { api, backendEnabled } from './api'
import { PERISTIWA_SINKRON } from './antreanKlinis'
import type { EMRRecord } from './types'
import type { ContinuousCarePlan, DailyAnamnesisSubmissionInput } from './continuousCareOperatingSystem'
import { syncProductionAppState } from './productionAppStateLongitudinalSync'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type ConsentEnvelope, type LongitudinalPatientState } from './panaceaLongitudinalState'

// Satu status longitudinal untuk akun yang sedang masuk, dibangun dari penyimpanan
// NYATA yang sudah ada (vital klinis, vital mandiri, VO₂max, snapshot perangkat,
// log lab) lewat jembatan kanonik — bukan model pasien kedua.
//
// Persetujuan yang diberikan di sini hanya 'personal-visualization': pemilik akun
// melihat datanya sendiri. Dukungan klinis dan konteks AI TIDAK diasumsikan.
// Kepercayaan ingest = 1 berarti "diterima sebagaimana dicatat", bukan akurasi alat.
const KEPERCAYAAN_CATATAN = 1

export function useLongitudinalState(): { state: LongitudinalPatientState | null; skipped: number; labels: Record<string, string> } {
  const { state: app, account } = useStore()
  const [versiLab, setVersiLab] = useState(0)
  const [versiKlinis, setVersiKlinis] = useState(0)
  // Data server (hanya bila ada backend + sesi): cek harian dan tinjauan dokter.
  const [server, setServer] = useState<{ plans: { plan: ContinuousCarePlan; reports: DailyAnamnesisSubmissionInput[] }[]; reviews: TinjauanMasuk[]; records: Record<string, EMRRecord>; vitals: Record<string, VitalTercatat[]>; encounters: Record<string, EMRRecord[]> }>({ plans: [], reviews: [], records: {}, vitals: {}, encounters: {} })
  useEffect(() => {
    if (!backendEnabled || !account) return
    let aktif = true
    Promise.all([api.carePlans().catch(() => ({ plans: [] })), api.getLabShares().catch(() => ({ reviews: [] as TinjauanMasuk[] })), account.role === 'pasien' ? api.clinical().catch(() => ({ records: {} as Record<string, EMRRecord>, vitals: {} as Record<string, VitalTercatat[]>, encounters: {} as Record<string, EMRRecord[]> })) : Promise.resolve({ records: {} as Record<string, EMRRecord>, vitals: {} as Record<string, VitalTercatat[]>, encounters: {} as Record<string, EMRRecord[]> })])
      .then(([c, l, clinical]) => { if (aktif) setServer({ plans: c.plans, reviews: (l as { reviews?: TinjauanMasuk[] }).reviews ?? [], records: clinical.records ?? {}, vitals: ((clinical as { vitals?: Record<string, VitalTercatat[]> }).vitals) ?? {}, encounters: ((clinical as { encounters?: Record<string, EMRRecord[]> }).encounters) ?? {} }) })
    return () => { aktif = false }
  }, [account, versiLab, versiKlinis])
  useEffect(() => {
    const ubah = () => setVersiLab((v) => v + 1)
    window.addEventListener('panacea:lab', ubah)
    return () => window.removeEventListener('panacea:lab', ubah)
  }, [])
  useEffect(() => {
    const ubah = () => setVersiKlinis((v) => v + 1)
    window.addEventListener(PERISTIWA_SINKRON, ubah)
    return () => window.removeEventListener(PERISTIWA_SINKRON, ubah)
  }, [])

  return useMemo(() => {
    const subjectId = account?.patientId
    if (!account || !subjectId) return { state: null, skipped: 0, labels: {} }
    const kini = new Date().toISOString()
    const consent: ConsentEnvelope = { granted: true, purposes: ['personal-visualization'], grantedAt: new Date(0).toISOString() }
    let state = createLongitudinalPatientState(subjectId, kini)
    let skipped = 0
    try {
      const r = syncProductionAppState({
        state, appState: { ...app, account }, subjectId, scope: 'personal-plus-clinical', currentVitals: getVitals(),
        context: { consent, receivedAt: kini, confidence: { clinicalVital: KEPERCAYAAN_CATATAN, selfVital: KEPERCAYAAN_CATATAN, vo2max: KEPERCAYAAN_CATATAN, deviceSnapshot: KEPERCAYAAN_CATATAN } },
      })
      state = r.state; skipped += r.skipped.length
    } catch (e) {
      console.warn('[longitudinal] app-state sync skipped:', (e as Error).message)
    }
    const lab = labLogToLongitudinalEvents(ambilLab(), subjectId, { consent, receivedAt: kini, confidence: KEPERCAYAAN_CATATAN })
    skipped += lab.skipped.length
    // Satu event tak sah tidak boleh merobohkan halaman: lewati dan hitung.
    for (const ev of lab.events) {
      try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
    }
    const care = careToLongitudinalEvents(server.plans, server.reviews, subjectId, consent, kini)
    skipped += care.skipped
    for (const ev of care.events) {
      try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
    }
    // Hanya rekam yang SUDAH dicap server oleh klinisi yang boleh menjadi fakta
    // longitudinal. Draft lokal yang baru menekan tombol Sign tidak punya
    // signedById server, sehingga gagal tertutup sampai sinkron berhasil.
    if (account.role === 'pasien') {
      // /api/clinical sudah fail-closed ke self-record akun pasien di server
      // (saringKlinis + bolehAksesPasien). Karena account.patientId lokal lama
      // belum memakai id self-* server, jangan mencocokkan dua namespace itu
      // dengan string. Semua record yang lolos endpoint pasien adalah milik
      // akun ini dan diproyeksikan ke subjectId kanonik lokal yang sama.
      // Kunjungan tertutup adalah rekam bertanda tangan server yang dibekukan; tetap fakta.
      for (const record of [...Object.values(server.encounters).flat(), ...Object.values(server.records)] as ServerAcceptedEmrRecord[]) {
        const emr = emrRecordToLongitudinalEvents(record, subjectId, consent, kini)
        skipped += emr.skipped
        for (const ev of emr.events) {
          try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
        }
      }
      for (const vitals of Object.values(server.vitals)) {
        const vit = emrVitalsToLongitudinalEvents(vitals, subjectId, consent, kini)
        skipped += vit.skipped
        for (const ev of vit.events) {
          try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
        }
      }
    }
    return { state, skipped, labels: { ...care.labels, 'emr.signed-note': 'Signed clinical record', 'emr.primary-diagnosis': 'Primary diagnosis', 'emr.verified-plan': 'Verified care plan', ...LABEL_METRIK_VITAL_EMR } }
    // versiLab memicu hitung ulang saat log lab berubah.
  }, [app, account, versiLab, server])
}
