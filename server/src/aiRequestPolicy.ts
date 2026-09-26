export type AiTextBlock = { type: 'text'; text: string }
export type AiImageBlock = {
  type: 'image'
  source: {
    type: 'base64'
    media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
    data: string
  }
}
export type ValidatedAiMessage = {
  role: 'user' | 'assistant'
  content: string | Array<AiTextBlock | AiImageBlock>
}

export type ValidAiProxyRequest = {
  model?: string
  system: string
  messages: ValidatedAiMessage[]
  maxTokens: number
  json: boolean
}

export type AiPolicyFailure = {
  ok: false
  status: 400 | 413
  error: 'bad_ai_request' | 'ai_request_too_large'
  reason: string
}

export type AiPolicyResult =
  | { ok: true; value: ValidAiProxyRequest }
  | AiPolicyFailure

const MAX_MESSAGES = 48
const MAX_SYSTEM_CHARS = 16_000
const MAX_TEXT_CHARS = 64_000
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_BLOCKS_PER_MESSAGE = 12
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const ALLOWED_REQUEST_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-8',
  'claude-haiku-4-5-20251001',
])

function fail(status: 400 | 413, reason: string): AiPolicyFailure {
  return {
    ok: false,
    status,
    error: status === 413 ? 'ai_request_too_large' : 'bad_ai_request',
    reason,
  }
}

function decodedBase64Bytes(data: string): number {
  const compact = data.replace(/\s/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 !== 0) return -1
  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0
  return (compact.length / 4) * 3 - padding
}

export function validateAiProxyRequest(input: unknown): AiPolicyResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail(400, 'body_must_be_object')
  const body = input as Record<string, unknown>
  if (body.model !== undefined && (typeof body.model !== 'string' || !ALLOWED_REQUEST_MODELS.has(body.model))) {
    return fail(400, 'unsupported_model')
  }
  const system = typeof body.system === 'string' ? body.system : ''
  if (system.length > MAX_SYSTEM_CHARS) return fail(413, 'system_prompt_too_large')
  if (!Array.isArray(body.messages) || body.messages.length === 0) return fail(400, 'messages_required')
  if (body.messages.length > MAX_MESSAGES) return fail(413, 'too_many_messages')

  let textChars = system.length
  let imageBytes = 0
  const messages: ValidatedAiMessage[] = []

  for (const raw of body.messages) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(400, 'message_must_be_object')
    const message = raw as Record<string, unknown>
    if (message.role !== 'user' && message.role !== 'assistant') return fail(400, 'invalid_message_role')

    if (typeof message.content === 'string') {
      if (!message.content.trim()) return fail(400, 'empty_message')
      textChars += message.content.length
      messages.push({ role: message.role, content: message.content })
      continue
    }

    if (!Array.isArray(message.content) || message.content.length === 0) return fail(400, 'invalid_message_content')
    if (message.content.length > MAX_BLOCKS_PER_MESSAGE) return fail(413, 'too_many_content_blocks')
    const blocks: Array<AiTextBlock | AiImageBlock> = []

    for (const rawBlock of message.content) {
      if (!rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) return fail(400, 'invalid_content_block')
      const block = rawBlock as Record<string, unknown>
      if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        textChars += block.text.length
        blocks.push({ type: 'text', text: block.text })
        continue
      }

      if (block.type === 'image' && block.source && typeof block.source === 'object' && !Array.isArray(block.source)) {
        const source = block.source as Record<string, unknown>
        if (source.type !== 'base64' || typeof source.media_type !== 'string' || !ALLOWED_IMAGE_TYPES.has(source.media_type)) {
          return fail(400, 'unsupported_image_source')
        }
        if (typeof source.data !== 'string') return fail(400, 'invalid_image_data')
        const bytes = decodedBase64Bytes(source.data)
        if (bytes < 0) return fail(400, 'invalid_image_base64')
        imageBytes += bytes
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: source.media_type as AiImageBlock['source']['media_type'],
            data: source.data,
          },
        })
        continue
      }

      return fail(400, 'unsupported_content_block')
    }

    messages.push({ role: message.role, content: blocks })
  }

  if (textChars > MAX_TEXT_CHARS) return fail(413, 'text_context_too_large')
  if (imageBytes > MAX_IMAGE_BYTES) return fail(413, 'image_context_too_large')

  const requestedTokens = Number(body.max_tokens)
  return {
    ok: true,
    value: {
      model: typeof body.model === 'string' ? body.model : undefined,
      system,
      messages,
      maxTokens: Number.isFinite(requestedTokens)
        ? Math.min(Math.max(Math.floor(requestedTokens), 256), 8192)
        : 2048,
      json: body.json === true,
    },
  }
}

export type PublicAiFailure = {
  status: 502 | 503
  error:
    | 'ai_upstream_rate_limited'
    | 'ai_provider_misconfigured'
    | 'ai_upstream_rejected'
    | 'ai_upstream_unavailable'
  retryable: boolean
}

export function toPublicAiFailure(error: unknown): PublicAiFailure {
  const message = error instanceof Error ? error.message : ''
  const match = message.match(/^(?:openrouter|upstream)_(\d{3})(?::|$)/)
  const status = match ? Number(match[1]) : 0
  if (status === 429) return { status: 503, error: 'ai_upstream_rate_limited', retryable: true }
  if (status === 401 || status === 403) return { status: 503, error: 'ai_provider_misconfigured', retryable: false }
  if (status >= 400 && status < 500) return { status: 502, error: 'ai_upstream_rejected', retryable: false }
  return { status: 502, error: 'ai_upstream_unavailable', retryable: true }
}
