// The one place recall practice touches storage: a log kept in this browser only (localStorage), under a key the
// caller names. It holds the learner's own self-ratings of reference material — no patient data, no account sync.
// Every storage failure (blocked in a private window or a sandbox, quota, an accessor that throws) is reported as a
// result, never thrown, so practice still works for the visit and the page can say that nothing was kept.

export type RecallStoreLoad = { ok: true; raw: string | null } | { ok: false; reason: 'unavailable' }
export type RecallStoreSave = { ok: true } | { ok: false; reason: 'unavailable' }

export interface RecallStore {
  load(): RecallStoreLoad
  save(raw: string): RecallStoreSave
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** `storage` is injected for tests; by default it is the page's localStorage, looked up on every call. */
export function browserRecallStore(key: string, storage: () => StorageLike | null | undefined = () => globalThis.localStorage): RecallStore {
  const area = (): StorageLike | null => {
    try { return storage() ?? null } catch { return null }
  }
  return {
    load() {
      const target = area()
      if (!target) return { ok: false, reason: 'unavailable' }
      try { return { ok: true, raw: target.getItem(key) } } catch { return { ok: false, reason: 'unavailable' } }
    },
    save(raw) {
      const target = area()
      if (!target) return { ok: false, reason: 'unavailable' }
      try { target.setItem(key, raw); return { ok: true } } catch { return { ok: false, reason: 'unavailable' } }
    },
  }
}
