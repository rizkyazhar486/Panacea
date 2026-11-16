import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FOR_YOU_WIDGET_CATALOG, type ForYouWidgetDefinition } from '../../lib/forYouWidgetCatalog'
import { getVitals, type Vitals } from '../../lib/healthVitals'
import { useOptionalStore } from '../../lib/store'

function sourceLabel(widget: ForYouWidgetDefinition) {
  if (widget.sourcePolicy === 'adapter-required') return 'connection required'
  if (widget.sourcePolicy === 'live-source') return 'live source'
  if (widget.sourcePolicy === 'local') return 'local'
  return 'Panacea'
}

function widgetMetric(widget: ForYouWidgetDefinition, vitals: Partial<Vitals>) {
  if (widget.kind === 'music') return 'Spotify · Apple Music'
  if (widget.kind === 'sports') {
    if (typeof vitals.steps === 'number' && vitals.steps > 0) return `${Math.round(vitals.steps).toLocaleString('en-US')} steps`
    return 'Live'
  }
  if (widget.kind === 'faith') return 'Today'
  if (widget.kind === 'mental-wellbeing') {
    if (typeof vitals.hrvMs === 'number' && vitals.hrvMs > 0) return `HRV ${Math.round(vitals.hrvMs)} ms`
    return 'Private'
  }
  if (widget.kind === 'motivation') {
    if (typeof vitals.sleepH === 'number' && vitals.sleepH > 0) return `Sleep ${vitals.sleepH.toFixed(1)}h`
    return '1 next action'
  }
  if (widget.kind === 'library') return 'Continue'
  if (widget.kind === 'stories') return 'Read'
  return 'Activity'
}

export function ForYouDailyStack() {
  const store = useOptionalStore()
  const account = store?.account ?? null
  const [infoId, setInfoId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const bump = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('panacea:body-character-updated', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('panacea:health-updated', bump)
      window.removeEventListener('panacea:body-character-updated', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  const vitals = useMemo<Partial<Vitals>>(() => {
    void rev
    try {
      return getVitals(account)
    } catch {
      return {}
    }
  }, [account, rev])

  const visibleWidgets = useMemo(
    () => expanded ? FOR_YOU_WIDGET_CATALOG : FOR_YOU_WIDGET_CATALOG.slice(0, 4),
    [expanded],
  )

  const triageColor = useMemo<'green' | 'yellow' | 'red'>(() => {
    const sbp = Number(vitals.systolic)
    const dbp = Number(vitals.diastolic)
    const hr = Number(vitals.restingHr ?? vitals.heartRate)
    const spo2 = Number(vitals.spo2Pct)
    const sleep = Number(vitals.sleepH)

    if ((sbp > 0 && sbp >= 160) || (dbp > 0 && dbp >= 100) || (hr > 0 && hr >= 120) || (spo2 > 0 && spo2 < 92)) {
      return 'red'
    }
    if ((sbp > 0 && sbp >= 130) || (dbp > 0 && dbp >= 85) || (hr > 0 && hr >= 100) || (sleep > 0 && sleep < 6)) {
      return 'yellow'
    }
    return 'green'
  }, [vitals])

  return (
    <section aria-label="For You daily stack" className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/34">Daily stack</div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="min-h-[36px] rounded-full border border-white/[.08] px-3 text-[9px] font-black text-white/40 transition hover:border-white/15 hover:text-white/72"
        >
          {expanded ? 'Compact' : `All ${FOR_YOU_WIDGET_CATALOG.length}`}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/[.07] bg-white/[.022] px-3 py-2 text-[11px] text-white/75">
        <span>
          {vitals.restingHr || vitals.heartRate || vitals.hrvMs || vitals.sleepH || vitals.steps
            ? `Live signals — HR ${vitals.restingHr ?? vitals.heartRate ?? '—'} · HRV ${vitals.hrvMs ?? '—'} ms · Sleep ${vitals.sleepH != null ? `${vitals.sleepH.toFixed(1)}h` : '—'}`
            : 'No wearable readings recorded yet — connect a monitor in Body or enter Health Data.'}
        </span>
        <div className="flex items-center gap-3">
          <Link to="/fitness?t=body-exposure" style={{ color: '#6ee7b7' }} className="font-bold transition hover:text-white">
            Wearables →
          </Link>
          <Link to="/emergency" style={{ color: '#fda4af' }} className="font-bold transition hover:text-white">
            Emergency 118/119 →
          </Link>
        </div>
      </div>

      {/* 24-Hour Circadian Protocol & 3-Color Self-Triage */}
      <div className="mb-3 rounded-[20px] border border-white/[.08] bg-white/[0.025] p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.06] pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                triageColor === 'red'
                  ? 'bg-rose-500 animate-pulse'
                  : triageColor === 'yellow'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-white tracking-wide">
              {triageColor === 'red'
                ? 'Triase: Perhatian Medis Diperlukan Segera'
                : triageColor === 'yellow'
                ? 'Triase: Perlu Penyesuaian Gaya Hidup & Istirahat'
                : 'Triase: Kondisi Tubuh Stabil & Siap Beraktivitas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:119"
              className="inline-flex min-h-[32px] items-center rounded-lg bg-rose-500/20 px-2.5 py-1 text-[10px] font-black text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition"
              title="Hubungi Sistem Penanggulangan Gawat Darurat Terpadu (SPGDT) 119"
            >
              🚨 Hubungi SPGDT 119
            </a>
            <Link
              to="/emergency"
              className="inline-flex min-h-[32px] items-center rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/80 hover:text-white border border-white/15"
            >
              Protokol Darurat →
            </Link>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-white/70">
          {triageColor === 'red'
            ? 'Peringatan tanda vital memerlukan evaluasi medis langsung. Jika mengalami nyeri dada, sesak nafas berat, atau pusing mendadak, segera hubungi SPGDT 119 atau kunjungi IGD terdekat.'
            : triageColor === 'yellow'
            ? 'Tekanan darah atau denyut jantung berada di ambang batas atas atau durasi tidur kurang optimal. Prioritaskan hidrasi air mineral, istirahat cukup, dan hindari konsumsi kafein berlebih hari ini.'
            : 'Seluruh parameter tanda vital berada dalam rentang normal harian. Ritme sirkadian tubuh terjaga baik untuk mendukung fokus dan latihan fisik.'}
        </p>

        {/* 4-Phase Circadian Timeline */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[14px] border border-white/[.05] bg-black/20 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.1em] text-amber-300">06:00–09:00 · Pagi</div>
            <div className="mt-0.5 font-bold text-white text-[11px]">Kesiapan &amp; Sinar Matahari</div>
            <p className="mt-1 text-[10px] text-white/50 leading-relaxed">
              Hidrasi 500ml air, paparan cahaya alami 15 menit, cek skor kesiapan &amp; HRV.
            </p>
          </div>
          <div className="rounded-[14px] border border-white/[.05] bg-black/20 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.1em] text-cyan-300">09:00–14:00 · Siang</div>
            <div className="mt-0.5 font-bold text-white text-[11px]">Nutrisi &amp; Fokus Kerja</div>
            <p className="mt-1 text-[10px] text-white/50 leading-relaxed">
              Makanan padat nutrisi, jeda peregangan ergonomi tiap 60 menit, batas kafein pk 14:00.
            </p>
          </div>
          <div className="rounded-[14px] border border-white/[.05] bg-black/20 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.1em] text-emerald-300">14:00–18:00 · Sore</div>
            <div className="mt-0.5 font-bold text-white text-[11px]">Aktivitas &amp; Latihan</div>
            <p className="mt-1 text-[10px] text-white/50 leading-relaxed">
              Penuhi target langkah ({vitals.steps ? `${vitals.steps.toLocaleString()} / 8.000` : 'target 8.000'}), latihan kekuatan atau aerobik terukur.
            </p>
          </div>
          <div className="rounded-[14px] border border-white/[.05] bg-black/20 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-[.1em] text-purple-300">18:00–22:00 · Malam</div>
            <div className="mt-0.5 font-bold text-white text-[11px]">Pemulihan &amp; Tidur</div>
            <p className="mt-1 text-[10px] text-white/50 leading-relaxed">
              Redupkan layar, suhu kamar sejuk, target tidur restoratif 7–8 jam.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {visibleWidgets.map((widget) => {
          const body = (
            <div className="flex h-full min-h-[112px] flex-col justify-between rounded-[18px] border border-white/[.07] bg-white/[.022] p-3 transition hover:border-white/14 hover:bg-white/[.035]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[8px] font-black uppercase tracking-[.12em] text-white/28">{widget.primaryVisual}</span>
                <span className="truncate text-[8px] font-black uppercase tracking-[.1em] text-white/18">{sourceLabel(widget)}</span>
              </div>

              <div className="min-w-0">
                <div className="truncate text-[9px] font-black uppercase tracking-[.12em] text-white/36">{widget.title}</div>
                <div className="mt-1 truncate text-xl font-black tracking-[-.04em] text-white">{widgetMetric(widget, vitals)}</div>
              </div>
            </div>
          )

          const needsAdapter = widget.sourcePolicy === 'adapter-required'

          return (
            <article key={widget.id} className="relative min-w-0">
              {widget.route ? (
                <Link to={widget.route} aria-label={`Open ${widget.title}`}>{body}</Link>
              ) : needsAdapter ? (
                <button
                  type="button"
                  className="block w-full text-left"
                  aria-label={`${widget.title} adapter status`}
                  aria-expanded={infoId === widget.id}
                  onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
                >
                  {body}
                </button>
              ) : body}
              <button
                type="button"
                className="absolute bottom-2.5 right-2.5 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/[.08] bg-black/25 text-[9px] font-black text-white/35 hover:text-white/70"
                onClick={() => setInfoId((current) => current === widget.id ? null : widget.id)}
                aria-expanded={infoId === widget.id}
                aria-label={`About ${widget.title}`}
              >
                i
              </button>
              {infoId === widget.id && (
                <div className="mt-1 rounded-[14px] border border-white/[.06] bg-white/[.02] px-3 py-2 text-[10px] leading-relaxed text-white/42">
                  {widget.kind === 'music' && widget.adapters ? (
                    <ul className="space-y-1">
                      {widget.adapters.map((adapter) => (
                        <li key={adapter} className="flex items-center justify-between gap-2">
                          <span>{adapter === 'spotify' ? 'Spotify' : 'Apple Music'}</span>
                          <span className="font-black uppercase tracking-[.08em] text-white/30">Not connected — sign-in not configured</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{widget.oneSentence}</p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ForYouDailyStack
