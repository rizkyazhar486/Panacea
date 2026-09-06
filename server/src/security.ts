import type { RequestHandler } from 'express'
import { config } from './config.js'

export const plainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 24) return false
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.length <= 10000 && value.every(v => safeJson(v, depth + 1))
  if (plainObject(value)) return Object.entries(value).every(([key, v]) => !['__proto__', 'constructor', 'prototype'].includes(key) && safeJson(v, depth + 1))
  return value === null || ['string', 'boolean'].includes(typeof value)
}

export const requestBoundary: RequestHandler = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  // CORS hanya membatasi pembacaan respons; mutasi cookie tetap harus ditolak.
  const origin = req.headers.origin
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  if (!safeMethod && origin && !config.corsOrigins.includes(origin)) return void res.status(403).json({ error: 'untrusted_origin' })
  if (!safeMethod && req.cookies?.pmd_session && !req.headers.authorization && !origin) return void res.status(403).json({ error: 'origin_required' })
  if (req.body !== undefined && !safeJson(req.body)) return void res.status(400).json({ error: 'invalid_json' })
  next()
}

export function validPushSubscription(value: unknown): boolean {
  if (!plainObject(value) || typeof value.endpoint !== 'string' || !plainObject(value.keys)) return false
  try {
    const url = new URL(value.endpoint)
    const allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !allowed.includes(url.hostname)) return false
    return typeof value.keys.p256dh === 'string' && /^[A-Za-z0-9_-]{87}=?$/.test(value.keys.p256dh)
      && typeof value.keys.auth === 'string' && /^[A-Za-z0-9_-]{22}={0,2}$/.test(value.keys.auth)
  } catch { return false }
}
