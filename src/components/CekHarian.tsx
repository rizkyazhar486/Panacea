import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { buildDailyInterview, type ContinuousCarePlan, type DailyAnamnesisAnswer } from '../lib/continuousCareOperatingSystem'

// Cek harian yang diatur dokter (Continuous Care). Pertanyaan dan aturannya
// ditulis dokter; halaman ini hanya menampilkan dan mengirim jawaban mentah.
// Ini bukan diagnosis dan bukan layanan darurat.
const hariIni = () => { const d = new Date(); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

export function CekHarian() {
  const [rencana, setRencana] = useState<{ plan: ContinuousCarePlan; dokterEmail: string; sudah: boolean }[]>([])
  const [jawab, setJawab] = useState<Record<string, boolean | number | string>>({})
  const [pesan, setPesan] = useState<string | null>(null)
  const muat = () => api.carePlans().then((r) => setRencana(r.plans.map((x) => ({
    plan: x.plan, dokterEmail: x.dokterEmail, sudah: x.reports.some((l) => l.scheduledFor.slice(0, 10) === hariIni()),
  })))).catch(() => {})
  useEffect(() => { if (backendEnabled) void muat() }, [])
  if (!backendEnabled || rencana.length === 0) return null

  const { plan, dokterEmail, sudah } = rencana[0]
  const jawaban: DailyAnamnesisAnswer[] = Object.entries(jawab).map(([questionId, value]) => ({ questionId, value }))
  let pertanyaan = plan.questions
  try { pertanyaan = buildDailyInterview(plan, new Date(`${hariIni()}T12:00:00Z`).toISOString(), jawaban).questions } catch { /* di luar jendela rencana: tampilkan semua */ }

  const kirim = async () => {
    const hilang = pertanyaan.filter((q) => q.required && jawab[q.id] === undefined)
    if (hilang.length) { setPesan(`Please answer: ${hilang.map((q) => q.prompt).join(' · ')}`); return }
    try {
      await api.submitCareReport(plan.id, hariIni(), jawaban.filter((a) => pertanyaan.some((q) => q.id === a.questionId)))
      setPesan('Sent to your doctor for review.'); setJawab({}); void muat()
    } catch (e) { setPesan((e as Error).message) }
  }

  return (
    <section className="kaca rounded-3xl p-3" data-daily-checkin aria-label="Daily check-in">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Daily check-in</h2>
        <span className="t-mikro text-neutral-400">set by {dokterEmail}</span>
      </div>
      {sudah ? (
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
          <button type="button" onClick={() => void kirim()} className="t-kecil min-h-[44px] w-full rounded-xl bg-brand font-bold text-white">Send to my doctor</button>
        </div>
      )}
      {pesan && <p role="status" className="t-mikro mt-1.5 font-bold text-neutral-500">{pesan}</p>}
      <p className="t-mikro mt-1.5 text-neutral-400">Not an emergency service — if you feel very unwell, call 119 or go to the nearest emergency room.</p>
    </section>
  )
}

export default CekHarian
