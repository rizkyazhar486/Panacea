import { useEffect, useState } from 'react'
import { api, backendEnabled, type IzinLabKlien } from '../lib/api'

// Pasien memberi satu dokter akses baca ke riwayat labnya untuk waktu terbatas,
// melihat siapa yang sudah membukanya, dan dapat mencabutnya kapan saja.
// Tanpa backend (demo) komponen ini tidak dirender: berbagi butuh server.
export function BagikanLabKeDokter() {
  const [izin, setIzin] = useState<IzinLabKlien[]>([])
  const [audit, setAudit] = useState<{ waktu: string; aktor: string; aksi: string }[]>([])
  const [email, setEmail] = useState('')
  const [hari, setHari] = useState(30)
  const [pesan, setPesan] = useState<string | null>(null)
  const muat = () => api.getLabShares().then((r) => { setIzin(r.shares); setAudit(r.audit) }).catch(() => setPesan('Could not load sharing — sign in again.'))
  useEffect(() => { if (backendEnabled) void muat() }, [])
  if (!backendEnabled) return null

  const aktif = izin.filter((i) => !i.dicabut && Date.parse(i.berakhir) > Date.now())
  const bagikan = async () => {
    try { await api.shareLab(email, hari); setEmail(''); setPesan(`Shared with ${email.trim()} for ${hari} days.`); void muat() }
    catch (e) { setPesan((e as Error).message) }
  }
  const aksi: Record<string, string> = { 'izin-dibuat': 'Access granted', 'izin-dicabut': 'Access revoked', 'dibaca-dokter': 'Viewed by' }

  return (
    <details className="mt-3 border-t border-neutral-100 pt-2 dark:border-white/10" data-lab-share>
      <summary className="t-kecil cursor-pointer font-bold text-brand">Share with your doctor{aktif.length ? ` · ${aktif.length} active` : ''}</summary>
      <div className="mt-2 space-y-2">
        <div className="flex gap-1.5">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Doctor's email" aria-label="Doctor's email"
            className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white" />
          <select value={hari} onChange={(e) => setHari(Number(e.target.value))} aria-label="Access length"
            className="t-kecil rounded-xl border border-neutral-200 bg-transparent px-2 text-ink dark:border-white/12 dark:text-white">
            <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
          </select>
          <button type="button" onClick={() => void bagikan()} className="t-kecil shrink-0 rounded-xl bg-brand px-3 font-bold text-white">Share</button>
        </div>
        {pesan && <p role="status" className="t-mikro font-bold text-neutral-500">{pesan}</p>}
        <p className="t-mikro leading-snug text-neutral-400">Read-only. The doctor must be a verified clinician on Panaceamed; every view is logged below.</p>
        {aktif.map((i) => (
          <div key={i.id} className="t-kecil flex min-h-[40px] items-center justify-between gap-2">
            <span className="min-w-0 truncate">{i.dokterEmail} · until {i.berakhir.slice(0, 10)}</span>
            <button type="button" className="t-mikro min-h-[36px] px-2 font-bold text-red-500"
              onClick={() => void api.revokeLabShare(i.id).then(muat).catch((e) => setPesan((e as Error).message))}>Revoke</button>
          </div>
        ))}
        {audit.length > 0 && (
          <ul className="t-mikro space-y-0.5 text-neutral-500" aria-label="Access history">
            {audit.slice(0, 8).map((a, k) => <li key={k}>{a.waktu.slice(0, 16).replace('T', ' ')} · {aksi[a.aksi] ?? a.aksi}{a.aksi === 'dibaca-dokter' ? ` ${a.aktor}` : ''}</li>)}
          </ul>
        )}
      </div>
    </details>
  )
}

export default BagikanLabKeDokter
