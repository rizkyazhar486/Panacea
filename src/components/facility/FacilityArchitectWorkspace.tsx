import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { API_BASE, backendEnabled } from '../../lib/api'
import {
  FACILITY_SCHEMATIC_DISCLAIMER,
  FACILITY_TYPES,
  addFacilityElement,
  addFloor,
  assignPatientToBed,
  assignPjNurse,
  atomicSwapBeds,
  computeFacilityAnalytics,
  createDefaultIgdAdventTemplate,
  createIsolatedSimulationClone,
  deleteFacilityElement,
  duplicateFacilityElement,
  exportFloorPlanJson,
  importFloorPlanJson,
  moveFacilityElement,
  publishFloorPlanVersion,
  redoFloorPlan,
  resizeFacilityElement,
  rotateFacilityElement,
  setBedStatus,
  toggleLockElement,
  undoFloorPlan,
  type BedStatus,
  type FacilityElement,
  type FacilityLayoutState,
  type FacilityType,
  type TriageZone,
  type VisualizationMode,
} from '../../domains/facility-architect'

const BED_STATUSES: readonly BedStatus[] = [
  'Available',
  'Reserved',
  'Occupied',
  'Awaiting cleaning',
  'Cleaning',
  'Isolation',
  'Maintenance',
  'Out of service',
  'Awaiting transfer',
  'Pending discharge',
]

const ZONE_RING: Record<TriageZone, string> = {
  merah: 'border-rose-500/70 bg-rose-950/35',
  kuning: 'border-amber-400/70 bg-amber-950/30',
  hijau: 'border-emerald-400/70 bg-emerald-950/30',
  poned: 'border-fuchsia-400/70 bg-fuchsia-950/30',
  resus: 'border-red-500 bg-red-950/45',
  support: 'border-slate-500/50 bg-slate-900',
  unseen_placeholder: 'border-dashed border-cyan-400/60 bg-slate-900',
}

type PatientDrawerTab = 'overview' | 'ai-emr' | 'vitals' | 'meds' | 'lab' | 'referral'

const STORAGE_KEY = 'panacea.facility_architect.v1'

function loadSavedLayout(): FacilityLayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FacilityLayoutState
      if (Array.isArray(parsed?.floors) && parsed.floors.length > 0) return parsed
    }
  } catch {
    /* fallback to default template */
  }
  return createDefaultIgdAdventTemplate(new Date().toISOString())
}

export default function FacilityArchitectWorkspace() {
  const { state, activePatient } = useStore()
  const [canonical, setCanonical] = useState<FacilityLayoutState>(loadSavedLayout)
  const [simState, setSimState] = useState<FacilityLayoutState | null>(null)
  const [mode, setMode] = useState<VisualizationMode>('operations')
  const [selectedId, setSelectedId] = useState<string>('bed-1')
  const [drawerTab, setDrawerTab] = useState<PatientDrawerTab>('overview')
  const [swapTargetId, setSwapTargetId] = useState<string>('bed-2')
  const [pjInput, setPjInput] = useState('')
  const [newFloorName, setNewFloorName] = useState('')
  const [jsonBox, setJsonBox] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const activeState = mode === 'simulation' ? (simState ?? canonical) : canonical
  const activeFloor = activeState.floors.find((f) => f.floorId === activeState.activeFloorId) ?? activeState.floors[0]
  const selectedEl: FacilityElement | undefined = activeFloor?.elements.find((e) => e.id === selectedId)
  const analytics = useMemo(() => computeFacilityAnalytics(activeState, 24, [4.2, 5.8]), [activeState])
  const allBeds = useMemo(() => activeFloor.elements.filter((e) => e.kind === 'bed' || e.zone === 'resus' || e.kind === 'placeholder'), [activeFloor])

  function applyLayoutUpdate(updater: (prev: FacilityLayoutState) => FacilityLayoutState) {
    if (mode === 'simulation') {
      setSimState((prev) => updater(prev ?? createIsolatedSimulationClone(canonical)))
      return
    }
    setCanonical((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
  }

  function switchMode(next: VisualizationMode) {
    if (next === 'simulation' && !simState) {
      setSimState(createIsolatedSimulationClone(canonical))
    }
    setMode(next)
    setStatusMsg('')
  }

  async function syncToServer() {
    if (!backendEnabled) {
      setStatusMsg('Tersimpan di browser lokal (backend URL tidak aktif).')
      return
    }
    try {
      const token = localStorage.getItem('pmd-token')
      const res = await fetch(`${API_BASE}/api/facility/layouts/${encodeURIComponent(canonical.facilityId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          facilityName: canonical.facilityName,
          facilityType: canonical.facilityType,
          floors: canonical.floors,
        }),
      })
      setStatusMsg(res.ok ? 'Denah tersinkron ke server (RBAC terverifikasi).' : `Gagal sinkron (${res.status}).`)
    } catch {
      setStatusMsg('Tidak dapat menghubungi server saat ini.')
    }
  }

  const record = activePatient ? state.records[activePatient.id] : undefined
  const vitals = activePatient ? (state.vitals[activePatient.id] ?? []) : []
  const supportive = activePatient ? (state.supportive[activePatient.id] ?? []) : []

  return (
    <section
      aria-label="Facility Architect OS Workspace"
      className="dark space-y-4 rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white shadow-xl sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 font-mono text-[11px] font-bold text-sky-300">
              SETIAP BED PUNYA PJ PERAWAT
            </span>
            <span className="font-mono text-[11px] text-white/60">v{activeState.versions[activeState.versions.length - 1]?.version ?? 1}</span>
          </div>
          <h2 className="mt-2 text-lg font-extrabold text-white">{activeState.facilityName} · Denah Editable &amp; Bed Intelligence</h2>
          <p className="text-[11px] text-white/65">{FACILITY_SCHEMATIC_DISCLAIMER}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {([
            ['design', 'Design'],
            ['operations', 'Operations'],
            ['clinical', 'Clinical'],
            ['simulation', 'Simulation'],
            ['analytics', 'Analytics'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => switchMode(id)}
              className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
                mode === id ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-white/75'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'simulation' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200">
          <span>SIMULATION MODE — TERISOLASI DARI REKAM PASIEN &amp; BED NYATA</span>
          <button
            type="button"
            onClick={() => setSimState(createIsolatedSimulationClone(canonical))}
            className="min-h-11 rounded-lg border border-amber-300/40 bg-slate-900 px-3 text-xs text-amber-100"
          >
            Reset Simulasi dari Nyata
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs">
        <select
          aria-label="Pilih Tipe Fasilitas"
          value={activeState.facilityType}
          onChange={(e) => applyLayoutUpdate((s) => ({ ...s, facilityType: e.target.value as FacilityType }))}
          className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-2.5 text-xs text-white"
        >
          {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          aria-label="Pilih Lantai"
          value={activeState.activeFloorId}
          onChange={(e) => applyLayoutUpdate((s) => ({ ...s, activeFloorId: e.target.value }))}
          className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-2.5 text-xs text-white"
        >
          {activeState.floors.map((f) => <option key={f.floorId} value={f.floorId}>{f.floorName}</option>)}
        </select>
        {mode === 'design' && (
          <>
            <button type="button" onClick={() => applyLayoutUpdate((s) => addFacilityElement(s, { kind: 'bed', label: `Bed Baru ${activeFloor.elements.length + 1}`, zone: 'kuning', x: 560, y: 290, w: 100, h: 60, rotationDeg: 0, locked: false, bedStatus: 'Available' }, new Date().toISOString()))} className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white">+ Bed</button>
            <button type="button" onClick={() => applyLayoutUpdate((s) => undoFloorPlan(s, new Date().toISOString()))} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">Undo</button>
            <button type="button" onClick={() => applyLayoutUpdate((s) => redoFloorPlan(s, new Date().toISOString()))} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">Redo</button>
            <input value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)} placeholder="Nama lantai baru..." className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-2.5 text-xs text-white" />
            <button type="button" onClick={() => { if (newFloorName.trim()) { applyLayoutUpdate((s) => addFloor(s, newFloorName, new Date().toISOString())); setNewFloorName('') } }} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">+ Lantai</button>
          </>
        )}
        <button type="button" onClick={() => applyLayoutUpdate((s) => publishFloorPlanVersion(s, 'published', 'Admin/Klinisi', new Date().toISOString()))} className="min-h-11 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 font-bold text-cyan-200">Publish Versi</button>
        <button type="button" onClick={syncToServer} className="min-h-11 rounded-xl bg-sky-600 px-3 font-bold text-white">Simpan ke Server</button>
        <button type="button" onClick={() => setJsonBox(exportFloorPlanJson(activeState))} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">Export JSON</button>
      </div>
      {statusMsg && <div className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs text-sky-200">{statusMsg}</div>}

      {mode === 'analytics' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 font-mono text-xs">
            <div className="text-white/60">BOR ({analytics.windowHours}h)</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">{analytics.borPct ?? 'N/A'}%</div>
            <div className="mt-1 text-[11px] text-white/65">{analytics.occupiedBeds}/{analytics.operationalBeds} operasional ({analytics.excludedBeds} maintenance excluded)</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 font-mono text-xs">
            <div className="text-white/60">Utilisasi R. Tindakan / OK</div>
            <div className="mt-1 text-2xl font-black text-cyan-300">{analytics.orUtilizationPct ?? 'N/A'}%</div>
            <div className="mt-1 text-[11px] text-white/65">{analytics.orRoomsOccupied}/{analytics.orRoomsTotal} ruang aktif</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 font-mono text-xs">
            <div className="text-white/60">ALOS (Sample selesai n={analytics.completedStaysCount})</div>
            <div className="mt-1 text-2xl font-black text-amber-300">{analytics.alosHours ?? 'N/A'} jam</div>
          </div>
        </div>
      )}

      {/* Interactive Floor Plan Canvas (scrollable container preserves 0px page overflow on mobile) */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-3">
        <div className="relative h-[400px] min-w-[680px] rounded-xl border border-white/10 bg-slate-900/60">
          {activeFloor.elements.map((el) => {
            const active = el.id === selectedId
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedId(el.id)}
                style={{ left: `${el.x}px`, top: `${el.y}px`, width: `${el.w}px`, height: `${el.h}px`, transform: `rotate(${el.rotationDeg}deg)` }}
                className={`absolute flex flex-col items-start justify-between rounded-xl border p-1.5 text-left text-[11px] transition ${ZONE_RING[el.zone]} ${active ? 'ring-2 ring-cyan-400' : ''}`}
              >
                <span className="line-clamp-2 font-bold text-white">{el.label}</span>
                {el.bedStatus && (
                  <span className="rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200">
                    {el.bedStatus}{el.patientLabel ? ` · ${el.patientLabel}` : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Element Design + Contextual Bed & Patient SIMRS / AI-EMR Drawer */}
      {selectedEl && (
        <div className="grid gap-4 rounded-2xl border border-white/15 bg-slate-900 p-4 lg:grid-cols-2">
          <div className="space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-white">{selectedEl.label}</h3>
              <span className="font-mono text-[11px] text-cyan-300">{selectedEl.bedStatus ?? selectedEl.kind}</span>
            </div>
            {mode === 'design' && (
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => applyLayoutUpdate((s) => moveFacilityElement(s, selectedEl.id, selectedEl.x + 20, selectedEl.y, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-800 px-3 font-bold text-white">Geser +X</button>
                <button type="button" onClick={() => applyLayoutUpdate((s) => resizeFacilityElement(s, selectedEl.id, selectedEl.w + 20, selectedEl.h, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-800 px-3 font-bold text-white">Lebar +20</button>
                <button type="button" onClick={() => applyLayoutUpdate((s) => rotateFacilityElement(s, selectedEl.id, 90, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-800 px-3 font-bold text-white">Putar 90°</button>
                <button type="button" onClick={() => applyLayoutUpdate((s) => toggleLockElement(s, selectedEl.id, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-800 px-3 font-bold text-white">{selectedEl.locked ? 'Unlock' : 'Lock'}</button>
                <button type="button" onClick={() => applyLayoutUpdate((s) => duplicateFacilityElement(s, selectedEl.id, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-800 px-3 font-bold text-white">Duplikat</button>
                <button type="button" onClick={() => applyLayoutUpdate((s) => deleteFacilityElement(s, selectedEl.id, new Date().toISOString()))} className="min-h-11 rounded-lg bg-rose-700 px-3 font-bold text-white">Hapus</button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input value={pjInput} onChange={(e) => setPjInput(e.target.value)} placeholder={selectedEl.pjNurse ?? 'Nama PJ Perawat...'} className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white" />
              <button type="button" onClick={() => applyLayoutUpdate((s) => assignPjNurse(s, selectedEl.id, pjInput, new Date().toISOString()))} className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white">Set PJ Perawat</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Status Bed" value={selectedEl.bedStatus ?? 'Available'} onChange={(e) => applyLayoutUpdate((s) => setBedStatus(s, selectedEl.id, e.target.value as BedStatus, new Date().toISOString()))} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white">
                {BED_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              <button
                type="button"
                onClick={() => {
                  const res = assignPatientToBed(activeState, {
                    bedId: selectedEl.id,
                    patientId: activePatient?.id ?? 'syn-p1',
                    patientLabel: activePatient?.name ?? 'Pasien Aktif',
                    pjNurse: pjInput || selectedEl.pjNurse,
                    nowIso: new Date().toISOString(),
                  })
                  if (!res.ok) setStatusMsg(res.reason)
                  else { setStatusMsg(''); applyLayoutUpdate(() => res.state) }
                }}
                className="min-h-11 rounded-xl bg-cyan-600 px-3 font-bold text-white"
              >
                Masuk Pasien Aktif ({activePatient?.name ?? 'SYN'})
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Bed Tujuan Swap" value={swapTargetId} onChange={(e) => setSwapTargetId(e.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white">
                {allBeds.filter((b) => b.id !== selectedEl.id).map((b) => <option key={b.id} value={b.id}>{b.label} ({b.bedStatus})</option>)}
              </select>
              <button
                type="button"
                onClick={() => {
                  const res = atomicSwapBeds(activeState, selectedEl.id, swapTargetId, new Date().toISOString())
                  if (!res.ok) setStatusMsg(res.reason)
                  else { setStatusMsg('Atomic swap berhasil.'); applyLayoutUpdate(() => res.state) }
                }}
                className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white"
              >
                Atomic Swap Bed
              </button>
            </div>
          </div>

          {/* Patient SIMRS / AI-EMR Tabs inside Bed Drawer */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-cyan-300">Tab SIMRS / AI-EMR Pasien di {selectedEl.label}</span>
              <Link to="/emr" className="font-bold text-emerald-300 underline">Buka AI-EMR Penuh →</Link>
            </div>
            <div className="flex flex-wrap gap-1">
              {([['overview', 'Overview'], ['ai-emr', 'AI-EMR/SOAP'], ['vitals', 'Vitals'], ['meds', 'Obat'], ['lab', 'Lab'], ['referral', 'Rujukan']] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setDrawerTab(id)} className={`min-h-11 rounded-lg px-2.5 text-xs font-bold ${drawerTab === id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-white/75'}`}>{label}</button>
              ))}
            </div>
            <div className="rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-200">
              {drawerTab === 'overview' && (
                <div>Bed: {selectedEl.label} | PJ: {selectedEl.pjNurse ?? '-'} | Pasien: {selectedEl.patientLabel ?? activePatient?.name ?? 'Kosong'}</div>
              )}
              {drawerTab === 'ai-emr' && (
                <div>{record ? `Diagnosis Kerja: ${record.primaryDiagnosis?.title ?? record.problems[0]?.title ?? 'Belum ditetapkan'} | Status: ${record.signedBy ? `Signed ${record.signedBy}` : 'Draft AI-EMR'}` : 'Belum ada AI-EMR aktif untuk pasien ini. Klik Buka AI-EMR Penuh.'}</div>
              )}
              {drawerTab === 'vitals' && (
                <div>{vitals.length ? `TD ${vitals[vitals.length - 1].systolic}/${vitals[vitals.length - 1].diastolic}, N ${vitals[vitals.length - 1].heartRate}x/m, SpO2 ${vitals[vitals.length - 1].spo2}%` : 'Belum ada entri TTV.'}</div>
              )}
              {drawerTab === 'meds' && <div>{record?.anamnesis.riwayatPengobatan || record?.plan.map((p) => p.text).join('; ') || 'Belum ada instruksi terapi.'}</div>}
              {drawerTab === 'lab' && <div>{supportive.length ? supportive.map((s) => `${s.name}: ${s.value}`).join(' | ') : 'Belum ada hasil penunjang.'}</div>}
              {drawerTab === 'referral' && <div>Gunakan Checklist Berkas Rujukan Eksternal &amp; SISRUTE di AI-EMR saat transfer antar-faskes.</div>}
            </div>
          </div>
        </div>
      )}

      {jsonBox && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs">
          <textarea rows={4} value={jsonBox} onChange={(e) => setJsonBox(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 p-2 font-mono text-[11px] text-white" />
          <button
            type="button"
            onClick={() => {
              const res = importFloorPlanJson(activeState, jsonBox, new Date().toISOString())
              if (!res.ok) setStatusMsg(res.reason)
              else { applyLayoutUpdate(() => res.state); setJsonBox(''); setStatusMsg('JSON denah berhasil diimpor.') }
            }}
            className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white"
          >
            Terapkan Import JSON
          </button>
        </div>
      )}
    </section>
  )
}
