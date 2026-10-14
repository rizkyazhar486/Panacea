import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, backendEnabled } from '../../lib/api'
import { parseLabResults, type LabResultRecord } from '../../domains/lab-results'
import { IconEMR } from '../icons'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  received: { label: 'Diterima', badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800' },
  pending_review: { label: 'Menunggu Telaah', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  reviewed: { label: 'Ditelaah Dokter', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' },
  communicated: { label: 'Telah Dikomunikasikan', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  closed: { label: 'Selesai (Closed)', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
}

export function RecentLabClosureCard() {
  const [records, setRecords] = useState<LabResultRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!backendEnabled) {
      setLoading(false)
      return
    }

    api.labResultsList()
      .then((raw) => {
        if (!active) return
        const parsed = parseLabResults(raw)
        if (parsed.ok) {
          setRecords(parsed.records.slice(0, 4))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm transition-all dark:border-white/10 dark:bg-[#0c1017]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-neutral-200">
            <IconEMR size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hasil Lab & Diagnostik</h3>
            <span className="text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              Pemeriksaan Terverifikasi
            </span>
          </div>
        </div>
        <Link
          to="/lab-results"
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
        >
          Buka Semua →
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Memeriksa catatan lab...</div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center dark:border-white/5 dark:bg-white/[.02]">
          <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Semua hasil lab telah ditelaah klinisi
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tidak ada tindak lanjut lab yang tertunda saat ini.
          </p>
          <div className="mt-3.5 flex justify-center gap-2">
            <Link
              to="/lab-results"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              + Input Lab Baru
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {records.map((r) => {
            const statusCfg = STATUS_CONFIG[r.status] ?? { label: r.status, badge: 'bg-slate-100 text-slate-700 border-slate-200' }
            const val = r.item.value != null ? `${r.item.value} ${r.item.unit ?? ''}`.trim() : (r.item.valueText ?? '—')
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/40"
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{r.item.name}</div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Nilai: <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
                  </div>
                </div>
                <span className={`inline-block shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCfg.badge}`}>
                  {statusCfg.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
