import { FormEvent, useEffect, useRef, useState } from 'react'
import { ThinkingOrb } from './ThinkingOrb'

type PreviewTrack = {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string
  previewUrl?: string
}

type SearchPayload = {
  results?: PreviewTrack[]
}

export function PanaceaMusicPlayer() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<PreviewTrack[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  const request = useRef<AbortController | null>(null)

  const selected = tracks[active]

  useEffect(() => () => {
    request.current?.abort()
    audio.current?.pause()
  }, [])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    setPlaying(false)

    try {
      const endpoint = 'https://itunes.apple.com/search?media=music&entity=song&limit=8&term=' + encodeURIComponent(term)
      const response = await fetch(endpoint, { signal: controller.signal })
      if (!response.ok) throw new Error('Music search unavailable')
      const payload = await response.json() as SearchPayload
      const playable = (payload.results ?? []).filter((track) => Boolean(track.previewUrl))
      setTracks(playable)
      setActive(0)
      if (!playable.length) setError('No preview found')
    } catch (cause) {
      if ((cause as Error).name !== 'AbortError') setError('Music search unavailable')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const toggle = async () => {
    const player = audio.current
    if (!player || !selected?.previewUrl) return
    if (player.paused) {
      try {
        await player.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    } else {
      player.pause()
      setPlaying(false)
    }
  }

  const choose = (index: number) => {
    audio.current?.pause()
    setPlaying(false)
    setActive(index)
  }

  return (
    <section className="pmd-music-player pmd-liquid-metal pmd-scroll-section" aria-label="Panacea music player">
      <div className="pmd-player-head">
        <div className="pmd-section-heading">
          <span className="pmd-section-kicker">Focus audio</span>
          <strong className="pmd-one-line">Panacea Player</strong>
        </div>
        <span className="pmd-player-source">Preview API</span>
      </div>

      <form className="pmd-player-search" onSubmit={search}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search music"
          aria-label="Search music previews"
        />
        <button type="submit" disabled={loading}>{loading ? '…' : 'Search'}</button>
      </form>

      {loading && <div className="pmd-player-status"><ThinkingOrb label="Searching music" size={20} /></div>}
      {error && <div className="pmd-player-status" role="status">{error}</div>}

      {selected && (
        <div className="pmd-now-playing">
          <img src={selected.artworkUrl100} alt="" loading="lazy" />
          <div className="pmd-now-copy">
            <strong className="pmd-one-line">{selected.trackName}</strong>
            <small className="pmd-one-line">{selected.artistName}</small>
          </div>
          <button type="button" className="pmd-player-play" onClick={toggle} aria-label={playing ? 'Pause preview' : 'Play preview'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
        </div>
      )}

      {tracks.length > 1 && (
        <div className="pmd-track-rail" aria-label="Music search results">
          {tracks.map((track, index) => (
            <button
              key={track.trackId}
              type="button"
              data-active={index === active}
              onClick={() => choose(index)}
              title={track.trackName + ' — ' + track.artistName}
            >
              <img src={track.artworkUrl100} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <audio
        ref={audio}
        src={selected?.previewUrl}
        preload="none"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
      />
    </section>
  )
}

export default PanaceaMusicPlayer
