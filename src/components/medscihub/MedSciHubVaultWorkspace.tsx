import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildOsceHeatmap,
  extractRxCardsFromText,
  parseOsceFrequencyMatrix,
  parseVaultFolderConfig,
  pickRandomOsceStation,
  resolveAnatomicalBridgeMeshIds,
  syncDriveVaultRecursive,
  type VaultFileRecord,
} from '../../lib/medscihub/driveSync'
import {
  KARDEKS_SIMRS_DICTIONARY,
  importLocalFormularyCsv,
  runUnifiedMedicalSearch,
  searchKardeksDictionary,
  type KardeksEntry,
} from '../../domains/medstudyhub/engine/kardeksFormularyEngine'

type HubSubTab = 'explorer' | 'osce-sim' | 'igd-rx' | 'vault-sync'

const SAMPLE_OSCE_CSV = [
  'year,session,organ_system,case_title,procedure_tag',
  '2018,Feb,Kardiovaskular,Angina Pektoris Stabil / ACS,EKG 12-Lead',
  '2021,Agu,Respirasi,Asma Eksaserbasi Akut,Terapi Nebulisasi',
  '2024,Mei,Gastrointestinal,Apendisitis Akut & Peritonitis,Pemeriksaan McBurney',
  '2025,Nov,Kardiovaskular,Krisis Hipertensi,Funduskopi & Titrasi IV',
  '2026,Feb,Neurologi,Stroke Iskemik Akut,NIHSS & Skrining Trombolisis',
].join('\n')

export default function MedSciHubVaultWorkspace() {
  const [subTab, setSubTab] = useState<HubSubTab>('igd-rx')

  // Explorer & Unified Search
  const [unifiedQuery, setUnifiedQuery] = useState('')
  const [localEntries, setLocalEntries] = useState<KardeksEntry[]>([])
  const [vaultRecords, setVaultRecords] = useState<VaultFileRecord[]>([])

  const unifiedResults = useMemo(
    () => runUnifiedMedicalSearch(unifiedQuery, { customEntries: localEntries, vaultRecords }),
    [unifiedQuery, localEntries, vaultRecords],
  )
  const bridgeMeshes = useMemo(() => resolveAnatomicalBridgeMeshIds(unifiedQuery || 'jantung paru hepar'), [unifiedQuery])

  // OSCE Sim
  const [osceCsv, setOsceCsv] = useState(SAMPLE_OSCE_CSV)
  const [timerSec, setTimerSec] = useState(15 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [pickedIdx, setPickedIdx] = useState(0)
  const osceEntries = useMemo(() => parseOsceFrequencyMatrix(osceCsv), [osceCsv])
  const osceHeatmap = useMemo(() => buildOsceHeatmap(osceEntries), [osceEntries])
  const activeStation = useMemo(() => {
    if (osceEntries.length === 0) return null
    return osceEntries[pickedIdx % osceEntries.length] ?? pickRandomOsceStation(osceEntries, () => 0.5)
  }, [osceEntries, pickedIdx])

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setTimerSec((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  // IGD & Rx (Kardeks <-> SIMRS)
  const [kardeksQ, setKardeksQ] = useState('')
  const [highAlertOnly, setHighAlertOnly] = useState(false)
  const [lasaOnly, setLasaOnly] = useState(false)
  const [csvImportBox, setCsvImportBox] = useState('')
  const [rxInput, setRxInput] = useState('R/ Furosemide 40 mg No. X\nS 1 dd 1 tab pagi')

  const combinedKardeks = useMemo(() => [...KARDEKS_SIMRS_DICTIONARY, ...localEntries], [localEntries])
  const filteredKardeks = useMemo(
    () => searchKardeksDictionary(kardeksQ, combinedKardeks, { highAlertOnly, lasaOnly }),
    [kardeksQ, combinedKardeks, highAlertOnly, lasaOnly],
  )
  const rxCards = useMemo(() => extractRxCardsFromText(rxInput), [rxInput])

  // Vault Sync
  const [folderUrls, setFolderUrls] = useState('')
  const [oauthToken, setOauthToken] = useState('')
  const [syncStats, setSyncStats] = useState<string>('')
  const parsedMounts = useMemo(() => parseVaultFolderConfig(folderUrls), [folderUrls])

  async function runLiveDriveSync() {
    if (!oauthToken.trim() || parsedMounts.length === 0) {
      setSyncStats('Masukkan minimal 1 URL/ID folder Drive + token OAuth drive.readonly milik akun Anda.')
      return
    }
    try {
      const res = await syncDriveVaultRecursive({
        userId: 'user-vault',
        oauthAccessToken: oauthToken.trim(),
        mounts: parsedMounts,
        previousRecords: vaultRecords,
        fetchFn: (url, init) => fetch(url, init),
      })
      setVaultRecords(res.records)
      setSyncStats(
        `Sync selesai: ${res.records.length} berkas unik · ${res.stats.deduplicatedCount} duplikat MD5 digabung · ${res.stats.previewOnlyCount} PDF terproteksi (preview_only).`,
      )
    } catch (e: unknown) {
      setSyncStats(e instanceof Error ? e.message : 'Gagal menghubungi Google Drive API v3.')
    }
  }

  return (
    <section
      aria-label="MedSciHub Dual-Layer & Kardeks Workspace"
      className="dark space-y-4 rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white shadow-xl sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300">
            MEDSCIHUB INVICTUS · public_core + private_vault
          </span>
          <h2 className="mt-2 text-lg font-extrabold text-white">
            Pencarian Terpadu · Kamus Kardeks DPJP ↔ SIMRS ({combinedKardeks.length}) · OSCE &amp; Drive Vault
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {([
            ['igd-rx', 'IGD & Rx (Kardeks)'],
            ['explorer', 'Pencarian Terpadu'],
            ['osce-sim', 'OSCE Sim'],
            ['vault-sync', 'Vault Sync (Drive)'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={subTab === id}
              onClick={() => setSubTab(id)}
              className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
                subTab === id ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-white/75'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'igd-rx' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-400/35 bg-sky-950/35 p-3">
            <div>
              <div className="text-sm font-extrabold text-white">
                Kamus Pencarian Cepat {combinedKardeks.length}+ Nama Obat Kardeks DPJP ↔ Nama di Sistem SIMRS / Transmedic
              </div>
              <p className="mt-1 text-white/75">
                Referensi padanan nama dagang/kardeks → nama generik/SIMRS + bendera High-Alert/LASA. Tidak pernah melakukan peresepan otomatis.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold text-emerald-300">
              REFERENCE ONLY
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={kardeksQ}
              onChange={(e) => setKardeksQ(e.target.value)}
              placeholder="Ketik nama obat di Kardeks (contoh: Lasix, Ketesse, Primperan, Brilinta, Bactesyn, Resfar)..."
              className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white"
            />
            <button type="button" onClick={() => setHighAlertOnly((v) => !v)} className={`min-h-11 rounded-xl border px-3 font-mono text-xs font-bold ${highAlertOnly ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-white/15 bg-slate-900 text-white/75'}`}>HIGH ALERT</button>
            <button type="button" onClick={() => setLasaOnly((v) => !v)} className={`min-h-11 rounded-xl border px-3 font-mono text-xs font-bold ${lasaOnly ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'border-white/15 bg-slate-900 text-white/75'}`}>LASA</button>
          </div>

          <div className="max-h-[340px] overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-slate-900">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 font-mono text-[11px] uppercase text-white/70">
                <tr>
                  <th className="p-2.5">Nama di Kardeks / Advis DPJP</th>
                  <th className="p-2.5">Nama di SIMRS</th>
                  <th className="p-2.5">Kekuatan &amp; Rute</th>
                  <th className="p-2.5">Kategori &amp; Peringatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredKardeks.slice(0, 60).map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.03]">
                    <td className="p-2.5 font-bold text-white">
                      {d.kardeksName}
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {d.highAlert && <span className="rounded bg-rose-500/25 px-1.5 py-0.5 font-mono text-[9px] text-rose-200">HIGH ALERT</span>}
                        {d.lasa && <span className="rounded bg-amber-500/25 px-1.5 py-0.5 font-mono text-[9px] text-amber-200">LASA</span>}
                        <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">{d.channel}</span>
                      </div>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-300">{d.simrsName}</td>
                    <td className="p-2.5 font-mono text-[11px] text-white/80">{d.formulationStrength} ({d.route})</td>
                    <td className="p-2.5 text-[11px] text-white/75">
                      <span className="font-semibold text-white">{d.categoryNote}</span> · {d.safetyNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
              <div className="font-bold text-cyan-300">Ekstraktor Kartu Resep Referensi (R/ + Signa)</div>
              <textarea rows={2} value={rxInput} onChange={(e) => setRxInput(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 p-2 font-mono text-xs text-white" />
              {rxCards.map((c, idx) => (
                <div key={idx} className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-emerald-200">
                  {c.drugLine} ({c.strength}) · No.{c.quantity} · S {c.signa} [Ref Only]
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
              <div className="font-bold text-amber-300">Impor Formularium Lokal RS (CSV)</div>
              <textarea rows={2} value={csvImportBox} onChange={(e) => setCsvImportBox(e.target.value)} placeholder="kardeks,generic,simrs,strength,route,category,highAlert,lasa,safetyNote" className="w-full rounded-xl border border-white/15 bg-slate-950 p-2 font-mono text-[11px] text-white" />
              <button type="button" onClick={() => { const added = importLocalFormularyCsv(csvImportBox); if (added.length) { setLocalEntries((p) => [...added, ...p]); setCsvImportBox('') } }} className="min-h-11 rounded-xl bg-sky-600 px-3 font-bold text-white">Impor Baris CSV Lokal</button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'explorer' && (
        <div className="space-y-3 text-xs">
          <input
            value={unifiedQuery}
            onChange={(e) => setUnifiedQuery(e.target.value)}
            placeholder="Cari satu pintu: obat (Lasix), gejala (nyeri dada), SKDI (STEMI), vaksin (Td), kalkulator (BMI)..."
            className="min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white"
          />
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900 p-2.5">
            <span className="font-bold text-cyan-300">3D Anatomical Bridge:</span>
            {bridgeMeshes.map((mesh) => (
              <Link key={mesh} to="/body-exposure" className="rounded-lg border border-cyan-400/35 bg-slate-950 px-2.5 py-1 font-mono text-[11px] text-cyan-200">
                {mesh} ↗
              </Link>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {unifiedResults.hits.map((h) => (
              <Link key={`${h.domain}-${h.id}`} to={h.routeHint} className="rounded-xl border border-white/10 bg-slate-900 p-3 hover:border-cyan-400">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{h.title}</span>
                  <span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{h.codeBadge ?? h.domain}</span>
                </div>
                <div className="mt-1 text-[11px] text-white/70">{h.subtitle}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {subTab === 'osce-sim' && (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
            <div className="font-mono text-lg font-black text-emerald-300">
              Timer Stasi: {String(Math.floor(timerSec / 60)).padStart(2, '0')}:{String(timerSec % 60).padStart(2, '0')}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setTimerRunning((r) => !r)} className="min-h-11 rounded-xl bg-emerald-600 px-3 font-bold text-white">{timerRunning ? 'Pause' : 'Mulai 15:00'}</button>
              <button type="button" onClick={() => { setTimerRunning(false); setTimerSec(15 * 60) }} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white">Reset Timer</button>
              <button type="button" onClick={() => setPickedIdx((i) => i + 1)} className="min-h-11 rounded-xl bg-sky-600 px-3 font-bold text-white">Acak Stasi Berikutnya</button>
            </div>
          </div>
          {activeStation && (
            <div className="rounded-xl border border-cyan-400/35 bg-slate-900 p-3">
              <div className="font-mono text-[11px] text-cyan-300">{activeStation.year} · {activeStation.session} · {activeStation.organSystem}</div>
              <div className="mt-1 text-sm font-extrabold text-white">{activeStation.caseTitle}</div>
              <div className="mt-0.5 text-white/75">Prosedur: {activeStation.procedureTag}</div>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            {osceHeatmap.map((row) => (
              <div key={row.organSystem} className="rounded-xl border border-white/10 bg-slate-900 p-2.5 font-mono">
                <div className="font-bold text-white">{row.organSystem}</div>
                <div className="text-amber-300">{row.count}x muncul ({row.years.join(', ')})</div>
              </div>
            ))}
          </div>
          <textarea rows={3} value={osceCsv} onChange={(e) => setOsceCsv(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 p-2 font-mono text-[11px] text-white" />
        </div>
      )}

      {subTab === 'vault-sync' && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-amber-100">
            Isolasi Hak Cipta &amp; Privasi: Tidak ada berkas biner/PDF berhak cipta yang disimpan di repo publik. Mount folder Google Drive berjalan khusus atas izin OAuth `drive.readonly` akun masing-masing pengguna.
          </div>
          <textarea
            rows={4}
            value={folderUrls}
            onChange={(e) => setFolderUrls(e.target.value)}
            placeholder="Tempel 1 atau banyak URL / Folder ID Google Drive pribadi Anda (otomatis menduplikasi & membaca ?resourcekey=...)..."
            className="w-full rounded-xl border border-white/15 bg-slate-900 p-3 font-mono text-[11px] text-white"
          />
          <div className="flex flex-wrap gap-2">
            <input value={oauthToken} onChange={(e) => setOauthToken(e.target.value)} type="password" placeholder="Google OAuth Access Token (drive.readonly)..." className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white" />
            <button type="button" onClick={runLiveDriveSync} className="min-h-11 rounded-xl bg-cyan-600 px-4 font-bold text-white">Sinkronkan Private Vault</button>
          </div>
          <div className="font-mono text-[11px] text-cyan-300">Folder root unik terdeteksi: {parsedMounts.length}</div>
          {syncStats && <div className="rounded-xl bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-200">{syncStats}</div>}
        </div>
      )}
    </section>
  )
}
