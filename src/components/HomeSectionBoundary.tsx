import { Component, type ReactNode } from 'react'
import '../styles/home-mobile-stability.css'

type Props = {
  children: ReactNode
  label: string
}

type State = {
  error: Error | null
}

/**
 * A Home section must never be able to take the entire daily dashboard down.
 *
 * The app-wide ErrorBoundary is still the final safety net, but Home contains
 * many independent visualisations and optional widgets. If one of those has a
 * bad local value, a stale chunk, or a browser-specific rendering problem we
 * keep Training, Recovery and the user's core metrics usable.
 */
export class HomeSectionBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[Panaceamed Home] ${this.props.label} failed:`, error)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section className="rounded-[24px] border border-amber-200/70 bg-amber-50/80 p-4 dark:border-amber-300/15 dark:bg-amber-300/[.06]">
        <div className="text-[10px] font-black uppercase tracking-[.12em] text-amber-700 dark:text-amber-300">
          {this.props.label} temporarily unavailable
        </div>
        <p className="mt-1 text-[11px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">
          The rest of Home is still available. You can continue to Training, Recovery, or retry only this section.
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="mt-3 min-h-10 rounded-full bg-neutral-950 px-4 text-[10px] font-black text-white active:scale-95 dark:bg-white dark:text-neutral-950"
        >
          Retry section
        </button>
      </section>
    )
  }
}
