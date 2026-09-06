import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { TOPICS, TIER_LABEL, type Topic, type Tier } from '../lib/learn'
import { Ringkas, Poin } from '../components/Ringkas'

const PILLARS = [
  { id: 'money', emoji: '💰', title: 'Money', line: 'Income, ownership, resilience and enough.', to: '/keuangan', tone: 'bg-lime-100 text-lime-900 dark:bg-lime-400/15 dark:text-lime-100' },
  { id: 'career', emoji: '🏆', title: 'Role & career', line: 'Skill, responsibility, reputation and contribution.', to: '/planning', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-100' },
  { id: 'family', emoji: '🏡', title: 'Family', line: 'Presence, trust, care, partnership and legacy.', to: '/my-story', tone: 'bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100' },
  { id: 'time', emoji: '⏳', title: 'Time', line: 'Attention, autonomy, energy and usable years.', to: '/life-compass', tone: 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-100' },
  { id: 'health', emoji: '❤️', title: 'Health', line: 'Capacity to move, think, recover and stay independent.', to: '/tubuh', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100' },
  { id: 'social', emoji: '🤝', title: 'Social', line: 'Friends, community, belonging and reciprocity.', to: '/community', tone: 'bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-100' },
] as const

type LibraryType = 'All' | 'Story' | 'Folklore' | 'Film' | 'Self-help' | 'Money'
type LifeItem = {
  title: string
  type: Exclude<LibraryType, 'All'>
  emoji: string
  lesson: string
  source: string
  action: string
  to: string
  pillars: string[]
}

const LIFE_ITEMS: LifeItem[] = [
  { title: 'The Ant and the Grasshopper', type: 'Folklore', emoji: '🐜', lesson: 'Preparation creates options. Small reserves built in easy seasons can protect dignity and time when conditions change.', source: 'Aesop tradition', action: 'Build a buffer', to: '/keuangan', pillars: ['money', 'time'] },
  { title: 'The Boy Who Cried Wolf', type: 'Folklore', emoji: '🐺', lesson: 'Trust is capital. Attention gained cheaply can become expensive when the people around you stop believing you.', source: 'Aesop tradition', action: 'Reflect on trust', to: '/my-story', pillars: ['social', 'career'] },
  { title: 'The Bamboo Cutter', type: 'Folklore', emoji: '🎋', lesson: 'Not everything valuable can be possessed or kept. Meaning can come from how we care for a temporary chapter.', source: 'Japanese folklore', action: 'Write the chapter', to: '/my-story', pillars: ['family', 'time'] },
  { title: 'Sisyphus', type: 'Story', emoji: '🪨', lesson: 'Repeated effort can feel absurd when the goal is disconnected from meaning. Ask whether the hill is worth climbing before optimizing the climb.', source: 'Greek myth', action: 'Review your direction', to: '/life-compass', pillars: ['time', 'career'] },
  { title: 'Odysseus and the long return', type: 'Story', emoji: '⛵', lesson: 'A long journey is not only about arriving. Identity is shaped by restraint, alliances, mistakes and the people you return to.', source: 'Greek epic tradition', action: 'Map your long game', to: '/planning', pillars: ['family', 'social', 'career'] },
  { title: 'It’s a Wonderful Life', type: 'Film', emoji: '🎬', lesson: 'A life can look financially unsuccessful while being rich in relationships, contribution and people whose lives changed because you existed.', source: 'Film reflection', action: 'Map social wealth', to: '/community', pillars: ['social', 'family'] },
  { title: 'Ikiru', type: 'Film', emoji: '🎞️', lesson: 'Limited time can clarify what deserves action. Status and bureaucracy matter less when purpose becomes concrete and useful to other people.', source: 'Film reflection', action: 'Choose one useful act', to: '/life-compass', pillars: ['time', 'career', 'social'] },
  { title: 'The Pursuit of Happyness', type: 'Film', emoji: '🎥', lesson: 'Persistence matters, but scarcity also consumes attention and time. Financial resilience is valuable because it protects choices, not because money is the whole score.', source: 'Film reflection', action: 'Strengthen resilience', to: '/keuangan', pillars: ['money', 'family', 'career'] },
  { title: 'Systems over wishes', type: 'Self-help', emoji: '⚙️', lesson: 'Repeated environments and routines usually matter more than occasional motivation. Make the useful action easier to start and the harmful one harder to reach.', source: 'Habit-design synthesis', action: 'Plan one system', to: '/planning', pillars: ['time', 'health', 'career'] },
  { title: 'Meaning before optimization', type: 'Self-help', emoji: '🧭', lesson: 'Efficiency without direction only helps you move faster toward a destination you may not want. Define the life first, then optimize the calendar.', source: 'Purpose and time-management synthesis', action: 'Open Life Compass', to: '/life-compass', pillars: ['time', 'career'] },
  { title: 'Relationships need deposits', type: 'Self-help', emoji: '🫶', lesson: 'Strong relationships are usually built through many ordinary acts of reliability, attention and repair—not only dramatic moments.', source: 'Relationship-skills synthesis', action: 'Reach out to someone', to: '/community', pillars: ['family', 'social'] },
  { title: 'The Psychology of Money', type: 'Money', emoji: '🧠', lesson: 'Financial outcomes depend on behavior as well as knowledge. Room for error, patience and avoiding ruin can matter more than looking brilliant.', source: 'Book reflection', action: 'Review money habits', to: '/keuangan', pillars: ['money', 'time'] },
  { title: 'The Millionaire Next Door', type: 'Money', emoji: '🏘️', lesson: 'Visible consumption and actual wealth are different things. What you keep and own can matter more than what other people can see you spend.', source: 'Book reflection', action: 'Check net worth', to: '/keuangan', pillars: ['money'] },
  { title: 'Investing is delayed consumption', type: 'Money', emoji: '📈', lesson: 'Investing exchanges some consumption today for the possibility of more future options. Risk, fees, diversification and time horizon belong in the same decision.', source: 'Investment-literacy principle', action: 'Open Finance', to: '/keuangan', pillars: ['money', 'time'] },
  { title: 'Career capital compounds too', type: 'Self-help', emoji: '🧱', lesson: 'Rare useful skills, evidence of good work, trust and relationships can compound across years just like financial assets.', source: 'Career-development synthesis', action: 'Plan the next skill', to: '/planning', pillars: ['career', 'money', 'social'] },
]

const FILTERS: LibraryType[] = ['All', 'Story', 'Folklore', 'Film', 'Self-help', 'Money']

export function Learn() {
  const [buka, setBuka] = useState<Topic | null>(null)
  const [filter, setFilter] = useState<LibraryType>('All')

  const lifeItems = useMemo(() => filter === 'All' ? LIFE_ITEMS : LIFE_ITEMS.filter((item) => item.type === filter), [filter])

  if (buka) return <TopicView topic={buka} onClose={() => setBuka(null)} />

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <SectionTitle
        icon={<IconChartUp />}
        title="Panacea Life Library"
        subtitle="Panacea is medicine for life: money, career, family, time, health and social connection—not the body alone."
      />

      <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-gradient-to-br from-white via-amber-50/70 to-sky-50/80 p-5 shadow-[0_20px_55px_rgba(20,35,45,.07)] dark:border-white/10 dark:from-[#111315] dark:via-[#15130d] dark:to-[#0c1419] sm:p-6">
        <div className="max-w-3xl">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">A broader definition of wealth</div>
          <h1 className="mt-2 text-[clamp(1.8rem,5vw,3.6rem)] font-black leading-[.98] tracking-[-.045em] text-neutral-950 dark:text-white">A rich life is a portfolio, not one score.</h1>
          <p className="panacea-reading-copy mt-3 text-[13px] font-medium text-neutral-700 dark:text-neutral-300">Money can buy options but not replace time. Rank can create influence but not family. Health creates capacity but does not automatically create belonging. Panacea keeps the six forms visible together so one success does not quietly bankrupt another.</p>
        </div>

        <div className="no-scrollbar -mx-1 mt-5 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {PILLARS.map((pillar) => (
            <Link key={pillar.id} to={pillar.to} className="w-[178px] shrink-0 snap-start active:scale-[.98]">
              <article className={`min-h-[138px] rounded-[24px] p-4 shadow-sm ${pillar.tone}`}>
                <div className="text-2xl" aria-hidden>{pillar.emoji}</div>
                <div className="mt-4 text-[14px] font-black leading-none">{pillar.title}</div>
                <p className="mt-2 text-[10px] font-semibold leading-snug opacity-75">{pillar.line}</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-lime-700 dark:text-lime-300">Money literacy, without pretending money is everything</div>
            <h2 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Three simple numbers before complicated investing</h2>
          </div>
          <Link to="/keuangan" className="rounded-full bg-lime-100 px-3 py-2 text-[10px] font-black text-lime-900 dark:bg-lime-400/15 dark:text-lime-100">Open Finance ›</Link>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-2xl bg-neutral-50 p-3.5 dark:bg-white/[.045]"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Net worth</div><div className="mt-2 text-[13px] font-black text-neutral-950 dark:text-white">Assets − liabilities</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">What you own after what you owe.</p></div>
          <div className="rounded-2xl bg-neutral-50 p-3.5 dark:bg-white/[.045]"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Savings rate</div><div className="mt-2 text-[13px] font-black text-neutral-950 dark:text-white">(Income − spending) ÷ income × 100%</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">How much current income becomes future options.</p></div>
          <div className="rounded-2xl bg-neutral-50 p-3.5 dark:bg-white/[.045]"><div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Time budget</div><div className="mt-2 text-[13px] font-black text-neutral-950 dark:text-white">168 h/week − obligations</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Money decisions should be judged partly by the time they buy or consume.</p></div>
        </div>
      </Card>

      <section>
        <div className="mb-2 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Stories that teach</div>
            <h2 className="mt-0.5 text-lg font-black text-neutral-950 dark:text-white">Literature, folklore, film and self-help as life tools</h2>
          </div>
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Summaries, not excerpts</span>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
          {FILTERS.map((name) => (
            <button key={name} onClick={() => setFilter(name)} className={`shrink-0 rounded-full px-3.5 py-2 text-[10px] font-black ${filter === name ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10'}`}>{name}</button>
          ))}
        </div>
        <div className="no-scrollbar -mx-1 mt-2 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
          {lifeItems.map((item) => (
            <article key={item.title} className="panacea-readable-card flex min-h-[232px] w-[236px] shrink-0 snap-start flex-col rounded-[26px] border p-4 shadow-[0_12px_32px_rgba(20,35,45,.07)]">
              <div className="flex items-start justify-between gap-2"><span className="text-2xl" aria-hidden>{item.emoji}</span><span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">{item.type}</span></div>
              <h3 className="mt-3 text-[14px] font-black leading-tight text-neutral-950 dark:text-white">{item.title}</h3>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{item.source}</div>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-neutral-700 dark:text-neutral-300">{item.lesson}</p>
              <div className="mt-3 flex flex-wrap gap-1">{item.pillars.map((p) => <span key={p} className="rounded-full bg-neutral-100 px-2 py-1 text-[8px] font-black uppercase text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{p}</span>)}</div>
              <Link to={item.to} className="mt-auto pt-4 text-[10px] font-black text-brand-dark dark:text-emerald-300">{item.action} →</Link>
            </article>
          ))}
        </div>
      </section>

      <details className="group rounded-[28px] border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-white/10 dark:bg-[#111315] sm:p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Health evidence library</div>
            <div className="mt-1 text-[17px] font-black text-neutral-950 dark:text-white">Keep the original evidence-based health learning</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">Claims still show evidence strength and what would change the conclusion.</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
        </summary>

        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-white/10">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TIER_LABEL) as Tier[]).map((t) => (
              <span key={t} className={`keping-tier keping-tier--${t} rounded-full px-2 py-0.5 text-[10px] font-black uppercase`}>{TIER_LABEL[t].label}</span>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <button key={t.id} onClick={() => setBuka(t)} className="panacea-readable-card w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-2xl" aria-hidden>{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-black text-neutral-950 dark:text-white">{t.title}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">{t.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className="text-[9px] font-bold text-neutral-500">{t.minutes} min read</span>{ringkasTier(t).map((r) => <span key={r.tier} className={`keping-tier keping-tier--${r.tier} rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase`}>{r.n} {r.tier}</span>)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </details>

      <Ringkas ikon="ℹ️" judul="How to use this library" anak={<div className="space-y-1.5"><Poin ikon="🧭">Use stories as prompts for reflection, not as proof.</Poin><Poin ikon="💰">Investment material is education, not a personalized buy/sell instruction.</Poin><Poin ikon="🩺">Health evidence keeps its original uncertainty labels and clinical boundaries.</Poin></div>} />
    </div>
  )
}

function inti(teks: string): string {
  const m = teks.match(/^[\s\S]*?[.!?](?=\s|$)/)
  const kalimat = m?.[0]?.trim()
  if (!kalimat || kalimat.length > 220) return teks
  return kalimat
}

function ringkasTier(t: Topic): { tier: Tier; n: number }[] {
  const hitung = new Map<Tier, number>()
  for (const s of t.sections) hitung.set(s.tier, (hitung.get(s.tier) ?? 0) + 1)
  return (['strong', 'moderate', 'weak'] as Tier[]).filter((x) => hitung.has(x)).map((x) => ({ tier: x, n: hitung.get(x)! }))
}

function TopicView({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Life Library
      </button>
      <div><div className="flex items-center gap-2"><span className="text-3xl" aria-hidden>{topic.icon}</span><h2 className="text-xl font-black text-ink dark:text-white">{topic.title}</h2></div><p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{topic.summary}</p></div>
      {topic.sections.map((s, i) => (
        <Card key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-[15px] font-black text-ink dark:text-white">{s.heading}</h3><span className={`keping-tier keping-tier--${s.tier} shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase`}>{TIER_LABEL[s.tier].label}</span></div>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-ink dark:text-white">{inti(s.body)}</p>
          <div className="mt-2 space-y-1.5"><Ringkas ikon="📖" judul="Read the full explanation" anak={<p className="leading-relaxed">{s.body}</p>} /><Ringkas ikon="⚠️" nada="hati-hati" judul="What would change this" anak={<p className="leading-relaxed">{s.caveat}</p>} /></div>
        </Card>
      ))}
      <Card className="!border-brand/30 !bg-brand/5"><div className="text-[10px] font-black uppercase tracking-wide text-brand">Takeaway</div><p className="mt-1 text-[13px] leading-relaxed text-ink dark:text-white">{topic.takeaway}</p></Card>
      <button onClick={onClose} className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-[13px] font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Back to Life Library</button>
    </div>
  )
}

export default Learn
