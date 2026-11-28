import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface LifestyleSpaceCard {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly category: 'social' | 'hobbies' | 'sports' | 'travel' | 'creativity' | 'productivity'
  readonly accentHex: string
  readonly to: string
  readonly tag: string
}

export const FOR_YOU_LIFESTYLE_SPACES: readonly LifestyleSpaceCard[] = [
  { id: 'social-feed', title: 'Friends & Stories', subtitle: 'Share moments, photos, milestones & everyday reflections.', category: 'social', accentHex: '#38bdf8', to: '/feed', tag: 'Social' },
  { id: 'communities', title: 'Interest Communities', subtitle: 'Books, cinema, coffee, tech, photography & local circles.', category: 'hobbies', accentHex: '#a78bfa', to: '/?t=community', tag: 'Hobbies' },
  { id: 'sports-clubs', title: 'Sports & Running Clubs', subtitle: 'Group rides, weekend 5K clubs, badminton & team streaks.', category: 'sports', accentHex: '#34d399', to: '/?t=clubs', tag: 'Clubs' },
  { id: 'travel-explore', title: 'Travel & Outdoors', subtitle: 'Trail itineraries, city walks, cultural stops & trip notes.', category: 'travel', accentHex: '#fbbf24', to: '/?t=community', tag: 'Explore' },
  { id: 'creative-projects', title: 'Creative & Learning', subtitle: 'Music, writing, design sprints, side projects & notebooks.', category: 'creativity', accentHex: '#f472b6', to: '/?t=learn', tag: 'Create' },
  { id: 'life-planning', title: 'Daily Life & Finance', subtitle: 'Personal goals, budgeting, faith schedule & focus blocks.', category: 'productivity', accentHex: '#fb923c', to: '/?t=finance', tag: 'Life' },
] as const

export default function ForYouLifestyleDeck() {
  const [filter, setFilter] = useState<'all' | LifestyleSpaceCard['category']>('all')
  const [chronologicalOnly, setChronologicalOnly] = useState<boolean>(true)
  const [mutedKeywords, setMutedKeywords] = useState<boolean>(true)

  const visible = filter === 'all'
    ? FOR_YOU_LIFESTYLE_SPACES
    : FOR_YOU_LIFESTYLE_SPACES.filter((item) => item.category === filter)

  return (
    <section
      data-for-you-lifestyle-deck="v1"
      data-medical-records-shared="false"
      data-biometric-twin-shared="false"
      aria-label="For You Non-Clinical Social, Hobbies and Lifestyle Hub"
      className="dark space-y-3 rounded-2xl border border-white/15 bg-[#060811] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-sky-200">
            For You · Non-Medical Social, Hobbies, Travel & Life Spaces
          </div>
          <div className="text-[11px] text-slate-300">
            Everyday human life outside medicine — medical records and digital twin biometrics stay strictly isolated by default.
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[9.5px] font-black text-emerald-200">
          CLINICAL DATA ISOLATED · OFF BY DEFAULT
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1 font-mono text-[9.5px]" role="group" aria-label="Lifestyle discovery filters">
        {(['all', 'social', 'hobbies', 'sports', 'travel', 'creativity', 'productivity'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={filter === cat}
            onClick={() => setFilter(cat)}
            className={`min-h-8 rounded-full border px-2.5 font-black uppercase transition ${
              filter === cat ? 'border-sky-300 bg-sky-500/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Colorful Non-Medical Space Grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((card) => (
          <Link
            key={card.id}
            to={card.to}
            className="flex min-h-[86px] flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/90 p-3 transition hover:border-white/35"
            style={{ borderLeftWidth: 3, borderLeftColor: card.accentHex }}
          >
            <div className="flex items-center justify-between gap-2">
              <strong className="text-xs font-black text-white">{card.title}</strong>
              <span className="rounded-full px-2 py-0.5 font-mono text-[8.5px] font-black text-black" style={{ backgroundColor: card.accentHex }}>
                {card.tag}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-300">{card.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Privacy & Non-Manipulative Feed Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[9.5px]">
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span>EMR / Labs Shared: <strong className="text-emerald-300">NEVER BY DEFAULT</strong></span>
          <span>·</span>
          <span>Twin Biometrics: <strong className="text-emerald-300">PRIVATE</strong></span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={chronologicalOnly}
            onClick={() => setChronologicalOnly((v) => !v)}
            className={`min-h-8 rounded-lg border px-2.5 font-bold ${chronologicalOnly ? 'border-sky-300/60 bg-sky-500/20 text-sky-100' : 'border-white/15 text-slate-400'}`}
          >
            {chronologicalOnly ? 'Calm Chronological Feed: ON' : 'Interest Mix'}
          </button>
          <button
            type="button"
            aria-pressed={mutedKeywords}
            onClick={() => setMutedKeywords((v) => !v)}
            className={`min-h-8 rounded-lg border px-2.5 font-bold ${mutedKeywords ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100' : 'border-white/15 text-slate-400'}`}
          >
            {mutedKeywords ? 'Block/Mute Shield: ACTIVE' : 'Standard Moderation'}
          </button>
        </div>
      </div>
    </section>
  )
}
