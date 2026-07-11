import { useEffect, useState, type ReactNode } from 'react'
import { useStore, uid, PLATFORM_FEE, TOKEN_TO_IDR, OWNER_EMAIL } from '../lib/store'
import { Card, SectionTitle, Badge, Button, inputClass, SkeletonRows } from '../components/ui'
import { IconChartUp, IconToken, IconUsers, IconStore, IconShield, IconPlus, IconLock, IconCheck, IconBell, IconSend, IconSparkle } from '../components/icons'
import { api, backendEnabled, type AuditEntry, type DoctorRow, type Stats, type ManualTopup, type Application, type UserDirectoryRow, type FeedbackEntry } from '../lib/api'

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
          title="Owner — Company Profit"
          subtitle="Panaceamed monetary summary (all revenue streams)"
        />
        <div className="rounded-2xl bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Estimated Gross Revenue</div>
          <div className="text-4xl font-extrabold">Rp{grossIdr.toLocaleString('id-ID')}</div>
          <div className="mt-1 text-sm text-white/80">≈ {grossPNC} PNC + Rp{consultRevenue.toLocaleString('id-ID')} consultations</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (grossIdr / monthlyTarget) * 100)}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-white/70">Monthly target Rp{monthlyTarget.toLocaleString('id-ID')}</div>
        </div>
      </Card>

      {backendEnabled && <AIOperatorPanel />}

      <RealtimeStats />

      {backendEnabled && isOwner && <UserDirectoryPanel />}

      {backendEnabled && isOwner && <FeedbackInboxPanel />}

      {backendEnabled && <ApplicationsPanel />}

      {backendEnabled && <ManualTopupPanel />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IconWalletDot />} label="Subscriptions" value={`${subsRevenue} PNC`} sub="recurring" />
        <Stat icon={<IconStore size={18} />} label="Marketplace Fee" value={`${platformFeeRevenue} PNC`} sub={`${PLATFORM_FEE * 100}% royalty`} />
        <Stat icon={<IconUsers size={18} />} label="Consultations" value={`Rp${consultRevenue.toLocaleString('id-ID')}`} sub={`${state.consults.length} sessions`} />
        <Stat icon={<IconToken size={18} />} label="Tokens Sold" value={`${tokenSalesPNC} PNC`} sub={`Rp${(tokenSalesPNC * TOKEN_TO_IDR).toLocaleString('id-ID')}`} />
      </div>

      <Card>
        <SectionTitle title="Revenue Composition" />
        <div className="space-y-3">
          <Bar label="Subscriptions (Individual/Hospital)" value={subsRevenue * TOKEN_TO_IDR} total={grossIdr} color="#00BF63" />
          <Bar label="Materials marketplace fee" value={platformFeeRevenue * TOKEN_TO_IDR} total={grossIdr} color="#3b82f6" />
          <Bar label="Doctor consultations" value={consultRevenue} total={grossIdr} color="#f59e0b" />
        </div>
      </Card>

      {isOwner && (
        <Card>
          <SectionTitle
            icon={<IconShield size={20} />}
            title="Manage Admin Access"
            subtitle="Only emails you allow here can sign in as Admin."
          />
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="admin-email@example.com"
              type="email"
            />
            <Button onClick={() => { addAdminEmail(newAdmin); setNewAdmin('') }}>
              <IconPlus size={16} /> Add
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
                    Remove
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
          <Badge tone="high">Note</Badge>
          The owner is also required to be a subscriber — manage the subscription in the Billing & Tokens menu.
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
    api.audit().then(setAudit).catch(() => setErr('Failed to load audit log (requires an active server).'))
    api.satusehatStatus().then(setSehat).catch(() => {})
  }, [])

  const actionLabel: Record<string, string> = {
    'clinical.read': 'Medical record access',
    'emr.save': 'Save AI-EMR',
  }

  return (
    <>
      <BroadcastPanel />
      <DoctorVerifyPanel />

      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="SATUSEHAT — Ministry of Health Interoperability"
          subtitle="Permenkes 24/2022 · FHIR R4 data exchange"
          right={<Badge tone={sehat?.configured ? 'brand' : 'high'}>{sehat?.configured ? 'Connected' : 'Not configured'}</Badge>}
        />
        <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
          <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${sehat?.configured ? 'bg-brand' : 'bg-amber-400'}`} />
          <div>
            <div>{sehat?.note ?? (backendEnabled ? 'Loading status…' : 'Server not active.')}</div>
            <div className="mt-0.5 text-[11px] text-neutral-400">Environment: {sehat?.env ?? 'sandbox'} · set SATUSEHAT_CLIENT_ID/SECRET on the server to enable.</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<IconLock size={20} />}
          title="Medical Record Access Audit Log"
          subtitle="Trail of access & changes to clinical data (Data Protection Law & Permenkes 24/2022)"
          right={audit ? <Badge tone="neutral">{audit.length} entries</Badge> : undefined}
        />
        {err && <p className="text-sm text-accent">{err}</p>}
        {!backendEnabled && <p className="text-sm text-neutral-400">Audit log requires an active server.</p>}
        {backendEnabled && !audit && !err && <SkeletonRows rows={4} />}
        {audit && audit.length === 0 && <p className="text-sm text-neutral-400">No access recorded yet.</p>}
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
        { label: 'Total Users', value: s.totalUsers },
        { label: 'Doctors', value: s.doctors },
        { label: 'Patients', value: s.patients },
        { label: 'Paid Top-ups', value: s.paidOrders },
        { label: 'Push Subscribers', value: s.pushSubscribers },
        { label: 'Revenue', value: `Rp${s.revenueIdr.toLocaleString('id-ID')}` },
      ]
    : []

  return (
    <Card>
      <SectionTitle icon={<IconChartUp size={20} />} title="Real-time Statistics" subtitle="Automatically refreshed every 30 seconds" right={<span className="flex items-center gap-1 text-[11px] font-bold text-brand-dark"><span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> live</span>} />
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
            <MiniChart title="Sign-ups (7 days)" data={s.signups7d.map((d) => d.count)} labels={s.signups7d.map((d) => d.day.slice(5))} color="#00BF63" />
            <MiniChart title="Revenue (7 days)" data={s.revenue7d.map((d) => d.idr)} labels={s.revenue7d.map((d) => d.day.slice(5))} color="#3b82f6" money />
          </div>
        </>
      )}
    </Card>
  )
}

// AI Operator — an "AI COO" that reads live data for a business briefing, and
// drafts engaging health content for the feed (owner publishes with one tap).
const AI_DEPARTMENTS = [
  { mode: 'briefing' as const, label: 'CMO — Business Briefing', icon: IconChartUp },
  { mode: 'social' as const, label: 'Social Media', icon: IconSparkle },
  { mode: 'seo' as const, label: 'Local SEO', icon: IconSparkle },
  { mode: 'content' as const, label: 'Content', icon: IconSparkle },
  { mode: 'ads' as const, label: 'Ads', icon: IconSparkle },
  { mode: 'ops' as const, label: 'Operations', icon: IconSparkle },
]

function AIOperatorPanel() {
  const { account, addPost } = useStore()
  const [tab, setTab] = useState<'briefing' | 'content' | 'social' | 'seo' | 'ads' | 'ops'>('briefing')
  const [text, setText] = useState('')
  const [pending, setPending] = useState<{ topups: number; topupIdr: number; doctors: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [posted, setPosted] = useState(false)

  async function run(mode: 'briefing' | 'content' | 'social' | 'seo' | 'ads' | 'ops') {
    setTab(mode); setBusy(true); setErr(''); setText(''); setPosted(false)
    try {
      const r = await api.aiOperator(mode)
      setText(r.text)
      if (r.pending) setPending(r.pending)
    } catch {
      setErr('AI Operator failed. Make sure the server & AI key are active.')
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
      activity: 'Health article',
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
        title="AI Marketing Team — CMO, Social, SEO, Content, Ads, Operations"
        subtitle="5 AI departments under one CMO — real-time analysis & drafting, AI-powered (free via server)"
        right={pending && (pending.topups + pending.doctors > 0)
          ? <Badge tone="high">{pending.topups + pending.doctors} need action</Badge>
          : <Badge tone="brand">AI ready</Badge>}
      />
      <div className="flex flex-wrap gap-2">
        {AI_DEPARTMENTS.map((d) => (
          <Button key={d.mode} variant={tab === d.mode ? 'primary' : 'outline'} onClick={() => run(d.mode)} disabled={busy}>
            <d.icon size={16} /> {busy && tab === d.mode ? 'Processing…' : d.label}
          </Button>
        ))}
      </div>

      {err && <p className="mt-3 text-sm text-accent">{err}</p>}

      {text && (
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{text}</div>
          {tab === 'content' && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
              <Button onClick={publish}><IconSend size={14} /> {posted ? 'Posted to Feed ✓' : 'Post to Feed'}</Button>
              <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(text)}>Copy</Button>
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">
        ⚕️ AI provides analysis & drafts. Financial decisions (top-up approvals, STR verification) still require
        your manual confirmation for safety.
      </p>
    </Card>
  )
}

// Owner-only directory: every registered account (email, role, signup date),
// with real transaction/subscription status pulled from the server (never
// client-local-only demo data the owner couldn't otherwise see).
function UserDirectoryPanel() {
  const [rows, setRows] = useState<UserDirectoryRow[] | null>(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<'semua' | 'transaksi' | 'berlangganan'>('semua')
  const [q, setQ] = useState('')

  function load() { api.ownerUsers().then(setRows).catch(() => setErr('Failed to load (requires an Owner account).')) }
  useEffect(load, [])

  const filtered = (rows ?? []).filter((r) => {
    if (q.trim() && !`${r.email} ${r.name}`.toLowerCase().includes(q.trim().toLowerCase())) return false
    if (filter === 'transaksi') return r.paidOrdersCount > 0
    if (filter === 'berlangganan') return r.subscriptions.longevityActive || r.subscriptions.chronicActive || r.subscriptions.clinicalCalcUnlocked
    return true
  })

  return (
    <Card className="border-2 border-brand/30">
      <SectionTitle
        icon={<IconUsers size={20} />}
        title="User Directory"
        subtitle="All accounts that signed up, transacted, & subscribed"
        right={<Badge tone="brand">{rows?.length ?? 0} accounts</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={3} />}
      {rows && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input className={inputClass} placeholder="Search email/name…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex gap-1.5">
              {(['semua', 'transaksi', 'berlangganan'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === f ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {f === 'semua' ? 'All' : f === 'transaksi' ? 'Has transacted' : 'Active subscription'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">No accounts match the filter.</p>}
            {filtered.map((r) => (
              <div key={r.id} className="rounded-xl border border-neutral-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-ink">{r.name}</div>
                    <div className="truncate text-xs text-neutral-500">{r.email}</div>
                  </div>
                  <Badge tone="neutral">{ROLE_LABEL[r.role] ?? r.role}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                  <span>Joined {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>Balance {r.walletBalance} PNC</span>
                  <span>{r.paidOrdersCount} paid transactions{r.totalPaidIdr > 0 ? ` (Rp${r.totalPaidIdr.toLocaleString('id-ID')})` : ''}</span>
                </div>
                {(r.subscriptions.longevityActive || r.subscriptions.chronicActive || r.subscriptions.clinicalCalcUnlocked) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.subscriptions.longevityActive && <Badge tone="brand">Longevity active</Badge>}
                    {r.subscriptions.chronicLifetime && <Badge tone="brand">Chronic Lifetime</Badge>}
                    {r.subscriptions.chronicActive && !r.subscriptions.chronicLifetime && <Badge tone="brand">Chronic active</Badge>}
                    {r.subscriptions.clinicalCalcUnlocked && <Badge tone="brand">Clinical Calculator unlocked</Badge>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// Owner-only inbox for "Pesan & Saran" submitted from Settings — delivered
// straight to the website, not just WhatsApp/email side-channels.
function FeedbackInboxPanel() {
  const [rows, setRows] = useState<FeedbackEntry[] | null>(null)
  const [err, setErr] = useState('')
  function load() { api.listFeedback().then(setRows).catch(() => setErr('Failed to load (requires an Owner account).')) }
  useEffect(load, [])
  async function markRead(id: string) {
    setRows((rs) => rs && rs.map((r) => (r.id === id ? { ...r, read: true } : r)))
    try { await api.markFeedbackRead(id) } catch { /* ignore */ }
  }
  const unread = (rows ?? []).filter((r) => !r.read)
  return (
    <Card className="border-2 border-brand/30">
      <SectionTitle
        icon={<span className="text-xl">💬</span>}
        title="User Messages & Suggestions"
        subtitle="Feedback sent directly from the app"
        right={<Badge tone={unread.length ? 'high' : 'brand'}>{unread.length} unread</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={2} />}
      {rows && rows.length === 0 && <p className="text-sm text-neutral-400">No messages yet.</p>}
      <div className="space-y-2">
        {(rows ?? []).slice(0, 30).map((r) => (
          <div key={r.id} className={`rounded-xl border p-3 ${r.read ? 'border-neutral-100' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={r.read ? 'neutral' : 'high'}>{r.kind}</Badge>
                <span className="text-xs font-bold text-ink">{r.userName}</span>
                <span className="text-[11px] text-neutral-400">{r.userEmail}</span>
              </div>
              <span className="text-[11px] text-neutral-400">{new Date(r.at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-1.5 text-sm text-neutral-700">{r.text}</p>
            {!r.read && (
              <button onClick={() => markRead(r.id)} className="mt-2 text-xs font-semibold text-brand-dark hover:underline">Mark as read</button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// Owner reviews professional onboarding applications & grants access.
const ROLE_LABEL: Record<string, string> = { dokter: 'Doctor', kontributor: 'Author', verifikator: 'Verifier', admin: 'Admin', pasien: 'Subscriber/Patient', owner: 'Owner' }
function ApplicationsPanel() {
  const [rows, setRows] = useState<Application[] | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  function load() { api.listApplications().then(setRows).catch(() => setErr('Failed to load (requires an Owner account).')) }
  useEffect(load, [])
  async function decide(id: string, grant: boolean) {
    setBusy(id)
    try { await api.decideApplication(id, grant); load() } catch { setErr('Failed to process.') } finally { setBusy('') }
  }
  const pending = (rows ?? []).filter((r) => r.status === 'pending')
  const decided = (rows ?? []).filter((r) => r.status !== 'pending').slice(0, 8)
  return (
    <Card className="border-2 border-brand/30">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Applicants — Grant Access"
        subtitle="Doctors, Authors, Verifiers, Admins, Subscribers who applied — review & approve"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} pending</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={2} />}
      {rows && pending.length === 0 && <p className="text-sm text-neutral-400">No applicants pending.</p>}
      <div className="space-y-2">
        {pending.map((r) => (
          <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{ROLE_LABEL[r.role] ?? r.role}</Badge>
              <span className="font-bold">{r.name}</span>
              <span className="text-xs text-neutral-500">{r.email}</span>
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {[r.gelar && `Title: ${r.gelar}`, r.spesialis && `Sp: ${r.spesialis}`, r.subspesialis && `Subsp: ${r.subspesialis}`, r.keahlian && `Expertise: ${r.keahlian}`, r.universitas && `${r.universitas}${r.tahunLulus ? ` (${r.tahunLulus})` : ''}`, r.str && `STR: ${r.str}`].filter(Boolean).join(' · ')}
            </div>
            {r.pdfName && <div className="mt-0.5 text-[11px] text-neutral-500">📄 {r.pdfName}</div>}
            {r.aiVerdict && <div className="mt-1 rounded-lg bg-white/70 p-2 text-[11px] text-neutral-600"><b>AI-Agent:</b> {r.aiVerdict}</div>}
            <div className="mt-2 flex gap-2">
              <Button onClick={() => decide(r.id, true)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs"><IconCheck size={14} /> Grant Access</Button>
              <Button variant="outline" onClick={() => decide(r.id, false)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs">Reject</Button>
            </div>
          </div>
        ))}
      </div>
      {decided.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">History</div>
          <div className="space-y-1">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-1.5 text-xs">
                <span>{r.name} · {ROLE_LABEL[r.role] ?? r.role}</span>
                <Badge tone={r.status === 'granted' ? 'brand' : 'critical'}>{r.status === 'granted' ? 'Access granted' : 'Rejected'}</Badge>
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
    api.listTopups().then(setRows).catch(() => setErr('Failed to load (requires an Owner account).'))
  }
  useEffect(load, [])

  async function decide(id: string, approve: boolean) {
    setBusy(id)
    try {
      await api.decideTopup(id, approve)
      load()
    } catch {
      setErr('Failed to process.')
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
        title="Manual Top-up — Approval"
        subtitle="Approve bank transfers to add to users' PNC balance"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} pending</Badge>}
      />
      {err && <p className="mb-2 text-xs text-accent">{err}</p>}
      {!rows && !err && <SkeletonRows rows={2} />}
      {rows && pending.length === 0 && <p className="text-sm text-neutral-400">No pending requests.</p>}
      <div className="space-y-2">
        {pending.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold">{r.name} <span className="text-xs font-normal text-neutral-500">· {r.email}</span></div>
              <div className="text-sm text-neutral-600">{r.amountPnc} PNC · <b>Rp{r.amountIdr.toLocaleString('id-ID')}</b> · {new Date(r.at).toLocaleString('id-ID')}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => decide(r.id, true)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs"><IconCheck size={14} /> Approve</Button>
              <Button variant="outline" onClick={() => decide(r.id, false)} disabled={busy === r.id} className="!px-3 !py-1.5 text-xs">Reject</Button>
            </div>
          </div>
        ))}
      </div>
      {decided.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">History</div>
          <div className="space-y-1">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-1.5 text-xs">
                <span>{r.name} · {r.amountPnc} PNC</span>
                <Badge tone={r.status === 'approved' ? 'brand' : 'critical'}>{r.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
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
      setMsg(`Sent to ${r.sent} devices (of ${r.recipients} subscribers).`)
      setBody('')
      setTitle('')
    } catch {
      setMsg('Failed to send — make sure Web Push is active on the server.')
    } finally {
      setBusy(false)
    }
  }

  if (!backendEnabled) return null
  return (
    <Card>
      <SectionTitle icon={<IconBell size={20} />} title="Send Announcement (Push)" subtitle="Notification to all users who are subscribed & allow broadcasts" />
      <div className="space-y-2">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Service Update)" maxLength={60} />
        <textarea className={`${inputClass} min-h-[72px]`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Announcement content…" maxLength={180} />
        <div className="flex items-center gap-3">
          <Button onClick={send} disabled={busy || !body.trim()}>
            <IconSend size={15} /> {busy ? 'Sending…' : 'Send to All'}
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
    api.doctors().then(setDocs).catch(() => setErr('Failed to load doctor list (requires an active server).'))
  }
  useEffect(load, [])

  async function setStatus(id: string, status: 'verified' | 'pending') {
    setBusy(id)
    try {
      await api.verifyDoctor(id, status)
      setDocs((prev) => prev?.map((d) => (d.id === id ? { ...d, strStatus: status } : d)) ?? null)
    } catch {
      setErr('Failed to update status.')
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
        title="Doctor STR Verification"
        subtitle="Review STR/SIP before granting AI-EMR access (Health Law)"
        right={docs ? <Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} pending</Badge> : undefined}
      />
      {err && <p className="text-sm text-accent">{err}</p>}
      {!backendEnabled && <p className="text-sm text-neutral-400">Requires an active server.</p>}
      {backendEnabled && !docs && !err && <SkeletonRows rows={3} />}
      {docs && docs.length === 0 && <p className="text-sm text-neutral-400">No doctors registered yet.</p>}

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{d.name}</div>
                <div className="text-[11px] text-neutral-500">{d.email} · STR: <b>{d.str || '—'}</b></div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Pending
              </span>
              <Button onClick={() => setStatus(d.id, 'verified')} disabled={busy === d.id}>
                <IconCheck size={15} /> {busy === d.id ? '…' : 'Verify'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {verified.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Verified</div>
          {verified.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
              <IconCheck size={15} className="shrink-0 text-brand" />
              <span className="truncate font-semibold">{d.name}</span>
              <span className="truncate text-[11px] text-neutral-400">STR {d.str || '—'}</span>
              <button onClick={() => setStatus(d.id, 'pending')} className="ml-auto shrink-0 text-[11px] font-semibold text-neutral-400 hover:text-accent">
                Revoke
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
