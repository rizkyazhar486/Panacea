// Frontend client for the Panaceamed backend (real Google login + Midtrans
// payments). When VITE_API_URL is unset (e.g. the GitHub Pages demo), the app
// falls back to its in-browser simulation and none of this is used.

import type { Role, Account } from './types'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
export const backendEnabled = Boolean(API)

export interface Health {
  ok: boolean
  features: { google: boolean; payments: boolean }
  tokenToIdr: number
  midtransClientKey: string | null
  googleClientId: string | null
}

interface BackendUser {
  id: string
  email: string
  name: string
  role: Role
  picture?: string
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function toAccount(u: BackendUser): Account {
  return {
    email: u.email,
    name: u.name,
    role: u.role,
    isSubscriber: false,
    patientId: u.role === 'pasien' || u.role === 'dokter' ? 'p1' : undefined,
    loggedAt: new Date().toISOString(),
  }
}

export const api = {
  health: () => req<Health>('/api/health'),
  me: () => req<{ user: BackendUser }>('/api/auth/me').then((r) => toAccount(r.user)),
  devLogin: (email: string, name: string, role: Role) =>
    req<{ user: BackendUser }>('/api/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ email, name, role }),
    }).then((r) => toAccount(r.user)),
  googleLogin: (credential: string, role: Role) =>
    req<{ user: BackendUser }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, role }),
    }).then((r) => toAccount(r.user)),
  logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  wallet: () =>
    req<{ balance: number; transactions: { id: string; type: string; amountPnc: number; note: string; at: string }[]; tokenToIdr: number }>(
      '/api/wallet',
    ),
  createPayment: (amountPnc: number, method: string) =>
    req<{ live: boolean; orderId: string; amountIdr: number; token?: string; redirectUrl?: string; clientKey?: string }>(
      '/api/payments/create',
      { method: 'POST', body: JSON.stringify({ amountPnc, method }) },
    ),
  confirmPayment: (orderId: string) =>
    req<{ ok: boolean }>('/api/payments/confirm', { method: 'POST', body: JSON.stringify({ orderId }) }),
  withdraw: (amountPnc: number, bank: string) =>
    req<{ ok: boolean; balance: number }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amountPnc, bank }),
    }),
  posts: () => req<{ posts: BackendPost[] }>('/api/posts').then((r) => r.posts),
  createPost: (p: Partial<BackendPost>) =>
    req<{ post: BackendPost }>('/api/posts', { method: 'POST', body: JSON.stringify(p) }).then((r) => r.post),
  likePost: (id: string) => req<{ post: BackendPost }>(`/api/posts/${id}/like`, { method: 'POST' }).then((r) => r.post),
}

export interface BackendPost {
  id: string
  authorEmail: string
  authorName: string
  role: Role
  kind: 'image' | 'video'
  activity: string
  caption: string
  mediaColor: string
  durationSec?: number
  likes: number
  at: string
}

// WebSocket URL for real-time consultations.
export function wsUrl(): string {
  return API.replace(/^http/, 'ws') + '/ws'
}

// Load Google Identity Services and render a real Sign-In button.
let gisPromise: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gis_load_failed'))
    document.head.appendChild(s)
  })
  return gisPromise
}

export async function renderGoogleButton(
  el: HTMLElement,
  clientId: string,
  onCredential: (credential: string) => void,
) {
  await loadGis()
  const g = (window as any).google
  g.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: { credential: string }) => onCredential(resp.credential),
  })
  g.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 320, text: 'signin_with' })
}
