// Frontend client for the Panaceamed backend (real Google login + Midtrans
// payments). When VITE_API_URL is unset (e.g. the GitHub Pages demo), the app
// falls back to its in-browser simulation and none of this is used.

import type { Role, Account, Patient, VitalSign, SupportiveResult, EMRRecord, EducationSheet } from './types'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
export const backendEnabled = Boolean(API)

export interface Health {
  ok: boolean
  features: { google: boolean; payments: boolean; ai?: boolean; push?: boolean }
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

// Bearer token (set on login) — robust to third-party cookie blocking when the
// frontend and backend live on different domains. Cookie auth still works too.
const TOKEN_KEY = 'pmd-token'
let authToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
})()
export function setAuthToken(token: string | null) {
  authToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
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
    req<{ user: BackendUser; token?: string }>('/api/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ email, name, role }),
    }).then((r) => {
      if (r.token) setAuthToken(r.token)
      return toAccount(r.user)
    }),
  googleLogin: (credential: string, role: Role) =>
    req<{ user: BackendUser; token?: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, role }),
    }).then((r) => {
      if (r.token) setAuthToken(r.token)
      return toAccount(r.user)
    }),
  logout: () =>
    req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).finally(() => setAuthToken(null)),
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
  // compliance — audit log (owner-only) & SATUSEHAT integration status
  audit: () => req<{ entries: AuditEntry[] }>('/api/audit').then((r) => r.entries),
  stats: () => req<Stats>('/api/stats'),
  satusehatSubmit: (patient: unknown, record: unknown) =>
    req<{ ok: boolean; configured: boolean; summary: { resources: number; conditions: number; observations: number } }>(
      '/api/satusehat/encounter',
      { method: 'POST', body: JSON.stringify({ patient, record }) },
    ),
  doctors: () => req<{ doctors: DoctorRow[] }>('/api/doctors').then((r) => r.doctors),
  verifyDoctor: (id: string, status: 'verified' | 'pending' = 'verified') =>
    req<{ ok: boolean }>(`/api/doctors/${id}/verify`, { method: 'POST', body: JSON.stringify({ status }) }),
  satusehatStatus: () => req<{ configured: boolean; env: string; note: string }>('/api/satusehat/status'),
  // verifier/admin/owner → notify a specific user by email
  notifyUser: (email: string, title: string, body: string, url?: string) =>
    req<{ ok: boolean; sent: number }>('/api/notify/user', { method: 'POST', body: JSON.stringify({ email, title, body, url }) }),
  // in-app notification inbox
  notifications: () => req<{ notifications: Notif[] }>('/api/notifications').then((r) => r.notifications),
  markNotificationsRead: () => req<{ ok: boolean }>('/api/notifications/read', { method: 'POST' }),
  // web push
  pushKey: () => req<{ key: string | null }>('/api/push/key').then((r) => r.key),
  pushSubscribe: (subscription: unknown) =>
    req<{ ok: boolean }>('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  pushUnsubscribe: (endpoint: string) =>
    req<{ ok: boolean }>('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  pushTest: () => req<{ ok: boolean; sent: number }>('/api/push/test', { method: 'POST' }),
  pushBroadcast: (title: string, body: string) =>
    req<{ ok: boolean; sent: number; recipients: number }>('/api/push/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    }),
  // server-side Claude proxy — AI works without the user supplying a key
  aiMessages: (payload: {
    model: string
    system: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    max_tokens?: number
  }) => req<{ text: string }>('/api/ai/messages', { method: 'POST', body: JSON.stringify(payload) }),
  // user preferences (cross-device sync; never carries the API key)
  getSettings: () => req<{ settings: Record<string, unknown> }>('/api/settings').then((r) => r.settings),
  saveSettings: (settings: Record<string, unknown>) =>
    req<{ ok: boolean }>('/api/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
  posts: () => req<{ posts: BackendPost[] }>('/api/posts').then((r) => r.posts),
  createPost: (p: Partial<BackendPost>) =>
    req<{ post: BackendPost }>('/api/posts', { method: 'POST', body: JSON.stringify(p) }).then((r) => r.post),
  likePost: (id: string) => req<{ post: BackendPost }>(`/api/posts/${id}/like`, { method: 'POST' }).then((r) => r.post),
  // clinical persistence
  clinical: () => req<ClinicalData>('/api/clinical'),
  saveRecordRemote: (patientId: string, record: EMRRecord) =>
    req<{ ok: boolean }>('/api/clinical/record', { method: 'POST', body: JSON.stringify({ patientId, record }) }),
  saveEducationRemote: (patientId: string, sheet: EducationSheet) =>
    req<{ ok: boolean }>('/api/clinical/education', { method: 'POST', body: JSON.stringify({ patientId, sheet }) }),
  addVitalRemote: (patientId: string, vital: VitalSign) =>
    req<{ ok: boolean }>('/api/clinical/vital', { method: 'POST', body: JSON.stringify({ patientId, vital }) }),
  addSupportiveRemote: (patientId: string, result: SupportiveResult) =>
    req<{ ok: boolean }>('/api/clinical/supportive', { method: 'POST', body: JSON.stringify({ patientId, result }) }),
  addPatientRemote: (patient: Patient) =>
    req<{ ok: boolean }>('/api/clinical/patient', { method: 'POST', body: JSON.stringify({ patient }) }),
}

export interface ClinicalData {
  patients: Patient[]
  vitals: Record<string, VitalSign[]>
  supportive: Record<string, SupportiveResult[]>
  records: Record<string, EMRRecord>
  education: Record<string, EducationSheet>
}

export interface Notif {
  id: string
  title: string
  body: string
  url?: string
  at: string
  read: boolean
}

export interface Stats {
  totalUsers: number
  doctors: number
  patients: number
  posts: number
  orders: number
  paidOrders: number
  revenueIdr: number
  pushSubscribers: number
  signups7d: { day: string; count: number }[]
  revenue7d: { day: string; idr: number }[]
}

export interface DoctorRow {
  id: string
  email: string
  name: string
  str: string | null
  strStatus: 'pending' | 'verified'
  createdAt: string
}

export interface AuditEntry {
  id: string
  at: string
  userId: string
  userEmail: string
  action: string
  target?: string
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
