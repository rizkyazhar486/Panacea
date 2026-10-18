import { useState } from 'react'
import { Card, SectionTitle, Button } from '../ui'
import { IconDownload, IconCheck } from '../icons'

// Pure reusable UI: only page layer owns Vite lazy page imports.
export type OfflinePage = { label: string; imp: () => Promise<unknown> }
const KEY = 'pmd_offline_ready_v1'

function fmtWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function OfflineReady({ pages }: { pages: readonly OfflinePage[] }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [readyAt, setReadyAt] = useState<string | null>(() => { try { return localStorage.getItem(KEY) } catch { return null } })

  async function prepare() {
    setBusy(true); setDone(0)
    for (let i = 0; i < pages.length; i++) {
      try { await pages[i].imp() } catch { /* halaman ini dicoba lagi lain kali */ }
      setDone(i + 1)
    }
    const now = new Date().toISOString()
    try { localStorage.setItem(KEY, now) } catch { /* ignore */ }
    setReadyAt(now)
    setBusy(false)
  }

  return (
    <Card>
      <SectionTitle icon={<IconDownload size={20} />} title="Offline Mode" subtitle="Save the Fitness features to your phone — they keep working offline" />

      {busy ? (
        <div className="mt-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(done / pages.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">Preparing… {done}/{pages.length}</p>
        </div>
      ) : (
        <>
          <Button onClick={prepare} className="w-full">
            <IconDownload size={16} /> {readyAt ? 'Update Offline Data' : 'Set Up Offline Mode'}
          </Button>
          {readyAt && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
              <IconCheck size={14} /> Ready to use offline — last prepared {fmtWhen(readyAt)}
            </p>
          )}
        </>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-50 p-3">
          <div className="text-xs font-bold text-brand-dark">✓ Works without internet</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            Athlete, Performance Lab, AI Program, Body Composition, Initial Assessment, Science & KPIs, Fitness Test, Logs & Stats —
            all data is stored directly on your phone.
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs font-bold text-neutral-500">○ Needs internet</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            Home (posts), Community, Messages, AI Consultation, Marketplace & AI photo features — because they need a server connection.
          </p>
        </div>
      </div>
    </Card>
  )
}
