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

function seedPatients(): any[] {
  return [
    { id: 'p1', name: 'Bpk. Hartono Wijaya', sex: 'L', dob: '1952-04-12', mrn: 'PMD-000124', heightCm: 168, weightKg: 78, bloodType: 'O+', allergies: ['Penisilin'], chronicConditions: ['Hipertensi', 'Diabetes Melitus tipe 2'], riskFlags: ['chronic', 'elderly'], avatarColor: '#00BF63' },
    { id: 'p2', name: 'Ibu Siti Rahayu', sex: 'P', dob: '1968-09-30', mrn: 'PMD-000219', heightCm: 156, weightKg: 49, bloodType: 'B+', allergies: [], chronicConditions: ['PPOK', 'Riwayat TB paru'], riskFlags: ['chronic', 'immunocompromised'], avatarColor: '#FF3131' },
    { id: 'p3', name: 'Sdr. Andi Pratama', sex: 'L', dob: '1995-02-18', mrn: 'PMD-000388', heightCm: 174, weightKg: 92, bloodType: 'A+', allergies: [], chronicConditions: ['Obesitas', 'Dislipidemia'], riskFlags: ['chronic'], avatarColor: '#0B7A4B' },
    { id: 'p4', name: 'An. Bilal Ramadhan', sex: 'L', dob: '2018-05-20', mrn: 'PMD-000451', heightCm: 96, weightKg: 12.4, bloodType: 'O+', allergies: ['Susu sapi'], chronicConditions: ['Gizi kurang', 'Asma'], riskFlags: ['chronic'], avatarColor: '#FF8A3D' },
  ]
}

interface DB {
  users: User[]
  wallets: Record<string, number> // userId -> PNC balance
  txs: Tx[]
  orders: Order[]
  posts: Post[]
  clinical: Clinical
}

let db: DB = {
  users: [],
  wallets: {},
  txs: [],
  orders: [],
  posts: [],
  clinical: { patients: seedPatients(), vitals: {}, supportive: {}, records: {}, education: {} },
}

function load() {
  if (existsSync(DB_PATH)) {
    try {
      db = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    } catch {
      /* keep defaults */
    }
  }
}
function save() {
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch {
    /* ignore in read-only envs */
  }
}
load()

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
