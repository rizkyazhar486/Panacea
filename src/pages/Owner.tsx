import { useEffect, useState, type ReactNode } from 'react'
import { useStore, PLATFORM_FEE, TOKEN_TO_IDR, OWNER_EMAIL } from '../lib/store'
import { Card, SectionTitle, Badge, Button, inputClass, SkeletonRows } from '../components/ui'
import { IconChartUp, IconToken, IconUsers, IconStore, IconShield, IconPlus, IconLock, IconCheck, IconBell, IconSend } from '../components/icons'
import { api, backendEnabled, type AuditEntry, type DoctorRow } from '../lib/api'

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
