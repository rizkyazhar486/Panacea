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

// Request permission, subscribe via the SW, and register with the backend.
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported() || !backendEnabled) return 'unavailable'
  const key = await api.pushKey().catch(() => null)
  if (!key) return 'unavailable' // VAPID not configured on the server
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'disabled'
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }))
  await api.pushSubscribe(sub.toJSON())
  return 'enabled'
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
