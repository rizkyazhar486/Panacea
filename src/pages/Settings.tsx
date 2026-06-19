import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconSettings, IconShield, IconSun, IconMoon } from '../components/icons'
import { hasKey } from '../lib/ai'
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

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (cepat & hemat)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (penalaran terdalam)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (ringan)' },
]

export function Settings() {
  const { state, updateSettings, resetDemo } = useStore()
  const [key, setKey] = useState(state.settings.apiKey)
  const [doctor, setDoctor] = useState(state.settings.doctorName)
  const [saved, setSaved] = useState(false)

  // Appearance prefs (live — applied immediately on change).
  const [themePref, setThemePrefState] = useState<ThemePref>(getThemePref)
  const [lang, setLangState] = useState<Lang>(getLang)
  const [scale, setScaleState] = useState<TextScale>(getTextScale)
  const [motion, setMotionState] = useState<boolean>(getReducedMotion)

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
  function chooseScale(s: TextScale) {
    setTextScale(s)
    setScaleState(s)
  }
  function toggleMotion(on: boolean) {
    setReducedMotion(on)
    setMotionState(on)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Appearance / display settings */}
      <Card>
        <SectionTitle
          icon={<IconSun size={20} />}
          title={t('appearance', lang)}
          subtitle={t('appearanceSub', lang)}
        />
        <div className="space-y-5">
          {/* Theme */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('theme', lang)}</label>
            <div className="grid grid-cols-3 gap-2">
              <SegBtn active={themePref === 'light'} onClick={() => chooseTheme('light')}>
                <IconSun size={16} /> {t('light', lang)}
              </SegBtn>
              <SegBtn active={themePref === 'dark'} onClick={() => chooseTheme('dark')}>
                <IconMoon size={16} /> {t('dark', lang)}
              </SegBtn>
              <SegBtn active={themePref === 'system'} onClick={() => chooseTheme('system')}>
                <IconSettings size={16} /> {t('system', lang)}
              </SegBtn>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('language', lang)}</label>
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
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{l.native}</span>
                    <span className="block text-[11px] text-neutral-400">{l.en}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text size */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('textSize', lang)}</label>
            <div className="grid grid-cols-3 gap-2">
              <SegBtn active={scale === 'sm'} onClick={() => chooseScale('sm')}><span className="text-xs">A</span> {t('small', lang)}</SegBtn>
              <SegBtn active={scale === 'md'} onClick={() => chooseScale('md')}><span className="text-sm">A</span> {t('normal', lang)}</SegBtn>
              <SegBtn active={scale === 'lg'} onClick={() => chooseScale('lg')}><span className="text-base">A</span> {t('large', lang)}</SegBtn>
            </div>
          </div>

          {/* Reduced motion */}
          <button
            onClick={() => toggleMotion(!motion)}
            className="flex w-full items-center justify-between rounded-xl bg-neutral-50 p-3 text-left"
          >
            <span>
              <span className="block text-sm font-bold">{t('reduceMotion', lang)}</span>
              <span className="block text-[11px] text-neutral-400">{t('reduceMotionSub', lang)}</span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${motion ? 'bg-brand' : 'bg-neutral-300'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${motion ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </button>
        </div>
      </Card>

      {/* AI settings */}
      <Card>
        <SectionTitle
          icon={<IconSettings size={20} />}
          title={t('aiSettings', lang)}
          subtitle="Konfigurasi model & identitas dokter pemeriksa"
          right={<Badge tone={hasKey(state.settings) ? 'brand' : 'high'}>{hasKey(state.settings) ? 'AI Live' : 'Mode Demo'}</Badge>}
        />
        <div className="space-y-4">
          <Field label="Anthropic API Key">
            <input
              className={inputClass}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </Field>
          <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
            <IconShield size={16} className="mt-0.5 shrink-0 text-brand" />
            Kunci disimpan <b className="mx-1">hanya di browser Anda</b> (localStorage) dan dipakai
            untuk memanggil Claude API langsung. Tanpa kunci, aplikasi berjalan dalam Mode Demo
            tersimulasi.
          </div>

          <Field label="Model">
            <select
              className={inputClass}
              value={state.settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nama Dokter Pemeriksa">
            <input
              className={inputClass}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="dr. Nama, Sp.PD"
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button onClick={save}>{saved ? t('saved', lang) : 'Simpan'}</Button>
            <Button variant="ghost" onClick={resetDemo}>
              Reset Data Demo
            </Button>
          </div>
        </div>
      </Card>
      <p className="px-1 text-center text-xs text-neutral-400">
        Info selengkapnya tentang Panaceamed.id ada di halaman <b>Beranda → Tentang Kami</b>.
      </p>
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
