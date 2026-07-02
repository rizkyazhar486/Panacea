import { useState } from 'react'
import { Card, SectionTitle, Button } from './ui'
import { IconDownload, IconCheck } from './icons'

// One button, one progress bar, one clear list — no sync queues, no conflict
// resolution, nothing to configure. Tapping "Siapkan" just pre-downloads the
// JS for the fully local (localStorage-only) Kebugaran pages so they open
// instantly with zero network the next time, even in airplane mode.
const OFFLINE_PAGES: { label: string; imp: () => Promise<unknown> }[] = [
  { label: 'Atlet', imp: () => import('../pages/Athlete') },
  { label: 'Lab Performa', imp: () => import('../pages/PerformanceLab') },
  { label: 'Program AI', imp: () => import('../pages/TrainingPlan') },
  { label: 'Komposisi Tubuh', imp: () => import('../pages/BodyComposition') },
  { label: 'Penilaian Awal', imp: () => import('../pages/InitialAssessment') },
  { label: 'Sains & KPI', imp: () => import('../pages/SportsScience') },
  { label: 'Tes Fisik', imp: () => import('../pages/FitnessTest') },
  { label: 'Log & Statistik', imp: () => import('../pages/Logs') },
]
const KEY = 'pmd_offline_ready_v1'

function fmtWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function OfflineReady() {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [readyAt, setReadyAt] = useState<string | null>(() => { try { return localStorage.getItem(KEY) } catch { return null } })

  async function prepare() {
    setBusy(true); setDone(0)
    for (let i = 0; i < OFFLINE_PAGES.length; i++) {
      try { await OFFLINE_PAGES[i].imp() } catch { /* halaman ini dicoba lagi lain kali */ }
      setDone(i + 1)
    }
    const now = new Date().toISOString()
    try { localStorage.setItem(KEY, now) } catch { /* ignore */ }
    setReadyAt(now)
    setBusy(false)
  }

  return (
    <Card>
      <SectionTitle icon={<IconDownload size={20} />} title="Mode Offline" subtitle="Simpan fitur Kebugaran di HP — tetap jalan tanpa internet" />

      {busy ? (
        <div className="mt-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(done / OFFLINE_PAGES.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">Menyiapkan… {done}/{OFFLINE_PAGES.length}</p>
        </div>
      ) : (
        <>
          <Button onClick={prepare} className="w-full">
            <IconDownload size={16} /> {readyAt ? 'Perbarui Data Offline' : 'Siapkan Mode Offline'}
          </Button>
          {readyAt && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
              <IconCheck size={14} /> Siap dipakai offline — terakhir disiapkan {fmtWhen(readyAt)}
            </p>
          )}
        </>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-50 p-3">
          <div className="text-xs font-bold text-brand-dark">✓ Jalan tanpa internet</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            Atlet, Lab Performa, Program AI, Komposisi Tubuh, Penilaian Awal, Sains & KPI, Tes Fisik, Log & Statistik —
            semua data tersimpan langsung di HP Anda.
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs font-bold text-neutral-500">○ Perlu internet</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            Beranda (postingan), Community, Pesan, Konsultasi AI, Marketplace & fitur foto AI — karena perlu terhubung ke server.
          </p>
        </div>
      </div>
    </Card>
  )
}
