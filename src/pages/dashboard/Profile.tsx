import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useStore, uid, OWNER_EMAIL } from '../../lib/store'
import { HealthSnapshot } from '../../components/HealthSnapshot'
import { PostCard } from '../social/Feed'
import { compressImage, readAsDataUrl } from '../../lib/upload'
import { IconX, IconLogout } from '../../components/icons'
import { api, backendEnabled } from '../../lib/api'
import { Portal } from '../../components/Portal'
import { PersonalBodyUnifiedSurface } from '../../components/PersonalBodyUnifiedSurface'
import { SurfaceGuide } from '../../components/SurfaceGuide'
import type { ProfileEdit } from '../../lib/types'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { WhenOpened } from '../../shared/ui/WhenOpened'
import { buildNeonOutboxEvent } from '../../domains/character/index.ts'
import { extractProfileKeyFromAccount } from '../../domains/beta/index.ts'

const GtaCharacterPersonaCard = lazy(() =>
  import('../../components/GtaCharacterPersonaCard').then((m) => ({ default: m.GtaCharacterPersonaCard })),
)
const QrHealthPassModal = lazy(() =>
  import('../../components/QrHealthPassModal').then((m) => ({ default: m.QrHealthPassModal })),
)
const BetaFeedbackWidget = lazy(() =>
  import('../../components/beta/BetaFeedbackWidget').then((m) => ({ default: m.BetaFeedbackWidget })),
)

const NEON_OUTBOX_KEY = 'pmd_neon_sync_outbox_v1'

type Tab = 'posts' | 'locked' | 'reposts' | 'saved' | 'liked' | 'archive'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'posts', icon: '▦', label: 'Posts' },
  { id: 'locked', icon: '🔒', label: 'Locked' },
  { id: 'reposts', icon: '🔁', label: 'Reposts' },
  { id: 'saved', icon: '🔖', label: 'Saved' },
  { id: 'liked', icon: '❤️', label: 'Liked' },
  { id: 'archive', icon: '📦', label: 'Archive' },
]

// User profile — TikTok/Instagram-style: counts, bio, and tabbed collections
// (posts, locked, reposts, bookmarks, liked, archive). Locked/archived/saved are
// private to the owner; others never see them.
const SEX_LABEL: Record<string, string> = { L: '♂ Male', P: '♀ Female', '-': 'Not specified' }

// Pemeriksa akun terpisah: hook di badan hanya berjalan bila akun ada, sehingga
// urutan hook tidak berubah saat akun berpindah null <-> ada (React crash).
export function Profile() {
  const { account } = useStore()
  if (!account) return null
  return <ProfileIsi account={account} />
}

function ProfileIsi({ account }: { account: NonNullable<ReturnType<typeof useStore>['account']> }) {
  const { state, activePatient, setActivePatient, addPatient, updateProfile, logout } = useStore()
  const doLogout = () => {
    if (backendEnabled) api.logout().catch(() => {})
    logout()
  }
  const [tab, setTab] = useState<Tab>('posts')
  const [editing, setEditing] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [shareNote, setShareNote] = useState('')
  const [draft, setDraft] = useState<ProfileEdit>({})
  const [busy, setBusy] = useState(false)
  const [familyOpen, setFamilyOpen] = useState(false)
  const [famName, setFamName] = useState('')
  const [famSex, setFamSex] = useState<'L' | 'P'>('L')
  const [famDob, setFamDob] = useState('')
  const [famAllergies, setFamAllergies] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const email = account.email
  const profile = state.profiles[email] ?? {}
  const isCanonicalOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase() || account.isOwner
  const isolatedKey = extractProfileKeyFromAccount(account)
  const displayName = profile.name?.trim() || (isCanonicalOwner ? 'dr. Rizky Muhammad Azrissal' : account.name)
  const usernameClean = (profile.username?.trim() || (isCanonicalOwner ? 'rizkyazhar486' : isolatedKey)).replace(/^@+/, '')
  const handle = '@' + usernameClean
  const verifiedClinician = Boolean(account.role === 'dokter' || account.isOwner || isCanonicalOwner)
  const clinicalCategory = profile.profession?.trim() || (verifiedClinician ? 'Doctor · Digital Twin & Longevity' : '')
  const displayLink = profile.link?.trim() || (isCanonicalOwner ? 'panaceamed.id' : '')
  const initials = isCanonicalOwner ? 'DR' : displayName.slice(0, 2).toUpperCase()

  const openEdit = () => {
    setDraft({
      name: displayName,
      username: usernameClean,
      bio: profile.bio ?? (isCanonicalOwner ? 'Health, Made Visible — Longitudinal AI-EMR, 3D Body Exposure & Preventive Longevity OS.' : ''),
      sex: profile.sex,
      location: profile.location,
      profession: clinicalCategory,
      link: displayLink,
      avatar: profile.avatar,
    })
    setEditing(true)
  }

  const saveProfile = () => {
    const cleaned: ProfileEdit = {
      ...draft,
      name: draft.name?.trim() || displayName,
      username: draft.username?.trim().replace(/^@+/, '') || usernameClean,
    }
    updateProfile(email, cleaned)
    try {
      const ev = buildNeonOutboxEvent({
        profileKey: isolatedKey,
        entityType: 'panacea_profiles',
        payload: {
          fullName: cleaned.name,
          username: cleaned.username,
          clinicalTitle: cleaned.profession || '',
          bio: cleaned.bio || '',
          website: cleaned.link || '',
        },
        createdAtIso: new Date().toISOString(),
      })
      const existing = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
      const next = Array.isArray(existing) ? [ev, ...existing].slice(0, 40) : [ev]
      localStorage.setItem(NEON_OUTBOX_KEY, JSON.stringify(next))
      setShareNote(`Profile saved & queued for Neon sync (${ev.eventId}).`)
    } catch {
      setShareNote('Profile saved locally.')
    }
    setEditing(false)
  }

  const shareProfile = async () => {
    const shareUrl = `https://panaceamed.id/#/profile?u=${encodeURIComponent(usernameClean)}`
    const shareText = `${displayName} (${handle}) · PanaceaMed.id`
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: displayName, text: shareText, url: shareUrl })
        setShareNote('Profile shared.')
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setShareNote(`Profile link copied: ${shareUrl}`)
        return
      }
    } catch { /* user cancelled share */ }
    setShareNote(`Share link: ${shareUrl}`)
  }

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
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Instagram-class Adaptive Profile Header */}
      <section aria-label="Profile identity" className="rounded-3xl border border-neutral-200/80 bg-white/95 p-4 text-ink dark:border-cyan-400/25 dark:bg-[#060d16]/95 dark:text-white sm:p-5">
        <div className="flex items-start gap-4 sm:gap-6">
          <button
            type="button"
            onClick={openEdit}
            className="relative h-20 w-20 shrink-0 rounded-full p-[3px] sm:h-24 sm:w-24"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #10b981, #c6ff34)' }}
            aria-label="Change profile photo"
          >
            <span className="block h-full w-full overflow-hidden rounded-full bg-white p-[2px] dark:bg-[#050a10]">
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                : <span className="font-astro grid h-full w-full place-items-center rounded-full bg-emerald-100 text-xl font-black text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200 sm:text-2xl">{initials}</span>}
            </span>
            <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-600 text-[11px] font-bold text-white dark:border-[#050a10] dark:bg-emerald-500 dark:text-[#050a10]">✎</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="truncate text-base font-black tracking-tight text-ink dark:text-white sm:text-lg">{displayName}</h1>
              {verifiedClinician && (
                <span className="font-astro-mono inline-flex items-center rounded-full border border-cyan-600/30 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-200">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="font-astro-mono truncate text-xs text-neutral-600 dark:text-slate-300">{handle}</div>

            {/* Clean 3-metric Instagram counter row */}
            <div className="mt-3 grid max-w-xs grid-cols-3 gap-2 text-left">
              <div>
                <div className="font-astro-mono text-sm font-black text-ink dark:text-white">{collections.posts.length}</div>
                <div className="text-[10px] text-neutral-600 dark:text-slate-300">Posts</div>
              </div>
              <div>
                <div className="font-astro-mono text-sm font-black text-ink dark:text-white">{state.patients.length || 1}</div>
                <div className="text-[10px] text-neutral-600 dark:text-slate-300">Profiles</div>
              </div>
              <div>
                <div className="font-astro-mono text-sm font-black text-ink dark:text-white">{state.follows.length + totalLikes}</div>
                <div className="text-[10px] text-neutral-600 dark:text-slate-300">Signals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category + Bio + Website Link */}
        <div className="mt-3 space-y-1">
          {clinicalCategory && <div className="text-xs font-bold text-cyan-800 dark:text-cyan-300">{clinicalCategory}</div>}
          {(profile.bio || isCanonicalOwner) && (
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-slate-200 sm:text-sm">
              {profile.bio || 'Health, made visible.'}
            </p>
          )}
          {(profile.sex || profile.location) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600 dark:text-slate-300">
              {profile.sex && <span>{SEX_LABEL[profile.sex]}</span>}
              {profile.location && <span>📍 {profile.location}</span>}
            </div>
          )}
          {displayLink && (
            <a href={normalizeUrl(displayLink)} target="_blank" rel="noopener noreferrer" className="font-astro-mono inline-block text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300">
              🔗 {displayLink}
            </a>
          )}
        </div>

        {/* Side-by-side Instagram action buttons + One-Scan QR Pass */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={openEdit}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-bold text-ink transition hover:bg-neutral-100 dark:border-cyan-400/25 dark:bg-[#08111d] dark:text-white dark:hover:border-emerald-400/60"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => void shareProfile()}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-bold text-ink transition hover:bg-neutral-100 dark:border-cyan-400/25 dark:bg-[#08111d] dark:text-white dark:hover:border-emerald-400/60"
          >
            Share profile
          </button>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="col-span-2 flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-700 bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 sm:col-span-1"
          >
            One-Scan QR Pass
          </button>
        </div>
        {shareNote && <p className="font-astro-mono mt-2 text-[11px] text-emerald-700 dark:text-emerald-300">{shareNote}</p>}
      </section>

      <BatasKlaimKesehatan permukaan="care.profile" className="mt-2 text-[11px] leading-snug text-neutral-500" />

      <SurfaceGuide
        summary="build your body once → keep it synced → share only when you choose"
        steps={[
          'Use My Body to orient your personal visual identity.',
          'Open anatomy only when you want internal reference context.',
          'Share exports are user-triggered and never automatic.',
        ]}
      />
      <PersonalBodyUnifiedSurface compact defaultFocus="identity" shareable cameraCapture />

      <HealthSnapshot className="mt-3" />

      {/* Anggota Keluarga / Multi-Profil Nyata */}
      <section aria-label="Anggota Keluarga & Multi-Profil Nyata" className="mt-3 rounded-2xl border border-black/10 p-4 dark:border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-ink">Family Profiles</h2>
            <p className="text-[11px] text-neutral-500">{state.patients.length} active</p>
          </div>
          <button
            type="button"
            onClick={() => setFamilyOpen((v) => !v)}
            className="min-h-[44px] rounded-full bg-brand px-4 py-2 text-xs font-bold text-ink active:scale-95"
          >
            {familyOpen ? 'Close' : '+ Add Profile'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {state.patients.map((p) => {
            const active = p.id === activePatient.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActivePatient(p.id)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                  active
                    ? 'border-brand bg-brand-50 text-brand-dark'
                    : 'border-black/10 text-neutral-600 dark:border-white/15 dark:text-neutral-300'
                }`}
              >
                <div>{p.name}</div>
                <div className="text-[10px] font-normal text-neutral-500">MRN {p.mrn || p.id.slice(0, 8)} {active ? '· Aktif' : ''}</div>
              </button>
            )
          })}
        </div>

        {familyOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const cleanName = famName.trim()
              if (cleanName.length < 2) return
              const newId = uid()
              addPatient({
                id: newId,
                name: cleanName,
                sex: famSex,
                dob: famDob || '1990-01-01',
                mrn: `FAM-${newId.slice(-6).toUpperCase()}`,
                heightCm: 0,
                weightKg: 0,
                allergies: famAllergies.split(',').map((s) => s.trim()).filter(Boolean),
                chronicConditions: [],
                riskFlags: [],
                avatarColor: '#00BF63',
              })
              setFamName('')
              setFamDob('')
              setFamAllergies('')
              setFamilyOpen(false)
            }}
            className="mt-3 grid gap-2 border-t border-black/10 pt-3 sm:grid-cols-2 dark:border-white/10"
          >
            <input
              value={famName}
              onChange={(e) => setFamName(e.target.value)}
              placeholder="Nama lengkap anggota keluarga"
              required
              className="min-h-[44px] rounded-xl border border-black/10 px-3 text-xs outline-none dark:border-white/15 dark:bg-transparent"
            />
            <div className="flex gap-2">
              <select value={famSex} onChange={(e) => setFamSex(e.target.value as 'L' | 'P')} aria-label="Jenis kelamin anggota keluarga" className="min-h-[44px] rounded-xl border border-black/10 px-2 text-xs dark:border-white/15 dark:bg-neutral-900">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              <input value={famDob} onChange={(e) => setFamDob(e.target.value)} type="date" aria-label="Tanggal lahir" className="min-h-[44px] flex-1 rounded-xl border border-black/10 px-2 text-xs dark:border-white/15 dark:bg-transparent" />
            </div>
            <input
              value={famAllergies}
              onChange={(e) => setFamAllergies(e.target.value)}
              placeholder="Alergi tercatat (opsional, pisahkan koma)"
              className="min-h-[44px] rounded-xl border border-black/10 px-3 text-xs outline-none sm:col-span-2 dark:border-white/15 dark:bg-transparent"
            />
            <button type="submit" className="min-h-[44px] rounded-xl bg-brand px-4 text-xs font-bold text-ink sm:col-span-2">
              Simpan Profil Nyata
            </button>
          </form>
        )}
      </section>

      <details className="dark mt-3 rounded-2xl border border-cyan-400/25 bg-[#050a10] px-3.5 py-2 text-white">
        <summary className="font-astro flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
          <span>Digital Twin HUD</span>
          <span className="font-astro-mono text-[10px] text-emerald-300">OPEN ▾</span>
        </summary>
        <WhenOpened>
          <div className="mt-3 pb-2">
            <Suspense fallback={<p role="status" className="py-2 text-xs text-slate-300">Loading Character HUD…</p>}>
              <GtaCharacterPersonaCard />
            </Suspense>
          </div>
        </WhenOpened>
      </details>

      {/* Edit modal — portaled to <body> so it can't get trapped behind the
          mobile bottom nav's stacking context (see components/Portal.tsx) */}
      {editing && (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setEditing(false) }}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Edit Profile</h3>
              <button onClick={() => setEditing(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"><IconX size={18} /></button>
            </div>

            {/* Photo */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="relative h-24 w-24" aria-label="Upload photo">
                {draft.avatar
                  ? <img src={draft.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
                  : <span className="grid h-24 w-24 place-items-center rounded-full text-2xl font-black" style={{ backgroundColor: '#00BF63', color: '#0c1410' }}>{account.name.slice(0, 2).toUpperCase()}</span>}
                <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-brand text-xs text-white">📷</span>
              </button>
              <span className="text-[11px] text-neutral-500">{busy ? 'Uploading…' : 'Tap to change photo'}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Full Name</span>
                <input value={draft.name ?? ''} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="dr. Rizky Muhammad Azrissal" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Username</span>
                <input value={draft.username ?? ''} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))} placeholder="rizkyazhar486" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Avatar Photo URL (optional)</span>
                <input value={draft.avatar?.startsWith('data:') ? '' : (draft.avatar ?? '')} onChange={(e) => setDraft((d) => ({ ...d, avatar: e.target.value }))} placeholder="https://… or tap photo above to upload" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Sex</span>
                <div className="mt-1 flex gap-2">
                  {(['L', 'P', '-'] as const).map((s) => (
                    <button key={s} onClick={() => setDraft((d) => ({ ...d, sex: s }))}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold ${draft.sex === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>{SEX_LABEL[s]}</button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Clinical Title / Profession</span>
                <input value={draft.profession ?? ''} onChange={(e) => setDraft((d) => ({ ...d, profession: e.target.value }))} placeholder="Doctor · Digital Twin & Longevity" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Location</span>
                <input value={draft.location ?? ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="e.g. Jakarta" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Bio</span>
                <textarea value={draft.bio ?? ''} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} placeholder="Tell us about yourself…" className="mt-1 min-h-[64px] w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Website / Citation Link</span>
                <input value={draft.link ?? ''} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="panaceamed.id" className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
            </div>

            <button onClick={saveProfile} className="mt-5 w-full rounded-2xl py-3 text-base font-bold text-ink" style={{ background: 'linear-gradient(135deg, #00BF63, #00A857)' }}>Save Profile</button>
          </div>
        </div>
        </Portal>
      )}

      {qrOpen && (
        <Suspense fallback={null}>
          <QrHealthPassModal open initialTab="qr" onClose={() => setQrOpen(false)} />
        </Suspense>
      )}

      {/* Tabs (icon-first) */}
      <div className="mt-4 flex border-b border-neutral-100">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-label={t.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-lg transition-colors ${tab === t.id ? 'border-b-2 border-brand text-ink' : 'text-neutral-500'}`}>
            <span>{t.icon}</span>
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Collection */}
      <div className="mt-4 space-y-4">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
            {tab === 'posts' && 'No posts yet. Create one using the ＋ button.'}
            {tab === 'locked' && '🔒 No locked posts yet. Locked posts are only visible to you.'}
            {tab === 'reposts' && '🔁 No reposts yet.'}
            {tab === 'saved' && '🔖 Nothing saved yet. Bookmark posts to see them here (private).'}
            {tab === 'liked' && '❤️ Nothing liked yet.'}
            {tab === 'archive' && '📦 Archive is empty. Archived posts are hidden from the public.'}
          </div>
        ) : (
          list.map((p) => <PostCard key={p.id} post={p} viewerEmail={email} viewerName={account.name} />)
        )}
      </div>

      <div className="mt-6">
        <Suspense fallback={null}>
          <BetaFeedbackWidget mode="card" />
        </Suspense>
      </div>

      {/* Tombol Keluar dari Akun */}
      <div className="mt-8 border-t border-black/5 pt-6 pb-4 dark:border-white/10">
        <button
          type="button"
          onClick={doLogout}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <IconLogout size={16} />
          <span>Keluar dari Akun (Log Out)</span>
        </button>
      </div>
    </div>
  )
}
