import { useEffect, useState } from 'react'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconActivity, IconHeart, IconTimer } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Live sports scores — football (multi-league), NBA, NFL, F1. Sources are free
// (ESPN public site API + Jolpica-F1), see server/src/sports.ts for the full
// honesty note: Liga 1/2 Indonesia, tennis, and padel have NO reliable free
// source, so they're shown as an explicit "belum tersedia" list rather than
// faked. Favorite teams are saved server-side and trigger a notification
// (goal/full-time) via the existing push infra, polled every ~90s server-side.
// ─────────────────────────────────────────────────────────────────────────────

interface NormalizedEvent {
  id: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  statusDetail: string
  home: { name: string; abbrev: string; logo?: string; score?: string }
  away: { name: string; abbrev: string; logo?: string; score?: string }
}

const STATE_BADGE: Record<NormalizedEvent['state'], { label: string; tone: 'brand' | 'critical' | 'neutral' }> = {
  in: { label: 'LIVE', tone: 'critical' },
  post: { label: 'Selesai', tone: 'neutral' },
  pre: { label: 'Akan Datang', tone: 'brand' },
}

export function SportsScores() {
  const [leagues, setLeagues] = useState<{ id: string; label: string }[]>([])
  const [unavailable, setUnavailable] = useState<{ leagueId: string; label: string; reason: string }[]>([])
  const [league, setLeague] = useState<string>('epl')
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [f1, setF1] = useState<{ next?: { raceName: string; circuit: string; location: string; date: string }; lastRaceName?: string; lastPodium?: { position: string; driver: string; constructor: string }[] } | null>(null)

  useEffect(() => {
    if (!backendEnabled) { setLoading(false); return }
    api.getSportsLeagues().then((r) => { setLeagues(r.leagues); setUnavailable(r.unavailable) }).catch(() => {})
    api.getSportsFavorites().then(setFavorites).catch(() => {})
  }, [])

  useEffect(() => {
    if (!backendEnabled) return
    setLoading(true); setErr('')
    if (league === 'f1') {
      api.getF1Info().then((r) => { setF1(r); setEvents([]) }).catch(() => setErr('Gagal memuat data F1.')).finally(() => setLoading(false))
      return
    }
    api.getSportsScores(league)
      .then((r) => { setEvents(r.events as NormalizedEvent[]); if (r.error) setErr('Sumber data sedang bermasalah, coba lagi nanti.') })
      .catch(() => setErr('Gagal memuat skor.'))
      .finally(() => setLoading(false))
  }, [league])

  function teamKey(name: string) { return `${league}:${name}` }
  function isFav(name: string) { return favorites.includes(teamKey(name)) }
  async function toggleFav(name: string) {
    const key = teamKey(name)
    const next = isFav(name) ? favorites.filter((f) => f !== key) : [...favorites, key]
    setFavorites(next)
    try { await api.saveSportsFavorites(next) } catch { /* ignore */ }
  }

  if (!backendEnabled) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-neutral-400">
        Skor langsung butuh server aktif — belum tersedia di mode demo lokal.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Skor Langsung" subtitle="Sepak bola, NBA, NFL, F1 — sumber gratis" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...leagues, { id: 'f1', label: 'F1' }].map((l) => (
            <button key={l.id} onClick={() => setLeague(l.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${league === l.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      {loading && <div className="py-8 text-center text-sm text-neutral-400">Memuat…</div>}
      {err && <div className="rounded-xl bg-rose-50 p-3 text-center text-xs text-rose-600">{err}</div>}

      {league === 'f1' && f1 && !loading && (
        <Card className="!p-5 space-y-4">
          {f1.next && (
            <div>
              <SectionTitle icon={<IconTimer size={20} />} title="Balapan Berikutnya" subtitle={f1.next.raceName} />
              <p className="mt-1 text-xs text-neutral-500">{f1.next.circuit} · {f1.next.location}</p>
              <p className="mt-0.5 text-xs font-semibold text-brand-dark">{new Date(f1.next.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          )}
          {f1.lastPodium && f1.lastPodium.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">Podium Terakhir — {f1.lastRaceName}</div>
              <div className="mt-2 space-y-1.5">
                {f1.lastPodium.map((p) => (
                  <div key={p.position} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-xs">
                    <span className="font-bold text-ink">P{p.position} · {p.driver}</span>
                    <span className="text-neutral-500">{p.constructor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!f1.next && !f1.lastPodium && <p className="text-xs text-neutral-400">Data F1 tidak tersedia saat ini.</p>}
        </Card>
      )}

      {league !== 'f1' && !loading && !err && (
        <div className="space-y-2">
          {events.length === 0 && <div className="py-8 text-center text-xs text-neutral-400">Tidak ada pertandingan untuk liga ini saat ini.</div>}
          {events.map((ev) => {
            const badge = STATE_BADGE[ev.state]
            return (
              <Card key={ev.id} className="!p-4">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{new Date(ev.startTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <Badge tone={badge.tone}>{ev.state === 'in' ? `🔴 ${ev.statusDetail || badge.label}` : badge.label}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button onClick={() => toggleFav(ev.home.name)} className="flex flex-1 items-center gap-2 text-left">
                    <span className={`text-sm ${isFav(ev.home.name) ? 'text-amber-400' : 'text-neutral-300'}`}>★</span>
                    <span className="truncate text-sm font-semibold text-ink">{ev.home.name}</span>
                  </button>
                  <span className="shrink-0 text-lg font-black text-ink">{ev.home.score ?? '-'} : {ev.away.score ?? '-'}</span>
                  <button onClick={() => toggleFav(ev.away.name)} className="flex flex-1 items-center justify-end gap-2 text-right">
                    <span className="truncate text-sm font-semibold text-ink">{ev.away.name}</span>
                    <span className={`text-sm ${isFav(ev.away.name) ? 'text-amber-400' : 'text-neutral-300'}`}>★</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Belum Tersedia" subtitle="Jujur soal keterbatasan sumber data gratis" />
        <div className="mt-2 space-y-1.5">
          {unavailable.map((u) => (
            <div key={u.leagueId} className="rounded-xl bg-neutral-50 p-3 text-[11px] text-neutral-500">
              <span className="font-bold text-neutral-700">{u.label}</span> — {u.reason}
            </div>
          ))}
        </div>
      </Card>

      <p className="text-center text-[10px] text-neutral-400">
        Tandai ★ tim favorit untuk mendapat notifikasi gol/hasil akhir (dicek server tiap ~90 detik).
      </p>
    </div>
  )
}

export default SportsScores
