import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, backendEnabled, type BackendPost } from './api'
import type {
  AppState,
  Patient,
  VitalSign,
  SupportiveResult,
  ChatMessage,
  EMRRecord,
  EducationSheet,
  Material,
  Contributor,
  WalletTx,
  Subscription,
  SubscriptionPlan,
  AIReview,
  VerifierReview,
  Account,
  Role,
  SocialPost,
  Story,
  CheckIn,
  MoodEntry,
  SupportMessage,
  Challenge,
  Circle,
  GratitudeNote,
  SportCommunity,
  SelfVital,
  SleepLog,
  MedReminder,
  Vo2MaxEntry,
  HealthGoal,
  GpsActivity,
  FoodEntry,
  WellnessDay,
  ConsultSession,
  EmailMsg,
  Order,
  PharmacyProduct,
  ProfileEdit,
  TxType,
} from './types'
import { DEFAULT_PRODUCTS } from './pharmacy'

const STORAGE_KEY = 'panaceamed.state.v3'

// The platform owner. Only this account may switch modes (owner/pasien/dokter)
// and manage which emails are allowed to sign in as Admin.
export const OWNER_EMAIL = 'rizkyazhar486@gmail.com'

export const TOKEN_TO_IDR = 1000 // 1 PNC = Rp1.000 (simulasi)
export const PLATFORM_FEE = 0.2 // (legacy) 20% — retained for compatibility
// Marketplace: every content/material sale is charged a FLAT 5 PNC platform fee
// per article (the rest is the author's royalty).
export const MARKETPLACE_FEE_PNC = 5

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// #9: convert a backend post into the richer local SocialPost shape.
function backendPostToSocial(p: BackendPost): SocialPost {
  return {
    id: p.id,
    authorEmail: p.authorEmail,
    authorName: p.authorName,
    role: p.role,
    kind: p.kind,
    activity: p.activity,
    caption: p.caption,
    mediaColor: p.mediaColor,
    durationSec: p.durationSec,
    photos: [],
    likes: p.likes,
    comments: 0,
    commentList: [],
    reposts: 0,
    at: p.at,
  }
}

// #9: merge server posts with any local-only (offline) posts, newest first.
function mergePosts(server: SocialPost[], local: SocialPost[]): SocialPost[] {
  const serverIds = new Set(server.map((p) => p.id))
  const localOnly = local.filter((p) => !serverIds.has(p.id))
  return [...localOnly, ...server].sort((a, b) => (a.at < b.at ? 1 : -1))
}

// Placeholder identities used only as safe fallbacks when no real data exists
// yet (e.g. a doctor before adding any patient). These are NOT seeded content.
const PLACEHOLDER_PATIENT: Patient = {
  id: 'none', name: 'Belum ada pasien', sex: 'L', dob: '1990-01-01', mrn: '—',
  heightCm: 165, weightKg: 60, allergies: [], chronicConditions: [], riskFlags: [], avatarColor: '#94a3b8',
}
const PLACEHOLDER_CONTRIBUTOR: Contributor = {
  id: 'me', name: 'Saya', role: 'Dokter', specialty: '', verified: false, canVerify: false,
}

// Build a patient record from a patient account's registration details.
function patientFromAccount(account: Account): Patient {
  const year = new Date().getFullYear() - (account.age ?? 30)
  return {
    id: 'self-' + account.email.replace(/[^a-z0-9]/gi, '').slice(0, 16),
    name: account.name,
    sex: account.sex ?? 'L',
    // Prefer the real date of birth from the datepicker; fall back to age estimate.
    dob: account.dob || `${year}-01-01`,
    mrn: 'PMD-' + account.email.replace(/[^0-9]/g, '').slice(0, 6).padStart(6, '0'),
    heightCm: 165,
    weightKg: 60,
    allergies: [],
    chronicConditions: [],
    riskFlags: [],
    avatarColor: '#00BF63',
  }
}

// A clean, empty application state — no dummy/demo content.
function seed(): AppState {
  return {
    patients: [],
    activePatientId: 'none',
    vitals: {},
    supportive: {},
    chats: {},
    records: {},
    education: {},
    materials: [],
    ownedMaterialIds: [],
    contributors: [],
    wallet: { balance: 0, transactions: [] },
    subscription: { plan: 'none' } as Subscription,
    currentUserId: 'me',
    account: null,
    adminEmails: [OWNER_EMAIL],
    authorSubPrices: {},
    authorSubs: {},
    posts: [],
    stories: [],
    follows: [],
    presence: {},
    checkIns: [],
    moods: [],
    supportMessages: [],
    challenges: [],
    circles: [],
    gratitudes: [],
    communities: [],
    selfVitals: [],
    sleepLogs: [],
    medReminders: [],
    eduBookmarks: [],
    quizScore: { correct: 0, total: 0 },
    vo2maxLog: [],
    goals: [],
    gpsActivities: [],
    foods: [],
    wellness: {},
    consults: [],
    orders: [],
    products: DEFAULT_PRODUCTS,
    profiles: {},
    emails: [],
    settings: {
      apiKey: '',
      model: 'claude-sonnet-4-6',
      doctorName: '',
      notifVitals: true,
      notifEmail: true,
      notifSms: false,
      notifAiInsights: true,
      notifBroadcasts: false,
      notifTransactions: true,
      twoFactor: false,
      biometricLock: false,
    },
  }
}

// --- Remembered session: keep the user logged in for 7 days, then auto-logout.
const SESSION_KEY = 'panaceamed.session.v1'
const SESSION_TTL = 7 * 86400000 // 7 hari

function saveSession(account: Account) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ account, loginAt: Date.now() })) } catch { /* ignore */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}
// Returns the remembered account if the session is still within 7 days, else
// clears it (auto-logout) and returns null.
function loadSession(): Account | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { account, loginAt } = JSON.parse(raw) as { account: Account; loginAt: number }
    if (!account || typeof loginAt !== 'number' || Date.now() - loginAt > SESSION_TTL) { clearSession(); return null }
    return account
  } catch { return null }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const base = raw ? { ...seed(), ...JSON.parse(raw) } : seed()
    // Restore a remembered login (≤7 days) so frequent users stay signed in.
    return { ...base, account: loadSession() }
  } catch {
    /* ignore */
  }
  return seed()
}

interface Store {
  state: AppState
  activePatient: Patient
  currentUser: Contributor
  account: Account | null
  setActivePatient: (id: string) => void
  addPatient: (p: Patient) => void
  addVital: (patientId: string, vital: VitalSign) => void
  addSupportive: (patientId: string, r: SupportiveResult) => void
  setChat: (patientId: string, messages: ChatMessage[]) => void
  saveRecord: (record: EMRRecord) => void
  saveEducation: (patientId: string, sheet: EducationSheet) => void
  updateSettings: (partial: Partial<AppState['settings']>) => void
  resetDemo: () => void
  // marketplace + billing
  setCurrentUser: (id: string) => void
  depositTokens: (amount: number, note: string) => void
  buyMaterial: (materialId: string) => { ok: boolean; reason?: string }
  uploadMaterial: (m: Material) => void
  setMaterialAIReview: (id: string, review: AIReview) => void
  setMaterialVerifierReview: (id: string, review: VerifierReview) => void
  subscribe: (plan: SubscriptionPlan, seats?: number) => void
  setAuthorSubPrice: (authorEmail: string, priceTokens: number) => void
  subscribeAuthor: (authorEmail: string) => { ok: boolean; reason?: string }
  // auth
  login: (account: Account) => void
  logout: () => void
  syncWalletBalance: (balance: number) => void // mirror the server PNC balance
  verifyStr: () => void // mark the current doctor's STR as verified
  setMode: (role: Role) => void // owner-only: switch acting role
  addAdminEmail: (email: string) => void
  removeAdminEmail: (email: string) => void
  // social + nutrition + consult + email + withdraw
  addPost: (p: SocialPost) => void
  updatePost: (id: string, partial: Partial<SocialPost>) => void
  deletePost: (id: string) => void
  toggleLike: (id: string) => void
  toggleRepost: (id: string) => void
  toggleBookmark: (id: string) => void
  toggleFollow: (email: string) => void
  addStory: (s: Story) => void
  addStoryComment: (storyId: string, text: string, authorName: string) => void
  addStoryReaction: (storyId: string, emoji: string) => void
  deleteStory: (id: string) => void
  toggleReaction: (postId: string, emoji: string) => void
  // Komunitas Sehat — interpersonal-relationship health features
  heartbeat: () => void // updates own presence timestamp (online indicator)
  setBuddy: (name: string) => void // item 1: pair a Health Buddy
  checkInToday: () => void // item 1: daily accountability check-in
  addMood: (mood: MoodEntry['mood'], note?: string) => void // item 4
  sendSupport: (toName: string, text: string) => void // items 4 & 6
  startChallenge: (title: string, unit: string, goal: number, days: number) => void // item 5
  bumpChallenge: (challengeId: string, amount: number) => void // item 5
  createCircle: (name: string, memberNames: string[]) => void // item 9
  addGratitude: (toName: string, text: string) => void // item 10
  createCommunity: (name: string, sportTag: string) => void // item 10: discover/start sport-interest groups
  joinCommunity: (id: string, memberName: string) => void // item 10
  // Pusat Kesehatan Realtime — edukasi, news, fungsionalitas, kalkulasi, monitoring
  addSelfVital: (v: Omit<SelfVital, 'id' | 'at'>) => void
  addSleepLog: (hours: number, bedtimeConsistent: boolean) => void
  addMedReminder: (name: string, time: string) => void
  markMedTaken: (id: string) => void
  toggleEduBookmark: (articleId: string) => void
  answerQuiz: (correct: boolean) => void
  logVo2Max: (value: number, method: string) => void
  addGoal: (g: Omit<HealthGoal, 'id'>) => void
  removeGoal: (id: string) => void
  addGpsActivity: (a: Omit<GpsActivity, 'id'>) => void // auto from GPS, never manual
  buyLongevitySub: () => { ok: boolean; reason?: string }
  buyChronicSub: (plan: 'monthly' | 'lifetime') => { ok: boolean; reason?: string }
  addFood: (f: FoodEntry) => void
  logWellness: (date: string, patch: Partial<Omit<WellnessDay, 'date'>>) => void
  addOrder: (o: Order) => void
  addProduct: (p: PharmacyProduct) => void
  updateProduct: (id: string, partial: Partial<PharmacyProduct>) => void
  removeProduct: (id: string) => void
  updateProfile: (email: string, partial: ProfileEdit) => void
  bookConsult: (c: ConsultSession) => void
  sendEmail: (e: EmailMsg) => void
  withdrawTokens: (amount: number, bank: string) => { ok: boolean; reason?: string }
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)

  // Persist everything EXCEPT the session account, so each visit starts at the
  // public landing and the role can be chosen freely (fixes role being "stuck").
  useEffect(() => {
    const { account: _account, ...persist } = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist))
    } catch {
      // Storage quota exceeded (e.g. many uploaded photos) — drop heavy media
      // from the persisted copy so the app keeps working.
      try {
        const slim = { ...persist, posts: persist.posts.map((p) => ({ ...p, photos: undefined, videoUrl: undefined })) }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
      } catch {
        /* give up persisting this update */
      }
    }
  }, [state])

  // Auto-login DISABLED by request: the app always starts at the landing/login,
  // even if a backend session cookie exists. Users sign in explicitly each visit.
  const bootedRef = useRef(false)
  useEffect(() => {
    bootedRef.current = true
    // Intentionally no api.me() restore — no auto-login.
  }, [])

  // When a backend is configured, hydrate clinical data from the server on login.
  const hydratedFor = useRef<string>('')
  useEffect(() => {
    const email = state.account?.email
    if (!backendEnabled || !email || hydratedFor.current === email) return
    hydratedFor.current = email
    api
      .clinical()
      .then((data) =>
        setState((st) => ({
          ...st,
          patients: data.patients?.length ? data.patients : st.patients,
          vitals: { ...st.vitals, ...(data.vitals ?? {}) },
          supportive: { ...st.supportive, ...(data.supportive ?? {}) },
          records: { ...st.records, ...(data.records ?? {}) },
          education: { ...st.education, ...(data.education ?? {}) },
        })),
      )
      .catch(() => {
        hydratedFor.current = '' // allow retry on next change
      })
    // Pull synced preferences (notifications, security toggles, model, doctor
    // name, STR verification). The server never stores the API key, so the
    // local key is kept. STR status is restored onto the account so a verified
    // doctor stays verified across devices/reloads (autologin-safe).
    api
      .getSettings()
      .then((remote) => {
        if (remote && Object.keys(remote).length) {
          setState((st) => {
            const next = { ...st, settings: { ...st.settings, ...remote } }
            if (remote.strStatus && st.account?.role === 'dokter') {
              next.account = { ...st.account, strStatus: remote.strStatus as Account['strStatus'] }
            }
            // Chronic-care subscription is activated server-side after payment;
            // restore it so access persists across devices/reloads.
            if (remote.chronicLifetime) next.chronicLifetime = true
            if (remote.chronicSubExpires) next.chronicSubExpires = remote.chronicSubExpires as string
            return next
          })
        }
      })
      .catch(() => {})
    // The server wallet is the source of truth for PNC — mirror it locally so
    // the header balance stays accurate (e.g. after server-side AI charges).
    api
      .wallet()
      .then((w) => setState((st) => ({ ...st, wallet: { ...st.wallet, balance: w.balance } })))
      .catch(() => {})
  }, [state.account?.email])

  // #9: multi-user social feed — pull posts from the server on login and poll so
  // posts/likes from other users appear near-realtime. Local-only (offline) posts
  // are preserved via mergePosts. No-op when no backend is configured.
  useEffect(() => {
    if (!backendEnabled || !state.account?.email) return
    let alive = true
    const pull = () =>
      api
        .posts()
        .then((server) => {
          if (!alive) return
          const mapped = server.map(backendPostToSocial)
          setState((st) => ({ ...st, posts: mergePosts(mapped, st.posts) }))
        })
        .catch(() => {})
    pull()
    const t = setInterval(pull, 15_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [state.account?.email])

  const store = useMemo<Store>(() => {
    const activePatient =
      state.patients.find((p) => p.id === state.activePatientId) ?? state.patients[0] ?? PLACEHOLDER_PATIENT
    const currentUser =
      state.contributors.find((c) => c.id === state.currentUserId) ?? state.contributors[0] ?? PLACEHOLDER_CONTRIBUTOR
    return {
      state,
      activePatient,
      currentUser,
      account: state.account,
      setActivePatient: (id) => setState((st) => ({ ...st, activePatientId: id })),
      addPatient: (p) => {
        if (backendEnabled) api.addPatientRemote(p).catch(() => {})
        setState((st) => ({
          ...st,
          patients: [...st.patients, p],
          vitals: { ...st.vitals, [p.id]: [] },
          supportive: { ...st.supportive, [p.id]: [] },
          chats: { ...st.chats, [p.id]: [] },
          activePatientId: p.id,
        }))
      },
      addVital: (patientId, vital) => {
        if (backendEnabled) api.addVitalRemote(patientId, vital).catch(() => {})
        setState((st) => ({
          ...st,
          vitals: { ...st.vitals, [patientId]: [...(st.vitals[patientId] ?? []), vital] },
        }))
      },
      addSupportive: (patientId, r) => {
        if (backendEnabled) api.addSupportiveRemote(patientId, r).catch(() => {})
        setState((st) => ({
          ...st,
          supportive: {
            ...st.supportive,
            [patientId]: [...(st.supportive[patientId] ?? []), r],
          },
        }))
      },
      setChat: (patientId, messages) =>
        setState((st) => ({ ...st, chats: { ...st.chats, [patientId]: messages } })),
      saveRecord: (record) => {
        if (backendEnabled) api.saveRecordRemote(record.patientId, record).catch(() => {})
        setState((st) => ({ ...st, records: { ...st.records, [record.patientId]: record } }))
      },
      saveEducation: (patientId, sheet) => {
        if (backendEnabled) api.saveEducationRemote(patientId, sheet).catch(() => {})
        setState((st) => ({ ...st, education: { ...st.education, [patientId]: sheet } }))
      },
      updateSettings: (partial) => {
        // Sync prefs to the backend (cross-device), but never the API key.
        if (backendEnabled) {
          const { apiKey: _k, ...sync } = partial
          if (Object.keys(sync).length) api.saveSettings(sync).catch(() => {})
        }
        setState((st) => ({ ...st, settings: { ...st.settings, ...partial } }))
      },
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY)
        setState(seed())
      },
      setCurrentUser: (id) => setState((st) => ({ ...st, currentUserId: id })),
      depositTokens: (amount, note) =>
        setState((st) => ({
          ...st,
          wallet: {
            balance: st.wallet.balance + amount,
            transactions: [
              { id: uid(), type: 'deposit', amount, note, at: new Date().toISOString() },
              ...st.wallet.transactions,
            ],
          },
        })),
      buyMaterial: (materialId) => {
        const m = state.materials.find((x) => x.id === materialId)
        if (!m) return { ok: false, reason: 'Materi tidak ditemukan.' }
        if (state.ownedMaterialIds.includes(materialId)) return { ok: false, reason: 'Sudah dimiliki.' }
        if (state.wallet.balance < m.priceTokens)
          return { ok: false, reason: 'Saldo token tidak cukup. Silakan deposit.' }
        setState((st) => {
          const now = new Date().toISOString()
          // Flat 5 PNC platform fee per article; author keeps the remainder.
          const fee = Math.min(MARKETPLACE_FEE_PNC, m.priceTokens)
          const payout = m.priceTokens - fee
          return {
            ...st,
            ownedMaterialIds: [...st.ownedMaterialIds, materialId],
            materials: st.materials.map((x) =>
              x.id === materialId ? { ...x, downloads: x.downloads + 1 } : x,
            ),
            wallet: {
              balance: st.wallet.balance - m.priceTokens,
              transactions: [
                { id: uid(), type: 'purchase', amount: -m.priceTokens, note: `Beli: ${m.title}`, at: now },
                {
                  id: uid(),
                  type: 'payout',
                  amount: payout,
                  note: `Royalti penulis ${m.authorName} (${m.title}) — setelah biaya platform ${fee} PNC`,
                  at: now,
                },
                ...st.wallet.transactions,
              ],
            },
          }
        })
        return { ok: true }
      },
      uploadMaterial: (m) => setState((st) => ({ ...st, materials: [m, ...st.materials] })),
      setMaterialAIReview: (id, review) =>
        setState((st) => ({
          ...st,
          materials: st.materials.map((x) =>
            x.id === id
              ? {
                  ...x,
                  aiReview: review,
                  status: review.verdict === 'approved' ? 'pending-verifier' : 'rejected',
                }
              : x,
          ),
        })),
      setMaterialVerifierReview: (id, review) =>
        setState((st) => ({
          ...st,
          materials: st.materials.map((x) =>
            x.id === id
              ? { ...x, verifierReview: review, status: review.approved ? 'verified' : 'rejected' }
              : x,
          ),
        })),
      login: (account) =>
        setState((st) => {
          // A patient gets their OWN record, built from registration details
          // (no dummy data). Doctors start with an empty patient list.
          if (account.role === 'pasien') {
            const self = patientFromAccount(account)
            const exists = st.patients.some((p) => p.id === self.id)
            const acc = { ...account, patientId: self.id }
            saveSession(acc) // remember login for 7 days
            return {
              ...st,
              account: acc,
              patients: exists ? st.patients : [...st.patients, self],
              activePatientId: self.id,
            }
          }
          saveSession(account) // remember login for 7 days
          return { ...st, account }
        }),
      logout: () => { clearSession(); return setState((st) => ({ ...st, account: null })) },
      syncWalletBalance: (balance) =>
        setState((st) => (st.wallet.balance === balance ? st : { ...st, wallet: { ...st.wallet, balance } })),
      verifyStr: () => {
        if (backendEnabled) api.saveSettings({ strStatus: 'verified' }).catch(() => {})
        setState((st) => (st.account ? { ...st, account: { ...st.account, strStatus: 'verified' } } : st))
      },
      setMode: (role) =>
        setState((st) => {
          if (!st.account?.isOwner) return st // only the owner can switch modes
          return {
            ...st,
            account: { ...st.account, role },
            activePatientId: role === 'pasien' ? st.patients[0]?.id ?? st.activePatientId : st.activePatientId,
          }
        }),
      addAdminEmail: (email) =>
        setState((st) => {
          const e = email.trim().toLowerCase()
          if (!e || st.adminEmails.includes(e)) return st
          return { ...st, adminEmails: [...st.adminEmails, e] }
        }),
      removeAdminEmail: (email) =>
        setState((st) => ({
          ...st,
          adminEmails: st.adminEmails.filter((e) => e !== email || e === OWNER_EMAIL),
        })),
      addPost: (p) => {
        setState((st) => ({ ...st, posts: [p, ...st.posts] }))
        // #9: best-effort push to the server so other users see the post.
        if (backendEnabled) {
          api
            .createPost({
              authorEmail: p.authorEmail,
              authorName: p.authorName,
              role: p.role,
              kind: p.kind === 'text' ? 'image' : p.kind,
              activity: p.activity,
              caption: p.caption,
              mediaColor: p.mediaColor,
              durationSec: p.durationSec,
            })
            .then((server) =>
              // Swap the local temp id for the server id so likes target the right row.
              setState((st) => ({ ...st, posts: st.posts.map((x) => (x.id === p.id ? { ...x, id: server.id } : x)) })),
            )
            .catch(() => {})
        }
      },
      updatePost: (id, partial) =>
        setState((st) => ({ ...st, posts: st.posts.map((p) => (p.id === id ? { ...p, ...partial } : p)) })),
      deletePost: (id) => setState((st) => ({ ...st, posts: st.posts.filter((p) => p.id !== id) })),
      toggleLike: (id) => {
        setState((st) => ({
          ...st,
          posts: st.posts.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p,
          ),
        }))
        if (backendEnabled) api.likePost(id).catch(() => {}) // #9: sync like to server
      },
      toggleRepost: (id) =>
        setState((st) => ({
          ...st,
          posts: st.posts.map((p) =>
            p.id === id
              ? { ...p, repostedByMe: !p.repostedByMe, reposts: (p.reposts ?? 0) + (p.repostedByMe ? -1 : 1) }
              : p,
          ),
        })),
      toggleBookmark: (id) =>
        setState((st) => ({
          ...st,
          posts: st.posts.map((p) => (p.id === id ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p)),
        })),
      buyLongevitySub: () => {
        const now = new Date()
        const expires = new Date(now.getTime() + 30 * 86400000).toISOString()
        setState((st) => ({
          ...st,
          longevitySubExpires: expires,
          orders: [
            { id: uid(), category: 'Langganan' as const, title: 'Langganan AI Longevity 30 hari', detail: 'Nilai Longevity bertenaga AI', amountIdr: 125000, status: 'Selesai' as const, at: now.toISOString() },
            ...st.orders,
          ],
          wallet: {
            balance: st.wallet.balance,
            transactions: [
              {
                id: uid(),
                type: 'subscription' as TxType,
                amount: 0,
                note: 'Langganan AI Longevity 30 hari — Rp125.000 (dibayar)',
                at: now.toISOString(),
              },
              ...st.wallet.transactions,
            ],
          },
        }))
        return { ok: true }
      },
      buyChronicSub: (plan) => {
        const now = new Date()
        const lifetime = plan === 'lifetime'
        const priceIdr = lifetime ? 9900000 : 99000
        const expires = lifetime ? undefined : new Date(now.getTime() + 30 * 86400000).toISOString()
        setState((st) => ({
          ...st,
          chronicLifetime: lifetime ? true : st.chronicLifetime,
          chronicSubExpires: lifetime ? st.chronicSubExpires : expires,
          orders: [
            { id: uid(), category: 'Langganan' as const, title: lifetime ? 'Pemantauan Kronis — Lifetime' : 'Pemantauan Kronis 30 hari', detail: 'Monitoring TTV harian pasien kronis & longevity', amountIdr: priceIdr, status: 'Selesai' as const, at: now.toISOString() },
            ...st.orders,
          ],
          wallet: {
            balance: st.wallet.balance,
            transactions: [
              { id: uid(), type: 'subscription' as TxType, amount: 0, note: `${lifetime ? 'Pemantauan Kronis Lifetime' : 'Pemantauan Kronis 30 hari'} — Rp${priceIdr.toLocaleString('id-ID')} (dibayar)`, at: now.toISOString() },
              ...st.wallet.transactions,
            ],
          },
        }))
        return { ok: true }
      },
      toggleFollow: (email) =>
        setState((st) => ({
          ...st,
          follows: st.follows.includes(email)
            ? st.follows.filter((e) => e !== email)
            : [...st.follows, email],
        })),
      addStory: (s) => setState((st) => ({ ...st, stories: [s, ...st.stories] })),
      addStoryComment: (storyId, text, authorName) =>
        setState((st) => ({
          ...st,
          stories: st.stories.map((s) =>
            s.id === storyId
              ? { ...s, comments: [...(s.comments ?? []), { id: uid(), authorName, text, at: new Date().toISOString() }] }
              : s,
          ),
        })),
      addStoryReaction: (storyId, emoji) =>
        setState((st) => ({
          ...st,
          stories: st.stories.map((s) =>
            s.id === storyId
              ? { ...s, reactions: { ...(s.reactions ?? {}), [emoji]: (s.reactions?.[emoji] ?? 0) + 1 } }
              : s,
          ),
        })),
      deleteStory: (id) => setState((st) => ({ ...st, stories: st.stories.filter((s) => s.id !== id) })),
      toggleReaction: (postId, emoji) =>
        setState((st) => {
          const email = st.account?.email ?? ''
          return {
            ...st,
            posts: st.posts.map((p) => {
              if (p.id !== postId) return p
              const had = p.reactions?.[emoji] ?? []
              const mine = had.includes(email)
              const nextList = mine ? had.filter((e) => e !== email) : [...had, email]
              return { ...p, reactions: { ...(p.reactions ?? {}), [emoji]: nextList } }
            }),
          }
        }),
      // ── Komunitas Sehat — interpersonal-relationship health features ──────
      heartbeat: () =>
        setState((st) => {
          const email = st.account?.email
          if (!email) return st
          return { ...st, presence: { ...st.presence, [email]: new Date().toISOString() } }
        }),
      setBuddy: (name) => setState((st) => (st.account ? { ...st, buddyName: name.trim() || undefined } : st)),
      checkInToday: () =>
        setState((st) => {
          const email = st.account?.email
          if (!email) return st
          const today = new Date().toISOString().slice(0, 10)
          if (st.checkIns.some((c) => c.email === email && c.date === today)) return st
          return { ...st, checkIns: [...st.checkIns, { email, date: today }] }
        }),
      addMood: (mood, note) =>
        setState((st) => {
          const acc = st.account
          if (!acc) return st
          const entry: MoodEntry = { id: uid(), email: acc.email, name: acc.name, mood, note: note?.trim() || undefined, at: new Date().toISOString() }
          return { ...st, moods: [entry, ...st.moods] }
        }),
      sendSupport: (toName, text) =>
        setState((st) => {
          const acc = st.account
          if (!acc || !text.trim()) return st
          const msg: SupportMessage = { id: uid(), fromEmail: acc.email, fromName: acc.name, toName: toName.trim() || 'Teman', text: text.trim(), at: new Date().toISOString() }
          return { ...st, supportMessages: [msg, ...st.supportMessages] }
        }),
      startChallenge: (title, unit, goal, days) =>
        setState((st) => {
          const acc = st.account
          if (!acc || !title.trim()) return st
          const c: Challenge = {
            id: uid(), title: title.trim(), unit: unit.trim() || 'poin', goal: Math.max(1, goal),
            endsAt: new Date(Date.now() + days * 86400000).toISOString(),
            participants: [{ email: acc.email, name: acc.name, progress: 0 }],
          }
          return { ...st, challenges: [c, ...st.challenges] }
        }),
      bumpChallenge: (challengeId, amount) =>
        setState((st) => {
          const acc = st.account
          if (!acc) return st
          return {
            ...st,
            challenges: st.challenges.map((c) => {
              if (c.id !== challengeId) return c
              const has = c.participants.some((p) => p.email === acc.email)
              const participants = has
                ? c.participants.map((p) => (p.email === acc.email ? { ...p, progress: p.progress + amount } : p))
                : [...c.participants, { email: acc.email, name: acc.name, progress: amount }]
              return { ...c, participants }
            }),
          }
        }),
      createCircle: (name, memberNames) =>
        setState((st) => (name.trim() ? { ...st, circles: [{ id: uid(), name: name.trim(), memberNames: memberNames.filter((m) => m.trim()) }, ...st.circles] } : st)),
      addGratitude: (toName, text) =>
        setState((st) => {
          const acc = st.account
          if (!acc || !text.trim() || !toName.trim()) return st
          const note: GratitudeNote = { id: uid(), fromName: acc.name, toName: toName.trim(), text: text.trim(), at: new Date().toISOString() }
          return { ...st, gratitudes: [note, ...st.gratitudes] }
        }),
      createCommunity: (name, sportTag) =>
        setState((st) => {
          const acc = st.account
          if (!acc || !name.trim() || !sportTag.trim()) return st
          const community: SportCommunity = {
            id: uid(),
            name: name.trim(),
            sportTag: sportTag.trim(),
            memberNames: [acc.name],
            createdBy: acc.email,
            createdAt: new Date().toISOString(),
          }
          return { ...st, communities: [community, ...st.communities] }
        }),
      joinCommunity: (id, memberName) =>
        setState((st) => ({
          ...st,
          communities: st.communities.map((c) =>
            c.id === id && memberName.trim() && !c.memberNames.includes(memberName.trim())
              ? { ...c, memberNames: [...c.memberNames, memberName.trim()] }
              : c
          ),
        })),
      addSelfVital: (v) =>
        setState((st) => ({ ...st, selfVitals: [{ id: uid(), at: new Date().toISOString(), ...v }, ...st.selfVitals].slice(0, 50) })),
      addSleepLog: (hours, bedtimeConsistent) =>
        setState((st) => {
          const date = new Date().toISOString().slice(0, 10)
          const without = st.sleepLogs.filter((s) => s.date !== date)
          return { ...st, sleepLogs: [{ id: uid(), date, hours, bedtimeConsistent }, ...without].slice(0, 60) }
        }),
      addMedReminder: (name, time) =>
        setState((st) => (name.trim() && time ? { ...st, medReminders: [{ id: uid(), name: name.trim(), time, takenDates: [] }, ...st.medReminders] } : st)),
      markMedTaken: (id) =>
        setState((st) => {
          const today = new Date().toISOString().slice(0, 10)
          return {
            ...st,
            medReminders: st.medReminders.map((m) =>
              m.id === id && !m.takenDates.includes(today) ? { ...m, takenDates: [...m.takenDates, today] } : m
            ),
          }
        }),
      toggleEduBookmark: (articleId) =>
        setState((st) => ({
          ...st,
          eduBookmarks: st.eduBookmarks.includes(articleId)
            ? st.eduBookmarks.filter((id) => id !== articleId)
            : [...st.eduBookmarks, articleId],
        })),
      answerQuiz: (correct) =>
        setState((st) => ({ ...st, quizScore: { correct: st.quizScore.correct + (correct ? 1 : 0), total: st.quizScore.total + 1 } })),
      logVo2Max: (value, method) =>
        setState((st) => (value > 0 ? { ...st, vo2maxLog: [{ id: uid(), at: new Date().toISOString(), value: Math.round(value * 10) / 10, method }, ...st.vo2maxLog].slice(0, 50) } : st)),
      addGoal: (g) =>
        setState((st) => (g.label.trim() && g.target > 0 ? { ...st, goals: [{ id: uid(), ...g }, ...st.goals] } : st)),
      removeGoal: (id) => setState((st) => ({ ...st, goals: st.goals.filter((g) => g.id !== id) })),
      addGpsActivity: (a) =>
        setState((st) => ({ ...st, gpsActivities: [{ id: uid(), ...a }, ...st.gpsActivities].slice(0, 200) })),
      addFood: (f) => setState((st) => ({ ...st, foods: [f, ...st.foods] })),
      logWellness: (date, patch) =>
        setState((st) => ({
          ...st,
          wellness: {
            ...st.wellness,
            [date]: { ...(st.wellness?.[date] ?? {}), ...patch, date },
          },
        })),
      addOrder: (o) => setState((st) => ({ ...st, orders: [o, ...st.orders] })),
      addProduct: (p) => setState((st) => ({ ...st, products: [p, ...st.products] })),
      updateProduct: (id, partial) =>
        setState((st) => ({ ...st, products: st.products.map((p) => (p.id === id ? { ...p, ...partial } : p)) })),
      removeProduct: (id) => setState((st) => ({ ...st, products: st.products.filter((p) => p.id !== id) })),
      updateProfile: (email, partial) =>
        setState((st) => ({ ...st, profiles: { ...st.profiles, [email]: { ...st.profiles[email], ...partial } } })),
      bookConsult: (c) =>
        setState((st) => ({
          ...st,
          consults: [c, ...st.consults],
          wallet: {
            balance: st.wallet.balance,
            transactions: [
              {
                id: uid(),
                type: 'consult' as TxType,
                amount: 0,
                note: `Konsultasi ${c.doctorName} — Rp${c.feeIdr.toLocaleString('id-ID')} (dibayar)`,
                at: c.at,
              },
              ...st.wallet.transactions,
            ],
          },
        })),
      sendEmail: (e) => setState((st) => ({ ...st, emails: [e, ...st.emails] })),
      withdrawTokens: (amount, bank) => {
        if (amount <= 0) return { ok: false, reason: 'Jumlah tidak valid.' }
        if (state.wallet.balance < amount) return { ok: false, reason: 'Saldo tidak cukup.' }
        setState((st) => ({
          ...st,
          wallet: {
            balance: st.wallet.balance - amount,
            transactions: [
              {
                id: uid(),
                type: 'withdraw' as TxType,
                amount: -amount,
                note: `Tarik dana ke ${bank} (Rp${(amount * TOKEN_TO_IDR).toLocaleString('id-ID')})`,
                at: new Date().toISOString(),
              },
              ...st.wallet.transactions,
            ],
          },
        }))
        return { ok: true }
      },
      subscribe: (plan, seats) =>
        setState((st) => {
          const price = plan === 'individu' ? 20 : plan === 'rumah-sakit' ? 200 : 0
          const txs: WalletTx[] =
            price > 0
              ? [
                  {
                    id: uid(),
                    type: 'subscription',
                    amount: -price,
                    note: `Langganan ${plan === 'individu' ? 'Individu' : 'Rumah Sakit'} / bulan`,
                    at: new Date().toISOString(),
                  },
                ]
              : []
          return {
            ...st,
            subscription: { plan, since: new Date().toISOString(), seats },
            wallet:
              price > 0 && st.wallet.balance >= price
                ? { balance: st.wallet.balance - price, transactions: [...txs, ...st.wallet.transactions] }
                : st.wallet,
          }
        }),
      setAuthorSubPrice: (authorEmail, priceTokens) =>
        setState((st) => ({ ...st, authorSubPrices: { ...st.authorSubPrices, [authorEmail]: Math.max(0, Math.round(priceTokens)) } })),
      subscribeAuthor: (authorEmail) => {
        const price = state.authorSubPrices[authorEmail] ?? 0
        if (state.wallet.balance < price) return { ok: false, reason: 'Saldo PNC tidak cukup. Silakan deposit di Billing.' }
        const now = new Date()
        const expires = new Date(now.getTime() + 30 * 86400000).toISOString()
        setState((st) => ({
          ...st,
          authorSubs: { ...st.authorSubs, [authorEmail]: expires },
          orders: [
            { id: uid(), category: 'Langganan' as const, title: `Langganan penulis ${authorEmail}`, detail: 'Akses semua materi penulis 30 hari', amountIdr: price * TOKEN_TO_IDR, status: 'Selesai' as const, at: now.toISOString() },
            ...st.orders,
          ],
          wallet: {
            balance: st.wallet.balance - price,
            transactions: [
              { id: uid(), type: 'subscription' as TxType, amount: -price, note: `Langganan penulis ${authorEmail} (30 hari)`, at: now.toISOString() },
              ...st.wallet.transactions,
            ],
          },
        }))
        return { ok: true }
      },
    }
  }, [state])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
