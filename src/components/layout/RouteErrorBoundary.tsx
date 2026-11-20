import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import {
  DIAGNOSTICS_OPEN_EVENT,
  redactSensitiveText,
  ROUTE_ERROR_EVENT,
  sanitizeDiagnosticRoute,
} from '../../domains/observability'
import { GalatApi } from '../../lib/galatApi'
import { laporGalat } from '../../lib/laporGalatKlien'
import { routeErrorForKey, routeErrorFromError, type RouteErrorState } from './routeErrorState'

// Batas galat per rute: crash render di satu halaman hanya mengganti ISI halaman itu, sementara Shell (navigasi,
// notifikasi, menu) tetap hidup sehingga pengguna bisa pindah halaman. Tanpa ini crash naik ke ErrorBoundary akar
// dan seluruh aplikasi berganti layar "Something went wrong". Status galat direset otomatis saat rute berubah.

class RouteErrorBoundaryInner extends Component<{ routeKey: string; children: ReactNode }, RouteErrorState> {
  state: RouteErrorState = { error: null, routeKey: this.props.routeKey }

  static getDerivedStateFromError(error: Error) {
    return routeErrorFromError(error)
  }

  static getDerivedStateFromProps(props: { routeKey: string }, state: RouteErrorState) {
    return routeErrorForKey(state, props.routeKey)
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', this.props.routeKey, error, info)
    laporGalat('boundary', error, `route:${this.props.routeKey}`)
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(ROUTE_ERROR_EVENT, {
            detail: {
              route: this.props.routeKey,
              message: redactSensitiveText(error),
              requestId: error instanceof GalatApi ? error.requestId : null,
            },
          }),
        )
      }
    } catch {
      // Event dispatch must never interfere with fallback rendering.
    }
  }

  private retry = () => this.setState({ error: null })

  private openDiagnostics = () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(DIAGNOSTICS_OPEN_EVENT))
      }
    } catch {
      // Ignore if CustomEvent is unavailable.
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const safeRoute = sanitizeDiagnosticRoute(this.props.routeKey)
    const safeMessage = redactSensitiveText(error) || 'Terjadi gangguan saat memuat halaman'
    const requestId = error instanceof GalatApi ? error.requestId : null

    return (
      <section
        role="alert"
        data-route-error={this.props.routeKey}
        className="mx-auto my-8 w-full max-w-lg rounded-3xl border border-black/10 bg-white/95 p-6 text-center shadow-sm backdrop-blur dark:border-white/15 dark:bg-neutral-900/95"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
          Pemulihan Halaman
        </p>
        <h1 className="mt-2 text-lg font-extrabold text-ink dark:text-white">
          Halaman ini gagal dimuat
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Data Anda tetap aman dan navigasi lain tetap aktif. Muat ulang halaman ini, kembali ke beranda, atau buka diagnostik.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={this.retry}
            data-variant="primary"
            className="min-h-[44px] rounded-full bg-brand px-5 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
          <a
            href="#/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-ink dark:border-white/15 dark:bg-neutral-800 dark:text-white"
          >
            Go Home
          </a>
          <button
            type="button"
            onClick={this.openDiagnostics}
            className="min-h-[44px] rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-ink dark:border-white/15 dark:text-white"
          >
            Diagnostik
          </button>
        </div>

        <details className="mt-4 rounded-2xl border border-black/10 bg-neutral-50 px-3.5 py-2.5 text-left text-xs text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
          <summary className="min-h-[24px] cursor-pointer font-semibold text-ink dark:text-neutral-200">
            Detail teknis (tanpa PHI)
          </summary>
          <p className="mt-2 break-all font-mono">Rute: {safeRoute}</p>
          <p className="mt-1 break-words font-mono">{safeMessage}</p>
          {requestId && (
            <p className="mt-1 break-all font-mono" data-request-id={requestId}>
              Reference: {requestId}
            </p>
          )}
        </details>
      </section>
    )
  }
}

// Bila build QA dibuat dengan VITE_QA_HOOKS=1 dan VITE_QA_NO_ROUTE_BOUNDARY=1, batas ini dilepas: itulah kontrol negatif
// ENG-F1-03 (crash halaman harus menjatuhkan cangkang dan pemeriksaan ketahanan harus gagal). Build biasa: konstanta false.
const QA_TANPA_BATAS = import.meta.env.VITE_QA_HOOKS === '1' && import.meta.env.VITE_QA_NO_ROUTE_BOUNDARY === '1'

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  if (QA_TANPA_BATAS) return <>{children}</>
  return <RouteErrorBoundaryInner routeKey={pathname}>{children}</RouteErrorBoundaryInner>
}
