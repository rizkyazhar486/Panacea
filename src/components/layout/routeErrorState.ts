// Logika murni batas galat per rute dan kait crash QA (diuji di scripts/uji/route-error-boundary.mts tanpa DOM).
export interface RouteErrorState { error: Error | null; routeKey: string }

export const routeErrorFromError = (error: Error): Pick<RouteErrorState, 'error'> => ({ error })

// Rute berubah -> galat lama dibuang agar halaman baru dirender normal; rute sama -> tidak ada perubahan (null).
export const routeErrorForKey = (state: RouteErrorState, routeKey: string): RouteErrorState | null =>
  state.routeKey === routeKey ? null : { error: null, routeKey }

export const QA_CRASH_KEY = 'panacea:qa-crash-route'
export const qaShouldCrash = (target: string | null, pathname: string): boolean => target !== null && target === pathname
