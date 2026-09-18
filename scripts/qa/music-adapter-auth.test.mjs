import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [auth, catalog, stack] = await Promise.all([
  readFile(new URL('../../src/lib/musicAdapterAuth.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/forYouWidgetCatalog.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/components/ForYouDailyStack.tsx', import.meta.url), 'utf8'),
])

test('music adapter auth models a real, explicit connection state machine', () => {
  assert.match(auth, /'not-configured' \| 'disconnected' \| 'connecting' \| 'connected' \| 'error'/)
  assert.match(auth, /export function isMusicAdapterConfigured/)
  assert.match(auth, /export function readMusicAdapterStatus/)
  assert.match(auth, /export async function beginSpotifyAuthorization/)
  assert.match(auth, /export async function completePendingSpotifyAuthorization/)
})

test('adapter configuration is derived from real env vars, never hardcoded true', () => {
  assert.match(auth, /readEnv\(meta\.configEnvVar\)/)
  assert.doesNotMatch(auth, /return true\s*$/m)
})

test('Apple Music has no client-side config var until a token-issuance endpoint exists', () => {
  assert.match(catalog, /'apple-music':\s*{[\s\S]*?configEnvVar:\s*''/)
})

test('Spotify PKCE flow validates OAuth state and never embeds a client secret', () => {
  assert.match(auth, /code_challenge_method: 'S256'/)
  assert.match(auth, /returnedState !== expectedState/)
  assert.doesNotMatch(auth, /client_secret/)
})

test('For You daily stack renders real per-adapter status instead of a fabricated static label', () => {
  assert.doesNotMatch(stack, /Spotify · Apple Music/)
  assert.match(stack, /readMusicAdapterStatus/)
  assert.match(stack, /completePendingSpotifyAuthorization/)
  assert.match(stack, /Panacea never simulates playback or account state/)
})
