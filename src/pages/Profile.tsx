import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { PostCard } from './Feed'

type Tab = 'posts' | 'locked' | 'reposts' | 'saved' | 'liked' | 'archive'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'posts', icon: '▦', label: 'Postingan' },
  { id: 'locked', icon: '🔒', label: 'Terkunci' },
  { id: 'reposts', icon: '🔁', label: 'Repost' },
  { id: 'saved', icon: '🔖', label: 'Tersimpan' },
  { id: 'liked', icon: '❤️', label: 'Disukai' },
  { id: 'archive', icon: '📦', label: 'Arsip' },
]

// User profile — TikTok/Instagram-style: counts, bio, and tabbed collections
// (posts, locked, reposts, bookmarks, liked, archive). Locked/archived/saved are
// private to the owner; others never see them.
export function Profile() {
  const { state, account, updateProfile } = useStore()
  const [tab, setTab] = useState<Tab>('posts')
  const [editBio, setEditBio] = useState(false)
  const [bioDraft, setBioDraft] = useState('')

  if (!account) return null
  const email = account.email
  const profile = state.profiles[email] ?? {}
  const handle = '@' + email.split('@')[0]

  const mine = state.posts.filter((p) => p.authorEmail === email)
  const collections = useMemo(() => ({
    posts: mine.filter((p) => !p.archived && !p.locked),
    locked: mine.filter((p) => p.locked && !p.archived),
    archive: mine.filter((p) => p.archived),
    reposts: state.posts.filter((p) => p.repostedByMe),
    saved: state.posts.filter((p) => p.bookmarkedByMe),
    liked: state.posts.filter((p) => p.likedByMe),
  }), [state.posts, email])

  const totalLikes = mine.reduce((s, p) => s + p.likes, 0)
  const list = collections[tab]

  const saveBio = () => { updateProfile(email, { bio: bioDraft.trim() }); setEditBio(false) }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: '#00BF63' }}>
          {account.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black text-ink">{account.name}</h1>
          <div className="truncate text-xs text-neutral-400">{handle}</div>
          {/* Counts */}
          <div className="mt-2 flex gap-5 text-center">
            <div><div className="text-sm font-black text-ink">{state.follows.length}</div><div className="text-[10px] text-neutral-400">Mengikuti</div></div>
            <div><div className="text-sm font-black text-ink">{collections.posts.length}</div><div className="text-[10px] text-neutral-400">Postingan</div></div>
            <div><div className="text-sm font-black text-ink">{totalLikes}</div><div className="text-[10px] text-neutral-400">Suka</div></div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mt-3">
        {editBio ? (
          <div className="flex items-center gap-2">
            <input value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} placeholder="Tulis bio singkat…" className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <button onClick={saveBio} className="rounded-xl px-3 py-2 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Simpan</button>
          </div>
        ) : (
          <button onClick={() => { setBioDraft(profile.bio ?? ''); setEditBio(true) }} className="text-sm text-neutral-600">
            {profile.bio ? profile.bio : <span className="font-semibold text-brand-dark">+ Tambah bio</span>}
          </button>
        )}
      </div>

      {/* Tabs (icon-first) */}
      <div className="mt-4 flex border-b border-neutral-100">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-label={t.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-lg transition-colors ${tab === t.id ? 'border-b-2 border-brand text-ink' : 'text-neutral-400'}`}>
            <span>{t.icon}</span>
            <span className="text-[8px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Collection */}
      <div className="mt-4 space-y-4">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-400">
            {tab === 'posts' && 'Belum ada postingan. Buat lewat tombol ＋.'}
            {tab === 'locked' && '🔒 Belum ada postingan terkunci. Postingan terkunci hanya terlihat oleh Anda.'}
            {tab === 'reposts' && '🔁 Belum ada repost.'}
            {tab === 'saved' && '🔖 Belum ada yang disimpan. Bookmark postingan untuk melihatnya di sini (privat).'}
            {tab === 'liked' && '❤️ Belum ada yang disukai.'}
            {tab === 'archive' && '📦 Arsip kosong. Postingan yang diarsipkan disembunyikan dari publik.'}
          </div>
        ) : (
          list.map((p) => <PostCard key={p.id} post={p} viewerEmail={email} viewerName={account.name} />)
        )}
      </div>
    </div>
  )
}
