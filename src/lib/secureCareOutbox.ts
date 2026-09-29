import type { ButirAntrean, HasilKirim, Kirim } from './antreanCekHarian.ts'

const DB_NAME = 'panacea-secure-care-outbox-v1'
const DB_VERSION = 1
const KEY_STORE = 'keys'
const QUEUE_STORE = 'queue'
const RECEIPT_STORE = 'receipts'
const KEY_ID = 'aes-gcm-v1'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

interface EncryptedQueueRecord {
  slot: string
  clientId: string
  queuedAt: string
  ivB64: string
  ciphertextB64: string
}

export interface SecureCareReceipt {
  clientId: string
  status: 'sent'
  acknowledgedAt: string
}

export interface SecureDrainResult {
  terkirim: number
  ditolak: string[]
  sisa: number
}

export function secureCareOutboxSupported(): boolean {
  return typeof indexedDB !== 'undefined'
    && typeof crypto !== 'undefined'
    && !!crypto.subtle
    && typeof crypto.getRandomValues === 'function'
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function openDb(): Promise<IDBDatabase> {
  if (!secureCareOutboxSupported()) return Promise.reject(new Error('secure offline storage unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE)
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'slot' })
      if (!db.objectStoreNames.contains(RECEIPT_STORE)) db.createObjectStore(RECEIPT_STORE, { keyPath: 'clientId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('secure care database failed to open'))
  })
}

async function encryptionKey(db: IDBDatabase): Promise<CryptoKey> {
  {
    const tx = db.transaction(KEY_STORE, 'readonly')
    const existing = await requestResult(tx.objectStore(KEY_STORE).get(KEY_ID))
    await txDone(tx)
    if (existing instanceof CryptoKey) return existing
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable: the raw key is never persisted as app-readable text
    ['encrypt', 'decrypt'],
  )
  const tx = db.transaction(KEY_STORE, 'readwrite')
  tx.objectStore(KEY_STORE).put(key, KEY_ID)
  await txDone(tx)
  return key
}

function b64(bytes: Uint8Array): string {
  let binary = ''
  for (const value of bytes) binary += String.fromCharCode(value)
  return btoa(binary)
}

function fromB64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function slotFor(item: Pick<ButirAntrean, 'planId' | 'scheduledFor'>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${item.planId}\u0000${item.scheduledFor}`))
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function encryptItem(key: CryptoKey, item: ButirAntrean): Promise<EncryptedQueueRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const additionalData = encoder.encode(`care-outbox:${item.clientId}`)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    encoder.encode(JSON.stringify(item)),
  )
  return {
    slot: await slotFor(item),
    clientId: item.clientId,
    queuedAt: new Date().toISOString(),
    ivB64: b64(iv),
    ciphertextB64: b64(new Uint8Array(ciphertext)),
  }
}

async function decryptItem(key: CryptoKey, record: EncryptedQueueRecord): Promise<ButirAntrean> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromB64(record.ivB64),
      additionalData: encoder.encode(`care-outbox:${record.clientId}`),
    },
    key,
    fromB64(record.ciphertextB64),
  )
  const parsed = JSON.parse(decoder.decode(plaintext)) as ButirAntrean
  if (!parsed || parsed.clientId !== record.clientId || typeof parsed.planId !== 'string' || !Array.isArray(parsed.answers)) {
    throw new Error('encrypted care outbox integrity check failed')
  }
  return parsed
}

async function putReceipt(db: IDBDatabase, clientId: string) {
  const tx = db.transaction(RECEIPT_STORE, 'readwrite')
  const receipt: SecureCareReceipt = { clientId, status: 'sent', acknowledgedAt: new Date().toISOString() }
  tx.objectStore(RECEIPT_STORE).put(receipt)
  await txDone(tx)
}

export async function queueEncryptedCareReport(item: ButirAntrean): Promise<void> {
  const db = await openDb()
  try {
    const key = await encryptionKey(db)
    const record = await encryptItem(key, item)
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).put(record) // slot key replaces same plan/day deterministically
    await txDone(tx)
  } finally {
    db.close()
  }
}

export async function readEncryptedCareQueue(): Promise<ButirAntrean[]> {
  const db = await openDb()
  try {
    const key = await encryptionKey(db)
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const records = await requestResult(tx.objectStore(QUEUE_STORE).getAll()) as EncryptedQueueRecord[]
    await txDone(tx)
    const items: ButirAntrean[] = []
    for (const record of records) items.push(await decryptItem(key, record))
    return items.sort((a, b) => Date.parse(a.authoredAt) - Date.parse(b.authoredAt))
  } finally {
    db.close()
  }
}

async function removeEncryptedCareReport(item: ButirAntrean, acknowledged: boolean): Promise<void> {
  const db = await openDb()
  try {
    const slot = await slotFor(item)
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(slot)
    await txDone(tx)
    if (acknowledged) await putReceipt(db, item.clientId)
  } finally {
    db.close()
  }
}

export async function encryptedCareOutboxCount(): Promise<number> {
  const db = await openDb()
  try {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const count = await requestResult(tx.objectStore(QUEUE_STORE).count())
    await txDone(tx)
    return count
  } finally {
    db.close()
  }
}

const networkFailure = (error: unknown) => error instanceof TypeError

export async function sendOrQueueEncryptedCareReport(
  item: ButirAntrean,
  send: Kirim,
): Promise<HasilKirim> {
  try {
    await send(item)
    if (secureCareOutboxSupported()) {
      const db = await openDb()
      try { await putReceipt(db, item.clientId) } finally { db.close() }
    }
    return { status: 'terkirim' }
  } catch (error) {
    if (!networkFailure(error)) return { status: 'ditolak', pesan: (error as Error).message }
    if (!secureCareOutboxSupported()) {
      return {
        status: 'ditolak',
        pesan: 'Offline and secure encrypted storage is unavailable on this device. Your answers were not stored.',
      }
    }
    try {
      await queueEncryptedCareReport(item)
      return { status: 'diantre' }
    } catch {
      return {
        status: 'ditolak',
        pesan: 'Offline and encrypted storage could not be opened. Your answers were not stored.',
      }
    }
  }
}

export async function drainEncryptedCareOutbox(send: Kirim): Promise<SecureDrainResult> {
  if (!secureCareOutboxSupported()) return { terkirim: 0, ditolak: [], sisa: 0 }
  const items = await readEncryptedCareQueue()
  let terkirim = 0
  const ditolak: string[] = []

  for (const item of items) {
    try {
      await send(item)
      terkirim++
      await removeEncryptedCareReport(item, true)
    } catch (error) {
      if (networkFailure(error)) break
      ditolak.push((error as Error).message)
      // A deterministic server rejection (revoked plan, invalid schema) will
      // never succeed by replaying forever; remove the encrypted item.
      await removeEncryptedCareReport(item, false)
    }
  }

  return { terkirim, ditolak, sisa: await encryptedCareOutboxCount() }
}

export const SECURE_CARE_OUTBOX_CONTRACT =
  'Offline daily-care answers are stored only as AES-GCM ciphertext in IndexedDB with a non-extractable device CryptoKey. There is no plaintext localStorage fallback; successful server acknowledgement removes the queued ciphertext while idempotency remains clientId-based.'
