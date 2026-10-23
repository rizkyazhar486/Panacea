// Free, no-API-key market data proxy.
//
// Source: Yahoo Finance's public chart endpoint
// (query1.finance.yahoo.com/v8/finance/chart/{symbol}). Undocumented but
// long-stable and very widely used; no key, no registration. It returns the
// quote metadata and the OHLC series in one call, so a single request feeds
// both the price header and the chart.
//
// Two honesty constraints that the UI repeats to the user:
//
//   1. This data is INDICATIVE AND DELAYED. Free feeds lag the exchange —
//      commonly by around 15 minutes on many venues — and can gap or briefly
//      return stale values. It is fine for following a position or learning;
//      it is NOT suitable for trading decisions that depend on the current
//      price, and the page says so rather than implying live tick data.
//
//   2. Nothing here recommends buying or selling. This module returns prices,
//      series and headlines only. Issuing buy/sell calls on someone's savings
//      is regulated advice and is deliberately out of scope.
//
// IMPORTANT: like sports.ts, this could not be live-tested from the dev sandbox
// — outbound network to arbitrary domains is blocked there. The response shape
// below follows Yahoo's well-known public structure, and every parse failure
// logs a diagnostic line so the first real deploy can be checked against actual
// responses rather than guessed at.

export interface Candle { t: number; c: number; o?: number; h?: number; l?: number; v?: number }

export interface Quote {
  symbol: string
  name: string
  currency: string
  price: number | null
  previousClose: number | null
  change: number | null
  changePct: number | null
  marketTime: string | null
  exchange: string | null
  series: Candle[]
  /** Always true for this source — surfaced so the UI cannot forget to say it. */
  delayed: true
  source: 'Yahoo Finance'
}

export interface MarketInstrument {
  symbol: string
  label: string
  group: InstrumentGroup
  /** Shown under "Semua", which can only carry a limited number of symbols. */
  unggulan?: boolean
}
export type InstrumentGroup = 'indeks' | 'saham-id' | 'saham-us' | 'kripto' | 'valas' | 'komoditas'

/**
 * The built-in watchlist. Every group is filled out to what a user would
 * reasonably expect to find without searching — an earlier version carried only
 * Bitcoin and Ethereum under "Kripto" and only two pairs under "Valas", which
 * read as the feature being broken rather than as a deliberately short list.
 *
 * `WATCHLIST_MAX` caps how many symbols one request may fetch, so each group is
 * kept at or under that. Anything outside this list is still reachable through
 * `searchSymbols()` — this is a starting point, not the boundary of the app.
 */
export const INSTRUMENTS: MarketInstrument[] = [
  // Indeks
  { symbol: '^JKSE', label: 'IHSG (Jakarta Composite)', group: 'indeks', unggulan: true },
  { symbol: '^GSPC', label: 'S&P 500', group: 'indeks', unggulan: true },
  { symbol: '^IXIC', label: 'NASDAQ Composite', group: 'indeks' },
  { symbol: '^DJI', label: 'Dow Jones', group: 'indeks' },
  { symbol: '^N225', label: 'Nikkei 225', group: 'indeks' },
  { symbol: '^HSI', label: 'Hang Seng', group: 'indeks' },
  { symbol: '^STI', label: 'Straits Times (Singapura)', group: 'indeks' },
  { symbol: '^KLSE', label: 'FTSE Bursa Malaysia KLCI', group: 'indeks' },
  { symbol: '^SET.BK', label: 'SET (Thailand)', group: 'indeks' },
  { symbol: '^FTSE', label: 'FTSE 100 (London)', group: 'indeks' },
  { symbol: '^GDAXI', label: 'DAX (Jerman)', group: 'indeks' },
  { symbol: '^KS11', label: 'KOSPI (Korea)', group: 'indeks' },

  // Saham Indonesia
  { symbol: 'BBCA.JK', label: 'Bank Central Asia', group: 'saham-id', unggulan: true },
  { symbol: 'BBRI.JK', label: 'Bank Rakyat Indonesia', group: 'saham-id' },
  { symbol: 'BMRI.JK', label: 'Bank Mandiri', group: 'saham-id' },
  { symbol: 'BBNI.JK', label: 'Bank Negara Indonesia', group: 'saham-id' },
  { symbol: 'TLKM.JK', label: 'Telkom Indonesia', group: 'saham-id' },
  { symbol: 'ASII.JK', label: 'Astra International', group: 'saham-id' },
  { symbol: 'UNVR.JK', label: 'Unilever Indonesia', group: 'saham-id' },
  { symbol: 'ICBP.JK', label: 'Indofood CBP', group: 'saham-id' },
  { symbol: 'INDF.JK', label: 'Indofood Sukses Makmur', group: 'saham-id' },
  { symbol: 'KLBF.JK', label: 'Kalbe Farma', group: 'saham-id' },
  { symbol: 'ANTM.JK', label: 'Aneka Tambang', group: 'saham-id' },
  { symbol: 'ADRO.JK', label: 'Adaro Energy', group: 'saham-id' },
  { symbol: 'AMRT.JK', label: 'Sumber Alfaria (Alfamart)', group: 'saham-id' },
  { symbol: 'GOTO.JK', label: 'GoTo Gojek Tokopedia', group: 'saham-id' },

  // Saham AS
  { symbol: 'AAPL', label: 'Apple', group: 'saham-us', unggulan: true },
  { symbol: 'MSFT', label: 'Microsoft', group: 'saham-us' },
  { symbol: 'NVDA', label: 'NVIDIA', group: 'saham-us', unggulan: true },
  { symbol: 'GOOGL', label: 'Alphabet (Google)', group: 'saham-us' },
  { symbol: 'AMZN', label: 'Amazon', group: 'saham-us' },
  { symbol: 'META', label: 'Meta Platforms', group: 'saham-us' },
  { symbol: 'TSLA', label: 'Tesla', group: 'saham-us' },
  { symbol: 'AMD', label: 'AMD', group: 'saham-us' },
  { symbol: 'NFLX', label: 'Netflix', group: 'saham-us' },
  { symbol: 'JNJ', label: 'Johnson & Johnson', group: 'saham-us' },

  // Kripto
  { symbol: 'BTC-USD', label: 'Bitcoin', group: 'kripto', unggulan: true },
  { symbol: 'ETH-USD', label: 'Ethereum', group: 'kripto', unggulan: true },
  { symbol: 'SOL-USD', label: 'Solana', group: 'kripto', unggulan: true },
  { symbol: 'XRP-USD', label: 'XRP (Ripple)', group: 'kripto', unggulan: true },
  { symbol: 'BNB-USD', label: 'BNB', group: 'kripto' },
  { symbol: 'ADA-USD', label: 'Cardano', group: 'kripto' },
  { symbol: 'DOGE-USD', label: 'Dogecoin', group: 'kripto' },
  { symbol: 'TRX-USD', label: 'TRON', group: 'kripto' },
  { symbol: 'AVAX-USD', label: 'Avalanche', group: 'kripto' },
  { symbol: 'DOT-USD', label: 'Polkadot', group: 'kripto' },
  { symbol: 'LINK-USD', label: 'Chainlink', group: 'kripto' },
  { symbol: 'LTC-USD', label: 'Litecoin', group: 'kripto' },
  { symbol: 'BCH-USD', label: 'Bitcoin Cash', group: 'kripto' },
  { symbol: 'XLM-USD', label: 'Stellar', group: 'kripto' },
  { symbol: 'SHIB-USD', label: 'Shiba Inu', group: 'kripto' },
  { symbol: 'USDT-USD', label: 'Tether', group: 'kripto' },

  // Valas — quoted against the rupiah, which is the number that actually
  // matters here. The two majors at the end are for reading global headlines.
  { symbol: 'USDIDR=X', label: 'Dolar AS / Rupiah', group: 'valas', unggulan: true },
  { symbol: 'EURIDR=X', label: 'Euro / Rupiah', group: 'valas' },
  { symbol: 'JPYIDR=X', label: 'Yen Jepang / Rupiah', group: 'valas', unggulan: true },
  { symbol: 'GBPIDR=X', label: 'Pound Sterling / Rupiah', group: 'valas', unggulan: true },
  { symbol: 'MYRIDR=X', label: 'Ringgit Malaysia / Rupiah', group: 'valas', unggulan: true },
  { symbol: 'THBIDR=X', label: 'Baht Thailand / Rupiah', group: 'valas', unggulan: true },
  { symbol: 'SGDIDR=X', label: 'Dolar Singapura / Rupiah', group: 'valas' },
  { symbol: 'AUDIDR=X', label: 'Dolar Australia / Rupiah', group: 'valas' },
  { symbol: 'CNYIDR=X', label: 'Yuan Tiongkok / Rupiah', group: 'valas' },
  { symbol: 'HKDIDR=X', label: 'Dolar Hong Kong / Rupiah', group: 'valas' },
  { symbol: 'KRWIDR=X', label: 'Won Korea / Rupiah', group: 'valas' },
  { symbol: 'SARIDR=X', label: 'Riyal Saudi / Rupiah', group: 'valas' },
  { symbol: 'CHFIDR=X', label: 'Franc Swiss / Rupiah', group: 'valas' },
  { symbol: 'EURUSD=X', label: 'Euro / Dolar AS', group: 'valas' },
  { symbol: 'USDJPY=X', label: 'Dolar AS / Yen', group: 'valas' },

  // Komoditas
  { symbol: 'GC=F', label: 'Emas', group: 'komoditas', unggulan: true },
  { symbol: 'SI=F', label: 'Perak', group: 'komoditas' },
  { symbol: 'PL=F', label: 'Platinum', group: 'komoditas' },
  { symbol: 'HG=F', label: 'Tembaga', group: 'komoditas' },
  { symbol: 'CL=F', label: 'Minyak WTI', group: 'komoditas', unggulan: true },
  { symbol: 'BZ=F', label: 'Minyak Brent', group: 'komoditas' },
  { symbol: 'NG=F', label: 'Gas Alam', group: 'komoditas' },
  { symbol: 'ZW=F', label: 'Gandum', group: 'komoditas' },
  { symbol: 'ZC=F', label: 'Jagung', group: 'komoditas' },
  { symbol: 'ZS=F', label: 'Kedelai', group: 'komoditas' },
  { symbol: 'KC=F', label: 'Kopi', group: 'komoditas' },
  { symbol: 'SB=F', label: 'Gula', group: 'komoditas' },
  { symbol: 'CC=F', label: 'Kakao', group: 'komoditas' },
]

/** Most symbols one watchlist request may carry. */
export const WATCHLIST_MAX = 20

/** The "Semua" tab cannot show everything, so it shows a spread across groups. */
export const UNGGULAN = INSTRUMENTS.filter((i) => i.unggulan).map((i) => i.symbol)

export const RANGES = ['1d', '5d', '1mo', '6mo', '1y', '5y'] as const
export type Range = (typeof RANGES)[number]

const INTERVAL_FOR: Record<Range, string> = {
  '1d': '5m', '5d': '30m', '1mo': '1d', '6mo': '1d', '1y': '1d', '5y': '1wk',
}

// Symbols are user-supplied, so constrain them before building a URL. Yahoo
// tickers use letters, digits and a small set of punctuation (^ . - = ).
const SYMBOL_RE = /^[A-Za-z0-9.^=-]{1,20}$/
export function isValidSymbol(s: string): boolean {
  return SYMBOL_RE.test(s)
}

// Cache per symbol+range. Short TTL keeps it fresh without hammering a free
// source that would otherwise rate-limit us and break for everyone.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { at: number; quote: Quote }>()

interface YahooChart {
  chart?: {
    result?: {
      meta?: {
        currency?: string
        symbol?: string
        longName?: string
        shortName?: string
        regularMarketPrice?: number
        previousClose?: number
        chartPreviousClose?: number
        regularMarketTime?: number
        fullExchangeName?: string
        exchangeName?: string
      }
      timestamp?: number[]
      indicators?: { quote?: { close?: (number | null)[]; open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; volume?: (number | null)[] }[] }
    }[]
    error?: { description?: string } | null
  }
}

export async function fetchQuote(symbol: string, range: Range = '1mo'): Promise<Quote> {
  const key = `${symbol}|${range}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.quote

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
    + `?range=${range}&interval=${INTERVAL_FOR[range]}`

  const r = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; PanaceamedMarkets/1.0)' },
    signal: AbortSignal.timeout(9000),
  })
  if (!r.ok) throw new Error(`market source ${r.status}`)

  const body = (await r.json()) as YahooChart
  const res = body?.chart?.result?.[0]
  if (!res?.meta) {
    console.log(`[markets] unexpected shape for ${symbol}: ${JSON.stringify(body).slice(0, 300)}`)
    throw new Error('unexpected_response_shape')
  }

  const m = res.meta
  const q = res.indicators?.quote?.[0]
  const ts = res.timestamp ?? []
  const closes = q?.close ?? []

  const series: Candle[] = []
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i]
    // Yahoo emits nulls for gaps (halts, pre-market). Skip rather than plot 0,
    // which would draw a spike straight to the axis and read as a crash.
    if (typeof c !== 'number' || !Number.isFinite(c)) continue
    series.push({
      t: ts[i] * 1000, c,
      o: q?.open?.[i] ?? undefined, h: q?.high?.[i] ?? undefined,
      l: q?.low?.[i] ?? undefined, v: q?.volume?.[i] ?? undefined,
    })
  }

  const price = typeof m.regularMarketPrice === 'number' ? m.regularMarketPrice
    : series.length ? series[series.length - 1].c : null
  const prev = typeof m.previousClose === 'number' ? m.previousClose
    : typeof m.chartPreviousClose === 'number' ? m.chartPreviousClose : null
  const change = price != null && prev != null ? price - prev : null

  const quote: Quote = {
    symbol: m.symbol ?? symbol,
    name: m.longName ?? m.shortName ?? symbol,
    currency: m.currency ?? '',
    price, previousClose: prev, change,
    changePct: change != null && prev ? (change / prev) * 100 : null,
    marketTime: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
    exchange: m.fullExchangeName ?? m.exchangeName ?? null,
    series,
    delayed: true,
    source: 'Yahoo Finance',
  }

  cache.set(key, { at: Date.now(), quote })
  return quote
}

export interface SymbolHit {
  symbol: string
  name: string
  exchange: string | null
  type: string | null
}

// Yahoo's public symbol lookup. Separate cache from quotes: a name-to-symbol
// mapping barely changes, so it can be held far longer than a price.
const SEARCH_TTL_MS = 6 * 3600_000
const searchCache = new Map<string, { at: number; hits: SymbolHit[] }>()

/** Human-readable asset classes, so the UI can label a hit without guessing. */
const TYPE_LABEL: Record<string, string> = {
  EQUITY: 'Saham', CRYPTOCURRENCY: 'Kripto', CURRENCY: 'Valas',
  INDEX: 'Indeks', FUTURE: 'Komoditas', ETF: 'ETF', MUTUALFUND: 'Reksa dana',
}

/**
 * Look a name up and get back tradable symbols.
 *
 * This exists because the search box used to filter only the symbols already
 * loaded on screen. Typing "Solana" searched a list that never contained
 * Solana and returned nothing, which looks identical to "the app is broken" —
 * while the placeholder text invited exactly that kind of query.
 */
export async function searchSymbols(query: string): Promise<SymbolHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const key = q.toLowerCase()
  const hit = searchCache.get(key)
  if (hit && Date.now() - hit.at < SEARCH_TTL_MS) return hit.hits

  const url = `https://query1.finance.yahoo.com/v1/finance/search`
    + `?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&listsCount=0`
  const r = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; PanaceamedMarkets/1.0)' },
    signal: AbortSignal.timeout(9000),
  })
  if (!r.ok) throw new Error(`market search ${r.status}`)

  const body = (await r.json()) as {
    quotes?: { symbol?: string; shortname?: string; longname?: string; exchDisp?: string; quoteType?: string }[]
  }
  const hits: SymbolHit[] = []
  for (const it of body?.quotes ?? []) {
    const symbol = it?.symbol
    // Drop anything the quote endpoint could not fetch anyway, rather than
    // offering a result that errors the moment it is tapped.
    if (!symbol || !isValidSymbol(symbol)) continue
    hits.push({
      symbol,
      name: it.longname || it.shortname || symbol,
      exchange: it.exchDisp ?? null,
      type: it.quoteType ? TYPE_LABEL[it.quoteType] ?? it.quoteType : null,
    })
  }
  searchCache.set(key, { at: Date.now(), hits })
  return hits
}

/** Several symbols at once for the watchlist, failures isolated per symbol. */
export async function fetchQuotes(symbols: string[], range: Range = '1mo'): Promise<{ quotes: Quote[]; failed: string[] }> {
  const settled = await Promise.allSettled(symbols.map((s) => fetchQuote(s, range)))
  const quotes: Quote[] = []
  const failed: string[] = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') quotes.push(r.value)
    else { failed.push(symbols[i]); console.log(`[markets] ${symbols[i]} failed: ${(r.reason as Error)?.message}`) }
  })
  return { quotes, failed }
}
