import { config, features } from './config.js'
import { listPushSubs, removePushSub, addNotification } from './store.js'

// Web Push sender. The `web-push` package is imported indirectly so the project
// type-checks even before `npm install` adds it; pushes are no-ops unless VAPID
// keys are configured.
let configured = false
let webpush: any = null

async function ensure(): Promise<boolean> {
  if (!features.pushLive) return false
  if (configured) return true
  try {
    webpush = await import('web-push' as string)
    webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey)
    configured = true
    return true
  } catch {
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
  let sent = 0
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload))
        sent += 1
      } catch (e: any) {
        // 404/410 = subscription expired/unsubscribed → remove it.
        if (e?.statusCode === 404 || e?.statusCode === 410) removePushSub(userId, sub.endpoint)
      }
    }),
  )
  return sent
}

// Deliver a notification both ways: persist to the in-app inbox AND send a push.
export async function notify(userId: string, payload: PushPayload): Promise<number> {
  addNotification(userId, { title: payload.title, body: payload.body, url: payload.url })
  return sendPush(userId, payload)
}
