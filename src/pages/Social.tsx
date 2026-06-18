import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass } from '../components/ui'
import { IconUsers, IconVideo, IconPlus } from '../components/icons'
import type { SocialPost } from '../lib/types'

const ACTIVITIES = ['Lari', 'Berenang', 'Padel', 'Futsal', 'Main bola', 'Makan sehat', 'Yoga', 'Bersepeda']
const COLORS = ['#00BF63', '#0B7A4B', '#3b82f6', '#FF3131', '#f59e0b', '#8b5cf6']

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'baru saja'
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

export function Social() {
  const { state, account, addPost, toggleLike, toggleFollow } = useStore()
  const [filter, setFilter] = useState<'semua' | 'following'>('semua')
  const [open, setOpen] = useState(false)

  const posts = state.posts.filter((p) =>
    filter === 'following' ? state.follows.includes(p.authorEmail) || p.authorEmail === account?.email : true,
  )

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          icon={<IconUsers size={20} />}
          title="Sosial — Kemajuan Kesehatan"
          subtitle="Bagikan aktivitas & pilihan makanan sehat · follow/unfollow seperti media sosial"
          right={
            <Button onClick={() => setOpen((o) => !o)}>
              <IconPlus size={16} /> Unggah
            </Button>
          }
        />
        <div className="flex gap-2">
          {(['semua', 'following'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                filter === f ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {f === 'semua' ? 'Untuk Anda' : 'Mengikuti'}
            </button>
          ))}
        </div>
        {open && <Composer onPost={(p) => { addPost(p); setOpen(false) }} authorEmail={account?.email ?? 'me@panaceamed.id'} authorName={account?.name ?? 'Saya'} role={account?.role ?? 'pasien'} />}
      </Card>

      {/* Vertical TikTok-like feed */}
      <div className="mx-auto max-w-md space-y-4">
        {posts.map((p) => {
          const mine = p.authorEmail === account?.email
          const following = state.follows.includes(p.authorEmail)
          return (
            <div key={p.id} className="overflow-hidden rounded-3xl bg-ink shadow-lg">
              {/* media (placeholder) */}
              <div
                className="relative flex aspect-[9/14] items-center justify-center"
                style={{ background: `linear-gradient(160deg, ${p.mediaColor}, #0c1410)` }}
              >
                <div className="text-center text-white/90">
                  {p.kind === 'video' ? <IconVideo size={46} className="mx-auto" /> : <IconUsers size={46} className="mx-auto" />}
                  <div className="mt-2 text-2xl font-extrabold">{p.activity}</div>
                  {p.kind === 'video' && (
                    <div className="mt-1 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[11px]">▶ {p.durationSec}s</div>
                  )}
                </div>
                {/* like rail */}
                <div className="absolute bottom-4 right-3 flex flex-col items-center gap-3 text-white">
                  <button onClick={() => toggleLike(p.id)} className="flex flex-col items-center">
                    <span className={`text-2xl ${p.likedByMe ? 'scale-110' : ''}`}>{p.likedByMe ? '❤️' : '🤍'}</span>
                    <span className="text-xs font-semibold">{p.likes}</span>
                  </button>
                </div>
                {/* caption */}
                <div className="absolute bottom-3 left-3 right-16 text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">@{p.authorName.split(' ').slice(-1)[0].toLowerCase()}</span>
                    {!mine && (
                      <button
                        onClick={() => toggleFollow(p.authorEmail)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          following ? 'bg-white/20' : 'bg-brand'
                        }`}
                      >
                        {following ? 'Mengikuti' : 'Ikuti'}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{p.caption}</p>
                  <p className="text-[11px] text-white/60">{timeAgo(p.at)} · {p.authorName}</p>
                </div>
              </div>
            </div>
          )
        })}
        {posts.length === 0 && (
          <Card className="text-center text-sm text-neutral-400">Belum ada unggahan. Ikuti seseorang atau unggah aktivitas Anda.</Card>
        )}
      </div>
    </div>
  )
}

function Composer({
  onPost,
  authorEmail,
  authorName,
  role,
}: {
  onPost: (p: SocialPost) => void
  authorEmail: string
  authorName: string
  role: SocialPost['role']
}) {
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [caption, setCaption] = useState('')
  const [kind, setKind] = useState<'image' | 'video'>('image')
  const [color, setColor] = useState(COLORS[0])

  return (
    <div className="mt-4 rounded-2xl border border-neutral-100 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Aktivitas">
          <select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}>
            {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Jenis">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as 'image' | 'video')}>
            <option value="image">Gambar</option>
            <option value="video">Video singkat (15 dtk)</option>
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Caption">
          <input className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ceritakan kemajuan sehat Anda…" />
        </Field>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500">Warna:</span>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`} style={{ background: c }} />
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={() =>
          onPost({
            id: uid(),
            authorEmail,
            authorName,
            role,
            kind,
            activity,
            caption: caption.trim() || activity,
            mediaColor: color,
            durationSec: kind === 'video' ? 15 : undefined,
            likes: 0,
            at: new Date().toISOString(),
          })
        }
      >
        Posting
      </Button>
    </div>
  )
}
