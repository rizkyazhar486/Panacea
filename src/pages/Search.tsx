import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { PostCard } from './Feed'
import { backendEnabled } from '../lib/api'
import { IconSearch, IconUsers } from '../components/icons'

// Search — find people (profiles) and posts. Operates over the posts available
// locally; with a backend the feed includes other users so search spans them too.
export function Search() {
  const { state, account, toggleFollow } = useStore()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  // Distinct authors → "profiles" directory derived from known posts.
  const people = useMemo(() => {
    const by = new Map<string, { email: string; name: string; role: string; posts: number }>()
    for (const p of state.posts) {
      const cur = by.get(p.authorEmail) ?? { email: p.authorEmail, name: p.authorName, role: p.role, posts: 0 }
      cur.posts += 1
      by.set(p.authorEmail, cur)
    }
    return [...by.values()]
  }, [state.posts])

  const matchedPeople = query ? people.filter((p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)) : people
  const matchedPosts = query
    ? state.posts.filter((p) => !p.archived && !p.locked && (
        p.caption?.toLowerCase().includes(query) || p.activity?.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query)))
    : []

  if (!account) return null

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
        <IconSearch size={18} className="text-neutral-400" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari orang atau postingan…" className="w-full bg-transparent text-sm outline-none" />
      </div>

      {!backendEnabled && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Pencarian mencakup semua pengguna saat server tersambung. Tanpa server, hanya mencari kiriman di perangkat ini.
        </p>
      )}

      {/* People */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
          <IconUsers size={14} /> Orang
        </div>
        {matchedPeople.length === 0 ? (
          <p className="px-1 text-xs text-neutral-400">Tidak ada orang yang cocok.</p>
        ) : (
          <div className="space-y-2">
            {matchedPeople.map((p) => {
              const isMe = p.email === account.email
              const following = state.follows.includes(p.email)
              return (
                <div key={p.email} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">{p.name.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink">{p.name}{isMe && <span className="ml-1 text-[10px] font-normal text-neutral-400">(Anda)</span>}</div>
                    <div className="truncate text-[11px] text-neutral-400">@{p.email.split('@')[0]} · {p.posts} kiriman</div>
                  </div>
                  {!isMe && (
                    <button onClick={() => toggleFollow(p.email)} className={'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ' + (following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand text-white')}>
                      {following ? 'Mengikuti' : '+ Ikuti'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Posts */}
      {query && (
        <div>
          <div className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Postingan</div>
          {matchedPosts.length === 0 ? (
            <p className="px-1 text-xs text-neutral-400">Tidak ada postingan yang cocok.</p>
          ) : (
            <div className="space-y-4">
              {matchedPosts.map((p) => <PostCard key={p.id} post={p} viewerEmail={account.email} viewerName={account.name} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
