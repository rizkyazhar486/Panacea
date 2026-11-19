import { useMemo, useRef, useState } from 'react'
import { useOptionalStore } from '../../lib/store'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'
import { listSavedDevices, recordConnectedDevice } from '../../domains/devices'
import { parseHealthFile } from '../../lib/healthImport'
import { mergeVitals } from '../../lib/healthVitals'
import type { AutoExportMode, CanonicalExportBundleInput, ExportFormat } from '../../lib/export/autoExportEngine'
import {
  exportArtifactNow,
  readAutoExportMode,
  runAutoExportOnSync,
  writeAutoExportMode,
} from './autoExportBrowserAdapter'
import { InfoDisclosure } from '../ui/InfoDisclosure'

interface QuickDevice {
  readonly id: string
  readonly name: string
  readonly glyph: string
  readonly kind: 'file' | 'ble'
}

const QUICK_DEVICES: readonly QuickDevice[] = [
  { id: 'whoop', name: 'WHOOP', glyph: 'W', kind: 'file' },
  { id: 'garmin', name: 'Garmin', glyph: 'G', kind: 'file' },
  { id: 'oura', name: 'Oura', glyph: 'O', kind: 'file' },
  { id: 'apple', name: 'Apple Health', glyph: '', kind: 'file' },
  { id: 'amazfit', name: 'Amazfit', glyph: 'Z', kind: 'file' },
  { id: 'ble_gatt', name: 'Bluetooth HR / EEG', glyph: 'ᛒ', kind: 'ble' },
]

const AUTO_EXPORT_OPTIONS: readonly { readonly id: AutoExportMode; readonly label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'local', label: 'Local Download' },
  { id: 'neon', label: 'Neon Cloud' },
  { id: 'both', label: 'Both' },
]

export function DeviceQuickSyncCard() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const patient = store?.activePatient ?? null
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [rev, setRev] = useState(0)
  const [pairedIds, setPairedIds] = useState<string[]>(() =>
    listSavedDevices(account?.email).map((d) => d.id.toLowerCase()),
  )
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('')
  const [bleBusy, setBleBusy] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [autoMode, setAutoMode] = useState<AutoExportMode>(() => readAutoExportMode())

  const vitals = useMemo(() => {
    void rev
    return readUnifiedLocalVitals(account, { patient })
  }, [account, patient, rev])

  const profileKey = account?.email ? account.email.split('@')[0] : 'rizkyazhar486'
  const canonicalName =
    account?.isOwner || profileKey.toLowerCase().includes('rizky')
      ? 'dr. Rizky Muhammad Azrissal'
      : account?.name || 'dr. Rizky Muhammad Azrissal'

  const buildExportInput = (): CanonicalExportBundleInput => {
    const nowIso = new Date().toISOString()
    return {
      exportedAtIso: nowIso,
      owner: {
        profileKey,
        fullName: canonicalName,
        username: `@${profileKey.replace(/[^a-zA-Z0-9_]/g, '') || 'rizkyazhar486'}`,
        mrn: patient?.mrn || 'PMD-000486',
      },
      vitals: {
        heightCm: vitals.heightCm ?? null,
        weightKg: vitals.weightKg ?? null,
        bodyFatPct: vitals.bodyFatPct ?? null,
        restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
        hrvMs: vitals.hrvMs ?? null,
        vo2max: vitals.vo2max ?? null,
        sleepHours: vitals.sleepH ?? null,
        steps: vitals.steps ?? null,
        spo2Pct: vitals.spo2Pct ?? null,
      },
      longitudinalRows: [
        {
          date: nowIso.slice(0, 10),
          source: activeDeviceName || vitals.source || 'PanaceaMed OS',
          vo2max: vitals.vo2max ?? null,
          restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
          hrvMs: vitals.hrvMs ?? null,
          sleepHours: vitals.sleepH ?? null,
          steps: vitals.steps ?? null,
          spo2Pct: vitals.spo2Pct ?? null,
          weightKg: vitals.weightKg ?? null,
          bodyFatPct: vitals.bodyFatPct ?? null,
          ahiEventsPerHour: null,
        },
      ],
      conditions: patient?.chronicConditions ?? [],
    }
  }

  const isConnected = (d: QuickDevice) =>
    pairedIds.some((id) => id.includes(d.id) || id.includes(d.name.toLowerCase()))

  const markConnected = (d: QuickDevice) => {
    const id = `src:${d.id}`
    recordConnectedDevice({
      id,
      name: d.name,
      transport: d.kind === 'ble' ? 'ble_gatt' : 'health_sync',
      ownerEmail: account?.email,
    })
    setPairedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const onDeviceTap = async (d: QuickDevice) => {
    setActiveDeviceName(d.name)
    if (d.kind === 'ble') {
      setBleBusy(true)
      setStatusMsg('Scanning Bluetooth GATT…')
      try {
        const mod = await import('../../domains/devices/adapters/quickConnectSession')
        await mod.triggerQuickWearableConnect((next) => {
          setStatusMsg(next.message)
          if (next.status === 'connected') {
            markConnected(d)
            setRev((v) => v + 1)
            const autoRes = runAutoExportOnSync(buildExportInput(), true)
            if (autoRes.executed) setStatusMsg(`${next.message} · ${autoRes.message}`)
          }
        })
      } catch {
        setStatusMsg('Bluetooth unavailable · Use file drop below')
      } finally {
        setBleBusy(false)
      }
      return
    }
    markConnected(d)
    fileRef.current?.click()
  }

  const onFileImport = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseHealthFile(text, file.name)
      const count = Object.keys(parsed).filter((k) => k !== 'source').length
      if (!count) {
        setStatusMsg('No supported metrics found in file')
        return
      }
      mergeVitals({ ...parsed, source: activeDeviceName || parsed.source })
      try { window.dispatchEvent(new Event('panacea:health-updated')) } catch { /* ignore */ }
      setRev((v) => v + 1)
      const autoRes = runAutoExportOnSync(buildExportInput(), true)
      setStatusMsg(`Synced ${count} metrics${autoRes.executed ? ` · ${autoRes.message}` : ''}`)
    } catch {
      setStatusMsg('Import failed')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleManualExport = (format: ExportFormat) => {
    const res = exportArtifactNow(format, buildExportInput())
    setStatusMsg(res.status)
  }

  const handleAutoModeChange = (next: AutoExportMode) => {
    setAutoMode(next)
    writeAutoExportMode(next)
    setStatusMsg(`Auto-Export: ${next}`)
  }

  const handoffUrl = `https://panaceamed.id/#/sync?profile=${encodeURIComponent(profileKey)}`

  return (
    <section aria-label="Phone to Wearable Sync and Auto Export" className="dark rounded-3xl border border-white/10 bg-[#05070b] p-4 text-white sm:p-5">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-black tracking-tight text-white">Device Sync</h2>
          <p className="font-mono text-[11px] text-slate-400">Tap device · Import · Auto-Export</p>
        </div>

        <InfoDisclosure title="Sync & Auto-Export Architecture" badge="SHA-256">
          <p>Supports Apple Health XML/JSON, WHOOP/Garmin/Oura CSV/JSON, and Web Bluetooth GATT HR/EEG.</p>
          <p>Exports use synchronous gesture triggers, sanitized filenames, Object URL revocation, and SHA-256 deduplication. Offline Neon sync queues safely in local storage.</p>
        </InfoDisclosure>
      </header>

      {/* 6 Quick-Connect Tiles (1-word status) */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {QUICK_DEVICES.map((d) => {
          const connected = isConnected(d)
          return (
            <button
              key={d.id}
              type="button"
              disabled={d.kind === 'ble' && bleBusy}
              onClick={() => void onDeviceTap(d)}
              className={`flex min-h-[72px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                connected
                  ? 'border-emerald-400/50 bg-emerald-500/10'
                  : 'border-white/10 bg-[#090d14] hover:border-cyan-400/60'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black font-mono text-base font-black text-cyan-300">
                {d.glyph}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black text-white">{d.name}</span>
                <span className={`block font-mono text-[10px] font-bold ${connected ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {connected ? 'Connected' : 'Tap to Pair'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* 1-Tap Sync from Phone Bar */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-4 text-xs font-black text-black hover:bg-emerald-400"
        >
          Sync from Phone (XML / CSV / JSON)
        </button>
        <button
          type="button"
          onClick={() => setQrOpen((v) => !v)}
          className="min-h-[44px] rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
        >
          {qrOpen ? 'Hide Phone QR Handoff' : 'Phone QR Handoff'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".xml,.csv,.json,application/json,text/csv,text/xml"
        className="hidden"
        onChange={(e) => void onFileImport(e.target.files?.[0])}
      />

      {qrOpen && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-black/70 p-3.5">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-cyan-300">Phone Handoff Link</div>
            <div className="mt-1 break-all font-mono text-xs text-white">{handoffUrl}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(handoffUrl).catch(() => {})
              setStatusMsg('Handoff link copied')
            }}
            className="min-h-[44px] rounded-xl border border-white/15 bg-white/[0.06] px-3 font-mono text-[11px] font-bold text-white"
          >
            Copy Link
          </button>
        </div>
      )}

      {/* Hardened Multi-Format Exporter + Auto-Export on Sync Toggle */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#090d14] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
            Auto-Export on Sync
          </span>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Auto-Export on Sync mode">
            {AUTO_EXPORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={autoMode === opt.id}
                onClick={() => handleAutoModeChange(opt.id)}
                className={`min-h-[44px] rounded-lg border px-2.5 font-mono text-[10px] font-bold transition ${
                  autoMode === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : 'border-white/10 bg-black/50 text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { id: 'json', label: 'Export JSON' },
              { id: 'csv', label: 'Export CSV' },
              { id: 'fhir', label: 'FHIR R4' },
              { id: 'neon', label: 'Neon Cloud' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => handleManualExport(btn.id)}
              className="min-h-[44px] rounded-xl border border-white/15 bg-white/[0.05] font-mono text-[11px] font-bold text-white transition hover:border-cyan-400/60"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && (
        <p role="status" className="mt-2.5 font-mono text-[11px] text-emerald-300">
          {statusMsg}
        </p>
      )}
    </section>
  )
}

export default DeviceQuickSyncCard
