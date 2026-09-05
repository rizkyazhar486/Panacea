
// A real price submission shared across every user comparing the same
// facility — this IS the "real-time price" feature: no external pricing API
// exists to connect to, so every visitor sees every submission the instant
// it's saved, timestamped and attributed, instead of a single device's guess.
export interface FacilityPriceSubmission {
  id: string
  facilityId: string
  diagnosisCode?: string
  diagnosisTitle?: string
  currency: string
  low?: number
  high?: number
  confidence: 'estimated' | 'verified'
  source?: string
  submittedByEmail: string
  submittedByName: string
  at: string
}

export interface MarketInstrument { symbol: string; label: string; group: string; unggulan?: boolean }
export interface KatalogMetrik { kunci: string; label: string; kategori: string; satuan: string }
export interface SyncFinding { level: 'error' | 'warn' | 'ok'; judul: string; detail: string; setelan?: string; ubahKe?: string }
export interface WebhookDelivery {
  at: string
  metricGroups: { name: string; samples: number }[]
  workouts: number
  hrSamples: number
  sleepNights: number
  matched: string[]
  newestSampleDate: string | null
}
export interface SymbolHit { symbol: string; name: string; exchange: string | null; type: string | null }
export interface OntologyTerm { id: string; label: string; ontology: 'doid' | 'hp' | 'uberon' | 'fma'; description: string; iri: string }
/** Gambar anatomi/patologi dari Wikimedia Commons. license & artist WAJIB
 *  ditampilkan bersama gambarnya — itu syarat lisensi CC-nya, bukan hiasan. */
export interface AnatomyImage {
  title: string
  url: string
  sourcePage: string
  license: string
  licenseUrl: string
  artist: string
  description: string
}
export interface DrugLabelInfo { brandName: string; genericName: string; purpose: string; mechanismOfAction: string; adverseReactions: string; warnings: string }
export interface MarketCandle { t: number; c: number; o?: number; h?: number; l?: number; v?: number }
export interface MarketQuote {
  symbol: string; name: string; currency: string
  price: number | null; previousClose: number | null
  change: number | null; changePct: number | null
  marketTime: string | null; exchange: string | null
  series: MarketCandle[]
  delayed: true
  source: string
}
// Frontend client for the Panaceamed backend (real Google login + Midtrans
// payments). When VITE_API_URL is unset (e.g. the GitHub Pages demo), the app
// falls back to its in-browser simulation and none of this is used.

import type { Role, Account, Patient, VitalSign, SupportiveResult, EMRRecord, EducationSheet, MedReminder } from './types'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
export const backendEnabled = Boolean(API)
export const apiBaseUrl = API

export interface Health {
  ok: boolean
  features: { google: boolean; payments: boolean; ai?: boolean; push?: boolean; email?: boolean; payout?: boolean; otpEmail?: boolean }
  /**
   * Kemampuan server yang terpasang. TIDAK ADA pada server versi lama, dan
   * ketiadaannya itulah keterangannya — dari situ aplikasi tahu membedakan
   * server yang belum dipasang ulang dari kegagalan yang sesungguhnya.
   */
  kemampuan?: { evidenceJson?: boolean }
  /**
   * Bentuk penyimpanan server. 'berkas' berarti seluruh data hanya ada di
   * cakram sementara dan HILANG pada deploy ulang berikutnya — akun tidak
   * dapat dipakai masuk lagi, dan catatan yang sudah tersinkron lenyap.
   * Tidak ada pada server versi lama; ketiadaannya berarti tidak diketahui,
   * bukan berarti aman.
   */
  penyimpanan?: 'mongo' | 'berkas'
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
  // Live market data (server-proxied Yahoo Finance; free, keyless).
  // `delayed: true` always rides along so no caller can present it as live ticks.
  marketInstruments: () =>
    req<{ instruments: MarketInstrument[]; ranges: string[] }>('/api/markets/instruments'),
  marketQuote: (symbol: string, range: string) =>
    req<MarketQuote>(`/api/markets/quote?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`),
  marketWatchlist: (symbols: string[], range: string) =>
    req<{ quotes: MarketQuote[]; failed: string[] }>(
      `/api/markets/watchlist?symbols=${encodeURIComponent(symbols.join(','))}&range=${encodeURIComponent(range)}`),
  deviceWorkouts: () =>
    req<{ workouts: Record<string, unknown>[]; count: number }>('/api/workouts'),
  metricCatalog: () =>
    req<{ metrics: KatalogMetrik[]; kategori: string[]; total: number }>('/api/health-metrics/catalog'),
  deviceHrNotifications: () =>
    req<{ notifications: Record<string, unknown>[]; count: number }>('/api/hr-notifications'),
  syncDiagnosis: () =>
    req<{ findings: SyncFinding[]; deliveries: number; lastAt: string | null; recent: WebhookDelivery[] }>(
      '/api/health-sync/diagnosis'),
  marketSearch: (q: string) =>
    req<{ results: SymbolHit[] }>(`/api/markets/search?q=${encodeURIComponent(q)}`),
  marketNews: () => req<{ items: LiveNewsItem[]; fetchedAt: number }>('/api/markets/news'),
  anatomyOntology: (terms: string[]) =>
    req<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }>(
      `/api/anatomy/ontology?terms=${encodeURIComponent(terms.join(','))}`),
  drugInfo: (name: string) =>
    req<DrugLabelInfo>(`/api/anatomy/drug?name=${encodeURIComponent(name)}`),
  anatomyStructure: (terms: string[]) =>
    req<{ structures: OntologyTerm[] }>(
      `/api/anatomy/structure?terms=${encodeURIComponent(terms.join(','))}`),
  anatomyImages: (q: string, kind: 'anatomy' | 'pathology' = 'anatomy') =>
    req<{ images: AnatomyImage[] }>(
      `/api/anatomy/images?q=${encodeURIComponent(q)}&kind=${kind}`),
  // in-app notification inbox
  notifications: () => req<{ notifications: Notif[] }>('/api/notifications').then((r) => r.notifications),
  // Heart-rate log. `since` is epoch ms; omit for the last 24 hours.
  hrSeries: (since?: number) =>
    req<{ samples: HrSample[]; from: number; count: number }>(
      `/api/health-series/heart-rate${since ? `?since=${since}` : ''}`,
    ),
  sleepSeries: () => req<{ sessions: SleepNight[] }>('/api/health-series/sleep').then((r) => r.sessions),
  clearHealthSeries: () => req<{ ok: boolean }>('/api/health-series', { method: 'DELETE' }),
  healthAlertContext: () =>
    req<{ suggestedBedtime: string | null; zones: { zone: number; name: string; from: number; to: number; meaning: string }[] }>(
      '/api/health-alerts/context',
    ),
  markNotificationsRead: () => req<{ ok: boolean }>('/api/notifications/read', { method: 'POST' }),
  // web push
  pushKey: () => req<{ key: string | null }>('/api/push/key').then((r) => r.key),
  pushSubscribe: (subscription: unknown) =>
    req<{ ok: boolean }>('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  pushUnsubscribe: (endpoint: string) =>
    req<{ ok: boolean }>('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  /** Keadaan push tanpa mengirim notifikasi apa pun. */
  pushStatusServer: () =>
    req<{
      vapidDiisi: boolean; vapidDicoba: boolean; vapidGalat?: string; langganan: number
      penyimpanan: 'mongo' | 'berkas'; detakDetikLalu?: number | null; hidupDetik?: number
    }>('/api/push/status'),
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
    /** Reply will be machine-parsed — ask the provider for a bare JSON object. */
    json?: boolean
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
  // Shared provider price board — see FacilityPriceSubmission above.
  facilityPrices: (facilityId: string, diagnosisCode?: string) =>
    req<{ prices: FacilityPriceSubmission[] }>(
      `/api/facility-prices?facilityId=${encodeURIComponent(facilityId)}${diagnosisCode ? `&diagnosisCode=${encodeURIComponent(diagnosisCode)}` : ''}`,
    ).then((r) => r.prices),
  submitFacilityPrice: (p: {
    facilityId: string
    diagnosisCode?: string
    diagnosisTitle?: string
    low?: number
    high?: number
    confidence: 'estimated' | 'verified'
    source?: string
  }) => req<{ price: FacilityPriceSubmission }>('/api/facility-prices', { method: 'POST', body: JSON.stringify(p) }).then((r) => r.price),
  // ── Connect: verifikasi, kredit kepercayaan, laporan, blokir ──────────────
  connectSaya: () => req<{
    status: string; alasanReject?: string; kredit: number; bahaya: boolean
    hapusPada?: string; radiusKm: number; diblokir: string[]
    persetujuan: { tujuan: string; pada: string; versiPemberitahuan: string; dicabutPada?: string }[]
    versiPemberitahuan: string
    teleponAkhir?: string
    teleponTerdaftar: boolean
    pelanggaran: { id: string; pada: string; alasan: string; poin: number }[]
    ambang: { awal: number; bahaya: number; hapus: number }
  }>('/api/connect/saya'),
  connectVerifikasi: (data: Record<string, unknown>) =>
    req<{ ok: true }>('/api/connect/verifikasi', { method: 'POST', body: JSON.stringify(data) }),
  connectRadius: (km: number) =>
    req<{ radiusKm: number }>('/api/connect/radius', { method: 'POST', body: JSON.stringify({ km }) }),
  connectTarikPersetujuan: () =>
    req<{ ok: boolean }>('/api/connect/tarik-persetujuan', { method: 'POST' }),
  connectDek: (batas = 50) =>
    req<{ kartu: {
      email: string; nama: string; umur: number; pekerjaan: string
      pendidikan: string; kota: string; jarakKm: number | null; kredit: number
    }[] }>(`/api/connect/dek?batas=${batas}`).then((r) => r.kartu),
  connectBlock: (email: string, buka = false) =>
    req<{ ok: true }>('/api/connect/blokir', { method: 'POST', body: JSON.stringify({ email, buka }) }),
  connectLapor: (email: string, alasan: string, catatan?: string) =>
    req<{ ok: true }>('/api/connect/lapor', { method: 'POST', body: JSON.stringify({ email, alasan, catatan }) }),
  connectTinjau: () => req<{ ajuan: any[]; laporan: any[] }>('/api/connect/tinjau'),
  connectPutusVerifikasi: (email: string, setuju: boolean, alasan?: string) =>
    req<{ ok: true }>('/api/connect/tinjau/verifikasi', { method: 'POST', body: JSON.stringify({ email, setuju, alasan }) }),
  connectPutusLaporan: (id: string, poin: number, catatan?: string) =>
    req<{ ok: true }>('/api/connect/tinjau/laporan', { method: 'POST', body: JSON.stringify({ id, poin, catatan }) }),
  connectCredit: (email: string, poin: number, alasan?: string, pulihkan = false) =>
    req<{ kredit: number; bahaya: boolean; dijadwalkanHapus: boolean }>(
      '/api/connect/tinjau/kredit', { method: 'POST', body: JSON.stringify({ email, poin, alasan, pulihkan }) }),

  // Hanya nama, peran dan gambar — server sengaja tidak mengembalikan email.
  cariOrang: (q: string) =>
    req<{ results: { id: string; name: string; role: Role; picture?: string }[] }>(
      `/api/users/search?q=${encodeURIComponent(q)}`).then((r) => r.results),
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
  cariPangan: (q: string, kode?: string) =>
    req<{ pangan: { kode?: string; nama: string; merek?: string; kkal100?: number; karbo100?: number; protein100?: number; lemak100?: number; serat100?: number; garam100?: number; sumber: string }[] }>(
      `/api/pangan?q=${encodeURIComponent(q)}${kode ? `&kode=${encodeURIComponent(kode)}` : ''}`,
    ).then((r) => r.pangan),
  simpanRingkasan: (ringkasan: Record<string, unknown>) =>
    req<{ ringkasan: Record<string, unknown> }>('/api/ringkasan', { method: 'PUT', body: JSON.stringify({ ringkasan }) }),
  lingkungan: (kota: string) =>
    req<{
      kota: string; aqi?: number; pm25?: number; pm10?: number; uv?: number; uvMaks?: number
      suhuC?: number; terasaC?: number; lembapPct?: number; terbit?: string; terbenam?: string
      sumber: string; error?: string
    }>(
      `/api/lingkungan?kota=${encodeURIComponent(kota)}`,
    ),
  getSportsLeagues: () => req<{ leagues: { id: string; label: string }[]; unavailable: { leagueId: string; label: string; unavailable: true; reason: string }[] }>('/api/sports/leagues'),
  getClinicalCalcAccess: () =>
    req<{ unlocked: boolean; free: boolean; limit: number; slotsLeft: number; pricePnc: number; priceIdr: number }>('/api/clinical-calculators/access'),
  unlockClinicalCalcPnc: () =>
    req<{ ok: boolean; unlocked: boolean; balance: number }>('/api/clinical-calculators/unlock-pnc', { method: 'POST' }),
  getSportsScores: (league: string, dates?: string) =>
    req<{ leagueId: string; label: string; events: unknown[]; error?: string }>(
      `/api/sports/scores?league=${encodeURIComponent(league)}${dates ? `&dates=${encodeURIComponent(dates)}` : ''}`,
    ),
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

export interface HrSample {
  /** Epoch milliseconds. */
  t: number
  bpm: number
  lo?: number
  hi?: number
  kind: 'heart_rate' | 'resting' | 'walking_avg' | 'workout'
}

export interface SleepNight {
  date: string
  start?: string
  end?: string
  totalH?: number
  deepH?: number
  remH?: number
  coreH?: number
  awakeH?: number
  inBedH?: number
  source?: string
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
