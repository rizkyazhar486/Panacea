import { Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import '../styles/widget-living-instrument-v5.css'
import '../styles/widget-concepts-v8.css'
import '../styles/widget-dark-surface-v29.css'

type WidgetItem = { kunci: string; isi: ReactNode }
type InstrumentMeta = {
  name: string
  kicker: string
  icon: string
  kind: 'performance' | 'recovery' | 'nutrition' | 'ritual' | 'reflection' | 'alerts' | 'sport' | 'body' | 'focus' | 'general'
  accent: string
  soft: string
}

const META: Record<string, Partial<InstrumentMeta>> = {
  kebugaran: { name: 'Training today', kicker: 'Performance', icon: '🏃', kind: 'performance' },
  salat: { name: 'Prayer rhythm', kicker: 'Time & ritual', icon: '◌', kind: 'ritual' },
  pantauan: { name: 'Health watch', kicker: 'Monitoring', icon: '◎', kind: 'body' },
  skorTim: { name: 'Team scores', kicker: 'Live sport', icon: '⚽', kind: 'sport' },
  tidurLebar: { name: 'Sleep architecture', kicker: 'Recovery', icon: '☾', kind: 'recovery' },
  giziLebar: { name: 'Nutrition summary', kicker: 'Metabolism', icon: '◐', kind: 'nutrition' },
  motivasi: { name: 'Motivation note', kicker: 'Reflection', icon: '✦', kind: 'focus' },
  lingkungan: { name: 'Environment radar', kicker: 'Exposure', icon: '⌁', kind: 'body' },
  pangan: { name: 'Food intelligence', kicker: 'Nutrition', icon: '◉', kind: 'nutrition' },
  obatPengingat: { name: 'Dose schedule', kicker: 'Medication', icon: '✚', kind: 'alerts' },
  beban: { name: 'Training load', kicker: 'Performance', icon: '⌁', kind: 'performance' },
  ukurBerkala: { name: 'Measurements', kicker: 'Follow-up', icon: '◎', kind: 'body' },
  skrining: { name: 'Screening status', kicker: 'Prevention', icon: '◇', kind: 'body' },
  amsler: { name: 'Vision check', kicker: 'Eye health', icon: '◫', kind: 'body' },
  layar: { name: 'Screen balance', kicker: 'Digital health', icon: '▣', kind: 'focus' },
  peregangan: { name: 'Mobility break', kicker: 'Movement', icon: '↗', kind: 'performance' },
  tekananSebar: { name: 'Blood pressure', kicker: 'Circulation', icon: '♥', kind: 'body' },
  rangkaian: { name: 'Habit streak', kicker: 'Consistency', icon: '∞', kind: 'focus' },
  jetlag: { name: 'Jet lag', kicker: 'Circadian', icon: '◒', kind: 'recovery' },
  nadiPanjang: { name: 'Heart-rate trend', kicker: 'Cardio', icon: '♥', kind: 'body' },
  tidur14: { name: 'Sleep trend', kicker: '14 days', icon: '☾', kind: 'recovery' },
  muatanPekan: { name: 'Weekly load', kicker: 'Training', icon: '▥', kind: 'performance' },
  kaloriBanding: { name: 'Energy balance', kicker: 'Metabolism', icon: '◐', kind: 'nutrition' },
  tdee: { name: 'Daily energy estimate', kicker: 'Metabolism', icon: '◐', kind: 'nutrition' },
  ayatHarian: { name: 'Daily reflection', kicker: 'Scripture', icon: '✦', kind: 'reflection' },
  hitungHari: { name: 'Countdown', kicker: 'Timeline', icon: '⌛', kind: 'focus' },
  ringHarian: { name: 'Daily summary', kicker: 'Today', icon: '◎', kind: 'performance' },
  kepatuhan: { name: 'Consistency', kicker: 'Adherence', icon: '✓', kind: 'focus' },
  beratTren: { name: 'Weight trend', kicker: 'Body', icon: '◒', kind: 'body' },
  lab: { name: 'Lab watch', kicker: 'Clinical', icon: '⌬', kind: 'body' },
  tenaga: { name: 'Energy check-in', kicker: 'Self-report', icon: '⚡', kind: 'performance' },
  hidrasi2: { name: 'Hydration', kicker: 'Fluid intake', icon: '◉', kind: 'nutrition' },
  cahaya: { name: 'Light exposure', kicker: 'Circadian', icon: '☼', kind: 'recovery' },
  tangga: { name: 'Flights climbed', kicker: 'Movement', icon: '↗', kind: 'performance' },
  vo2tren: { name: 'VO₂max trend', kicker: 'Cardiorespiratory fitness', icon: '△', kind: 'performance' },
  komposisi: { name: 'Body composition', kicker: 'Body', icon: '◐', kind: 'body' },
  suplemen: { name: 'Supplements', kicker: 'Routine', icon: '✚', kind: 'nutrition' },
  suhuEkstrem: { name: 'Heat & cold exposure', kicker: 'Environment', icon: '≈', kind: 'body' },
  hrv: { name: 'HRV trend', kicker: 'Recovery signal', icon: '⌁', kind: 'recovery' },
  tahapTidur: { name: 'Sleep stages', kicker: 'Recovery', icon: '☾', kind: 'recovery' },
  efisiensiTidur: { name: 'Sleep efficiency', kicker: 'Recovery', icon: '◒', kind: 'recovery' },
  lajuNapas: { name: 'Respiratory rate', kicker: 'Vitals', icon: '≈', kind: 'body' },
  saturasi: { name: 'Oxygen saturation', kicker: 'Vitals', icon: 'O₂', kind: 'body' },
  suhu: { name: 'Body temperature', kicker: 'Vitals', icon: '°', kind: 'body' },
  zona2: { name: 'Zone 2 minutes', kicker: 'Aerobic base', icon: 'Z2', kind: 'performance' },
  hrr: { name: 'Heart-rate recovery', kicker: 'Recovery', icon: '↘', kind: 'recovery' },
  utangTidur: { name: 'Sleep debt', kicker: 'Recovery', icon: '☾', kind: 'recovery' },
  tekanan: { name: 'Blood pressure trend', kicker: 'Circulation', icon: '♥', kind: 'body' },
  napas: { name: 'Breathing exercise', kicker: 'Recovery tool', icon: '◌', kind: 'recovery' },
  duduk: { name: 'Sitting time', kicker: 'Movement', icon: '▰', kind: 'performance' },
  fokus: { name: 'Focus timer', kicker: 'Cognitive tool', icon: '◎', kind: 'focus' },
  mata: { name: 'Eye break', kicker: 'Digital health', icon: '◉', kind: 'focus' },
  puasa: { name: 'Fasting timer', kicker: 'Timing', icon: '◒', kind: 'ritual' },
  kopi: { name: 'Caffeine timing', kicker: 'Estimated decay', icon: '◐', kind: 'focus' },
  pewaktu: { name: 'Timer', kicker: 'Action', icon: '◷', kind: 'focus' },
  kabar: { name: 'Health brief', kicker: 'Updates', icon: '⌁', kind: 'alerts' },
  pengingat: { name: 'Reminders', kicker: 'Needs attention', icon: '●', kind: 'alerts' },
  inspirasi: { name: 'Learning prompt', kicker: 'Reflection', icon: '✦', kind: 'reflection' },
  ringkasanKarya: { name: 'Learning summary', kicker: 'Knowledge', icon: '▤', kind: 'focus' },
  soalHarian: { name: 'Daily question', kicker: 'Learning', icon: '?', kind: 'focus' },
  kartuBelajar: { name: 'Study card', kicker: 'Learning', icon: '▧', kind: 'focus' },
  obatCepat: { name: 'Drug lookup', kicker: 'Clinical tools', icon: '✚', kind: 'alerts' },
  kalkulatorCepat: { name: 'Medical calculator', kicker: 'Clinical tools', icon: '∑', kind: 'body' },
  stasiunSering: { name: 'OSCE station', kicker: 'Clinical learning', icon: '◇', kind: 'focus' },
  konsistensi: { name: 'Consistency map', kicker: 'Your records', icon: '▦', kind: 'focus' },
  dompet: { name: 'Wallet', kicker: 'Balance', icon: '◇', kind: 'general' },
}

const KIND_ACCENT: Record<InstrumentMeta['kind'], { accent: string; soft: string }> = {
  performance: { accent: '#3b82f6', soft: 'rgba(59,130,246,.11)' },
  recovery: { accent: '#8b5cf6', soft: 'rgba(139,92,246,.11)' },
  nutrition: { accent: '#14b8a6', soft: 'rgba(20,184,166,.11)' },
  ritual: { accent: '#22c55e', soft: 'rgba(34,197,94,.10)' },
  reflection: { accent: '#d4a72c', soft: 'rgba(212,167,44,.10)' },
  alerts: { accent: '#f97316', soft: 'rgba(249,115,22,.10)' },
  sport: { accent: '#06b6d4', soft: 'rgba(6,182,212,.10)' },
  body: { accent: '#ef4444', soft: 'rgba(239,68,68,.10)' },
  focus: { accent: '#a855f7', soft: 'rgba(168,85,247,.10)' },
  general: { accent: '#00bf63', soft: 'rgba(0,191,99,.10)' },
}

function metaFor(key?: string): InstrumentMeta {
  const partial = key ? META[key] : undefined
  const kind = partial?.kind ?? 'general'
  const palette = KIND_ACCENT[kind]
  return {
    name: partial?.name ?? 'Widget',
    kicker: partial?.kicker ?? 'Data & action',
    icon: partial?.icon ?? '◎',
    kind,
    accent: palette.accent,
    soft: palette.soft,
  }
}

export function Tumpukan({ judul, anak, aksi }: { judul?: string; anak: WidgetItem[]; aksi?: ReactNode }) {
  const wadah = useRef<HTMLDivElement>(null)
  const halaman = useRef<(HTMLDivElement | null)[]>([])
  const digeser = useRef(false)
  const hemat = typeof document !== 'undefined' && document.documentElement.classList.contains('pmd-low-memory')
  const preload = 1
  const [aktif, setAktif] = useState(0)
  const [tinggi, setTinggi] = useState<number | undefined>(undefined)
  const [kosong, setKosong] = useState<Record<number, boolean>>({})
  const [siap, setSiap] = useState(() => Math.min(anak.length, preload))

  useEffect(() => {
    setSiap((s) => Math.max(s, Math.min(anak.length, preload)))
  }, [anak.length, preload])

  useEffect(() => {
    const periksa = () => {
      setKosong((lama) => {
        const baru: Record<number, boolean> = {}
        let berubah = false
        anak.forEach((_, i) => {
          const nihil = i < siap && !halaman.current[i]?.firstElementChild
          baru[i] = nihil
          if (lama[i] !== nihil) berubah = true
        })
        return berubah ? baru : lama
      })
    }
    periksa()
    const mo = new MutationObserver(periksa)
    halaman.current.forEach((el, i) => {
      if (el && i < siap) mo.observe(el, { childList: true })
    })
    return () => mo.disconnect()
  }, [anak, siap])

  const tampil = anak.map((a, i) => ({ ...a, i })).filter((a) => !kosong[a.i])
  const TINGGI_MIN = 184
  const TINGGI_MAKS = hemat ? 390 : 440
  const aktifItem = tampil[Math.min(aktif, Math.max(0, tampil.length - 1))]

  // Reset before paint whenever the visible source widget changes. This is the
  // browser-independent counterpart to the :has() CSS guard: older WebViews
  // must never inherit a tall previous widget while the new slide mounts.
  useLayoutEffect(() => {
    setTinggi(TINGGI_MIN)
  }, [aktifItem?.i])

  // `aktif` is the index inside the filtered visible list, while `siap` is a
  // prefix count in the original `anak` array. When earlier widgets return
  // null, these indexes diverge. Mount by the active widget's ORIGINAL index so
  // the header can never point at an unmounted/blank slide (e.g. 11/17 Zone 2).
  useEffect(() => {
    const lookAhead = 1
    const originalIndex = aktifItem?.i ?? aktif
    setSiap((s) => Math.max(s, Math.min(anak.length, originalIndex + lookAhead + 1)))
  }, [aktif, aktifItem?.i, anak.length])

  useEffect(() => {
    const index = aktifItem?.i
    if (index == null || index >= siap) return
    const el = halaman.current[index]
    if (!el) return

    let frame = 0
    const ukur = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const first = el.firstElementChild as HTMLElement | null
        const alami = first ? Math.max(first.scrollHeight, first.getBoundingClientRect().height) : el.scrollHeight
        if (alami > 0) setTinggi(Math.min(TINGGI_MAKS, Math.max(TINGGI_MIN, alami + 32)))
        frame = 0
      })
    }

    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    const first = el.firstElementChild as HTMLElement | null
    if (first) ro.observe(first)
    return () => {
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [aktifItem?.i, siap, TINGGI_MAKS])

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    let frame = 0
    const gulir = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
        setAktif(Math.max(0, Math.min(i, Math.max(0, tampil.length - 1))))
        frame = 0
      })
    }
    const tandai = () => { digeser.current = true }
    el.addEventListener('scroll', gulir, { passive: true })
    el.addEventListener('pointerdown', tandai, { passive: true })
    el.addEventListener('wheel', tandai, { passive: true })
    return () => {
      el.removeEventListener('scroll', gulir)
      el.removeEventListener('pointerdown', tandai)
      el.removeEventListener('wheel', tandai)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [tampil.length])

  useEffect(() => {
    if (!tampil.length) return
    setAktif((v) => Math.min(v, tampil.length - 1))
    const el = wadah.current
    if (!el) return
    const id = window.setTimeout(() => {
      const w = el.clientWidth
      if (!w) return
      const target = digeser.current ? Math.round(el.scrollLeft / w) * w : 0
      if (Math.abs(el.scrollLeft - target) > 1) el.scrollTo({ left: target })
    }, 60)
    return () => window.clearTimeout(id)
  }, [tampil.length, tinggi])

  if (!anak.length) return null

  const ke = (i: number) => {
    const next = Math.max(0, Math.min(i, Math.max(0, tampil.length - 1)))
    digeser.current = true
    setAktif(next)
    const el = wadah.current
    if (el) {
      const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ left: next * el.clientWidth, behavior: hemat || reduced ? 'auto' : 'smooth' })
    }
  }

  const current = aktifItem
  const meta = metaFor(current?.kunci)
  const progress = tampil.length ? ((aktif + 1) / tampil.length) * 100 : 0
  const nextMeta = tampil.length > 1 ? metaFor(tampil[Math.min(aktif + 1, tampil.length - 1)]?.kunci) : meta
  const cssVars = { '--wa': meta.accent, '--wa-soft': meta.soft } as CSSProperties

  return (
    <section
      className="widget-instrument-v5"
      data-kind={meta.kind}
      data-active-widget={current?.kunci ?? 'none'}
      style={cssVars}
      aria-label={judul || 'Widgets'}
    >
      <div className="widget-instrument-head-v5">
        <div className="widget-instrument-id-v5">
          <span className="widget-instrument-icon-v5" aria-hidden>{meta.icon}</span>
          <div className="widget-instrument-copy-v5">
            <div className="widget-instrument-kicker-v5">{meta.kicker}</div>
            <div className="widget-instrument-title-row-v5">
              <h2 className="widget-instrument-title-v5">{meta.name}</h2>
              <span className="widget-instrument-state-v5">{judul || 'Summary'}</span>
            </div>
          </div>
        </div>
        <div className="widget-instrument-tools-v5">
          <span className="widget-instrument-count-v5" aria-label={`Widget ${aktif + 1} of ${Math.max(1, tampil.length)}`}>
            {Math.min(aktif + 1, Math.max(1, tampil.length))}/{Math.max(1, tampil.length)}
          </span>
          {aksi && <div className="widget-instrument-edit-v5"><span aria-hidden>⚙</span><span>{aksi}</span></div>}
        </div>
      </div>

      <div className="widget-instrument-shell-v5">
        <div
          ref={wadah}
          className="widget-instrument-scroll-v5"
          style={{ height: tinggi, minHeight: TINGGI_MIN }}
        >
          {anak.map((a, i) => (
            <div
              key={a.kunci}
              ref={(el) => { halaman.current[i] = el }}
              className={`${kosong[i] ? 'hidden' : ''} widget-instrument-slide-v5`}
              data-widget={a.kunci}
              aria-hidden={aktifItem?.i !== i}
            >
              {i < siap ? (
                <Suspense fallback={<div className="widget-instrument-loading-v29" aria-hidden />}>
                  {a.isi}
                </Suspense>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {tampil.length > 1 && (
        <div className="widget-instrument-foot-v5" aria-label="Widget navigation">
          <button type="button" className="widget-instrument-nav-v5" onClick={() => ke(aktif - 1)} disabled={aktif <= 0} aria-label="Previous widget">‹</button>
          <div className="widget-instrument-track-v5">
            <div className="widget-instrument-line-v5" aria-hidden>
              <div className="widget-instrument-line-fill-v5" style={{ width: `${progress}%` }} />
            </div>
            <span className="widget-instrument-label-v5">Next · {nextMeta.name}</span>
          </div>
          <button type="button" className="widget-instrument-nav-v5" onClick={() => ke(aktif + 1)} disabled={aktif >= tampil.length - 1} aria-label="Next widget">›</button>
        </div>
      )}
    </section>
  )
}

export default Tumpukan