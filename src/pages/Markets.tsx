import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Badge, inputClass } from '../components/ui'
import { IconToken } from '../components/icons'
import { api, backendEnabled, type MarketQuote, type MarketInstrument, type LiveNewsItem, type SymbolHit } from '../lib/api'

// Live market data: prices, charts, business news.
//
// Two things this page will not do, and says so on screen rather than in a
// footnote:
//   - it does not present the feed as real-time tick data (free sources lag the
//     exchange, commonly ~15 minutes, and can gap)
//   - it does not tell anyone what to buy or sell
//
// It auto-refreshes so the numbers stay current, and always shows WHEN the data
// was fetched — a price with no timestamp is the thing that misleads people.

const REFRESH_MS = 60_000

const GROUP_LABEL: Record<string, string> = {
  indeks: 'Indeks', 'saham-id': 'Saham Indonesia', 'saham-us': 'Saham AS',
  kripto: 'Kripto', valas: 'Valas', komoditas: 'Komoditas',
}

const RANGES = [
  { v: '1d', l: '1H' }, { v: '5d', l: '5H' }, { v: '1mo', l: '1B' },
  { v: '6mo', l: '6B' }, { v: '1y', l: '1T' }, { v: '5y', l: '5T' },
]

function fmtPrice(v: number | null, currency: string): string {
  if (v == null) return '—'
  const digits = Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 2 : 4
  const n = v.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return currency === 'IDR' ? `Rp ${n}` : currency === 'USD' ? `$${n}` : `${n} ${currency}`
}

function ago(iso: string | number | null): string {
  if (iso == null) return ''
  const t = typeof iso === 'number' ? iso : Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  return `${Math.floor(s / 86400)} hari lalu`
}

export function Markets() {
  const [instruments, setInstruments] = useState<MarketInstrument[]>([])
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [failed, setFailed] = useState<string[]>([])
  const [range, setRange] = useState('1mo')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<MarketQuote | null>(null)
  const [news, setNews] = useState<LiveNewsItem[]>([])
  const [group, setGroup] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [hits, setHits] = useState<SymbolHit[]>([])
  const [searching, setSearching] = useState(false)
  const [err, setErr] = useState('')
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number | null>(null)

  // "Semua" cannot carry every instrument: the server caps one watchlist request
  // at 20 symbols, and sending the full list would silently keep whichever came
  // first in declaration order — all indices, no crypto. The featured spread is
  // the honest stand-in for "everything".
  const symbols = useMemo(() => {
    if (group) return instruments.filter((i) => i.group === group).map((i) => i.symbol)
    const unggulan = instruments.filter((i) => i.unggulan)
    return (unggulan.length ? unggulan : instruments.slice(0, 20)).map((i) => i.symbol)
  }, [instruments, group])

  const loadWatchlist = useCallback(async () => {
    if (!symbols.length) return
    try {
      const r = await api.marketWatchlist(symbols, range)
      setQuotes(r.quotes)
      setFailed(r.failed)
      setFetchedAt(Date.now())
      setErr('')
    } catch {
      setErr('Data pasar sedang tidak dapat diambil. Angka yang tampil di bawah adalah pengambilan terakhir yang berhasil.')
    } finally {
      setLoading(false)
    }
  }, [symbols, range])

  useEffect(() => {
    if (!backendEnabled) { setLoading(false); return }
    api.marketInstruments().then((r) => setInstruments(r.instruments)).catch(() => setLoading(false))
    api.marketNews().then((r) => setNews(r.items)).catch(() => { /* news is optional */ })
  }, [])

  useEffect(() => { loadWatchlist() }, [loadWatchlist])

  // Keep it current without hammering the source.
  useEffect(() => {
    if (!backendEnabled) return
    timer.current = window.setInterval(loadWatchlist, REFRESH_MS)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [loadWatchlist])

  useEffect(() => {
    if (!selected) { setDetail(null); return }
    let alive = true
    api.marketQuote(selected, range).then((q) => { if (alive) setDetail(q) }).catch(() => { if (alive) setDetail(null) })
    return () => { alive = false }
  }, [selected, range])

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim()
    return quotes.filter((x) => !q || `${x.symbol} ${x.name}`.toLowerCase().includes(q))
  }, [quotes, search])

  // The box used to filter ONLY what was already on screen, so typing "Solana"
  // searched a list that never contained Solana and came back empty — which
  // reads as a broken page, not as a short watchlist. Now anything the source
  // knows about is reachable, debounced so each keystroke is not a request.
  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) { setHits([]); setSearching(false); return }
    setSearching(true)
    const id = window.setTimeout(() => {
      api.marketSearch(q)
        .then((r) => setHits(r.results))
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 350)
    return () => { window.clearTimeout(id); setSearching(false) }
  }, [search])

  // Only worth showing what the watchlist did not already cover.
  const hitsBaru = useMemo(() => {
    const ada = new Set(visible.map((q) => q.symbol.toUpperCase()))
    return hits.filter((h) => !ada.has(h.symbol.toUpperCase()))
  }, [hits, visible])

  // A symbol opened from search is not in the watchlist, so without this it
  // would be fetched and then never rendered — the tap would look ignored.
  const daftar = useMemo(() => {
    if (detail && !visible.some((q) => q.symbol.toUpperCase() === detail.symbol.toUpperCase())) {
      return [detail, ...visible]
    }
    return visible
  }, [detail, visible])

  if (!backendEnabled) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Card className="!p-5">
          <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Data pasar memerlukan backend aktif. Halaman ini mengambil harga melalui server
            Panaceamed agar kunci dan pembatasan laju tidak terekspos di browser.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">📈</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Data Pasar</h1>
          <p className="text-xs text-neutral-500">Harga, grafik, dan berita — diperbarui otomatis</p>
        </div>
      </div>

      {/* The disclaimer sits at the top, not the bottom, because it changes how
          every number below should be read. */}
      <Card className="!p-4">
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <span className="text-base">⚠️</span>
          <p className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            Harga di halaman ini <b>tertunda dan bersifat indikatif</b> — sumber gratis umumnya
            tertinggal sekitar 15 menit dari bursa dan sesekali bisa kosong. Adequate untuk memantau
            dan belajar, <b>tidak layak dipakai untuk keputusan jual-beli yang bergantung pada harga
            saat ini</b>. Halaman ini juga tidak memberi rekomendasi membeli maupun menjual apa pun.
          </p>
        </div>
        {fetchedAt && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Diperbarui {ago(fetchedAt)} · sumber Yahoo Finance</span>
            <button onClick={loadWatchlist} className="font-bold text-brand-dark hover:underline">Muat ulang</button>
          </div>
        )}
      </Card>

      {err && (
        <Card className="!p-4"><p className="text-[12px] leading-relaxed text-rose-600 dark:text-rose-600">{err}</p></Card>
      )}

      <Card className="!p-4">
        <input className={inputClass} placeholder="Cari apa pun (mis. Solana, ringgit, BBCA, emas)…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setGroup(null)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!group ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            Semua
          </button>
          {Object.keys(GROUP_LABEL).map((g) => (
            <button key={g} onClick={() => setGroup(group === g ? null : g)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${group === g ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${range === r.v ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {r.l}
            </button>
          ))}
        </div>
      </Card>

      {loading && <Card className="!p-4"><p className="text-[12px] text-neutral-500">Memuat data pasar…</p></Card>}

      {search.trim().length >= 2 && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
            Hasil pencarian "{search.trim()}"
          </div>
          {searching && <p className="mt-2 text-[12px] text-neutral-500">Mencari…</p>}
          {!searching && !hitsBaru.length && !visible.length && (
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              Tidak ada yang cocok. Coba nama lain, kode bursanya, atau bahasa Inggris —
              misalnya "Solana", "SOL-USD", atau "gold".
            </p>
          )}
          {!searching && !!hitsBaru.length && (
            <>
              <p className="mt-1 text-[11px] text-neutral-500">Di luar daftar pantau — ketuk untuk membuka</p>
              <div className="mt-2 space-y-1.5">
                {hitsBaru.map((h) => (
                  <button key={h.symbol} onClick={() => { setSelected(h.symbol); setSearch('') }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-left transition hover:bg-brand/10 dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-ink dark:text-ink">{h.name}</div>
                      <div className="text-[10px] text-neutral-500">
                        {h.symbol}{h.exchange ? ` · ${h.exchange}` : ''}
                      </div>
                    </div>
                    {h.type && (
                      <span className="shrink-0 rounded-md bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                        {h.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {daftar.map((q) => {
        const up = (q.changePct ?? 0) >= 0
        const isOpen = selected === q.symbol
        const chart = isOpen && detail ? detail.series : q.series
        return (
          <Card key={q.symbol} className="!p-4">
            <button className="flex w-full items-start justify-between gap-2 text-left"
              onClick={() => setSelected(isOpen ? null : q.symbol)}>
              <div className="min-w-0">
                <div className="text-[13px] font-black text-ink dark:text-ink">{q.name}</div>
                <div className="text-[10px] text-neutral-500">{q.symbol}{q.exchange ? ` · ${q.exchange}` : ''}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[14px] font-black text-ink dark:text-ink">{fmtPrice(q.price, q.currency)}</div>
                <div className={`text-[11px] font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {q.change != null ? `${up ? '+' : ''}${q.change.toFixed(2)}` : '—'}
                  {q.changePct != null ? ` (${up ? '+' : ''}${q.changePct.toFixed(2)}%)` : ''}
                </div>
              </div>
            </button>

            {chart.length > 1 && (
              <div className="mt-3 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`g-${q.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? '#00BF63' : '#ef4444'} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={up ? '#00BF63' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 9 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} minTickGap={40} />
                    <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} width={54} />
                    <Tooltip
                      contentStyle={{ fontSize: 11 }}
                      labelFormatter={(v) => new Date(v as number).toLocaleString('en-GB')}
                      formatter={(v) => [fmtPrice(typeof v === 'number' ? v : null, q.currency), 'Harga']} />
                    <Area type="monotone" dataKey="c" stroke={up ? '#00BF63' : '#ef4444'} strokeWidth={2} fill={`url(#g-${q.symbol})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {isOpen && detail && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-neutral-50 p-3 text-[11px] dark:bg-white/5">
                <span className="text-neutral-500">Penutupan sebelumnya</span>
                <span className="text-right font-bold text-ink dark:text-ink">{fmtPrice(detail.previousClose, detail.currency)}</span>
                <span className="text-neutral-500">Titik data</span>
                <span className="text-right font-bold text-ink dark:text-ink">{detail.series.length}</span>
                <span className="text-neutral-500">Waktu pasar</span>
                <span className="text-right font-bold text-ink dark:text-ink">{detail.marketTime ? ago(detail.marketTime) : '—'}</span>
              </div>
            )}
          </Card>
        )
      })}

      {failed.length > 0 && (
        <Card className="!p-4">
          <p className="text-[11px] leading-relaxed text-neutral-500">
            Tidak dapat diambil saat ini: {failed.join(', ')}. Ditampilkan apa adanya, bukan
            disembunyikan — kegagalan pengambilan yang disamarkan membuat Anda mengira data lengkap
            padahal tidak.
          </p>
        </Card>
      )}

      {news.length > 0 && (
        <Card className="!p-4">
          <SectionTitle icon={<IconToken size={18} />} title="Berita ekonomi & bisnis" subtitle="Google News — dalam dan luar negeri" />
          <div className="mt-2 space-y-2">
            {news.slice(0, 14).map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl bg-neutral-50 p-3 transition hover:bg-neutral-100 dark:bg-white/5">
                <div className="text-[12px] font-semibold leading-snug text-ink dark:text-ink">{n.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                  <Badge tone="low">{n.region === 'domestic' ? 'Domestik' : 'Internasional'}</Badge>
                  {n.source && <span>{n.source}</span>}
                  {n.pubDate && <span>· {ago(n.pubDate)}</span>}
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Data harga disediakan melalui Yahoo Finance dan bersifat tertunda serta indikatif.
        Panaceamed tidak memberikan nasihat investasi, tidak merekomendasikan pembelian maupun
        penjualan efek, dan bukan perusahaan efek berizin.
      </div>
    </div>
  )
}

export default Markets
