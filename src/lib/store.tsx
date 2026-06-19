import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, backendEnabled } from './api'
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
  FoodEntry,
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
export const PLATFORM_FEE = 0.2 // 20% platform fee on author payout

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
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
    dob: `${year}-01-01`,
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
    follows: [],
    foods: [],
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
      twoFactor: false,
      biometricLock: false,
    },
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...seed(), ...JSON.parse(raw) }
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
  buyLongevitySub: () => { ok: boolean; reason?: string }
  addFood: (f: FoodEntry) => void
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

  // Autologin: the account isn't persisted locally, but a valid backend session
  // cookie means the user is still signed in. On first load, ask the server who
  // we are and restore the session (skips the landing for returning users).
  // Logging out clears the cookie, so the next visit starts at the landing again.
  const bootedRef = useRef(false)
  useEffect(() => {
    if (bootedRef.current || !backendEnabled) return
    bootedRef.current = true
    api
      .me()
      .then((acc) => {
        const isOwner = acc.email.toLowerCase() === OWNER_EMAIL
        const restored: Account = { ...acc, isOwner, isSubscriber: isOwner || acc.isSubscriber }
        setState((st) => {
          if (st.account) return st // a fresh login already happened — don't clobber it
          if (restored.role === 'pasien') {
            const self = patientFromAccount(restored)
            const exists = st.patients.some((p) => p.id === self.id)
            return {
              ...st,
              account: { ...restored, patientId: self.id },
              patients: exists ? st.patients : [...st.patients, self],
              activePatientId: self.id,
            }
          }
          return { ...st, account: restored }
        })
      })
      .catch(() => {
        /* no active session — stay on the public landing */
      })
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
            return next
          })
        }
      })
      .catch(() => {})
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
          const payout = Math.round(m.priceTokens * (1 - PLATFORM_FEE))
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
                  note: `Royalti penulis ${m.authorName} (${m.title})`,
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
            return {
              ...st,
              account: { ...account, patientId: self.id },
              patients: exists ? st.patients : [...st.patients, self],
              activePatientId: self.id,
            }
          }
          return { ...st, account }
        }),
      logout: () => setState((st) => ({ ...st, account: null })),
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
      addPost: (p) => setState((st) => ({ ...st, posts: [p, ...st.posts] })),
      updatePost: (id, partial) =>
        setState((st) => ({ ...st, posts: st.posts.map((p) => (p.id === id ? { ...p, ...partial } : p)) })),
      deletePost: (id) => setState((st) => ({ ...st, posts: st.posts.filter((p) => p.id !== id) })),
      toggleLike: (id) =>
        setState((st) => ({
          ...st,
          posts: st.posts.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p,
          ),
        })),
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
      toggleFollow: (email) =>
        setState((st) => ({
          ...st,
          follows: st.follows.includes(email)
            ? st.follows.filter((e) => e !== email)
            : [...st.follows, email],
        })),
      addFood: (f) => setState((st) => ({ ...st, foods: [f, ...st.foods] })),
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
