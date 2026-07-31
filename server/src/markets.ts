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

export interface MarketInstrument { symbol: string; label: string; group: InstrumentGroup }
export type InstrumentGroup = 'indeks' | 'saham-id' | 'saham-us' | 'kripto' | 'valas' | 'komoditas'

/**
 * A starter watchlist spanning the asset classes an Indonesian user is most
 * likely to care about. Users can query any Yahoo-supported symbol beyond this.
 */
export const INSTRUMENTS: MarketInstrument[] = [
  { symbol: '^JKSE', label: 'IHSG (Jakarta Composite)', group: 'indeks' },
  { symbol: '^GSPC', label: 'S&P 500', group: 'indeks' },
  { symbol: '^IXIC', label: 'NASDAQ Composite', group: 'indeks' },
  { symbol: '^N225', label: 'Nikkei 225', group: 'indeks' },
  { symbol: 'BBCA.JK', label: 'Bank Central Asia', group: 'saham-id' },
  { symbol: 'BBRI.JK', label: 'Bank Rakyat Indonesia', group: 'saham-id' },
  { symbol: 'TLKM.JK', label: 'Telkom Indonesia', group: 'saham-id' },
  { symbol: 'ASII.JK', label: 'Astra International', group: 'saham-id' },
  { symbol: 'AAPL', label: 'Apple', group: 'saham-us' },
  { symbol: 'MSFT', label: 'Microsoft', group: 'saham-us' },
  { symbol: 'NVDA', label: 'NVIDIA', group: 'saham-us' },
  { symbol: 'BTC-USD', label: 'Bitcoin', group: 'kripto' },
  { symbol: 'ETH-USD', label: 'Ethereum', group: 'kripto' },
  { symbol: 'USDIDR=X', label: 'USD / IDR', group: 'valas' },
  { symbol: 'EURIDR=X', label: 'EUR / IDR', group: 'valas' },
  { symbol: 'GC=F', label: 'Emas (Gold futures)', group: 'komoditas' },
  { symbol: 'CL=F', label: 'Minyak WTI', group: 'komoditas' },
]

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
