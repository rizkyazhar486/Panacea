import assert from 'node:assert/strict'
import { buildPersistedSnapshot, stripHeavyPostMedia } from '../../src/lib/state/storePersistScope.ts'
import type { SocialPost } from '../../src/lib/types.ts'

const base: Partial<SocialPost> = {
  id: 'p1',
  authorId: 'u1',
  createdAt: '2026-10-18T00:00:00.000Z',
  caption: 'hi',
  mediaColor: '#fff',
}

// Positif: post dengan foto base64 → photos/videoUrl dibuang dari snapshot persist.
const withMedia = { ...base, photos: ['data:image/png;base64,AAAA'], videoUrl: 'blob:abc' } as SocialPost
const [strippedMedia] = stripHeavyPostMedia([withMedia])
assert.equal(strippedMedia.photos, undefined)
assert.equal(strippedMedia.videoUrl, undefined)
assert.equal(strippedMedia.id, 'p1', 'field non-media tetap utuh')

// Negatif: post tanpa foto/video sama sekali tidak diubah (bukan dikosongkan paksa).
const noMedia = { ...base } as SocialPost
const [strippedNoMedia] = stripHeavyPostMedia([noMedia])
assert.deepEqual(strippedNoMedia, noMedia, 'post tanpa media tidak boleh ikut dimutasi/di-clone beda referensi nilai')

// buildPersistedSnapshot mempertahankan field lain di luar `posts` apa adanya.
const snapshot = buildPersistedSnapshot({ posts: [withMedia], settings: { lang: 'en' } })
assert.equal(snapshot.settings.lang, 'en')
assert.equal(snapshot.posts[0].photos, undefined)

console.log('store-persist-scope: heavy post media (photos/videoUrl) dibuang sebelum localStorage.setItem, field lain utuh.')
