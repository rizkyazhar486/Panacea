// Rute HTTP review manusia opsional (T-HR-02): identitas opsional, append-only, dibatasi laju, tanpa PHI, AI ditolak.
// Tidak ada PUT/PATCH/DELETE: riwayat tidak bisa diubah lewat API.
import type { Express, Request, RequestHandler } from 'express'
import { timingSafeEqual } from 'node:crypto'
import { classifyAuthor, createReview, labelFor, withdrawReview } from '../domain/review.js'
import type { HumanReviewEntry, Rejection, ReviewInput } from '../domain/review.js'

export interface DepReview {
  currentUserId: (req: Request) => string | undefined
  baca: () => readonly HumanReviewEntry[]
  tambah: (e: HumanReviewEntry) => void
  now: () => Date
  newId: () => string
  mcpToken?: string
  writeLimiter: RequestHandler
}

const STATUS: Partial<Record<Rejection, number>> = { 'ai-author-forbidden': 403, 'not-author': 403, 'not-withdrawable': 403, 'already-withdrawn': 409, 'unknown-supersedes': 404 }
const TASK = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){1,6}$/

const samaToken = (header: string | undefined, token: string | undefined) => {
  const m = header?.trim().match(/^Bearer\s+(.+)$/i)
  if (!m || !token) return false
  const a = Buffer.from(m[1]), b = Buffer.from(token)
  return a.byteLength === b.byteLength && timingSafeEqual(a, b)
}
// penulis_id tidak pernah dikirim keluar: atribusi publik hanya nama/peran yang dinyatakan peninjau
const publik = (e: HumanReviewEntry) => { const { authorUserId: _omit, ...rest } = e; return rest }

export function pasangRuteReviewManusia(app: Express, d: DepReview): void {
  const author = (req: Request) => classifyAuthor({
    userAgent: req.get('user-agent'),
    agentHeader: req.get('x-panacea-agent') ?? req.get('x-ai-agent'),
    usedMcpToken: samaToken(req.get('authorization'), d.mcpToken),
    userId: d.currentUserId(req),
  })

  app.get('/api/human-reviews/:taskId', (req, res) => {
    const taskId = String(req.params.taskId)
    if (!TASK.test(taskId)) { res.status(400).json({ error: 'invalid-task' }); return }
    const version = typeof req.query.version === 'string' ? req.query.version : ''
    const log = d.baca()
    res.json({ taskId, entries: log.filter((e) => e.taskId === taskId).map(publik), label: labelFor(log, taskId, version) })
  })

  app.post('/api/human-reviews', d.writeLimiter, (req, res) => {
    const body = (req.body ?? {}) as ReviewInput & { supersedes?: unknown }
    const supersedes = typeof body.supersedes === 'string' ? body.supersedes : null
    const r = createReview(body, author(req), d.baca(), d.now().toISOString(), d.newId(), supersedes)
    if (!r.ok) { res.status(STATUS[r.reason] ?? 400).json({ error: r.reason }); return }
    d.tambah(r.value)
    res.status(201).json({ review: publik(r.value) })
  })

  app.post('/api/human-reviews/:id/withdraw', d.writeLimiter, (req, res) => {
    const a = author(req)
    if (a.kind === 'human' && !a.userId) { res.status(401).json({ error: 'unauthorized' }); return }
    const r = withdrawReview(String(req.params.id), a, d.baca(), d.now().toISOString(), d.newId())
    if (!r.ok) { res.status(STATUS[r.reason] ?? 400).json({ error: r.reason }); return }
    d.tambah(r.value)
    res.status(201).json({ withdrawal: publik(r.value) })
  })
}
