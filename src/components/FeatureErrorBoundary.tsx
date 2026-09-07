import { Component, type ErrorInfo, type ReactNode } from 'react'

const LIGHTWEIGHT_MODE_KEY = 'panacea:lightweight-mode'

export function isLightweightMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(LIGHTWEIGHT_MODE_KEY) === '1'
}

export function clearLightweightMode(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(LIGHTWEIGHT_MODE_KEY)
}

interface FeatureErrorBoundaryProps {
  children: ReactNode
  featureName: string
  onBack?: () => void
  onLightweight?: () => void
}

interface FeatureErrorBoundaryState {
  error: Error | null
}

/**
 * Failure isolation for heavy/experimental features.
 *
 * A WebGL, lazy-chunk, parser, or third-party error inside one feature must not
 * turn Panacea into a blank page. Lightweight mode is persisted only for the
 * current browser session and can be consumed by expensive features to choose
 * a non-WebGL/non-animated fallback.
 */
export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  state: FeatureErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[FeatureErrorBoundary:${this.props.featureName}]`, error, info)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  private goBack = () => {
    if (this.props.onBack) {
      this.props.onBack()
      return
    }
    if (typeof window !== 'undefined') window.history.back()
  }

  private openLightweight = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LIGHTWEIGHT_MODE_KEY, '1')
    }

    if (this.props.onLightweight) {
      this.props.onLightweight()
      this.setState({ error: null })
      return
    }

    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <section
        role="alert"
        aria-live="assertive"
        className="mx-auto my-6 w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/95"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Feature recovery
        </p>
        <h2 className="mt-2 text-xl font-semibold text-ink dark:text-white">
          {this.props.featureName} could not finish loading
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          The rest of Panacea is still available. Retry this feature, return to the previous screen, or open a lighter mode that avoids expensive rendering for this session.
        </p>
        <details className="mt-3 rounded-2xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
          <summary className="cursor-pointer font-semibold">Technical detail</summary>
          <p className="mt-2 break-words font-mono">{error.message || 'Unknown feature error'}</p>
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={this.retry}
            className="min-h-11 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={this.goBack}
            className="min-h-11 rounded-full border border-neutral-200 px-4 py-2 text-sm font-bold text-ink dark:border-white/15 dark:text-white"
          >
            Back
          </button>
          <button
            type="button"
            onClick={this.openLightweight}
            className="min-h-11 rounded-full border border-neutral-200 px-4 py-2 text-sm font-bold text-ink dark:border-white/15 dark:text-white"
          >
            Open lightweight mode
          </button>
        </div>
      </section>
    )
  }
}
