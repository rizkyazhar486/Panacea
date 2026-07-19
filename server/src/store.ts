// Minimal file-backed persistence (no native deps). For production swap for a
// real database (Postgres/SQLite). Suitable for the demo backend.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'

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

export interface Feedback {
  id: string
  userId: string
  userEmail: string
  userName: string
  kind: 'Suggestion' | 'Problem/Bug' | 'Question' | 'Compliment' | 'Feature Request'
  text: string
  at: string
  read: boolean
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
  reactions?: Record<string, string[]> // emoji -> emails who reacted (cross-user)
  exclusive?: boolean
  locked?: boolean
  archived?: boolean
  pinned?: boolean
  hideLikes?: boolean
  commentsOff?: boolean
  reuseOff?: boolean
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
  healthProfiles?: Record<string, Record<string, any>> // email -> health data blob (manual/wearable)
  healthWebhookTokens?: Record<string, string> // opaque token -> email, for Apple Health auto-export (Health Auto Export app)
  sportsFavorites?: Record<string, string[]> // userId -> followed team keys, e.g. "epl:Arsenal"
  feedback?: Feedback[] // in-app "Pesan & Saran" — delivered to the owner only
  reminders?: Record<string, MedReminder[]> // userId -> medication reminders
  meets?: Meet[] // Club Hub meets — real, user-created, server-persisted
  clubs?: Club[] // Club Hub clubs — real, user-created, server-persisted
}

// A single daily medication reminder. `nextFireAt` is a UTC ISO timestamp —
// computed client-side from the user's chosen local wall-clock time, so the
// server never needs to know the user's timezone; it just compares
// Date.now() against this instant and advances it by 24h after firing.
export interface MedReminder {
  id: string
  medName: string
  dose: string
  timeOfDay: string // "HH:MM", for display only — nextFireAt is authoritative
  nextFireAt: string
  active: boolean
  createdAt: string
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

// A real, user-created Club Hub meet — join counts are the actual number of
// distinct accounts in `participants`, never a preset/fake number.
export interface Meet {
  id: string
  title: string
  club: string
  tag: string
  venue: string
  address: string
  day: number // days from now (0 = today)
  time: string // "HH:MM"
  durH: number
  cap: number
  feeRp: number
  notes: string[]
  lat: number
  lng: number
  emoji: string
  hostEmail: string
  hostName: string
  participants: string[] // emails who RSVP'd "joined"
  maybes: string[] // emails who RSVP'd "maybe"
  createdAt: string
}

// A real, user-created Club Hub club — member counts are the actual number
// of distinct accounts in `members`, never a preset/fake number.
export interface Club {
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

// A handful of officially-hosted recurring sessions to seed a brand-new
// deployment so Club Hub isn't empty on day one. Unlike the old client-side
// mock data, the join count is real and starts at zero — these grow only as
// actual accounts RSVP, same as any user-created meet.
function seedMeets(): Meet[] {
  const host = { hostEmail: 'community@panaceamed.id', hostName: 'Panaceamed Community' }
  const now = new Date().toISOString()
  return [
    { id: 'seed-run', title: 'Weekend Long Run', club: 'Sunrise Run Club', tag: 'Social', venue: 'GBK Senayan Loop', address: 'Gelora Bung Karno, Jakarta Pusat', day: 0, time: '06:00', durH: 2, cap: 40, feeRp: 0, notes: ['Pace groups: 6:30, 7:30, 8:30 /km', 'Conversational pace welcome'], lat: -6.2185, lng: 106.8022, emoji: '🏃', participants: [], maybes: [], createdAt: now, ...host },
    { id: 'seed-padel', title: 'Americano Mixer', club: 'Padel Pulse', tag: 'Americano', venue: 'Padel Parc Simprug', address: 'Jl. Teuku Nyak Arief, Jakarta Selatan', day: 0, time: '07:30', durH: 2, cap: 12, feeRp: 85000, notes: ['Fee includes 2h court + balls', 'Bring your own racket (rental available)'], lat: -6.2242, lng: 106.783, emoji: '🎾', participants: [], maybes: [], createdAt: now, ...host },
    { id: 'seed-badminton', title: 'Doubles Rotation Night', club: 'Shuttle Squad', tag: 'Social', venue: 'GOR Bulungan', address: 'Jl. Bulungan No.1, Jakarta Selatan', day: 0, time: '16:00', durH: 3, cap: 16, feeRp: 45000, notes: ['Fee includes 3h court + shuttlecocks'], lat: -6.2436, lng: 106.7981, emoji: '🏸', participants: [], maybes: [], createdAt: now, ...host },
    { id: 'seed-walk', title: 'Walk & Talk: Heart Health', club: 'Walk With A Doctor', tag: 'Health walk', venue: 'Taman Menteng', address: 'Jl. HOS Cokroaminoto, Jakarta Pusat', day: 1, time: '06:30', durH: 1.5, cap: 25, feeRp: 0, notes: ['Q&A on blood pressure & cholesterol while walking'], lat: -6.1963, lng: 106.8296, emoji: '🩺', participants: [], maybes: [], createdAt: now, ...host },
    { id: 'seed-yoga', title: 'Sunrise Vinyasa', club: 'Morning Flow Yoga', tag: 'Class', venue: 'Taman Langsat', address: 'Jl. Barito, Kebayoran Baru', day: 1, time: '07:00', durH: 1, cap: 20, feeRp: 30000, notes: ['Mats provided for first-timers'], lat: -6.241, lng: 106.794, emoji: '🧘', participants: [], maybes: [], createdAt: now, ...host },
  ]
}

// Same idea for clubs: a handful of official starter clubs whose member
// count is real and starts at zero, growing only from actual joins.
function seedClubs(): Club[] {
  const host = { hostEmail: 'community@panaceamed.id', hostName: 'Panaceamed Community' }
  const now = new Date().toISOString()
  return [
    { id: 'sunrise-run', name: 'Sunrise Run Club', emoji: '🏃', sport: 'Running', level: 'All levels', desc: 'Easy-pace social runs every weekend morning — zone 2, no one left behind.', members: [], createdAt: now, ...host },
    { id: 'padel-pulse', name: 'Padel Pulse', emoji: '🎾', sport: 'Padel', level: 'Beginner-Intermediate', desc: 'Social padel mixers and Americano-format sessions.', members: [], createdAt: now, ...host },
    { id: 'shuttle-squad', name: 'Shuttle Squad', emoji: '🏸', sport: 'Badminton', level: 'All levels', desc: 'Doubles rotation nights, casual and competitive courts.', members: [], createdAt: now, ...host },
    { id: 'iron-circle', name: 'Iron Circle', emoji: '🏋️', sport: 'Strength', level: 'Intermediate', desc: 'Progressive-overload group lifting with form-check culture.', members: [], createdAt: now, ...host },
    { id: 'dokter-jalan', name: 'Walk With A Doctor', emoji: '🩺', sport: 'Health walk', level: 'All levels', desc: 'Clinician-led weekend walks — bring your questions, leave with 8,000 steps.', members: [], createdAt: now, ...host },
    { id: 'flow-yoga', name: 'Morning Flow Yoga', emoji: '🧘', sport: 'Yoga', level: 'All levels', desc: 'Sunrise vinyasa in the park; mats provided for first-timers.', members: [], createdAt: now, ...host },
  ]
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
  meets: seedMeets(),
  clubs: seedClubs(),
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
// Remove a post (owner-only — caller enforces ownership). Returns true if removed.
export function deletePost(id: string, email: string): boolean {
  const p = db.posts?.find((x) => x.id === id)
  if (!p || p.authorEmail !== email) return false
  db.posts = (db.posts ?? []).filter((x) => x.id !== id)
  save()
  return true
}
// Patch owner-editable fields on a post (caption, activity, flags). Owner-only.
export function updatePost(id: string, email: string, patch: Partial<Post>): Post | undefined {
  const p = db.posts?.find((x) => x.id === id)
  if (!p || p.authorEmail !== email) return undefined
  if (typeof patch.caption === 'string') p.caption = patch.caption
  if (typeof patch.activity === 'string') p.activity = patch.activity
  const flags = patch as Record<string, unknown>
  const target = p as unknown as Record<string, unknown>
  for (const k of ['exclusive', 'locked', 'archived', 'pinned', 'hideLikes', 'commentsOff', 'reuseOff']) {
    if (typeof flags[k] === 'boolean') target[k] = flags[k]
  }
  save()
  return p
}
// --- Club Hub meets (real, user-created; join counts are actual RSVPs) ---
export function listMeets(): Meet[] {
  if (!db.meets) db.meets = []
  // Drop meets more than a day in the past so the list doesn't grow forever.
  db.meets = db.meets.filter((m) => m.day >= -1)
  return db.meets
}
export function addMeet(m: Meet) {
  if (!db.meets) db.meets = []
  db.meets.unshift(m)
  save()
}
export function rsvpMeet(id: string, email: string, status: 'joined' | 'maybe' | 'none'): { meet?: Meet; full?: boolean } {
  const m = db.meets?.find((x) => x.id === id)
  if (!m) return {}
  const wasJoined = m.participants.includes(email)
  if (status === 'joined' && !wasJoined && m.participants.length >= m.cap) return { meet: m, full: true }
  m.participants = m.participants.filter((e) => e !== email)
  m.maybes = m.maybes.filter((e) => e !== email)
  if (status === 'joined') m.participants.push(email)
  else if (status === 'maybe') m.maybes.push(email)
  save()
  return { meet: m }
}
// Remove a meet (host-only). Returns true if removed.
export function deleteMeet(id: string, email: string): boolean {
  const m = db.meets?.find((x) => x.id === id)
  if (!m || m.hostEmail !== email) return false
  db.meets = (db.meets ?? []).filter((x) => x.id !== id)
  save()
  return true
}

// --- Club Hub clubs (real, user-created; member counts are actual joins) ---
export function listClubs(): Club[] {
  if (!db.clubs) db.clubs = []
  return db.clubs
}
export function addClub(c: Club) {
  if (!db.clubs) db.clubs = []
  db.clubs.unshift(c)
  save()
}
export function toggleClubMember(id: string, email: string): Club | undefined {
  const c = db.clubs?.find((x) => x.id === id)
  if (!c) return undefined
  c.members = c.members.includes(email) ? c.members.filter((e) => e !== email) : [...c.members, email]
  save()
  return c
}
// Remove a club (host-only). Returns true if removed.
export function deleteClub(id: string, email: string): boolean {
  const c = db.clubs?.find((x) => x.id === id)
  if (!c || c.hostEmail !== email) return false
  db.clubs = (db.clubs ?? []).filter((x) => x.id !== id)
  save()
  return true
}

// Toggle a viewer's reaction emoji on a post (cross-user, visible to everyone).
export function reactPost(id: string, emoji: string, email: string): Post | undefined {
  const p = db.posts?.find((x) => x.id === id)
  if (!p) return undefined
  if (!p.reactions) p.reactions = {}
  const list = p.reactions[emoji] ?? []
  p.reactions[emoji] = list.includes(email) ? list.filter((e) => e !== email) : [...list, email]
  if (p.reactions[emoji].length === 0) delete p.reactions[emoji]
  save()
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

// Per-user health profile — an opaque JSON blob owned by the frontend
// (demographics + wearable snapshot from manual/WHOOP/Apple Watch/etc.).
// Keyed by user email so it follows the account across devices.
export function getHealthProfile(email: string): Record<string, any> {
  if (!db.healthProfiles) db.healthProfiles = {}
  return db.healthProfiles[email] ?? {}
}
export function saveHealthProfile(email: string, data: Record<string, any>): Record<string, any> {
  // Reject anything that isn't a plain object so a bad payload can't corrupt the
  // stored shape via the spread; cap size so repeated saves can't grow unbounded.
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid health profile payload')
  if (JSON.stringify(data).length > 64 * 1024) throw new Error('health profile payload too large')
  if (!db.healthProfiles) db.healthProfiles = {}
  db.healthProfiles[email] = { ...db.healthProfiles[email], ...data, updatedAt: new Date().toISOString() }
  save()
  return db.healthProfiles[email]
}

// Called after a device webhook import so the data isn't just "latest values" —
// it's automatically folded into the same per-day trend history the manual form
// keeps, and stamped with a device-sync time. This makes device-pushed metrics
// appear and accumulate on the website with no manual "Save" step.
const TRACKED_TREND_KEYS = ['vo2max', 'restingHr', 'hrvMs', 'sleepH', 'weightKg', 'bodyFatPct', 'steps', 'activeKcal'] as const
export function recordDeviceHealthSync(email: string, mapped: Record<string, any>, source: string): Record<string, any> {
  if (!db.healthProfiles) db.healthProfiles = {}
  const prev = db.healthProfiles[email] ?? {}
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  // Merge today's snapshot into the trend history (one row per day; later syncs
  // in the same day refresh that day's values rather than duplicating).
  const snap: Record<string, any> = { date: today }
  for (const k of TRACKED_TREND_KEYS) if (typeof mapped[k] === 'number') snap[k] = mapped[k]
  const history: Record<string, any>[] = Array.isArray(prev.history) ? prev.history : []
  const merged = [...history.filter((s) => s?.date !== today), { ...history.find((s) => s?.date === today), ...snap }].slice(-90)

  db.healthProfiles[email] = {
    ...prev, ...mapped,
    history: merged,
    lastDeviceSyncAt: now,
    deviceSyncSource: source,
    updatedAt: now,
  }
  save()
  return db.healthProfiles[email]
}

// Opaque per-user webhook token — lets an automation on the user's phone (e.g.
// the "Health Auto Export" app reading Apple HealthKit) push data to
// POST /api/health-webhook/:token without a session login. The token itself is
// the credential, so it's random, revocable, and never guessable from the email.
export function getHealthWebhookToken(email: string): string {
  if (!db.healthWebhookTokens) db.healthWebhookTokens = {}
  const existing = Object.entries(db.healthWebhookTokens).find(([, e]) => e === email)
  if (existing) return existing[0]
  return rotateHealthWebhookToken(email)
}
export function rotateHealthWebhookToken(email: string): string {
  if (!db.healthWebhookTokens) db.healthWebhookTokens = {}
  for (const [t, e] of Object.entries(db.healthWebhookTokens)) if (e === email) delete db.healthWebhookTokens[t]
  const token = randomBytes(24).toString('hex')
  db.healthWebhookTokens[token] = email
  save()
  return token
}
export function emailForWebhookToken(token: string): string | undefined {
  return db.healthWebhookTokens?.[token]
}

// Favorite sports teams a user follows, for score-change push notifications.
// Team key format: "<leagueId>:<team display name>", e.g. "epl:Arsenal".
export function getSportsFavorites(userId: string): string[] {
  return db.sportsFavorites?.[userId] ?? []
}
export function setSportsFavorites(userId: string, teams: string[]): string[] {
  if (!db.sportsFavorites) db.sportsFavorites = {}
  const clean = Array.from(new Set(teams.filter((t) => typeof t === 'string' && t.length < 100))).slice(0, 50)
  db.sportsFavorites[userId] = clean
  save()
  return clean
}
export function allSportsFavorites(): Record<string, string[]> {
  return db.sportsFavorites ?? {}
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

// Medication reminders — a scheduler loop (see index.ts) scans these every
// minute and pushes a notification when nextFireAt has passed.
export function listReminders(userId: string): MedReminder[] {
  return db.reminders?.[userId] ?? []
}
export function addReminder(userId: string, r: Omit<MedReminder, 'id' | 'createdAt'>): MedReminder {
  if (!db.reminders) db.reminders = {}
  const rem: MedReminder = { ...r, id: uid(), createdAt: new Date().toISOString() }
  db.reminders[userId] = [...(db.reminders[userId] ?? []), rem]
  save()
  return rem
}
export function updateReminder(userId: string, id: string, patch: Partial<MedReminder>): MedReminder | null {
  if (!db.reminders?.[userId]) return null
  const list = db.reminders[userId]
  const i = list.findIndex((r) => r.id === id)
  if (i === -1) return null
  list[i] = { ...list[i], ...patch }
  save()
  return list[i]
}
export function removeReminder(userId: string, id: string) {
  if (!db.reminders?.[userId]) return
  db.reminders[userId] = db.reminders[userId].filter((r) => r.id !== id)
  save()
}
// All (userId, reminder) pairs across every user — used by the scheduler.
export function allReminders(): { userId: string; reminder: MedReminder }[] {
  const out: { userId: string; reminder: MedReminder }[] = []
  for (const [userId, list] of Object.entries(db.reminders ?? {})) {
    for (const reminder of list) out.push({ userId, reminder })
  }
  return out
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
// In-app "Pesan & Saran" — delivered to the owner's website inbox only (no
// WhatsApp/email side-channel on the server side; the frontend still offers
// those as user-initiated alternatives).
export function addFeedback(f: Feedback) {
  if (!db.feedback) db.feedback = []
  db.feedback.unshift(f)
  db.feedback = db.feedback.slice(0, 500)
  save()
}
export function listFeedback(): Feedback[] {
  return db.feedback ?? []
}
export function markFeedbackRead(id: string) {
  const f = (db.feedback ?? []).find((x) => x.id === id)
  if (f) { f.read = true; save() }
}

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

// Owner-only directory: every registered account with its transaction and
// subscription status, for "who signed up / paid / subscribed" visibility.
// Sourced from real server-side state only (db.users/db.orders/db.settings)
// — client-local-only demo data (e.g. Marketplace's simulated order list)
// is intentionally not represented here, since the owner can't see it either.
export function userDirectory() {
  const orders = db.orders ?? []
  const now = Date.now()
  return [...db.users]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => {
      const userOrders = orders.filter((o) => o.userId === u.id)
      const paidOrders = userOrders.filter((o) => o.status === 'paid')
      const settings = getSettings(u.id)
      const chronicActive = !!settings.chronicLifetime || (!!settings.chronicSubExpires && new Date(settings.chronicSubExpires).getTime() > now)
      const longevityActive = !!settings.longevitySubExpires && new Date(settings.longevitySubExpires).getTime() > now
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        walletBalance: balance(u.id),
        ordersCount: userOrders.length,
        paidOrdersCount: paidOrders.length,
        totalPaidIdr: paidOrders.reduce((a, o) => a + o.amountIdr, 0),
        subscriptions: {
          clinicalCalcUnlocked: !!settings.clinicalCalcUnlocked,
          longevityActive,
          longevityExpires: settings.longevitySubExpires ?? null,
          chronicActive,
          chronicLifetime: !!settings.chronicLifetime,
          chronicExpires: settings.chronicSubExpires ?? null,
        },
      }
    })
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

// ── Early-adopter promo: first N registered emails get a platform-wide discount.
export const EARLY_ADOPTER_LIMIT = 25
export const EARLY_ADOPTER_DISCOUNT = 0.75 // 75% off
function earlyAdopterIds(): string[] {
  return [...db.users].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, EARLY_ADOPTER_LIMIT).map((u) => u.id)
}
export function isEarlyAdopter(userId: string): boolean {
  return earlyAdopterIds().includes(userId)
}
export function earlyAdopterInfo() {
  const used = Math.min(db.users.length, EARLY_ADOPTER_LIMIT)
  return { limit: EARLY_ADOPTER_LIMIT, used, slotsLeft: Math.max(0, EARLY_ADOPTER_LIMIT - db.users.length), discountPct: Math.round(EARLY_ADOPTER_DISCOUNT * 100) }
}

// ── Clinical Calculators paywall: the first N registered accounts (by
// signup order, platform-wide) get free access forever; everyone after
// pays a one-time unlock via PNC balance or a direct IDR charge.
export const CLINICAL_CALC_FREE_LIMIT = 50
export const CLINICAL_CALC_PRICE_PNC = 500
export const CLINICAL_CALC_PRICE_IDR = 500000
function clinicalCalcFreeIds(): string[] {
  return [...db.users].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, CLINICAL_CALC_FREE_LIMIT).map((u) => u.id)
}
export function isClinicalCalcFree(userId: string): boolean {
  return clinicalCalcFreeIds().includes(userId)
}
export function clinicalCalcInfo() {
  return {
    limit: CLINICAL_CALC_FREE_LIMIT,
    slotsLeft: Math.max(0, CLINICAL_CALC_FREE_LIMIT - db.users.length),
    pricePnc: CLINICAL_CALC_PRICE_PNC,
    priceIdr: CLINICAL_CALC_PRICE_IDR,
  }
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
