import { useMemo, useState } from 'react'
import {
  createCodeMaxDoctorSdk,
  type CodeMaxClinicTier,
  type CodeMaxConnectivityMode,
  type CodeMaxEncounterResponse,
} from '../../sdk/codemax'
import type { EMRRecord, VitalSign } from '../../lib/types'
import type { CareSetting, ExecutionMode } from '../../domains/clinical-operations/engine/clinicalToClaimShieldEngine'

export interface CodeMaxDoctorSdkConsoleProps {
  readonly record: EMRRecord
  readonly vitals: readonly VitalSign[]
  readonly clinicianId: string
  readonly clinicianName: string
  readonly strVerified: boolean
  readonly backendEnabled: boolean
}

const CLINIC_TIERS: readonly CodeMaxClinicTier[] = [
  'TERTIARY_HOSPITAL',
  'PUSKESMAS_PRIMARY',
  'RURAL_2G_STARLINK',
  'OFFLINE_VAULT',
]

const CONNECTIVITY_MODES: readonly CodeMaxConnectivityMode[] = [
  'ONLINE_LOW_LATENCY',
  'DEGRADED_2G',
  'OFFLINE',
]

const CARE_SETTINGS: readonly CareSetting[] = [
  'RAWAT_JALAN',
  'IGD',
  'IGD_PONEK',
  'RAWAT_INAP',
  'ICU_NICU_PICU_HCU',
]

const EXEC_MODES: readonly ExecutionMode[] = [
  'UPSTREAM_ENCOUNTER',
  'REALTIME_SHIELD',
  'DISCHARGE_AUDIT',
  'BPJS_CONFIRMATION_COPILOT',
]

export default function CodeMaxDoctorSdkConsole({
  record,
  vitals,
  clinicianId,
  clinicianName,
  strVerified,
  backendEnabled,
}: CodeMaxDoctorSdkConsoleProps) {
  const [clinicTier, setClinicTier] = useState<CodeMaxClinicTier>('TERTIARY_HOSPITAL')
  const [connectivity, setConnectivity] = useState<CodeMaxConnectivityMode>(
    backendEnabled ? 'ONLINE_LOW_LATENCY' : 'OFFLINE',
  )
  const [careSetting, setCareSetting] = useState<CareSetting>('RAWAT_JALAN')
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('REALTIME_SHIELD')
  const [ambientTempC, setAmbientTempC] = useState<number>(32)
  const [relativeHumidityPct, setRelativeHumidityPct] = useState<number>(74)
  const [pm25UgM3, setPm25UgM3] = useState<number>(48)
  const [altitudeM, setAltitudeM] = useState<number>(120)
  const [uvIndex, setUvIndex] = useState<number>(7)
  const [ventilatorHours, setVentilatorHours] = useState<number>(0)
  const [showSnippet, setShowSnippet] = useState<boolean>(false)
  const [busy, setBusy] = useState<boolean>(false)
  const [response, setResponse] = useState<CodeMaxEncounterResponse | null>(null)

  const latestVital = vitals[vitals.length - 1]

  const environmentProfile = useMemo(
    () => ({
      clinicTier,
      connectivity,
      ambientExposure: {
        ambientTempC,
        relativeHumidityPct,
        pm25UgM3,
        uvIndex,
        altitudeM,
      },
      primaryModel: 'panacea/codemax-clinical-v1',
      fallbackStrategy: 'DETERMINISTIC_CLINICAL_KERNEL' as const,
      satusehatEnabled: backendEnabled,
      zeroPhiTelemetry: true as const,
    }),
    [clinicTier, connectivity, ambientTempC, relativeHumidityPct, pm25UgM3, uvIndex, altitudeM, backendEnabled],
  )

  const sdk = useMemo(
    () =>
      createCodeMaxDoctorSdk({
        environment: environmentProfile,
        transport:
          backendEnabled && connectivity !== 'OFFLINE'
            ? async (req) => {
                const res = await fetch('/api/ai/codemax/doctor-emr', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    encounterId: req.encounterId,
                    careSetting: req.careSetting,
                    rawClinicalNote: req.rawClinicalNote,
                    ambientExposure: req.environment.ambientExposure,
                    vitals: req.vitals,
                  }),
                })
                if (!res.ok) throw new Error(`codemax_http_${res.status}`)
                const data = (await res.json()) as {
                  result?: { modelRouteUsed?: string; remoteSynthesisHint?: string }
                }
                return {
                  modelSlug: data.result?.modelRouteUsed ?? 'panacea/codemax-clinical-v1',
                  clinicalSynthesisHint: data.result?.remoteSynthesisHint,
                }
              }
            : undefined,
      }),
    [environmentProfile, backendEnabled, connectivity],
  )

  const health = sdk.inspectEnvironmentHealth()

  const runPipeline = async () => {
    setBusy(true)
    try {
      const noteParts = [
        record.anamnesis.keluhanUtama,
        record.anamnesis.rps,
        record.anamnesis.rpd,
        record.problems.map((p) => `${p.title}: ${p.assessment}`).join('; '),
      ].filter((s) => Boolean(s && s.trim()))

      const result = await sdk.runEncounterPipeline({
        encounterId: record.id,
        patientRefId: record.patientId,
        careSetting,
        executionMode,
        rawClinicalNote:
          noteParts.join('. ') ||
          'Evaluasi klinis rawat jalan rutin dengan pemantauan tanda vital dan faktor lingkungan.',
        vitals: latestVital
          ? {
              heartRateBpm: latestVital.heartRate,
              systolicMmHg: latestVital.systolic,
              diastolicMmHg: latestVital.diastolic,
              spo2Pct: latestVital.spo2,
              respRatePerMin: latestVital.respRate,
              tempC: latestVital.tempC,
              provenance: 'OBSERVED_CLINICAL',
            }
          : undefined,
        ventilatorHours: ventilatorHours > 0 ? ventilatorHours : null,
        environment: environmentProfile,
        doctor: {
          clinicianId: clinicianId || 'doc_active',
          displayName: clinicianName || 'Dokter Pemeriksa',
          role: 'DOCTOR',
          strVerified,
        },
        nowIso: new Date().toISOString(),
      })
      setResponse(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      data-codemax-doctor-sdk-console
      aria-label="CodeMax Doctor AI-EMR SDK Console"
      className="dark space-y-3 rounded-2xl border border-cyan-400/25 bg-[#040a16] p-4 text-white"
    >
      {/* Header & Health Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <strong className="font-mono text-xs font-black tracking-wide text-cyan-100">
            CODEMAX DOCTOR AI-EMR SDK
          </strong>
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-cyan-200">
            {health.sdkVersion}
          </span>
          <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-200">
            {health.circuitState} · ZERO-PHI AUDIT
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSnippet((v) => !v)}
            className="min-h-[36px] rounded-xl border border-white/15 bg-white/5 px-2.5 font-mono text-[10px] font-bold text-slate-200 hover:border-cyan-400/50"
          >
            {showSnippet ? 'Hide SDK' : 'SDK Code'}
          </button>
          <button
            type="button"
            onClick={runPipeline}
            disabled={busy}
            data-codemax-run-btn
            className="min-h-[36px] rounded-xl border border-emerald-400/50 bg-emerald-500/25 px-3 font-mono text-[10px] font-black text-emerald-100 hover:bg-emerald-500/35 disabled:opacity-50"
          >
            {busy ? 'Running…' : 'Run 6-Stage Pipeline ▶'}
          </button>
        </div>
      </div>

      {/* Environment Ecosystem Selectors */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 font-mono text-[10px]">
        <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <span className="text-slate-400">CLINIC TIER</span>
          <select
            value={clinicTier}
            onChange={(e) => setClinicTier(e.target.value as CodeMaxClinicTier)}
            className="rounded bg-slate-900 px-1.5 py-1 text-white outline-none"
          >
            {CLINIC_TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <span className="text-slate-400">CONNECTIVITY</span>
          <select
            value={connectivity}
            onChange={(e) => setConnectivity(e.target.value as CodeMaxConnectivityMode)}
            className="rounded bg-slate-900 px-1.5 py-1 text-white outline-none"
          >
            {CONNECTIVITY_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <span className="text-slate-400">CARE SETTING</span>
          <select
            value={careSetting}
            onChange={(e) => setCareSetting(e.target.value as CareSetting)}
            className="rounded bg-slate-900 px-1.5 py-1 text-white outline-none"
          >
            {CARE_SETTINGS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <span className="text-slate-400">EXECUTION MODE</span>
          <select
            value={executionMode}
            onChange={(e) => setExecutionMode(e.target.value as ExecutionMode)}
            className="rounded bg-slate-900 px-1.5 py-1 text-white outline-none"
          >
            {EXEC_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Ambient Exposure Sliders */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-6 font-mono text-[10px]">
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-amber-200">
          <span>Temp {ambientTempC}°C</span>
          <input type="range" min={10} max={45} value={ambientTempC} onChange={(e) => setAmbientTempC(Number(e.target.value))} className="accent-amber-400" />
        </label>
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-cyan-200">
          <span>RH {relativeHumidityPct}%</span>
          <input type="range" min={20} max={98} value={relativeHumidityPct} onChange={(e) => setRelativeHumidityPct(Number(e.target.value))} className="accent-cyan-400" />
        </label>
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-rose-200">
          <span>PM2.5 {pm25UgM3}</span>
          <input type="range" min={2} max={250} value={pm25UgM3} onChange={(e) => setPm25UgM3(Number(e.target.value))} className="accent-rose-400" />
        </label>
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-violet-200">
          <span>Alt {altitudeM}m</span>
          <input type="range" min={0} max={4500} step={100} value={altitudeM} onChange={(e) => setAltitudeM(Number(e.target.value))} className="accent-violet-400" />
        </label>
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-yellow-200">
          <span>UV {uvIndex}</span>
          <input type="range" min={0} max={13} value={uvIndex} onChange={(e) => setUvIndex(Number(e.target.value))} className="accent-yellow-400" />
        </label>
        <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 text-emerald-200">
          <span>Vent {ventilatorHours}h</span>
          <input type="range" min={0} max={144} step={4} value={ventilatorHours} onChange={(e) => setVentilatorHours(Number(e.target.value))} className="accent-emerald-400" />
        </label>
      </div>

      {showSnippet && (
        <pre className="overflow-x-auto rounded-xl border border-cyan-400/20 bg-black/80 p-3 font-mono text-[10px] text-cyan-200">
          {sdk.exportSdkSnippet()}
        </pre>
      )}

      {/* Pipeline Output */}
      {response && (
        <div className="space-y-2.5 border-t border-white/10 pt-2.5">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
            <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2">
              <div className="text-slate-400">MODEL ROUTE</div>
              <div className="truncate font-black text-cyan-200">{response.modelRouteUsed}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2">
              <div className="text-slate-400">STR SIGN-OFF</div>
              <div className="font-black text-emerald-200">{response.safetyGates.signOffStatus}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2">
              <div className="text-slate-400">CLAIM SHIELD</div>
              <div className="font-black text-amber-200">
                {response.clinicalToClaim.pending_prevention_shield.risk_level} · {response.clinicalToClaim.clinical_coding?.principal_diagnosis.icd10 ?? 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2">
              <div className="text-slate-400">FHIR R4 BUNDLE</div>
              <div className="truncate font-black text-violet-200">
                {response.fhirR4Preview.resourceCount} res · {response.fhirR4Preview.sha256DigestHex.slice(0, 10)}
              </div>
            </div>
          </div>

          {/* 6-Stage Trace Pills */}
          <div className="flex flex-wrap gap-1 font-mono text-[9.5px]">
            {response.stageTraces.map((st) => (
              <span
                key={st.stageId}
                className={`rounded-full border px-2 py-0.5 ${
                  st.status === 'OK'
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                    : st.status === 'BLOCKED_SAFETY'
                      ? 'border-rose-400/45 bg-rose-500/15 text-rose-200'
                      : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                }`}
              >
                {st.stageId}: {st.status}
              </span>
            ))}
          </div>

          {/* Environment Modifiers & Red Flags */}
          {(response.environmentalModifiers.length > 0 || response.safetyGates.redFlags.length > 0) && (
            <div className="grid gap-1.5 sm:grid-cols-2 text-[11px]">
              {response.environmentalModifiers.map((m) => (
                <div key={m.code} className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-amber-100">
                  <strong className="font-mono text-[10px]">{m.code}</strong> — {m.detail}
                </div>
              ))}
              {response.safetyGates.redFlags.map((rf) => (
                <div key={rf.code} className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-2.5 py-1.5 text-rose-100">
                  <strong className="font-mono text-[10px]">{rf.code}</strong> ({rf.metric}: {rf.observedValue})
                </div>
              ))}
            </div>
          )}

          {response.remoteSynthesisHint && (
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-100">
              {response.remoteSynthesisHint}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
