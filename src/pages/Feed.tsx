import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

// Creator-subscription state shared with every PostCard.
const SubCtx = createContext<{ subscribed: Set<string>; price: number; subscribe: (email: string) => Promise<boolean> }>({
  subscribed: new Set(),
  price: 100,
  subscribe: async () => false,
})

export function Feed() {
  const store = useStore()
  const { state, account } = store
  const [tab, setTab] = useState<Tab>('home')
  const [compose, setCompose] = useState(false)
  const [viewProfile, setViewProfile] = useState<string | null>(null) // email of profile being viewed
  const [viewPost, setViewPost] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())
  const [subPrice, setSubPrice] = useState(100)

  const me = account?.email ?? 'me@panaceamed.id'

  useEffect(() => {
    if (!backendEnabled) return
    api.creatorSubs().then((r) => { setSubscribed(new Set(r.authors.map((a) => a.toLowerCase()))); setSubPrice(r.price) }).catch(() => {})
  }, [])

  async function subscribe(email: string): Promise<boolean> {
    try {
      const r = await api.creatorSubscribe(email)
      setSubscribed((s) => new Set(s).add(email.toLowerCase()))
      store.syncWalletBalance(r.balance)
      return true
    } catch {
      return false
    }
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
      {/* Top tab bar (TikTok-style) */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-center gap-1 border-b border-neutral-100 bg-white/85 px-4 py-2 backdrop-blur sm:gap-2">
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

      {/* Floating + upload — offset past the sidebar on desktop so it never
          overlaps the sidebar's SOS/Keluar buttons. */}
      <button
        onClick={() => setCompose(true)}
        className="fixed bottom-6 left-6 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark hover:scale-105 lg:left-[17rem]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewPost(null)}>
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
    if (p.archived) return false
    if (p.locked && p.authorEmail !== me) return false
    if (filter === 'following') return state.follows.includes(p.authorEmail) || p.authorEmail === me
    return true
  })
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="rise text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Panacea{' '}
          <span className="animate-gradient-text bg-gradient-to-r from-brand via-emerald-500 to-brand-dark bg-clip-text text-transparent">Hidup Sehat</span>
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Bagikan aktivitas, kebiasaan & artikel longevity Anda.</p>
      </div>
      <div className="flex justify-center gap-2">
        {([['foryou', 'Untuk Anda'], ['following', 'Mengikuti']] as const).map(([f, l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-5 py-1.5 text-sm font-bold transition active:scale-95 ${
              filter === f ? 'bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] text-white shadow-sm shadow-brand/30' : 'bg-white text-neutral-500 ring-1 ring-black/5 hover:ring-brand/30'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {posts.map((p) => <PostCard key={p.id} post={p} me={me} store={store} onProfile={onProfile} />)}
      {posts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="orb grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30">
            <IconPlus size={30} />
          </span>
          <p className="max-w-xs text-sm text-neutral-500">
            Belum ada unggahan. Ketuk tombol <b className="text-brand-dark">+</b> di kiri bawah untuk membagikan video singkat atau foto.
          </p>
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
  const fyp = state.posts.filter((p) => !p.locked && !p.archived && (p.postType !== 'artikel'))
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
        {shown.map((p) => {
          const cover = p.photos?.find(isImg)
          return (
            <button key={p.id} onClick={() => onOpen(p.id)} className="relative aspect-[3/4] overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
              {cover && <img src={cover} className="absolute inset-0 h-full w-full object-cover" alt="" />}
              <span className="absolute left-1.5 top-1.5 text-white/90 drop-shadow">{p.videoUrl || p.kind === 'video' ? <IconVideo size={16} /> : p.postType === 'kebiasaan' ? <IconLeaf size={16} /> : <IconRun size={16} />}</span>
              <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span>
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow"><IconHeart size={11} />{p.likes}</span>
            </button>
          )
        })}
      </div>
      {shown.length === 0 && <Card className="text-center text-sm text-neutral-400">Belum ada unggahan untuk ditampilkan.</Card>}
    </div>
  )
}

// ---- PROFILE (own) -------------------------------------------------------
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
      <Card className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full text-2xl font-extrabold text-white" style={{ background: color }}>
          {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(displayName)}
        </span>
        <h2 className="mt-2 text-xl font-extrabold">{displayName}</h2>
        <p className="text-sm text-neutral-500">{roleLabel[role]} · {me}</p>
        {prof?.bio && <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-600">{prof.bio}</p>}
        <div className="mt-3 flex justify-center gap-6 text-sm">
          <span><b>{mine.length}</b> <span className="text-neutral-400">Postingan</span></span>
          <span><b>{state.follows.length}</b> <span className="text-neutral-400">Mengikuti</span></span>
          <span><b>{sets.saved.length}</b> <span className="text-neutral-400">Disimpan</span></span>
        </div>
        <Button variant="outline" className="mt-3" onClick={() => setEdit(true)}>Edit Profil</Button>
      </Card>
      {edit && <EditProfileModal current={{ name: displayName, bio: prof?.bio ?? '', avatar: prof?.avatar }} onClose={() => setEdit(false)} onSave={(d) => { updateProfile(me, d); setEdit(false) }} />}

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
  const posts = state.posts.filter((p) => p.authorEmail === email && !p.archived && (!p.locked || p.authorEmail === me))
  const first = state.posts.find((p) => p.authorEmail === email)
  const prof = state.profiles[email]
  const name = prof?.name ?? first?.authorName ?? email
  const role = first?.role ?? 'pasien'
  const color = first?.mediaColor ?? COLORS[Math.abs(hash(email)) % COLORS.length]
  const following = state.follows.includes(email)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={onBack} className="text-sm font-semibold text-neutral-500 hover:text-brand-dark">← Kembali</button>
      <Card className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full text-2xl font-extrabold text-white" style={{ background: color }}>
          {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}
        </span>
        {prof?.bio && <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">{prof.bio}</p>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Edit Profil</h3>
        <div className="mt-4 flex flex-col items-center">
          <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-brand text-2xl font-extrabold text-white">
            {avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" /> : initials(name)}
          </span>
          <label className="mt-2 cursor-pointer text-sm font-semibold text-brand-dark hover:underline">
            {busy ? 'Mengunggah…' : 'Ubah foto profil'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Nama"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Status / Bio"><textarea className={`${inputClass} min-h-[70px]`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tulis status atau bio singkat…" /></Field>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={() => onSave({ name: name.trim() || current.name, bio: bio.trim(), avatar })}>Simpan</Button>
        </div>
      </div>
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
      {posts.map((p) => {
        const cover = p.photos?.find(isImg)
        return (
          <button key={p.id} onClick={() => onOpen(p.id)} className="relative aspect-[3/4] overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}>
            {cover && <img src={cover} className="absolute inset-0 h-full w-full object-cover" alt="" />}
            <span className="absolute left-1.5 top-1.5 text-white/90 drop-shadow">{p.locked ? <IconLock size={14} /> : p.videoUrl || p.kind === 'video' ? <IconVideo size={14} /> : <IconRun size={14} />}</span>
            <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-semibold text-white drop-shadow">{p.activity}</span>
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

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}

// Paywall overlay for subscriber-only (exclusive) posts.
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
      <div className="absolute inset-0 backdrop-blur-xl" />
      <div className="relative flex flex-col items-center gap-2 text-white">
        <span className="text-2xl">⭐🔒</span>
        <div className="text-sm font-bold">Konten Eksklusif</div>
        <p className="max-w-xs text-[12px] text-white/80">Langganan kreator <button onClick={() => onProfile(p.authorEmail)} className="font-bold underline">{p.authorName}</button> untuk membuka semua konten eksklusifnya.</p>
        <button onClick={go} disabled={busy} className="mt-1 rounded-full bg-white px-5 py-2 text-sm font-bold text-brand-dark shadow disabled:opacity-60">
          {busy ? 'Memproses…' : `Langganan · ${price} PNC / bulan`}
        </button>
        {err && <p className="text-[11px] text-amber-200">{err}</p>}
      </div>
    </div>
  )
}

// ---- Post card -----------------------------------------------------------
function PostCard({ post: p, me, store, onProfile }: {
  post: SocialPost; me: string; store: ReturnType<typeof useStore>; onProfile: (e: string) => void
}) {
  const type = p.postType ?? 'aktivitas'
  const mine = p.authorEmail === me
  const sub = useContext(SubCtx)
  const exclusiveLocked = !!p.exclusive && !mine && !sub.subscribed.has(p.authorEmail.toLowerCase())
  const following = store.state.follows.includes(p.authorEmail)
  const prof = store.state.profiles[p.authorEmail]
  const [menu, setMenu] = useState(false)
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => onProfile(p.authorEmail)} className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white" style={{ background: p.mediaColor }}>
          {prof?.avatar ? <img src={prof.avatar} className="h-full w-full object-cover" alt="" /> : initials(prof?.name ?? p.authorName)}
        </button>
        <button onClick={() => onProfile(p.authorEmail)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{prof?.name ?? p.authorName}</span>
            {p.locked && <IconLock size={13} className="text-neutral-400" />}
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">{roleLabel[p.role]}</span>
          </div>
          <span className="text-[11px] text-neutral-400">{timeAgo(p.at)} lalu · {p.activity}</span>
        </button>
        {mine ? (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="px-2 text-lg font-bold text-neutral-400">⋯</button>
            {menu && (
              <div className="absolute right-0 top-7 z-10 w-44 overflow-hidden rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/10">
                <button onClick={() => { store.updatePost(p.id, { locked: !p.locked }); setMenu(false) }} className="block w-full px-3 py-2 text-left hover:bg-neutral-50">{p.locked ? '🔓 Buka kunci' : '🔒 Kunci (privat)'}</button>
                <button onClick={() => { store.updatePost(p.id, { archived: !p.archived }); setMenu(false) }} className="block w-full px-3 py-2 text-left hover:bg-neutral-50">{p.archived ? '👁️ Tampilkan' : '🗄️ Arsipkan / sembunyikan'}</button>
                <button onClick={() => { if (confirm('Hapus postingan ini?')) store.deletePost(p.id) }} className="block w-full px-3 py-2 text-left text-accent hover:bg-red-50">🗑️ Hapus</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => store.toggleFollow(p.authorEmail)} className={`rounded-full px-3 py-1 text-xs font-bold ${following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand text-white'}`}>{following ? 'Mengikuti' : 'Ikuti'}</button>
        )}
      </div>

      {exclusiveLocked ? (
        <ExclusiveLock post={p} onProfile={onProfile} />
      ) : (
        <>
          {type === 'artikel' ? <ArticleBlock post={p} /> : <MediaBlock post={p} />}
          {type === 'aktivitas' && <ActivityMetrics post={p} />}
          {type === 'kebiasaan' && <HabitMetrics post={p} />}
          {(p.audio || p.location) && (
            <div className="flex flex-wrap gap-3 px-4 pt-2 text-[11px] font-semibold text-neutral-500">
              {p.audio && <span>🎵 {p.audio}</span>}
              {p.location && <span>📍 {p.location}</span>}
            </div>
          )}
          {p.caption && <p className="px-4 pt-3 text-sm text-ink">{p.caption}</p>}
        </>
      )}

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

function isImg(s: string): boolean {
  return s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('http')
}

function MediaBlock({ post: p }: { post: SocialPost }) {
  if (p.videoUrl) {
    return <video src={p.videoUrl} className="max-h-[70vh] w-full bg-black" controls muted loop playsInline />
  }
  const realPhotos = p.photos?.filter(isImg) ?? []
  if (realPhotos.length > 0) {
    if (realPhotos.length === 1) return <img src={realPhotos[0]} className="max-h-[70vh] w-full object-cover" alt={p.activity} />
    return (
      <div className={`grid gap-1 ${realPhotos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {realPhotos.slice(0, 4).map((src, i) => <img key={i} src={src} className="aspect-square w-full object-cover" alt="" />)}
      </div>
    )
  }
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
    const imgs = Array.from(files).slice(0, 4)
    setUploading(true)
    const urls = await Promise.all(imgs.map((f) => uploadOrLocal(f)))
    setPhotoData(urls)
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
      videoSec: isVideo ? 30 : undefined,
      videoUrl: isVideo ? videoUrl! : undefined,
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
            {([['foto', 'Foto', <IconLeaf size={15} key="f" />], ['video', 'Video 30 dtk', <IconVideo size={15} key="v" />]] as const).map(([m, label, icon]) => (
              <button key={m} onClick={() => setMedia(m)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${media === m ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-500'}`}>{icon} {label}</button>
            ))}
          </div>
        )}

        {postType !== 'artikel' && media === 'foto' && (
          <div className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-5 text-neutral-500 hover:border-brand">
              <IconPlus size={22} /><span className="text-xs font-semibold">Unggah foto (maks 4)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
            </label>
            {photoData.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {photoData.map((src, i) => <img key={i} src={src} className="aspect-square w-full rounded-lg object-cover" alt="" />)}
              </div>
            )}
          </div>
        )}

        {postType !== 'artikel' && media === 'video' && (
          <div className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-5 text-neutral-500 hover:border-brand">
              <IconVideo size={22} /><span className="text-xs font-semibold">Unggah video singkat (maks 30 detik)</span>
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => onPickVideo(e.target.files)} />
            </label>
            {videoUrl && <video src={videoUrl} className="mt-2 max-h-48 w-full rounded-lg" controls muted playsInline />}
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="🎵 Pilih lagu"><select className={inputClass} value={audio} onChange={(e) => setAudio(e.target.value)}>{SONGS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="📍 Lokasi"><input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. GBK, Jakarta" /></Field>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500">Warna:</span>
          {COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ background: c }} />)}
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="h-4 w-4 accent-[#00BF63]" />
          <IconLock size={14} className="text-neutral-400" /> Kunci postingan (privat — hanya Anda)
        </label>
        <label className="mt-2 flex items-center gap-2 rounded-xl bg-brand-50 p-2.5 text-sm text-brand-dark">
          <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} className="h-4 w-4 accent-[#00BF63]" />
          <span>⭐ <b>Konten Eksklusif</b> — hanya untuk subscriber (langganan 100 PNC/bln; Anda dapat 75, platform 25).</span>
        </label>

        {uploading && <p className="mt-3 text-xs font-semibold text-brand-dark">Mengunggah media…</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={submit} disabled={uploading}><IconPlus size={16} /> Posting</Button>
        </div>
      </div>
    </div>
  )
}
