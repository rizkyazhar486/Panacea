import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import {
  IconBook,
  IconChat,
  IconEMR,
  IconHeart,
  IconMoon,
  IconPlan,
  IconSettings,
  IconSparkle,
  IconStore,
  IconUser,
  IconUsers,
  IconWallet,
} from '../components/icons'

type Tile = {
  label: string
  to: string
  icon: typeof IconUsers
  tone: string
  meta: string
}

const PERSONAL_TILES: Tile[] = [
  { label: 'Social', to: '/?t=social', icon: IconUsers, tone: 'from-rose-400/22 via-fuchsia-400/[.08] to-transparent', meta: 'Feed' },
  { label: 'Community', to: '/?t=community', icon: IconHeart, tone: 'from-cyan-400/22 via-blue-400/[.08] to-transparent', meta: 'People' },
  { label: 'Clubs', to: '/?t=clubs', icon: IconSparkle, tone: 'from-violet-400/22 via-indigo-400/[.08] to-transparent', meta: 'Groups' },
  { label: 'Faith', to: '/?t=religion', icon: IconMoon, tone: 'from-emerald-400/22 via-teal-400/[.08] to-transparent', meta: 'Practice' },
  { label: 'Finance', to: '/?t=finance', icon: IconWallet, tone: 'from-amber-300/22 via-orange-400/[.08] to-transparent', meta: 'Money' },
  { label: 'Markets', to: '/?t=markets', icon: IconStore, tone: 'from-sky-400/22 via-cyan-400/[.08] to-transparent', meta: 'Track' },
]

const INTELLIGENCE_TILES: Tile[] = [
  { label: 'Ask Panacea', to: '/chatbot', icon: IconChat, tone: 'from-cyan-300/24 via-blue-500/[.09] to-transparent', meta: 'AI' },
  { label: 'AI-EMR', to: '/emr', icon: IconEMR, tone: 'from-violet-300/24 via-fuchsia-500/[.08] to-transparent', meta: 'Record' },
  { label: 'Care', to: '/care-episode', icon: IconPlan, tone: 'from-emerald-300/24 via-teal-500/[.08] to-transparent', meta: 'Episode' },
  { label: 'Materials', to: '/my-materials', icon: IconBook, tone: 'from-amber-300/24 via-orange-500/[.08] to-transparent', meta: 'Library' },
]

function TileCard({ tile }: { tile: Tile }) {
  const Icon = tile.icon
  return (
    <Link
      to={tile.to}
      className={`liquid-action liquid-glass liquid-spectral-edge group relative min-h-[116px] overflow-hidden rounded-[24px] bg-gradient-to-br ${tile.tone} p-4`}
      aria-label={`${tile.label} — ${tile.meta}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="liquid-lens grid h-11 w-11 place-items-center rounded-[16px] text-white" aria-hidden>
          <Icon size={20} />
        </span>
        <span className="text-sm text-white/32 transition group-hover:translate-x-0.5 group-hover:text-white/70" aria-hidden>↗</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-2">
        <span className="truncate text-[15px] font-black tracking-[-.02em] text-white">{tile.label}</span>
        <span className="shrink-0 text-[9px] font-black uppercase tracking-[.16em] text-white/38">{tile.meta}</span>
      </div>
    </Link>
  )
}

export function ForYouHub() {
  const { account } = useStore()
  const name = account?.name?.trim().split(/\s+/)[0] || 'You'

  return (
    <main className="space-y-5 pb-28 text-white" aria-label="For You super page">
      <section className="liquid-glass-strong liquid-spectral-edge overflow-hidden rounded-[30px] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-100/55">For You</div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">{name}'s space</h1>
          </div>
          <Link to="/profile" className="liquid-lens grid h-14 w-14 shrink-0 place-items-center rounded-full" aria-label="Open account">
            <IconUser size={22} />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Link to="/messages" className="liquid-action rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-center text-[11px] font-black text-white/75">Messages</Link>
          <Link to="/notifikasi" className="liquid-action rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-center text-[11px] font-black text-white/75">Alerts</Link>
          <Link to="/settings" className="liquid-action flex items-center justify-center gap-1.5 rounded-[18px] border border-white/[.08] bg-white/[.035] px-3 py-3 text-[11px] font-black text-white/75"><IconSettings size={14} />Settings</Link>
        </div>
      </section>

      <section aria-label="Personal spaces">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[.15em] text-white/50">Life</h2>
          <span className="text-[10px] font-black text-cyan-100/45">6 spaces</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PERSONAL_TILES.map((tile) => <TileCard key={tile.label} tile={tile} />)}
        </div>
      </section>

      <section aria-label="Personal intelligence">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[.15em] text-white/50">Intelligence</h2>
          <span className="text-[10px] font-black text-violet-100/45">4 tools</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INTELLIGENCE_TILES.map((tile) => <TileCard key={tile.label} tile={tile} />)}
        </div>
      </section>
    </main>
  )
}

export default ForYouHub
