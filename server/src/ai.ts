import type { Request, Response } from 'express'
import type { User } from './store.js'
import { balance, credit, getStats, listManualTopups, listDoctors, getAudit } from './store.js'
import { config } from './config.js'

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

type Msg = { role: 'user' | 'assistant'; content: string | any[] }

// Shared call to the Anthropic API. Returns the text or throws.
async function callAnthropic(model: string, system: string, messages: Msg[], maxTokens: number): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY as string
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION },
    body: JSON.stringify({
      model: ALLOWED_MODELS.has(model) ? model : 'claude-sonnet-4-6',
      max_tokens: Math.min(Math.max(maxTokens, 256), 4096),
      system,
      messages,
    }),
  })
  if (!r.ok) {
    const txt = await r.text()
    throw new Error(`upstream_${r.status}:${txt.slice(0, 200)}`)
  }
  const data = (await r.json()) as { content?: { type: string; text?: string }[] }
  return (data.content || []).find((b) => b.type === 'text')?.text ?? ''
}

// Vision: analyze a supportive-exam image (EKG, CT, MRI, X-ray, USG, lab photo)
// and describe objective findings for the AI-EMR Objective → Assessment flow.
const VISION_SYSTEM = `Anda adalah AI co-physician Panaceamed yang menganalisis CITRA PEMERIKSAAN PENUNJANG (EKG, CT-scan, MRI, X-ray/Rontgen, USG, foto lab, dll). Jawab berbahasa Indonesia, terstruktur dengan judul tebal (markdown):
**Jenis Pemeriksaan** (identifikasi modalitas), **Temuan Objektif** (deskripsi sistematis untuk bagian OBJECTIVE rekam medis), **Interpretasi/Kemungkinan** (membantu ASSESSMENT — diferensial), **Tanda Bahaya & Saran**. WAJIB: ini alat bantu edukatif, BUKAN diagnosis final — tegaskan verifikasi dokter/radiolog/kardiolog. Jika gambar bukan citra medis, katakan dengan jujur.`

export async function aiVision(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured' })
  const user = (req as Request & { user: User }).user
  if (rateLimited(user.id)) return res.status(429).json({ error: 'rate_limited' })
  const { image, prompt } = req.body as { image?: string; prompt?: string }
  const m = typeof image === 'string' && image.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/)
  if (!m) return res.status(400).json({ error: 'bad_image' })
  const content = [
    { type: 'text', text: prompt?.trim() || 'Analisis citra pemeriksaan penunjang ini untuk rekam medis.' },
    { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
  ]
  try {
    const text = await callAnthropic('claude-opus-4-8', VISION_SYSTEM, [{ role: 'user', content }], 1500)
    res.json({ text })
  } catch (e) {
    res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
  }
}

export async function aiMessages(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured' })
  const user = (req as Request & { user: User }).user
  if (rateLimited(user.id)) return res.status(429).json({ error: 'rate_limited' })

  const body = req.body as { model?: string; system?: string; messages?: Msg[]; max_tokens?: number }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'bad_messages' })
  }
  try {
    const text = await callAnthropic(body.model || 'claude-sonnet-4-6', body.system || '', body.messages, Number(body.max_tokens) || 2048)
    res.json({ text })
  } catch (e) {
    res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
  }
}

// Premium "Deep AI Consultation" — charges PNC, then returns a structured
// clinical-longevity report. Basic chat stays free; this is opt-in.
const CONSULT_SYSTEM = `Anda adalah AI co-physician longevity Panaceamed. Berdasarkan percakapan anamnesis pasien, susun LAPORAN KONSULTASI MENDALAM berbahasa Indonesia yang terstruktur dan empatik. WAJIB diawali disclaimer singkat bahwa ini edukatif & tidak menggantikan dokter. Gunakan judul tebal (markdown) untuk bagian:
**Ringkasan Keluhan**, **Analisis & Kemungkinan (diferensial)**, **Pemeriksaan Penunjang yang Disarankan**, **Rencana Gaya Hidup & Longevity**, **Tanda Bahaya (segera ke dokter/IGD)**. Akurat, ringkas, dan tidak memberi diagnosis final atau resep obat.`

export async function aiConsult(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured' })
  const user = (req as Request & { user: User }).user
  const price = config.aiConsultPnc
  if (balance(user.id) < price) {
    return res.status(402).json({ error: 'insufficient_balance', price, balance: balance(user.id) })
  }
  const body = req.body as { messages?: Msg[] }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'bad_messages' })
  }
  try {
    const text = await callAnthropic('claude-opus-4-8', CONSULT_SYSTEM, body.messages, 3000)
    // Charge only after a successful generation.
    credit(user.id, -price, 'purchase', 'Konsultasi AI Mendalam')
    res.json({ text, charged: price, balance: balance(user.id) })
  } catch (e) {
    res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
  }
}

// AI-Agent review of a professional onboarding application (credentials).
export async function reviewApplicationText(info: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return 'AI nonaktif — mohon tinjau manual.'
  const sys = `Anda AI verifikator kredensial Panaceamed. Tinjau data pendaftaran tenaga kesehatan/penulis/verifikator (STR, gelar, keahlian, universitas, tahun lulus, spesialis/subspesialis, dokumen). Beri penilaian SINGKAT (2–3 kalimat) berbahasa Indonesia: kelengkapan & kewajaran data, lalu rekomendasi diakhiri salah satu label: [LAYAK DITINJAU] atau [PERLU DOKUMEN TAMBAHAN]. Ini bukan keputusan final.`
  try {
    return await callAnthropic('claude-sonnet-4-6', sys, [{ role: 'user', content: info }], 400)
  } catch {
    return 'Gagal meninjau otomatis — mohon tinjau manual.'
  }
}

// ── AI Operator (owner) — an "AI COO" that reads live platform data and returns
// a business briefing, or drafts engaging health content for the feed. Read-only
// for money; sensitive actions stay behind the owner's explicit approval.
const OPERATOR_SYSTEM = `Anda adalah AI Chief Operating Officer untuk Panaceamed.id — super-app kesehatan & longevity di Indonesia. Berdasarkan DATA OPERASIONAL yang diberikan, susun BRIEFING BISNIS ringkas, tajam, dan praktis berbahasa Indonesia. Gunakan judul tebal markdown:
**Ringkasan Hari Ini**, **Pertumbuhan & Pendapatan**, **Perlu Tindakan Sekarang** (sebut angka antrean persetujuan & item tertunda), **Rekomendasi Pertumbuhan** (3–5 langkah konkret; dahulukan yang gratis/murah), **Risiko & Kepatuhan**. Pakai angka konkret dari data, jujur bila data masih kecil, dan beri prioritas yang jelas. Hindari janji berlebihan.`

const CONTENT_SYSTEM = `Anda adalah AI editor konten Panaceamed.id. Tulis SATU artikel-mikro hidup sehat/longevity berbahasa Indonesia yang akurat, hangat, dan memikat untuk feed sosial. Format keluaran:
Baris pertama = JUDUL menarik (maks 60 karakter, tanpa tanda kutip).
Lalu 2 paragraf singkat + 3 poin tips praktis (pakai "• ").
Akhiri dengan 1 kalimat pengingat bahwa ini edukatif & konsultasikan ke dokter bila perlu. Hindari klaim medis berlebihan atau menakut-nakuti.`

// Generate the business briefing from live data (reused by the panel & the
// daily-email cron). Returns the markdown text + pending counts.
export async function generateOperatorBriefing(): Promise<{ text: string; pending: { topups: number; topupIdr: number; doctors: number } }> {
  const s = getStats()
  const pendingTopups = listManualTopups('pending')
  const topupIdr = pendingTopups.reduce((a, t) => a + t.amountIdr, 0)
  const pendingDoctors = listDoctors().filter((d) => d.strStatus === 'pending')
  const recentActions = getAudit(25).map((a) => `${a.at.slice(0, 16)} ${a.action}`).join('; ')
  const context = `DATA OPERASIONAL PANACEAMED (real-time):
- Total pengguna: ${s.totalUsers} (dokter ${s.doctors}, pasien ${s.patients})
- Pendaftaran 7 hari: ${s.signups7d.map((d) => d.count).join(', ')}
- Pendapatan total (terbayar): Rp${s.revenueIdr.toLocaleString('id-ID')} dari ${s.paidOrders} order
- Pendapatan 7 hari (Rp): ${s.revenue7d.map((d) => d.idr).join(', ')}
- Postingan feed: ${s.posts} · Pelanggan push: ${s.pushSubscribers}
- Antrean Top-up manual menunggu: ${pendingTopups.length} permintaan (total Rp${topupIdr.toLocaleString('id-ID')})
- Dokter/kontributor menunggu verifikasi STR: ${pendingDoctors.length}
- Aktivitas audit terbaru: ${recentActions || 'belum ada'}`
  const text = await callAnthropic('claude-sonnet-4-6', OPERATOR_SYSTEM, [{ role: 'user', content: context }], 1600)
  return { text, pending: { topups: pendingTopups.length, topupIdr, doctors: pendingDoctors.length } }
}

export async function aiOperator(req: Request, res: Response) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai_not_configured' })
  const mode = (req.body as { mode?: string }).mode === 'content' ? 'content' : 'briefing'

  if (mode === 'content') {
    try {
      const text = await callAnthropic('claude-sonnet-4-6', CONTENT_SYSTEM, [{ role: 'user', content: 'Buat satu artikel hidup sehat untuk feed hari ini.' }], 800)
      return res.json({ text, mode })
    } catch (e) {
      return res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
    }
  }
  try {
    const r = await generateOperatorBriefing()
    res.json({ text: r.text, mode, pending: r.pending })
  } catch (e) {
    res.status(502).json({ error: 'ai_failed', detail: (e as Error).message })
  }
}
