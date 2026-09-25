import { useEffect, useState } from 'react'
import { api, backendEnabled, type FhirBundelLab, type FhirObservasiLab, type TinjauanLabKlien } from '../lib/api'
import { RencanaHarianDokter } from './RencanaHarianDokter'
import { statusPasienUntukDokter } from '../lib/statusPasienDokter'
import { timelineHarian, angka } from '../lib/perubahanLongitudinal'
import type { ContinuousCarePlan, DailyAnamnesisSubmissionInput } from '../lib/continuousCareOperatingSystem'
import { analisisTrenSeri, MIN_RIWAYAT_GARIS_DASAR, type StatusTren } from '../lib/labTrend'

// Bahasa klinisi untuk mesin tren yang sama dengan sisi pasien (labTrend.ts):
// garis dasar pribadi (median ± 2·MAD×1,4826 dari hasil SEBELUMNYA), satu titik
// menyimpang = "single deviation", dua berurutan searah = "sustained shift".
// Rentang populasi tidak dipakai di sini: bundel tidak membawanya, dan setiap
// lab punya rentang sendiri. Ini sinyal pemantauan, bukan interpretasi klinis.
const STATUS_KLINISI: Record<StatusTren, { teks: string; urut: number; kelas: string }> = {
  'bicarakan-dengan-dokter': { teks: 'Sustained shift', urut: 0, kelas: 'text-rose-300' },
  'perubahan-bermakna': { teks: 'Sustained shift', urut: 0, kelas: 'text-rose-300' },
  pantau: { teks: 'Single deviation', urut: 1, kelas: 'text-amber-300' },
  stabil: { teks: 'Within personal range', urut: 2, kelas: 'text-emerald-300' },
  'belum-cukup-data': { teks: `Baseline forming (<${MIN_RIWAYAT_GARIS_DASAR + 1} results)`, urut: 3, kelas: 'text-white/50' },
}

const jenisDari = (o: FhirObservasiLab) => o.identifier?.find((i) => i.system.endsWith('/lab-entry'))?.value.split('/')[0] ?? ''

// Tinjauan ditulis dokter dan disimpan terpisah; angka lab pasien tidak berubah.
function FormTinjauan({ izinId, tes, sebelumnya, onSimpan }: { izinId: string; tes: string; sebelumnya?: TinjauanLabKlien; onSimpan: (t: TinjauanLabKlien) => void }) {
  const [catatan, setCatatan] = useState('')
  const [cek, setCek] = useState('')
  const [galat, setGalat] = useState<string | null>(null)
  return (
    <details className="mt-1" data-lab-review-form>
      <summary className="cursor-pointer text-[11px] font-bold text-emerald-300">
        {sebelumnya ? `Reviewed ${sebelumnya.ditinjau.slice(0, 10)}${sebelumnya.cekUlangSebelum ? ` · recheck by ${sebelumnya.cekUlangSebelum}` : ''}` : 'Mark reviewed'}
      </summary>
      <div className="mt-1 grid gap-1.5">
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={500} rows={2} aria-label="Note to patient (optional)" placeholder="Note to patient (optional)"
          className="rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-[12px] text-white" />
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-white/55" htmlFor={`cek-${tes}`}>Recheck by</label>
          <input id={`cek-${tes}`} type="date" value={cek} onChange={(e) => setCek(e.target.value)} className="rounded-lg border border-white/15 bg-transparent px-2 py-1 text-[12px] text-white" />
          <button type="button" className="ml-auto min-h-9 rounded-full px-3 text-[11px] font-black"
            onClick={() => api.reviewLab(izinId, tes, catatan, cek).then((t) => { setGalat(null); setCatatan(''); onSimpan(t) }).catch((e) => setGalat((e as Error).message))}>Save review</button>
        </div>
        {galat && <p role="alert" className="text-[11px] font-bold text-amber-300">{galat}</p>}
      </div>
    </details>
  )
}

function Garis({ obs }: { obs: FhirObservasiLab[] }) {
  if (obs.length < 2) return <span className="text-[10px] text-white/35">1 result</span>
  const v = obs.map((o) => o.valueQuantity.value)
  const min = Math.min(...v), maks = Math.max(...v), r = maks - min || 1
  const titik = v.map((x, i) => `${(i / (v.length - 1)) * 100},${(22 - ((x - min) / r) * 20).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-20" role="img" aria-label={`${v.length} results`}>
      <polyline points={titik} fill="none" stroke="#00BF63" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

// Tampilan dokter: hasil lab yang DIBAGIKAN pasien, dibaca sebagai FHIR
// Observation. Setiap pembukaan tercatat di jejak audit pasien (server).
// Angkanya disalin pasien dari lembar hasil — ditandai jelas, bukan dari lab.
export function LabPasienUntukDokter() {
  const [daftar, setDaftar] = useState<{ id: string; berakhir: string; pasien: string }[] | null>(null)
  const [buka, setBuka] = useState<{ izinId: string; pasien: string; dibuat: string; berakhir: string; reviews: TinjauanLabKlien[]; bundle: FhirBundelLab } | null>(null)
  const [care, setCare] = useState<{ plan: ContinuousCarePlan | null; reports: DailyAnamnesisSubmissionInput[] }>({ plan: null, reports: [] })
  useEffect(() => { if (buka) api.clinicianCare(buka.izinId).then(setCare).catch(() => setCare({ plan: null, reports: [] })) }, [buka?.izinId, buka?.reviews.length])
  const [galat, setGalat] = useState<string | null>(null)
  useEffect(() => { if (backendEnabled) api.clinicianLabShares().then((r) => setDaftar(r.shares)).catch((e) => setGalat((e as Error).message)) }, [])
  if (!backendEnabled) return null

  const kelompok = new Map<string, FhirBundelLab['entry'][number]['resource'][]>()
  // Bundel juga memuat Provenance; hanya Observation yang punya kode/nilai.
  for (const e of (buka?.bundle.entry ?? []).filter((x) => (x.resource as { resourceType?: string }).resourceType === 'Observation')) {
    const k = e.resource.code.text
    kelompok.set(k, [...(kelompok.get(k) ?? []), e.resource].sort((a, b) => a.effectiveDateTime.localeCompare(b.effectiveDateTime)))
  }

  return (
    <section className="dark rounded-[20px] border border-white/10 bg-[#050708] p-3 text-white" aria-label="Lab results shared with you" data-clinician-lab>
      <h2 className="text-sm font-black">Lab results shared with you</h2>
      {galat && <p className="mt-1 text-[11px] font-bold text-amber-300">{galat === 'verified clinician role required' ? 'Available after your STR is verified.' : galat}</p>}
      {daftar === null && !galat && <p role="status" className="mt-1 text-[11px] text-white/55" data-lab-share-loading>Loading shared lab results…</p>}
      {daftar && daftar.length === 0 && <p className="mt-1 text-[11px] text-white/55">No patient has shared lab results with you yet.</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {daftar?.map((d) => (
          <button key={d.id} type="button" className="min-h-10 rounded-full border border-white/15 px-3 text-[11px] font-black"
            onClick={() => api.clinicianLabFhir(d.id).then((r) => setBuka({ ...r, izinId: d.id })).catch((e) => setGalat((e as Error).message))}>
            {d.pasien} · until {d.berakhir.slice(0, 10)}
          </button>
        ))}
      </div>
      {buka && (
        <div className="mt-3">
          <p className="text-[11px] font-bold text-amber-200">{buka.pasien} · patient-transcribed from lab reports — verify against the original before clinical use.</p>
          <ul className="mt-2 divide-y divide-white/10" aria-label="Results by test">
            {[...kelompok.entries()]
              .map(([nama, obs]) => ({ nama, obs, tren: analisisTrenSeri(obs.map((o) => ({ tanggal: o.effectiveDateTime.slice(0, 10), nilai: o.valueQuantity.value }))) }))
              .sort((x, y) => (x.tren ? STATUS_KLINISI[x.tren.status].urut : 9) - (y.tren ? STATUS_KLINISI[y.tren.status].urut : 9))
              .map(({ nama, obs, tren }) => {
                const a = obs[obs.length - 1]
                const loinc = a.code.coding?.[0]?.code
                const st = tren ? STATUS_KLINISI[tren.status] : null
                return (
                  <li key={nama} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2" data-trend-status={tren?.status}>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold">{nama}</div>
                      {(() => {
                        const rr = a.referenceRange?.[0]
                        if (!rr) return null
                        const v = a.valueQuantity.value
                        const luar = (rr.low && v < rr.low.value) || (rr.high && v > rr.high.value)
                        return <div className={`text-[10px] ${luar ? 'font-bold text-amber-300' : 'text-white/45'}`}>{luar ? 'Outside' : 'Within'} the lab's printed range {rr.low?.value ?? '…'}–{rr.high?.value ?? '…'}</div>
                      })()}
                      <div className="text-[10px] text-white/45">{loinc ? `LOINC ${loinc}` : 'not coded'} · {obs.length} result{obs.length > 1 ? 's' : ''} · last {a.effectiveDateTime.slice(0, 10)}</div>
                      {jenisDari(a) && (
                        <FormTinjauan izinId={buka.izinId} tes={jenisDari(a)} sebelumnya={buka.reviews.find((t) => t.tes === jenisDari(a))}
                          onSimpan={(t) => setBuka((b) => (b ? { ...b, reviews: [t, ...b.reviews] } : b))} />
                      )}
                      {st && <div className={`text-[11px] font-bold ${st.kelas}`}>{st.teks}{tren?.garisDasar != null ? ` · baseline ${Number(tren.garisDasar.toFixed(2))}` : ''}{tren?.zPribadi != null && tren.status !== 'belum-cukup-data' ? ` · z ${tren.zPribadi.toFixed(1)}` : ''}</div>}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black tabular-nums">{a.valueQuantity.value} <span className="text-[10px] font-normal text-white/50">{a.valueQuantity.unit}</span></span>
                      <Garis obs={obs} />
                    </div>
                  </li>
                )
              })}
          </ul>
          <p className="mt-1 text-[10px] leading-snug text-white/40">Compared with this patient's own earlier results (median ± 2 MAD) — a monitoring signal, not an interpretation.</p>
          {kelompok.size === 0 && <p className="mt-1 text-[11px] text-white/55">This patient has no lab results yet.</p>}
          {(() => {
            // Status kanonik yang sama dengan sisi pasien, disusun dari sumber server.
            const { state, labels } = statusPasienUntukDokter(buka.bundle.entry as never, care, buka.reviews, buka, new Date().toISOString())
            const hari = timelineHarian(state, 30, labels, 'dokter')
            if (!hari.length) return null
            return (
              <details className="mt-3 border-t border-white/10 pt-2" data-clinician-timeline>
                <summary className="cursor-pointer text-[12px] font-black">Timeline · {hari.length} day{hari.length > 1 ? 's' : ''}</summary>
                <ol className="mt-1 space-y-1.5">
                  {hari.map((h) => (
                    <li key={h.tanggal}>
                      <p className="text-[10px] font-black uppercase tracking-wide text-white/40">{h.tanggal}</p>
                      {h.butir.map((b) => (
                        <p key={b.id} className="flex justify-between gap-3 text-[11px]">
                          <span className="min-w-0 truncate">{b.label} <span className="text-white/40">· {b.asal}</span></span>
                          <span className="shrink-0 font-bold tabular-nums">{typeof b.value === 'number' ? angka(b.value) : b.value} <span className="font-normal text-white/40">{b.unit}</span></span>
                        </p>
                      ))}
                    </li>
                  ))}
                </ol>
              </details>
            )
          })()}
          <RencanaHarianDokter izinId={buka.izinId} state={statusPasienUntukDokter(buka.bundle.entry as never, care, buka.reviews, buka, new Date().toISOString()).state} />
        </div>
      )}
    </section>
  )
}

export default LabPasienUntukDokter
