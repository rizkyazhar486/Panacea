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
  slug: string // ESPN league slug
}

export const LEAGUES: LeagueConfig[] = [
  { id: 'epl', label: 'Premier League', sport: 'soccer', slug: 'eng.1' },
  { id: 'laliga', label: 'La Liga', sport: 'soccer', slug: 'esp.1' },
  { id: 'seriea', label: 'Serie A', sport: 'soccer', slug: 'ita.1' },
  { id: 'bundesliga', label: 'Bundesliga', sport: 'soccer', slug: 'ger.1' },
  { id: 'ligue1', label: 'Ligue 1', sport: 'soccer', slug: 'fra.1' },
  { id: 'eredivisie', label: 'Eredivisie', sport: 'soccer', slug: 'ned.1' },
  { id: 'ucl', label: 'Liga Champions', sport: 'soccer', slug: 'uefa.champions' },
  { id: 'worldcup', label: 'Piala Dunia', sport: 'soccer', slug: 'fifa.world' },
  { id: 'nba', label: 'NBA', sport: 'basketball', slug: 'nba' },
  { id: 'nfl', label: 'NFL', sport: 'football', slug: 'nfl' },
  { id: 'mlb', label: 'MLB', sport: 'baseball', slug: 'mlb' },
  { id: 'nhl', label: 'NHL', sport: 'hockey', slug: 'nhl' },
  { id: 'ufc', label: 'UFC', sport: 'mma', slug: 'ufc' },
  { id: 'urc', label: 'URC (Rugby)', sport: 'rugby', slug: '270557' },
  { id: 'atp', label: 'ATP Tour', sport: 'tennis', slug: 'atp' },
  { id: 'wta', label: 'WTA Tour', sport: 'tennis', slug: 'wta' },
]

// Leagues explicitly NOT covered — shown honestly in the UI instead of faked.
export const UNAVAILABLE: UnavailableResult[] = [
  { leagueId: 'liga1_id', label: 'Liga 1 Indonesia', unavailable: true, reason: 'No reliable free data source for Indonesia\'s Liga 1/2 at the moment.' },
  { leagueId: 'liga2_id', label: 'Liga 2 Indonesia', unavailable: true, reason: 'No reliable free data source for Indonesia\'s Liga 1/2 at the moment.' },
  { leagueId: 'motogp', label: 'MotoGP', unavailable: true, reason: 'No free, no-key MotoGP scoreboard endpoint exists — ESPN\'s public API does not expose MotoGP results the way it does F1.' },
  { leagueId: 'ipl', label: 'IPL (Cricket)', unavailable: true, reason: 'Cricket scoreboards on the free ESPN API are inconsistent and don\'t map cleanly to live scores, so IPL is left out rather than shown incorrectly.' },
  { leagueId: 'padel', label: 'Padel', unavailable: true, reason: 'No free padel score API is available yet.' },
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

function normalizeMmaEvent(ev: EspnMmaEvent): NormalizedEvent | null {
  const comp = ev.competitions?.[0]
  const f1 = comp?.competitors?.find((c) => c.order === 1) ?? comp?.competitors?.[0]
  const f2 = comp?.competitors?.find((c) => c.order === 2) ?? comp?.competitors?.[1]
  if (!f1?.athlete || !f2?.athlete || !ev.id) return null
  const status = comp?.status?.type ?? ev.status?.type
  const state = (status?.state as NormalizedEvent['state']) ?? 'pre'
  const resultFor = (c: EspnFighterCompetitor) => (c.score != null && c.score !== '' ? String(c.score) : state === 'post' ? (c.winner ? 'W' : 'L') : undefined)
  return {
    id: ev.id,
    startTime: ev.date ?? '',
    state: state === 'in' || state === 'post' ? state : 'pre',
    statusDetail: status?.shortDetail ?? status?.detail ?? ev.name ?? '',
    home: { name: f1.athlete.displayName ?? f1.athlete.shortName ?? '?', abbrev: '', logo: f1.athlete.headshot?.href, score: resultFor(f1) },
    away: { name: f2.athlete.displayName ?? f2.athlete.shortName ?? '?', abbrev: '', logo: f2.athlete.headshot?.href, score: resultFor(f2) },
  }
}

export async function fetchLeagueScoreboard(leagueId: string): Promise<LeagueResult> {
  const league = LEAGUES.find((l) => l.id === leagueId)
  if (!league) return { leagueId, label: leagueId, events: [], error: 'unknown_league' }

  const hit = cache.get(leagueId)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

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
      events = (json.events ?? []).map(normalizeMmaEvent).filter((e): e is NormalizedEvent => e !== null)
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
