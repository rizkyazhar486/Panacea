import { Link, useNavigate } from 'react-router-dom'
import { IconLogout, IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'

/**
 * Explicit, discoverable sign-out destination.
 * This page is a confirmation: opening a link must never destroy a session.
 */
export function Logout() {
  const { state, logout } = useStore()
  const navigate = useNavigate()

  const confirmLogout = () => {
    // Sign out locally even if the network is unavailable. Never delete
    // longitudinal records, profile data, or other user-created content.
    if (backendEnabled) void api.logout().catch(() => {})
    logout()
    navigate('/', { replace: true })
  }

  return (
    <section
      aria-labelledby="sign-out-title"
      className="mx-auto flex min-h-[55vh] w-full max-w-lg flex-col justify-center"
    >
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-neutral-900 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-dark dark:bg-brand/15 dark:text-brand">
          <IconLogout size={24} />
        </div>
        <h1 id="sign-out-title" className="text-2xl font-black text-ink dark:text-white">
          Sign out of Panaceamed?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {state.account
            ? 'You will leave this account on this device. Your saved records are not deleted by signing out.'
            : 'You are already signed out.'}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {state.account && (
            <button
              type="button"
              onClick={confirmLogout}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            >
              <IconLogout size={17} />
              Yes, sign out
            </button>
          )}
          <Link
            to={state.account ? '/settings' : '/'}
            className="flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-bold text-ink transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            {state.account ? 'Cancel — back to Settings' : 'Go to Home'}
          </Link>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          <IconShield size={15} className="mt-0.5 shrink-0" />
          On a shared device, also review any information saved by your browser.
        </p>
      </div>
    </section>
  )
}

export default Logout
