import { useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, Button, Field, inputClass } from '../components/ui'
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
import type { SocialPost, PostType, Role } from '../lib/types'

const ACTIVITIES = ['Lari', 'Jalan kaki', 'Berenang', 'Bersepeda', 'Padel', 'Futsal', 'Yoga', 'Gym', 'Menyapu']
const COLORS = ['#00BF63', '#0B7A4B', '#3b82f6', '#8b5cf6', '#f59e0b', '#FF3131']

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

export function Feed() {
  const store = useStore()
  const { state, account } = store
  const [tab, setTab] = useState<Tab>('home')
  const [compose, setCompose] = useState(false)
  const [viewProfile, setViewProfile] = useState<string | null>(null) // email of profile being viewed
  const [viewPost, setViewPost] = useState<string | null>(null)

  const me = account?.email ?? 'me@panaceamed.id'

  function onCreate(p: SocialPost) {
    store.addPost(p)
    if (backendEnabled) api.createPost({ activity: p.activity, caption: p.caption, kind: p.kind, mediaColor: p.mediaColor }).catch(() => {})
    setCompose(false)
    setTab('profile')
  }

  const activePost = viewPost ? state.posts.find((p) => p.id === viewPost) : null

  return (
    <div className="relative pb-24">
      {/* Top tab bar (TikTok-style) */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-center gap-1 border-b border-neutral-100 bg-[#f4f7f5]/90 px-4 py-2 backdrop-blur sm:gap-2">
        <TabBtn icon={<IconHome size={18} />} label="Home" active={tab === 'home'} onClick={() => { setTab('home'); setViewProfile(null) }} />
        <TabBtn icon={<IconUsers size={18} />} label="Friends" active={tab === 'friends'} onClick={() => { setTab('friends'); setViewProfile(null) }} />
        <TabBtn icon={<IconSearch size={18} />} label="Search" active={tab === 'search'} onClick={() => { setTab('search'); setViewProfile(null) }} />
        <TabBtn icon={<IconUser size={18} />} label="Profil" active={tab === 'profile'} onClick={() => { setTab('profile'); setViewProfile(null) }} />
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

      {/* Floating + (bottom-left) — upload */}
      <button
        onClick={() => setCompose(true)}
        className="fixed bottom-6 left-6 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
        title="Unggah video singkat / foto"
      >
        <IconPlus size={26} />
      </button>

      {compose && (
        <ComposeModal
          onClose={() => setCompose(false)}
          onPost={onCreate}
          authorEmail={me}
          authorName={account?.name ?? 'Saya'}
          role={account?.role ?? 'pasien'}
        />
      )}

      {activePost && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewPost(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <PostCard post={activePost} me={me} store={store} onProfile={(e) => { setViewPost(null); setViewProfile(e) }} />
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
        active ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'
      }`}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ---- HOME ----------------------------------------------------------------
function HomeFeed({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const store = useStore()
  const { state } = store
  const [filter, setFilter] = useState<'foryou' | 'following'>('foryou')
  const posts = state.posts.filter((p) => {
    if (p.locked && p.authorEmail !== me) return false
    if (filter === 'following') return state.follows.includes(p.authorEmail) || p.authorEmail === me
    return true
  })
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex justify-center gap-2">
        {([['foryou', 'Untuk Anda'], ['following', 'Mengikuti']] as const).map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${filter === f ? 'bg-brand text-white' : 'bg-white text-neutral-500 ring-1 ring-black/5'}`}>{l}</button>
        ))}
      </div>
      {posts.map((p) => <PostCard key={p.id} post={p} me={me} store={store} onProfile={onProfile} />)}
      {posts.length === 0 && (
        <Card className="text-center text-sm text-neutral-400">
          Belum ada unggahan. Ketuk tombol <b className="text-brand-dark">+</b> di kiri bawah untuk membagikan video singkat atau foto.
        </Card>
      )}
    </div>
  )
}

// ---- FRIENDS (mutual / following) ----------------------------------------
function FriendsView({ me, onProfile }: { me: string; onProfile: (e: string) => void }) {
  const { state } = useStore()
  const profiles = useProfiles(me).filter((p) => state.follows.includes(p.email))
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <h3 className="flex items-center gap-2 font-bold"><IconUsers size={18} className="text-brand" /> Teman (saling mengikuti)</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Akun yang Anda ikuti & berinteraksi dengan Anda.</p>
      </Card>
      {profiles.map((p) => <ProfileRow key={p.email} p={p} onClick={() => onProfile(p.email)} />)}
      {profiles.length === 0 && (
        <Card className="text-center text-sm text-neutral-400">Belum ada teman. Temukan akun lewat tab <b>Search</b> lalu ikuti mereka.</Card>
      )}
    </div>
  )
}

// ---- SEARCH + For You Page grid ------------------------------------------
function SearchView({ me, onProfile, onOpen }: { me: string; onProfile: (e: string) => void; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const profiles = useProfiles(me)
  const query = q.trim().toLowerCase()
  const matchProfiles = query ? profiles.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)) : []
  // For You Page: public posts with visual media, scrollable grid
  const fyp = state.posts.filter((p) => !p.locked && (p.postType !== 'artikel'))
  const shown = query
    ? fyp.filter((p) => p.caption.toLowerCase().includes(query) || p.activity.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query))
    : fyp

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
        <IconSearch size={18} className="text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari akun atau unggahan…" className="w-full bg-transparent text-sm outline-none" />
      </div>

      {matchProfiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">Akun</div>
          {matchProfiles.map((p) => <ProfileRow key={p.email} p={p} onClick={() => onProfile(p.email)} />)}
        </div>
      )}

      <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">{query ? 'Hasil' : 'For You'}</div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {shown.map((p) => (
          <button key={p.id} onClick={() => onOpen(p.id)} className="relative aspect-[3/4] overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
            <span className="absolute left-1.5 top-1.5 text-white/90">{p.kind === 'video' ? <IconVideo size={16} /> : p.postType === 'kebiasaan' ? <IconLeaf size={16} /> : <IconRun size={16} />}</span>
            <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-semibold text-white">{p.activity}</span>
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] font-bold text-white"><IconHeart size={11} />{p.likes}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 && <Card className="text-center text-sm text-neutral-400">Belum ada unggahan untuk ditampilkan.</Card>}
    </div>
  )
}

// ---- PROFILE (own) -------------------------------------------------------
type ProfileTab = 'posts' | 'locked' | 'liked' | 'saved'
function ProfileView({ me, name, role, onOpen }: { me: string; name: string; role: Role; onOpen: (id: string) => void }) {
  const { state } = useStore()
  const [pt, setPt] = useState<ProfileTab>('posts')
  const mine = state.posts.filter((p) => p.authorEmail === me)
  const sets: Record<ProfileTab, SocialPost[]> = {
    posts: mine.filter((p) => !p.locked),
    locked: mine.filter((p) => p.locked),
    liked: state.posts.filter((p) => p.likedByMe || p.repostedByMe),
    saved: state.posts.filter((p) => p.bookmarkedByMe),
  }
  const color = COLORS[Math.abs(hash(me)) % COLORS.length]
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full text-2xl font-extrabold text-white" style={{ background: color }}>{initials(name)}</span>
        <h2 className="mt-2 text-xl font-extrabold">{name}</h2>
        <p className="text-sm text-neutral-500">{roleLabel[role]} · {me}</p>
        <div className="mt-3 flex justify-center gap-6 text-sm">
          <span><b>{mine.length}</b> <span className="text-neutral-400">Postingan</span></span>
          <span><b>{state.follows.length}</b> <span className="text-neutral-400">Mengikuti</span></span>
          <span><b>{sets.saved.length}</b> <span className="text-neutral-400">Disimpan</span></span>
        </div>
      </Card>

      <div className="flex justify-center gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5">
        <ProfTab icon={<IconHome size={16} />} label="Postingan" active={pt === 'posts'} onClick={() => setPt('posts')} />
        <ProfTab icon={<IconLock size={16} />} label="Terkunci" active={pt === 'locked'} onClick={() => setPt('locked')} />
        <ProfTab icon={<IconHeart size={16} />} label="Disukai" active={pt === 'liked'} onClick={() => setPt('liked')} />
        <ProfTab icon={<IconBookmark size={16} />} label="Disimpan" active={pt === 'saved'} onClick={() => setPt('saved')} />
      </div>

      {pt === 'saved' && (
        <p className="text-center text-[11px] text-neutral-400">🔒 Kolom “Disimpan” hanya terlihat oleh Anda.</p>
      )}

      <PostGrid posts={sets[pt]} onOpen={onOpen} empty={
        pt === 'posts' ? 'Belum ada postingan. Unggah lewat tombol + di kiri bawah.' :
        pt === 'locked' ? 'Belum ada postingan terkunci.' :
        pt === 'liked' ? 'Belum ada postingan yang Anda sukai / repost.' :
        'Belum ada postingan tersimpan.'
      } />
    </div>
  )
}

function PublicProfile({ email, onBack, onOpen }: { email: string; onBack: () => void; onOpen: (id: string) => void }) {
  const store = useStore()
  const { state } = store
  const me = state.account?.email ?? ''
  const posts = state.posts.filter((p) => p.authorEmail === email && (!p.locked || p.authorEmail === me))
  const first = state.posts.find((p) => p.authorEmail === email)
  const name = first?.authorName ?? email
  const role = first?.role ?? 'pasien'
  const color = first?.mediaColor ?? COLORS[Math.abs(hash(email)) % COLORS.length]
  const following = state.follows.includes(email)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={onBack} className="text-sm font-semibold text-neutral-500 hover:text-brand-dark">← Kembali</button>
      <Card className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full text-2xl font-extrabold text-white" style={{ background: color }}>{initials(name)}</span>
        <h2 className="mt-2 text-xl font-extrabold">{name}</h2>
        <p className="text-sm text-neutral-500">{roleLabel[role]}</p>
        {email !== me && (
          <Button className="mt-3" variant={following ? 'outline' : 'primary'} onClick={() => store.toggleFollow(email)}>
            {following ? 'Mengikuti' : 'Ikuti'}
          </Button>
        )}
      </Card>
      <PostGrid posts={posts} onOpen={onOpen} empty="Belum ada postingan publik." />
    </div>
  )
}

function ProfTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${active ? 'bg-brand-50 text-brand-dark' : 'text-neutral-400'}`}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ProfileRow({ p, onClick }: { p: Profile; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-black/5 hover:bg-neutral-50">
      <span className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.color }}>{initials(p.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{p.name}</div>
        <div className="text-xs text-neutral-400">{roleLabel[p.role]} · {p.posts} postingan</div>
      </div>
      <IconUser size={16} className="text-neutral-300" />
    </button>
  )
}

function PostGrid({ posts, onOpen, empty }: { posts: SocialPost[]; onOpen: (id: string) => void; empty: string }) {
  if (posts.length === 0) return <Card className="text-center text-sm text-neutral-400">{empty}</Card>
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {posts.map((p) => (
        <button key={p.id} onClick={() => onOpen(p.id)} className="relative aspect-[3/4] overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
          <span className="absolute left-1.5 top-1.5 text-white/90">{p.locked ? <IconLock size={14} /> : p.kind === 'video' ? <IconVideo size={14} /> : <IconRun size={14} />}</span>
          <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-semibold text-white">{p.activity}</span>
        </button>
      ))}
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

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}

// ---- Post card -----------------------------------------------------------
function PostCard({ post: p, me, store, onProfile }: {
  post: SocialPost; me: string; store: ReturnType<typeof useStore>; onProfile: (e: string) => void
}) {
  const type = p.postType ?? 'aktivitas'
  const mine = p.authorEmail === me
  const following = store.state.follows.includes(p.authorEmail)
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => onProfile(p.authorEmail)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.mediaColor }}>{initials(p.authorName)}</button>
        <button onClick={() => onProfile(p.authorEmail)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{p.authorName}</span>
            {p.locked && <IconLock size={13} className="text-neutral-400" />}
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">{roleLabel[p.role]}</span>
          </div>
          <span className="text-[11px] text-neutral-400">{timeAgo(p.at)} lalu · {p.activity}</span>
        </button>
        {!mine && (
          <button onClick={() => store.toggleFollow(p.authorEmail)} className={`rounded-full px-3 py-1 text-xs font-bold ${following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand text-white'}`}>{following ? 'Mengikuti' : 'Ikuti'}</button>
        )}
      </div>

      {type === 'artikel' ? <ArticleBlock post={p} /> : <MediaBlock post={p} />}
      {type === 'aktivitas' && <ActivityMetrics post={p} />}
      {type === 'kebiasaan' && <HabitMetrics post={p} />}
      {p.caption && <p className="px-4 pt-3 text-sm text-ink">{p.caption}</p>}

      <div className="flex items-center gap-5 px-4 py-3 text-neutral-500">
        <button onClick={() => store.toggleLike(p.id)} className="flex items-center gap-1.5 text-sm font-semibold">
          <IconHeart size={18} className={p.likedByMe ? 'text-accent' : ''} /><span className={p.likedByMe ? 'text-accent' : ''}>{p.likes}</span>
        </button>
        <span className="flex items-center gap-1.5 text-sm font-semibold"><IconComment size={18} /> {p.comments ?? 0}</span>
        <button onClick={() => store.toggleRepost(p.id)} className="flex items-center gap-1.5 text-sm font-semibold">
          <IconRepost size={18} className={p.repostedByMe ? 'text-brand' : ''} /><span className={p.repostedByMe ? 'text-brand' : ''}>{p.reposts ?? 0}</span>
        </button>
        <button onClick={() => store.toggleBookmark(p.id)} className="ml-auto" title="Simpan (privat)">
          <IconBookmark size={18} className={p.bookmarkedByMe ? 'text-brand' : ''} />
        </button>
      </div>
    </Card>
  )
}

function MediaBlock({ post: p }: { post: SocialPost }) {
  const photos = p.photos && p.photos.length > 1 ? p.photos : null
  if (photos) {
    return (
      <div className="grid grid-cols-2 gap-1 px-0">
        {photos.slice(0, 4).map((c, i) => (
          <div key={i} className="flex aspect-square items-center justify-center" style={{ background: `linear-gradient(150deg, ${c}, #0c1410)` }}>
            <IconLeaf size={26} className="text-white/80" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="relative flex aspect-[16/11] items-center justify-center" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
      <div className="text-center text-white/95">
        {(p.postType ?? 'aktivitas') === 'kebiasaan' ? <IconLeaf size={44} className="mx-auto" /> : p.kind === 'video' ? <IconVideo size={44} className="mx-auto" /> : <IconRun size={44} className="mx-auto" />}
        <div className="mt-2 text-2xl font-extrabold">{p.activity}</div>
        {p.kind === 'video' && <span className="mt-1 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[11px]">▶ {p.videoSec ?? p.durationSec ?? 30}s</span>}
      </div>
    </div>
  )
}

function ArticleBlock({ post: p }: { post: SocialPost }) {
  return (
    <div className="mx-4 mt-1 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-dark"><IconArticle size={15} /> Artikel Longevity</div>
      <h3 className="mt-1.5 text-base font-bold leading-snug text-ink">{p.articleTitle ?? p.caption}</h3>
      <p className="mt-1 text-[11px] text-neutral-400">Sumber: {p.articleSource ?? 'Panaceamed Longevity'}</p>
    </div>
  )
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-brand">{icon}</span>
      <span className="text-sm font-extrabold text-ink">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
    </div>
  )
}

function ActivityMetrics({ post: p }: { post: SocialPost }) {
  if (!p.distanceKm && !p.durationMin && !p.calories && !p.steps) return null
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 px-4">
      <Metric icon={<IconRun size={18} />} value={p.distanceKm ? `${p.distanceKm}` : '—'} label="km" />
      <Metric icon={<IconComment size={18} />} value={p.durationMin ? `${p.durationMin}` : '—'} label="menit" />
      <Metric icon={<IconFlame size={18} />} value={p.calories ? `${p.calories}` : '—'} label="kkal" />
      <Metric icon={<IconLeaf size={18} />} value={p.steps ? `${p.steps.toLocaleString('id-ID')}` : '—'} label="langkah" />
    </div>
  )
}

function HabitMetrics({ post: p }: { post: SocialPost }) {
  if (p.waterMl == null && p.veggieServ == null && p.sleepHr == null && p.sugaryDrinks == null) return null
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 px-4">
      <Metric icon={<IconDrop size={18} />} value={p.waterMl != null ? `${(p.waterMl / 1000).toFixed(1)}` : '—'} label="liter air" />
      <Metric icon={<IconLeaf size={18} />} value={p.veggieServ != null ? `${p.veggieServ}` : '—'} label="porsi sayur" />
      <Metric icon={<IconMoon size={18} />} value={p.sleepHr != null ? `${p.sleepHr}` : '—'} label="jam tidur" />
      <Metric icon={<IconFlame size={18} />} value={p.sugaryDrinks != null ? `${p.sugaryDrinks}` : '—'} label="min. manis" />
    </div>
  )
}

// ---- Compose modal -------------------------------------------------------
function ComposeModal({ onClose, onPost, authorEmail, authorName, role }: {
  onClose: () => void; onPost: (p: SocialPost) => void; authorEmail: string; authorName: string; role: Role
}) {
  const [postType, setPostType] = useState<PostType>('aktivitas')
  const [media, setMedia] = useState<'video' | 'foto'>('video')
  const [photoCount, setPhotoCount] = useState(2)
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [caption, setCaption] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [locked, setLocked] = useState(false)
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [waterMl, setWaterMl] = useState('')
  const [veggieServ, setVeggieServ] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  function submit() {
    const isVideo = media === 'video' && postType !== 'artikel'
    const base: SocialPost = {
      id: uid(), authorEmail, authorName, role, postType,
      kind: isVideo ? 'video' : 'image',
      activity: postType === 'kebiasaan' ? 'Kebiasaan sehat' : postType === 'artikel' ? 'Longevity' : activity,
      caption: caption.trim(), mediaColor: color,
      videoSec: isVideo ? 30 : undefined,
      photos: !isVideo && postType !== 'artikel' && photoCount > 1 ? Array.from({ length: photoCount }, (_, i) => COLORS[(COLORS.indexOf(color) + i) % COLORS.length]) : undefined,
      locked, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    }
    if (postType === 'aktivitas') { base.distanceKm = num(distanceKm); base.durationMin = num(durationMin) }
    else if (postType === 'kebiasaan') { base.waterMl = num(waterMl); base.veggieServ = num(veggieServ); if (!base.caption) base.caption = 'Kebiasaan sehat hari ini 💪' }
    else { base.articleTitle = articleTitle.trim() || caption.trim(); base.articleSource = 'Panaceamed Longevity' }
    onPost(base)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Unggah</h3>
        <p className="mt-0.5 text-sm text-neutral-500">Video singkat (maks 30 detik) atau beberapa foto.</p>

        <div className="mt-4 flex gap-2">
          {([['aktivitas', 'Aktivitas', <IconRun size={15} key="a" />], ['kebiasaan', 'Kebiasaan', <IconLeaf size={15} key="k" />], ['artikel', 'Artikel', <IconArticle size={15} key="r" />]] as const).map(([t, label, icon]) => (
            <button key={t} onClick={() => setPostType(t)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${postType === t ? 'bg-brand-50 text-brand-dark ring-1 ring-brand' : 'bg-neutral-100 text-neutral-500'}`}>{icon} {label}</button>
          ))}
        </div>

        {postType !== 'artikel' && (
          <div className="mt-3 flex gap-2">
            {([['video', 'Video 30 dtk', <IconVideo size={15} key="v" />], ['foto', 'Foto', <IconLeaf size={15} key="f" />]] as const).map(([m, label, icon]) => (
              <button key={m} onClick={() => setMedia(m)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${media === m ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-500'}`}>{icon} {label}</button>
            ))}
          </div>
        )}

        {postType !== 'artikel' && media === 'foto' && (
          <div className="mt-3"><Field label={`Jumlah foto: ${photoCount}`}><input type="range" min={1} max={4} value={photoCount} onChange={(e) => setPhotoCount(Number(e.target.value))} className="w-full accent-[#00BF63]" /></Field></div>
        )}

        <div className="mt-3 space-y-3">
          {postType === 'aktivitas' && (
            <>
              <Field label="Aktivitas"><select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}>{ACTIVITIES.map((a) => <option key={a}>{a}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jarak (km)"><input className={inputClass} type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} /></Field>
                <Field label="Durasi (menit)"><input className={inputClass} type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} /></Field>
              </div>
            </>
          )}
          {postType === 'kebiasaan' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Air putih (ml)"><input className={inputClass} type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} /></Field>
              <Field label="Porsi sayur/buah"><input className={inputClass} type="number" value={veggieServ} onChange={(e) => setVeggieServ(e.target.value)} /></Field>
            </div>
          )}
          {postType === 'artikel' && (
            <Field label="Judul artikel"><input className={inputClass} value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Kilasan artikel longevity" /></Field>
          )}
          <Field label="Caption"><input className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ceritakan kemajuan sehat Anda…" /></Field>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Warna:</span>
          {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ background: c }} />)}
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="h-4 w-4 accent-[#00BF63]" />
          <IconLock size={14} className="text-neutral-400" /> Kunci postingan (privat — hanya Anda)
        </label>

        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={submit}><IconPlus size={16} /> Posting</Button>
        </div>
      </div>
    </div>
  )
}
