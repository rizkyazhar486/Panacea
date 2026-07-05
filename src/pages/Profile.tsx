import { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { HealthSnapshot } from '../components/HealthSnapshot'
import { PostCard } from './Feed'
import { compressImage, readAsDataUrl } from '../lib/upload'
import { IconX } from '../components/icons'
import type { ProfileEdit } from '../lib/types'

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
const SEX_LABEL: Record<string, string> = { L: '♂ Laki-laki', P: '♀ Perempuan', '-': 'Tidak disebut' }

export function Profile() {
  const { state, account, updateProfile } = useStore()
  const [tab, setTab] = useState<Tab>('posts')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ProfileEdit>({})
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!account) return null
  const email = account.email
  const profile = state.profiles[email] ?? {}
  const handle = '@' + email.split('@')[0]

  const openEdit = () => { setDraft({ bio: profile.bio, sex: profile.sex, location: profile.location, profession: profile.profession, link: profile.link, avatar: profile.avatar }); setEditing(true) }
  const saveProfile = () => { updateProfile(email, draft); setEditing(false) }
  const pickAvatar = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 512, 0.85))
      setDraft((d) => ({ ...d, avatar: dataUrl }))
    } catch { /* ignore */ }
    setBusy(false)
  }
  const normalizeUrl = (u?: string) => (!u ? '' : /^https?:\/\//.test(u) ? u : `https://${u}`)

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

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={openEdit} className="relative h-20 w-20 shrink-0" aria-label="Ubah foto profil">
          {profile.avatar
            ? <img src={profile.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
            : <span className="grid h-20 w-20 place-items-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: '#00BF63' }}>{account.name.slice(0, 2).toUpperCase()}</span>}
          <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand text-[11px] text-white">✎</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black text-ink">{account.name}</h1>
          <div className="truncate text-xs text-neutral-400">{handle}</div>
          <div className="mt-2 flex gap-5 text-center">
            <div><div className="text-sm font-black text-ink">{state.follows.length}</div><div className="text-[10px] text-neutral-400">Mengikuti</div></div>
            <div><div className="text-sm font-black text-ink">{collections.posts.length}</div><div className="text-[10px] text-neutral-400">Postingan</div></div>
            <div><div className="text-sm font-black text-ink">{totalLikes}</div><div className="text-[10px] text-neutral-400">Suka</div></div>
          </div>
        </div>
      </div>

      {/* Identity + bio + link */}
      <div className="mt-3 space-y-1">
        {profile.bio && <p className="text-sm text-neutral-700">{profile.bio}</p>}
        {(profile.sex || profile.location || profile.profession) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
            {profile.sex && <span>{SEX_LABEL[profile.sex]}</span>}
            {profile.profession && <span>💼 {profile.profession}</span>}
            {profile.location && <span>📍 {profile.location}</span>}
          </div>
        )}
        {profile.link && (
          <a href={normalizeUrl(profile.link)} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-brand-dark">🔗 {profile.link}</a>
        )}
      </div>

      <HealthSnapshot className="mt-3" />

      {/* Edit profile button */}
      <button onClick={openEdit} className="mt-3 w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-700">
        ✎ Edit Profil
      </button>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setEditing(false) }}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Edit Profil</h3>
              <button onClick={() => setEditing(false)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
            </div>

            {/* Foto */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="relative h-24 w-24" aria-label="Unggah foto">
                {draft.avatar
                  ? <img src={draft.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
                  : <span className="grid h-24 w-24 place-items-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: '#00BF63' }}>{account.name.slice(0, 2).toUpperCase()}</span>}
                <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand text-xs text-white">📷</span>
              </button>
              <span className="text-[11px] text-neutral-400">{busy ? 'Mengunggah…' : 'Ketuk untuk ganti foto'}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Jenis Kelamin</span>
                <div className="mt-1 flex gap-2">
                  {(['L', 'P', '-'] as const).map((s) => (
                    <button key={s} onClick={() => setDraft((d) => ({ ...d, sex: s }))}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold ${draft.sex === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>{SEX_LABEL[s]}</button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Pekerjaan / Keahlian</span>
                <input value={draft.profession ?? ''} onChange={(e) => setDraft((d) => ({ ...d, profession: e.target.value }))} placeholder="mis. Dokter Umum, Atlet, Pelatih" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Domisili</span>
                <input value={draft.location ?? ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="mis. Jakarta" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Bio</span>
                <textarea value={draft.bio ?? ''} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} placeholder="Ceritakan tentang Anda…" className="mt-1 min-h-[64px] w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Tautan / Sitasi (URL)</span>
                <input value={draft.link ?? ''} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="mis. linkedin.com/in/nama atau doi.org/…" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
            </div>

            <button onClick={saveProfile} className="mt-5 w-full rounded-2xl py-3 text-base font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Simpan Profil</button>
          </div>
        </div>
      )}

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
