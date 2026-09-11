import { fetchLeagueScoreboard, UNAVAILABLE } from '../src/sports'

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
const originalApiSportsKey = process.env.APISPORTS_KEY

try {
  {
    let requestedUrl = ''
    globalThis.fetch = (async (input) => {
      requestedUrl = String(input)
      return jsonResponse({
        events: [
          {
            id: 'qa-epl-1',
            date: '2026-09-09T19:00:00Z',
            competitions: [{
              status: { type: { state: 'in', shortDetail: "62'" } },
              competitors: [
                { homeAway: 'home', score: '2', team: { displayName: 'Home QA', abbreviation: 'HQA', logo: 'https://img.test/home.png' } },
                { homeAway: 'away', score: '1', team: { displayName: 'Away QA', abbreviation: 'AQA' } },
              ],
            }],
          },
          { id: 'malformed-no-teams', date: '2026-09-09T20:00:00Z', competitions: [{}] },
        ],
      })
    }) as typeof fetch

    const result = await fetchLeagueScoreboard('epl', '20260909-20260919')
    const url = new URL(requestedUrl)
    ok('ESPN league path benar', url.pathname.endsWith('/soccer/eng.1/scoreboard'), url.pathname)
    ok('rentang tanggal valid diteruskan', url.searchParams.get('dates') === '20260909-20260919', url.search)
    ok('rentang tanggal meminta bounded result limit', url.searchParams.get('limit') === '100', url.search)
    ok('event malformed dibuang', result.events.length === 1, JSON.stringify(result.events))
    const event = result.events[0]
    ok('home/away identity dipertahankan', event?.home.name === 'Home QA' && event.away.name === 'Away QA', JSON.stringify(event))
    ok('live state dinormalisasi', event?.state === 'in' && event.statusDetail === "62'", JSON.stringify(event))
    ok('score dan logo dipertahankan', event?.home.score === '2' && event.away.score === '1' && event.home.logo?.includes('home.png') === true)
  }

  {
    let requestedUrl = ''
    globalThis.fetch = (async (input) => {
      requestedUrl = String(input)
      return jsonResponse({ events: [] })
    }) as typeof fetch
    await fetchLeagueScoreboard('laliga', '20260909&limit=9999')
    const url = new URL(requestedUrl)
    ok('rentang tanggal invalid tidak diteruskan', !url.searchParams.has('dates') && !url.searchParams.has('limit'), url.search)
  }

  {
    globalThis.fetch = (async () => jsonResponse({
      events: [{
        id: 'ufc-card-qa',
        date: '2026-09-10T02:00:00Z',
        name: 'UFC QA',
        status: { type: { state: 'post', shortDetail: 'Final' } },
        competitions: [
          { competitors: [
            { order: 1, winner: true, athlete: { displayName: 'Fighter One' } },
            { order: 2, winner: false, athlete: { displayName: 'Fighter Two' } },
          ] },
          { competitors: [
            { order: 1, winner: false, athlete: { displayName: 'Fighter Three' } },
            { order: 2, winner: true, athlete: { displayName: 'Fighter Four' } },
          ] },
        ],
      }],
    })) as typeof fetch

    const result = await fetchLeagueScoreboard('ufc')
    ok('UFC card mengekspansi seluruh bout', result.events.length === 2, JSON.stringify(result.events))
    ok('UFC bout id stabil per competition', result.events.map((e) => e.id).join(',') === 'ufc-card-qa-0,ufc-card-qa-1')
    ok('UFC hasil W/L hanya pada event post', result.events[0]?.home.score === 'W' && result.events[0]?.away.score === 'L')
  }

  {
    globalThis.fetch = (async (input) => {
      const url = String(input)
      if (url.includes('/tennis/atp/')) {
        return jsonResponse({ events: [
          {
            id: 'atp-wim', name: 'Wimbledon', date: '2026-07-01T12:00:00Z',
            competitions: [{ competitors: [
              { order: 1, score: '2', athlete: { displayName: 'ATP A' } },
              { order: 2, score: '1', athlete: { displayName: 'ATP B' } },
            ] }],
          },
          {
            id: 'atp-ordinary', name: 'Generic Open 250', date: '2026-07-02T12:00:00Z',
            competitions: [{ competitors: [
              { order: 1, athlete: { displayName: 'Hidden A' } },
              { order: 2, athlete: { displayName: 'Hidden B' } },
            ] }],
          },
        ] })
      }
      return jsonResponse({ events: [{
        id: 'wta-us', name: 'US Open', date: '2026-08-30T12:00:00Z',
        competitions: [{ competitors: [
          { order: 1, athlete: { displayName: 'WTA A' } },
          { order: 2, athlete: { displayName: 'WTA B' } },
        ] }],
      }] })
    }) as typeof fetch

    const result = await fetchLeagueScoreboard('grandslam')
    ok('Grand Slam menggabungkan ATP dan WTA major', result.events.length === 2, JSON.stringify(result.events))
    ok('turnamen non-major tidak bocor', !result.events.some((e) => e.home.name.includes('Hidden') || e.away.name.includes('Hidden')))
    ok('nama major ikut pada status detail', result.events.some((e) => e.statusDetail.includes('Wimbledon')) && result.events.some((e) => e.statusDetail.includes('US Open')))
  }

  {
    delete process.env.APISPORTS_KEY
    let called = false
    globalThis.fetch = (async () => {
      called = true
      throw new Error('should not call upstream without key')
    }) as typeof fetch
    const result = await fetchLeagueScoreboard('liga1')
    ok('API-Sports tanpa key fail closed', result.error === 'not_configured' && result.events.length === 0, JSON.stringify(result))
    ok('API-Sports tanpa key tidak memanggil upstream', called === false)
  }

  {
    let called = false
    globalThis.fetch = (async () => {
      called = true
      return jsonResponse({})
    }) as typeof fetch
    const unknown = await fetchLeagueScoreboard('definitely-not-a-league')
    ok('unknown league eksplisit', unknown.error === 'unknown_league' && unknown.events.length === 0, JSON.stringify(unknown))
    ok('unknown league tidak memanggil upstream', called === false)
    ok('padel tetap explicit unavailable', UNAVAILABLE.some((x) => x.leagueId === 'padel' && x.unavailable === true))
  }

  {
    globalThis.fetch = (async () => jsonResponse({ error: 'temporary' }, 503)) as typeof fetch
    const result = await fetchLeagueScoreboard('bundesliga')
    ok('HTTP upstream failure menjadi explicit error', result.error === 'upstream_503' && result.events.length === 0, JSON.stringify(result))
  }
} finally {
  globalThis.fetch = originalFetch
  if (originalApiSportsKey == null) delete process.env.APISPORTS_KEY
  else process.env.APISPORTS_KEY = originalApiSportsKey
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
