// Frontend client for the Panaceamed backend (real Google login + Midtrans
// payments). When VITE_API_URL is unset (e.g. the GitHub Pages demo), the app
// falls back to its in-browser simulation and none of this is used.

import type { Role, Account, Patient, VitalSign, SupportiveResult, EMRRecord, EducationSheet, MedReminder } from './types'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
export const backendEnabled = Boolean(API)
export const apiBaseUrl = API

export interface Health {
  ok: boolean
  features: { google: boolean; payments: boolean; ai?: boolean; push?: boolean; email?: boolean; payout?: boolean; otp?: boolean; otpEmail?: boolean }
  aiConsultPnc?: number
  tokenToIdr: number
  midtransClientKey: string | null
  googleClientId: string | null
  promo?: { limit: number; used: number; slotsLeft: number; discountPct: number }
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
  promo: () => req<{ limit: number; used: number; slotsLeft: number; discountPct: number; eligible: boolean }>('/api/promo'),
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
  otpStart: (phone: string) =>
    req<{ ok: boolean; phone: string }>('/api/auth/otp/start', { method: 'POST', body: JSON.stringify({ phone }) }),
  emailOtpStart: (email: string) =>
    req<{ ok: boolean; email: string }>('/api/auth/otp/email/start', { method: 'POST', body: JSON.stringify({ email }) }),
  emailOtpVerify: (email: string, code: string, name: string, role: Role) =>
    req<{ user: BackendUser; token?: string }>('/api/auth/otp/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code, name, role }),
    }).then((r) => {
      if (r.token) setAuthToken(r.token)
      return toAccount(r.user)
    }),
  otpVerify: (phone: string, code: string, name: string, role: Role) =>
    req<{ user: BackendUser; token?: string }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name, role }),
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
  createPayment: (amountPnc: number, method: string, purpose?: string) =>
    req<{ live: boolean; orderId: string; amountIdr: number; token?: string; redirectUrl?: string; clientKey?: string }>(
      '/api/payments/create',
      { method: 'POST', body: JSON.stringify({ amountPnc, method, purpose }) },
    ),
  confirmPayment: (orderId: string) =>
    req<{ ok: boolean }>('/api/payments/confirm', { method: 'POST', body: JSON.stringify({ orderId }) }),
  paymentStatus: (orderId: string) =>
    req<{ status: 'pending' | 'paid' | 'failed' }>(`/api/payments/status/${orderId}`),
  topupRequest: (amountPnc: number) =>
    req<{ ok: boolean; request: ManualTopup }>('/api/wallet/topup-request', { method: 'POST', body: JSON.stringify({ amountPnc }) }),
  listTopups: () => req<{ requests: ManualTopup[] }>('/api/wallet/topups').then((r) => r.requests),
  submitApplication: (info: Record<string, string>) =>
    req<{ ok: boolean; application: Application }>('/api/applications', { method: 'POST', body: JSON.stringify(info) }),
  listApplications: () => req<{ applications: Application[] }>('/api/applications').then((r) => r.applications),
  decideApplication: (id: string, grant: boolean) =>
    req<{ ok: boolean; application: Application }>('/api/applications/decide', { method: 'POST', body: JSON.stringify({ id, grant }) }),
  decideTopup: (id: string, approve: boolean) =>
    req<{ ok: boolean; request: ManualTopup }>('/api/wallet/topups/decide', { method: 'POST', body: JSON.stringify({ id, approve }) }),
  withdraw: (amountPnc: number, bank: string, accountNumber: string, accountHolder: string) =>
    req<{ ok: boolean; balance: number; payout?: { live: boolean; status: 'queued' | 'processed' | 'manual'; referenceNo?: string; detail?: string } }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amountPnc, bank, accountNumber, accountHolder }),
    }),
  // compliance — audit log (owner-only) & SATUSEHAT integration status
  audit: () => req<{ entries: AuditEntry[] }>('/api/audit').then((r) => r.entries),
  stats: () => req<Stats>('/api/stats'),
  ownerUsers: () => req<{ users: UserDirectoryRow[] }>('/api/owner/users').then((r) => r.users),
  submitFeedback: (kind: FeedbackKind, text: string) =>
    req<{ ok: boolean; entry: FeedbackEntry }>('/api/feedback', { method: 'POST', body: JSON.stringify({ kind, text }) }),
  listFeedback: () => req<{ feedback: FeedbackEntry[] }>('/api/feedback').then((r) => r.feedback),
  markFeedbackRead: (id: string) => req<{ ok: boolean }>(`/api/feedback/${id}/read`, { method: 'POST' }),
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
  // creator subscriptions (exclusive content, PNC split)
  creatorSubs: () => req<{ authors: string[]; price: number }>('/api/creator/subs'),
  creatorSubscribe: (authorEmail: string) =>
    req<{ ok: boolean; balance: number; expires: string; authorCut: number; adminCut: number }>('/api/creator/subscribe', { method: 'POST', body: JSON.stringify({ authorEmail }) }),
  // live medical news (server-proxied Google News RSS; free, keyless)
  news: () => req<{ items: LiveNewsItem[]; fetchedAt: number }>('/api/news'),
  // in-app notification inbox
  notifications: () => req<{ notifications: Notif[] }>('/api/notifications').then((r) => r.notifications),
  markNotificationsRead: () => req<{ ok: boolean }>('/api/notifications/read', { method: 'POST' }),
  // web push
  pushKey: () => req<{ key: string | null }>('/api/push/key').then((r) => r.key),
  pushSubscribe: (subscription: unknown) =>
    req<{ ok: boolean }>('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  pushUnsubscribe: (endpoint: string) =>
    req<{ ok: boolean }>('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  pushTest: () => req<{ ok: boolean; sent: number; reason?: string }>('/api/push/test', { method: 'POST' }),
  pushBroadcast: (title: string, body: string) =>
    req<{ ok: boolean; sent: number; recipients: number }>('/api/push/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    }),
  listReminders: () => req<{ reminders: MedReminder[] }>('/api/reminders').then((r) => r.reminders),
  addReminder: (r: { medName: string; dose: string; timeOfDay: string; nextFireAt: string }) =>
    req<{ reminder: MedReminder }>('/api/reminders', { method: 'POST', body: JSON.stringify(r) }).then((r) => r.reminder),
  updateReminder: (id: string, patch: Partial<{ medName: string; dose: string; timeOfDay: string; nextFireAt: string; active: boolean }>) =>
    req<{ reminder: MedReminder }>(`/api/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => r.reminder),
  removeReminder: (id: string) => req<{ ok: boolean }>(`/api/reminders/${id}`, { method: 'DELETE' }),
  // server-side Claude proxy — AI works without the user supplying a key
  aiVision: (image: string, prompt?: string) =>
    req<{ text: string }>('/api/ai/vision', { method: 'POST', body: JSON.stringify({ image, prompt }) }),
  aiConsult: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    req<{ text: string; charged: number; balance: number }>('/api/ai/consult', { method: 'POST', body: JSON.stringify({ messages }) }),
  aiMessages: (payload: {
    model: string
    system: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    max_tokens?: number
  }) => req<{ text: string }>('/api/ai/messages', { method: 'POST', body: JSON.stringify(payload) }),
  aiOperator: (mode: 'briefing' | 'content' | 'social' | 'seo' | 'ads' | 'ops') =>
    req<{ text: string; mode: string; pending?: { topups: number; topupIdr: number; doctors: number } }>(
      '/api/ai/operator',
      { method: 'POST', body: JSON.stringify({ mode }) },
    ),
  // user preferences (cross-device sync; never carries the API key)
  getSettings: () => req<{ settings: Record<string, unknown> }>('/api/settings').then((r) => r.settings),
  saveSettings: (settings: Record<string, unknown>) =>
    req<{ ok: boolean }>('/api/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
  posts: () => req<{ posts: BackendPost[] }>('/api/posts').then((r) => r.posts),
  createPost: (p: Partial<BackendPost>) =>
    req<{ post: BackendPost }>('/api/posts', { method: 'POST', body: JSON.stringify(p) }).then((r) => r.post),
  likePost: (id: string) => req<{ post: BackendPost }>(`/api/posts/${id}/like`, { method: 'POST' }).then((r) => r.post),
  reactPost: (id: string, emoji: string) =>
    req<{ post: BackendPost }>(`/api/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }).then((r) => r.post),
  deletePost: (id: string) => req<{ ok: boolean }>(`/api/posts/${id}`, { method: 'DELETE' }),
  // Per-user health profile (manual / WHOOP / Apple Watch / other)
  getHealthProfile: () => req<{ profile: Record<string, unknown> }>('/api/health-profile').then((r) => r.profile),
  saveHealthProfile: (profile: Record<string, unknown>) =>
    req<{ ok: boolean; profile: Record<string, unknown> }>('/api/health-profile', { method: 'PUT', body: JSON.stringify({ profile }) }).then((r) => r.profile),
  // Apple Health auto-sync via the "Health Auto Export" app's REST API automation.
  getHealthWebhookToken: () => req<{ token: string }>('/api/health-profile/webhook-token').then((r) => r.token),
  rotateHealthWebhookToken: () => req<{ token: string }>('/api/health-profile/webhook-token/rotate', { method: 'POST' }).then((r) => r.token),
  // Live sports scores (free sources — see server/src/sports.ts for coverage & gaps)
  getSportsLeagues: () => req<{ leagues: { id: string; label: string }[]; unavailable: { leagueId: string; label: string; unavailable: true; reason: string }[] }>('/api/sports/leagues'),
  getClinicalCalcAccess: () =>
    req<{ unlocked: boolean; free: boolean; limit: number; slotsLeft: number; pricePnc: number; priceIdr: number }>('/api/clinical-calculators/access'),
  unlockClinicalCalcPnc: () =>
    req<{ ok: boolean; unlocked: boolean; balance: number }>('/api/clinical-calculators/unlock-pnc', { method: 'POST' }),
  getSportsScores: (league: string) => req<{ leagueId: string; label: string; events: unknown[]; error?: string }>(`/api/sports/scores?league=${encodeURIComponent(league)}`),
  getF1Info: () => req<{ next?: { raceName: string; circuit: string; location: string; date: string; time?: string }; lastRaceName?: string; lastPodium?: { position: string; driver: string; constructor: string }[]; error?: string }>('/api/sports/f1'),
  getMotoGpInfo: () => req<{ next?: { name: string; circuit: string; country: string; date: string }; lastRaceName?: string; lastRaceDate?: string; error?: string }>('/api/sports/motogp'),
  searchPubmed: (q: string) => req<{ articles: { pmid: string; title: string; authors: string; journal: string; year: string; url: string }[]; error?: string }>(`/api/evidence/pubmed?q=${encodeURIComponent(q)}`),
  searchTrials: (q: string, recruiting: boolean, country: string) => req<{ trials: { nctId: string; title: string; status: string; conditions: string; phase: string; locations: string; url: string }[]; error?: string }>(`/api/trials?q=${encodeURIComponent(q)}${recruiting ? '&recruiting=1' : ''}${country ? `&country=${encodeURIComponent(country)}` : ''}`),
  lookupDrug: (q: string) => req<{ drug: { brand: string; generic: string; purpose: string; usage: string; warnings: string; dosage: string; adverse: string; manufacturer: string } | null; error?: string }>(`/api/drugs/label?q=${encodeURIComponent(q)}`),
  lookupGene: (q: string) => req<{ gene: { symbol: string; name: string; summary: string; aliases: string[]; type: string; chromosome: string; location: string; entrezId: string; ensemblId: string } | null; error?: string }>(`/api/genes/info?q=${encodeURIComponent(q)}`),
  findRelatedDrugs: (q: string) => req<{ drugs: { name: string; tty: string }[]; error?: string }>(`/api/drugs/related?q=${encodeURIComponent(q)}`),
  getSportsFavorites: () => req<{ teams: string[] }>('/api/sports/favorites').then((r) => r.teams),
  saveSportsFavorites: (teams: string[]) => req<{ teams: string[] }>('/api/sports/favorites', { method: 'PUT', body: JSON.stringify({ teams }) }).then((r) => r.teams),
  patchPost: (id: string, patch: Record<string, unknown>) =>
    req<{ post: BackendPost }>(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => r.post),
  // Club Hub meets — real, server-persisted; join counts are actual RSVPs.
  meets: () => req<{ meets: BackendMeet[] }>('/api/meets').then((r) => r.meets),
  createMeet: (m: Partial<BackendMeet>) =>
    req<{ meet: BackendMeet }>('/api/meets', { method: 'POST', body: JSON.stringify(m) }).then((r) => r.meet),
  rsvpMeet: (id: string, status: 'joined' | 'maybe' | 'none') =>
    req<{ meet: BackendMeet }>(`/api/meets/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }).then((r) => r.meet),
  deleteMeet: (id: string) => req<{ ok: boolean }>(`/api/meets/${id}`, { method: 'DELETE' }),
  // Club Hub clubs — real, server-persisted; member counts are actual joins.
  clubs: () => req<{ clubs: BackendClub[] }>('/api/clubs').then((r) => r.clubs),
  createClub: (c: Partial<BackendClub>) =>
    req<{ club: BackendClub }>('/api/clubs', { method: 'POST', body: JSON.stringify(c) }).then((r) => r.club),
  joinClub: (id: string) => req<{ club: BackendClub }>(`/api/clubs/${id}/join`, { method: 'POST' }).then((r) => r.club),
  deleteClub: (id: string) => req<{ ok: boolean }>(`/api/clubs/${id}`, { method: 'DELETE' }),
  // Second opinion — AI drafts privately for a doctor to review; patients only
  // ever receive the doctor's finalized text.
  submitSecondOpinion: (b: { currentDiagnosis: string; currentTreatment: string; symptoms: string; history: string }) =>
    req<{ request: BackendSecondOpinion }>('/api/second-opinion', { method: 'POST', body: JSON.stringify(b) }).then((r) => r.request),
  listSecondOpinions: () => req<{ requests: BackendSecondOpinion[] }>('/api/second-opinion').then((r) => r.requests),
  completeSecondOpinion: (id: string, finalOpinion: string) =>
    req<{ request: BackendSecondOpinion }>(`/api/second-opinion/${id}/complete`, { method: 'POST', body: JSON.stringify({ finalOpinion }) }).then((r) => r.request),
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

export interface LiveNewsItem {
  title: string
  link: string
  source: string
  pubDate: string
  region: 'domestic' | 'international'
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

export interface UserDirectoryRow {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  walletBalance: number
  ordersCount: number
  paidOrdersCount: number
  totalPaidIdr: number
  subscriptions: {
    clinicalCalcUnlocked: boolean
    longevityActive: boolean
    longevityExpires: string | null
    chronicActive: boolean
    chronicLifetime: boolean
    chronicExpires: string | null
  }
}

export type FeedbackKind = 'Suggestion' | 'Problem/Bug' | 'Question' | 'Compliment' | 'Feature Request'
export interface FeedbackEntry {
  id: string
  userId: string
  userEmail: string
  userName: string
  kind: FeedbackKind
  text: string
  at: string
  read: boolean
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

export interface ManualTopup {
  id: string
  userId: string
  email: string
  name: string
  amountPnc: number
  amountIdr: number
  status: 'pending' | 'approved' | 'rejected'
  at: string
  decidedAt?: string
}

export interface Application {
  id: string
  userId: string
  email: string
  name: string
  role: string
  str?: string
  gelar?: string
  keahlian?: string
  universitas?: string
  tahunLulus?: string
  spesialis?: string
  subspesialis?: string
  pdfName?: string
  aiVerdict?: string
  status: 'pending' | 'granted' | 'rejected'
  at: string
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
  reactions?: Record<string, string[]>
  at: string
}

export interface BackendMeet {
  id: string
  title: string
  club: string
  tag: string
  venue: string
  address: string
  day: number
  time: string
  durH: number
  cap: number
  feeRp: number
  notes: string[]
  lat: number
  lng: number
  emoji: string
  hostEmail: string
  hostName: string
  participants: string[]
  maybes: string[]
  createdAt: string
}

export interface BackendClub {
  id: string
  name: string
  emoji: string
  sport: string
  level: string
  desc: string
  hostEmail: string
  hostName: string
  members: string[]
  createdAt: string
}

export interface BackendSecondOpinion {
  id: string
  patientEmail: string
  patientName: string
  currentDiagnosis: string
  currentTreatment: string
  symptoms: string
  history: string
  status: 'pending_doctor' | 'completed'
  aiDraft?: string // present only in the doctor's queue view, never sent to the patient
  doctorEmail?: string
  doctorName?: string
  finalOpinion?: string
  createdAt: string
  completedAt?: string
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
