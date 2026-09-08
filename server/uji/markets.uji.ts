import { fetchQuote, fetchQuotes, isValidSymbol, searchSymbols } from '../src/markets'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const originalFetch = globalThis.fetch

try {
  {
    let requestedUrl = ''
    let signal: AbortSignal | null = null
    let userAgent = ''
    globalThis.fetch = (async (input, init) => {
      requestedUrl = String(input)
      signal = init?.signal ?? null
      const headers = new Headers(init?.headers)
      userAgent = headers.get('user-agent') ?? ''
      return jsonResponse({
        chart: {
          result: [{
            meta: {
              symbol: 'MKTQA1',
              longName: 'Panacea Market QA',
              currency: 'USD',
              previousClose: 100,
              regularMarketTime: 1_700_000_000,
              fullExchangeName: 'QA Exchange',
            },
            timestamp: [100, 200, 300],
            indicators: {
              quote: [{
                close: [101, null, 103],
                open: [100, null, 102],
                high: [102, null, 104],
                low: [99, null, 101],
                volume: [10, null, 30],
              }],
            },
          }],
          error: null,
        },
      })
    }) as typeof fetch

    const quote = await fetchQuote('MKTQA1', '1d')
    const url = new URL(requestedUrl)
    ok('quote memakai endpoint chart Yahoo', url.pathname.endsWith('/MKTQA1'), url.pathname)
    ok('range quote dipertahankan', url.searchParams.get('range') === '1d', url.search)
    ok('interval 1d dipetakan ke 5m', url.searchParams.get('interval') === '5m', url.search)
    ok('request quote membawa timeout signal', signal instanceof AbortSignal && !signal.aborted)
    ok('request quote membawa user-agent Panacea', /PanaceamedMarkets/.test(userAgent), userAgent)
    ok('quote selalu menandai data delayed', quote.delayed === true)
    ok('quote mempertahankan source', quote.source === 'Yahoo Finance', quote.source)
    ok('null candle dibuang, bukan diplot sebagai nol', quote.series.length === 2, String(quote.series.length))
    ok('timestamp candle dikonversi ke milidetik', quote.series[0]?.t === 100_000, String(quote.series[0]?.t))
    ok('harga fallback memakai close terakhir saat regularMarketPrice tak ada', quote.price === 103, String(quote.price))
    ok('perubahan harga dihitung dari previous close', quote.change === 3, String(quote.change))
    ok('exchange dipertahankan', quote.exchange === 'QA Exchange', String(quote.exchange))
  }

  {
    let requestedUrl = ''
    globalThis.fetch = (async (input) => {
      requestedUrl = String(input)
      return jsonResponse({
        quotes: [
          { symbol: 'SOL-USD', longname: 'Solana USD', exchDisp: 'CCC', quoteType: 'CRYPTOCURRENCY' },
          { symbol: 'BAD SYMBOL', longname: 'Malformed', exchDisp: 'Nowhere', quoteType: 'EQUITY' },
          { symbol: 'AAPL', shortname: 'Apple', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
        ],
      })
    }) as typeof fetch

    const hits = await searchSymbols('  Solana  ')
    const url = new URL(requestedUrl)
    ok('search query dinormalisasi sebelum upstream', url.searchParams.get('q') === 'Solana', url.search)
    ok('market search tidak meminta news payload', url.searchParams.get('newsCount') === '0', url.search)
    ok('symbol malformed dibuang dari hasil search', hits.length === 2 && !hits.some((h) => h.symbol === 'BAD SYMBOL'), JSON.stringify(hits))
    ok('crypto quote type dipetakan ke label UI', hits.find((h) => h.symbol === 'SOL-USD')?.type === 'Kripto')
    ok('equity quote type dipetakan ke label UI', hits.find((h) => h.symbol === 'AAPL')?.type === 'Saham')
  }

  {
    globalThis.fetch = (async (input) => {
      const url = String(input)
      if (url.includes('/MKTFAIL1?')) return jsonResponse({ error: 'temporary' }, 503)
      const symbol = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'MKTOK1')
      return jsonResponse({
        chart: {
          result: [{
            meta: { symbol, regularMarketPrice: 42, previousClose: 40, currency: 'USD' },
            timestamp: [100],
            indicators: { quote: [{ close: [42] }] },
          }],
          error: null,
        },
      })
    }) as typeof fetch

    const result = await fetchQuotes(['MKTOK1', 'MKTFAIL1'], '5d')
    ok('watchlist mempertahankan symbol yang berhasil', result.quotes.length === 1 && result.quotes[0]?.symbol === 'MKTOK1', JSON.stringify(result))
    ok('watchlist mengisolasi symbol yang gagal', result.failed.length === 1 && result.failed[0] === 'MKTFAIL1', JSON.stringify(result.failed))
  }

  ok('validator menerima ticker yang didukung', isValidSymbol('BBCA.JK') && isValidSymbol('BTC-USD') && isValidSymbol('USDIDR=X'))
  ok('validator menolak whitespace/path injection', !isValidSymbol('BAD SYMBOL') && !isValidSymbol('../etc/passwd'))
} finally {
  globalThis.fetch = originalFetch
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
