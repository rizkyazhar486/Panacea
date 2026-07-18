import { api, backendEnabled } from './api'

// Web Push enrollment helper. Degrades gracefully: returns a status the UI can
// show. Requires a service worker (registered in main.tsx) and VAPID configured
// on the backend.
export type PushStatus = 'unsupported' | 'disabled' | 'enabled' | 'denied' | 'unavailable'

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function pushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported'
  if (!backendEnabled) return 'unavailable'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready.catch(() => null)
  const sub = await reg?.pushManager.getSubscription().catch(() => null)
  return sub ? 'enabled' : 'disabled'
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false
  const cur = new Uint8Array(a)
  return cur.length === b.length && cur.every((v, i) => v === b[i])
}

// Get a subscription that's actually valid for the server's CURRENT VAPID key.
// A subscription is permanently bound to whichever applicationServerKey was
// used when it was created — if the server's VAPID key ever changes (key
// rotation, or the owner only just configured it after a device had already
// "enabled" push against no key / a different one), the old subscription can
// never be delivered to again and must be dropped, not reused.
async function getFreshSubscription(): Promise<PushSubscription | null> {
  const key = await api.pushKey().catch(() => null)
  if (!key) return null // VAPID not configured on the server
  const reg = await navigator.serviceWorker.ready
  const desiredKey = urlBase64ToUint8Array(key)
  let existing = await reg.pushManager.getSubscription()
  if (existing && !sameKey(existing.options?.applicationServerKey, desiredKey)) {
    await existing.unsubscribe().catch(() => {})
    existing = null
  }
  return existing ?? reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: desiredKey as BufferSource })
}

// Request permission, subscribe via the SW (dropping any stale/mismatched
// subscription first), and register with the backend.
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported() || !backendEnabled) return 'unavailable'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'disabled'
  const sub = await getFreshSubscription()
  if (!sub) return 'unavailable'
  await api.pushSubscribe(sub.toJSON())
  return 'enabled'
}

// Self-heal the "active but no registered devices" mismatch: re-register this
// browser's subscription with the backend (the backend can lose it on
// restart, the first subscribe call may have failed, or the server's VAPID
// key changed since this device last subscribed). Idempotent — safe to call
// on every mount/focus.
export async function resyncPush(): Promise<boolean> {
  if (!pushSupported() || !backendEnabled) return false
  if (Notification.permission !== 'granted') return false
  try {
    const sub = await getFreshSubscription()
    if (!sub) return false
    await api.pushSubscribe(sub.toJSON())
    return true
  } catch { return false }
}

export async function disablePush(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported'
  const reg = await navigator.serviceWorker.ready.catch(() => null)
  const sub = await reg?.pushManager.getSubscription().catch(() => null)
  if (sub) {
    await api.pushUnsubscribe(sub.endpoint).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  return 'disabled'
}
