import { useEffect, useMemo, useRef, useState } from 'react'

type WidgetStatus = 'Belum' | 'Proses' | 'Selesai'
type WidgetState = { favorite?: boolean; status?: WidgetStatus; notes?: string }
type ClinicalWidget = {
  id: string
  categoryId: string
  category: string
  title: string
  helper: string
  number: number
}

const STORAGE_KEY = 'panacea.widget-library.v1'
const STATUS: WidgetStatus[] = ['Belum', 'Proses', 'Selesai']

const CATEGORIES = [
  { id: 'internal', label: 'Penyakit Dalam', count: 15, accent: 'from-emerald-400/30 via-green-400/10 to-transparent' },
  { id: 'skdi', label: 'SKDI', count: 15, accent: 'from-cyan-400/30 via-sky-400/10 to-transparent' },
  { id: 'lab', label: 'Lab', count: 15, accent: 'from-violet-400/30 via-purple-400/10 to-transparent' },
  { id: 'pediatri', label: 'Pediatri', count: 15, accent: 'from-pink-400/30 via-rose-400/10 to-transparent' },
  { id: 'bedah', label: 'Bedah', count: 14, accent: 'from-orange-400/30 via-amber-400/10 to-transparent' },
  { id: 'obgyn', label: 'Obstetri & Ginekologi', count: 14, accent: 'from-fuchsia-400/30 via-pink-400/10 to-transparent' },
  { id: 'nursing', label: 'Keperawatan', count: 14, accent: 'from-teal-400/30 via-emerald-400/10 to-transparent' },
  { id: 'public-health', label: 'Kesehatan Masyarakat', count: 14, accent: 'from-lime-400/30 via-green-400/10 to-transparent' },
  { id: 'eye', label: 'Mata', count: 14, accent: 'from-blue-400/30 via-cyan-400/10 to-transparent' },
  { id: 'diagnosis', label: 'Diagnosis', count: 14, accent: 'from-indigo-400/30 via-violet-400/10 to-transparent' },
  { id: 'dental', label: 'Kedokteran Gigi', count: 14, accent: 'from-sky-400/30 via-blue-400/10 to-transparent' },
  { id: 'physio', label: 'Fisioterapi', count: 14, accent: 'from-yellow-400/30 via-lime-400/10 to-transparent' },
  { id: 'pregnancy', label: 'Kehamilan', count: 14, accent: 'from-rose-400/30 via-fuchsia-400/10 to-transparent' },
  { id: 'audiology', label: 'Audiologi', count: 14, accent: 'from-amber-400/30 via-orange-400/10 to-transparent' },
] as const

const MODULES = [
  { key: 'summary', label: 'Ringkasan Klinis', helper: 'Susun poin klinis utama menjadi snapshot yang cepat dipindai.' },
  { key: 'red-flags', label: 'Checklist Red Flags', helper: 'Tandai temuan penting yang perlu mendapat perhatian lebih cepat.' },
  { key: 'history', label: 'Anamnesis Terarah', helper: 'Checklist pertanyaan terstruktur untuk latihan dan dokumentasi.' },
  { key: 'exam', label: 'Pemeriksaan Fisik', helper: 'Urutkan komponen pemeriksaan agar alur kerja lebih konsisten.' },
  { key: 'differential', label: 'Differential Builder', helper: 'Kelompokkan kemungkinan diagnosis untuk pembelajaran klinis.' },
  { key: 'workup', label: 'Pemeriksaan Penunjang', helper: 'Catat pemeriksaan yang relevan dan alasan pembelajarannya.' },
  { key: 'monitoring', label: 'Monitoring', helper: 'Pantau parameter dan perubahan penting dari waktu ke waktu.' },
  { key: 'follow-up', label: 'Follow-up', helper: 'Simpan target tindak lanjut dan hal yang perlu dievaluasi kembali.' },
  { key: 'education', label: 'Edukasi Pasien', helper: 'Rangkum topik edukasi dalam bahasa yang lebih mudah dipahami.' },
  { key: 'case-note', label: 'Catatan Kasus', helper: 'Ruang cepat untuk poin kasus, refleksi, dan pembelajaran.' },
  { key: 'shift', label: 'Checklist Jaga', helper: 'Checklist ringkas untuk menjaga kontinuitas tugas dan handover.' },
  { key: 'flash', label: 'Flash Review', helper: 'Review cepat konsep inti sebelum belajar lebih dalam.' },
  { key: 'quiz', label: 'Mini Quiz', helper: 'Gunakan pertanyaan singkat untuk active recall.' },
  { key: 'progress', label: 'Progress Tracker', helper: 'Tandai progres belajar atau penyelesaian workflow.' },
  { key: 'notes', label: 'Quick Notes', helper: 'Tangkap ide atau catatan singkat tanpa meninggalkan Home.' },
] as const

const WIDGETS: ClinicalWidget[] = CATEGORIES.flatMap((category) =>
  MODULES.slice(0, category.count).map((module, index) => ({
    id: `${category.id}-${module.key}`,
    categoryId: category.id,
    category: category.label,
    title: module.label,
    helper: module.helper,
    number: index + 1,
  })),
)

function nextStatus(current: WidgetStatus = 'Belum'): WidgetStatus {
  const index = STATUS.indexOf(current)
  return STATUS[(index + 1) % STATUS.length]
}

export function InteractiveWidgetLibrary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [states, setStates] = useState<Record<string, WidgetState>>({})
  const [selected, setSelected] = useState<ClinicalWidget | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const rails = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setStates(JSON.parse(saved) as Record<string, WidgetState>)
    } catch {
      // Local persistence is a progressive enhancement; the widgets still work without it.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
    } catch {
      // Ignore quota/privacy-mode failures and keep the in-memory interaction working.
    }
  }, [hydrated, states])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return WIDGETS.filter((widget) => {
      const categoryMatch = category === 'all' || category === 'favorites'
        ? true
        : widget.categoryId === category
      const favoriteMatch = category !== 'favorites' || states[widget.id]?.favorite
      const searchMatch = !needle || `${widget.title} ${widget.category} ${widget.helper}`.toLowerCase().includes(needle)
      return categoryMatch && favoriteMatch && searchMatch
    })
  }, [category, query, states])

  const visibleCategories = CATEGORIES.filter((item) =>
    filtered.some((widget) => widget.categoryId === item.id),
  )

  const updateState = (id: string, patch: Partial<WidgetState>) => {
    setStates((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }))
  }

  const scrollRail = (id: string, direction: -1 | 1) => {
    const rail = rails.current[id]
    if (!rail) return
    rail.scrollBy({ left: direction * Math.max(320, rail.clientWidth * 0.82), behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-brand/25 bg-black shadow-[0_18px_60px_rgba(0,191,99,.08)]" aria-labelledby="interactive-widget-library-title">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/10 to-transparent" aria-hidden />
      <div className="relative p-3 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Panacea interactive library</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="interactive-widget-library-title" className="text-xl font-black tracking-tight text-white sm:text-2xl">200 widget interaktif</h2>
              <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[10px] font-black text-brand">{WIDGETS.length} LIVE MODULES</span>
            </div>
            <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-white/65 sm:text-sm">Swipe atau scroll horizontal per kategori. Cari modul, favoritkan, ubah status, buka detail, dan simpan notes tanpa meninggalkan Home.</p>
          </div>

          <label className="flex min-h-[46px] w-full items-center gap-2 rounded-[15px] border border-brand/25 bg-[#020806] px-3 xl:max-w-sm">
            <span className="text-brand" aria-hidden>⌕</span>
            <span className="sr-only">Cari widget</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari dari 200 widget…"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="rounded-full px-2 py-1 text-xs font-black text-white/65 hover:bg-brand/10 hover:text-brand" aria-label="Hapus pencarian">×</button>
            )}
          </label>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Filter kategori widget">
          {[
            { id: 'all', label: `Semua · ${WIDGETS.length}` },
            { id: 'favorites', label: `Favorit · ${Object.values(states).filter((item) => item.favorite).length}` },
            ...CATEGORIES.map((item) => ({ id: item.id, label: item.label })),
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={`min-h-[40px] shrink-0 rounded-full border px-3 text-[11px] font-black transition active:scale-[.98] ${category === item.id ? 'border-brand bg-brand text-black' : 'border-brand/20 bg-[#020806] text-white/75 hover:border-brand/55 hover:text-brand'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-6">
          {visibleCategories.map((item) => {
            const widgets = filtered.filter((widget) => widget.categoryId === item.id)
            return (
              <div key={item.id}>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-black text-white sm:text-base">{item.label}</h3>
                      <span className="rounded-full border border-brand/20 bg-brand/[.08] px-2 py-0.5 text-[10px] font-black text-brand">{widgets.length}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.15em] text-white/35">Swipe → explore → interact</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => scrollRail(item.id, -1)} className="grid h-9 w-9 place-items-center rounded-full border border-brand/20 bg-[#020806] text-lg font-black text-white transition hover:border-brand hover:text-brand" aria-label={`Geser ${item.label} ke kiri`}>‹</button>
                    <button type="button" onClick={() => scrollRail(item.id, 1)} className="grid h-9 w-9 place-items-center rounded-full border border-brand/20 bg-[#020806] text-lg font-black text-white transition hover:border-brand hover:text-brand" aria-label={`Geser ${item.label} ke kanan`}>›</button>
                  </div>
                </div>

                <div
                  ref={(node) => { rails.current[item.id] = node }}
                  className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-2 pr-6"
                >
                  {widgets.map((widget) => {
                    const state = states[widget.id] ?? {}
                    const status = state.status ?? 'Belum'
                    return (
                      <article
                        key={widget.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(widget)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelected(widget)
                          }
                        }}
                        className="group relative min-h-[184px] w-[82vw] max-w-[292px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-[20px] border border-brand/20 bg-[#020806] p-4 text-left outline-none transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-[0_14px_36px_rgba(0,191,99,.12)] focus-visible:ring-2 focus-visible:ring-brand sm:w-[280px]"
                      >
                        <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${item.accent}`} aria-hidden />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/10 bg-black/60 text-xs font-black text-brand">{String(widget.number).padStart(2, '0')}</div>
                          <button
                            type="button"
                            aria-label={state.favorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
                            aria-pressed={Boolean(state.favorite)}
                            onClick={(event) => {
                              event.stopPropagation()
                              updateState(widget.id, { favorite: !state.favorite })
                            }}
                            className={`grid h-9 w-9 place-items-center rounded-full border text-base transition ${state.favorite ? 'border-brand bg-brand text-black' : 'border-white/10 bg-black/60 text-white/55 hover:border-brand/50 hover:text-brand'}`}
                          >
                            {state.favorite ? '★' : '☆'}
                          </button>
                        </div>
                        <div className="relative mt-4">
                          <div className="text-[9px] font-black uppercase tracking-[.16em] text-brand">{widget.category}</div>
                          <h4 className="mt-1 text-base font-black leading-tight text-white">{widget.title}</h4>
                          <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-relaxed text-white/55">{widget.helper}</p>
                        </div>
                        <div className="relative mt-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              updateState(widget.id, { status: nextStatus(status) })
                            }}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${status === 'Selesai' ? 'border-brand bg-brand/15 text-brand' : status === 'Proses' ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-black text-white/55'}`}
                          >
                            {status}
                          </button>
                          <span className="text-[10px] font-black text-white/35 transition group-hover:text-brand">OPEN →</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="rounded-[20px] border border-brand/20 bg-[#020806] px-4 py-10 text-center">
              <div className="text-sm font-black text-white">Widget tidak ditemukan</div>
              <button type="button" onClick={() => { setQuery(''); setCategory('all') }} className="mt-3 rounded-full bg-brand px-4 py-2 text-xs font-black text-black">Reset filter</button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="widget-detail-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null) }}>
          <div className="w-full max-w-xl overflow-hidden rounded-t-[26px] border border-brand/30 bg-[#020806] shadow-[0_30px_100px_rgba(0,191,99,.18)] sm:rounded-[26px]">
            <div className="h-1 w-full bg-brand" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.2em] text-brand">{selected.category}</div>
                  <h3 id="widget-detail-title" className="mt-1 text-xl font-black text-white">{selected.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/60">{selected.helper}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-black text-xl font-black text-white hover:border-brand hover:text-brand" aria-label="Tutup widget">×</button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateState(selected.id, { favorite: !states[selected.id]?.favorite })}
                  className={`min-h-[46px] rounded-[14px] border px-3 text-xs font-black ${states[selected.id]?.favorite ? 'border-brand bg-brand text-black' : 'border-brand/25 bg-black text-white hover:text-brand'}`}
                >
                  {states[selected.id]?.favorite ? '★ Favorit' : '☆ Favoritkan'}
                </button>
                <button
                  type="button"
                  onClick={() => updateState(selected.id, { status: nextStatus(states[selected.id]?.status ?? 'Belum') })}
                  className="min-h-[46px] rounded-[14px] border border-brand/25 bg-black px-3 text-xs font-black text-white hover:text-brand"
                >
                  Status · {states[selected.id]?.status ?? 'Belum'}
                </button>
              </div>

              <label className="mt-4 block">
                <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/45">Notes</span>
                <textarea
                  value={states[selected.id]?.notes ?? ''}
                  onChange={(event) => updateState(selected.id, { notes: event.target.value })}
                  placeholder="Tulis catatan, learning point, atau hal yang perlu diingat…"
                  rows={5}
                  className="mt-2 w-full resize-none rounded-[16px] border border-brand/20 bg-black p-3 text-sm font-medium text-white outline-none placeholder:text-white/30 focus:border-brand"
                />
              </label>

              <div className="mt-3 text-[10px] font-medium leading-relaxed text-white/35">Workspace ini membantu organisasi belajar dan workflow. Ia tidak menggantikan penilaian klinis profesional atau protokol setempat.</div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default InteractiveWidgetLibrary
