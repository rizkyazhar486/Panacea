import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, Field, inputClass } from '../components/ui'
import {
  IconHome,
  IconUsers,
  IconSearch,
  IconUser,
  IconPlus,
  IconRun,
  IconDrop,
  IconFlame,
  IconLeaf,
  IconArticle,
  IconComment,
  IconMoon,
  IconVideo,
  IconHeart,
  IconRepost,
  IconBookmark,
  IconLock,
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { uploadOrLocal } from '../lib/upload'
import type { SocialPost, PostType, Role, ProfileEdit } from '../lib/types'

const ACTIVITIES = ['Lari', 'Jalan kaki', 'Berenang', 'Bersepeda', 'Padel', 'Futsal', 'Yoga', 'Gym', 'Menyapu']
const COLORS = ['#00BF63', '#0B7A4B', '#3b82f6', '#8b5cf6', '#f59e0b', '#FF3131']
const SONGS = ['Tanpa musik', 'Life is Art', 'Moments In Time', 'Morning Light', 'Calm Vibes', 'Sehat Selalu (Lo-fi)']

const roleLabel: Record<Role, string> = {
  pasien: 'Pelanggan', dokter: 'Dokter', kontributor: 'Kontributor', verifikator: 'Verifikator', admin: 'Admin', owner: 'Owner',
}

type Tab = 'home' | 'friends' | 'search' | 'profile'

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} mnt`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam`
  return `${Math.floor(h / 24)} hari`
}

function initials(name: string): string {
  const parts = name.replace(/^(Bpk\.|Ibu|Sdr\.|An\.|dr\.|Prof\.)\s*/i, '').trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

interface Profile { email: string; name: string; role: Role; color: string; posts: number }

const SubCtx = createContext<{ subscribed: Set<string>; price: number; subscribe: (email: string) => Promise<boolean> }>({
  subscribed: new Set(),
  price: 100,
  subscribe: async () => false,
})

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function ColoredIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ color, display: 'inline-flex' }}>{children}</span>
}

function isImg(s: string): boolean {
  return s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('http')
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}

/* ═══════════════════════════════════════════
   MINI LONGEVITY RING
   ═══════════════════════════════════════════ */

function MiniRing({ score, size = 56 }: { score: number; size?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => { const t = setTimeout(() => setV(score), 300); return () => clearTimeout(t) }, [score])
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const off = c - (v / 100) * c
  const col = score >= 70 ? '#00BF63' : score >= 45 ? '#f59e0b' : '#FF3131'
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ filter: `drop-shadow(0 0 10px ${col}44)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   SHARE MODAL
   ═══════════════════════════════════════════ */

function ShareModal({
  score,
  pillars,
  onClose,
  onShareFeed,
  onShareExternal,
}: {
  score: number
  pillars: { meals: number; exercise: number; hydration: number; sleep: number; sun: number }
  onClose: () => void
  onShareFeed: () => void
  onShareExternal: () => void
}) {
  const [shared, setShared] = useState<'feed' | 'copy' | ''>('')

  const defs = [
    { label: 'Makan', emoji: '🍽️', value: pillars.meals, color: '#f59e0b' },
    { label: 'Olahraga', emoji: '🏃', value: pillars.exercise, color: '#f97316' },
    { label: 'Hidrasi', emoji: '💧', value: pillars.hydration, color: '#2563eb' },
    { label: 'Tidur', emoji: '🌙', value: pillars.sleep, color: '#818cf8' },
    { label: 'Matahari', emoji: '☀️', value: pillars.sun, color: '#eab308' },
  ]

  const band = score >= 80 ? 'Sangat Baik 🌟' : score >= 60 ? 'Cukup Baik 👍' : score >= 40 ? 'Perlu Perbaikan 💪' : 'Mulai dari Langkah Kecil'
  const ringColor = score >= 60 ? '#00BF63' : score >= 30 ? '#f59e0b' : '#FF3131'
  const ringR = 28
  const ringC = 2 * Math.PI * ringR
  const ringOff = ringC * (1 - score / 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-sm" style={{ animation: 'scaleIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden rounded-3xl text-white" style={{ background: 'linear-gradient(155deg, #0B7A4B 0%, #064e36 40%, #0a2f1f 100%)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
          <div className="absolute right-2 top-2 opacity-[0.04]">
            <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeWidth="2" /><circle cx="40" cy="40" r="28" fill="none" stroke="white" strokeWidth="1.5" /><circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="1" /></svg>
          </div>
          <div className="absolute -left-4 -bottom-4 opacity-[0.03]">
            <svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" /></svg>
          </div>

          <div className="relative px-6 pt-6 pb-5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Longevity Score</span>
              <span className="text-[9px] text-white/20">•</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="mt-3 flex items-center gap-5">
              <div className="relative shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r={ringR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle cx="36" cy="36" r={ringR} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringOff} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${ringColor}66)` }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums">{score}</span>
              </div>
              <div>
                <div className="text-3xl font-black leading-none tabular-nums">{score}<span className="text-base font-medium text-white/30">/100</span></div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: ringColor, boxShadow: `0 0 6px ${ringColor}` }} />
                  <span className="text-[11px] font-semibold text-white/80">{band}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

          <div className="px-6 py-5 space-y-3">
            {defs.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm">{p.emoji}</span>
                <span className="w-[62px] text-[10px] font-semibold text-white/40">{p.label}</span>
                <div className="h-[7px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: `linear-gradient(90deg, ${p.color}cc, ${p.color})`, boxShadow: `0 0 10px ${p.color}33` }} />
                </div>
                <span className="w-8 text-right text-[12px] font-extrabold tabular-nums" style={{ color: p.color }}>{p.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t px-6 py-3.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-wider text-white/25">PANACEA</span>
              <span className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(0,191,99,0.5)' }}>MED</span>
            </div>
            <span className="text-[10px] font-mono text-white/20">.id</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => { onShareFeed(); setShared('feed'); setTimeout(() => { setShared(''); onClose() }, 1500) }} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-[12px] font-bold text-white transition-all duration-200 active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 6px 20px rgba(0,191,99,0.3)' }}>
            {shared === 'feed' ? <><span className="text-base">✓</span> Dibagikan!</> : <><span className="text-base">📣</span> Ke Feed</>}
          </button>
          <button onClick={() => { onShareExternal(); setShared('copy'); setTimeout(() => setShared(''), 2500) }} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 text-[12px] font-bold transition-all duration-200 active:scale-[0.97]" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            {shared === 'copy' ? <><span className="text-base">✓</span> Disalin!</> : <><span className="text-base">🔗</span> Ke Medsos</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN FEED
   ═══════════════════════════════════════════ */

export function Feed() {
  const store = useStore()
  const { state, account } = store
  const [tab, setTab] = useState<Tab>('home')
  const [compose, setCompose] = useState(false)
  const [viewProfile, setViewProfile] = useState<string | null>(null)
  const [viewPost, setViewPost] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())
  const [subPrice, setSubPrice] = useState(100)
  const me = account?.email ?? 'me@panaceamed.id'

  useEffect(() => {
    if (!backendEnabled) return
    api.creatorSubs().then((r: { authors: string[]; price: number }) => {
      setSubscribed(new Set(r.authors.map((a) => a.toLowerCase())))
      setSubPrice(r.price)
    }).catch(() => {})
  }, [])

  async function subscribe(email: string): Promise<boolean> {
    try {
      const r: { balance: number } = await api.creatorSubscribe(email)
      setSubscribed((s) => new Set(s).add(email.toLowerCase()))
      store.syncWalletBalance(r.balance)
      return true
    } catch { return false }
  }

  function onCreate(p: SocialPost) {
    store.addPost(p)
    if (backendEnabled) api.createPost({ activity: p.activity, caption: p.caption, kind: p.kind, mediaColor: p.mediaColor }).catch(() => {})
    setCompose(false)
    setTab('profile')
  }

  const activePost = viewPost ? state.posts.find((p) => p.id === viewPost) : null

  return (
    <SubCtx.Provider value={{ subscribed, price: subPrice, subscribe }}>
    <div className="relative pb-24">
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex items-center justify-center gap-1 border-b px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderColor: 'rgba(0,0,0,0.04)' }}>
        <TabBtn icon={<IconHome size={17} />} label="Home" active={tab === 'home'} onClick={() => { setTab('home'); setViewProfile(null) }} />
        <TabBtn icon={<IconUsers size={17} />} label="Friends" active={tab === 'friends'} onClick={() => { setTab('friends'); setViewProfile(null) }} />
        <TabBtn icon={<IconSearch size={17} />} label="Search" active={tab === 'search'} onClick={() => { setTab('search'); setViewProfile(null) }} />
        <TabBtn icon={<IconUser size={17} />} label="Profil" active={tab === 'profile'} onClick={() => { setTab('profile'); setViewProfile(null) }} />
      </div>

      {viewProfile ? (
        <PublicProfile email={viewProfile} onBack={() => setViewProfile(null)} onOpen={(id) => setViewPost(id)} />
      ) : (
        <>
          {tab === 'home' && <HomeFeed me={me} onProfile={setViewProfile} />}
          {tab === 'friends' && <FriendsView me={me} onProfile={setViewProfile} />}
          {tab === 'search' && <SearchView me={me} onProfile={setViewProfile} onOpen={setViewPost} />}
          {tab === 'profile' && <ProfileView me={me} name={account?.name ?? 'Saya'} role={account?.role ?? 'pasien'} onOpen={setViewPost} />}
        </>
      )}

      <button onClick={() => setCompose(true)} className="fixed bottom-6 left-6 z-30 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 lg:left-[17rem]" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 8px 28px rgba(0,191,99,0.35)' }} title="Unggah video singkat / foto">
        <IconPlus size={26} />
      </button>

      {compose && <ComposeModal onClose={() => setCompose(false)} onPost={onCreate} authorEmail={me} authorName={account?.name ?? 'Saya'} role={account?.role ?? 'pasien'} />}

      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setViewPost(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <PostCard post={activePost} me={me} store={store} onProfile={(e) => { setViewPost(null); setViewProfile(e) }} />
          </div>
        </div>
      )}
    </div>
    </SubCtx.Provider>
  )
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-300 sm:px-4 sm:text-sm" style={active ? { background: '#171717', color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } : { color: '#a3a3a3' }}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════
   HOME FEED
   ═══════════════════════════════════════════ */

function HomeFeed({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const store = useStore()
  const { state, account, addPost } = useStore()
  const [filter, setFilter] = useState<'foryou' | 'following'>('foryou')
  const [showShare, setShowShare] = useState(false)
  const posts = state.posts.filter((p) => {
    if (p.archived) return false
    if (p.locked && p.authorEmail !== me) return false
    if (filter === 'following') return state.follows.includes(p.authorEmail) || p.authorEmail === me
    return true
  })

  const todayStr = new Date().toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wt = (state.wellness?.[todayStr] ?? {}) as any
  const todaysFoods = state.foods.filter((f) => f.date === todayStr)

  const { score: longevityScore, hasData, pillars } = useMemo(() => {
    function clampNum(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }
    const mainMeals = Math.max(0, todaysFoods.length)
    const exerciseFreq = (wt.exerciseMin || 0) > 0 ? 1 : 0
    const exerciseMin = wt.exerciseMin || 0
    const hydrationL = (wt.waterMl || 0) / 1000
    const sleepHr = wt.sleepHr || 0
    const meals = clampNum(100 - Math.abs(mainMeals - 3) * 18)
    const exercise = clampNum((exerciseFreq >= 1 ? 60 : 0) + Math.min(40, (exerciseMin / 30) * 40))
    const hydration = clampNum(hydrationL >= 2 && hydrationL <= 3.5 ? 100 : 100 - Math.abs(hydrationL - 2.5) * 28)
    const sleep = clampNum(sleepHr >= 7 && sleepHr <= 9 ? 100 : 100 - Math.abs(sleepHr - 8) * 16)
    const sun = 40
    const score = clampNum(meals * 0.2 + exercise * 0.25 + hydration * 0.15 + sleep * 0.25 + sun * 0.15)
    const hasAny = todaysFoods.length > 0 || (wt.sleepHr || 0) > 0 || (wt.waterMl || 0) > 0 || (wt.exerciseMin || 0) > 0
    return { score: hasAny ? score : 0, hasData: hasAny, pillars: { meals, exercise, hydration, sleep, sun } }
  }, [todaysFoods, wt.sleepHr, wt.waterMl, wt.exerciseMin])

  const scoreLabel = !hasData ? 'Catat data di Nutrisi & Aktivitas' : longevityScore >= 80 ? 'Sangat baik 🌟' : longevityScore >= 60 ? 'Cukup baik 👍' : longevityScore >= 40 ? 'Perlu perbaikan 💪' : 'Mulai dari langkah kecil'

  function shareToFeed() {
    if (!hasData) return
    addPost({
      id: uid(), authorEmail: account?.email ?? me, authorName: account?.name ?? 'Saya',
      role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Longevity harian',
      caption: `Nilai Longevity: ${longevityScore}/100 🌱\n${longevityScore >= 80 ? 'Sangat baik' : longevityScore >= 60 ? 'Cukup baik' : 'Perlu perbaikan'}\n\n🍽️ Makan ${pillars.meals} · 🏃 Olahraga ${pillars.exercise} · 💧 Hidrasi ${pillars.hydration} · 🌙 Tidur ${pillars.sleep}\n\n#PerjalananSehat #Longevity`,
      mediaColor: '#0B7A4B', waterMl: wt.waterMl || 0, sleepHr: wt.sleepHr || 0,
      likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    })
  }

  async function shareExternal() {
    if (!hasData) return
    const bar = (v: number) => '▓'.repeat(Math.round(v / 5)) + '░'.repeat(20 - Math.round(v / 5))
    const status = longevityScore >= 80 ? 'Sangat Baik 🌟' : longevityScore >= 60 ? 'Cukup Baik 👍' : longevityScore >= 40 ? 'Perlu Perbaikan 💪' : 'Mulai dari Langkah Kecil'
    const text = [
      `🌿 Nilai Longevity Hari Ini`, ``,
      `  ╭──────────────────────────╮`,
      `  │  SKOR  ${String(longevityScore).padStart(3)} / 100       │`,
      `  │  ${status.padEnd(22)}│`,
      `  ╰──────────────────────────╯`, ``,
      `  🍽️ Makan      ${bar(pillars.meals)}  ${String(pillars.meals).padStart(3)}`,
      `  🏃 Olahraga   ${bar(pillars.exercise)}  ${String(pillars.exercise).padStart(3)}`,
      `  💧 Hidrasi   ${bar(pillars.hydration)}  ${String(pillars.hydration).padStart(3)}`,
      `  🌙 Tidur     ${bar(pillars.sleep)}  ${String(pillars.sleep).padStart(3)}`,
      `  ☀️ Matahari  ${bar(pillars.sun)}  ${String(pillars.sun).padStart(3)}`, ``,
      `  Panaceamed.id 🌱`,
      `  #PerjalananSehat #Longevity`,
    ].join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'Nilai Longevity — Panaceamed', text })
      else await navigator.clipboard.writeText(text)
    } catch { /* cancelled */ }
  }

  const pillarDefs = [
    { key: 'meals' as const, label: 'Makan', emoji: '🍽️', color: '#f59e0b' },
    { key: 'exercise' as const, label: 'Olahraga', emoji: '🏃', color: '#f97316' },
    { key: 'hydration' as const, label: 'Hidrasi', emoji: '💧', color: '#2563eb' },
    { key: 'sleep' as const, label: 'Tidur', emoji: '🌙', color: '#818cf8' },
    { key: 'sun' as const, label: 'Matahari', emoji: '☀️', color: '#eab308' },
  ]

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border p-5" style={{ borderColor: 'rgba(0,191,99,0.12)', background: 'linear-gradient(135deg, rgba(0,191,99,0.04), rgba(11,122,75,0.02), transparent)' }}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <MiniRing score={longevityScore} size={68} />
            <span className="absolute inset-0 flex items-center justify-center text-[17px] font-black tabular-nums" style={{ color: longevityScore >= 60 ? '#00BF63' : longevityScore >= 30 ? '#f59e0b' : '#d4d4d4' }}>{longevityScore}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black tracking-tight">Panacea <span style={{ background: 'linear-gradient(135deg, #0B7A4B, #00BF63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hidup Sehat</span></h2>
            <p className="mt-0.5 text-xs text-neutral-500">Bagikan aktivitas, kebiasaan & artikel longevity Anda.</p>
            <p className="mt-1.5 text-[11px] font-semibold" style={{ color: hasData ? (longevityScore >= 60 ? '#0B7A4B' : '#b45309') : '#a3a3a3' }}>{scoreLabel}</p>
          </div>
        </div>

        {/* Mini Pillar Bars */}
        <div className="mt-4 space-y-1.5">
          {pillarDefs.map((p) => (
            <div key={p.key} className="flex items-center gap-2">
              <span className="w-4 text-center text-[11px]">{p.emoji}</span>
              <span className="w-16 text-[9px] font-semibold text-neutral-400">{p.label}</span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: `${p.color}15` }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${hasData ? pillars[p.key] : 0}%`, background: p.color }} />
              </div>
              <span className="w-7 text-right text-[9px] font-bold tabular-nums" style={{ color: hasData ? p.color : '#d4d4d4' }}>{hasData ? pillars[p.key] : '—'}</span>
            </div>
          ))}
        </div>

        {/* Share Button */}
        {hasData ? (
          <button onClick={() => setShowShare(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #0B7A4B, #064e36)', boxShadow: '0 4px 16px rgba(11,122,75,0.3)' }}>
            <span className="text-sm">📤</span> Bagikan Nilai Longevity
          </button>
        ) : (
          <div className="mt-4 rounded-xl px-3 py-2.5 text-center text-[11px] font-medium text-neutral-400" style={{ background: 'rgba(0,0,0,0.02)' }}>💡 Catat makanan & aktivitas di halaman <b>Nutrisi</b> untuk melihat skor</div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: <IconRun size={14} />, label: 'Aktivitas', color: '#00BF63' },
            { icon: <IconLeaf size={14} />, label: 'Kebiasaan', color: '#0B7A4B' },
            { icon: <IconArticle size={14} />, label: 'Artikel', color: '#3b82f6' },
            { icon: <IconMoon size={14} />, label: 'Tidur', color: '#8b5cf6' },
            { icon: <IconDrop size={14} />, label: 'Hydrasi', color: '#06b6d4' },
          ].map((a) => (
            <div key={a.label} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-200 hover:scale-110" style={{ borderColor: `${a.color}20`, background: `${a.color}08` }}>
                <ColoredIcon color={a.color}>{a.icon}</ColoredIcon>
              </div>
              <span className="text-[9px] font-bold text-neutral-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex justify-center gap-2">
        {(['foryou', 'following'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="rounded-full px-5 py-1.5 text-sm font-bold transition-all duration-300 active:scale-95" style={filter === f ? { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', color: '#fff', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' } : { background: '#fff', color: '#a3a3a3', border: '1px solid rgba(0,0,0,0.06)' }}>
            {f === 'foryou' ? 'Untuk Anda' : 'Mengikuti'}
          </button>
        ))}
      </div>

      {posts.map((p) => <PostCard key={p.id} post={p} me={me} store={store} onProfile={onProfile} />)}
      {posts.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 10px 30px rgba(0,191,99,0.25)' }}><IconPlus size={30} /></div>
          <p className="max-w-xs text-sm text-neutral-500">Belum ada unggahan. Ketuk tombol <b style={{ color: '#0B7A4B' }}>+</b> di kiri bawah untuk membagikan video singkat atau foto.</p>
        </div>
      )}

      {showShare && hasData && <ShareModal score={longevityScore} pillars={pillars} onClose={() => setShowShare(false)} onShareFeed={shareToFeed} onShareExternal={shareExternal} />}
    </div>
  )
}

/* ═══════════════════════════════════════════
   FRIENDS VIEW
   ═══════════════════════════════════════════ */

function FriendsView({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const { state } = useStore()
  const profiles = useProfiles(me).filter((p) => state.follows.includes(p.email))
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <h3 className="flex items-center gap-2 font-bold"><ColoredIcon color="#00BF63"><IconUsers size={18} /></ColoredIcon> Teman</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Akun yang Anda ikuti & berinteraksi dengan Anda.</p>
      </div>
      {profiles.map((p) => <ProfileRow key={p.email} p={p} onClick={() => onProfile(p.email)} />)}
      {profiles.length === 0 && <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Belum ada teman. Temukan akun lewat tab <b>Search</b> lalu ikuti mereka.</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════
   SEARCH VIEW
   ═══════════════════════════════════════════ */

function SearchView({ me, onProfile, onOpen }: { me: string; onProfile: (e: string) => void; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const profiles = useProfiles(me)
  const query = q.trim().toLowerCase()
  const matchProfiles = query ? profiles.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)) : []
  const fyp = state.posts.filter((p) => !p.locked && !p.archived && p.postType !== 'artikel')
  const shown = query ? fyp.filter((p) => p.caption.toLowerCase().includes(query) || p.activity.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query)) : fyp

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <IconSearch size={18} className="text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari akun atau unggahan…" className="w-full bg-transparent text-sm outline-none" />
      </div>
      {matchProfiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Akun</div>
          {matchProfiles.map((p) => <ProfileRow key={p.email} p={p} onClick={() => onProfile(p.email)} />)}
        </div>
      )}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{query ? 'Hasil' : 'For You'}</div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {shown.map((p) => {
          const cover = p.photos?.find(isImg)
          return (
            <button key={p.id} onClick={() => onOpen(p.id)} className="group relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
              {cover && <img src={cover} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-2 top-2 text-white/90 drop-shadow">{p.videoUrl || p.kind === 'video' ? <IconVideo size={14} /> : p.postType === 'kebiasaan' ? <IconLeaf size={14} /> : <IconRun size={14} />}</span>
              <span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span>
              <span className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow"><IconHeart size={10} />{p.likes}</span>
            </button>
          )
        })}
      </div>
      {shown.length === 0 && <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Belum ada unggahan untuk ditampilkan.</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PROFILE VIEW (own)
   ═══════════════════════════════════════════ */

type ProfileTab = 'posts' | 'locked' | 'liked' | 'saved'

function ProfileView({ me, name, role, onOpen }: { me: string; name: string; role: Role; onOpen: (id: string) => void }) {
  const { state, updateProfile } = useStore()
  const [pt, setPt] = useState<ProfileTab>('posts')
  const [edit, setEdit] = useState(false)
  const prof = state.profiles[me]
  const displayName = prof?.name || name
  const mine = state.posts.filter((p) => p.authorEmail === me)
  const sets: Record<ProfileTab, SocialPost[]> = {
    posts: mine.filter((p) => !p.locked && !p.archived),
    locked: mine.filter((p) => p.locked || p.archived),
    liked: state.posts.filter((p) => p.likedByMe || p.repostedByMe),
    saved: state.posts.filter((p) => p.bookmarkedByMe),
  }
  const color = COLORS[Math.abs(hash(me)) % COLORS.length]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10 60%, transparent)` }} />
        <div className="relative -mt-10 px-5 pb-5">
          <div className="flex items-end gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)`, boxShadow: `0 8px 20px ${color}44` }}>
              {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(displayName)}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="text-lg font-black">{displayName}</h2>
              <p className="text-xs text-neutral-500">{roleLabel[role]} · <span className="font-mono text-[10px] text-neutral-400">{me}</span></p>
            </div>
          </div>
          {prof?.bio && <p className="mt-3 text-sm text-neutral-600">{prof.bio}</p>}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { val: mine.length, label: 'Postingan' },
              { val: state.follows.length, label: 'Mengikuti' },
              { val: sets.saved.length, label: 'Disimpan' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                <div className="text-lg font-black tabular-nums">{s.val}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setEdit(true)} className="mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:shadow-sm active:scale-[0.98]" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>Edit Profil</button>
        </div>
      </div>
      {edit && <EditProfileModal current={{ name: displayName, bio: prof?.bio ?? '', avatar: prof?.avatar }} onClose={() => setEdit(false)} onSave={(d) => { updateProfile(me, d); setEdit(false) }} />}
      <div className="flex gap-1 rounded-2xl p-1" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <ProfTab icon={<IconHome size={15} />} label="Postingan" active={pt === 'posts'} onClick={() => setPt('posts')} />
        <ProfTab icon={<IconLock size={15} />} label="Terkunci" active={pt === 'locked'} onClick={() => setPt('locked')} />
        <ProfTab icon={<IconHeart size={15} />} label="Disukai" active={pt === 'liked'} onClick={() => setPt('liked')} />
        <ProfTab icon={<IconBookmark size={15} />} label="Disimpan" active={pt === 'saved'} onClick={() => setPt('saved')} />
      </div>
      {pt === 'saved' && <p className="text-center text-[11px] text-neutral-400">🔒 Kolom "Disimpan" hanya terlihat oleh Anda.</p>}
      <PostGrid posts={sets[pt]} onOpen={onOpen} empty={pt === 'posts' ? 'Belum ada postingan.' : pt === 'locked' ? 'Belum ada postingan terkunci.' : pt === 'liked' ? 'Belum ada yang disukai.' : 'Belum ada yang disimpan.'} />
    </div>
  )
}

/* ═══════════════════════════════════════════
   PUBLIC PROFILE
   ═══════════════════════════════════════════ */

function PublicProfile({ email, onBack, onOpen }: { email: string; onBack: () => void; onOpen: (id: string) => void }) {
  const store = useStore()
  const { state } = store
  const me = state.account?.email ?? ''
  const posts = state.posts.filter((p) => p.authorEmail === email && !p.archived && (!p.locked || p.authorEmail === me))
  const first = state.posts.find((p) => p.authorEmail === email)
  const prof = state.profiles[email]
  const name = prof?.name ?? first?.authorName ?? email
  const role = first?.role ?? 'pasien'
  const color = first?.mediaColor ?? COLORS[Math.abs(hash(email)) % COLORS.length]
  const following = state.follows.includes(email)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={onBack} className="text-sm font-semibold" style={{ color: '#a3a3a3' }}>← Kembali</button>
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10 60%, transparent)` }} />
        <div className="relative -mt-10 px-5 pb-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)`, boxShadow: `0 8px 20px ${color}44` }}>
            {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}
          </span>
          {prof?.bio && <p className="mx-auto mt-3 max-w-sm text-sm text-neutral-600">{prof.bio}</p>}
          <h2 className="mt-2 text-lg font-black">{name}</h2>
          <p className="text-xs text-neutral-500">{roleLabel[role]}</p>
          {email !== me && (
            <button onClick={() => store.toggleFollow(email)} className="mt-4 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.97]" style={following ? { background: 'rgba(0,0,0,0.04)', color: '#737373', border: '1px solid rgba(0,0,0,0.06)' } : { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', color: '#fff', boxShadow: '0 4px 14px rgba(0,191,99,0.3)' }}>
              {following ? 'Mengikuti' : 'Ikuti'}
            </button>
          )}
        </div>
      </div>
      <PostGrid posts={posts} onOpen={onOpen} empty="Belum ada postingan publik." />
    </div>
  )
}

/* ═══════════════════════════════════════════
   EDIT PROFILE MODAL
   ═══════════════════════════════════════════ */

function EditProfileModal({ current, onClose, onSave }: { current: { name: string; bio: string; avatar?: string }; onClose: () => void; onSave: (d: ProfileEdit) => void }) {
  const [name, setName] = useState(current.name)
  const [bio, setBio] = useState(current.bio)
  const [avatar, setAvatar] = useState<string | undefined>(current.avatar)
  const [busy, setBusy] = useState(false)
  async function pick(file?: File) {
    if (!file) return
    setBusy(true)
    setAvatar(await uploadOrLocal(file))
    setBusy(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Edit Profil</h3>
        <div className="mt-4 flex flex-col items-center">
          <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl text-2xl font-extrabold text-white" style={{ background: 'linear-gradient(145deg, #00BF63, #0B7A4B)', boxShadow: '0 8px 20px rgba(0,191,99,0.25)' }}>
            {avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}
          </span>
          <label className="mt-2 cursor-pointer text-sm font-semibold hover:underline" style={{ color: '#0B7A4B' }}>
            {busy ? 'Mengunggah…' : 'Ubah foto profil'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Nama"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Status / Bio"><textarea className={`${inputClass} min-h-[70px]`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tulis status atau bio singkat…" /></Field>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-50">Batal</button>
          <button onClick={() => onSave({ name: name.trim() || current.name, bio: bio.trim(), avatar })} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

function ProfTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all duration-200" style={active ? { background: 'rgba(0,191,99,0.08)', color: '#0B7A4B' } : { color: '#a3a3a3' }}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ProfileRow({ p, onClick }: { p: Profile; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 hover:shadow-sm" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(145deg, ${p.color}, ${p.color}bb)` }}>{initials(p.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{p.name}</div>
        <div className="text-xs text-neutral-400">{roleLabel[p.role]} · {p.posts} postingan</div>
      </div>
      <ColoredIcon color="#d4d4d4"><IconUser size={16} /></ColoredIcon>
    </button>
  )
}

function PostGrid({ posts, onOpen, empty }: { posts: SocialPost[]; onOpen: (id: string) => void; empty: string }) {
  if (posts.length === 0) return <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-neutral-400" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>{empty}</div>
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {posts.map((p) => {
        const cover = p.photos?.find(isImg)
        return (
          <button key={p.id} onClick={() => onOpen(p.id)} className="group relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
            {cover && <img src={cover} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute left-2 top-2 text-white/90 drop-shadow">{p.locked ? <IconLock size={14} /> : p.videoUrl || p.kind === 'video' ? <IconVideo size={14} /> : <IconRun size={14} />}</span>
            <span className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span>
          </button>
        )
      })}
    </div>
  )
}

function useProfiles(_me: string): Profile[] {
  const { state } = useStore()
  return useMemo(() => {
    const map = new Map<string, Profile>()
    for (const p of state.posts) {
      const cur = map.get(p.authorEmail)
      if (cur) cur.posts++
      else map.set(p.authorEmail, { email: p.authorEmail, name: p.authorName, role: p.role, color: p.mediaColor, posts: 1 })
    }
    return [...map.values()]
  }, [state.posts])
}

/* ═══════════════════════════════════════════
   EXCLUSIVE LOCK
   ═══════════════════════════════════════════ */

function ExclusiveLock({ post: p, onProfile }: { post: SocialPost; onProfile: (e: string) => void }) {
  const { price, subscribe } = useContext(SubCtx)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function go() {
    setBusy(true); setErr('')
    const ok = await subscribe(p.authorEmail)
    if (!ok) setErr('Saldo PNC tidak cukup. Top up di Billing & Token.')
    setBusy(false)
  }
  return (
    <div className="relative flex aspect-[16/11] flex-col items-center justify-center gap-2 overflow-hidden px-6 text-center" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(20px)' }} />
      <div className="relative flex flex-col items-center gap-2 text-white">
        <span className="text-2xl">⭐🔒</span>
        <div className="text-sm font-bold">Konten Eksklusif</div>
        <p className="max-w-xs text-[12px] text-white/80">Langganan kreator <button onClick={() => onProfile(p.authorEmail)} className="font-bold underline">{p.authorName}</button> untuk membuka semua konten eksklusifnya.</p>
        <button onClick={go} disabled={busy} className="mt-1 rounded-full bg-white px-5 py-2 text-sm font-bold disabled:opacity-60" style={{ color: '#0B7A4B' }}>
          {busy ? 'Memproses…' : `Langganan · ${price} PNC / bulan`}
        </button>
        {err && <p className="text-[11px]" style={{ color: '#fbbf24' }}>{err}</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   POST CARD
   ═══════════════════════════════════════════ */

function PostCard({ post: p, me, store, onProfile }: { post: SocialPost; me: string; store: ReturnType<typeof useStore>; onProfile: (e: string) => void }) {
  const type = p.postType ?? 'aktivitas'
  const mine = p.authorEmail === me
  const sub = useContext(SubCtx)
  const exclusiveLocked = !!p.exclusive && !mine && !sub.subscribed.has(p.authorEmail.toLowerCase())
  const following = store.state.follows.includes(p.authorEmail)
  const prof = store.state.profiles[p.authorEmail]
  const [menu, setMenu] = useState(false)
  const accent = type === 'kebiasaan' ? '#0B7A4B' : type === 'artikel' ? '#3b82f6' : '#00BF63'

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}44)` }} />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => onProfile(p.authorEmail)} className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold text-white transition-transform duration-200 hover:scale-105" style={{ background: `linear-gradient(145deg, ${p.mediaColor}, ${p.mediaColor}bb)` }}>
          {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(prof?.name ?? p.authorName)}
        </button>
        <button onClick={() => onProfile(p.authorEmail)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{prof?.name ?? p.authorName}</span>
            {p.locked && <IconLock size={12} className="text-neutral-400" />}
            <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: 'rgba(0,0,0,0.04)', color: '#a3a3a3' }}>{roleLabel[p.role]}</span>
          </div>
          <span className="text-[11px] text-neutral-400">{timeAgo(p.at)} lalu · {p.activity}</span>
        </button>
        {mine ? (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="px-2 text-lg font-bold text-neutral-400">⋯</button>
            {menu && (
              <div className="absolute right-0 top-7 z-10 w-44 overflow-hidden rounded-xl bg-white py-1 text-sm" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => { store.updatePost(p.id, { locked: !p.locked }); setMenu(false) }} className="block w-full px-3 py-2 text-left hover:bg-neutral-50">{p.locked ? '🔓 Buka kunci' : '🔒 Kunci (privat)'}</button>
                <button onClick={() => { store.updatePost(p.id, { archived: !p.archived }); setMenu(false) }} className="block w-full px-3 py-2 text-left hover:bg-neutral-50">{p.archived ? '👁️ Tampilkan' : '🗄️ Arsipkan'}</button>
                <button onClick={() => { if (confirm('Hapus?')) store.deletePost(p.id) }} className="block w-full px-3 py-2 text-left hover:bg-red-50" style={{ color: '#FF3131' }}>🗑️ Hapus</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => store.toggleFollow(p.authorEmail)} className="rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-95" style={following ? { background: 'rgba(0,0,0,0.04)', color: '#737373' } : { background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', color: '#fff', boxShadow: '0 2px 10px rgba(0,191,99,0.25)' }}>
            {following ? 'Mengikuti' : 'Ikuti'}
          </button>
        )}
      </div>

      {exclusiveLocked ? (
        <ExclusiveLock post={p} onProfile={onProfile} />
      ) : (
        <>
          {type === 'artikel' ? <ArticleBlock post={p} /> : <MediaBlock post={p} />}
          {type === 'aktivitas' && <ActivityMetrics post={p} />}
          {type === 'kebiasaan' && <HabitMetrics post={p} />}
          {(p.audio || p.location) && <div className="flex flex-wrap gap-3 px-5 pt-2 text-[11px] font-semibold text-neutral-500">{p.audio && <span>🎵 {p.audio}</span>}{p.location && <span>📍 {p.location}</span>}</div>}
          {p.caption && <p className="px-5 pt-3 text-sm" style={{ color: '#171717' }}>{p.caption}</p>}
        </>
      )}

      <div className="flex items-center gap-5 px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <button onClick={() => store.toggleLike(p.id)} className="flex items-center gap-1.5 text-sm font-semibold hover:scale-105 transition-transform">
          <ColoredIcon color={p.likedByMe ? '#FF3131' : '#a3a3a3'}><IconHeart size={18} /></ColoredIcon>
          <span style={{ color: p.likedByMe ? '#FF3131' : '#737373' }}>{p.likes}</span>
        </button>
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#737373' }}><IconComment size={18} /> {p.comments ?? 0}</span>
        <button onClick={() => store.toggleRepost(p.id)} className="flex items-center gap-1.5 text-sm font-semibold hover:scale-105 transition-transform">
          <ColoredIcon color={p.repostedByMe ? '#00BF63' : '#a3a3a3'}><IconRepost size={18} /></ColoredIcon>
          <span style={{ color: p.repostedByMe ? '#00BF63' : '#737373' }}>{p.reposts ?? 0}</span>
        </button>
        <button onClick={() => store.toggleBookmark(p.id)} className="ml-auto hover:scale-110 transition-transform" title="Simpan">
          <ColoredIcon color={p.bookmarkedByMe ? '#00BF63' : '#a3a3a3'}><IconBookmark size={18} /></ColoredIcon>
        </button>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════
   MEDIA / ARTICLE / METRICS
   ═══════════════════════════════════════════ */

function MediaBlock({ post: p }: { post: SocialPost }) {
  if (p.videoUrl) return <video src={p.videoUrl} className="max-h-[70vh] w-full bg-black" controls muted loop playsInline />
  const realPhotos = p.photos?.filter(isImg) ?? []
  if (realPhotos.length > 0) {
    if (realPhotos.length === 1) return <img src={realPhotos[0]} loading="lazy" decoding="async" className="max-h-[70vh] w-full object-cover" alt={p.activity} />
    return <div className="grid grid-cols-2 gap-0.5">{realPhotos.slice(0, 4).map((src, i) => <img key={i} src={src} loading="lazy" decoding="async" className="aspect-square w-full object-cover" alt="" />)}</div>
  }
  const photos = p.photos && p.photos.length > 1 ? p.photos : null
  if (photos) return <div className="grid grid-cols-2 gap-0.5">{photos.slice(0, 4).map((c, i) => <div key={i} className="flex aspect-square items-center justify-center" style={{ background: `linear-gradient(150deg, ${c}, #0c1410)` }}><IconLeaf size={26} className="text-white/80" /></div>)}</div>
  return (
    <div className="relative flex aspect-[16/11] items-center justify-center" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      <div className="relative text-center text-white/95">
        {(p.postType ?? 'aktivitas') === 'kebiasaan' ? <IconLeaf size={44} className="mx-auto" /> : p.kind === 'video' ? <IconVideo size={44} className="mx-auto" /> : <IconRun size={44} className="mx-auto" />}
        <div className="mt-2 text-2xl font-extrabold">{p.activity}</div>
        {p.kind === 'video' && <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px]" style={{ background: 'rgba(0,0,0,0.3)' }}>▶ {p.videoSec ?? p.durationSec ?? 30}s</span>}
      </div>
    </div>
  )
}

function ArticleBlock({ post: p }: { post: SocialPost }) {
  return (
    <div className="mx-5 mt-1 rounded-xl p-4" style={{ border: '1px solid rgba(59,130,246,0.12)', background: 'rgba(59,130,246,0.03)' }}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: '#3b82f6' }}><IconArticle size={14} /> Artikel Longevity</div>
      <h3 className="mt-1.5 text-base font-bold leading-snug" style={{ color: '#171717' }}>{p.articleTitle ?? p.caption}</h3>
      <p className="mt-1 text-[11px] text-neutral-400">Sumber: {p.articleSource ?? 'Panaceamed Longevity'}</p>
    </div>
  )
}

function Metric({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color?: string }) {
  const c = color ?? '#00BF63'
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5" style={{ background: `${c}06` }}>
      <ColoredIcon color={c}>{icon}</ColoredIcon>
      <span className="text-sm font-extrabold tabular-nums" style={{ color: '#171717' }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{label}</span>
    </div>
  )
}

function ActivityMetrics({ post: p }: { post: SocialPost }) {
  if (!p.distanceKm && !p.durationMin && !p.calories && !p.steps) return null
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 px-5">
      <Metric icon={<IconRun size={17} />} value={p.distanceKm ? `${p.distanceKm}` : '—'} label="km" />
      <Metric icon={<IconComment size={17} />} value={p.durationMin ? `${p.durationMin}` : '—'} label="menit" color="#3b82f6" />
      <Metric icon={<IconFlame size={17} />} value={p.calories ? `${p.calories}` : '—'} label="kkal" color="#f59e0b" />
      <Metric icon={<IconLeaf size={17} />} value={p.steps ? `${p.steps.toLocaleString('id-ID')}` : '—'} label="langkah" />
    </div>
  )
}

function HabitMetrics({ post: p }: { post: SocialPost }) {
  if (p.waterMl == null && p.veggieServ == null && p.sleepHr == null && p.sugaryDrinks == null) return null
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 px-5">
      <Metric icon={<IconDrop size={17} />} value={p.waterMl != null ? `${(p.waterMl / 1000).toFixed(1)}` : '—'} label="liter air" color="#06b6d4" />
      <Metric icon={<IconLeaf size={17} />} value={p.veggieServ != null ? `${p.veggieServ}` : '—'} label="porsi sayur" />
      <Metric icon={<IconMoon size={17} />} value={p.sleepHr != null ? `${p.sleepHr}` : '—'} label="jam tidur" color="#8b5cf6" />
      <Metric icon={<IconFlame size={17} />} value={p.sugaryDrinks != null ? `${p.sugaryDrinks}` : '—'} label="min. manis" color="#f59e0b" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPOSE MODAL
   ═══════════════════════════════════════════ */

function ComposeModal({ onClose, onPost, authorEmail, authorName, role }: { onClose: () => void; onPost: (p: SocialPost) => void; authorEmail: string; authorName: string; role: Role }) {
  const [postType, setPostType] = useState<PostType>('aktivitas')
  const [media, setMedia] = useState<'video' | 'foto'>('foto')
  const [photoData, setPhotoData] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [caption, setCaption] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [locked, setLocked] = useState(false)
  const [exclusive, setExclusive] = useState(false)
  const [audio, setAudio] = useState(SONGS[0])
  const [location, setLocation] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [waterMl, setWaterMl] = useState('')
  const [veggieServ, setVeggieServ] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  async function onPickPhotos(files: FileList | null) {
    if (!files) return
    setUploading(true)
    setPhotoData(await Promise.all(Array.from(files).slice(0, 4).map((f) => uploadOrLocal(f))))
    setUploading(false)
  }
  async function onPickVideo(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    setUploading(true)
    setVideoUrl(await uploadOrLocal(f))
    setUploading(false)
  }

  function submit() {
    const isVideo = media === 'video' && postType !== 'artikel' && !!videoUrl
    const base: SocialPost = {
      id: uid(), authorEmail, authorName, role, postType,
      kind: isVideo ? 'video' : 'image',
      activity: postType === 'kebiasaan' ? 'Kebiasaan sehat' : postType === 'artikel' ? 'Longevity' : activity,
      caption: caption.trim(), mediaColor: color,
      videoSec: isVideo ? 30 : undefined, videoUrl: isVideo ? videoUrl! : undefined,
      photos: !isVideo && postType !== 'artikel' && photoData.length > 0 ? photoData : undefined,
      audio: audio !== SONGS[0] ? audio : undefined,
      location: location.trim() || undefined,
      locked, exclusive, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    }
    if (postType === 'aktivitas') { base.distanceKm = num(distanceKm); base.durationMin = num(durationMin) }
    else if (postType === 'kebiasaan') { base.waterMl = num(waterMl); base.veggieServ = num(veggieServ); if (!base.caption) base.caption = 'Kebiasaan sehat hari ini 💪' }
    else { base.articleTitle = articleTitle.trim() || caption.trim(); base.articleSource = 'Panaceamed Longevity' }
    onPost(base)
  }

  const typeOptions: [PostType, string, React.ReactNode][] = [
    ['aktivitas', 'Aktivitas', <IconRun size={14} key="a" />],
    ['kebiasaan', 'Kebiasaan', <IconLeaf size={14} key="k" />],
    ['artikel', 'Artikel', <IconArticle size={14} key="r" />],
  ]
  const mediaOptions = ['foto', 'video'] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Unggah</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Video singkat (maks 30 detik) atau beberapa foto.</p>
        <div className="mt-4 flex gap-2">
          {typeOptions.map(([t, label, icon]) => (
            <button key={t} onClick={() => setPostType(t)} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200" style={postType === t ? { background: 'rgba(0,191,99,0.08)', color: '#0B7A4B', border: '1px solid rgba(0,191,99,0.2)' } : { background: 'rgba(0,0,0,0.03)', color: '#a3a3a3' }}>{icon} {label}</button>
          ))}
        </div>
        {postType !== 'artikel' && (
          <div className="mt-3 flex gap-2">
            {mediaOptions.map((m) => (
              <button key={m} onClick={() => setMedia(m)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200" style={media === m ? { background: '#171717', color: '#fff' } : { background: 'rgba(0,0,0,0.03)', color: '#a3a3a3' }}>
                {m === 'foto' ? <IconLeaf size={14} /> : <IconVideo size={14} />} {m === 'foto' ? 'Foto' : 'Video 30 dtk'}
              </button>
            ))}
          </div>
        )}
        {postType !== 'artikel' && media === 'foto' && (
          <div className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 text-neutral-500 hover:border-[#00BF63]" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.01)' }}>
              <IconPlus size={22} /><span className="text-xs font-semibold">Unggah foto (maks 4)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
            </label>
            {photoData.length > 0 && <div className="mt-2 grid grid-cols-4 gap-1.5">{photoData.map((src, i) => <img key={i} src={src} loading="lazy" decoding="async" className="aspect-square w-full rounded-lg object-cover" alt="" />)}</div>}
          </div>
        )}
        {postType !== 'artikel' && media === 'video' && (
          <div className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 text-neutral-500 hover:border-[#00BF63]" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.01)' }}>
              <IconVideo size={22} /><span className="text-xs font-semibold">Unggah video singkat (maks 30 detik)</span>
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => onPickVideo(e.target.files)} />
            </label>
            {videoUrl && <video src={videoUrl} className="mt-2 max-h-48 w-full rounded-lg" controls muted playsInline />}
          </div>
        )}
        <div className="mt-3 space-y-3">
          {postType === 'aktivitas' && (<>
            <Field label="Aktivitas"><select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}>{ACTIVITIES.map((a) => <option key={a}>{a}</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jarak (km)"><input className={inputClass} type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} /></Field>
              <Field label="Durasi (menit)"><input className={inputClass} type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} /></Field>
            </div>
          </>)}
          {postType === 'kebiasaan' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Air putih (ml)"><input className={inputClass} type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} /></Field>
              <Field label="Porsi sayur/buah"><input className={inputClass} type="number" value={veggieServ} onChange={(e) => setVeggieServ(e.target.value)} /></Field>
            </div>
          )}
          {postType === 'artikel' && <Field label="Judul artikel"><input className={inputClass} value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Kilasan artikel longevity" /></Field>}
          <Field label="Caption"><input className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ceritakan kemajuan sehat Anda…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="🎵 Pilih lagu"><select className={inputClass} value={audio} onChange={(e) => setAudio(e.target.value)}>{SONGS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="📍 Lokasi"><input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. GBK, Jakarta" /></Field>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Warna:</span>
          {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className="h-6 w-6 rounded-full transition-transform duration-200 hover:scale-110" style={{ background: c, boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }} />)}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="h-4 w-4" style={{ accentColor: '#00BF63' }} />
          <IconLock size={14} className="text-neutral-400" /> Kunci postingan (privat)
        </label>
        <label className="mt-2 flex items-center gap-2 rounded-xl p-2.5 text-sm" style={{ background: 'rgba(0,191,99,0.05)', color: '#0B7A4B' }}>
          <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} className="h-4 w-4" style={{ accentColor: '#00BF63' }} />
          <span>⭐ <b>Konten Eksklusif</b> — hanya untuk subscriber (langganan 100 PNC/bln)</span>
        </label>
        {uploading && <p className="mt-3 text-xs font-semibold" style={{ color: '#0B7A4B' }}>Mengunggah media…</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-50">Batal</button>
          <button onClick={submit} disabled={uploading} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white active:scale-[0.97] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
            <span className="flex items-center justify-center gap-1.5"><IconPlus size={15} /> Posting</span>
          </button>
        </div>
      </div>
    </div>
  )
}
