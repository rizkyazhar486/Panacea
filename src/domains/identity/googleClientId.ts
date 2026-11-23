// Which Google client ID the sign-in button uses. The ID is a public identifier (Google prints it into every page
// that shows the button), not a secret, so it may ship with the site.
//
// Before this, the button existed only after the backend's health check answered. A sleeping or cold backend made
// the check time out and the button vanished. Now the button renders from the first available source, in order:
// the server's live answer, the ID built into the site (VITE_GOOGLE_CLIENT_ID), then the last ID the server gave
// this browser. A malformed value from any source is ignored rather than handed to Google.

export const GOOGLE_CLIENT_ID_CACHE_KEY = 'pmd_google_client_id_v1'

const SHAPE = /^[0-9]{6,}-[a-z0-9]{8,}\.apps\.googleusercontent\.com$/

export function isGoogleClientId(value: unknown): value is string {
  return typeof value === 'string' && SHAPE.test(value.trim()) && value === value.trim()
}

export type GoogleClientIdSource = 'server' | 'build' | 'cache'

export function resolveGoogleClientId(sources: { server?: unknown; build?: unknown; cache?: unknown }): { id: string; source: GoogleClientIdSource } | null {
  for (const source of ['server', 'build', 'cache'] as const) {
    const v = sources[source]
    if (isGoogleClientId(v)) return { id: v, source }
  }
  return null
}

/** Accessing the browser storage getter itself can throw before any storage method runs. */
export function getGoogleClientIdStorage(
  browser: Pick<Window, 'localStorage'> | undefined = typeof window === 'undefined' ? undefined : window,
): Storage | undefined {
  try {
    return browser?.localStorage
  } catch {
    return undefined
  }
}

/** Last ID the server confirmed in this browser; storage that is missing or blocked reads as none. */
export function readCachedGoogleClientId(storage: Pick<Storage, 'getItem'> | null | undefined): string | null {
  try {
    const v = storage?.getItem(GOOGLE_CLIENT_ID_CACHE_KEY) ?? null
    return isGoogleClientId(v) ? v : null
  } catch {
    return null
  }
}

/** Remembers a server-confirmed ID; anything malformed is not stored. Returns whether it was written. */
export function rememberGoogleClientId(storage: Pick<Storage, 'setItem'> | null | undefined, id: unknown): boolean {
  if (!isGoogleClientId(id)) return false
  try {
    storage?.setItem(GOOGLE_CLIENT_ID_CACHE_KEY, id)
    return Boolean(storage)
  } catch {
    return false
  }
}
