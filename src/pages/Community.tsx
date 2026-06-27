import { useStore } from '../lib/store'
import { KomunitasSehat } from './Feed'
import { GpsCompetition } from '../components/GpsCompetition'

// Community — bagian sosial dari aplikasi: Health Buddy, mood & dukungan,
// tantangan kelompok, komunitas olahraga, Circle of Care, dinding terima kasih.
export function Community() {
  const { account } = useStore()
  if (!account) return null
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🫂</span>
        <div>
          <h1 className="text-lg font-black text-ink">Community</h1>
          <p className="text-xs text-neutral-400">Saling dukung untuk hidup lebih sehat</p>
        </div>
      </div>
      <div className="mb-4">
        <GpsCompetition />
      </div>
      <KomunitasSehat viewerEmail={account.email} viewerName={account.name} />
    </div>
  )
}
