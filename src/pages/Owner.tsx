import { useEffect, useState, type ReactNode } from 'react'
import { useStore, uid, PLATFORM_FEE, TOKEN_TO_IDR, OWNER_EMAIL } from '../lib/store'
import { Card, SectionTitle, Badge, Button, inputClass, SkeletonRows } from '../components/ui'
import { IconChartUp, IconToken, IconUsers, IconStore, IconShield, IconPlus, IconLock, IconCheck, IconBell, IconSend, IconSparkle } from '../components/icons'
import { api, backendEnabled, type AuditEntry, type DoctorRow, type Stats, type ManualTopup, type Application } from '../lib/api'

export function Owner() {
  const { state, account, addAdminEmail, removeAdminEmail } = useStore()
  const tx = state.wallet.transactions
  const [newAdmin, setNewAdmin] = useState('')
  const isOwner = account?.isOwner

  // Revenue streams (in PNC), reconstructed from ledger + catalogue.
  const subsRevenue = tx.filter((t) => t.type === 'subscription').reduce((a, t) => a + Math.abs(t.amount), 0)
  const platformFeeRevenue = state.materials
    .filter((m) => m.status === 'verified')
    .reduce((a, m) => a + Math.round(m.priceTokens * PLATFORM_FEE) * m.downloads, 0)
  const consultRevenue = state.consults.reduce((a, c) => a + c.feeIdr, 0) // already IDR
  const tokenSalesPNC = tx.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0)

  const grossPNC = subsRevenue + platformFeeRevenue
  const grossIdr = grossPNC * TOKEN_TO_IDR + consultRevenue
  const monthlyTarget = 50000000

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconChartUp size={20} />}
          title="Owner — Keuntungan Perusahaan"
          subtitle="Ringkasan moneter Panaceamed (semua aliran pendapatan)"
        />
        <div className="rounded-2xl bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Estimasi Pendapatan Kotor</div>
          <div className="text-4xl font-extrabold">Rp{grossIdr.toLocaleString('id-ID')}</div>
          <div className="mt-1 text-sm text-white/80">≈ {grossPNC} PNC + Rp{consultRevenue.toLocaleString('id-ID')} konsultasi</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (grossIdr / monthlyTarget) * 100)}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-white/70">Target bulanan Rp{monthlyTarget.toLocaleString('id-ID')}</div>
        </div>
      </Card>

      {backendEnabled && <AIOperatorPanel />}

      <RealtimeStats />

      {backendEnabled && <ApplicationsPanel />}

      {backendEnabled && <ManualTopupPanel />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IconWalletDot />} label="Langganan" value={`${subsRevenue} PNC`} sub="recurring" />
        <Stat icon={<IconStore size={18} />} label="Fee Marketplace" value={`${platformFeeRevenue} PNC`} sub={`${PLATFORM_FEE * 100}% royalti`} />
        <Stat icon={<IconUsers size={18} />} label="Konsultasi" value={`Rp${consultRevenue.toLocaleString('id-ID')}`} sub={`${state.consults.length} sesi`} />
        <Stat icon={<IconToken size={18} />} label="Token Terjual" value={`${tokenSalesPNC} PNC`} sub={`Rp${(tokenSalesPNC * TOKEN_TO_IDR).toLocaleString('id-ID')}`} />
      </div>

      <Card>
        <SectionTitle title="Komposisi Pendapatan" />
        <div className="space-y-3">
          <Bar label="Langganan (Individu/RS)" value={subsRevenue * TOKEN_TO_IDR} total={grossIdr} color="#00BF63" />
          <Bar label="Fee Marketplace materi" value={platformFeeRevenue * TOKEN_TO_IDR} total={grossIdr} color="#3b82f6" />
          <Bar label="Konsultasi dokter" value={consultRevenue} total={grossIdr} color="#f59e0b" />
        </div>
      </Card>

      {isOwner && (
        <Card>
          <SectionTitle
            icon={<IconShield size={20} />}
            title="Kelola Akses Admin"
            subtitle="Hanya email yang Anda izinkan di sini yang dapat masuk sebagai Admin."
          />
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="email-admin@contoh.com"
              type="email"
            />
            <Button onClick={() => { addAdminEmail(newAdmin); setNewAdmin('') }}>
              <IconPlus size={16} /> Tambah
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {state.adminEmails.map((e) => (
              <div key={e} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                <span className="font-medium">{e}</span>
                {e === OWNER_EMAIL ? (
                  <Badge tone="brand">Owner</Badge>
                ) : (
                  <button onClick={() => removeAdminEmail(e)} className="text-xs font-semibold text-accent hover:underline">
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOwner && <CompliancePanel />}

      <Card>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Badge tone="high">Catatan</Badge>
          Owner pun wajib menjadi pelanggan (subscriber) — kelola langganan di menu Billing & Token.
        </div>
      </Card>
    </div>
  )
}

// Compliance dashboard — audit log (Permenkes 24/2022) + SATUSEHAT status.
function CompliancePanel() {
  const [audit, setAudit] = useState<AuditEntry[] | null>(null)
  const [sehat, setSehat] = useState<{ configured: boolean; env: string; note: string } | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!backendEnabled) return
    api.audit().then(setAudit).catch(() => setErr('Gagal memuat audit log (butuh server aktif).'))
    api.satusehatStatus().then(setSehat).catch(() => {})
  }, [])

  const actionLabel: Record<string, string> = {
    'clinical.read': 'Akses rekam medis',
    'emr.save': 'Simpan AI-EMR',
  }

  return (
    <>
      <BroadcastPanel />
      <DoctorVerifyPanel />

      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="SATUSEHAT — Interoperabilitas Kemenkes"
          subtitle="Permenkes 24/2022 · pertukaran data FHIR R4"
          right={<Badge tone={sehat?.configured ? 'brand' : 'high'}>{sehat?.configured ? 'Terhubung' : 'Belum dikonfigurasi'}</Badge>}
        />
        <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${sehat?.configured ? 'bg-brand' : 'bg-amber-400'}`} />
          <div>
            <div>{sehat?.note ?? (backendEnabled ? 'Memuat status…' : 'Server tidak aktif.')}</div>
            <div className="mt-0.5 text-[11px] text-neutral-400">Lingkungan: {sehat?.env ?? 'sandbox'} · set SATUSEHAT_CLIENT_ID/SECRET di server untuk mengaktifkan.</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconLock size={20} />}
          title="Audit Log Akses Rekam Medis"
          subtitle="Jejak akses & perubahan data klinis (UU PDP & Permenkes 24/2022)"
          right={audit ? <Badge tone="neutral">{audit.length} entri</Badge> : undefined}
        />
        {err && <p className="text-sm text-accent">{err}</p>}
        {!backendEnabled && <p className="text-sm text-neutral-400">Audit log memerlukan server aktif.</p>}
        {backendEnabled && !audit && !err && <SkeletonRows rows={4} />}
        {audit && audit.length === 0 && <p className="text-sm text-neutral-400">Belum ada akses tercatat.</p>}
        {audit && audit.length > 0 && (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {audit.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                <IconCheck size={15} className="shrink-0 text-brand" />
                <span className="font-semibold">{actionLabel[e.action] ?? e.action}</span>
                {e.target && <span className="text-[11px] text-neutral-400">#{e.target}</span>}
                <span className="ml-auto truncate text-[11px] text-neutral-400">{e.userEmail}</span>
                <span className="shrink-0 text-[11px] text-neutral-400">{new Date(e.at).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// Live platform metrics from the backend, refreshed on mount + every 30s.
function RealtimeStats() {
  const [s, setS] = useState<Stats | null>(null)
  useEffect(() => {
    if (!backendEnabled) return
    const load = () => api.stats().then(setS).catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])
  if (!backendEnabled) return null

  const tiles = s
    ? [
        { label: 'Total Pengguna', value: s.totalUsers },
        { label: 'Dokter', value: s.doctors },
        { label: 'Pasien', value: s.patients },
        { label: 'Top-up Lunas', value: s.paidOrders },
        { label: 'Pelanggan Push', value: s.pushSubscribers },
        { label: 'Pendapatan', value: `Rp${s.revenueIdr.toLocaleString('id-ID')}` },
      ]
    : []

  return (
    <Card>
      <SectionTitle icon={<IconChartUp size={20} />} title="Statistik Real-time" subtitle="Diperbarui otomatis tiap 30 detik" right={<span className="flex items-center gap-1 text-[11px] font-bold text-brand-dark"><span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> live</span>} />
      {!s ? (
        <SkeletonRows rows={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-xl bg-neutral-50 p-3">
                <div className="text-lg font-extrabold leading-tight">{t.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{t.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MiniChart title="Pendaftaran (7 hari)" data={s.signups7d.map((d) => d.count)} labels={s.signups7d.map((d) => d.day.slice(5))} color="#00BF63" />
            <MiniChart title="Pendapatan (7 hari)" data={s.revenue7d.map((d) => d.idr)} labels={s.revenue7d.map((d) => d.day.slice(5))} color="#3b82f6" money />
          </div>
        </>
      )}
    </Card>
  )
}

// AI Operator — an "AI COO" that reads live data for a business briefing, and
// drafts engaging health content for the feed (owner publishes with one tap).
function AIOperatorPanel() {
  const { account, addPost } = useStore()
  const [tab, setTab] = useState<'briefing' | 'content'>('briefing')
  const [text, setText] = useState('')
  const [pending, setPending] = useState<{ topups: number; topupIdr: number; doctors: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [posted, setPosted] = useState(false)

  async function run(mode: 'briefing' | 'content') {
    setTab(mode); setBusy(true); setErr(''); setText(''); setPosted(false)
    try {
      const r = await api.aiOperator(mode)
      setText(r.text)
      if (r.pending) setPending(r.pending)
    } catch {
      setErr('AI Operator gagal. Pastikan server & kunci AI aktif.')
    } finally {
      setBusy(false)
    }
  }

  function publish() {
    const lines = text.trim().split('\n')
    const title = lines[0].replace(/^#+\s*/, '').slice(0, 80)
    const body = lines.slice(1).join('\n').trim()
    addPost({
      id: uid(),
      authorEmail: account?.email ?? 'owner@panaceamed.id',
      authorName: account?.name ?? 'Panaceamed',
      role: account?.role ?? 'owner',
      postType: 'artikel',
      kind: 'image',
      activity: 'Artikel sehat',
      caption: body || text,
      articleTitle: title,
      mediaColor: '#00BF63',
      likes: 0, comments: 0, reposts: 0,
      at: new Date().toISOString(),
    })
    setPosted(true)
    setTimeout(() => setPosted(false), 3000)
  }

  return (
    <Card className="border-2 border-brand/30">
      <SectionTitle
        icon={<IconSparkle size={20} />}
        title="AI Operator — Asisten Operasional Otomatis"
        subtitle="Analisa bisnis real-time & pembuatan konten — ditenagai AI (gratis via server)"
        right={pending && (pending.topups + pending.doctors > 0)
          ? <Badge tone="high">{pending.topups + pending.doctors} perlu tindakan</Badge>
          : <Badge tone="brand">AI siap</Badge>}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run('briefing')} disabled={busy}>
          <IconChartUp size={16} /> {busy && tab === 'briefing' ? 'Menganalisa…' : 'Briefing Bisnis'}
        </Button>
        <Button variant="outline" onClick={() => run('content')} disabled={busy}>
          <IconSparkle size={16} /> {busy && tab === 'content' ? 'Menulis…' : 'Buat Konten Sehat'}
        </Button>
      </div>

      {err && <p className="mt-3 text-sm text-accent">{err}</p>}

      {text && (
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{text}</div>
          {tab === 'content' && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
              <Button onClick={publish}><IconSend size={14} /> {posted ? 'Diposting ke Feed ✓' : 'Posting ke Feed'}</Button>
              <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(text)}>Salin</Button>
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">
        ⚕️ AI memberi analisa & draf. Keputusan keuangan (persetujuan top-up, verifikasi STR) tetap Anda
        konfirmasi manual untuk keamanan.
      </p>
    </Card>
  )
}

// Owner reviews professional onboarding applications & grants access.
const ROLE_LABEL: Record<string, string> = { dokter: 'Dokter', kontributor: 'Penulis', verifikator: 'Verifikator', admin: 'Admin', pasien: 'Subscriber/Pasien', owner: 'Owner' }
function ApplicationsPanel() {
  const [rows, setRows] = useState<Application[] | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  function load() { api.listApplications().then(setRows).catch(() => setErr('Gagal memuat (butuh akun Owner).')) }
  useEffect(load, [])
  async function decide(id: string, grant: boolean) {
    setBusy(id)
    try { await api.decideApplication(id, grant); load() } catch { setErr('Gagal memproses.') } finally { setBusy('') }
  }
  const pending = (rows ?? []).filter((r) => r.status === 'pending')
  const decided = (rows ?? []).filter((r) => r.status !== 'pending').slice(0, 8)
  return (
    <Card className="border-2 border-brand/30">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Pendaftar — Beri Akses"
        subtitle="Dokter, Penulis, Verifikator, Admin, Subscriber yang mendaftar — tinjau & setujui"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} menunggu</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={2} />}
      {rows && pending.length === 0 && <p className="text-sm text-neutral-400">Tidak ada pendaftar menunggu.</p>}
      <div className="space-y-2">
        {pending.map((r) => (
          <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{ROLE_LABEL[r.role] ?? r.role}</Badge>
              <span className="font-bold">{r.name}</span>
              <span className="text-xs text-neutral-500">{r.email}</span>
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {[r.gelar && `Gelar: ${r.gelar}`, r.spesialis && `Sp: ${r.spesialis}`, r.subspesialis && `Subsp: ${r.subspesialis}`, r.keahlian && `Keahlian: ${r.keahlian}`, r.universitas && `${r.universitas}${r.tahunLulus ? ` (${r.tahunLulus})` : ''}`, r.str && `STR: ${r.str}`].filter(Boolean).join(' · ')}
            </div>
            {r.pdfName && <div className="mt-0.5 text-[11px] text-neutral-500">📄 {r.pdfName}</div>}
            {r.aiVerdict && <div className="mt-1 rounded-lg bg-white/70 p-2 text-[11px] text-neutral-600"><b>AI-Agent:</b> {r.aiVerdict}</div>}
            <div className="mt-2 flex gap-2">
              <Button onClick={() => decide(r.id, true)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs"><IconCheck size={14} /> Beri Akses</Button>
              <Button variant="outline" onClick={() => decide(r.id, false)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs">Tolak</Button>
            </div>
          </div>
        ))}
      </div>
      {decided.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Riwayat</div>
          <div className="space-y-1">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-1.5 text-xs">
                <span>{r.name} · {ROLE_LABEL[r.role] ?? r.role}</span>
                <Badge tone={r.status === 'granted' ? 'brand' : 'critical'}>{r.status === 'granted' ? 'Diberi akses' : 'Ditolak'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Owner approves/rejects manual bank-transfer top-ups → credits the user's PNC.
function ManualTopupPanel() {
  const [rows, setRows] = useState<ManualTopup[] | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  function load() {
    api.listTopups().then(setRows).catch(() => setErr('Gagal memuat (butuh akun Owner).'))
  }
  useEffect(load, [])

  async function decide(id: string, approve: boolean) {
    setBusy(id)
    try {
      await api.decideTopup(id, approve)
      load()
    } catch {
      setErr('Gagal memproses.')
    } finally {
      setBusy('')
    }
  }

  const pending = (rows ?? []).filter((r) => r.status === 'pending')
  const decided = (rows ?? []).filter((r) => r.status !== 'pending').slice(0, 8)

  return (
    <Card>
      <SectionTitle
        icon={<IconToken size={20} />}
        title="Top-up Manual — Persetujuan"
        subtitle="Setujui transfer bank untuk menambah saldo PNC pengguna"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} menunggu</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={2} />}
      {rows && pending.length === 0 && <p className="text-sm text-neutral-400">Tidak ada permintaan menunggu.</p>}
      <div className="space-y-2">
        {pending.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold">{r.name} <span className="text-xs font-normal text-neutral-500">· {r.email}</span></div>
              <div className="text-sm text-neutral-600">{r.amountPnc} PNC · <b>Rp{r.amountIdr.toLocaleString('id-ID')}</b> · {new Date(r.at).toLocaleString('id-ID')}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => decide(r.id, true)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs"><IconCheck size={14} /> Setujui</Button>
              <Button variant="outline" onClick={() => decide(r.id, false)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs">Tolak</Button>
            </div>
          </div>
        ))}
      </div>
      {decided.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Riwayat</div>
          <div className="space-y-1">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-1.5 text-xs">
                <span>{r.name} · {r.amountPnc} PNC</span>
                <Badge tone={r.status === 'approved' ? 'brand' : 'critical'}>{r.status === 'approved' ? 'Disetujui' : 'Ditolak'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function MiniChart({ title, data, labels, color, money }: { title: string; data: number[]; labels: string[]; color: string; money?: boolean }) {
  const max = Math.max(1, ...data)
  const total = data.reduce((a, b) => a + b, 0)
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-neutral-500">{title}</span>
        <span className="text-xs font-bold">{money ? `Rp${total.toLocaleString('id-ID')}` : total}</span>
      </div>
      <div className="mt-2 flex h-20 items-end gap-1">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${labels[i]}: ${money ? 'Rp' + v.toLocaleString('id-ID') : v}`}>
            <div className="w-full rounded-t transition-all" style={{ height: `${(v / max) * 100}%`, minHeight: 2, background: color }} />
            <span className="text-[8px] text-neutral-400">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Owner-only: broadcast a push announcement to all opted-in subscribers.
function BroadcastPanel() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function send() {
    if (!body.trim()) return
    setBusy(true)
    setMsg('')
    try {
      const r = await api.pushBroadcast(title.trim() || 'Panaceamed.id', body.trim())
      setMsg(`Terkirim ke ${r.sent} perangkat (dari ${r.recipients} pelanggan).`)
      setBody('')
      setTitle('')
    } catch {
      setMsg('Gagal mengirim — pastikan Web Push aktif di server.')
    } finally {
      setBusy(false)
    }
  }

  if (!backendEnabled) return null
  return (
    <Card>
      <SectionTitle icon={<IconBell size={20} />} title="Kirim Pengumuman (Push)" subtitle="Notifikasi ke seluruh pengguna yang berlangganan & mengizinkan siaran" />
      <div className="space-y-2">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul (mis. Pembaruan Layanan)" maxLength={60} />
        <textarea className={`${inputClass} min-h-[72px]`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Isi pengumuman…" maxLength={180} />
        <div className="flex items-center gap-3">
          <Button onClick={send} disabled={busy || !body.trim()}>
            <IconSend size={15} /> {busy ? 'Mengirim…' : 'Kirim ke Semua'}
          </Button>
          {msg && <span className="text-xs font-semibold text-brand-dark">{msg}</span>}
        </div>
      </div>
    </Card>
  )
}

// Owner-only: review & verify doctor STR/SIP before AI-EMR access.
function DoctorVerifyPanel() {
  const [docs, setDocs] = useState<DoctorRow[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  function load() {
    if (!backendEnabled) return
    api.doctors().then(setDocs).catch(() => setErr('Gagal memuat daftar dokter (butuh server aktif).'))
  }
  useEffect(load, [])

  async function setStatus(id: string, status: 'verified' | 'pending') {
    setBusy(id)
    try {
      await api.verifyDoctor(id, status)
      setDocs((prev) => prev?.map((d) => (d.id === id ? { ...d, strStatus: status } : d)) ?? null)
    } catch {
      setErr('Gagal memperbarui status.')
    } finally {
      setBusy(null)
    }
  }

  const pending = docs?.filter((d) => d.strStatus !== 'verified') ?? []
  const verified = docs?.filter((d) => d.strStatus === 'verified') ?? []

  return (
    <Card>
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Verifikasi STR Dokter"
        subtitle="Tinjau STR/SIP sebelum membuka akses AI-EMR (UU Kesehatan)"
        right={docs ? <Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} menunggu</Badge> : undefined}
      />
      {err && <p className="text-sm text-accent">{err}</p>}
      {!backendEnabled && <p className="text-sm text-neutral-400">Memerlukan server aktif.</p>}
      {backendEnabled && !docs && !err && <SkeletonRows rows={3} />}
      {docs && docs.length === 0 && <p className="text-sm text-neutral-400">Belum ada dokter terdaftar.</p>}

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{d.name}</div>
                <div className="text-[11px] text-neutral-500">{d.email} · STR: <b>{d.str || '—'}</b></div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Menunggu
              </span>
              <Button onClick={() => setStatus(d.id, 'verified')} disabled={busy === d.id}>
                <IconCheck size={15} /> {busy === d.id ? '…' : 'Verifikasi'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {verified.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Terverifikasi</div>
          {verified.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
              <IconCheck size={15} className="shrink-0 text-brand" />
              <span className="truncate font-semibold">{d.name}</span>
              <span className="truncate text-[11px] text-neutral-400">STR {d.str || '—'}</span>
              <button onClick={() => setStatus(d.id, 'pending')} className="ml-auto shrink-0 text-[11px] font-semibold text-neutral-400 hover:text-accent">
                Cabut
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function IconWalletDot() {
  return <span className="text-base">💳</span>
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-neutral-400">{icon}<span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-neutral-400">{sub}</div>
    </Card>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">Rp{value.toLocaleString('id-ID')} ({pct}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
