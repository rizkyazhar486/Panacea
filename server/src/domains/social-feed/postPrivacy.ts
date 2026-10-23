// Privasi umpan sosial. Reaksi disimpan sebagai emoji -> daftar surel pereaksi; mengirim daftar itu apa adanya ke
// siapa pun (termasuk pemanggil tanpa sesi) membocorkan surel setiap pereaksi. Klien memakai daftar itu untuk
// MENGHITUNG reaksi dan untuk tahu apakah pemirsa sudah bereaksi, jadi bentuknya dipertahankan:
// surel pemirsa sendiri tetap asli, surel orang lain diganti token tak-bermakna yang stabil (HMAC rahasia server).
// Murni: tanpa DOM/jaringan; rahasia disuntikkan.
import { createHmac } from 'node:crypto'
import type { Post } from '../../store.js'

export function tokenPereaksi(rahasia: string, postId: string, emoji: string, email: string): string {
  return 'anon:' + createHmac('sha256', rahasia).update(`${postId}\n${emoji}\n${email.toLowerCase()}`).digest('hex').slice(0, 16)
}

/** Salinan pos yang aman dikirim ke pemirsa tertentu (atau tanpa sesi bila emailPemirsa kosong). Tidak mengubah data tersimpan. */
export function postUntukPemirsa(post: Post, emailPemirsa: string | undefined, rahasia: string): Post {
  if (!post.reactions) return post
  const pemirsa = emailPemirsa?.toLowerCase()
  const reactions: Record<string, string[]> = {}
  for (const [emoji, daftar] of Object.entries(post.reactions)) {
    reactions[emoji] = daftar.map((email) => (pemirsa && email.toLowerCase() === pemirsa ? email : tokenPereaksi(rahasia, post.id, emoji, email)))
  }
  return { ...post, reactions }
}
