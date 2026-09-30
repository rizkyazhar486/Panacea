import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { gerbangRilisKlinis, JENIS_GALAT, susunLaporan, type JenisGalat, type KasusBeku, type KlaimKlinis, type LaporanValidasi, type Protokol } from '../lib/validasiKlinis'

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
  const [laporan, setLaporan] = useState<{ r: LaporanValidasi; rilis: { versi: string; klaim: KlaimKlinis; alasan: string[] } } | null>(null)
  useEffect(() => { api.validationStudies().then((r) => setStudi(r.studies)).catch((e) => setGalat((e as Error).message)) }, [])

  const buka = (id: string) => api.validationCases(id).then(setAktif).catch((e) => setGalat((e as Error).message))
  const bukaLaporan = async (id: string) => {
    try {
      const buku = (await api.validationLedger()).ledger
      const r = await susunLaporan(buku, id)
      // Versi sistem yang dinilai = versi pada kasus beku protokol ini (klaim berlaku per versi).
      const versi = buku.flatMap((c) => (c.isi.jenis === 'kasus' && c.isi.data.protokolId === id ? [c.isi.data.versiSistem] : []))[0] ?? 'unknown'
      setLaporan({ r, rilis: { versi, ...gerbangRilisKlinis(r, buku, versi) } })
    } catch (e) { setGalat((e as Error).message) }
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
      {studi && studi.length > 0 && !pemimpin && <AntreanAdjudikasi protokolId={studi[0].protokol.id} />}
      {aktif && <PenilaiKasus studi={aktif} onSelesai={() => { void buka(aktif.protokol.id); api.validationStudies().then((r) => setStudi(r.studies)).catch(() => {}) }} />}
      {laporan && <LaporanStudi laporan={laporan.r} rilis={laporan.rilis} />}
    </section>
  )
}

function PenilaiKasus({ studi, onSelesai }: { studi: { protokol: Protokol; cases: Kasus[] }; onSelesai: () => void }) {
  const kasus = studi.cases.find((c) => !c.sudahSaya)
  const mulai = useRef(Date.now())
  const [f, setF] = useState({ galat: [] as JenisGalat[], benar: null as boolean | null, bahaya: 'none', klaim: '0', omisi: '', override: false, alasan: '', coi: '', catatan: '' })
  const [kirim, setKirim] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)
  useEffect(() => { mulai.current = Date.now(); setF((x) => ({ ...x, galat: [], benar: null, bahaya: 'none', klaim: '0', omisi: '', override: false, alasan: '', catatan: '' })) }, [kasus?.id])
  if (!kasus) return (
    <div className="mt-2" data-validation-done>
      <p className="text-[12px] font-bold text-emerald-300">All cases in this study are assessed. Thank you.</p>
      <FormulirSus protokolId={studi.protokol.id} />
    </div>
  )
  const m = kasus.masukan as MasukanSeri, k = kasus.keluaran as KeluaranTren
  const selesai = studi.cases.filter((c) => c.sudahSaya).length

  const simpan = async () => {
    if (f.benar === null) { setPesan('State whether the output is correct.'); return }
    if (f.benar === false && !f.galat.length) { setPesan('Classify the error.'); return }
    if (f.override && !f.alasan.trim()) { setPesan('An override needs a reason.'); return }
    setKirim(true)
    try {
      await api.submitValidationAssessment(studi.protokol.id, {
        kasusId: kasus.id, benar: f.benar, galat: f.benar ? [] : f.galat, bahaya: f.bahaya, klaimTakDidukung: Number(f.klaim) || 0,
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
        {f.benar === false && (
          <div className="grid grid-cols-2 gap-1" role="group" aria-label="Error class" data-kelas-galat>
            {JENIS_GALAT.map((g) => (
              <label key={g} className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-2 ${g === 'missed-critical-finding' ? 'border-rose-300/50 font-black text-rose-200' : 'border-white/15'}`}>
                <input type="checkbox" checked={f.galat.includes(g)} onChange={(e) => setF({ ...f, galat: e.target.checked ? [...f.galat, g] : f.galat.filter((x) => x !== g) })} />
                {LABEL_GALAT[g]}
              </label>
            ))}
          </div>
        )}
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

// System Usability Scale (Brooke 1996), kata-kata baku domain publik.
const BUTIR_SUS = [
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to be able to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.',
]
function FormulirSus({ protokolId }: { protokolId: string }) {
  const [j, setJ] = useState<(number | null)[]>(Array(10).fill(null)), [pesan, setPesan] = useState<string | null>(null), [selesai, setSelesai] = useState(false)
  if (selesai) return <p role="status" className="mt-1 text-[11px] text-emerald-300" data-sus-done>Usability response recorded.</p>
  return (
    <div className="mt-2 grid gap-1.5 text-[11px]" data-sus-form>
      <p className="font-black">How was this review workflow? (System Usability Scale, 1 = strongly disagree, 5 = strongly agree)</p>
      {BUTIR_SUS.map((b, i) => (
        <div key={i}>
          <p className="text-white/75">{i + 1}. {b}</p>
          <div className="mt-0.5 flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={j[i] === n} aria-label={`Item ${i + 1}: ${n}`} onClick={() => setJ(j.map((x, k) => (k === i ? n : x)))}
              className={`min-h-9 flex-1 rounded-md border text-[11px] font-black ${j[i] === n ? 'border-cyan-300/60 bg-cyan-400/15' : 'border-white/15'}`}>{n}</button>
          ))}</div>
        </div>
      ))}
      <button type="button" className="min-h-11 rounded-xl border border-white/15 font-black" onClick={() => {
        if (j.some((x) => x === null)) { setPesan('Answer all 10 items.'); return }
        api.submitValidationUsability(protokolId, { jawaban: j }).then(() => setSelesai(true)).catch((e) => setPesan((e as Error).message))
      }}>Submit usability response</button>
      {pesan && <p role="alert" className="font-bold text-amber-300">{pesan}</p>}
    </div>
  )
}

function AntreanAdjudikasi({ protokolId }: { protokolId: string }) {
  const [daftar, setDaftar] = useState<Awaited<ReturnType<typeof api.validationDisagreements>>['cases'] | null>(null)
  const [alasan, setAlasan] = useState(''), [pesan, setPesan] = useState<string | null>(null)
  const muat = () => api.validationDisagreements(protokolId).then((r) => setDaftar(r.cases)).catch((e) => setPesan((e as Error).message))
  if (!daftar) return <button type="button" onClick={() => void muat()} className="mt-2 min-h-10 rounded-full border border-white/15 px-3 text-[11px] font-black">Adjudication queue</button>
  const d = daftar[0]
  if (!d) return <p className="mt-2 text-[11px] text-white/55" data-adjudication-empty>No disagreement awaits adjudication by you (cases you reviewed are excluded).</p>
  const k = d.kasus.keluaran as { status: string; alasan: string } | null
  return (
    <div className="mt-3 border-t border-white/10 pt-3 text-[11px]" data-adjudication-case={d.kasus.id}>
      <p className="text-[10px] font-black uppercase tracking-wide text-white/45">Adjudication · {daftar.length} open · you did not review this case</p>
      <p className="mt-1 font-bold">{LABEL_STATUS[k?.status ?? ''] ?? k?.status}: <span className="font-normal text-white/70">{k?.alasan}</span></p>
      <ul className="mt-1 space-y-0.5">{d.penilaian.map((p, i) => <li key={i}>Reviewer {i + 1}: {p.benar ? 'correct' : 'incorrect'} · harm {p.bahaya}{p.override.dilakukan ? ` · override: ${p.override.alasan}` : ''}</li>)}</ul>
      <input value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Adjudication reason — required" aria-label="Adjudication reason" className="mt-1 w-full rounded-md border border-white/15 bg-transparent px-2 py-1 text-white" />
      <div className="mt-1 flex gap-1.5">{[true, false].map((v) => (
        <button key={String(v)} type="button" className="min-h-10 flex-1 rounded-lg border border-white/15 font-black" onClick={() => {
          if (!alasan.trim()) { setPesan('An adjudication needs a reason.'); return }
          api.submitValidationAdjudication({ kasusId: d.kasus.id, keputusanBenar: v, alasan }).then(() => { setAlasan(''); setPesan(null); void muat() }).catch((e) => setPesan((e as Error).message))
        }}>{v ? 'Output is correct' : 'Output is incorrect'}</button>
      ))}</div>
      {pesan && <p role="alert" className="mt-1 font-bold text-amber-300">{pesan}</p>}
    </div>
  )
}

const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`)
const LABEL_GALAT: Record<JenisGalat, string> = {
  'missed-critical-finding': 'Missed critical finding', 'missed-finding': 'Missed finding', 'false-alarm': 'False alarm',
  'wrong-value': 'Wrong value', 'wrong-recommendation': 'Wrong recommendation', 'unsupported-claim': 'Unsupported claim', other: 'Other',
}
const LABEL_KLAIM: Record<KlaimKlinis, string> = {
  'technically-works': 'Technically works — no clinical claim allowed',
  'clinically-reviewed': 'Clinically reviewed — not validated',
  'clinically-validated': 'Clinically validated for this version',
}

function LaporanStudi({ laporan: r, rilis }: { laporan: LaporanValidasi; rilis: { versi: string; klaim: KlaimKlinis; alasan: string[] } }) {
  const unduh = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `validation-report-${r.protokol.id}-v${r.protokol.versi}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="mt-3 border-t border-white/10 pt-3 text-[11px]" data-validation-report={r.status}>
      <p className="font-black">{r.status === 'no-human-data' ? 'No human assessments yet — nothing below is a result.' : r.status === 'in-progress' ? 'In progress — endpoints are not yet evaluable.' : 'All cases assessed by the required reviewers.'}</p>
      <p className={r.rantai.utuh ? 'text-emerald-300' : 'font-bold text-rose-300'}>Audit chain: {r.rantai.utuh ? 'intact' : `BROKEN at record ${r.rantai.pada} (${r.rantai.alasan})`}</p>
      <p className="text-white/55">{r.metrik.penilaian} assessments · {r.metrik.kasusDinilai} cases · κ {r.metrik.kappa.kappa?.toFixed(2) ?? '—'} (n={r.metrik.kappa.n}) · near-miss {r.metrik.kejadianKeselamatan.nearMiss} · harm {r.metrik.kejadianKeselamatan.harm} · SUS median {r.metrik.sus.median ?? '—'} (n={r.metrik.sus.n}) · open disagreements {r.metrik.ketidaksepakatanBelumDiadjudikasi.length}</p>
      <ul className="mt-1 space-y-0.5">
        {r.titikAkhir.map((t) => (
          <li key={t.metrik} data-endpoint={t.metrik}>{t.metrik}: {t.metrik === 'time-to-review-ms' ? (t.nilai == null ? '—' : `${Math.round(t.nilai / 1000)} s`) : t.metrik === 'inter-rater-kappa' ? (t.nilai?.toFixed(2) ?? '—') : pct(t.nilai)} · target {t.ambang.arah === 'min' ? '≥' : '≤'} {t.ambang.nilai} · {t.terpenuhi == null ? 'not evaluable' : t.terpenuhi ? 'met' : 'not met'}</li>
        ))}
      </ul>
      <p className="mt-1" data-galat-berbahaya>Dangerous false negatives: <b className={r.metrik.dangerousFalseNegative.pembilang ? 'text-rose-300' : ''}>{r.metrik.dangerousFalseNegative.pembilang}</b> of {r.metrik.penilaian}{r.metrik.dikecualikanTakTerverifikasi ? ` · ${r.metrik.dikecualikanTakTerverifikasi} unverified assessments excluded` : ''}</p>
      <div className="mt-2 rounded-lg border border-white/15 p-2" data-klaim-rilis={rilis.klaim}>
        <p className="font-black">Release claim · {rilis.versi}: {LABEL_KLAIM[rilis.klaim]}</p>
        {rilis.alasan.length > 0 && <ul className="mt-0.5 list-disc pl-4 text-white/60">{rilis.alasan.map((a) => <li key={a}>{a}</li>)}</ul>}
      </div>
      <p className="mt-1 text-white/45">{r.pernyataan}</p>
      <button type="button" onClick={unduh} className="mt-1 min-h-10 rounded-full border border-white/15 px-3 font-black">Download report (JSON)</button>
    </div>
  )
}

export default StudiValidasiKlinis
