import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Server } from 'node:http'
import type { Express, Request, Response } from 'express'
import { config } from './config.js'
import { currentUser, requireAuth } from './auth.js'

export type GenomicsJobKind = 'ont-basecalling' | 'pharmcat' | 'sv-calling'

type GenomicsInputRef = {
  uri: string
  sha256?: string
  sizeBytes?: number
  format?: string
}

type GenomicsSubmitBody = {
  kind?: GenomicsJobKind
  input?: GenomicsInputRef
  parameters?: Record<string, unknown>
}

type WorkerPayload = Record<string, unknown>

type SignedJob = {
  v: 1
  id: string
  owner: string
}

const JOB_KINDS: GenomicsJobKind[] = ['ont-basecalling', 'pharmcat', 'sv-calling']
const INPUT_SCHEMES = new Set(['https:', 's3:', 'gs:'])
const HANDLE_VERSION = 1
const MAX_PARAMETER_BYTES = 32 * 1024
const MAX_INPUT_URI_LENGTH = 4096
const attachedApps = new WeakSet<Express>()

class WorkerNotConfiguredError extends Error {}
class WorkerRequestError extends Error {
  status: number
  code: string
  detail?: unknown

  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

function getExpressApp(server: Server): Express | null {
  const listener = server.listeners('request')[0] as unknown
  if (typeof listener !== 'function') return null
  const app = listener as Express
  if (typeof app.get !== 'function' || typeof app.post !== 'function') return null
  return app
}

function safeJsonSize(value: unknown) {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function validateInput(input: unknown): GenomicsInputRef | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const candidate = input as Record<string, unknown>
  if (typeof candidate.uri !== 'string' || !candidate.uri.trim() || candidate.uri.length > MAX_INPUT_URI_LENGTH) return null

  let parsed: URL
  try {
    parsed = new URL(candidate.uri)
  } catch {
    return null
  }
  if (!INPUT_SCHEMES.has(parsed.protocol)) return null

  const result: GenomicsInputRef = { uri: candidate.uri.trim() }
  if (typeof candidate.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(candidate.sha256)) result.sha256 = candidate.sha256.toLowerCase()
  if (typeof candidate.sizeBytes === 'number' && Number.isFinite(candidate.sizeBytes) && candidate.sizeBytes >= 0) result.sizeBytes = Math.floor(candidate.sizeBytes)
  if (typeof candidate.format === 'string' && candidate.format.trim()) result.format = candidate.format.trim().slice(0, 64)
  return result
}

function validateParameters(parameters: unknown): Record<string, unknown> | undefined {
  if (parameters == null) return undefined
  if (typeof parameters !== 'object' || Array.isArray(parameters)) return undefined
  if (safeJsonSize(parameters) > MAX_PARAMETER_BYTES) return undefined
  return parameters as Record<string, unknown>
}

function encodeHandle(payload: SignedJob) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = createHmac('sha256', config.jwtSecret).update(body).digest('base64url')
  return `${body}.${signature}`
}

function decodeHandle(handle: string, ownerId: string): SignedJob | null {
  const [body, signature, extra] = handle.split('.')
  if (!body || !signature || extra) return null
  const expected = createHmac('sha256', config.jwtSecret).update(body).digest('base64url')
  const suppliedBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SignedJob>
    if (parsed.v !== HANDLE_VERSION || typeof parsed.id !== 'string' || !parsed.id || parsed.id.length > 200) return null
    if (parsed.owner !== ownerId) return null
    return parsed as SignedJob
  } catch {
    return null
  }
}

function workerBaseUrl() {
  const base = config.genomics.workerUrl.replace(/\/+$/, '')
  if (!base) throw new WorkerNotConfiguredError('Genomics compute worker is not configured on the Render backend.')
  return base
}

function publicWorkerPayload(payload: WorkerPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !['id', 'jobId', 'ownerId'].includes(key)),
  )
}

async function parseWorkerResponse(response: globalThis.Response) {
  const text = await response.text()
  if (!text) return {} as WorkerPayload
  try {
    return JSON.parse(text) as WorkerPayload
  } catch {
    return { message: text.slice(0, 2000) } as WorkerPayload
  }
}

async function workerRequest(path: string, init: RequestInit = {}) {
  const base = workerBaseUrl()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.genomics.timeoutMs)
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(config.genomics.workerToken ? { Authorization: `Bearer ${config.genomics.workerToken}` } : {}),
        ...(init.headers || {}),
      },
    })
    const payload = await parseWorkerResponse(response)
    if (!response.ok) {
      throw new WorkerRequestError(
        response.status,
        'genomics_worker_error',
        typeof payload.message === 'string' ? payload.message : `Genomics worker returned HTTP ${response.status}.`,
        payload,
      )
    }
    return payload
  } catch (error) {
    if (error instanceof WorkerRequestError || error instanceof WorkerNotConfiguredError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new WorkerRequestError(504, 'genomics_worker_timeout', 'Genomics worker request timed out.')
    }
    throw new WorkerRequestError(502, 'genomics_worker_unreachable', error instanceof Error ? error.message : 'Genomics worker could not be reached.')
  } finally {
    clearTimeout(timer)
  }
}

function respondError(res: Response, error: unknown) {
  if (error instanceof WorkerNotConfiguredError) {
    return res.status(503).json({
      error: 'genomics_worker_not_configured',
      configured: false,
      message: error.message,
    })
  }
  if (error instanceof WorkerRequestError) {
    return res.status(error.status).json({ error: error.code, message: error.message, detail: error.detail })
  }
  return res.status(500).json({ error: 'genomics_control_plane_error', message: error instanceof Error ? error.message : 'Unknown genomics control-plane error.' })
}

function authenticatedUserId(req: Request) {
  return currentUser(req)?.id || ''
}

function renderRuntime() {
  return {
    render: process.env.RENDER === 'true',
    serviceName: process.env.RENDER_SERVICE_NAME || null,
    serviceId: process.env.RENDER_SERVICE_ID || null,
    revision: process.env.RENDER_GIT_COMMIT || null,
  }
}

export function attachGenomicsComputeRoutes(server: Server) {
  const app = getExpressApp(server)
  if (!app) {
    console.warn('  Genomics:     unable to attach compute routes (Express request listener not found)')
    return
  }

  if (attachedApps.has(app)) return
  attachedApps.add(app)

  app.get('/api/genomics/compute/capabilities', (_req, res) => {
    res.json({
      backend: 'render-control-plane',
      configured: Boolean(config.genomics.workerUrl),
      provider: config.genomics.provider,
      runtime: renderRuntime(),
      jobKinds: JOB_KINDS,
      inputSchemes: [...INPUT_SCHEMES].map((scheme) => scheme.replace(':', '')),
      inlineUpload: false,
      contract: {
        submit: 'POST /api/genomics/compute/jobs',
        status: 'GET /api/genomics/compute/jobs/:jobHandle',
        cancel: 'POST /api/genomics/compute/jobs/:jobHandle/cancel',
      },
    })
  })

  app.post('/api/genomics/compute/jobs', requireAuth, async (req, res) => {
    try {
      const body = (req.body || {}) as GenomicsSubmitBody
      if (!body.kind || !JOB_KINDS.includes(body.kind)) {
        return res.status(400).json({ error: 'invalid_genomics_job_kind', allowed: JOB_KINDS })
      }
      const input = validateInput(body.input)
      if (!input) {
        return res.status(400).json({
          error: 'invalid_genomics_input',
          message: 'Input must be a staged https://, s3://, or gs:// object reference. Large sequencing files are not proxied through Express.',
        })
      }
      const parameters = validateParameters(body.parameters)
      if (body.parameters != null && !parameters) {
        return res.status(400).json({ error: 'invalid_genomics_parameters', message: `Parameters must be a JSON object no larger than ${MAX_PARAMETER_BYTES} bytes.` })
      }
      const ownerId = authenticatedUserId(req)
      if (!ownerId) return res.status(401).json({ error: 'unauthorized' })

      const payload = await workerRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({ kind: body.kind, input, parameters, ownerId }),
      })
      const workerJobId = typeof payload.id === 'string' ? payload.id : typeof payload.jobId === 'string' ? payload.jobId : ''
      if (!workerJobId) {
        throw new WorkerRequestError(502, 'invalid_genomics_worker_response', 'Genomics worker accepted the request but did not return a job id.', payload)
      }
      return res.status(202).json({
        jobHandle: encodeHandle({ v: HANDLE_VERSION, id: workerJobId, owner: ownerId }),
        status: typeof payload.status === 'string' ? payload.status : 'queued',
        job: publicWorkerPayload(payload),
      })
    } catch (error) {
      return respondError(res, error)
    }
  })

  app.get('/api/genomics/compute/jobs/:jobHandle', requireAuth, async (req, res) => {
    try {
      const ownerId = authenticatedUserId(req)
      if (!ownerId) return res.status(401).json({ error: 'unauthorized' })
      const decoded = decodeHandle(req.params.jobHandle, ownerId)
      if (!decoded) return res.status(404).json({ error: 'genomics_job_not_found' })
      const payload = await workerRequest(`/jobs/${encodeURIComponent(decoded.id)}`)
      return res.json({ jobHandle: req.params.jobHandle, ...publicWorkerPayload(payload) })
    } catch (error) {
      return respondError(res, error)
    }
  })

  app.post('/api/genomics/compute/jobs/:jobHandle/cancel', requireAuth, async (req, res) => {
    try {
      const ownerId = authenticatedUserId(req)
      if (!ownerId) return res.status(401).json({ error: 'unauthorized' })
      const decoded = decodeHandle(req.params.jobHandle, ownerId)
      if (!decoded) return res.status(404).json({ error: 'genomics_job_not_found' })
      const payload = await workerRequest(`/jobs/${encodeURIComponent(decoded.id)}/cancel`, { method: 'POST' })
      return res.json({ jobHandle: req.params.jobHandle, ...publicWorkerPayload(payload) })
    } catch (error) {
      return respondError(res, error)
    }
  })

  console.log(`  Genomics:     Render control plane ready · worker ${config.genomics.workerUrl ? 'configured' : 'not configured'}`)
}
