import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Button, inputClass } from '../components/ui'
import {
  IconSettings,
  IconShield,
  IconSun,
  IconMoon,
  IconGlobe,
  IconBell,
  IconDownload,
  IconKey,
  IconUser,
  IconCheck,
  IconChevronRight,
  IconVideo,
} from '../components/icons'
import {
  getThemePref,
  setThemePref,
  getTextScale,
  setTextScale,
  getReducedMotion,
  setReducedMotion,
  getSimpleMode,
  setSimpleMode,
  type ThemePref,
  type TextScale,
} from '../lib/theme'
import { LANGS, getLang, setLang, t, type Lang } from '../lib/i18n'
import { enablePush, disablePush, pushStatus, type PushStatus } from '../lib/push'
import { InstallApp } from '../components/InstallApp'
import { OfflineReady } from '../components/OfflineReady'
import { api, backendEnabled } from '../lib/api'

export function Settings() {
  const store = useStore()
  const { state, updateSettings, resetDemo } = store
  const nav = useNavigate()

  const [themePref, setThemePrefState] = useState<ThemePref>(getThemePref)
  const [lang, setLangState] = useState<Lang>(getLang)
  const [scale, setScaleState] = useState<TextScale>(getTextScale)
  const [motion, setMotionState] = useState<boolean>(getReducedMotion)
  const [simple, setSimpleState] = useState<boolean>(getSimpleMode)
  const [showPwd, setShowPwd] = useState(false)

  const s = state.settings
  const S = simple

  /* ═══════════════════════════════════════════════════════════════
     1) FONT-SIZE ROOT → semua unit rem di Tailwind ikut berubah
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const root = document.documentElement
    const map: Record<TextScale, string> = { sm: '14px', md: '16px', lg: '18px' }
    root.style.fontSize = simple ? '18px' : map[scale]
    root.style.lineHeight = simple ? '1.75' : ''
    
    // Menggunakan setProperty agar aman dari error TypeScript
    root.style.setProperty('-webkit-font-smoothing', 'antialiased')
    root.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
    root.style.textRendering = 'optimizeLegibility'
    
    return () => {
      root.style.fontSize = ''
      root.style.lineHeight = ''
      root.style.removeProperty('-webkit-font-smoothing')
      root.style.removeProperty('-moz-osx-font-smoothing')
      root.style.textRendering = ''
    }
  }, [scale, simple])

  /* ═══════════════════════════════════════════════════════════════
     2) REDUCED MOTION — matikan semua transisi & animasi
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('reduce-motion', motion)
    return () => root.classList.remove('reduce-motion')
  }, [motion])

  useEffect(() => {
    const id = 'panaceamed-rm'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = [
      '.reduce-motion,',
      '.reduce-motion *,',
      '.reduce-motion *::before,',
      '.reduce-motion *::after {',
      '  transition-duration: 0.01ms !important;',
      '  animation-duration: 0.01ms !important;',
      '  animation-iteration-count: 1 !important;',
      '  scroll-behavior: auto !important;',
      '}',
    ].join('\n')
    document.head.appendChild(el)
  }, [])

  function chooseTheme(p: ThemePref) {
    setThemePref(p)
    setThemePrefState(p)
  }
  function chooseLang(l: Lang) {
    setLang(l)
    setLangState(l)
  }

  function exportData() {
    const { account: _a, ...rest } = state
    const slim = { ...rest, posts: rest.posts.map((p) => ({ ...p, photos: undefined, videoUrl: undefined })) }
    const blob = new Blob([JSON.stringify(slim, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panaceamed-data-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Revoking right after click() can abort the download mid-flight on some
    // browsers (notably Safari/iOS) since the actual file write is async —
    // give it headroom before freeing the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <div className={`mx-auto max-w-3xl ${S ? 'space-y-8' : 'space-y-6'}`}>
      {/* ── Install as app (PWA) ───────────────────────────────── */}
      <InstallApp />

      {/* ── Offline mode ───────────────────────────────────────── */}
      <OfflineReady />

      {/* ── Video Tutorial ─────────────────────────────────────── */}
      <TutorialVideoCard simple={S} />

      {/* ── Appearance ─────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<IconSun size={S ? 22 : 20} />}
          title={t('appearance', lang)}
          subtitle={t('appearanceSub', lang)}
        />
        <div className={S ? 'space-y-7' : 'space-y-5'}>
          {/* Theme preview cards */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('theme', lang)}</label>
            <div className="grid grid-cols-3 gap-3">
              <ThemeCard active={themePref === 'light'} onClick={() => chooseTheme('light')} label={t('light', lang)} preview="light" icon={<IconSun size={15} />} simple={S} />
              <ThemeCard active={themePref === 'dark'} onClick={() => chooseTheme('dark')} label={t('dark', lang)} preview="dark" icon={<IconMoon size={15} />} simple={S} />
              <ThemeCard active={themePref === 'system'} onClick={() => chooseTheme('system')} label={t('system', lang)} preview="system" icon={<IconSettings size={15} />} simple={S} />
            </div>
          </div>

          {/* Text size */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('textSize', lang)}</label>
            <div className="grid grid-cols-3 gap-2">
              <SegBtn active={scale === 'sm'} onClick={() => { setTextScale('sm'); setScaleState('sm') }} simple={S}><span className="text-xs">A</span> {t('small', lang)}</SegBtn>
              <SegBtn active={scale === 'md'} onClick={() => { setTextScale('md'); setScaleState('md') }} simple={S}><span className="text-sm">A</span> {t('normal', lang)}</SegBtn>
              <SegBtn active={scale === 'lg'} onClick={() => { setTextScale('lg'); setScaleState('lg') }} simple={S}><span className="text-base">A</span> {t('large', lang)}</SegBtn>
            </div>
          </div>

          {/* Reduced motion */}
          <ToggleRow
            title={t('reduceMotion', lang)}
            sub={t('reduceMotionSub', lang)}
            on={motion}
            onToggle={(v) => { setReducedMotion(v); setMotionState(v) }}
            simple={S}
          />

          {/* Simple mode (elderly / non-tech) */}
          <button
            onClick={() => { const v = !simple; setSimpleMode(v); setSimpleState(v) }}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left ${
              S ? 'p-5' : ''
            } ${
              simple ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span className="min-w-0">
              <span className={`flex items-center gap-2 font-extrabold ${S ? 'text-lg' : 'text-base'}`}>👵 Mode Simpel</span>
              <span className={`mt-0.5 block text-neutral-500 ${S ? 'text-sm' : 'text-[13px]'}`}>
                Teks &amp; tombol lebih besar, tampilan ditenangkan — cocok untuk lansia atau yang baru memakai aplikasi.
              </span>
            </span>
            <span className={`relative shrink-0 rounded-full ${S ? 'h-9 w-16' : 'h-7 w-12'} ${simple ? 'bg-brand' : 'bg-neutral-300'}`}>
              <span className={`absolute top-0.5 rounded-full bg-white shadow ${S ? 'h-8 w-8' : 'h-6 w-6'} ${simple ? 'left-[30px]' : 'left-0.5'}`} />
            </span>
          </button>
        </div>
      </Card>

      {/* ── Language ───────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<IconGlobe size={S ? 22 : 20} />}
          title={t('language', lang)}
          subtitle="Bahasa · Language · 语言 · اللغة"
        />
        <div className={`grid grid-cols-2 ${S ? 'gap-3' : 'gap-2'}`}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => chooseLang(l.id)}
              className={`flex items-center gap-2.5 border text-left ${
                S ? 'rounded-2xl p-4' : 'rounded-xl p-3'
              } ${
                lang === l.id ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span className={S ? 'text-2xl' : 'text-xl'}>{l.flag}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-bold ${S ? 'text-base' : 'text-sm'}`}>{l.native}</span>
                <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{l.en}</span>
              </span>
              {lang === l.id && <IconCheck size={S ? 20 : 16} className="text-brand" />}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Notifications ──────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<IconBell size={S ? 22 : 20} />}
          title={t('notifications', lang)}
          subtitle={t('notifSub', lang)}
        />
        <PushControl simple={S} />
        <div className={`mt-3 ${S ? 'space-y-4' : 'space-y-3'}`}>
          <ToggleRow title={t('notifVitals', lang)} sub={t('notifVitalsSub', lang)} on={s.notifVitals ?? true} onToggle={(v) => updateSettings({ notifVitals: v })} simple={S} />
          <ToggleRow title={t('notifEmail', lang)} sub={t('notifEmailSub', lang)} on={s.notifEmail ?? true} onToggle={(v) => updateSettings({ notifEmail: v })} simple={S} />
          <ToggleRow title={t('notifSms', lang)} sub={t('notifSmsSub', lang)} on={s.notifSms ?? false} onToggle={(v) => updateSettings({ notifSms: v })} simple={S} />
          <ToggleRow title={t('notifAi', lang)} sub={t('notifAiSub', lang)} on={s.notifAiInsights ?? true} onToggle={(v) => updateSettings({ notifAiInsights: v })} simple={S} />
          <ToggleRow title={t('notifTx', lang)} sub={t('notifTxSub', lang)} on={s.notifTransactions ?? true} onToggle={(v) => updateSettings({ notifTransactions: v })} simple={S} />
          <ToggleRow title={t('notifBroadcast', lang)} sub={t('notifBroadcastSub', lang)} on={s.notifBroadcasts ?? false} onToggle={(v) => updateSettings({ notifBroadcasts: v })} simple={S} />
        </div>
      </Card>

      {/* ── Account & Security ─────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<IconShield size={S ? 22 : 20} />}
          title={t('security', lang)}
          subtitle={t('securitySub', lang)}
        />
        <div className={S ? 'space-y-4' : 'space-y-3'}>
          <LinkRow icon={<IconUser size={18} />} title={t('editProfile', lang)} sub={t('editProfileSub', lang)} onClick={() => nav('/')} simple={S} />
          <button
            onClick={() => setShowPwd((v) => !v)}
            className={`flex w-full items-center gap-3 border border-neutral-200 text-left hover:bg-neutral-50 ${
              S ? 'rounded-2xl p-4' : 'rounded-xl p-3'
            }`}
          >
            <span className={`grid shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark ${S ? 'h-12 w-12' : 'h-10 w-10'}`}><IconKey size={S ? 20 : 18} /></span>
            <span className="min-w-0 flex-1">
              <span className={`block font-bold ${S ? 'text-base' : 'text-sm'}`}>{t('password', lang)}</span>
              <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{t('passwordSub', lang)}</span>
            </span>
            <IconChevronRight size={18} className={`text-neutral-400 ${showPwd ? 'rotate-90' : ''}`} />
          </button>
          {showPwd && <PasswordForm lang={lang} onDone={() => setShowPwd(false)} simple={S} />}
          <ToggleRow title={t('twoFactor', lang)} sub={t('twoFactorSub', lang)} on={s.twoFactor ?? false} onToggle={(v) => updateSettings({ twoFactor: v })} simple={S} />
          <ToggleRow title={t('biometric', lang)} sub={t('biometricSub', lang)} on={s.biometricLock ?? false} onToggle={(v) => updateSettings({ biometricLock: v })} simple={S} />
        </div>
      </Card>

      {/* ── Pesan & Saran (feedback) ───────────────────────────── */}
      <FeedbackCard simple={S} />

      {/* ── Privacy & Data (export + local reset, merged) ─────────── */}
      <Card>
        <SectionTitle
          icon={<IconDownload size={S ? 22 : 20} />}
          title={t('privacy', lang)}
          subtitle={t('privacySub', lang)}
        />
        <button
          onClick={exportData}
          className={`flex w-full items-center gap-3 border border-neutral-200 text-left hover:bg-neutral-50 ${
            S ? 'rounded-2xl p-5' : 'rounded-xl p-4'
          }`}
        >
          <span className={`grid shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark ${S ? 'h-14 w-14' : 'h-11 w-11'}`}><IconDownload size={S ? 22 : 20} /></span>
          <span className="min-w-0 flex-1">
            <span className={`block font-bold ${S ? 'text-base' : 'text-sm'}`}>{t('exportData', lang)}</span>
            <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{t('exportSub', lang)}</span>
          </span>
          <IconChevronRight size={18} className="text-neutral-400" />
        </button>
        <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 ${S ? 'p-4' : 'p-3'}`}>
          <span className="min-w-0">
            <span className={`block font-bold ${S ? 'text-base' : 'text-sm'}`}>Reset Data Lokal</span>
            <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>Hapus data tersimpan di perangkat ini</span>
          </span>
          <Button variant="ghost" onClick={resetDemo} className="shrink-0">Reset</Button>
        </div>
      </Card>

      {/* App info */}
      <div className="pb-2 pt-2 text-center">
        <p className={`font-bold text-neutral-500 ${S ? 'text-base' : 'text-sm'}`}>Panaceamed.id · v2.4.0</p>
        <p className={`uppercase tracking-widest text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{t('appInfo', lang)}</p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

// Video Tutorial — the same walkthrough shown once on first login, always
// available here to re-watch or share with friends who are still confused.
export function TutorialVideoCard({ simple: S }: { simple: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={<IconVideo size={S ? 22 : 20} />}
        title="Video Tutorial"
        subtitle="Panduan singkat cara memakai semua fitur utama"
      />
      <div className="overflow-hidden rounded-2xl bg-black">
        <video
          src={`${import.meta.env.BASE_URL}tutorial-video.mp4`}
          controls
          playsInline
          preload="metadata"
          className="mx-auto block max-h-[70vh] w-full"
        />
      </div>
      <p className={`mt-3 text-neutral-400 ${S ? 'text-sm' : 'text-xs'}`}>
        Bingung pakai aplikasi? Tonton video ini, atau bagikan ke teman yang baru mulai.
      </p>
    </Card>
  )
}

// Pesan & Saran — user feedback straight to the founder via WhatsApp or email
// (the same contact channels published on the landing page). Message history
// is kept locally so users can see what they've sent.
const FEEDBACK_WA = '6282261143040'
const FEEDBACK_EMAIL = 'index.meds@gmail.com'
const FB_KEY = 'pmd_feedback_history'

function FeedbackCard({ simple: S }: { simple: boolean }) {
  const [kind, setKind] = useState<'Saran' | 'Masalah/Bug' | 'Pertanyaan' | 'Pujian' | 'Permintaan Fitur'>('Saran')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [appSent, setAppSent] = useState(false)
  const [sent, setSent] = useState<{ kind: string; text: string; at: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(FB_KEY) || '[]') } catch { return [] }
  })

  function record() {
    const entry = { kind, text: text.trim(), at: new Date().toISOString() }
    const next = [entry, ...sent].slice(0, 10)
    setSent(next)
    try { localStorage.setItem(FB_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setText('')
  }
  const body = `[${kind}] Panaceamed.id\n\n${text.trim()}`
  const canSend = text.trim().length >= 5

  async function sendToApp() {
    if (!canSend || !backendEnabled) return
    setBusy(true)
    try {
      await api.submitFeedback(kind, text.trim())
      record()
      setAppSent(true)
      setTimeout(() => setAppSent(false), 3000)
    } catch { /* best-effort — WhatsApp/Email below still work as fallback */ }
    finally { setBusy(false) }
  }

  return (
    <Card>
      <SectionTitle
        icon={<span className={S ? 'text-2xl' : 'text-xl'}>💬</span>}
        title="Pesan & Saran"
        subtitle="Kirim masukan langsung ke pengembang — semua dibaca"
      />
      <div className={`flex flex-wrap ${S ? 'gap-2.5' : 'gap-1.5'}`}>
        {(['Saran', 'Masalah/Bug', 'Pertanyaan', 'Pujian', 'Permintaan Fitur'] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)}
            className={`rounded-full font-bold ${S ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-[11px]'} ${
              kind === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'
            }`}>
            {k}
          </button>
        ))}
      </div>
      <textarea
        className={`mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${S ? 'text-base' : 'text-sm'}`}
        rows={4}
        placeholder="Tulis pesan, saran, atau kendala yang Anda alami…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {backendEnabled && (
        <button
          onClick={sendToApp}
          disabled={!canSend || busy}
          className={`mt-2 w-full rounded-xl py-3 text-center font-bold text-white ${S ? 'text-base' : 'text-sm'} ${canSend && !busy ? 'bg-brand' : 'cursor-not-allowed bg-neutral-300'}`}
        >
          {busy ? 'Mengirim…' : appSent ? '✓ Terkirim ke Owner' : '📩 Kirim ke Owner (Aplikasi)'}
        </button>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">Atau kirim lewat kanal lain:</p>
      <div className="mt-1 flex gap-2">
        <a
          href={canSend ? `https://wa.me/${FEEDBACK_WA}?text=${encodeURIComponent(body)}` : undefined}
          target="_blank" rel="noreferrer"
          onClick={(e) => { if (!canSend) { e.preventDefault(); return } record() }}
          className={`flex-1 rounded-xl py-3 text-center font-bold text-white ${S ? 'text-base' : 'text-sm'} ${canSend ? 'bg-[#25D366]' : 'cursor-not-allowed bg-neutral-300'}`}
        >
          Kirim via WhatsApp
        </a>
        <a
          href={canSend ? `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`[${kind}] Feedback Panaceamed.id`)}&body=${encodeURIComponent(text.trim())}` : undefined}
          onClick={(e) => { if (!canSend) { e.preventDefault(); return } record() }}
          className={`flex-1 rounded-xl border-2 py-3 text-center font-bold ${S ? 'text-base' : 'text-sm'} ${canSend ? 'border-brand text-brand-dark' : 'cursor-not-allowed border-neutral-200 text-neutral-300'}`}
        >
          ✉️ Email
        </a>
      </div>
      {!canSend && text.length > 0 && <p className="mt-1.5 text-[11px] text-neutral-400">Tulis minimal 5 karakter.</p>}
      {sent.length > 0 && (
        <details className="mt-3">
          <summary className={`cursor-pointer font-semibold text-neutral-400 ${S ? 'text-sm' : 'text-xs'}`}>Riwayat kiriman ({sent.length})</summary>
          <div className="mt-2 space-y-1.5">
            {sent.map((f, i) => (
              <div key={i} className="rounded-lg bg-neutral-50 px-3 py-2">
                <div className="text-[10px] font-bold text-brand-dark">{f.kind} · {new Date(f.at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                <div className={`text-neutral-600 ${S ? 'text-sm' : 'text-xs'}`}>{f.text}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  )
}

function ThemeCard({ active, onClick, label, preview, icon, simple: S }: { active: boolean; onClick: () => void; label: string; preview: 'light' | 'dark' | 'system'; icon: React.ReactNode; simple: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 border-2 ${S ? 'rounded-2xl p-4' : 'rounded-xl p-3'} ${
        active ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <span className={`flex w-full overflow-hidden rounded-lg border border-black/5 ${S ? 'h-20' : 'h-16'}`}>
        {preview === 'system' ? (
          <>
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[#0c0f0f]" />
          </>
        ) : (
          <span className={`flex-1 ${preview === 'light' ? 'bg-white' : 'bg-[#0c0f0f]'}`}>
            <span className="m-1.5 block h-1.5 w-3/4 rounded-full bg-brand/60" />
            <span className="mx-1.5 block h-5 w-1/2 rounded-md bg-brand/20" />
          </span>
        )}
      </span>
      <span className={`flex items-center justify-center gap-1.5 font-bold ${S ? 'text-base' : 'text-sm'} ${active ? 'text-brand-dark' : 'text-neutral-500'}`}>
        {icon} {label}
      </span>
    </button>
  )
}

function PushControl({ simple: S }: { simple: boolean }) {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    pushStatus().then(setStatus)
  }, [])

  async function toggle() {
    setBusy(true)
    setMsg('')
    try {
      setStatus(status === 'enabled' ? await disablePush() : await enablePush())
    } finally {
      setBusy(false)
    }
  }
  async function test() {
    const r = await api.pushTest().catch(() => ({ sent: 0 }))
    setMsg(r.sent > 0 ? 'Notifikasi uji dikirim ✅' : 'Tidak ada perangkat terdaftar.')
  }

  const label: Record<PushStatus, string> = {
    enabled: 'Notifikasi push aktif',
    disabled: 'Aktifkan notifikasi push',
    denied: 'Izin diblokir di browser',
    unsupported: 'Browser tidak mendukung',
    unavailable: 'Belum dikonfigurasi server',
  }
  const note: Record<PushStatus, string> = {
    enabled: 'Anda akan menerima pemberitahuan penting meski aplikasi tertutup.',
    disabled: 'Dapatkan pemberitahuan vital, SOS & wawasan AI langsung ke perangkat.',
    denied: 'Buka pengaturan situs browser → izinkan Notifikasi, lalu coba lagi.',
    unsupported: 'Coba via Chrome/Edge atau pasang sebagai aplikasi (PWA).',
    unavailable: 'Owner perlu menyetel VAPID di server untuk mengaktifkan.',
  }
  if (!status) return null
  const actionable = status === 'enabled' || status === 'disabled'

  return (
    <div className={`flex items-start gap-3 border border-brand/20 bg-brand-50 ${S ? 'rounded-2xl p-4' : 'rounded-xl p-3'}`}>
      <span className={`grid shrink-0 place-items-center rounded-full bg-white text-brand-dark ${S ? 'h-11 w-11' : 'h-9 w-9'}`}><IconBell size={S ? 20 : 18} /></span>
      <div className="min-w-0 flex-1">
        <div className={`font-bold ${S ? 'text-base' : 'text-sm'}`}>{label[status]}</div>
        <div className={`text-neutral-500 ${S ? 'text-xs' : 'text-[11px]'}`}>{note[status]}</div>
        {msg && <div className={`mt-1 font-semibold text-brand-dark ${S ? 'text-xs' : 'text-[11px]'}`}>{msg}</div>}
      </div>
      {actionable && (
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button onClick={toggle} disabled={busy} variant={status === 'enabled' ? 'outline' : 'primary'} className={`!px-3 ${S ? '!py-2.5 text-sm' : '!py-1.5 text-xs'}`}>
            {busy ? '…' : status === 'enabled' ? 'Matikan' : 'Aktifkan'}
          </Button>
          {status === 'enabled' && (
            <button onClick={test} className={`font-semibold text-brand-dark hover:underline ${S ? 'text-xs' : 'text-[11px]'}`}>Kirim uji</button>
          )}
        </div>
      )}
    </div>
  )
}

function SegBtn({ active, onClick, children, simple: S }: { active: boolean; onClick: () => void; children: React.ReactNode; simple: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 border font-bold ${S ? 'rounded-2xl py-3.5 text-base' : 'rounded-xl py-2.5 text-sm'} ${
        active ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  )
}

function ToggleRow({ title, sub, on, onToggle, simple: S }: { title: string; sub: string; on: boolean; onToggle: (v: boolean) => void; simple: boolean }) {
  return (
    <button onClick={() => onToggle(!on)} className={`flex w-full items-center justify-between gap-3 bg-neutral-50 text-left ${S ? 'rounded-2xl p-4' : 'rounded-xl p-3'}`}>
      <span className="min-w-0">
        <span className={`block font-bold ${S ? 'text-base' : 'text-sm'}`}>{title}</span>
        <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{sub}</span>
      </span>
      <span className={`relative shrink-0 rounded-full ${S ? 'h-8 w-14' : 'h-6 w-11'} ${on ? 'bg-brand' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 rounded-full bg-white shadow ${S ? 'h-7 w-7' : 'h-5 w-5'} ${on ? (S ? 'left-[26px]' : 'left-[22px]') : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function LinkRow({ icon, title, sub, onClick, simple: S }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; simple: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 border border-neutral-200 text-left hover:bg-neutral-50 ${S ? 'rounded-2xl p-4' : 'rounded-xl p-3'}`}>
      <span className={`grid shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark ${S ? 'h-12 w-12' : 'h-10 w-10'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold ${S ? 'text-base' : 'text-sm'}`}>{title}</span>
        <span className={`block text-neutral-400 ${S ? 'text-xs' : 'text-[11px]'}`}>{sub}</span>
      </span>
      <IconChevronRight size={18} className="text-neutral-400" />
    </button>
  )
}

function PasswordForm({ lang, onDone, simple: S }: { lang: Lang; onDone: () => void; simple: boolean }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  function submit() {
    if (pw.length < 8) return setMsg(lang === 'en' ? 'Minimum 8 characters.' : 'Minimal 8 karakter.')
    if (pw !== pw2) return setMsg(lang === 'en' ? 'Passwords do not match.' : 'Kata sandi tidak cocok.')
    setMsg('')
    onDone()
  }
  return (
    <div className={`space-y-2 border border-neutral-200 bg-neutral-50 ${S ? 'space-y-3 rounded-2xl p-5' : 'rounded-xl p-3'}`}>
      <input className={`${inputClass} ${S ? '!py-3.5 !text-base' : ''}`} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={lang === 'en' ? 'New password' : 'Kata sandi baru'} />
      <input className={`${inputClass} ${S ? '!py-3.5 !text-base' : ''}`} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={lang === 'en' ? 'Confirm password' : 'Konfirmasi kata sandi'} />
      {msg && <p className={`text-accent ${S ? 'text-sm' : 'text-xs'}`}>{msg}</p>}
      <Button onClick={submit} className={`w-full ${S ? '!py-3.5 !text-base' : ''}`}>{t('save', lang)}</Button>
    </div>
  )
}
