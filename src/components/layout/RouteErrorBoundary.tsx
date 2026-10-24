import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
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
  }

  private retry = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section role="alert" data-route-error={this.props.routeKey} className="mx-auto my-10 max-w-md px-4 text-center">
        <h1 className="text-lg font-bold">This page couldn't be displayed</h1>
        <p className="mt-2 text-sm opacity-80">
          An error stopped this page from loading. Your data is safe, and the rest of the app still works.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={this.retry} className="min-h-[44px] px-5 font-semibold">Try again</button>
          <a href="#/" className="inline-flex min-h-[44px] items-center px-5 font-semibold">Go Home</a>
        </div>
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
