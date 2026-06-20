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
  str: string | null
  strStatus: 'pending' | 'verified'
  createdAt: string
}
export function listDoctors(): DoctorRow[] {
  const s = db.settings || {}
  return db.users
    .filter((u) => u.role === 'dokter')
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
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
export function removePushSub(userId: string, endpoint: string) {
  if (!db.pushSubs?.[userId]) return
  db.pushSubs[userId] = db.pushSubs[userId].filter((s) => s.endpoint !== endpoint)
  save()
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
