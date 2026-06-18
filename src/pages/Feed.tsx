import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, Button, Field, inputClass } from '../components/ui'
import {
  IconUsers,
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
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import type { SocialPost, PostType, Role } from '../lib/types'

const ACTIVITIES = ['Lari', 'Jalan kaki', 'Berenang', 'Bersepeda', 'Padel', 'Futsal', 'Yoga', 'Gym', 'Menyapu']
const COLORS = ['#00BF63', '#0B7A4B', '#3b82f6', '#8b5cf6', '#f59e0b', '#FF3131']

const roleLabel: Record<Role, string> = {
  pasien: 'Pelanggan',
  dokter: 'Dokter',
  kontributor: 'Kontributor',
  verifikator: 'Verifikator',
  admin: 'Admin',
  owner: 'Owner',
}

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
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Feed() {
  const { state, account, addPost, toggleLike, toggleFollow } = useStore()
  const [filter, setFilter] = useState<'semua' | 'following'>('semua')
  const [typeTab, setTypeTab] = useState<'semua' | PostType>('semua')
  const [open, setOpen] = useState(false)

  const posts = state.posts.filter((p) => {
    const followOk = filter === 'following' ? state.follows.includes(p.authorEmail) || p.authorEmail === account?.email : true
    const typeOk = typeTab === 'semua' ? true : (p.postType ?? 'aktivitas') === typeTab
    return followOk && typeOk
  })

  function onCreate(p: SocialPost) {
    addPost(p)
    // Best-effort mirror to backend (rich metrics stay local).
    if (backendEnabled) api.createPost({ activity: p.activity, caption: p.caption, kind: p.kind, mediaColor: p.mediaColor }).catch(() => {})
    setOpen(false)
    setTypeTab('semua')
  }

  return (
    <div className="space-y-5">
      {/* Hero / about */}
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-brand to-brand-dark px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight">Panacea Hidup Sehat</h2>
              <p className="mt-1 max-w-lg text-sm text-white/85">
                Jejaring sosial untuk hidup sehat — bagikan aktivitas fisik ala Strava, kebiasaan sehat harian
                (air putih, sayur, tidur), dan kilasan artikel longevity. Saling menyemangati menuju umur panjang.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 border-white !text-white hover:!bg-white/15" onClick={() => setOpen((o) => !o)}>
              <IconPlus size={16} /> Bagikan
            </Button>
          </div>
        </div>
        {open && (
          <div className="border-t border-neutral-100 p-5">
            <Composer
              onPost={onCreate}
              authorEmail={account?.email ?? 'me@panaceamed.id'}
              authorName={account?.name ?? 'Saya'}
              role={account?.role ?? 'pasien'}
            />
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['semua', 'following'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              filter === f ? 'bg-ink text-white' : 'bg-white text-neutral-500 ring-1 ring-black/5'
            }`}
          >
            {f === 'semua' ? 'Untuk Anda' : 'Mengikuti'}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        {([
          ['semua', 'Semua'],
          ['aktivitas', 'Aktivitas'],
          ['kebiasaan', 'Kebiasaan'],
          ['artikel', 'Longevity'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTypeTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              typeTab === t ? 'bg-brand text-white' : 'bg-white text-neutral-500 ring-1 ring-black/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="mx-auto max-w-xl space-y-5">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            mine={p.authorEmail === account?.email}
            following={state.follows.includes(p.authorEmail)}
            onLike={() => toggleLike(p.id)}
            onFollow={() => toggleFollow(p.authorEmail)}
          />
        ))}
        {posts.length === 0 && (
          <Card className="text-center text-sm text-neutral-400">
            Belum ada unggahan di sini. Bagikan aktivitas atau kebiasaan sehat Anda untuk memulai.
          </Card>
        )}
      </div>
    </div>
  )
}

function PostCard({
  post: p,
  mine,
  following,
  onLike,
  onFollow,
}: {
  post: SocialPost
  mine: boolean
  following: boolean
  onLike: () => void
  onFollow: () => void
}) {
  const type = p.postType ?? 'aktivitas'
  return (
    <Card className="!p-0 overflow-hidden">
      {/* author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ background: p.mediaColor }}
        >
          {initials(p.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{p.authorName}</span>
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
              {roleLabel[p.role]}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">{timeAgo(p.at)} lalu · {p.activity}</span>
        </div>
        {!mine && (
          <button
            onClick={onFollow}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              following ? 'bg-neutral-100 text-neutral-500' : 'bg-brand text-white'
            }`}
          >
            {following ? 'Mengikuti' : 'Ikuti'}
          </button>
        )}
      </div>

      {/* media / content */}
      {type === 'artikel' ? (
        <ArticleBlock post={p} />
      ) : (
        <MediaBlock post={p} />
      )}

      {/* metrics */}
      {type === 'aktivitas' && <ActivityMetrics post={p} />}
      {type === 'kebiasaan' && <HabitMetrics post={p} />}

      {/* caption */}
      {p.caption && <p className="px-4 pt-3 text-sm text-ink">{p.caption}</p>}

      {/* actions */}
      <div className="flex items-center gap-5 px-4 py-3 text-neutral-500">
        <button onClick={onLike} className="flex items-center gap-1.5 text-sm font-semibold">
          <IconHeart size={18} className={p.likedByMe ? 'text-accent' : ''} />
          <span className={p.likedByMe ? 'text-accent' : ''}>{p.likes}</span>
        </button>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <IconComment size={18} /> {p.comments ?? 0}
        </span>
      </div>
    </Card>
  )
}

function MediaBlock({ post: p }: { post: SocialPost }) {
  return (
    <div
      className="relative flex aspect-[16/10] items-center justify-center"
      style={{ background: `linear-gradient(150deg, ${p.mediaColor}, #0c1410)` }}
    >
      <div className="text-center text-white/95">
        {(p.postType ?? 'aktivitas') === 'kebiasaan' ? (
          <IconLeaf size={44} className="mx-auto" />
        ) : p.kind === 'video' ? (
          <IconVideo size={44} className="mx-auto" />
        ) : (
          <IconRun size={44} className="mx-auto" />
        )}
        <div className="mt-2 text-2xl font-extrabold">{p.activity}</div>
        {p.kind === 'video' && p.durationSec && (
          <span className="mt-1 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[11px]">▶ {p.durationSec}s</span>
        )}
      </div>
    </div>
  )
}

function ArticleBlock({ post: p }: { post: SocialPost }) {
  return (
    <div className="mx-4 mt-1 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-dark">
        <IconArticle size={15} /> Artikel Longevity
      </div>
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

function Composer({
  onPost,
  authorEmail,
  authorName,
  role,
}: {
  onPost: (p: SocialPost) => void
  authorEmail: string
  authorName: string
  role: Role
}) {
  const [postType, setPostType] = useState<PostType>('aktivitas')
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [caption, setCaption] = useState('')
  const [kind, setKind] = useState<'image' | 'video'>('image')
  const [color, setColor] = useState(COLORS[0])
  // metrics
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [calories, setCalories] = useState('')
  const [waterMl, setWaterMl] = useState('')
  const [veggieServ, setVeggieServ] = useState('')
  const [sleepHr, setSleepHr] = useState('')
  const [sugaryDrinks, setSugaryDrinks] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [articleSource, setArticleSource] = useState('')

  function num(s: string): number | undefined {
    return s.trim() === '' ? undefined : Number(s)
  }

  function submit() {
    const base: SocialPost = {
      id: uid(),
      authorEmail,
      authorName,
      role,
      postType,
      kind,
      activity:
        postType === 'kebiasaan' ? 'Kebiasaan sehat' : postType === 'artikel' ? 'Longevity' : activity,
      caption: caption.trim(),
      mediaColor: color,
      durationSec: kind === 'video' ? 15 : undefined,
      likes: 0,
      comments: 0,
      at: new Date().toISOString(),
    }
    if (postType === 'aktivitas') {
      base.distanceKm = num(distanceKm)
      base.durationMin = num(durationMin)
      base.calories = num(calories)
    } else if (postType === 'kebiasaan') {
      base.waterMl = num(waterMl)
      base.veggieServ = num(veggieServ)
      base.sleepHr = num(sleepHr)
      base.sugaryDrinks = num(sugaryDrinks)
      if (!base.caption) base.caption = 'Kebiasaan sehat hari ini 💪'
    } else {
      base.articleTitle = articleTitle.trim() || caption.trim()
      base.articleSource = articleSource.trim() || 'Panaceamed Longevity'
    }
    onPost(base)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {([
          ['aktivitas', 'Aktivitas', <IconRun size={15} key="a" />],
          ['kebiasaan', 'Kebiasaan', <IconLeaf size={15} key="k" />],
          ['artikel', 'Artikel', <IconArticle size={15} key="r" />],
        ] as const).map(([t, label, icon]) => (
          <button
            key={t}
            onClick={() => setPostType(t)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              postType === t ? 'bg-brand-50 text-brand-dark ring-1 ring-brand' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {postType === 'aktivitas' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aktivitas">
            <select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITIES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Jenis media">
            <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as 'image' | 'video')}>
              <option value="image">Foto</option>
              <option value="video">Video singkat (15 dtk)</option>
            </select>
          </Field>
          <Field label="Jarak (km)"><input className={inputClass} type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="mis. 5" /></Field>
          <Field label="Durasi (menit)"><input className={inputClass} type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="mis. 30" /></Field>
          <Field label="Kalori (kkal)"><input className={inputClass} type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="mis. 300" /></Field>
        </div>
      )}

      {postType === 'kebiasaan' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Air putih (ml)"><input className={inputClass} type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} placeholder="mis. 2000" /></Field>
          <Field label="Porsi sayur/buah"><input className={inputClass} type="number" value={veggieServ} onChange={(e) => setVeggieServ(e.target.value)} placeholder="mis. 3" /></Field>
          <Field label="Tidur (jam)"><input className={inputClass} type="number" value={sleepHr} onChange={(e) => setSleepHr(e.target.value)} placeholder="mis. 7" /></Field>
          <Field label="Minuman manis (gelas)"><input className={inputClass} type="number" value={sugaryDrinks} onChange={(e) => setSugaryDrinks(e.target.value)} placeholder="mis. 0" /></Field>
        </div>
      )}

      {postType === 'artikel' && (
        <div className="grid gap-3">
          <Field label="Judul artikel"><input className={inputClass} value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Judul kilasan artikel longevity" /></Field>
          <Field label="Sumber"><input className={inputClass} value={articleSource} onChange={(e) => setArticleSource(e.target.value)} placeholder="mis. Panaceamed Longevity / Nature" /></Field>
        </div>
      )}

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
      <Button className="mt-4" onClick={submit}>
        <IconUsers size={16} /> Posting
      </Button>
    </div>
  )
}
