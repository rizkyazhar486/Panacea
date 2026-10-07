import { Component, type ReactNode } from 'react'

// Catches render-time crashes anywhere in the tree and shows a friendly screen
// (with reload) instead of a blank white page. Standalone styling so it works
// even if the failure is inside the store/Shell.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Hook for a real logging service (Sentry, etc.) in production.
    console.error('[Panaceamed] render error:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f7f5] p-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-3xl">⚠️</div>
        <h1 className="text-xl font-extrabold text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          Sorry, an unexpected error occurred. Your data is safe. Try reloading the page.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
          >
            Reload
          </button>
          <button
            onClick={() => { window.location.hash = '#/'; window.location.reload() }}
            className="rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }
}
