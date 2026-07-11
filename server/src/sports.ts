// Free, no-API-key sports score proxy. Sources:
//  - Football (all leagues) + NBA + NFL + UFC/MMA: ESPN's public "site API" —
//    undocumented but extremely widely used by the community, stable for
//    years. No key. UFC uses the same host under sport=mma, slug=ufc.
//  - F1: Jolpica-F1 (api.jolpi.ca), the actively-maintained Ergast-compatible
//    successor after Ergast's own API shut down in 2024. No key.
//
// Coverage gap, stated honestly rather than faked: Indonesian Liga 1/2, tennis,
// and padel have no reliable free-tier API — callers get an explicit
// `unavailable: true` response for those instead of fabricated data.
//
// IMPORTANT: this file could not be live-tested from the dev sandbox (outbound
// network to arbitrary domains is blocked there, same restriction that also
// blocked testing the Render backend directly). The JSON shapes below are
// modeled on ESPN's/Jolpica's well-documented public structure, but the first
// real deploy should be checked against actual responses — see the console.log
// diagnostics on parse failure, same pattern used for the health webhook.

export interface NormalizedEvent {
  id: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  statusDetail: string
  home: { name: string; abbrev: string; logo?: string; score?: string }
  away: { name: string; abbrev: string; logo?: string; score?: string }
}

export interface LeagueResult {
  leagueId: string
  label: string
  events: NormalizedEvent[]
  error?: string
}

export interface UnavailableResult {
  leagueId: string
  label: string
  unavailable: true
  reason: string
}

export type LeagueSport = 'soccer' | 'basketball' | 'football' | 'mma' | 'baseball' | 'hockey' | 'rugby' | 'tennis'

export interface LeagueConfig {
  id: string
  label: string
  sport: LeagueSport
  slug: string // ESPN league slug (source 'espn'); ignored for other sources
  source?: 'espn' | 'tsdb' | 'apisports' // default 'espn'
  // For source 'tsdb' (TheSportsDB) — the league is resolved by name+country
  // via the free API, since hardcoding a numeric idLeague is fragile.
  tsdbName?: string
  tsdbCountry?: string
  tsdbSport?: string // TheSportsDB sport name, e.g. 'Soccer', 'Cricket'
  // For source 'apisports' (API-Football, free tier, needs APISPORTS_KEY env) —
  // resolved by name+country at runtime, same reasoning as tsdb.
  apisportsName?: string
  apisportsCountry?: string
}

export const LEAGUES: LeagueConfig[] = [
  { id: 'epl', label: 'Premier League', sport: 'soccer', slug: 'eng.1' },
  { id: 'laliga', label: 'La Liga', sport: 'soccer', slug: 'esp.1' },
  { id: 'seriea', label: 'Serie A', sport: 'soccer', slug: 'ita.1' },
  { id: 'bundesliga', label: 'Bundesliga', sport: 'soccer', slug: 'ger.1' },
  { id: 'ligue1', label: 'Ligue 1', sport: 'soccer', slug: 'fra.1' },
  { id: 'eredivisie', label: 'Eredivisie', sport: 'soccer', slug: 'ned.1' },
  // Next 10 highest-ranked football leagues — all on ESPN's free no-key API.
  { id: 'primeira', label: 'Primeira Liga', sport: 'soccer', slug: 'por.1' },
  { id: 'belpro', label: 'Belgian Pro League', sport: 'soccer', slug: 'bel.1' },
  { id: 'superlig', label: 'Süper Lig', sport: 'soccer', slug: 'tur.1' },
  { id: 'scottish', label: 'Scottish Premiership', sport: 'soccer', slug: 'sco.1' },
  { id: 'ligamx', label: 'Liga MX', sport: 'soccer', slug: 'mex.1' },
  { id: 'brasileirao', label: 'Brasileirão', sport: 'soccer', slug: 'bra.1' },
  { id: 'saudi', label: 'Saudi Pro League', sport: 'soccer', slug: 'ksa.1' },
  { id: 'mls', label: 'MLS', sport: 'soccer', slug: 'usa.1' },
  { id: 'argentina', label: 'Liga Argentina', sport: 'soccer', slug: 'arg.1' },
  { id: 'championship', label: 'Championship (ENG)', sport: 'soccer', slug: 'eng.2' },
  { id: 'ucl', label: 'Champions League', sport: 'soccer', slug: 'uefa.champions' },
  { id: 'worldcup', label: 'World Cup', sport: 'soccer', slug: 'fifa.world' },
  { id: 'nba', label: 'NBA', sport: 'basketball', slug: 'nba' },
  { id: 'nfl', label: 'NFL', sport: 'football', slug: 'nfl' },
  { id: 'mlb', label: 'MLB', sport: 'baseball', slug: 'mlb' },
  { id: 'nhl', label: 'NHL', sport: 'hockey', slug: 'nhl' },
  { id: 'ufc', label: 'UFC', sport: 'mma', slug: 'ufc' },
  { id: 'urc', label: 'URC (Rugby)', sport: 'rugby', slug: '270557' },
  { id: 'atp', label: 'ATP Tour', sport: 'tennis', slug: 'atp' },
  { id: 'wta', label: 'WTA Tour', sport: 'tennis', slug: 'wta' },
  // TheSportsDB (free, no per-user key) for leagues ESPN doesn't serve well.
  { id: 'liga1', label: 'Liga 1 Indonesia', sport: 'soccer', slug: '', source: 'tsdb', tsdbName: 'Indonesian Liga 1', tsdbCountry: 'Indonesia', tsdbSport: 'Soccer' },
  { id: 'ipl', label: 'IPL (Cricket)', sport: 'soccer', slug: '', source: 'tsdb', tsdbName: 'Indian Premier League', tsdbCountry: 'India', tsdbSport: 'Cricket' },
  // API-Football (free tier, needs APISPORTS_KEY) for lower divisions ESPN/TSDB
  // don't cover reliably.
  { id: 'liga2', label: 'Liga 2 Indonesia', sport: 'soccer', slug: '', source: 'apisports', apisportsName: 'Liga 2', apisportsCountry: 'Indonesia' },
]

// Leagues explicitly NOT covered — shown honestly in the UI instead of faked.
export const UNAVAILABLE: UnavailableResult[] = [
  { leagueId: 'padel', label: 'Padel', unavailable: true, reason: 'No free padel score API exists — API-Sports has no padel product, and every padel source needs a paid/trial key.' },
]

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports'

// Small in-memory cache so many concurrent clients don't each hammer ESPN —
// scores don't change fast enough to justify sub-30s freshness anyway.
const cache = new Map<string, { at: number; data: LeagueResult }>()
const CACHE_MS = 30_000

interface EspnCompetitor { homeAway?: string; score?: string; team?: { displayName?: string; abbreviation?: string; logo?: string } }
interface EspnCompetition { competitors?: EspnCompetitor[]; status?: { type?: { state?: string; detail?: string; shortDetail?: string } } }
interface EspnEvent { id?: string; date?: string; status?: { type?: { state?: string; detail?: string; shortDetail?: string } }; competitions?: EspnCompetition[] }
interface EspnResponse { events?: EspnEvent[] }

function normalizeEspnEvent(ev: EspnEvent): NormalizedEvent | null {
  const comp = ev.competitions?.[0]
  const home = comp?.competitors?.find((c) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c) => c.homeAway === 'away')
  if (!home?.team || !away?.team || !ev.id) return null
  const status = comp?.status?.type ?? ev.status?.type
  const state = (status?.state as NormalizedEvent['state']) ?? 'pre'
  return {
    id: ev.id,
    startTime: ev.date ?? '',
    state: state === 'in' || state === 'post' ? state : 'pre',
    statusDetail: status?.shortDetail ?? status?.detail ?? '',
    home: { name: home.team.displayName ?? '?', abbrev: home.team.abbreviation ?? '', logo: home.team.logo, score: home.score },
    away: { name: away.team.displayName ?? '?', abbrev: away.team.abbreviation ?? '', logo: away.team.logo, score: away.score },
  }
}

// Player-vs-player events (MMA/UFC bouts and tennis singles) have no home/away
// teams — each "competitor" is an athlete (order 1/2 or array index 0/1), not a
// `team`. Normalized into the same NormalizedEvent shape (player 1 -> home slot,
// player 2 -> away slot). Score: the live set/games score when the source
// provides one (tennis), else W/L once decided (MMA), else "-".
interface EspnFighterCompetitor { order?: number; winner?: boolean; score?: string; athlete?: { displayName?: string; shortName?: string; headshot?: { href?: string } } }
interface EspnMmaCompetition { competitors?: EspnFighterCompetitor[]; status?: { type?: { state?: string; detail?: string; shortDetail?: string } } }
interface EspnMmaEvent { id?: string; date?: string; name?: string; status?: { type?: { state?: string; detail?: string; shortDetail?: string } }; competitions?: EspnMmaCompetition[] }
interface EspnMmaResponse { events?: EspnMmaEvent[] }

// A single ESPN MMA/tennis "event" can be a whole card (e.g. UFC 329) whose
// individual bouts live in competitions[] — so expand EVERY competition into
// its own NormalizedEvent instead of only reading the first, otherwise a UFC
// fight night shows just one fight (or none). Also tolerant of competitors
// carrying an `athlete`, a bare display name, or a team-shaped object.
function normalizeMmaEvent(ev: EspnMmaEvent): NormalizedEvent[] {
  if (!ev.competitions || !ev.id) return []
  const out: NormalizedEvent[] = []
  ev.competitions.forEach((comp, idx) => {
    const f1 = comp?.competitors?.find((c) => c.order === 1) ?? comp?.competitors?.[0]
    const f2 = comp?.competitors?.find((c) => c.order === 2) ?? comp?.competitors?.[1]
    const name1 = fighterName(f1)
    const name2 = fighterName(f2)
    if (!name1 || !name2) return
    const status = comp?.status?.type ?? ev.status?.type
    const state = (status?.state as NormalizedEvent['state']) ?? 'pre'
    const resultFor = (c?: EspnFighterCompetitor) => (c?.score != null && c.score !== '' ? String(c.score) : state === 'post' ? (c?.winner ? 'W' : 'L') : undefined)
    out.push({
      id: `${ev.id}-${idx}`,
      startTime: ev.date ?? '',
      state: state === 'in' || state === 'post' ? state : 'pre',
      statusDetail: status?.shortDetail ?? status?.detail ?? ev.name ?? '',
      home: { name: name1, abbrev: '', logo: f1?.athlete?.headshot?.href, score: resultFor(f1) },
      away: { name: name2, abbrev: '', logo: f2?.athlete?.headshot?.href, score: resultFor(f2) },
    })
  })
  return out
}

function fighterName(c?: EspnFighterCompetitor): string | undefined {
  return c?.athlete?.displayName ?? c?.athlete?.shortName
}

export async function fetchLeagueScoreboard(leagueId: string): Promise<LeagueResult> {
  const league = LEAGUES.find((l) => l.id === leagueId)
  if (!league) return { leagueId, label: leagueId, events: [], error: 'unknown_league' }

  const hit = cache.get(leagueId)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

  if (league.source === 'tsdb') return fetchTsdbScoreboard(league)
  if (league.source === 'apisports') return fetchApiSportsScoreboard(league)

  try {
    const url = `${ESPN_BASE}/${league.sport}/${league.slug}/scoreboard`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      console.log(`[sports] ${leagueId} fetch failed: HTTP ${res.status}`)
      return { leagueId, label: league.label, events: [], error: `upstream_${res.status}` }
    }
    let events: NormalizedEvent[]
    if (league.sport === 'mma' || league.sport === 'tennis') {
      const json = (await res.json()) as EspnMmaResponse
      events = (json.events ?? []).flatMap(normalizeMmaEvent)
    } else {
      const json = (await res.json()) as EspnResponse
      events = (json.events ?? []).map(normalizeEspnEvent).filter((e): e is NormalizedEvent => e !== null)
    }
    const result: LeagueResult = { leagueId, label: league.label, events }
    cache.set(leagueId, { at: Date.now(), data: result })
    return result
  } catch (e) {
    console.log(`[sports] ${leagueId} fetch error:`, (e as Error).message)
    return { leagueId, label: league.label, events: [], error: 'fetch_failed' }
  }
}

// --- TheSportsDB (free community sports DB; public test key "3", no signup) ---
// Used for leagues ESPN doesn't serve well (Liga 1 Indonesia soccer, IPL
// cricket). The free tier gives recent results + upcoming fixtures rather than
// live ball-by-ball, so scores here are final/scheduled, not second-by-second.
// League id is resolved by name once and cached, since numeric idLeague values
// are undocumented and fragile to hardcode. Not testable from the sandbox —
// verify the JSON shape on first deploy; every step logs on failure.
const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'
const tsdbLeagueIdCache = new Map<string, string | null>()

interface TsdbLeague { idLeague?: string; strLeague?: string }
interface TsdbEvent { idEvent?: string; strHomeTeam?: string; strAwayTeam?: string; intHomeScore?: string | null; intAwayScore?: string | null; dateEvent?: string; strTime?: string; strStatus?: string }

async function resolveTsdbLeagueId(cfg: LeagueConfig): Promise<string | null> {
  const key = `${cfg.tsdbCountry}|${cfg.tsdbSport}|${cfg.tsdbName}`
  if (tsdbLeagueIdCache.has(key)) return tsdbLeagueIdCache.get(key) ?? null
  try {
    const url = `${TSDB_BASE}/search_all_leagues.php?c=${encodeURIComponent(cfg.tsdbCountry ?? '')}&s=${encodeURIComponent(cfg.tsdbSport ?? '')}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) { console.log(`[sports] tsdb league search failed: HTTP ${res.status}`); return null }
    const json = (await res.json()) as { countries?: TsdbLeague[]; leagues?: TsdbLeague[] }
    const list = json.countries ?? json.leagues ?? []
    const want = (cfg.tsdbName ?? '').toLowerCase()
    const match = list.find((l) => (l.strLeague ?? '').toLowerCase() === want)
      ?? list.find((l) => (l.strLeague ?? '').toLowerCase().includes(want))
    const id = match?.idLeague ?? null
    tsdbLeagueIdCache.set(key, id)
    if (!id) console.log(`[sports] tsdb: league "${cfg.tsdbName}" not found in ${cfg.tsdbCountry}/${cfg.tsdbSport}`)
    return id
  } catch (e) {
    console.log('[sports] tsdb league resolve error:', (e as Error).message)
    return null
  }
}

function normalizeTsdbEvent(ev: TsdbEvent, state: NormalizedEvent['state']): NormalizedEvent | null {
  if (!ev.idEvent || !ev.strHomeTeam || !ev.strAwayTeam) return null
  const startTime = ev.dateEvent ? `${ev.dateEvent}T${ev.strTime && /^\d{2}:\d{2}/.test(ev.strTime) ? ev.strTime.slice(0, 8).padEnd(8, ':00') : '00:00:00'}Z` : ''
  const homeScore = ev.intHomeScore != null && ev.intHomeScore !== '' ? String(ev.intHomeScore) : undefined
  const awayScore = ev.intAwayScore != null && ev.intAwayScore !== '' ? String(ev.intAwayScore) : undefined
  return {
    id: ev.idEvent,
    startTime,
    state,
    statusDetail: ev.strStatus ?? (state === 'post' ? 'FT' : ''),
    home: { name: ev.strHomeTeam, abbrev: '', score: homeScore },
    away: { name: ev.strAwayTeam, abbrev: '', score: awayScore },
  }
}

async function fetchTsdbScoreboard(league: LeagueConfig): Promise<LeagueResult> {
  const id = await resolveTsdbLeagueId(league)
  if (!id) return { leagueId: league.id, label: league.label, events: [], error: 'league_not_found' }
  try {
    const [nextRes, pastRes] = await Promise.all([
      fetch(`${TSDB_BASE}/eventsnextleague.php?id=${id}`, { headers: { Accept: 'application/json' } }),
      fetch(`${TSDB_BASE}/eventspastleague.php?id=${id}`, { headers: { Accept: 'application/json' } }),
    ])
    const events: NormalizedEvent[] = []
    if (nextRes.ok) {
      const j = (await nextRes.json()) as { events?: TsdbEvent[] | null }
      for (const ev of j.events ?? []) { const n = normalizeTsdbEvent(ev, 'pre'); if (n) events.push(n) }
    } else { console.log(`[sports] tsdb ${league.id} next failed: HTTP ${nextRes.status}`) }
    if (pastRes.ok) {
      const j = (await pastRes.json()) as { events?: TsdbEvent[] | null }
      for (const ev of j.events ?? []) { const n = normalizeTsdbEvent(ev, 'post'); if (n) events.push(n) }
    } else { console.log(`[sports] tsdb ${league.id} past failed: HTTP ${pastRes.status}`) }
    // Upcoming first (soonest), then recent results (newest first).
    events.sort((a, b) => {
      if (a.state !== b.state) return a.state === 'pre' ? -1 : 1
      return a.state === 'pre' ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime)
    })
    const result: LeagueResult = { leagueId: league.id, label: league.label, events }
    cache.set(league.id, { at: Date.now(), data: result })
    return result
  } catch (e) {
    console.log(`[sports] tsdb ${league.id} fetch error:`, (e as Error).message)
    return { leagueId: league.id, label: league.label, events: [], error: 'fetch_failed' }
  }
}

// --- API-Football (api-sports.io free tier — 100 req/day, needs a key) ---
// The key lives ONLY in the APISPORTS_KEY env var, never in code. Free tier is
// generous enough for us because every league response is cached server-side
// (CACHE_MS), so all clients share one upstream fetch. League id is resolved by
// name+country once and cached. Not testable from the sandbox (outbound
// blocked) — verify JSON shape on first deploy; every step logs on failure.
const APISPORTS_BASE = 'https://v3.football.api-sports.io'
const apiSportsLeagueIdCache = new Map<string, number | null>()

interface ApiSportsLeagueEntry { league?: { id?: number; name?: string }; country?: { name?: string } }
interface ApiSportsFixture {
  fixture?: { id?: number; date?: string; status?: { short?: string } }
  teams?: { home?: { name?: string; logo?: string }; away?: { name?: string; logo?: string } }
  goals?: { home?: number | null; away?: number | null }
}

// API-Football status codes → our three states.
function apiSportsState(short?: string): NormalizedEvent['state'] {
  const live = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']
  const done = ['FT', 'AET', 'PEN', 'WO', 'AWD']
  if (short && live.includes(short)) return 'in'
  if (short && done.includes(short)) return 'post'
  return 'pre'
}

async function resolveApiSportsLeagueId(cfg: LeagueConfig, key: string): Promise<number | null> {
  const cacheKey = `${cfg.apisportsCountry}|${cfg.apisportsName}`
  if (apiSportsLeagueIdCache.has(cacheKey)) return apiSportsLeagueIdCache.get(cacheKey) ?? null
  try {
    const res = await fetch(`${APISPORTS_BASE}/leagues?country=${encodeURIComponent(cfg.apisportsCountry ?? '')}`, { headers: { 'x-apisports-key': key } })
    if (!res.ok) { console.log(`[sports] apisports league search failed: HTTP ${res.status}`); return null }
    const json = (await res.json()) as { response?: ApiSportsLeagueEntry[] }
    const want = (cfg.apisportsName ?? '').toLowerCase()
    const list = json.response ?? []
    const match = list.find((l) => (l.league?.name ?? '').toLowerCase() === want)
      ?? list.find((l) => (l.league?.name ?? '').toLowerCase().includes(want))
    const id = match?.league?.id ?? null
    apiSportsLeagueIdCache.set(cacheKey, id)
    if (!id) console.log(`[sports] apisports: league "${cfg.apisportsName}" not found in ${cfg.apisportsCountry}`)
    return id
  } catch (e) {
    console.log('[sports] apisports league resolve error:', (e as Error).message)
    return null
  }
}

function normalizeApiSportsFixture(fx: ApiSportsFixture): NormalizedEvent | null {
  const id = fx.fixture?.id
  const home = fx.teams?.home, away = fx.teams?.away
  if (!id || !home?.name || !away?.name) return null
  const state = apiSportsState(fx.fixture?.status?.short)
  const homeScore = fx.goals?.home != null ? String(fx.goals.home) : undefined
  const awayScore = fx.goals?.away != null ? String(fx.goals.away) : undefined
  return {
    id: String(id),
    startTime: fx.fixture?.date ?? '',
    state,
    statusDetail: fx.fixture?.status?.short ?? '',
    home: { name: home.name, abbrev: '', logo: home.logo, score: homeScore },
    away: { name: away.name, abbrev: '', logo: away.logo, score: awayScore },
  }
}

async function fetchApiSportsScoreboard(league: LeagueConfig): Promise<LeagueResult> {
  const key = process.env.APISPORTS_KEY
  if (!key) {
    console.log('[sports] apisports: APISPORTS_KEY env var not set')
    return { leagueId: league.id, label: league.label, events: [], error: 'not_configured' }
  }
  const id = await resolveApiSportsLeagueId(league, key)
  if (!id) return { leagueId: league.id, label: league.label, events: [], error: 'league_not_found' }
  try {
    const [nextRes, lastRes] = await Promise.all([
      fetch(`${APISPORTS_BASE}/fixtures?league=${id}&next=15`, { headers: { 'x-apisports-key': key } }),
      fetch(`${APISPORTS_BASE}/fixtures?league=${id}&last=15`, { headers: { 'x-apisports-key': key } }),
    ])
    const events: NormalizedEvent[] = []
    if (nextRes.ok) {
      const j = (await nextRes.json()) as { response?: ApiSportsFixture[] }
      for (const fx of j.response ?? []) { const n = normalizeApiSportsFixture(fx); if (n) events.push(n) }
    } else { console.log(`[sports] apisports ${league.id} next failed: HTTP ${nextRes.status}`) }
    if (lastRes.ok) {
      const j = (await lastRes.json()) as { response?: ApiSportsFixture[] }
      for (const fx of j.response ?? []) { const n = normalizeApiSportsFixture(fx); if (n) events.push(n) }
    } else { console.log(`[sports] apisports ${league.id} last failed: HTTP ${lastRes.status}`) }
    events.sort((a, b) => {
      if (a.state !== b.state) return a.state === 'pre' ? -1 : 1
      return a.state === 'pre' ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime)
    })
    const result: LeagueResult = { leagueId: league.id, label: league.label, events }
    cache.set(league.id, { at: Date.now(), data: result })
    return result
  } catch (e) {
    console.log(`[sports] apisports ${league.id} fetch error:`, (e as Error).message)
    return { leagueId: league.id, label: league.label, events: [], error: 'fetch_failed' }
  }
}

// --- F1 (Jolpica-F1, Ergast-compatible schema) ---
interface JolpicaRace {
  raceName?: string
  date?: string
  time?: string
  Circuit?: { circuitName?: string; Location?: { locality?: string; country?: string } }
  Results?: { position?: string; Driver?: { givenName?: string; familyName?: string }; Constructor?: { name?: string } }[]
}
interface JolpicaResponse { MRData?: { RaceTable?: { Races?: JolpicaRace[] } } }

export interface F1Info {
  next?: { raceName: string; circuit: string; location: string; date: string; time?: string }
  lastPodium?: { position: string; driver: string; constructor: string }[]
  lastRaceName?: string
  error?: string
}

let f1Cache: { at: number; data: F1Info } | null = null

export async function fetchF1Info(): Promise<F1Info> {
  if (f1Cache && Date.now() - f1Cache.at < CACHE_MS * 4) return f1Cache.data
  try {
    const [nextRes, lastRes] = await Promise.all([
      fetch('https://api.jolpi.ca/ergast/f1/current/next.json', { headers: { Accept: 'application/json' } }),
      fetch('https://api.jolpi.ca/ergast/f1/current/last/results.json', { headers: { Accept: 'application/json' } }),
    ])
    const info: F1Info = {}
    if (nextRes.ok) {
      const j = (await nextRes.json()) as JolpicaResponse
      const r = j.MRData?.RaceTable?.Races?.[0]
      if (r) info.next = { raceName: r.raceName ?? '', circuit: r.Circuit?.circuitName ?? '', location: `${r.Circuit?.Location?.locality ?? ''}, ${r.Circuit?.Location?.country ?? ''}`, date: r.date ?? '', time: r.time }
    } else {
      console.log(`[sports] f1 next fetch failed: HTTP ${nextRes.status}`)
    }
    if (lastRes.ok) {
      const j = (await lastRes.json()) as JolpicaResponse
      const r = j.MRData?.RaceTable?.Races?.[0]
      if (r) {
        info.lastRaceName = r.raceName
        info.lastPodium = (r.Results ?? []).slice(0, 3).map((res) => ({
          position: res.position ?? '', driver: `${res.Driver?.givenName ?? ''} ${res.Driver?.familyName ?? ''}`.trim(), constructor: res.Constructor?.name ?? '',
        }))
      }
    } else {
      console.log(`[sports] f1 last-results fetch failed: HTTP ${lastRes.status}`)
    }
    f1Cache = { at: Date.now(), data: info }
    return info
  } catch (e) {
    console.log('[sports] f1 fetch error:', (e as Error).message)
    return { error: 'fetch_failed' }
  }
}

// --- MotoGP (Dorna's own public pulselive API — free, no key) ---
// Base: https://api.motogp.pulselive.com/motogp/v1 — the same backend the
// official site/app use. There is no official documentation (community-mapped),
// so parsing is defensive and every step logs on failure. Like F1, this could
// not be live-tested from the sandbox; the first real deploy should confirm the
// JSON shapes against actual responses.
const MGP_BASE = 'https://api.motogp.pulselive.com/motogp/v1'

interface MgpSeason { id?: string; year?: number; current?: boolean }
interface MgpEvent { id?: string; name?: string; sponsored_name?: string; circuit?: { name?: string }; country?: { name?: string }; date_start?: string; date_end?: string; test?: boolean }

export interface MotoGpInfo {
  next?: { name: string; circuit: string; country: string; date: string }
  lastRaceName?: string
  lastRaceDate?: string
  error?: string
}

let mgpCache: { at: number; data: MotoGpInfo } | null = null

export async function fetchMotoGpInfo(): Promise<MotoGpInfo> {
  if (mgpCache && Date.now() - mgpCache.at < CACHE_MS * 4) return mgpCache.data
  try {
    const seasonsRes = await fetch(`${MGP_BASE}/results/seasons`, { headers: { Accept: 'application/json' } })
    if (!seasonsRes.ok) { console.log(`[sports] motogp seasons fetch failed: HTTP ${seasonsRes.status}`); return { error: `upstream_${seasonsRes.status}` } }
    const seasons = (await seasonsRes.json()) as MgpSeason[]
    // Prefer the season flagged current; else the newest year.
    const season = (Array.isArray(seasons) ? seasons : []).slice().sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).find((s) => s.current) ?? (Array.isArray(seasons) ? seasons : []).slice().sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
    if (!season?.id) { console.log('[sports] motogp: no season id'); return { error: 'no_season' } }

    const [upRes, doneRes] = await Promise.all([
      fetch(`${MGP_BASE}/results/events?seasonUuid=${season.id}&isFinished=false`, { headers: { Accept: 'application/json' } }),
      fetch(`${MGP_BASE}/results/events?seasonUuid=${season.id}&isFinished=true`, { headers: { Accept: 'application/json' } }),
    ])
    const info: MotoGpInfo = {}
    if (upRes.ok) {
      const evs = (await upRes.json()) as MgpEvent[]
      // First non-test upcoming event, sorted by start date.
      const next = (Array.isArray(evs) ? evs : []).filter((e) => !e.test && e.date_start).sort((a, b) => (a.date_start ?? '').localeCompare(b.date_start ?? ''))[0]
      if (next) info.next = { name: next.sponsored_name || next.name || 'MotoGP', circuit: next.circuit?.name ?? '', country: next.country?.name ?? '', date: next.date_start ?? '' }
    } else { console.log(`[sports] motogp upcoming fetch failed: HTTP ${upRes.status}`) }
    if (doneRes.ok) {
      const evs = (await doneRes.json()) as MgpEvent[]
      const last = (Array.isArray(evs) ? evs : []).filter((e) => !e.test && e.date_end).sort((a, b) => (b.date_end ?? '').localeCompare(a.date_end ?? ''))[0]
      if (last) { info.lastRaceName = last.sponsored_name || last.name; info.lastRaceDate = last.date_end }
    } else { console.log(`[sports] motogp finished fetch failed: HTTP ${doneRes.status}`) }
    mgpCache = { at: Date.now(), data: info }
    return info
  } catch (e) {
    console.log('[sports] motogp fetch error:', (e as Error).message)
    return { error: 'fetch_failed' }
  }
}
