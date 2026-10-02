import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SectionTitle } from './ui'
import { OneShape } from './OneShape'
import { RangkaDaftar } from './Rangka'
import { susunTabUtama } from '../lib/tabPriority'
import '../styles/metal.css'

export interface TabDef {
  id: string
  label: string
  emoji: string
  komponen: ComponentType
  ringkas?: string
}

const PRIMARY_TAB_LIMIT = 7

export function HalamanTab({
  judul, subjudul, ikon, tabs, primaryTabIds, ringkasan, kaki, theme,
}: {
  judul: string
  subjudul: string
  ikon: React.ReactNode
  tabs: TabDef[]
  primaryTabIds?: readonly string[]
  theme?: 'metal'
  ringkasan?: React.ReactNode
  kaki?: React.ReactNode
}) {
  const lokasi = useLocation()
  const navigate = useNavigate()
  const [allOpen, setAllOpen] = useState(false)

  const dariUrl = useMemo(() => {
    const q = new URLSearchParams(lokasi.search).get('t')
    return q && tabs.some((x) => x.id === q) ? q : tabs[0].id
  }, [lokasi.search, tabs])

  const [aktif, setAktif] = useState(dariUrl)
  useEffect(() => { setAktif(dariUrl) }, [dariUrl])

  const pilih = (id: string) => {
    setAktif(id)
    setAllOpen(false)
    navigate(`${lokasi.pathname}?t=${id}`, { replace: true })
  }

  const tab = tabs.find((x) => x.id === aktif) ?? tabs[0]
  const Isi = tab.komponen

  const primaryTabs = useMemo(
    () => susunTabUtama(tabs, aktif, primaryTabIds, PRIMARY_TAB_LIMIT),
    [aktif, primaryTabIds, tabs],
  )

  const primaryIds = useMemo(() => new Set(primaryTabs.map((item) => item.id)), [primaryTabs])
  const moreTabs = useMemo(() => tabs.filter((item) => !primaryIds.has(item.id)), [primaryIds, tabs])

  const tabButton = (t: TabDef, compact = false) => {
    const selected = t.id === aktif
    return (
      <button
        key={t.id}
        type="button"
        role="tab"
        aria-selected={selected}
        aria-current={selected ? 'page' : undefined}
        onClick={() => pilih(t.id)}
        className={`flex min-h-[42px] min-w-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
          compact ? 'justify-start' : 'shrink-0'
        } ${
          selected
            ? theme === 'metal'
              ? 'metal-tag metal-gold border-transparent !text-[11px] normal-case tracking-normal'
              : 'border-transparent text-[#03150c]' // latarnya satu bentuk hijau bersama (OneShape)
            : 'border-black/[.07] bg-neutral-100 text-neutral-600 hover:border-black/[.12] hover:bg-neutral-200 dark:border-white/[.07] dark:bg-white/[.055] dark:text-neutral-300 dark:hover:bg-white/[.09] dark:hover:text-white'
        }`}
      >
        <span className="shrink-0 text-[12px]" aria-hidden>{t.emoji}</span>
        <span className="truncate">{t.label}</span>
      </button>
    )
  }

  return (
    <div className="space-y-5 pb-20">
      <SectionTitle icon={ikon} title={judul} subtitle={tab.ringkas ?? subjudul} />

      {ringkasan}

      <section aria-label={`${judul} tools`} className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label={`${judul} primary tools`} data-one-shape={theme === 'metal' ? undefined : 'aria'}>
            {theme !== 'metal' && <OneShape tone="green" />}
            {primaryTabs.map((t) => tabButton(t))}
          </div>

          {moreTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setAllOpen((value) => !value)}
              aria-expanded={allOpen}
              aria-controls={`more-tabs-${judul.replace(/\s+/g, '-').toLowerCase()}`}
              className="flex min-h-[42px] shrink-0 items-center gap-1 rounded-full border border-black/[.08] bg-white/80 px-3 text-[10px] font-black text-neutral-600 shadow-sm transition hover:border-brand/25 hover:text-ink dark:border-white/[.08] dark:bg-white/[.045] dark:text-neutral-300 dark:hover:text-white"
            >
              {allOpen ? 'Less' : `More ${moreTabs.length}`}
              <span aria-hidden>{allOpen ? '↑' : '↓'}</span>
            </button>
          )}
        </div>

        {allOpen && moreTabs.length > 0 && (
          <div
            id={`more-tabs-${judul.replace(/\s+/g, '-').toLowerCase()}`}
            className="mt-2 grid grid-cols-2 gap-1.5 rounded-[18px] border border-black/[.07] bg-black/[.025] p-2 dark:border-white/[.07] dark:bg-white/[.025] sm:grid-cols-3 lg:grid-cols-4"
            role="tablist"
            aria-label={`${judul} additional tools`}
          >
            {moreTabs.map((t) => tabButton(t, true))}
          </div>
        )}
      </section>

      <Suspense fallback={<RangkaDaftar jumlah={3} />}>
        <div key={tab.id}><Isi /></div>
      </Suspense>

      {kaki}
    </div>
  )
}

export default HalamanTab
