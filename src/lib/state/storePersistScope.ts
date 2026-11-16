import type { SocialPost } from '../types'

/**
 * Shape of `AppState` actually safe/worth writing to localStorage: no heavy
 * per-post media. Uploaded photo/video data URLs can be megabytes each and are
 * never the source of truth for that media (server-backed when a backend is
 * configured, re-pulled by the posts poll) — carrying them through every
 * persist write is pure serialize cost for no gain. See AUDIT_STATUS_REVAMP_UI.md
 * ("DILARANG MENGARANG MOCK / LOCALSTORAGE SENDIRI" for unverified backend data).
 */
export function stripHeavyPostMedia(posts: SocialPost[]): SocialPost[] {
  return posts.map((p) => (p.photos?.length || p.videoUrl ? { ...p, photos: undefined, videoUrl: undefined } : p))
}

export function buildPersistedSnapshot<T extends { posts: SocialPost[] }>(state: T): T {
  return { ...state, posts: stripHeavyPostMedia(state.posts) }
}

/**
 * Sidik murah untuk teks JSON yang akan ditulis: panjang + hash 32-bit (FNV-1a). Dipakai untuk melewati
 * penulisan localStorage yang isinya sama persis dengan penulisan terakhir, tanpa menyimpan salinan
 * seluruh state di memori. Bukan hash kriptografis; tabrakan hanya berarti satu penulisan dilewati
 * dan akan tertulis pada perubahan berikutnya.
 */
export function persistFingerprint(json: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < json.length; i += 1) {
    h ^= json.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `${json.length}:${h.toString(16)}`
}
