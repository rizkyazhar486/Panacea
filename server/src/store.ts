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

interface DB {
  users: User[]
  wallets: Record<string, number> // userId -> PNC balance
  txs: Tx[]
  orders: Order[]
}

let db: DB = { users: [], wallets: {}, txs: [], orders: [] }

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
