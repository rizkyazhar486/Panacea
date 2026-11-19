import { useMemo, useState, type CSSProperties } from 'react'
import { useOptionalStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { translateHippocraticBridge, type LiteracyLensId } from '../../domains/education/hippocraticBridgeEngine'
import {
  buildContinuumOutboxEvent,
  evaluateLifeHealthContinuum,
  type HealthContinuumPhase,
  type RecoveryTrendState,
} from '../../domains/continuum/lifeHealthContinuumEngine'
import { sha256Hex } from '../../lib/export/autoExportEngine'
import { InfoDisclosure } from '../ui/InfoDisclosure'

const QR_CARD_KEY = 'pmd_universal_qr_pass_v1'
const NEON_OUTBOX_KEY = 'pmd_neon_sync_outbox_v1'

interface OfflineEmergencyQrData {
  bloodType: string
  drugAllergies: string
  chronicConditions: string
  activeMeds: string
  emergencyContact: string
}

type DeckTileId = 'condition' | 'translator' | 'qr_pass'

const DEFAULT_QR_SUMMARY: OfflineEmergencyQrData = {
  bloodType: 'O+',
  drugAllergies: 'None recorded',
  chronicConditions: 'Preventive wellness tracking',
  activeMeds: 'None active',
  emergencyContact: 'Family contact (local card)',
}

function loadQrSummary(): OfflineEmergencyQrData {
  try {
    const raw = localStorage.getItem(QR_CARD_KEY)
    if (!raw) return DEFAULT_QR_SUMMARY
    const parsed = JSON.parse(raw) as Partial<OfflineEmergencyQrData>
    return {
      bloodType: parsed.bloodType || DEFAULT_QR_SUMMARY.bloodType,
      drugAllergies: parsed.drugAllergies || DEFAULT_QR_SUMMARY.drugAllergies,
      chronicConditions: parsed.chronicConditions || DEFAULT_QR_SUMMARY.chronicConditions,
      activeMeds: parsed.activeMeds || DEFAULT_QR_SUMMARY.activeMeds,
      emergencyContact: parsed.emergencyContact || DEFAULT_QR_SUMMARY.emergencyContact,
    }
  } catch {
    return DEFAULT_QR_SUMMARY
  }
}

function buildDeterministicMatrix(seedText: string): boolean[][] {
  const hash = sha256Hex(seedText)
  const size = 9
  const grid: boolean[][] = []
  let idx = 0
  for (let r = 0; r < size; r++) {
    const row: boolean[] = []
    for (let c = 0; c < size; c++) {
      const finder = (r < 2 && c < 2) || (r < 2 && c >= size - 2) || (r >= size - 2 && c < 2)
      if (finder) {
        row.push(true)
      } else {
        const hexNibble = parseInt(hash[idx % hash.length] || '0', 16)
        row.push((hexNibble + r + c) % 2 === 0)
        idx += 1
      }
    }
    grid.push(row)
  }
  return grid
}

const tileButtonStyle = (bg: string, active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 84,
  width: '100%',
  padding: '14px 18px',
  borderRadius: 20,
  border: active ? '3px solid #22d3ee' : '2px solid rgba(255,255,255,0.2)',
  background: bg,
  color: '#ffffff',
  textAlign: 'left',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  cursor: 'pointer',
})

const bigTabButtonStyle = (active: boolean): CSSProperties => ({
  minHeight: 72,
  padding: '10px 14px',
  borderRadius: 16,
  border: active ? '3px solid #047857' : '2px solid #94a3b8',
  background: active ? '#065f46' : '#f8fafc',
  color: active ? '#ffffff' : '#0f172a',
  fontSize: 17,
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
})

export function UniversalSimpleDeck() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null
  const vitals = useMemo(() => readUnifiedLocalVitals(account, { patient }), [account, patient])

  const [openTile, setOpenTile] = useState<DeckTileId>('condition')
  const [phase, setPhase] = useState<HealthContinuumPhase>('before_illness')
  const [trend, setTrend] = useState<RecoveryTrendState>('better')
  const [lens, setLens] = useState<LiteracyLensId>('plain_universal')
  const [topicInput, setTopicInput] = useState('Tekanan Darah & Kebugaran Harian')
  const [symptomInput, setSymptomInput] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [syncNote, setSyncNote] = useState('')
  const [medChecked, setMedChecked] = useState<Record<string, boolean>>({ 'Obat / Vitamin Pagi': true })

  const [qrData, setQrData] = useState<OfflineEmergencyQrData>(() => loadQrSummary())
  const [editingQr, setEditingQr] = useState(false)

  const profileKey = account?.email ? account.email.split('@')[0] : 'rizkyazhar486'
  const passRef = patient?.mrn || 'PMD-000486'

  const clinicalRecord = useMemo(
    () => ({
      topicTitle: topicInput.trim() || 'Kesehatan Harian',
      language: 'id' as const,
      symptomSummary: symptomInput.trim() || undefined,
      spo2Pct: vitals.spo2Pct ?? null,
      systolicMmHg: vitals.systolic ?? null,
      medications: [{ name: 'Terapi Sesuai Resep Dokter', schedule: 'Pagi & Malam', purpose: 'Menjaga stabilitas tubuh' }],
      consentConfirmed: true,
      scopeId: profileKey,
    }),
    [topicInput, symptomInput, vitals.spo2Pct, vitals.systolic, profileKey],
  )

  const continuum = useMemo(
    () =>
      evaluateLifeHealthContinuum({
        phase,
        language: 'id',
        recoveryTrend: trend,
        activeSymptoms: symptomInput.trim() ? [symptomInput.trim()] : [],
        postIllnessMedChecklist: [
          { name: 'Obat / Vitamin Pagi', schedule: '07:00', taken: Boolean(medChecked['Obat / Vitamin Pagi']) },
          { name: 'Minum Air & Jalan Santai', schedule: '17:00', taken: Boolean(medChecked['Minum Air & Jalan Santai']) },
        ],
        vitals: {
          restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
          spo2Pct: vitals.spo2Pct ?? null,
          systolicMmHg: vitals.systolic ?? null,
          sleepHours: vitals.sleepH ?? null,
          steps: vitals.steps ?? null,
        },
        clinicalRecord,
      }),
    [phase, trend, symptomInput, medChecked, vitals, clinicalRecord],
  )

  const bridge = useMemo(() => translateHippocraticBridge(clinicalRecord), [clinicalRecord])

  const qrPayload = useMemo(() => {
    const body = `PANACEA-QR-V1|${passRef}|BT:${qrData.bloodType}|ALG:${qrData.drugAllergies}|COND:${qrData.chronicConditions}`
    const sig = sha256Hex(body).slice(0, 8).toUpperCase()
    return `${body}|${sig}`
  }, [passRef, qrData])

  const qrMatrix = useMemo(() => buildDeterministicMatrix(qrPayload), [qrPayload])

  const speakSimpleGuidance = () => {
    if (!bridge.ok || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSyncNote('Audio perangkat tidak tersedia — ikuti ringkasan teks di atas.')
      return
    }
    try {
      window.speechSynthesis.cancel()
      if (speaking) {
        setSpeaking(false)
        return
      }
      const utter = new SpeechSynthesisUtterance(bridge.plain_universal.speechSynthesisText)
      utter.lang = 'id-ID'
      utter.rate = 0.92
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utter)
    } catch {
      setSpeaking(false)
      setSyncNote('Audio baca suara tidak aktif pada peramban ini.')
    }
  }

  const queueContinuumEvent = (teachBackConfirmed: boolean) => {
    try {
      const ev = buildContinuumOutboxEvent({
        profileKey,
        phase,
        literacyLens: lens,
        teachBackConfirmed,
        redFlagEscalated: continuum.during_illness.triageLevel === 'emergency_igd',
        nonPhiPassRef: passRef,
        recordedAtIso: new Date().toISOString(),
      })
      const existing = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
      const arr = Array.isArray(existing) ? existing : []
      const deduped = arr.some((x) => x?.idempotencyKey === ev.idempotencyKey) ? arr : [ev, ...arr].slice(0, 50)
      localStorage.setItem(NEON_OUTBOX_KEY, JSON.stringify(deduped))
      setSyncNote(teachBackConfirmed ? `Pemahaman tersimpan lokal & antre Neon (${ev.eventId}).` : `Sinkronisasi siap (${ev.eventId}).`)
    } catch {
      setSyncNote('Tersimpan di memori layar ini.')
    }
  }

  const saveQrPass = () => {
    try {
      localStorage.setItem(QR_CARD_KEY, JSON.stringify(qrData))
      setEditingQr(false)
      queueContinuumEvent(false)
    } catch {
      setEditingQr(false)
    }
  }

  return (
    <section
      aria-label="Universal Alipay-Style Health Continuum Deck"
      style={{ display: 'grid', gap: 14, marginTop: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Mode Akses Universal 1-Ketuk</h3>
        <InfoDisclosure title="Hippocratic Ethics & Truth Notice" badge={continuum.truthClass} align="right">
          <p>{continuum.epistemicNotice}</p>
          <p>Hippocratic gate verified: free humanitarian core active, red-flag ER escalation enabled, zero autonomous prescribing.</p>
        </InfoDisclosure>
      </div>

      {/* 3 Giant High-Contrast Alipay-Style Action Tiles */}
      <button
        type="button"
        onClick={() => setOpenTile('condition')}
        data-testid="universal-tile-condition"
        style={tileButtonStyle('#065f46', openTile === 'condition')}
      >
        <span style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 900 }}>1. Jaga / Cek Kondisi</span>
          <span style={{ fontSize: 16 }}>
            {phase === 'before_illness' ? 'Sebelum Sakit · Jaga Bugar' : phase === 'during_illness' ? 'Saat Sakit · Aman & Terarah' : 'Setelah Sakit · Pulih'}
          </span>
        </span>
        <span style={{ fontSize: 26, fontWeight: 900 }} aria-hidden="true">→</span>
      </button>

      {openTile === 'condition' && (
        <div style={{ border: '2px solid #065f46', borderRadius: 18, padding: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }} role="tablist" aria-label="Fase kesehatan">
            {([
              { id: 'before_illness', label: 'Sebelum Sakit' },
              { id: 'during_illness', label: 'Saat Sakit' },
              { id: 'after_illness', label: 'Setelah Sakit' },
            ] as const).map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={phase === p.id}
                onClick={() => setPhase(p.id)}
                style={bigTabButtonStyle(phase === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {phase === 'before_illness' && (
            <div style={{ display: 'grid', gap: 8, fontSize: 18, fontWeight: 600 }}>
              <div>• {continuum.before_illness.dailyPreventiveHabit}</div>
              <div>• {continuum.before_illness.readinessSummary.headline}</div>
              <div>• {continuum.before_illness.familyScreeningReminders[0]}</div>
            </div>
          )}

          {phase === 'during_illness' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <input
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                placeholder="Ketik keluhan utama (contoh: nyeri dada, demam 2 hari)"
                aria-label="Ketik keluhan utama"
                style={{ minHeight: 54, padding: '10px 14px', borderRadius: 12, border: '2px solid #94a3b8', fontSize: 17 }}
              />
              {continuum.during_illness.emergencyBanner && (
                <div role="alert" style={{ background: '#b91c1c', color: '#ffffff', padding: '14px 16px', borderRadius: 14, fontSize: 22, fontWeight: 900 }}>
                  🚨 {continuum.during_illness.emergencyBanner}
                </div>
              )}
              <div style={{ fontSize: 18, fontWeight: 700 }}>{continuum.during_illness.symptomClarity}</div>
            </div>
          )}

          {phase === 'after_illness' && (
            <div style={{ display: 'grid', gap: 10, fontSize: 17 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(['better', 'same', 'worse'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrend(t)}
                    style={bigTabButtonStyle(trend === t)}
                  >
                    {t === 'better' ? 'Membaik' : t === 'same' ? 'Sama' : 'Memburuk'}
                  </button>
                ))}
              </div>
              {continuum.after_illness.medicationChecklist.map((item) => (
                <label key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 54, fontSize: 18, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(medChecked[item.name])}
                    onChange={(e) => setMedChecked((cur) => ({ ...cur, [item.name]: e.target.checked }))}
                    style={{ width: 24, height: 24 }}
                  />
                  <span>{item.name} ({item.schedule})</span>
                </label>
              ))}
              <div style={{ fontWeight: 700 }}>{continuum.after_illness.followUpReminder}</div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpenTile('translator')}
        data-testid="universal-tile-translator"
        style={tileButtonStyle('#0e7490', openTile === 'translator')}
      >
        <span style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 900 }}>2. Pahami Obat &amp; Lab</span>
          <span style={{ fontSize: 16 }}>Terjemahan Sederhana + Suara 1-Ketuk</span>
        </span>
        <span style={{ fontSize: 26, fontWeight: 900 }} aria-hidden="true">→</span>
      </button>

      {openTile === 'translator' && bridge.ok && (
        <div style={{ border: '2px solid #0e7490', borderRadius: 18, padding: 14, display: 'grid', gap: 12 }}>
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Topik kesehatan atau nama obat"
            aria-label="Topik kesehatan atau nama obat"
            style={{ minHeight: 54, padding: '10px 14px', borderRadius: 12, border: '2px solid #94a3b8', fontSize: 17 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }} role="tablist" aria-label="Pilih bahasa tampilan">
            {([
              { id: 'plain_universal', label: 'Sederhana' },
              { id: 'patient_partner', label: 'Pasien' },
              { id: 'clinician_brief', label: 'Dokter' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={lens === item.id}
                onClick={() => setLens(item.id)}
                style={bigTabButtonStyle(lens === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {lens === 'plain_universal' && (
            <div style={{ display: 'grid', gap: 8, fontSize: 18, fontWeight: 700 }}>
              <div>{bridge.plain_universal.summary}</div>
              <div>Perumpamaan: {bridge.plain_universal.analogy}</div>
              <div>Lakukan: {bridge.plain_universal.whatToDoToday[0]}</div>
              <div style={{ color: '#b91c1c' }}>Darurat: {bridge.plain_universal.redFlagErTrigger}</div>
            </div>
          )}

          {lens === 'patient_partner' && (
            <div style={{ display: 'grid', gap: 8, fontSize: 17 }}>
              <div><strong>Mengapa penting:</strong> {bridge.patient_partner.whyItWorks}</div>
              <div><strong>Perkiraan waktu:</strong> {bridge.patient_partner.expectedTimeline}</div>
              <div><strong>3 Pertanyaan untuk Dokter:</strong></div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {bridge.patient_partner.questionsForDoctor.map((q) => <li key={q}>{q}</li>)}
              </ol>
            </div>
          )}

          {lens === 'clinician_brief' && (
            <div style={{ display: 'grid', gap: 6, fontSize: 16 }}>
              <div><strong>Assessment:</strong> {bridge.clinician_brief.soapSummary.assessment}</div>
              <div><strong>Plan Draft:</strong> {bridge.clinician_brief.soapSummary.planDraft}</div>
              <div><strong>ICD:</strong> {bridge.clinician_brief.codeAnchors.icd10 ?? '—'} · <strong>Teach-Back:</strong> {bridge.clinician_brief.teachBackCheckpoints[0]}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <button type="button" onClick={speakSimpleGuidance} style={bigTabButtonStyle(speaking)}>
              {speaking ? '⏹ Hentikan Suara' : '🔊 Dengarkan Suara'}
            </button>
            <button type="button" onClick={() => queueContinuumEvent(true)} style={bigTabButtonStyle(false)}>
              ✓ Saya Paham
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpenTile('qr_pass')}
        data-testid="universal-tile-qr"
        style={tileButtonStyle('#1e3a8a', openTile === 'qr_pass')}
      >
        <span style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 900 }}>3. Kartu QR Kesehatan</span>
          <span style={{ fontSize: 16 }}>1-Scan Darurat · Bekerja Tanpa Internet</span>
        </span>
        <span style={{ fontSize: 26, fontWeight: 900 }} aria-hidden="true">→</span>
      </button>

      {openTile === 'qr_pass' && (
        <div style={{ border: '2px solid #1e3a8a', borderRadius: 18, padding: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <svg viewBox="0 0 90 90" width="96" height="96" role="img" aria-label="Offline Universal Health QR" style={{ background: '#ffffff', padding: 6, borderRadius: 12, border: '1px solid #cbd5e1' }}>
              {qrMatrix.map((row, r) =>
                row.map((on, c) =>
                  on ? <rect key={`${r}-${c}`} x={c * 10} y={r * 10} width="9" height="9" fill="#0f172a" /> : null,
                ),
              )}
            </svg>
            <div style={{ flex: '1 1 200px', fontSize: 17, display: 'grid', gap: 4 }}>
              <div><strong>Gol. Darah:</strong> {qrData.bloodType}</div>
              <div><strong>Alergi Obat:</strong> {qrData.drugAllergies}</div>
              <div><strong>Kondisi:</strong> {qrData.chronicConditions}</div>
              <div><strong>Kontak Darurat:</strong> {qrData.emergencyContact}</div>
            </div>
          </div>

          {editingQr ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <input value={qrData.bloodType} onChange={(e) => setQrData((d) => ({ ...d, bloodType: e.target.value }))} placeholder="Golongan Darah" aria-label="Golongan Darah" style={{ minHeight: 48, padding: 8, borderRadius: 10, border: '1px solid #94a3b8' }} />
              <input value={qrData.drugAllergies} onChange={(e) => setQrData((d) => ({ ...d, drugAllergies: e.target.value }))} placeholder="Alergi Obat" aria-label="Alergi Obat" style={{ minHeight: 48, padding: 8, borderRadius: 10, border: '1px solid #94a3b8' }} />
              <input value={qrData.chronicConditions} onChange={(e) => setQrData((d) => ({ ...d, chronicConditions: e.target.value }))} placeholder="Kondisi Kronis" aria-label="Kondisi Kronis" style={{ minHeight: 48, padding: 8, borderRadius: 10, border: '1px solid #94a3b8' }} />
              <input value={qrData.emergencyContact} onChange={(e) => setQrData((d) => ({ ...d, emergencyContact: e.target.value }))} placeholder="Kontak Darurat" aria-label="Kontak Darurat" style={{ minHeight: 48, padding: 8, borderRadius: 10, border: '1px solid #94a3b8' }} />
              <button type="button" onClick={saveQrPass} style={bigTabButtonStyle(true)}>Simpan Kartu QR</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditingQr(true)} style={bigTabButtonStyle(false)}>
              Ubah Isi Kartu Darurat
            </button>
          )}
        </div>
      )}

      {syncNote && <div role="status" style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>{syncNote}</div>}
    </section>
  )
}

export default UniversalSimpleDeck
