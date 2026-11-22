/**
 * @file BodyExposureLocalHub.tsx
 * @description Integrated native Local Hub inside /body-exposure, Body Exposure OS, and Data:
 *  - Vitality Bio-Scrolling (smooth dark-emerald canonical telemetry cards)
 *  - 25 Wearable Hub (real Web Bluetooth GATT HR/HRV receiver + 25 canonical device profiles)
 *  - EMV Dynamic QR/Barcode (Luhn ISO/IEC 7812 rotating tokenized pass bound strictly to signed-in account)
 */

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { STAGE_ROOT_CLASS, TONE, TOUCH, eyebrow, glass, primaryButton, subtleButton } from './atlas-stage/stageTokens'
import {
  TWENTY_FIVE_WEARABLE_CATALOG,
  WEARABLE_CATEGORY_LABEL,
  buildVitalityBioScrollCards,
  deriveTokenizedEmvPass,
  encodeCode128Pattern,
  encodeQrMatrix21,
  resolveWearableHubSnapshot,
  verifyLuhnCardNumber,
  type EmvPassMode,
  type WearableCategory,
} from '../engine/localHubEngine'
import {
  discoverConnectedDevices,
  loadBluetoothWearablePanel,
  triggerQuickWearableConnect,
  type ConnectedDeviceRecord,
  type QuickConnectState,
  type WearableSavePatch,
} from '../../devices/index.ts'
import { readUnifiedLocalVitals, recoverSameUserVitalsIntoScope } from '../../identity/index.ts'
import { useOptionalStore } from '../../../lib/store'
import { useOptionalLongitudinalState } from '../../../lib/useLongitudinalState'
import { mergeVitals, type Vitals } from '../../../lib/healthVitals'
import { deretMetrik } from '../../../lib/riwayatVitals'
import { downloadClinicalFhirBundle, printClinicalReport } from '../../clinical-operations'

const BluetoothWearablePanel = lazy(loadBluetoothWearablePanel)
const FaceCapture = lazy(() => import('./face-capture/FaceCapture.tsx').then((m) => ({ default: m.FaceCapture })))

export type HubTab = 'vitality' | 'wearables' | 'emv_pass' | 'face'
type FilterCategory = 'all' | WearableCategory

const HUB_TABS: readonly { readonly id: HubTab; readonly label: string; readonly icon: string }[] = [
  { id: 'vitality', label: 'Vitals', icon: 'M2 12h5l3-8 4 16 3-8h5' },
  { id: 'wearables', label: 'Wearables', icon: 'M9 6l1-4h4l1 4 M9 18l1 4h4l1-4 M7 6h10v12H7z' },
  { id: 'emv_pass', label: 'ID pass', icon: 'M3 5h18v14H3z M6 9h3v3H6z M13 9h5 M13 13h4' },
  { id: 'face', label: '3D face', icon: 'M12 2l9 5v10l-9 5-9-5V7z M3 7l9 5 9-5 M12 12v10' },
]

type OpticalDetector = new (options: { formats: string[] }) => {
  detect: (image: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue?: string }>>
}

async function readOpticalCode(image: HTMLVideoElement | File): Promise<string> {
  const Detector = (globalThis as { BarcodeDetector?: OpticalDetector }).BarcodeDetector
  if (!Detector || (image instanceof File && typeof createImageBitmap !== 'function')) {
    return 'Dekoder QR dan barcode tidak tersedia di browser ini.'
  }
  let bitmap: ImageBitmap | undefined
  try {
    const input = image instanceof File ? (bitmap = await createImageBitmap(image)) : image
    const hits = await new Detector({ formats: ['qr_code', 'code_128'] }).detect(input)
    const raw = hits.find(hit => hit.rawValue?.trim())?.rawValue?.trim()
    if (!raw) return 'Kode belum terbaca. Posisikan seluruh kode di dalam bingkai.'
    if (/^\d{16}$/.test(raw) && verifyLuhnCardNumber(raw)) {
      return 'Barcode terbaca · checksum valid · identitas belum diverifikasi.'
    }
    return 'Kode terbaca · identitas belum diverifikasi.'
  } catch {
    return 'Gagal membaca kode. Coba lagi dengan pencahayaan yang cukup.'
  } finally {
    bitmap?.close()
  }
}

function QrSvg({ payload }: { readonly payload: string }) {
  const matrix = useMemo(() => encodeQrMatrix21(payload), [payload])
  return (
    <svg
      role="img"
      aria-label="EMV dynamic medical token QR matrix"
      data-testid="emv-qr-svg"
      viewBox="0 0 23 23"
      style={{ width: 148, height: 148, borderRadius: 12, background: '#f8fafc', padding: 6, flex: 'none' }}
    >
      <rect x="0" y="0" width="23" height="23" fill="#f8fafc" rx="1" />
      {matrix.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" fill="#04130b" /> : null,
        ),
      )}
    </svg>
  )
}

function Code128Svg({ value }: { readonly value: string }) {
  const encoded = useMemo(() => encodeCode128Pattern(value), [value])
  return (
    <svg
      role="img"
      aria-label={`Code 128 barcode ${value}`}
      data-testid="code128-barcode-svg"
      viewBox={`0 0 ${encoded.totalModules + 12} 44`}
      preserveAspectRatio="none"
      style={{ width: '100%', maxWidth: 320, height: 52, borderRadius: 8, background: '#f8fafc', padding: '6px 10px' }}
    >
      <rect x="0" y="0" width={encoded.totalModules + 12} height="44" fill="#f8fafc" />
      {encoded.bars.map((bar, idx) => (
        <rect key={idx} x={bar.x + 6} y={4} width={bar.width} height={36} fill="#04130b" />
      ))}
    </svg>
  )
}

export function BodyExposureLocalHub({
  initialTab = 'vitality',
  compact = false,
}: {
  readonly initialTab?: HubTab
  readonly compact?: boolean
} = {}) {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null

  const [tab, setTab] = useState<HubTab>(initialTab)
  const [category, setCategory] = useState<FilterCategory>('all')
  const [emvMode, setEmvMode] = useState<EmvPassMode>('universal')
  const [epochMs, setEpochMs] = useState<number>(() => Date.now())
  const [subtleHex, setSubtleHex] = useState<string | null>(null)
  const [vitals, setVitals] = useState<Vitals>(() =>
    readUnifiedLocalVitals(account, {
      patient,
      patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
      sleepLogs: store?.state.sleepLogs,
    }),
  )
  const [bleQuick, setBleQuick] = useState<QuickConnectState | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDeviceRecord[]>([])
  const [recoveryNotice, setRecoveryNotice] = useState('')
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const [scannerActive, setScannerActive] = useState(false)
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'>('idle')
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cameraRequest = useRef(0)

  const scanVersion = useRef(0)
  const [readingCode, setReadingCode] = useState(false)
  const scan = async (source: HTMLVideoElement | File) => {
    const version = ++scanVersion.current
    setReadingCode(true)
    const message = await readOpticalCode(source)
    if (version === scanVersion.current) {
      setScannedResult(message)
      setReadingCode(false)
    }
  }

  const stopScanner = () => {
    scanVersion.current++
    setReadingCode(false)
    setScannedResult(null)
    cameraRequest.current++
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScannerActive(false)
    setScannerStatus('idle')
  }

  const startScanner = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScannerStatus('unsupported')
      return
    }
    const request = ++cameraRequest.current
    setScannerStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      if (request !== cameraRequest.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      setScannerStatus('active')
      setScannerActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    } catch {
      if (request === cameraRequest.current) setScannerStatus('denied')
    }
  }

  useEffect(() => {
    if (scannerActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [scannerActive])

  useEffect(() => {
    return () => {
      cameraRequest.current++
      scanVersion.current++
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const handleExportFhir = () => {
    downloadClinicalFhirBundle({ vitals, patient, account })
  }

  useEffect(() => {
    const refresh = () =>
      setVitals(
        readUnifiedLocalVitals(account, {
          patient,
          patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
          sleepLogs: store?.state.sleepLogs,
        }),
      )
    refresh()
    const refreshDevices = () => {
      void discoverConnectedDevices({
        ownerEmail: account?.email,
        vitalsSource: typeof vitals.source === 'string' ? vitals.source : undefined,
      }).then(setConnectedDevices)
    }
    refreshDevices()
    window.addEventListener('panacea:devices-updated', refreshDevices)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('panacea:health-updated', refreshDevices)
    window.addEventListener('panacea:body-character-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panacea:devices-updated', refreshDevices)
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('panacea:health-updated', refreshDevices)
      window.removeEventListener('panacea:body-character-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [account, patient, store?.state.vitals, store?.state.sleepLogs, vitals.source])

  useEffect(() => {
    const timer = window.setInterval(() => setEpochMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const rotationWindow = Math.floor(epochMs / 15000)
  useEffect(() => {
    let active = true
    if (!account?.id || typeof crypto === 'undefined' || !crypto.subtle) {
      setSubtleHex(null)
      return () => { active = false }
    }
    const seed = `${account.id}|${patient?.mrn ?? ''}|${rotationWindow}`
    crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(seed))
      .then((buf) => {
        if (!active) return
        setSubtleHex(Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''))
      })
      .catch(() => { if (active) setSubtleHex(null) })
    return () => { active = false }
  }, [account?.id, patient?.mrn, rotationWindow])

  const wearableSnapshot = useMemo(
    () => resolveWearableHubSnapshot(vitals, longitudinal),
    [vitals, longitudinal],
  )

  const emvPass = useMemo(
    () =>
      deriveTokenizedEmvPass({
        accountId: account?.id,
        accountName: account?.name || patient?.name,
        mrn: patient?.mrn,
        role: account?.role,
        allergies: patient?.allergies,
        chronicConditions: patient?.chronicConditions,
        epochMs,
        subtleSha256Hex: subtleHex,
      }),
    [account?.id, account?.name, account?.role, patient?.name, patient?.mrn, patient?.allergies, patient?.chronicConditions, epochMs, subtleHex],
  )

  const vitalityCards = useMemo(
    () => buildVitalityBioScrollCards({ wearableSnapshot, emvPass, longitudinal }),
    [wearableSnapshot, emvPass, longitudinal],
  )

  const filteredDevices = useMemo(
    () => category === 'all' ? wearableSnapshot.devices : wearableSnapshot.devices.filter((d) => d.device.category === category),
    [category, wearableSnapshot.devices],
  )

  const previousRmssd = useMemo(() => deretMetrik('hrvRmssdMs', 90).map((t) => t.nilai), [vitals])

  const saveBluetoothReading = (patch: WearableSavePatch) => {
    setVitals(mergeVitals(patch))
  }

  const stepVitalityCard = (delta: number) => {
    const nextIdx = Math.max(0, Math.min(vitalityCards.length - 1, activeCardIdx + delta))
    setActiveCardIdx(nextIdx)
    const child = scrollerRef.current?.children.item(nextIdx) as HTMLElement | null
    child?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })
  }

  const toneBadgeColor = (tone: 'live' | 'warn' | 'muted') =>
    tone === 'live' ? TONE.liveText : tone === 'warn' ? TONE.sim : TONE.dim

  return (
    <section
      id="body-exposure-local-hub"
      data-testid="body-exposure-local-hub"
      aria-label="Body Exposure Local Hub"
      className={STAGE_ROOT_CLASS}
      style={{
        marginTop: compact ? 8 : 16,
        borderRadius: 24,
        border: `1px solid ${TONE.line}`,
        background: TONE.bg,
        color: TONE.text,
        padding: compact ? 14 : 16,
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingBottom: 12,
          borderBottom: `1px solid ${TONE.line}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: compact ? 16 : 18, color: TONE.text }}>Body Exposure</h3>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Local Hub views">
            {HUB_TABS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (tab === 'emv_pass' && item.id !== tab) stopScanner()
                    setTab(item.id)
                  }}
                  className="as-focus as-hover as-fade"
                  style={{
                    minHeight: TOUCH,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: `1px solid ${active ? TONE.live : TONE.line}`,
                    background: active ? TONE.active : TONE.raised,
                    color: active ? TONE.onActive : TONE.text,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => void triggerQuickWearableConnect(setBleQuick)}
              disabled={bleQuick?.status === 'connecting'}
              data-testid="hub-auto-connect-wearable"
              style={{
                ...primaryButton,
                minHeight: TOUCH,
                padding: '0 12px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {bleQuick?.status === 'connecting'
                ? '⌛ Connecting BLE…'
                : bleQuick?.status === 'connected'
                ? `● ${bleQuick.bpm ? `${bleQuick.bpm} bpm Live` : 'Wearable Connected'}`
                : '⚡ 1-Click Auto-Connect Wearable'}
            </button>
            <button
              type="button"
              onClick={handleExportFhir}
              title="Unduh data dalam format standar HL7 FHIR R4 SATUSEHAT"
              style={{
                ...subtleButton,
                minHeight: TOUCH,
                padding: '0 12px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                borderColor: TONE.lineStrong,
                color: TONE.liveText,
              }}
            >
              📥 Ekspor FHIR R4
            </button>
            <button
              type="button"
              onClick={() => printClinicalReport()}
              title="Cetak kartu atau laporan klinis sebagai PDF"
              style={{
                ...subtleButton,
                minHeight: TOUCH,
                padding: '0 12px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                borderColor: TONE.lineStrong,
                color: TONE.text,
              }}
            >
              🖨️ Cetak PDF
            </button>
          </div>
          {bleQuick && (
            <div style={{ width: '100%', fontSize: 11, fontWeight: 700, color: bleQuick.status === 'connected' ? TONE.liveText : TONE.dim }}>
              {bleQuick.message}
            </div>
          )}
        </div>
      </div>

      {tab === 'vitality' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: TONE.liveText }}>
              Vitals · Card {activeCardIdx + 1} of {vitalityCards.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                aria-label="Previous vitality card"
                disabled={activeCardIdx <= 0}
                onClick={() => stepVitalityCard(-1)}
                className="as-focus as-fade"
                style={{ ...subtleButton, minHeight: TOUCH, opacity: activeCardIdx <= 0 ? 0.5 : 1 }}
              >
                ← Prev
              </button>
              <button
                type="button"
                aria-label="Next vitality card"
                disabled={activeCardIdx >= vitalityCards.length - 1}
                onClick={() => stepVitalityCard(1)}
                className="as-focus as-fade"
                style={{ ...subtleButton, minHeight: TOUCH, opacity: activeCardIdx >= vitalityCards.length - 1 ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>

          <div
            ref={scrollerRef}
            data-testid="vitality-bio-scroll-strip"
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(270px, 1fr)',
              gap: 12,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: 6,
            }}
          >
            {vitalityCards.map((card, idx) => (
              <article
                key={card.id}
                onMouseEnter={() => setActiveCardIdx(idx)}
                style={{
                  ...glass,
                  scrollSnapAlign: 'start',
                  padding: 14,
                  border: `1px solid ${idx === activeCardIdx ? TONE.live : TONE.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ ...eyebrow, color: toneBadgeColor(card.statusTone) }}>{card.badge}</div>
                  <h4 style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 800, color: TONE.text }}>{card.title}</h4>
                  <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.45, color: TONE.dim }}>{card.summary}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {card.metrics.map((m) => (
                    <div key={m.label} style={{ borderRadius: 10, border: `1px solid ${TONE.line}`, background: 'rgba(255,255,255,0.025)', padding: '7px 9px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TONE.faint }}>{m.label}</div>
                      <div style={{ marginTop: 2, fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: TONE.text }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <a
                  href={card.actionHref}
                  style={{
                    ...subtleButton,
                    minHeight: TOUCH,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    borderColor: TONE.lineStrong,
                    color: TONE.liveText,
                  }}
                >
                  {card.actionLabel} →
                </a>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'wearables' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...glass, padding: 14 }} data-testid="connected-devices-vault">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ ...eyebrow, color: TONE.liveText }}>What Has Connected &amp; Recovered Devices ({connectedDevices.length})</div>
                <div style={{ marginTop: 3, fontSize: 12, color: TONE.dim }}>
                  Paired Bluetooth straps, smartwatches, and synced device exports remembered for this account.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = recoverSameUserVitalsIntoScope(account, {
                    patient,
                    patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
                    sleepLogs: store?.state.sleepLogs,
                  })
                  setVitals(
                    readUnifiedLocalVitals(account, {
                      patient,
                      patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
                      sleepLogs: store?.state.sleepLogs,
                    }),
                  )
                  setRecoveryNotice(
                    `Recovered ${res.mergedFieldsCount} metric(s), ${res.historyDaysRecovered} history day(s), ${res.workoutsRecovered} workout(s), ${res.devicesDiscovered} device(s).`,
                  )
                }}
                style={{ ...subtleButton, minHeight: TOUCH, fontSize: 11, fontWeight: 700, borderColor: TONE.lineStrong, color: TONE.liveText }}
              >
                ♻️ Recover Device Data &amp; Logs
              </button>
            </div>
            {recoveryNotice && (
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: TONE.liveText }}>{recoveryNotice}</div>
            )}
            {connectedDevices.length > 0 ? (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {connectedDevices.map((dev) => (
                  <div key={dev.id} style={{ borderRadius: 12, border: `1px solid ${TONE.live}`, background: 'rgba(0, 191, 99, 0.08)', padding: '9px 11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10, fontWeight: 800, color: TONE.liveText }}>
                      <span>{dev.transport.toUpperCase()}</span>
                      <span>{dev.batteryPercent != null ? `🔋 ${dev.batteryPercent}%` : dev.pairedInBrowser ? 'PAIRED' : 'SYNCED'}</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 13, fontWeight: 800, color: TONE.text }}>{dev.name}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: TONE.dim }}>
                      Last sync: {dev.lastConnectedAt.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 12, color: TONE.faint }}>
                No paired wearable or sync device recorded yet. Tap &quot;1-Click Auto-Connect Wearable&quot; or connect below.
              </div>
            )}
          </div>

          <div style={{ ...glass, padding: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ ...eyebrow, color: TONE.liveText }}>Direct Web Bluetooth GATT Connection</div>
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: TONE.text }}>
                  Connect your Bluetooth chest strap, smart watch, or screenless band (0x180D Heart Rate / RR HRV)
                </div>
              </div>
              <a href="#/fitness-hub?view=health-data" style={{ ...subtleButton, minHeight: TOUCH, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: TONE.liveText }}>
                Health Sync &amp; Import →
              </a>
            </div>
            <div style={{ marginTop: 12 }}>
              <Suspense fallback={<div style={{ fontSize: 12, color: TONE.dim }}>Loading Bluetooth receiver…</div>}>
                <BluetoothWearablePanel onSave={saveBluetoothReading} previousRmssd={previousRmssd} />
              </Suspense>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TONE.dim }}>
              Supported Catalog: <strong style={{ color: TONE.liveText }}>{wearableSnapshot.devicesWithData}</strong> of{' '}
              <strong>{wearableSnapshot.totalCatalogDevices}</strong> device profiles have live/recorded channels ({wearableSnapshot.recordedSignalsCount} metrics)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Filter wearable category">
              {(['all', 'watch_strap', 'ring_audio', 'patch_biosensor', 'clinical_monitor', 'home_iot'] as const).map((cat) => {
                const active = category === cat
                const label = cat === 'all' ? `All (${TWENTY_FIVE_WEARABLE_CATALOG.length})` : WEARABLE_CATEGORY_LABEL[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(cat)}
                    className="as-focus as-fade"
                    style={{
                      minHeight: TOUCH,
                      padding: '0 12px',
                      borderRadius: 10,
                      border: `1px solid ${active ? TONE.live : TONE.line}`,
                      background: active ? TONE.active : TONE.raised,
                      color: active ? TONE.onActive : TONE.dim,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div data-testid="wearables-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))', gap: 10 }}>
            {filteredDevices.map((entry) => (
              <div key={entry.device.id} style={{ ...glass, padding: 12, border: `1px solid ${entry.hasRecordedSignal ? TONE.live : TONE.line}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: TONE.faint }}>#{String(entry.device.slot).padStart(2, '0')} · {entry.device.transport}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: entry.hasRecordedSignal ? TONE.liveText : TONE.dim }}>
                    {entry.hasRecordedSignal ? 'SIGNAL ACTIVE' : 'AWAITING SYNC'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: TONE.text }}>{entry.device.name}</div>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: TONE.dim }}>{entry.device.summary}</div>
                {entry.recordedPairs.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {entry.recordedPairs.map((pair) => (
                      <span key={pair.key} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(0, 191, 99, 0.14)', border: `1px solid ${TONE.live}`, color: TONE.liveText, fontVariantNumeric: 'tabular-nums' }}>
                        {pair.label}: {pair.value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: TONE.faint }}>Feeds: {entry.device.metricKeys.join(', ')} (not recorded yet)</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'face' && (
        <Suspense fallback={<div style={{ marginTop: 14, fontSize: 12, color: TONE.dim }}>Loading face capture…</div>}>
          <FaceCapture />
        </Suspense>
      )}

      {tab === 'emv_pass' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!emvPass.ok ? (
            <div data-testid="emv-pass-locked" style={{ ...glass, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ ...eyebrow, color: TONE.sim }}>Identity Binding Required</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: TONE.text }}>{emvPass.message}</p>
              <a href="#/profile" style={{ ...primaryButton, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'auto', alignSelf: 'flex-start', textDecoration: 'none' }}>
                Sign In / Manage Account →
              </a>
            </div>
          ) : (
            <div data-testid="emv-pass-active" style={{ ...glass, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ ...eyebrow, color: TONE.liveText }}>
                    ISO/IEC 7812 Luhn Verified · 15s Rotating Token ({emvPass.secondsRemaining}s)
                  </div>
                  <div style={{ marginTop: 4, fontSize: 16, fontWeight: 800, color: TONE.text }}>
                    {emvPass.holderName} · MRN {emvPass.maskedMrn}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: TONE.dim }}>
                    Token dPAN: {emvPass.tokenizedDevicePanMasked} · ATC #{emvPass.atcCounter} · ARQC {emvPass.arqcHex} · dCVV {emvPass.dynamicDcvv}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Token pass variant">
                  {([
                    { id: 'universal', label: 'Universal QR' },
                    { id: 'emergency', label: 'Emergency QR' },
                    { id: 'wristband', label: 'Code-128 Band' },
                  ] as const).map((variant) => {
                    const active = emvMode === variant.id
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setEmvMode(variant.id)}
                        className="as-focus as-fade"
                        style={{
                          minHeight: TOUCH,
                          padding: '0 12px',
                          borderRadius: 10,
                          border: `1px solid ${active ? TONE.live : TONE.line}`,
                          background: active ? TONE.active : TONE.raised,
                          color: active ? TONE.onActive : TONE.text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {variant.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                <QrSvg payload={emvMode === 'emergency' ? emvPass.payloads.emergency : emvPass.payloads.universal} />
                <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Code128Svg value={emvPass.payloads.wristbandCode128} />
                  <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: TONE.dim }}>
                    Wristband Code-128: <strong style={{ color: TONE.text }}>{emvPass.payloads.wristbandCode128}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                    <div style={{ borderRadius: 10, border: `1px solid ${TONE.line}`, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TONE.faint }}>Recorded Allergies</div>
                      <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: TONE.text }}>{emvPass.emergencyFacts.allergiesLabel}</div>
                    </div>
                    <div style={{ borderRadius: 10, border: `1px solid ${TONE.line}`, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TONE.faint }}>Chronic Conditions</div>
                      <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: TONE.text }}>{emvPass.emergencyFacts.conditionsLabel}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Scanner & Verifier UI with clear device permission states */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${TONE.line}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TONE.text }}>Pemindaian &amp; Verifikasi Token Medis</span>
                    <span style={{ marginLeft: 8, fontSize: 10, color: TONE.dim }}>Kamera langsung atau berkas gambar</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {!scannerActive ? (
                      <button
                        type="button"
                        onClick={startScanner}
                        disabled={scannerStatus === 'requesting'}
                        style={{ ...primaryButton, minHeight: TOUCH, padding: '0 14px', fontSize: 11, width: 'auto' }}
                      >
                        📷 Buka Kamera Pemindai
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopScanner}
                        style={{ ...subtleButton, minHeight: TOUCH, padding: '0 14px', fontSize: 11, borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        ✕ Tutup Kamera
                      </button>
                    )}
                    <label style={{ ...subtleButton, minHeight: TOUCH, padding: '0 14px', fontSize: 11, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: TONE.liveText, borderColor: TONE.lineStrong }}>
                      📁 Unggah Gambar QR
                      <input
                        type="file"
                        disabled={readingCode}
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          e.target.value = ''
                          await scan(file)
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {scannerStatus === 'requesting' && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: TONE.sim }}>
                    Meminta izin akses kamera pada browser Anda…
                  </p>
                )}

                {scannerStatus === 'denied' && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#f87171' }}>
                    Izin kamera ditolak pada pengaturan situs. Anda tetap dapat menggunakan tombol <strong>Unggah Gambar QR</strong> di atas.
                  </p>
                )}

                {scannerStatus === 'unsupported' && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: TONE.dim }}>
                    Browser tidak mendukung kamera langsung di rute ini. Gunakan tombol <strong>Unggah Gambar QR</strong>.
                  </p>
                )}

                {scannerActive && (
                  <div style={{ marginTop: 10, position: 'relative', maxWidth: 360, borderRadius: 14, overflow: 'hidden', border: `1px solid ${TONE.live}` }}>
                    <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: 220, objectFit: 'cover', background: '#000' }} />
                    <div style={{ position: 'absolute', inset: 24, border: '2px dashed #00bf63', borderRadius: 10, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#a7f3d0', textAlign: 'center' }}>
                      Arahkan kamera ke QR / Barcode kartu EMVCo
                    </div>
                  </div>
                )}

                {scannerActive && (
                  <button type="button" disabled={readingCode} style={{ ...primaryButton, minHeight: TOUCH }}
                    onClick={() => { if (videoRef.current) void scan(videoRef.current) }}>
                    {readingCode ? 'Memindai…' : 'Pindai kode'}
                  </button>
                )}

                {scannedResult && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(0, 191, 99, 0.1)', border: `1px solid ${TONE.live}`, fontSize: 11, color: TONE.liveText }}>
                    {scannedResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${TONE.line}`, fontSize: 11, color: TONE.dim }}>
        <strong style={{ color: TONE.gate }}>Clinical Boundary (clinicallyReviewed: false):</strong> Integrated telemetry and tokenized ID cards support personal tracking and clinical triage workflow preparation; licensed clinician review is required for diagnostic or therapeutic decisions.
      </div>
    </section>
  )
}
