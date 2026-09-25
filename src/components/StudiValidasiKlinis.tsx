import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { susunLaporan, type KasusBeku, type LaporanValidasi, type Protokol } from '../lib/validasiKlinis'

// Studi validasi klinis — layar penilai (buta) dan laporan pemimpin studi.
// Perangkat lunak tidak membuat penilaian apa pun; setiap angka laporan berasal
// dari penilaian klinisi sungguhan di buku besar server, yang rantainya
// diverifikasi ulang di sini.
const LABEL_STATUS: Record<string, string> = {
  'belum-cukup-data': 'Building baseline', stabil: 'Stable', pantau: 'Watch',
  'perubahan-bermakna': 'Meaningful change', 'bicarakan-dengan-dokter': 'Discuss with a doctor',
}
type Kasus = KasusBeku & { sudahSaya: boolean }
interface MasukanSeri { tes: string; satuan: string; rentangPopulasi: [number | null, number | null]; seri: { tanggal: string; nilai: number }[] }
type KeluaranTren = { status: string; alasan: string; garisDasar: number | null; rentangPribadi: [number, number] | null } | null

export function StudiValidasiKlinis({ pemimpin = false }: { pemimpin?: boolean }) {
  const [studi, setStudi] = useState<{ protokol: Protokol; jumlahKasus: number; sudahSaya: number }[] | null>(null)
  const [aktif, setAktif] = useState<{ protokol: Protokol; cases: Kasus[] } | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [laporan, setLaporan] = useState<LaporanValidasi | null>(null)
  useEffect(() => { api.validationStudies().then((r) => setStudi(r.studies)).catch((e) => setGalat((e as Error).message)) }, [])

  const buka = (id: string) => api.validationCases(id).then(setAktif).catch((e) => setGalat((e as Error).message))
  const bukaLaporan = async (id: string) => {
    try { setLaporan(await susunLaporan((await api.validationLedger()).ledger, id)) } catch (e) { setGalat((e as Error).message) }
  }

  return (
    <section className="dark rounded-[20px] border border-white/10 bg-[#050708] p-3 text-white" aria-label="Clinical validation studies" data-validation-studies>
      <h2 className="text-sm font-black">Clinical validation studies</h2>
      <p className="mt-0.5 text-[11px] text-white/55">Your structured judgement of frozen system outputs; software never scores itself.</p>
      {galat && <p role="alert" className="mt-1 text-[11px] font-bold text-amber-300">{galat === 'verified clinician role required' ? 'Available after your STR is verified.' : galat}</p>}
      {!studi && !galat && <p className="mt-1 text-[11px] text-white/50">Loading studies…</p>}
      {studi?.length === 0 && <p className="mt-1 text-[11px] text-white/55">No study is open.</p>}
      <ul className="mt-2 space-y-1.5">
        {studi?.map((s) => (
          <li key={s.protokol.id} className="rounded-xl border border-white/10 p-2">
            <p className="text-[12px] font-bold">{s.protokol.judul} <span className="font-normal text-white/45">v{s.protokol.versi}</span></p>
            <p className="text-[11px] text-white/55">You assessed {s.sudahSaya} of {s.jumlahKasus} frozen cases.</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => void buka(s.protokol.id)} className="min-h-10 rounded-full border border-white/15 px-3 text-[11px] font-black">Review cases</button>
              {pemimpin && <button type="button" onClick={() => void bukaLaporan(s.protokol.id)} className="min-h-10 rounded-full border border-white/15 px-3 text-[11px] font-black">Study report</button>}
            </div>
          </li>
        ))}
      </ul>
      {aktif && <PenilaiKasus studi={aktif} onSelesai={() => { void buka(aktif.protokol.id); api.validationStudies().then((r) => setStudi(r.studies)).catch(() => {}) }} />}
      {laporan && <LaporanStudi laporan={laporan} />}
    </section>
  )
}

function PenilaiKasus({ studi, onSelesai }: { studi: { protokol: Protokol; cases: Kasus[] }; onSelesai: () => void }) {
  const kasus = studi.cases.find((c) => !c.sudahSaya)
  const mulai = useRef(Date.now())
  const [f, setF] = useState({ benar: null as boolean | null, bahaya: 'none', klaim: '0', omisi: '', override: false, alasan: '', coi: '', catatan: '' })
  const [kirim, setKirim] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)
  useEffect(() => { mulai.current = Date.now(); setF((x) => ({ ...x, benar: null, bahaya: 'none', klaim: '0', omisi: '', override: false, alasan: '', catatan: '' })) }, [kasus?.id])
  if (!kasus) return <p className="mt-2 text-[12px] font-bold text-emerald-300" data-validation-done>All cases in this study are assessed. Thank you.</p>
  const m = kasus.masukan as MasukanSeri, k = kasus.keluaran as KeluaranTren
  const selesai = studi.cases.filter((c) => c.sudahSaya).length

  const simpan = async () => {
    if (f.benar === null) { setPesan('State whether the output is correct.'); return }
    if (f.override && !f.alasan.trim()) { setPesan('An override needs a reason.'); return }
    setKirim(true)
    try {
      await api.submitValidationAssessment(studi.protokol.id, {
        kasusId: kasus.id, benar: f.benar, bahaya: f.bahaya, klaimTakDidukung: Number(f.klaim) || 0,
        omisi: f.omisi.split('\n').map((x) => x.trim()).filter(Boolean), override: { dilakukan: f.override, alasan: f.alasan },
        waktuTinjauMs: Date.now() - mulai.current, konflikKepentingan: f.coi, catatan: f.catatan,
      })
      setPesan(null); onSelesai()
    } catch (e) { setPesan((e as Error).message) } finally { setKirim(false) }
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3" data-validation-case={kasus.id}>
      <p className="text-[10px] font-black uppercase tracking-wide text-white/45">Case {selesai + 1} of {studi.cases.length} · synthetic, de-identified · blinded</p>
      <p className="mt-1 text-[12px] font-bold">{m.tes.toUpperCase()} ({m.satuan}) · population range {m.rentangPopulasi[0] ?? '–'}–{m.rentangPopulasi[1] ?? '–'}</p>
      <table className="mt-1 w-full text-[11px] tabular-nums"><tbody>
        {m.seri.map((b) => <tr key={b.tanggal}><td className="text-white/55">{b.tanggal}</td><td className="text-right font-bold">{b.nilai}</td></tr>)}
      </tbody></table>
      <div className="mt-2 rounded-lg border border-white/10 p-2 text-[11px]">
        <p className="text-[10px] font-black uppercase tracking-wide text-white/45">System output (derived, not clinician-reviewed) · {kasus.versiSistem}</p>
        {k ? <><p className="mt-0.5 font-bold">{LABEL_STATUS[k.status] ?? k.status}</p><p className="text-white/70">{k.alasan}</p></> : <p>No output</p>}
      </div>
      <fieldset className="mt-2 grid gap-1.5 text-[11px]">
        <div className="flex gap-1.5">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={f.benar === v} onClick={() => setF({ ...f, benar: v })}
              className={`min-h-10 flex-1 rounded-lg border px-2 font-black ${f.benar === v ? 'border-cyan-300/60 bg-cyan-400/15' : 'border-white/15'}`}>{v ? 'Output is correct' : 'Output is incorrect'}</button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-2">Potential harm
          <select value={f.bahaya} onChange={(e) => setF({ ...f, bahaya: e.target.value })} aria-label="Potential harm" className="rounded-md border border-white/15 bg-transparent px-1 py-1 text-white">
            <option value="none">None</option><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-2">Unsupported claims in the reason
          <input inputMode="numeric" value={f.klaim} onChange={(e) => setF({ ...f, klaim: e.target.value })} aria-label="Unsupported claims" className="w-14 rounded-md border border-white/15 bg-transparent px-1 py-1 text-white" />
        </label>
        <textarea rows={2} value={f.omisi} onChange={(e) => setF({ ...f, omisi: e.target.value })} placeholder="Omissions — one per line (optional)" aria-label="Omissions" className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-white" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} /> I would override this output in practice</label>
        {f.override && <input value={f.alasan} onChange={(e) => setF({ ...f, alasan: e.target.value })} placeholder="Override reason — required" aria-label="Override reason" className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-white" />}
        <input value={f.coi} onChange={(e) => setF({ ...f, coi: e.target.value })} placeholder="Conflict of interest (blank = none declared)" aria-label="Conflict of interest" className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-white" />
        <button type="button" disabled={kirim} onClick={() => void simpan()} className="min-h-11 rounded-xl bg-cyan-500/80 px-3 text-[12px] font-black text-black disabled:opacity-50">{kirim ? 'Saving…' : 'Submit assessment'}</button>
        {pesan && <p role="alert" className="font-bold text-amber-300">{pesan}</p>}
      </fieldset>
      <LaporKeselamatan kasusId={kasus.id} />
    </div>
  )
}

function LaporKeselamatan({ kasusId }: { kasusId: string }) {
  const [buka, setBuka] = useState(false), [t, setT] = useState(''), [jenis, setJenis] = useState('near-miss'), [pesan, setPesan] = useState<string | null>(null)
  if (!buka) return <button type="button" onClick={() => setBuka(true)} className="mt-2 text-[11px] font-bold text-amber-300 underline">Report a safety concern or near-miss</button>
  return (
    <div className="mt-2 grid gap-1 text-[11px]">
      <select value={jenis} onChange={(e) => setJenis(e.target.value)} aria-label="Safety event type" className="rounded-md border border-white/15 bg-transparent px-1 py-1 text-white"><option value="near-miss">Near-miss</option><option value="harm">Harm</option></select>
      <textarea rows={2} value={t} onChange={(e) => setT(e.target.value)} aria-label="Describe the safety event" className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-white" />
      <button type="button" className="min-h-10 rounded-lg border border-amber-300/40 font-black" onClick={() => api.reportValidationSafetyEvent({ jenis, tingkat: 'minor', kasusId, deskripsi: t }).then(() => { setPesan('Recorded.'); setT('') }).catch((e) => setPesan((e as Error).message))}>Record safety event</button>
      {pesan && <p role="status">{pesan}</p>}
    </div>
  )
}

const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`)
function LaporanStudi({ laporan: r }: { laporan: LaporanValidasi }) {
  const unduh = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `validation-report-${r.protokol.id}-v${r.protokol.versi}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="mt-3 border-t border-white/10 pt-3 text-[11px]" data-validation-report={r.status}>
      <p className="font-black">{r.status === 'no-human-data' ? 'No human assessments yet — nothing below is a result.' : r.status === 'in-progress' ? 'In progress — endpoints are not yet evaluable.' : 'All cases assessed by the required reviewers.'}</p>
      <p className={r.rantai.utuh ? 'text-emerald-300' : 'font-bold text-rose-300'}>Audit chain: {r.rantai.utuh ? 'intact' : `BROKEN at record ${r.rantai.pada} (${r.rantai.alasan})`}</p>
      <p className="text-white/55">{r.metrik.penilaian} assessments · {r.metrik.kasusDinilai} cases · κ {r.metrik.kappa.kappa?.toFixed(2) ?? '—'} (n={r.metrik.kappa.n}) · near-miss {r.metrik.kejadianKeselamatan.nearMiss} · harm {r.metrik.kejadianKeselamatan.harm}</p>
      <ul className="mt-1 space-y-0.5">
        {r.titikAkhir.map((t) => (
          <li key={t.metrik} data-endpoint={t.metrik}>{t.metrik}: {t.metrik === 'time-to-review-ms' ? (t.nilai == null ? '—' : `${Math.round(t.nilai / 1000)} s`) : t.metrik === 'inter-rater-kappa' ? (t.nilai?.toFixed(2) ?? '—') : pct(t.nilai)} · target {t.ambang.arah === 'min' ? '≥' : '≤'} {t.ambang.nilai} · {t.terpenuhi == null ? 'not evaluable' : t.terpenuhi ? 'met' : 'not met'}</li>
        ))}
      </ul>
      <p className="mt-1 text-white/45">{r.pernyataan}</p>
      <button type="button" onClick={unduh} className="mt-1 min-h-10 rounded-full border border-white/15 px-3 font-black">Download report (JSON)</button>
    </div>
  )
}

export default StudiValidasiKlinis
