import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { getVitals } from './healthVitals'
import { ambilLab } from './lab'
import { labLogToLongitudinalEvents } from './labLongitudinalBridge'
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

export function useLongitudinalState(): { state: LongitudinalPatientState | null; skipped: number } {
  const { state: app, account } = useStore()
  const [versiLab, setVersiLab] = useState(0)
  useEffect(() => {
    const ubah = () => setVersiLab((v) => v + 1)
    window.addEventListener('panacea:lab', ubah)
    return () => window.removeEventListener('panacea:lab', ubah)
  }, [])

  return useMemo(() => {
    const subjectId = account?.patientId
    if (!account || !subjectId) return { state: null, skipped: 0 }
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
    return { state, skipped }
    // versiLab memicu hitung ulang saat log lab berubah.
  }, [app, account, versiLab])
}
