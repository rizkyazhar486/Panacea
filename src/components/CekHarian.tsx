import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { buatClientId, bacaAntrean, kirimAtauAntre, kurasAntrean, type ButirAntrean } from '../lib/antreanCekHarian'
import { buildDailyInterview, type ContinuousCarePlan, type DailyAnamnesisAnswer } from '../lib/continuousCareOperatingSystem'

// Cek harian yang diatur dokter (Continuous Care). Pertanyaan dan aturannya
// ditulis dokter; halaman ini hanya menampilkan dan mengirim jawaban mentah.
// Ini bukan diagnosis dan bukan layanan darurat.
const hariIni = () => { const d = new Date(); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

export function CekHarian() {
  const [rencana, setRencana] = useState<{ plan: ContinuousCarePlan; dokterEmail: string; sudah: boolean }[]>([])
  const [jawab, setJawab] = useState<Record<string, boolean | number | string>>({})
  const [pesan, setPesan] = useState<string | null>(null)
  const [mengirim, setMengirim] = useState(false)
  const muat = () => api.carePlans().then((r) => setRencana(r.plans.map((x) => ({
    plan: x.plan, dokterEmail: x.dokterEmail, sudah: x.reports.some((l) => l.scheduledFor.slice(0, 10) === hariIni()),
  })))).catch(() => {})
  const kirimSatu = (b: ButirAntrean) => api.submitCareReport(b.planId, b.scheduledFor, b.answers, { clientId: b.clientId, authoredAt: b.authoredAt })
  const [antre, setAntre] = useState(() => bacaAntrean(localStorage).length)
  const kuras = async () => {
    if (!bacaAntrean(localStorage).length) return
    const r = await kurasAntrean(localStorage, kirimSatu)
    setAntre(r.sisa)
    if (r.terkirim) { setPesan('Saved answers sent to your doctor.'); void muat() }
    if (r.ditolak.length) setPesan(`A saved check-in could not be sent: ${r.ditolak[0]}`)
  }
  // Pengingat harian (opt-in), dikirim server lewat Web Push pada jam lokal pengguna.
  const [ingat, setIngat] = useState<{ nyala: boolean; jam: string }>({ nyala: false, jam: '19:00' })
  const simpanIngat = (v: { nyala: boolean; jam: string }) => {
    setIngat(v)
    api.saveSettings({ notifCekHarian: v.nyala, cekHarianHHMM: v.jam, tzOffsetMin: -new Date().getTimezoneOffset() })
      .catch(() => setPesan('Could not save the reminder — try again.'))
  }
  useEffect(() => {
    if (!backendEnabled) return
    api.getSettings().then((s) => setIngat({ nyala: s.notifCekHarian === true, jam: typeof s.cekHarianHHMM === 'string' ? s.cekHarianHHMM : '19:00' })).catch(() => {})
    void muat(); void kuras()
    const on = () => void kuras()
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [])
  if (!backendEnabled || rencana.length === 0) return null

  const { plan, dokterEmail, sudah } = rencana[0]
  const jawaban: DailyAnamnesisAnswer[] = Object.entries(jawab).map(([questionId, value]) => ({ questionId, value }))
  let pertanyaan = plan.questions
  try { pertanyaan = buildDailyInterview(plan, new Date(`${hariIni()}T12:00:00Z`).toISOString(), jawaban).questions } catch { /* di luar jendela rencana: tampilkan semua */ }

  const kirim = async () => {
    if (mengirim) return
    const hilang = pertanyaan.filter((q) => q.required && jawab[q.id] === undefined)
    if (hilang.length) { setPesan(`Please answer: ${hilang.map((q) => q.prompt).join(' · ')}`); return }
    setMengirim(true)
    try {
      const b: ButirAntrean = { clientId: buatClientId(), planId: plan.id, scheduledFor: hariIni(), authoredAt: new Date().toISOString(),
        answers: jawaban.filter((a) => pertanyaan.some((q) => q.id === a.questionId)) }
      const r = await kirimAtauAntre(localStorage, b, kirimSatu)
      if (r.status === 'terkirim') { setPesan('Sent to your doctor for review.'); setJawab({}); void muat() }
      else if (r.status === 'diantre') { setPesan('No connection. Saved on this device; it will be sent when you are back online.'); setJawab({}); setAntre(bacaAntrean(localStorage).length) }
      else setPesan(r.pesan)
    } finally {
      setMengirim(false)
    }
  }

  return (
    <section className="kaca rounded-3xl p-3" data-daily-checkin aria-label="Daily check-in">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Daily check-in</h2>
        <span className="t-mikro text-neutral-400">set by {dokterEmail}</span>
      </div>
      {antre > 0 && <p className="t-mikro mt-1 font-bold text-neutral-500" data-antrean-cek>{antre} check-in waiting to send.</p>}
      {!sudah && bacaAntrean(localStorage).some((x) => x.planId === plan.id && x.scheduledFor === hariIni()) ? (
        <p className="t-kecil mt-1 font-bold text-neutral-500">Today's answers are saved on this device and not yet sent to your doctor.</p>
      ) : sudah ? (
        <p className="t-kecil mt-1 font-bold text-brand">Today's check-in is done. Your doctor will review it.</p>
      ) : (
        <div className="mt-2 space-y-2.5">
          {pertanyaan.map((q) => (
            <div key={q.id}>
              <p className="t-kecil font-bold text-ink dark:text-white">{q.prompt}{q.required ? '' : ' (optional)'}</p>
              {q.kind === 'boolean' && (
                <div className="mt-1 flex gap-1.5">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" aria-pressed={jawab[q.id] === v} onClick={() => setJawab((j) => ({ ...j, [q.id]: v }))}
                      className="t-kecil min-h-[40px] rounded-full border px-4 font-bold">{v ? 'Yes' : 'No'}</button>
                  ))}
                </div>
              )}
              {q.kind === 'choice' && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(q.choices ?? []).map((c) => (
                    <button key={c} type="button" aria-pressed={jawab[q.id] === c} onClick={() => setJawab((j) => ({ ...j, [q.id]: c }))}
                      className="t-kecil min-h-[40px] rounded-full border px-3 font-bold">{c}</button>
                  ))}
                </div>
              )}
              {q.kind === 'number' && (
                <input inputMode="decimal" aria-label={q.prompt} onChange={(e) => { const n = Number(e.target.value.replace(',', '.')); setJawab((j) => { const k = { ...j }; if (e.target.value.trim() && Number.isFinite(n)) k[q.id] = n; else delete k[q.id]; return k }) }}
                  className="t-kecil mt-1 w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white" placeholder={q.unit ?? ''} />
              )}
              {q.kind === 'text' && (
                <textarea rows={2} maxLength={1000} aria-label={q.prompt} onChange={(e) => setJawab((j) => { const k = { ...j }; if (e.target.value.trim()) k[q.id] = e.target.value.trim(); else delete k[q.id]; return k })}
                  className="t-kecil mt-1 w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white" />
              )}
            </div>
          ))}
          <button type="button" disabled={mengirim} aria-busy={mengirim} onClick={() => void kirim()}
            className="t-kecil min-h-[44px] w-full rounded-xl bg-brand font-bold text-white disabled:opacity-60">{mengirim ? 'Sending…' : 'Send to my doctor'}</button>
        </div>
      )}
      <label className="t-mikro mt-2 flex items-center justify-between gap-2 text-neutral-500" data-pengingat-cek>
        <span>Remind me daily if I haven't checked in</span>
        <span className="flex items-center gap-2">
          <input type="time" value={ingat.jam} aria-label="Check-in reminder time" onChange={(e) => simpanIngat({ ...ingat, jam: e.target.value })}
            className="rounded-lg border border-neutral-200 bg-transparent px-1.5 py-1 tabular-nums dark:border-white/12" />
          <input type="checkbox" checked={ingat.nyala} aria-label="Daily check-in reminder" onChange={(e) => simpanIngat({ ...ingat, nyala: e.target.checked })} />
        </span>
      </label>
      {pesan && <p role="status" className="t-mikro mt-1.5 font-bold text-neutral-500">{pesan}</p>}
      <p className="t-mikro mt-1.5 text-neutral-400">Not an emergency service — if you feel very unwell, call 119 or go to the nearest emergency room.</p>
    </section>
  )
}

export default CekHarian
