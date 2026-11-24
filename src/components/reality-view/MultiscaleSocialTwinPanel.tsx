import { useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  MULTISCALE_ENTITY_REGISTRY,
  computeMichaelisMentenVelocity,
  computeReceptorOccupancy,
  searchMultiscaleEntities,
  simulateFirstOrderPharmacokinetics,
  simulateGeneExpressionOde,
  traceSemanticZoomPath,
} from '../../engines/reality-view/multiscaleRealityGraph'
import {
  createSanitizedBiometricTwinProfile,
  encryptSocialTwinForCloud,
  mintPersonalizedTwinBarcode,
  verifyPersonalizedTwinBarcode,
  type PersonalizedTwinBarcode,
} from '../../engines/reality-view/personifiedSocialTwinVault'

export default function MultiscaleSocialTwinPanel() {
  const [subTab, setSubTab] = useState<'zoom' | 'twin'>('zoom')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('org_mitochondrion')
  const [substrateUm, setSubstrateUm] = useState(12)
  const [ligandNm, setLigandNm] = useState(8)
  const [pkDoseMg, setPkDoseMg] = useState(40)
  const [geneKt, setGeneKt] = useState(12)

  // Persistent Cloud Personified Twin state
  const [handle, setHandle] = useState('dr.rizky')
  const [heightCm, setHeightCm] = useState(174)
  const [weightKg, setWeightKg] = useState(72)
  const [waistCm, setWaistCm] = useState(82)
  const [melanin, setMelanin] = useState(0.45)
  const [barcode, setBarcode] = useState<PersonalizedTwinBarcode | null>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [cloudSeal, setCloudSeal] = useState<string | null>(null)

  const matches = useMemo(() => searchMultiscaleEntities(query).slice(0, 8), [query])
  const selected = useMemo(
    () => MULTISCALE_ENTITY_REGISTRY.find((n) => n.id === selectedId) ?? MULTISCALE_ENTITY_REGISTRY[0],
    [selectedId],
  )
  const zoomPath = useMemo(() => traceSemanticZoomPath('human_twin', selected.id), [selected.id])

  const mm = useMemo(() => computeMichaelisMentenVelocity({ substrateUm, vmaxUmPerMin: 100, kmUm: 10 }), [substrateUm])
  const occ = useMemo(() => computeReceptorOccupancy({ ligandNm, kdNm: 6, hillCoeff: 1.2 }), [ligandNm])
  const pk = useMemo(
    () =>
      simulateFirstOrderPharmacokinetics({
        doseMg: pkDoseMg,
        volumeDistributionL: 45,
        bioavailabilityF: 0.9,
        eliminationRateKPerHr: Math.LN2 / 12,
        durationHr: 24,
        stepHr: 4,
      }),
    [pkDoseMg],
  )
  const ode = useMemo(
    () =>
      simulateGeneExpressionOde({
        transcriptionRateKt: geneKt,
        mrnaDecayGammaM: 0.5,
        translationRateKp: 4,
        proteinDecayGammaP: 0.2,
        durationHr: 24,
        stepHr: 3,
      }),
    [geneKt],
  )

  const twin = useMemo(
    () =>
      createSanitizedBiometricTwinProfile({
        profileId: `twin_${handle.replace(/[^a-zA-Z0-9]/g, '') || 'user'}`,
        personaHandle: handle,
        cohortId: 'YAD_M',
        ageYears: 34,
        biologicalSex: 'male',
        heightCm,
        weightKg,
        waistCm,
        skinToneLUT: { melanin, hemoglobin: 0.35, undertone: 0.5 },
        retainPhotoInEncryptedVault: false,
        consentTimestampISO: '2026-11-24T04:00:00.000Z',
        streakDays: 14,
      }),
    [handle, heightCm, weightKg, waistCm, melanin],
  )

  useEffect(() => {
    let active = true
    setVerified(null)
    setCloudSeal(null)
    void mintPersonalizedTwinBarcode(twin.profile).then((b) => {
      if (active) setBarcode(b)
    })
    return () => {
      active = false
    }
  }, [twin.profile])

  const handleVerifyBarcode = async () => {
    if (!barcode) return
    const ok = await verifyPersonalizedTwinBarcode(barcode.payload)
    setVerified(ok)
  }

  const handleEncryptCloud = async () => {
    const key = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const env = await encryptSocialTwinForCloud(twin.profile, key, new Date().toISOString())
    setCloudSeal(`AES-GCM-256 · ${env.sha256DigestHex.slice(0, 12)}`)
  }

  return (
    <div data-multiscale-social-twin className="dark space-y-3 rounded-2xl border border-cyan-400/25 bg-[#040a16] p-3 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('zoom')}
            aria-pressed={subTab === 'zoom'}
            className={`min-h-[36px] rounded-xl border px-3 font-mono text-[10px] font-black uppercase ${
              subTab === 'zoom' ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            11-Scale Semantic Zoom
          </button>
          <button
            type="button"
            onClick={() => setSubTab('twin')}
            aria-pressed={subTab === 'twin'}
            className={`min-h-[36px] rounded-xl border px-3 font-mono text-[10px] font-black uppercase ${
              subTab === 'twin' ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            Cloud Social Twin · Barcode
          </button>
        </div>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-amber-200">
          MECHANISTIC SIMULATION
        </span>
      </div>

      {subTab === 'zoom' ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gene, drug, cell, organelle (MYH7, SGLT2, CFTR…)"
              aria-label="Search multiscale entities"
              className="min-h-[36px] min-w-[200px] flex-1 rounded-xl border border-white/15 bg-slate-950/90 px-3 text-xs text-white outline-none focus:border-cyan-400/60"
            />
            <div className="flex flex-wrap gap-1">
              {matches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`min-h-[34px] rounded-lg border px-2 font-mono text-[10px] font-bold ${
                    m.id === selected.id ? 'border-cyan-300 bg-cyan-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {m.canonicalIdentifier}
                </button>
              ))}
            </div>
          </div>

          {/* Multiscale Semantic Zoom Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 font-mono text-[10px]">
            {zoomPath.length > 0 ? (
              zoomPath.map((step, idx) => (
                <span key={step.node.id} className="inline-flex items-center gap-1">
                  {idx > 0 && <span className="text-slate-500">→</span>}
                  <button
                    type="button"
                    onClick={() => setSelectedId(step.node.id)}
                    className={`rounded-md border px-1.5 py-0.5 ${
                      step.spatialRegistration === 'SPATIALLY_REGISTERED'
                        ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                        : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-200'
                    }`}
                  >
                    {step.node.scale.slice(0, 6)}: {step.node.canonicalIdentifier}
                  </button>
                </span>
              ))
            ) : (
              <span className="text-cyan-200">
                {selected.scale} · {selected.labelEn} ({selected.canonicalIdentifier})
              </span>
            )}
          </div>

          {/* 4 Live Deterministic Solvers (Section 22) */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-[10px]">
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <span className="text-cyan-200">MM [S]={substrateUm}uM → v={mm.velocityUmPerMin}</span>
              <input type="range" min={1} max={50} value={substrateUm} onChange={(e) => setSubstrateUm(Number(e.target.value))} className="accent-cyan-400" />
            </label>
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <span className="text-emerald-200">Hill [L]={ligandNm}nM → {occ.occupancyPct}%</span>
              <input type="range" min={1} max={40} value={ligandNm} onChange={(e) => setLigandNm(Number(e.target.value))} className="accent-emerald-400" />
            </label>
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <span className="text-amber-200">PK {pkDoseMg}mg · t½={pk.halfLifeHr}h</span>
              <input type="range" min={10} max={160} step={10} value={pkDoseMg} onChange={(e) => setPkDoseMg(Number(e.target.value))} className="accent-amber-400" />
            </label>
            <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <span className="text-violet-200">ODE kt={geneKt} → P*={ode.steadyStateProtein}</span>
              <input type="range" min={2} max={30} value={geneKt} onChange={(e) => setGeneKt(Number(e.target.value))} className="accent-violet-400" />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-2 sm:col-span-7">
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2">
                <span className="text-slate-400">Handle</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="bg-transparent font-bold text-white outline-none"
                />
              </label>
              <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2">
                <span className="text-cyan-200">Height {heightCm} cm</span>
                <input type="range" min={140} max={205} value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="accent-cyan-400" />
              </label>
              <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2">
                <span className="text-emerald-200">Weight {weightKg} kg</span>
                <input type="range" min={40} max={140} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="accent-emerald-400" />
              </label>
              <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2">
                <span className="text-amber-200">Waist {waistCm} cm · Melanin {Math.round(melanin * 100)}%</span>
                <input type="range" min={60} max={130} value={waistCm} onChange={(e) => setWaistCm(Number(e.target.value))} className="accent-amber-400" />
                <input type="range" min={10} max={90} value={Math.round(melanin * 100)} onChange={(e) => setMelanin(Number(e.target.value) / 100)} className="accent-rose-400" />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[9.5px]">
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                Raw Photo Purged: {String(twin.rawPhotoPurged)}
              </span>
              <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
                Heart Scale: {twin.profile.organScaleFactors.heart_myocardium[0]}x
              </span>
              <span className="rounded-full border border-violet-400/35 bg-violet-500/10 px-2 py-0.5 text-violet-200">
                Cloud: {twin.profile.cloudSyncState}
              </span>
            </div>
          </div>

          {/* Cryptographic Personalized Twin Barcode & AES-GCM Cloud Seal */}
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-400/25 bg-slate-950/90 p-2.5 sm:col-span-5">
            <div className="flex items-center justify-between font-mono text-[9.5px] text-cyan-200">
              <span>PERSONALIZED TWIN BARCODE</span>
              <span>PHI-FREE</span>
            </div>
            {barcode && (
              <svg viewBox="0 0 180 42" className="my-2 h-11 w-full rounded bg-white p-1.5" role="img" aria-label="Personalized cryptographic twin barcode">
                {barcode.bars.reduce<{ x: number; nodes: ReactElement[] }>(
                  (acc, w, idx) => {
                    const width = w * 0.9
                    if (idx % 2 === 0) {
                      acc.nodes.push(<rect key={idx} x={acc.x} y={2} width={width} height={38} fill="#020617" />)
                    }
                    acc.x += width + 1.1
                    return acc
                  },
                  { x: 4, nodes: [] },
                ).nodes}
              </svg>
            )}
            <div className="truncate font-mono text-[9px] text-slate-400">{barcode?.payload ?? 'Minting SHA-256…'}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVerifyBarcode}
                className="min-h-[34px] flex-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 font-mono text-[10px] font-black text-emerald-100"
              >
                {verified === true ? 'SHA-256 Valid ✓' : 'Verify ID'}
              </button>
              <button
                type="button"
                onClick={handleEncryptCloud}
                className="min-h-[34px] flex-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 font-mono text-[10px] font-black text-cyan-100"
              >
                {cloudSeal ? 'Sealed 🔒' : 'AES-GCM Cloud'}
              </button>
            </div>
            {cloudSeal && <div className="mt-1 truncate font-mono text-[9px] text-cyan-300">{cloudSeal}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
