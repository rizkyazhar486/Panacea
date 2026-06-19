import type { Request, Response } from 'express'
import type { User } from './store.js'

// Server-side Claude proxy — keeps the Anthropic key on the server so AI works
// for every signed-in user without anyone pasting a key in the browser.
const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-8',
  'claude-haiku-4-5-20251001',
])

// Lightweight per-user rate limit (protects the API bill from abuse).
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, { n: number; t: number }>()
function rateLimited(userId: string): boolean {
  const now = Date.now()
  const cur = hits.get(userId)
  if (!cur || now - cur.t > WINDOW_MS) {
    hits.set(userId, { n: 1, t: now })
    return false
  }
  cur.n += 1
  return cur.n > MAX_PER_WINDOW
}

export async function aiMessages(req: Request, res: Response) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(503).json({ error: 'ai_not_configured' })

  const user = (req as Request & { user: User }).user
  if (rateLimited(user.id)) return res.status(429).json({ error: 'rate_limited' })

  const body = req.body as {
    model?: string
    system?: string
    messages?: { role: 'user' | 'assistant'; content: string }[]
    max_tokens?: number
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'bad_messages' })
  }
  const model = ALLOWED_MODELS.has(body.model || '') ? body.model! : 'claude-sonnet-4-6'

  try {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(Math.max(Number(body.max_tokens) || 2048, 256), 4096),
        system: body.system || '',
        messages: body.messages,
      }),
    })
    if (!r.ok) {
      const txt = await r.text()
      return res.status(502).json({ error: 'upstream', detail: txt.slice(0, 300) })
    }
    const data = (await r.json()) as { content?: { type: string; text?: string }[] }
    const block = (data.content || []).find((b) => b.type === 'text')
    res.json({ text: block?.text ?? '' })
  } catch (e) {
    res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
  }
}
