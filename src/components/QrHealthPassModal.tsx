import { useEffect, useMemo, useRef, useState } from 'react'
import { Portal } from './Portal'
import { deriveTokenizedEmvPass, encodeCode128Pattern, encodeQrMatrix21 } from '../domains/body-exposure/engine/localHubEngine'
import {
  buildOtpAuthUri,
  encodePairingQrPayload,
  enrollDevicePasskey,
  generateTotpSecret,
  getTotpEnrollment,
  isWebAuthnAvailable,
  listPasskeys,
  listRememberedAccounts,
  parsePairingQrPayload,
  removePasskey,
  removeTotpEnrollment,
  saveTotpEnrollment,
  verifyDevicePasskey,
  verifyTotpCode,
  type RememberedProfile,
} from '../domains/identity/webAuthnTotp'
import type { ConnectedDeviceRecord } from '../domains/devices/index.ts'
import { OWNER_EMAIL, useOptionalStore } from '../lib/store'
import type { Role } from '../lib/types'

export type QrModalInitialTab = 'qr' | 'authenticator' | 'recovery'

interface QrHealthPassModalProps {
  readonly open: boolean
  readonly initialTab?: QrModalInitialTab
  readonly onClose: () => void
  /** Provided when invoked from Login screen (unauthenticated mode). */
  readonly onAuthenticate?: (profile: { email: string; name: string; role: Role; patientId?: string }) => void
}

function QrSvgBox({ payload, label }: { readonly payload: string; readonly label: string }) {
  const matrix = useMemo(() => encodeQrMatrix21(payload), [payload])
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 23 23"
      style={{ width: 156, height: 156, borderRadius: 12, background: '#ffffff', padding: 8, border: '1px solid rgba(15,23,42,0.12)' }}
    >
      <rect x="0" y="0" width="23" height="23" fill="#ffffff" rx="1" />
      {matrix.map((row, r) =>
        row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" fill="#064e3b" /> : null)),
      )}
    </svg>
  )
}

function BarcodeSvgBox({ value }: { readonly value: string }) {
  const encoded = useMemo(() => encodeCode128Pattern(value), [value])
  return (
    <svg
      role="img"
      aria-label={`Code 128 barcode ${value}`}
      viewBox={`0 0 ${encoded.totalModules + 12} 44`}
      preserveAspectRatio="none"
      style={{ width: '100%', maxWidth: 320, height: 52, borderRadius: 8, background: '#ffffff', padding: '6px 10px', border: '1px solid rgba(15,23,42,0.12)' }}
    >
      <rect x="0" y="0" width={encoded.totalModules + 12} height="44" fill="#ffffff" />
      {encoded.bars.map((bar, idx) => (
        <rect key={idx} x={bar.x + 6} y={4} width={bar.width} height={36} fill="#04130b" />
      ))}
    </svg>
  )
}

export function QrHealthPassModal({
  open,
  initialTab = 'qr',
  onClose,
  onAuthenticate,
}: QrHealthPassModalProps) {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null

  const [tab, setTab] = useState<QrModalInitialTab>(initialTab)
  const [qrMode, setQrMode] = useState<'universal' | 'emergency' | 'pairing'>('universal')
  const [epochMs, setEpochMs] = useState(() => Date.now())
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  // Authenticator & Passkey states
  const [totpCode, setTotpCode] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [draftSecret, setDraftSecret] = useState<string | null>(null)
  const [draftVerifyCode, setDraftVerifyCode] = useState('')

  // QR / Barcode scan & pairing input
  const [scanInput, setScanInput] = useState('')
  const [camActive, setCamActive] = useState(false)
  const [devices, setDevices] = useState<ConnectedDeviceRecord[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!open || !account || tab !== 'recovery') return
    void import('../domains/devices/index.ts').then((m) =>
      m.discoverConnectedDevices({ ownerEmail: account.email }).then(setDevices),
    )
  }, [open, account, tab, busy])

  useEffect(() => {
    if (!open) return
    setTab(initialTab)
    setStatus('')
  }, [open, initialTab])

  useEffect(() => {
    if (!open || !account) return
    const timer = window.setInterval(() => setEpochMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open, account])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCamActive(false)
  }

  useEffect(() => {
    if (!open) stopCamera()
    return () => stopCamera()
  }, [open])

  const remembered = useMemo<RememberedProfile[]>(
    () =>
      listRememberedAccounts({
        profiles: store?.state.profiles,
        patients: store?.state.patients,
        ownerEmail: OWNER_EMAIL,
      }),
    [store?.state.profiles, store?.state.patients, open],
  )

  useEffect(() => {
    if (!authEmail && remembered.length > 0) setAuthEmail(remembered[0].email)
  }, [remembered, authEmail])

  const emv = useMemo(
    () =>
      account
        ? deriveTokenizedEmvPass({
            accountId: account.id,
            accountName: account.name || patient?.name,
            mrn: patient?.mrn,
            role: account.role,
            allergies: patient?.allergies,
            chronicConditions: patient?.chronicConditions,
            epochMs,
          })
        : null,
    [account, patient, epochMs],
  )

  const pairingPayload = useMemo(
    () => (account ? encodePairingQrPayload(account) : ''),
    [account],
  )

  const boundPasskeys = useMemo(
    () => (account ? listPasskeys(account.email) : listPasskeys()),
    [account, open, busy],
  )

  const activeTotp = useMemo(
    () => (account ? getTotpEnrollment(account.email) : null),
    [account, open, busy],
  )

  if (!open) return null

  const startScanner = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera scanning is unavailable on this browser. Paste a Pairing QR or Code-128 value below.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      setCamActive(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
      })
      const BD = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (src: ImageBitmapSource) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector
      if (BD) {
        const detector = new BD({ formats: ['qr_code', 'code_128', 'ean_13'] })
        const tick = async () => {
          if (!streamRef.current || !videoRef.current) return
          try {
            const hits = await detector.detect(videoRef.current)
            const raw = hits[0]?.rawValue?.trim()
            if (raw) {
              setScanInput(raw)
              stopCamera()
              handleQrLogin(raw)
              return
            }
          } catch {
            /* ignore transient frame decode errors */
          }
          if (streamRef.current) window.setTimeout(() => void tick(), 450)
        }
        window.setTimeout(() => void tick(), 600)
      } else {
        setStatus('Camera opened. Point at a QR code or paste the pairing/pass code below if your browser lacks native BarcodeDetector.')
      }
    } catch {
      setStatus('Camera permission denied or unavailable. You can paste a Pairing QR / Code-128 token below.')
    }
  }

  const handleEnrollPasskey = async () => {
    if (!account) return
    setBusy(true)
    const res = await enrollDevicePasskey(account)
    setBusy(false)
    setStatus(res.ok ? 'Passkey (TouchID / FaceID) bound to this device!' : res.message)
  }

  const handleStartTotp = () => {
    if (!account) return
    setDraftSecret(generateTotpSecret())
    setDraftVerifyCode('')
    setStatus('Scan or copy the key into Google Authenticator / Apple Passwords, then verify one 6-digit code.')
  }

  const handleConfirmTotp = async () => {
    if (!account || !draftSecret) return
    setBusy(true)
    const valid = await verifyTotpCode(draftSecret, draftVerifyCode)
    setBusy(false)
    if (!valid) {
      setStatus('Invalid 6-digit code. Wait for the next 30s rotation and try again.')
      return
    }
    saveTotpEnrollment({
      email: account.email,
      name: account.name,
      role: account.role,
      secret: draftSecret,
      enabledAt: new Date().toISOString(),
    })
    setDraftSecret(null)
    setDraftVerifyCode('')
    setStatus('Authenticator (TOTP 6-digit) enabled for passwordless login!')
  }

  const handlePasskeySignIn = async () => {
    setBusy(true)
    const res = await verifyDevicePasskey(authEmail || undefined)
    setBusy(false)
    if (!res.ok) {
      setStatus(res.message)
      return
    }
    onAuthenticate?.({
      email: res.record.email,
      name: res.record.name,
      role: res.record.role,
    })
    onClose()
  }

  const handleTotpSignIn = async () => {
    const email = authEmail.trim().toLowerCase()
    const enrollment = getTotpEnrollment(email)
    if (!enrollment) {
      setStatus('No Authenticator key found on this browser for that email. Sign in first and bind one under QR/Auth.')
      return
    }
    setBusy(true)
    const ok = await verifyTotpCode(enrollment.secret, totpCode)
    setBusy(false)
    if (!ok) {
      setStatus('6-digit Authenticator code is incorrect or expired.')
      return
    }
    onAuthenticate?.({
      email: enrollment.email,
      name: enrollment.name,
      role: enrollment.role,
    })
    onClose()
  }

  const handleQrLogin = (rawValue?: string) => {
    const raw = (rawValue ?? scanInput).trim()
    if (!raw) {
      setStatus('Scan or paste a Panacea Pairing QR (PANACEA:PAIR:v1:...) or Health Pass barcode.')
      return
    }
    const parsedPairing = parsePairingQrPayload(raw)
    if (parsedPairing) {
      onAuthenticate?.({
        email: parsedPairing.email,
        name: parsedPairing.name,
        role: parsedPairing.role,
        patientId: parsedPairing.patientId,
      })
      onClose()
      return
    }
    // Match an active device Health Pass QR or Code-128 wristband belonging to a remembered account
    for (const candidate of remembered) {
      const derived = deriveTokenizedEmvPass({
        accountId: `local:${encodeURIComponent(candidate.email)}`,
        accountName: candidate.name,
        role: candidate.role,
        mrn: candidate.patientId,
        epochMs: Date.now(),
      })
      if (!derived.ok) continue
      const last4 = derived.tokenizedDevicePanFull.slice(-4)
      if (
        raw === derived.payloads.universal ||
        raw === derived.payloads.emergency ||
        raw.startsWith(`PM-${last4}-`) ||
        raw.includes(`DPAN:${last4}`)
      ) {
        onAuthenticate?.({
          email: candidate.email,
          name: candidate.name,
          role: candidate.role,
          patientId: candidate.patientId,
        })
        onClose()
        return
      }
    }
    setStatus('Unrecognized QR/Barcode token. Generate a Pairing QR while signed in to pair another tab or device.')
  }

  const handleManualRecovery = async () => {
    if (!account) return
    const [{ adoptAllDeviceLocalBuckets }, { discoverConnectedDevices }] = await Promise.all([
      import('../domains/identity/localRecovery'),
      import('../domains/devices/index.ts'),
    ])
    const summary = adoptAllDeviceLocalBuckets(account, {
      patient,
      patientVitals: patient ? store?.state.vitals[patient.id] : undefined,
      sleepLogs: store?.state.sleepLogs,
    })
    void discoverConnectedDevices({ ownerEmail: account.email }).then(setDevices)
    setStatus(
      `Recovered: ${summary.mergedFieldsCount} vitals field(s), ${summary.historyDaysRecovered} history day(s), ${summary.labsRecovered} lab marker(s), ${summary.workoutsRecovered} workout(s), ${summary.devicesDiscovered} connected device(s).`,
    )
  }

  const handleReconnectAllDevices = async () => {
    setBusy(true)
    const [mod, devMod] = await Promise.all([
      import('../domains/devices/adapters/quickConnectSession'),
      import('../domains/devices/index.ts'),
    ])
    await mod.triggerQuickWearableConnect((st) => setStatus(st.message))
    if (account) void devMod.discoverConnectedDevices({ ownerEmail: account.email }).then(setDevices)
    setBusy(false)
  }

  const handleDownloadBackup = async () => {
    const { exportFullLocalVault } = await import('../domains/identity/localRecovery')
    const vault = exportFullLocalVault(account)
    if (!vault) return
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panaceamed-vault-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Exported full local datas, logs, and connected devices backup (.json).')
  }

  const activeQrPayload =
    qrMode === 'pairing'
      ? pairingPayload
      : emv?.ok && qrMode === 'emergency'
      ? emv.payloads.emergency
      : emv?.ok
      ? emv.payloads.universal
      : ''

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PanaceaMed Passkey, Authenticator and QR Health Pass"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(2, 6, 12, 0.72)',
          padding: 16,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/15 dark:bg-neutral-900"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--teks-ok)' }}>
                {account ? 'Identity Pass & Local Vault' : 'Passwordless Instant Access'}
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 800 }}>
                {account ? 'QR Pass, Passkey & Data Vault' : 'Authenticator, Passkey & QR'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl border border-black/10 px-3 py-1.5 text-xs font-bold dark:border-white/15"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 14 }} role="tablist">
            {(account
              ? [
                  { id: 'qr', label: '📱 QR & Barcode' },
                  { id: 'authenticator', label: '🔐 Passkey & 2FA' },
                  { id: 'recovery', label: '♻️ Recover Data' },
                ]
              : [
                  { id: 'authenticator', label: '🔐 Passkey & 6-Digit' },
                  { id: 'qr', label: '📱 Scan QR / Barcode' },
                ]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id as QrModalInitialTab)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800,
                  border: tab === item.id ? '1px solid #00BF63' : '1px solid rgba(148,163,184,0.28)',
                  background: tab === item.id ? 'rgba(0, 191, 99, 0.14)' : 'transparent',
                  color: tab === item.id ? 'var(--teks-ok)' : 'inherit',
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ── AUTHENTICATED MODES ── */}
          {account && tab === 'qr' && emv?.ok && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                {([
                  { id: 'universal', label: 'Identity QR' },
                  { id: 'emergency', label: 'Emergency QR' },
                  { id: 'pairing', label: 'Pairing Login QR' },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setQrMode(m.id)}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      border: qrMode === m.id ? '1px solid #00BF63' : '1px solid rgba(148,163,184,0.25)',
                      background: qrMode === m.id ? '#00BF63' : 'transparent',
                      color: qrMode === m.id ? '#04130b' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <QrSvgBox payload={activeQrPayload} label={`${qrMode} QR Pass`} />
              <div style={{ fontSize: 11, opacity: 0.78, textAlign: 'center' }}>
                {account.name} · Local Token {emv.tokenizedDevicePanMasked} · Rotates in {emv.secondsRemaining}s
              </div>

              <BarcodeSvgBox value={emv.payloads.wristbandCode128} />
              <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.72 }}>{emv.payloads.wristbandCode128}</div>

              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    const txt = qrMode === 'pairing' ? pairingPayload : activeQrPayload
                    void navigator.clipboard?.writeText(txt).then(() => setStatus('QR/Pairing code copied!'))
                  }}
                  style={{ minHeight: 44 }}
                  className="w-full rounded-xl border border-black/10 py-2.5 text-xs font-bold dark:border-white/15"
                >
                  📋 Copy {qrMode === 'pairing' ? 'Pairing Token' : 'Identity QR Payload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ndef = (window as unknown as { NDEFReader?: new () => { write: (msg: { records: { recordType: string; data: string }[] }) => Promise<void> } }).NDEFReader
                    if (!ndef) {
                      setStatus('Web NFC requires Android Chrome + NFC hardware. Use QR or Barcode above on desktop/iOS.')
                      return
                    }
                    const txt = qrMode === 'pairing' ? pairingPayload : activeQrPayload
                    void new ndef().write({ records: [{ recordType: 'text', data: txt }] })
                      .then(() => setStatus('Written to NFC Health Tag! Ready for tap handoff.'))
                      .catch(() => setStatus('NFC tap cancelled or tag unavailable.'))
                  }}
                  style={{ minHeight: 44 }}
                  className="w-full rounded-xl border border-black/10 py-2.5 text-xs font-bold dark:border-white/15"
                >
                  📡 NFC Tap Handoff
                </button>
              </div>
            </div>
          )}

          {account && tab === 'authenticator' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="rounded-2xl border border-black/10 p-3 dark:border-white/15">
                <div style={{ fontSize: 12, fontWeight: 800 }}>Biometric Passkey (TouchID / FaceID / PIN)</div>
                <p style={{ margin: '4px 0 8px', fontSize: 11, opacity: 0.75 }}>
                  {isWebAuthnAvailable()
                    ? 'Bind a hardware Passkey on this Mac/phone for 1-tap sign-in.'
                    : 'WebAuthn requires HTTPS (panaceamed.id) or a supported browser.'}
                </p>
                <button
                  type="button"
                  disabled={busy || !isWebAuthnAvailable()}
                  onClick={() => void handleEnrollPasskey()}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: '#00BF63',
                    color: '#04130b',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {busy ? 'Waiting for TouchID / FaceID…' : '+ Register Passkey on This Device'}
                </button>
                {boundPasskeys.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {boundPasskeys.map((pk) => (
                      <div key={pk.credentialIdB64} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <span>✓ Passkey · {pk.createdAt.slice(0, 10)}</span>
                        <button type="button" onClick={() => removePasskey(pk.credentialIdB64)} style={{ minHeight: 44, minWidth: 44, color: 'var(--teks-bad)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 p-3 dark:border-white/15">
                <div style={{ fontSize: 12, fontWeight: 800 }}>6-Digit Authenticator App (TOTP)</div>
                {activeTotp ? (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: 'var(--teks-ok)', fontWeight: 700 }}>● Active since {activeTotp.enabledAt.slice(0, 10)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeTotpEnrollment(account.email)
                        setStatus('Authenticator removed from this device.')
                      }}
                      style={{ minHeight: 44, minWidth: 44, color: 'var(--teks-bad)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Disable
                    </button>
                  </div>
                ) : draftSecret ? (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <QrSvgBox payload={buildOtpAuthUri({ email: account.email, secret: draftSecret })} label="Authenticator setup QR" />
                    <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.85 }}>Secret: {draftSecret}</div>
                    <input
                      value={draftVerifyCode}
                      onChange={(e) => setDraftVerifyCode(e.target.value)}
                      inputMode="numeric"
                      placeholder="Enter 6-digit code from Authenticator"
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs dark:border-white/20 dark:bg-neutral-800"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleConfirmTotp()}
                      style={{ width: '100%', minHeight: 44, borderRadius: 12, border: 'none', background: '#00BF63', color: '#04130b', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Verify &amp; Activate Authenticator
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartTotp}
                    style={{ minHeight: 44 }}
                    className="mt-2 w-full rounded-xl border border-black/15 py-2 text-xs font-bold dark:border-white/20"
                  >
                    Configure Google / Apple Authenticator
                  </button>
                )}
              </div>
            </div>
          )}

          {account && tab === 'recovery' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="rounded-2xl border border-black/10 p-3 dark:border-white/15">
                <div style={{ fontSize: 12, fontWeight: 800 }}>Connected &amp; Synced Devices ({devices.length})</div>
                {devices.length > 0 ? (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {devices.slice(0, 5).map((d) => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ fontWeight: 700 }}>{d.name}</span>
                        <span style={{ opacity: 0.72 }}>
                          {d.batteryPercent != null ? `${d.batteryPercent}% · ` : ''}{d.transport}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>No paired wearable detected on this browser yet.</p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleReconnectAllDevices()}
                  style={{ marginTop: 8, width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #00BF63', background: 'rgba(0,191,99,0.12)', color: 'var(--teks-ok)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  ⚡ Auto-Connect / Reconnect Paired BLE Wearable
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleManualRecovery()}
                style={{ width: '100%', minHeight: 44, borderRadius: 12, border: 'none', background: '#00BF63', color: '#04130b', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                ♻️ Recover All Datas, Logs &amp; Devices
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void handleDownloadBackup()}
                  style={{ minHeight: 44 }}
                  className="w-full rounded-xl border border-black/15 py-2 text-xs font-bold dark:border-white/20"
                >
                  💾 Export Vault JSON
                </button>
                <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="w-full cursor-pointer rounded-xl border border-black/15 py-2 text-center text-xs font-bold dark:border-white/20">
                  📥 Restore JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void Promise.all([
                        file.text(),
                        import('../domains/identity/localRecovery'),
                      ]).then(([txt, mod]) => {
                        const res = mod.restoreFullLocalVault(txt, account)
                        setStatus(res.message)
                      })
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── UNAUTHENTICATED LOGIN MODES ── */}
          {!account && tab === 'authenticator' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="rounded-2xl border border-black/10 p-3 dark:border-white/15">
                <div style={{ fontSize: 12, fontWeight: 800 }}>1-Tap Passkey (TouchID / FaceID)</div>
                <p style={{ margin: '4px 0 8px', fontSize: 11, opacity: 0.75 }}>
                  {boundPasskeys.length > 0
                    ? `${boundPasskeys.length} Passkey credential(s) found on this device.`
                    : 'No local Passkey registered yet. Sign in with email/Google first to bind TouchID.'}
                </p>
                <button
                  type="button"
                  disabled={busy || !isWebAuthnAvailable() || boundPasskeys.length === 0}
                  onClick={() => void handlePasskeySignIn()}
                  style={{
                    width: '100%',
                    minHeight: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: boundPasskeys.length > 0 ? '#00BF63' : 'rgba(148,163,184,0.25)',
                    color: boundPasskeys.length > 0 ? '#04130b' : 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: boundPasskeys.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  {busy ? 'Verifying Biometrics…' : '🔐 Unlock with TouchID / FaceID Passkey'}
                </button>
              </div>

              <div className="rounded-2xl border border-black/10 p-3 dark:border-white/15" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>6-Digit Authenticator Code (TOTP)</div>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="Account email"
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs dark:border-white/20 dark:bg-neutral-800"
                />
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  inputMode="numeric"
                  placeholder="6-digit Authenticator code"
                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-xs dark:border-white/20 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleTotpSignIn()}
                  style={{ width: '100%', minHeight: 44, borderRadius: 12, border: 'none', background: '#00BF63', color: '#04130b', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Verify 6-Digit Code &amp; Sign In
                </button>
              </div>
            </div>
          )}

          {!account && tab === 'qr' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => (camActive ? stopCamera() : void startScanner())}
                  style={{ flex: 1, minHeight: 44, borderRadius: 12, border: 'none', background: '#00BF63', color: '#04130b', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  {camActive ? '⏹ Stop Camera' : '📷 Open QR / Barcode Camera'}
                </button>
              </div>

              {camActive && (
                <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 200, objectFit: 'cover' }} />
              )}

              <textarea
                rows={3}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Paste Panacea Pairing QR (PANACEA:PAIR:v1:...) or Health Pass Barcode (PM-...)"
                className="w-full rounded-xl border border-black/15 p-2.5 text-xs dark:border-white/20 dark:bg-neutral-800"
              />
              <button
                type="button"
                onClick={() => handleQrLogin()}
                style={{ minHeight: 44 }}
                className="w-full rounded-xl border border-black/15 py-2.5 text-xs font-bold dark:border-white/20"
              >
                Pair &amp; Sign In with QR / Barcode →
              </button>
            </div>
          )}

          {status && (
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: status.includes('Invalid') || status.includes('incorrect') || status.includes('Unrecognized') || status.includes('No ') ? 'var(--teks-bad)' : 'var(--teks-ok)' }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
