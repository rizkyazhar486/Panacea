import { config, features } from './config.js'
import { listPushSubs, removePushSub, addNotification, getSettings } from './store.js'

// Web Push sender. The `web-push` package is imported indirectly so the project
// type-checks even before `npm install` adds it; pushes are no-ops unless VAPID
// keys are configured.
let configured = false
let webpush: any = null
/* SEBAB KEGAGALAN TERAKHIR DISIMPAN, bukan hanya dicetak ke log.
   Kunci VAPID yang salah tempel — spasi ikut tersalin, panjangnya kurang —
   gagal persis di sini, dan satu-satunya jejaknya selama ini adalah satu baris
   di log Render yang tidak pernah dilihat pemakainya. Disimpan supaya
   /api/push/status dapat menyebutkannya, dan panel diagnosa di aplikasi dapat
   membedakan "kunci belum diisi" dari "kunci diisi tetapi ditolak". */
let galatSiapan = ''

export function keadaanPush(): { vapidTerpasang: boolean; galat: string } {
  return { vapidTerpasang: configured, galat: galatSiapan }
}

async function ensure(): Promise<boolean> {
  if (!features.pushLive) return false
  if (configured) return true
  try {
    // web-push is a plain CommonJS package (module.exports = {...}), not ESM.
    // Depending on the Node/runtime's CJS-ESM interop, a dynamic import() can
    // land the real exports under `.default` instead of on the namespace
    // object directly — if we only ever read `webpush.setVapidDetails`
    // without this fallback, it can silently be `undefined`, throw, and get
    // swallowed by this try/catch, permanently disabling push with no
    // visible cause even though the VAPID keys themselves are fine.
    const mod: any = await import('web-push' as string)
    webpush = mod?.setVapidDetails ? mod : mod?.default
    if (!webpush?.setVapidDetails || !webpush?.sendNotification) {
      throw new Error('web-push module did not expose the expected functions (unexpected export shape)')
    }
    webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey)
    configured = true
    galatSiapan = ''
    return true
  } catch (e) {
    // Surface the real reason in logs — a malformed VAPID key (stray
    // whitespace from a copy-paste, wrong length) or an import/interop issue
    // fails silently here otherwise, and every push send would return 0 with
    // no clue why. Check Render's Logs tab for this line if push still
    // doesn't work after VAPID keys are set correctly.
    galatSiapan = (e as Error).message
    console.error('[push] VAPID setup failed — check VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY for typos/whitespace, or that the web-push package installed correctly:', (e as Error).message)
    return false
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// Send a notification to every device a user has subscribed; prune dead ones.
export async function sendPush(userId: string, payload: PushPayload): Promise<number> {
  if (!(await ensure())) return 0
  const subs = listPushSubs(userId)
  if (subs.length === 0) console.log(`[push] no subscriptions on file for user ${userId} — device needs to (re)enable push`)
  let sent = 0
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload))
        sent += 1
      } catch (e: any) {
        // 404/410 = subscription expired/unsubscribed → prune it.
        // 401/403 = VAPID key mismatch (this subscription was created against
        // a DIFFERENT server key, e.g. before VAPID was configured, or from a
        // prior key rotation) — also prune it; the client re-subscribes fresh
        // against the current key next time it calls enablePush()/resyncPush().
        if ([401, 403, 404, 410].includes(e?.statusCode)) removePushSub(userId, sub.endpoint)
        console.error(`[push] send failed (status ${e?.statusCode ?? 'unknown'}):`, e?.body || e?.message || e)
      }
    }),
  )
  return sent
}

// Deliver a notification both ways: persist to the in-app inbox AND send a push.
// If a preference key is given and the user disabled it, the notification is
// skipped entirely (inbox + push).
/*
 * ALAMAT DIBAKUKAN DI SATU TEMPAT, bukan dipercayakan pada tiap pemanggil.
 *
 * Aplikasinya memakai HashRouter: satu-satunya alamat yang berarti adalah yang
 * memuat '#/'. Tujuh pemanggil di berkas lain menuliskan '/billing', '/owner',
 * dan '/med-reminders' — alamat yang PADA APLIKASI INI TIDAK ADA, sehingga
 * setiap ketukan pada notifikasi itu mendarat di halaman 404. Cacat seperti itu
 * tidak dapat diperbaiki dengan memperbaiki ketujuh pemanggilnya saja: yang
 * kedelapan akan ditulis dengan cara yang sama, dan tidak ada satu pun uji yang
 * menangkapnya. Karena itu pembakuannya diletakkan pada pintu yang dilewati
 * SEMUA notifikasi.
 */
function bakukanUrl(url?: string): string | undefined {
  if (!url) return undefined
  const u = url.trim()
  if (!u) return undefined
  if (u.includes('#/')) return u
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return `./#/${u.replace(/^\.?\/+/, '')}`
}

export async function notify(userId: string, payload: PushPayload, pref?: string): Promise<number> {
  if (pref && getSettings(userId)[pref] === false) return 0
  const rapi: PushPayload = { ...payload, url: bakukanUrl(payload.url) }
  addNotification(userId, { title: rapi.title, body: rapi.body, url: rapi.url })
  return sendPush(userId, rapi)
}
