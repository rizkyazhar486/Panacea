import { Link } from 'react-router-dom'

// Compact, at-a-glance snapshot of the user's saved health data (from
// /health-data). Reads the same local cache the health page writes and links
// to it. Used on the Profile and the Log & Statistik hub.
export function HealthSnapshot({ className = '' }: { className?: string }) {
  let h: Record<string, unknown> = {}
  try { h = JSON.parse(localStorage.getItem('pmd_health_profile') || '{}') } catch { /* ignore */ }
  const n = (v: unknown) => (typeof v === 'number' && v > 0 ? v : null)
  const stats = [
    { label: 'VO₂max', value: n(h.vo2max), unit: '' },
    { label: 'Resting HR', value: n(h.restingHr), unit: 'bpm' },
    { label: 'HRV', value: n(h.hrvMs), unit: 'ms' },
    { label: 'Sleep', value: n(h.sleepH), unit: 'h' },
  ].filter((s) => s.value != null)
  const src = typeof h.source === 'string' ? h.source : 'Manual'

  return (
    <Link to="/health-data" className={'block rounded-2xl border border-brand/15 bg-brand-50/60 p-3 transition hover:border-brand/30 hover:bg-brand-50 ' + className}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-dark">❤️ Health Data</span>
        <span className="text-[10px] font-semibold text-neutral-400">Source: {src} · Edit →</span>
      </div>
      {stats.length ? (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-black text-ink">{s.value}<span className="text-[9px] font-semibold text-neutral-400">{s.unit}</span></div>
              <div className="text-[9px] text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-neutral-500">No data yet — enter manually or copy from WHOOP / Apple Watch / Garmin.</p>
      )}
    </Link>
  )
}

// Tiny inline badge marking a calculator input as prefilled from /health-data.
export function PrefillBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-dark align-middle" title="Auto-filled from Health Data">
      ❤ auto
    </span>
  )
}

export default HealthSnapshot
