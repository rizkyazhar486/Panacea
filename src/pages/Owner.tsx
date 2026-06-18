import type { ReactNode } from 'react'
import { useStore, PLATFORM_FEE, TOKEN_TO_IDR } from '../lib/store'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconChartUp, IconToken, IconUsers, IconStore } from '../components/icons'

export function Owner() {
  const { state } = useStore()
  const tx = state.wallet.transactions

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

      <Card>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Badge tone="high">Catatan</Badge>
          Owner pun wajib menjadi pelanggan (subscriber) — kelola langganan di menu Billing & Token.
        </div>
      </Card>
    </div>
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
