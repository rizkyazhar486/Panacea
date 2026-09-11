// Central data-update bus for Panacea.
//
// Existing pages historically listened to `panacea:health-updated`. Keep that
// event alive for compatibility, but also publish a structured event and a
// BroadcastChannel message so current/future consumers can react to the exact
// data domains that changed — including changes made in another browser tab.

export const DATA_UPDATE_EVENT = 'panacea:data-updated'
export const LEGACY_HEALTH_UPDATE_EVENT = 'panacea:health-updated'
const CHANNEL_NAME = 'panacea-data-sync-v1'

export type DataDomain = 'health' | 'profile' | 'workouts' | 'hr-notifications' | 'history' | 'unknown'

export interface DataUpdateDetail {
  domains: DataDomain[]
  source: string
  at: number
}

let channel: BroadcastChannel | null | undefined

function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel
  try {
    channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null
  } catch {
    channel = null
  }
  return channel
}

function normalized(domains: DataDomain[]): DataDomain[] {
  const unique = [...new Set(domains)]
  return unique.length ? unique : ['unknown']
}

export function publishDataUpdate(domains: DataDomain[] = ['health'], source = 'local'): void {
  const detail: DataUpdateDetail = { domains: normalized(domains), source, at: Date.now() }
  try { window.dispatchEvent(new CustomEvent<DataUpdateDetail>(DATA_UPDATE_EVENT, { detail })) } catch { /* SSR/test */ }
  // Compatibility for the many existing components that already subscribe to
  // this event. Do not force a whole-repo migration just to gain typed updates.
  try { window.dispatchEvent(new Event(LEGACY_HEALTH_UPDATE_EVENT)) } catch { /* SSR/test */ }
  try { getChannel()?.postMessage(detail) } catch { /* unsupported/private mode */ }
}

export function subscribeDataUpdates(listener: (detail: DataUpdateDetail) => void): () => void {
  const onLocal = (event: Event) => {
    const detail = (event as CustomEvent<DataUpdateDetail>).detail
    listener(detail && Array.isArray(detail.domains)
      ? detail
      : { domains: ['unknown'], source: 'local-event', at: Date.now() })
  }
  const onStorage = (event: StorageEvent) => {
    // Only Panacea-owned keys can represent relevant app data. This keeps a
    // busy multi-tab browser from re-rendering the app for unrelated storage.
    if (event.key && !event.key.startsWith('pmd_') && !event.key.startsWith('pmd-')) return
    listener({ domains: ['unknown'], source: 'storage', at: Date.now() })
  }
  const bc = getChannel()
  const onMessage = (event: MessageEvent<DataUpdateDetail>) => {
    const detail = event.data
    if (!detail || !Array.isArray(detail.domains)) return
    listener(detail)
  }

  try { window.addEventListener(DATA_UPDATE_EVENT, onLocal) } catch { /* SSR/test */ }
  try { window.addEventListener('storage', onStorage) } catch { /* SSR/test */ }
  try { bc?.addEventListener('message', onMessage) } catch { /* unsupported */ }

  return () => {
    try { window.removeEventListener(DATA_UPDATE_EVENT, onLocal) } catch { /* SSR/test */ }
    try { window.removeEventListener('storage', onStorage) } catch { /* SSR/test */ }
    try { bc?.removeEventListener('message', onMessage) } catch { /* unsupported */ }
  }
}
