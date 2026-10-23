import { Component, type CSSProperties, type ReactNode } from 'react'
import { laporGalat } from '../../lib/laporGalatKlien'
import { ringkasGalat } from '../../shared/kernel/ringkasGalat'

// Catches render-time crashes anywhere in the tree and shows a friendly screen
// (with reload) instead of a blank white page. Standalone styling so it works
// even if the failure is inside the store/Shell.
//
// Gaya sengaja inline dan kelasnya tidak memuat "rounded"/"bg-"/"border": aturan global tombol
// (panacea-control-grading-v46/liquid-actions-v45) menargetkan kelas-kelas itu dan sebelumnya mengubah
// tombol di layar ini menjadi pil gelap dengan teks abu, sementara latar yang dikunci terang membuat judul
// putih (tema gelap) tak terbaca. Tema mengikuti kelas `dark` pada <html> (src/lib/theme.ts).
const gelapAktif = (): boolean => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

const tombolDasar: CSSProperties = {
  minHeight: 44, minWidth: 96, padding: '10px 24px', borderRadius: 9999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[Panaceamed] render error:', error)
    // Tanpa ini crash akar tidak pernah sampai ke /api/owner/client-errors (hanya FeatureErrorBoundary yang melapor).
    laporGalat('boundary', error, 'root')
  }

  render() {
    if (!this.state.error) return this.props.children
    const gelap = gelapAktif()
    const warna = gelap
      ? { latar: '#05080a', judul: '#f4f7f5', isi: '#c3ccc8', garis: 'rgba(255,255,255,.18)', kotak: 'rgba(255,255,255,.06)', sekunder: '#e8efeb' }
      : { latar: '#f4f7f5', judul: '#0c1410', isi: '#4b5563', garis: '#c9d3ce', kotak: '#ffffff', sekunder: '#1f2a24' }
    const { pesan, rute } = ringkasGalat(this.state.error, typeof location === 'undefined' ? '' : location.hash)
    return (
      <div
        role="alert"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: warna.latar }}
      >
        <div aria-hidden style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 16, fontSize: 30, background: gelap ? 'rgba(255,196,0,.14)' : 'rgba(230,57,70,.10)' }}>⚠️</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: warna.judul }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: 360, fontSize: 14, lineHeight: 1.5, color: warna.isi }}>
          Sorry, an unexpected error occurred. Your data is safe. Try reloading the page.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ ...tombolDasar, border: '1px solid #0b7a4b', background: '#0b7a4b', color: '#ffffff' }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => { window.location.hash = '#/'; window.location.reload() }}
            style={{ ...tombolDasar, border: `1px solid ${warna.garis}`, background: warna.kotak, color: warna.sekunder }}
          >
            Go Home
          </button>
        </div>
        <details style={{ maxWidth: 360, width: '100%', textAlign: 'left', fontSize: 12, color: warna.isi }}>
          <summary style={{ cursor: 'pointer', minHeight: 24, color: warna.isi }}>Technical details</summary>
          <p style={{ margin: '8px 0 0', wordBreak: 'break-word', color: warna.isi }}>Page: {rute}</p>
          <p style={{ margin: '4px 0 0', wordBreak: 'break-word', color: warna.isi }}>{pesan}</p>
        </details>
      </div>
    )
  }
}
