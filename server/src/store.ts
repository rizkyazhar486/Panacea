// Minimal file-backed persistence (no native deps). For production swap for a
// real database (Postgres/SQLite). Suitable for the demo backend.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', 'data.json')

export type Role = 'pasien' | 'dokter' | 'kontributor' | 'verifikator' | 'admin' | 'owner'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  picture?: string
  createdAt: string
}

export type TxType = 'deposit' | 'withdraw' | 'purchase' | 'payout'
export interface Tx {
  id: string
  userId: string
  type: TxType
  amountPnc: number // +in / -out
  note: string
  at: string
  ref?: string
}

export interface Order {
  id: string // order_id sent to Midtrans
  userId: string
  amountPnc: number
  amountIdr: number
  method: string
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
  purpose?: string // 'topup' (default) | 'chronic_monthly' | 'chronic_lifetime'
}

export interface Post {
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

// Clinical data is stored as opaque JSON (shape owned by the frontend types).
export interface Clinical {
  patients: any[]
  vitals: Record<string, any[]>
  supportive: Record<string, any[]>
  records: Record<string, any>
  education: Record<string, any>
}

// No dummy/demo content — a clean clinical store.
function seedPatients(): any[] {
  return []
}

interface DB {
  users: User[]
  wallets: Record<string, number> // userId -> PNC balance
  txs: Tx[]
  orders: Order[]
  posts: Post[]
  clinical: Clinical
  settings: Record<string, any> // userId -> preference blob (no secrets)
  pushSubs: Record<string, any[]> // userId -> Web Push subscriptions
  notifications: Record<string, Notif[]> // userId -> in-app notification inbox
  creatorSubs: { subscriberId: string; authorEmail: string; at: string; expires: string }[]
  manualTopups?: ManualTopup[] // bank-transfer top-up requests awaiting owner approval
  applications?: Application[] // professional onboarding applications (doctor/writer/verifier)
}

// Professional onboarding application — submitted at sign-up by clinicians,
// writers & verifiers; reviewed by AI then granted/rejected by the owner.
export interface Application {
  id: string
  userId: string
  email: string
  name: string
  role: Role
  str?: string
  gelar?: string // academic title (writers)
  keahlian?: string // expertise
  universitas?: string
  tahunLulus?: string
  spesialis?: string // writers
  subspesialis?: string // verifiers
  pdfName?: string // uploaded credential file name
  aiVerdict?: string // AI-Agent review note
  status: 'pending' | 'granted' | 'rejected'
  at: string
  decidedAt?: string
}

// Manual (bank-transfer) top-up request — user transfers, owner approves to credit.
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

let db: DB = {
  users: [],
  wallets: {},
  txs: [],
  orders: [],
  posts: [],
  clinical: { patients: seedPatients(), vitals: {}, supportive: {}, records: {}, education: {} },
  settings: {},
  pushSubs: {},
  notifications: {},
  creatorSubs: [],
  manualTopups: [],
  applications: [],
}

// MongoDB persistence (optional). When MONGODB_URI is set the whole state is
// stored as a single document and survives restarts/redeploys (permanent,
// cross-device). Otherwise it falls back to the ephemeral data.json file.
let mongoCol: any = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function loadFile() {
  if (existsSync(DB_PATH)) {
    try {
      db = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    } catch {
      /* keep defaults */
    }
  }
}

function save() {
  // Local file (harmless; ephemeral on hosts like Render).
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch {
    /* ignore in read-only envs */
  }
  // Mongo (permanent), debounced to coalesce rapid writes.
  if (mongoCol) {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      mongoCol.updateOne({ _id: 'state' }, { $set: { data: db, at: new Date() } }, { upsert: true }).catch(() => {})
    }, 400)
  }
}

// Call once at boot before serving requests.
export async function initStore() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    loadFile()
    console.log('[store] file mode (set MONGODB_URI for permanent storage)')
    return
  }
  try {
    // Indirect specifier keeps tsc happy even before `npm install` adds the dep.
    const mongo: any = await import('mongodb' as string)
    const client = new mongo.MongoClient(uri)
    await client.connect()
    const dbName = process.env.MONGODB_DB || 'panaceamed'
    mongoCol = client.db(dbName).collection('app')
    const doc = await mongoCol.findOne({ _id: 'state' })
    if (doc?.data) db = doc.data as DB
    else await mongoCol.updateOne({ _id: 'state' }, { $set: { data: db, at: new Date() } }, { upsert: true })
    console.log('[store] MongoDB connected — permanent mode')
  } catch (e) {
    mongoCol = null
    loadFile()
    console.error('[store] MongoDB failed, using file mode:', (e as Error).message)
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function upsertUser(email: string, name: string, role: Role, picture?: string): User {
  let u = db.users.find((x) => x.email === email)
  if (!u) {
    u = { id: uid(), email, name, role, picture, createdAt: new Date().toISOString() }
    db.users.push(u)
    db.wallets[u.id] = 25 // welcome bonus PNC
    db.txs.unshift({ id: uid(), userId: u.id, type: 'deposit', amountPnc: 25, note: 'Bonus pendaftaran', at: u.createdAt })
  } else {
    u.name = name
    u.role = role
    if (picture) u.picture = picture
  }
  save()
  return u
}

export function getUser(id: string): User | undefined {
  return db.users.find((u) => u.id === id)
}
export function userExistsByEmail(email: string): boolean {
  return db.users.some((u) => u.email === email)
}
export function getUserByEmail(email: string): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

// Resolve a registered patient-user from a self-patient id ("self-<sanitized
// email>"), mirroring the frontend's id derivation. Returns undefined for
// doctor-created patients (no linked account).
export function findUserBySelfPatientId(patientId: string): User | undefined {
  if (!patientId?.startsWith('self-')) return undefined
  const suffix = patientId.slice(5).toLowerCase()
  return db.users.find((u) => u.email.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) === suffix)
}

export function balance(userId: string): number {
  return db.wallets[userId] ?? 0
}

export function txsFor(userId: string): Tx[] {
  return db.txs.filter((t) => t.userId === userId).slice(0, 100)
}

export function credit(userId: string, amountPnc: number, type: TxType, note: string, ref?: string) {
  db.wallets[userId] = (db.wallets[userId] ?? 0) + amountPnc
  db.txs.unshift({ id: uid(), userId, type, amountPnc, note, at: new Date().toISOString(), ref })
  save()
}

export function listPosts(): Post[] {
  if (!db.posts) db.posts = []
  return db.posts.slice(0, 100)
}
export function addPost(p: Post) {
  if (!db.posts) db.posts = []
  db.posts.unshift(p)
  save()
}
export function likePost(id: string): Post | undefined {
  const p = db.posts?.find((x) => x.id === id)
  if (p) {
    p.likes += 1
    save()
  }
  return p
}

function ensureClinical() {
  if (!db.clinical) db.clinical = { patients: seedPatients(), vitals: {}, supportive: {}, records: {}, education: {} }
  return db.clinical
}
export function getClinical(): Clinical {
  return ensureClinical()
}
export function saveRecord(patientId: string, record: any) {
  ensureClinical().records[patientId] = record
  save()
}
export function saveEducation(patientId: string, sheet: any) {
  ensureClinical().education[patientId] = sheet
  save()
}
export function addVital(patientId: string, vital: any) {
  const c = ensureClinical()
  c.vitals[patientId] = [...(c.vitals[patientId] ?? []), vital]
  save()
}
export function addSupportive(patientId: string, r: any) {
  const c = ensureClinical()
  c.supportive[patientId] = [...(c.supportive[patientId] ?? []), r]
  save()
}
export function addPatient(p: any) {
  ensureClinical().patients.push(p)
  save()
}

// ── Audit log (Permenkes 24/2022) — record every access/change to clinical
// data: who, what action, which patient, and when. Append-only, capped.
export interface AuditEntry {
  id: string
  at: string
  userId: string
  userEmail: string
  action: string
  target?: string
}
export function addAudit(user: User, action: string, target?: string) {
  if (!(db as any).audit) (db as any).audit = []
  const audit: AuditEntry[] = (db as any).audit
  audit.unshift({ id: uid(), at: new Date().toISOString(), userId: user.id, userEmail: user.email, action, target })
  if (audit.length > 5000) audit.length = 5000
  save()
}
export function getAudit(limit = 200): AuditEntry[] {
  return ((db as any).audit ?? []).slice(0, limit)
}

// Per-user preference sync (notifications, security toggles, model, doctor
// name). Never holds secrets — the Anthropic API key stays in the browser.
export function getSettings(userId: string): Record<string, any> {
  if (!db.settings) db.settings = {}
  return db.settings[userId] ?? {}
}
export function saveSettings(userId: string, prefs: Record<string, any>) {
  if (!db.settings) db.settings = {}
  db.settings[userId] = { ...db.settings[userId], ...prefs }
  save()
}

// Doctors awaiting / holding STR verification — joins the user record with the
// STR number & status kept in their settings blob.
export interface DoctorRow {
  id: string
  email: string
  name: string
  role: Role
  str: string | null
  strStatus: 'pending' | 'verified'
  createdAt: string
}
// STR / practice-certificate holders awaiting verification: doctors plus the
// licence-gated content roles (contributor & verifier).
const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']
export function listDoctors(): DoctorRow[] {
  const s = db.settings || {}
  return db.users
    .filter((u) => STR_ROLES.includes(u.role))
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      str: (s[u.id]?.str as string) ?? null,
      strStatus: (s[u.id]?.strStatus as 'pending' | 'verified') ?? 'pending',
      createdAt: u.createdAt,
    }))
}

// Web Push subscriptions per user (dedup by endpoint).
export function addPushSub(userId: string, sub: any) {
  if (!db.pushSubs) db.pushSubs = {}
  const list = db.pushSubs[userId] ?? []
  if (!list.some((s) => s.endpoint === sub.endpoint)) list.push(sub)
  db.pushSubs[userId] = list
  save()
}
export function listPushSubs(userId: string): any[] {
  return (db.pushSubs?.[userId] ?? [])
}
export function allPushUserIds(): string[] {
  return Object.keys(db.pushSubs ?? {})
}

// In-app notification inbox (persists alongside push so notifications aren't
// ephemeral). Capped per user.
export interface Notif {
  id: string
  title: string
  body: string
  url?: string
  at: string
  read: boolean
}
export function addNotification(userId: string, n: { title: string; body: string; url?: string }) {
  if (!db.notifications) db.notifications = {}
  const list = db.notifications[userId] ?? []
  list.unshift({ id: uid(), title: n.title, body: n.body, url: n.url, at: new Date().toISOString(), read: false })
  if (list.length > 50) list.length = 50
  db.notifications[userId] = list
  save()
}
export function listNotifications(userId: string): Notif[] {
  return db.notifications?.[userId] ?? []
}
export function markNotificationsRead(userId: string) {
  const list = db.notifications?.[userId]
  if (!list) return
  list.forEach((n) => (n.read = true))
  save()
}
export function removePushSub(userId: string, endpoint: string) {
  if (!db.pushSubs?.[userId]) return
  db.pushSubs[userId] = db.pushSubs[userId].filter((s) => s.endpoint !== endpoint)
  save()
}

// Aggregate platform stats for the Owner dashboard (computed live from the DB).
export function getStats() {
  const users = db.users
  const orders = db.orders ?? []
  const paid = orders.filter((o) => o.status === 'paid')
  const revenueIdr = paid.reduce((a, o) => a + o.amountIdr, 0)

  // Last-7-days series for signups & revenue.
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const signups7d = days.map((day) => ({
    day,
    count: users.filter((u) => u.createdAt.slice(0, 10) === day).length,
  }))
  const revenue7d = days.map((day) => ({
    day,
    idr: paid.filter((o) => o.createdAt.slice(0, 10) === day).reduce((a, o) => a + o.amountIdr, 0),
  }))

  return {
    totalUsers: users.length,
    doctors: users.filter((u) => u.role === 'dokter').length,
    patients: users.filter((u) => u.role === 'pasien').length,
    posts: (db.posts ?? []).length,
    orders: orders.length,
    paidOrders: paid.length,
    revenueIdr,
    pushSubscribers: Object.keys(db.pushSubs ?? {}).length,
    signups7d,
    revenue7d,
  }
}

// Creator subscriptions — who has an active paid subscription to which author.
export function addCreatorSub(subscriberId: string, authorEmail: string, days = 30) {
  if (!db.creatorSubs) db.creatorSubs = []
  const expires = new Date(Date.now() + days * 86400_000).toISOString()
  db.creatorSubs = db.creatorSubs.filter((s) => !(s.subscriberId === subscriberId && s.authorEmail === authorEmail))
  db.creatorSubs.push({ subscriberId, authorEmail: authorEmail.toLowerCase(), at: new Date().toISOString(), expires })
  save()
  return expires
}
export function activeCreatorSubs(subscriberId: string): string[] {
  const now = Date.now()
  return (db.creatorSubs ?? [])
    .filter((s) => s.subscriberId === subscriberId && new Date(s.expires).getTime() > now)
    .map((s) => s.authorEmail)
}

// ── Manual bank-transfer top-ups ────────────────────────────────────────────
export function addManualTopup(t: Omit<ManualTopup, 'id' | 'status' | 'at'>): ManualTopup {
  if (!db.manualTopups) db.manualTopups = []
  const row: ManualTopup = { id: uid(), status: 'pending', at: new Date().toISOString(), ...t }
  db.manualTopups.unshift(row)
  save()
  return row
}
export function listManualTopups(status?: ManualTopup['status']): ManualTopup[] {
  const all = db.manualTopups ?? []
  return (status ? all.filter((t) => t.status === status) : all).slice(0, 200)
}
export function getManualTopup(id: string): ManualTopup | undefined {
  return db.manualTopups?.find((t) => t.id === id)
}
export function setManualTopupStatus(id: string, status: 'approved' | 'rejected'): ManualTopup | undefined {
  const t = getManualTopup(id)
  if (!t || t.status !== 'pending') return undefined
  t.status = status
  t.decidedAt = new Date().toISOString()
  save()
  return t
}

// ── Professional onboarding applications ────────────────────────────────────
export function addApplication(a: Omit<Application, 'id' | 'status' | 'at'>): Application {
  if (!db.applications) db.applications = []
  // Replace any prior pending application from the same user+role.
  db.applications = db.applications.filter((x) => !(x.userId === a.userId && x.role === a.role && x.status === 'pending'))
  const row: Application = { id: uid(), status: 'pending', at: new Date().toISOString(), ...a }
  db.applications.unshift(row)
  save()
  return row
}
export function listApplications(status?: Application['status']): Application[] {
  const all = db.applications ?? []
  return (status ? all.filter((a) => a.status === status) : all).slice(0, 200)
}
export function getApplication(id: string): Application | undefined {
  return db.applications?.find((a) => a.id === id)
}
export function setApplicationVerdict(id: string, aiVerdict: string) {
  const a = getApplication(id)
  if (a) { a.aiVerdict = aiVerdict; save() }
}
export function setApplicationStatus(id: string, status: 'granted' | 'rejected'): Application | undefined {
  const a = getApplication(id)
  if (!a) return undefined
  a.status = status
  a.decidedAt = new Date().toISOString()
  // Granting marks the user's STR verified so role-gated modules unlock.
  if (status === 'granted') saveSettings(a.userId, { strStatus: 'verified' })
  save()
  return a
}

export function createOrder(o: Order) {
  db.orders.unshift(o)
  save()
}
export function getOrder(id: string): Order | undefined {
  return db.orders.find((o) => o.id === id)
}
export function setOrderStatus(id: string, status: Order['status']) {
  const o = getOrder(id)
  if (o) {
    o.status = status
    save()
  }
}
