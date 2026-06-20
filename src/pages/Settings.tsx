import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
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
} from '../components/icons'
import { hasKey, aiAvailable } from '../lib/ai'
import {
  getThemePref,
  setThemePref,
  getTextScale,
  setTextScale,
  getReducedMotion,
  setReducedMotion,
  type ThemePref,
  type TextScale,
} from '../lib/theme'
import { LANGS, getLang, setLang, t, type Lang } from '../lib/i18n'
import { enablePush, disablePush, pushStatus, type PushStatus } from '../lib/push'
import { api } from '../lib/api'

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (cepat & hemat)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (penalaran terdalam)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (ringan)' },
]

export function Settings() {
  const store = useStore()
  const { state, updateSettings, resetDemo } = store
  const nav = useNavigate()
  const [key, setKey] = useState(state.settings.apiKey)
  const [doctor, setDoctor] = useState(state.settings.doctorName)
  const [saved, setSaved] = useState(false)

  // Appearance prefs (applied immediately).
  const [themePref, setThemePrefState] = useState<ThemePref>(getThemePref)
  const [lang, setLangState] = useState<Lang>(getLang)
  const [scale, setScaleState] = useState<TextScale>(getTextScale)
  const [motion, setMotionState] = useState<boolean>(getReducedMotion)
  const [showPwd, setShowPwd] = useState(false)

  const s = state.settings

  function save() {
    updateSettings({ apiKey: key.trim(), doctorName: doctor.trim() || 'dr. Pemeriksa' })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function chooseTheme(p: ThemePref) {
    setThemePref(p)
    setThemePrefState(p)
  }
  function chooseLang(l: Lang) {
    setLang(l)
    setLangState(l)
  }

  function exportData() {
    // Strip heavy media so the export stays small & shareable.
    const { account: _a, ...rest } = state
    const slim = { ...rest, posts: rest.posts.map((p) => ({ ...p, photos: undefined, videoUrl: undefined })) }
    const blob = new Blob([JSON.stringify(slim, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panaceamed-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Appearance ─────────────────────────────────────────── */}
      <Card>
        <SectionTitle icon={<IconSun size={20} />} title={t('appearance', lang)} subtitle={t('appearanceSub', lang)} />
        <div className="space-y-5">
          {/* Theme preview cards */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('theme', lang)}</label>
            <div className="grid grid-cols-3 gap-3">
              <ThemeCard active={themePref === 'light'} onClick={() => chooseTheme('light')} label={t('light', lang)} preview="light" icon={<IconSun size={15} />} />
              <ThemeCard active={themePref === 'dark'} onClick={() => chooseTheme('dark')} label={t('dark', lang)} preview="dark" icon={<IconMoon size={15} />} />
              <ThemeCard active={themePref === 'system'} onClick={() => chooseTheme('system')} label={t('system', lang)} preview="system" icon={<IconSettings size={15} />} />
            </div>
          </div>

          {/* Text size */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('textSize', lang)}</label>
            <div className="grid grid-cols-3 gap-2">
              <SegBtn active={scale === 'sm'} onClick={() => { setTextScale('sm'); setScaleState('sm') }}><span className="text-xs">A</span> {t('small', lang)}</SegBtn>
              <SegBtn active={scale === 'md'} onClick={() => { setTextScale('md'); setScaleState('md') }}><span className="text-sm">A</span> {t('normal', lang)}</SegBtn>
              <SegBtn active={scale === 'lg'} onClick={() => { setTextScale('lg'); setScaleState('lg') }}><span className="text-base">A</span> {t('large', lang)}</SegBtn>
            </div>
          </div>

          {/* Reduced motion */}
          <ToggleRow
            title={t('reduceMotion', lang)}
            sub={t('reduceMotionSub', lang)}
            on={motion}
            onToggle={(v) => { setReducedMotion(v); setMotionState(v) }}
          />
        </div>
      </Card>

      {/* ── Language ───────────────────────────────────────────── */}
      <Card>
        <SectionTitle icon={<IconGlobe size={20} />} title={t('language', lang)} subtitle="Bahasa · Language · 语言 · اللغة" />
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => chooseLang(l.id)}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                lang === l.id ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{l.native}</span>
                <span className="block text-[11px] text-neutral-400">{l.en}</span>
              </span>
              {lang === l.id && <IconCheck size={16} className="text-brand" />}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Notifications ──────────────────────────────────────── */}
      <Card>
        <SectionTitle icon={<IconBell size={20} />} title={t('notifications', lang)} subtitle={t('notifSub', lang)} />
        <PushControl />
        <div className="mt-3 space-y-3">
          <ToggleRow title={t('notifVitals', lang)} sub={t('notifVitalsSub', lang)} on={s.notifVitals ?? true} onToggle={(v) => updateSettings({ notifVitals: v })} />
          <ToggleRow title={t('notifEmail', lang)} sub={t('notifEmailSub', lang)} on={s.notifEmail ?? true} onToggle={(v) => updateSettings({ notifEmail: v })} />
          <ToggleRow title={t('notifSms', lang)} sub={t('notifSmsSub', lang)} on={s.notifSms ?? false} onToggle={(v) => updateSettings({ notifSms: v })} />
          <ToggleRow title={t('notifAi', lang)} sub={t('notifAiSub', lang)} on={s.notifAiInsights ?? true} onToggle={(v) => updateSettings({ notifAiInsights: v })} />
          <ToggleRow title={t('notifBroadcast', lang)} sub={t('notifBroadcastSub', lang)} on={s.notifBroadcasts ?? false} onToggle={(v) => updateSettings({ notifBroadcasts: v })} />
        </div>
      </Card>

      {/* ── Account & Security ─────────────────────────────────── */}
      <Card>
        <SectionTitle icon={<IconShield size={20} />} title={t('security', lang)} subtitle={t('securitySub', lang)} />
        <div className="space-y-3">
          <LinkRow icon={<IconUser size={18} />} title={t('editProfile', lang)} sub={t('editProfileSub', lang)} onClick={() => nav('/')} />
          <button
            onClick={() => setShowPwd((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-3 text-left transition hover:bg-neutral-50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark"><IconKey size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{t('password', lang)}</span>
              <span className="block text-[11px] text-neutral-400">{t('passwordSub', lang)}</span>
            </span>
            <IconChevronRight size={18} className={`text-neutral-400 transition ${showPwd ? 'rotate-90' : ''}`} />
          </button>
          {showPwd && <PasswordForm lang={lang} onDone={() => setShowPwd(false)} />}
          <ToggleRow title={t('twoFactor', lang)} sub={t('twoFactorSub', lang)} on={s.twoFactor ?? false} onToggle={(v) => updateSettings({ twoFactor: v })} />
          <ToggleRow title={t('biometric', lang)} sub={t('biometricSub', lang)} on={s.biometricLock ?? false} onToggle={(v) => updateSettings({ biometricLock: v })} />
        </div>
      </Card>

      {/* ── Privacy & Data ─────────────────────────────────────── */}
      <Card>
        <SectionTitle icon={<IconDownload size={20} />} title={t('privacy', lang)} subtitle={t('privacySub', lang)} />
        <button
          onClick={exportData}
          className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition hover:bg-neutral-50"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark"><IconDownload size={20} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{t('exportData', lang)}</span>
            <span className="block text-[11px] text-neutral-400">{t('exportSub', lang)}</span>
          </span>
          <IconChevronRight size={18} className="text-neutral-400" />
        </button>
      </Card>

      {/* ── AI Co-Physician ────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<IconSettings size={20} />}
          title={t('aiSettings', lang)}
          subtitle="Konfigurasi model & identitas dokter pemeriksa"
          right={<Badge tone={aiAvailable(state.settings) ? 'brand' : 'high'}>{hasKey(state.settings) ? 'AI · Kunci Pribadi' : aiAvailable(state.settings) ? 'AI · Server' : 'AI Terbatas'}</Badge>}
        />
        <div className="space-y-4">
          <Field label="Anthropic API Key">
            <input className={inputClass} type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." />
          </Field>
          <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
            <IconShield size={16} className="mt-0.5 shrink-0 text-brand" />
            Kunci disimpan <b className="mx-1">hanya di browser Anda</b> (localStorage) dan dipakai untuk memanggil
            Claude API langsung. Tanpa kunci pribadi, AI tetap berjalan melalui server Panaceamed.
          </div>
          <Field label="Model">
            <select className={inputClass} value={state.settings.model} onChange={(e) => updateSettings({ model: e.target.value })}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Nama Dokter Pemeriksa">
            <input className={inputClass} value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="dr. Nama, Sp.PD" />
          </Field>
          <div className="flex items-center gap-3">
            <Button onClick={save}>{saved ? t('saved', lang) : t('save', lang)}</Button>
            <Button variant="ghost" onClick={resetDemo}>Reset Data Lokal</Button>
          </div>
        </div>
      </Card>

      {/* App info */}
      <div className="pb-2 pt-2 text-center">
        <p className="text-sm font-bold text-neutral-500">Panaceamed.id · v2.4.0</p>
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">{t('appInfo', lang)}</p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────
function ThemeCard({ active, onClick, label, preview, icon }: { active: boolean; onClick: () => void; label: string; preview: 'light' | 'dark' | 'system'; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-xl border-2 p-3 transition ${
        active ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <span className="flex h-16 w-full overflow-hidden rounded-lg border border-black/5">
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
      <span className={`flex items-center justify-center gap-1.5 text-sm font-bold ${active ? 'text-brand-dark' : 'text-neutral-500'}`}>
        {icon} {label}
      </span>
    </button>
  )
}

// Web Push enrollment — request permission, subscribe via SW, send a test.
function PushControl() {
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
    <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-50 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand-dark"><IconBell size={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{label[status]}</div>
        <div className="text-[11px] text-neutral-500">{note[status]}</div>
        {msg && <div className="mt-1 text-[11px] font-semibold text-brand-dark">{msg}</div>}
      </div>
      {actionable && (
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button onClick={toggle} disabled={busy} variant={status === 'enabled' ? 'outline' : 'primary'} className="!px-3 !py-1.5 text-xs">
            {busy ? '…' : status === 'enabled' ? 'Matikan' : 'Aktifkan'}
          </Button>
          {status === 'enabled' && (
            <button onClick={test} className="text-[11px] font-semibold text-brand-dark hover:underline">Kirim uji</button>
          )}
        </div>
      )}
    </div>
  )
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition ${
        active ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  )
}

function ToggleRow({ title, sub, on, onToggle }: { title: string; sub: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button onClick={() => onToggle(!on)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 text-left">
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-[11px] text-neutral-400">{sub}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function LinkRow({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-3 text-left transition hover:bg-neutral-50">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-[11px] text-neutral-400">{sub}</span>
      </span>
      <IconChevronRight size={18} className="text-neutral-400" />
    </button>
  )
}

function PasswordForm({ lang, onDone }: { lang: Lang; onDone: () => void }) {
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
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <input className={inputClass} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={lang === 'en' ? 'New password' : 'Kata sandi baru'} />
      <input className={inputClass} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={lang === 'en' ? 'Confirm password' : 'Konfirmasi kata sandi'} />
      {msg && <p className="text-xs text-accent">{msg}</p>}
      <Button onClick={submit} className="w-full">{t('save', lang)}</Button>
    </div>
  )
}
