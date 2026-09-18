import { FOR_YOU_ADAPTER_META, type ForYouAdapter } from './forYouWidgetCatalog'

export type MusicAdapterConnectionState = 'not-configured' | 'disconnected' | 'connecting' | 'connected' | 'error'

export interface MusicAdapterStatus {
  state: MusicAdapterConnectionState
  errorMessage?: string
}

const REDIRECT_PATH = '/?t=for-you'
const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming'

function readEnv(name: string): string | undefined {
  if (!name) return undefined
  const value = (import.meta.env as Record<string, string | undefined>)[name]
  return value && value.trim().length > 0 ? value.trim() : undefined
}

/** Real per-deployment configuration check — never assume a provider is connectable. */
export function isMusicAdapterConfigured(adapter: ForYouAdapter): boolean {
  const meta = FOR_YOU_ADAPTER_META[adapter]
  return Boolean(readEnv(meta.configEnvVar))
}

function storageKey(adapter: ForYouAdapter, suffix: string) {
  return `panacea.forYou.music.${adapter}.${suffix}`
}

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // sessionStorage unavailable (private browsing, disabled storage) — state resets on reload
  }
}

function clearSession(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function setStatus(adapter: ForYouAdapter, state: 'connected' | 'error' | 'disconnected', errorMessage?: string) {
  writeSession(storageKey(adapter, 'status'), state)
  if (errorMessage) writeSession(storageKey(adapter, 'error'), errorMessage)
  else clearSession(storageKey(adapter, 'error'))
}

/** Real per-adapter connection state, derived from config presence and stored auth outcome. */
export function readMusicAdapterStatus(adapter: ForYouAdapter): MusicAdapterStatus {
  if (!isMusicAdapterConfigured(adapter)) return { state: 'not-configured' }
  const raw = readSession(storageKey(adapter, 'status'))
  if (raw === 'connected') return { state: 'connected' }
  if (raw === 'error') return { state: 'error', errorMessage: readSession(storageKey(adapter, 'error')) ?? 'Authorization failed.' }
  return { state: 'disconnected' }
}

export function disconnectMusicAdapter(adapter: ForYouAdapter) {
  clearSession(storageKey(adapter, 'status'))
  clearSession(storageKey(adapter, 'error'))
  clearSession(storageKey(adapter, 'access-token'))
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  let binary = ''
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Starts Spotify's Authorization Code with PKCE flow (no client secret required) and
 * redirects the browser to Spotify's real consent screen. Throws if no client id is
 * configured for this deployment — callers must gate this behind `isMusicAdapterConfigured`.
 */
export async function beginSpotifyAuthorization(): Promise<void> {
  const clientId = readEnv(FOR_YOU_ADAPTER_META.spotify.configEnvVar)
  if (!clientId) throw new Error('Spotify is not configured in this environment.')

  const verifier = randomString(64)
  const challenge = await sha256Base64Url(verifier)
  const state = randomString(24)
  writeSession(storageKey('spotify', 'verifier'), verifier)
  writeSession(storageKey('spotify', 'oauth-state'), state)

  const redirectUri = `${window.location.origin}${REDIRECT_PATH}`
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SPOTIFY_SCOPES,
  })
  setStatus('spotify', 'disconnected')
  window.location.assign(`${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`)
}

/**
 * Completes a pending Spotify PKCE redirect if the current URL carries one for this tab's
 * in-flight request (state matches what we stored before redirecting). Safe to call on every
 * For You mount; it is a no-op whenever there is no matching pending authorization.
 */
export async function completePendingSpotifyAuthorization(search: string): Promise<'handled' | 'not-pending'> {
  const params = new URLSearchParams(search)
  const code = params.get('code')
  const authError = params.get('error')
  const returnedState = params.get('state')
  if (!code && !authError) return 'not-pending'

  const expectedState = readSession(storageKey('spotify', 'oauth-state'))
  const verifier = readSession(storageKey('spotify', 'verifier'))
  if (!expectedState || !verifier || returnedState !== expectedState) return 'not-pending'

  clearSession(storageKey('spotify', 'oauth-state'))
  clearSession(storageKey('spotify', 'verifier'))

  if (authError) {
    setStatus('spotify', 'error', `Spotify declined authorization: ${authError}`)
    return 'handled'
  }

  const clientId = readEnv(FOR_YOU_ADAPTER_META.spotify.configEnvVar)
  if (!clientId || !code) {
    setStatus('spotify', 'error', 'Spotify is not configured in this environment.')
    return 'handled'
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${window.location.origin}${REDIRECT_PATH}`,
        code_verifier: verifier,
      }),
    })
    if (!response.ok) throw new Error(`Spotify token exchange failed (${response.status})`)
    const payload = (await response.json()) as { access_token?: string }
    if (!payload.access_token) throw new Error('Spotify token exchange returned no access token.')
    writeSession(storageKey('spotify', 'access-token'), payload.access_token)
    setStatus('spotify', 'connected')
  } catch (error) {
    setStatus('spotify', 'error', error instanceof Error ? error.message : 'Spotify token exchange failed.')
  }
  return 'handled'
}
