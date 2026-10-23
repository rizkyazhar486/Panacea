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
