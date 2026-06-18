import { useState } from 'react'
import { useStore, TOKEN_TO_IDR } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconWallet, IconToken, IconCheck, IconShield } from '../components/icons'
import type { SubscriptionPlan, TxType, PaymentMethod } from '../lib/types'

const PACKS = [10, 25, 50, 100]
const METHODS: PaymentMethod[] = ['QRIS', 'Visa', 'Virtual Account']

const txMeta: Record<TxType, { label: string; tone: 'brand' | 'critical' | 'neutral' | 'high' }> = {
  deposit: { label: 'Deposit', tone: 'brand' },
  purchase: { label: 'Pembelian', tone: 'critical' },
  payout: { label: 'Royalti', tone: 'brand' },
  subscription: { label: 'Langganan', tone: 'high' },
  withdraw: { label: 'Tarik Dana', tone: 'high' },
  consult: { label: 'Konsultasi', tone: 'neutral' },
}

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: number
  features: string[]
}[] = [
  {
    id: 'individu',
    name: 'Individu',
    price: 20,
    features: [
      'AI-EMR penuh untuk 1 klinisi',
      'Edukasi pasien tanpa batas',
      'Diskon 10% pembelian materi',
    ],
  },
  {
    id: 'rumah-sakit',
    name: 'Rumah Sakit',
    price: 200,
    features: [
      'AI-EMR multi-seat + integrasi identitas pasien',
      'Edukasi pasien otomatis untuk seluruh pasien',
      'Verifikasi AI Claude untuk template internal',
      'Dukungan prioritas & onboarding',
    ],
  },
]

export function Billing() {
  const { state, depositTokens, subscribe, withdrawTokens } = useStore()
  const { wallet, subscription } = state
  const [amount, setAmount] = useState(25)
  const [method, setMethod] = useState<PaymentMethod>('QRIS')
  const [withdraw, setWithdraw] = useState(10)
  const [bank, setBank] = useState('BCA')
  const [msg, setMsg] = useState('')

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance + deposit */}
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<IconWallet size={20} />}
            title="Dompet PanaceaToken"
            subtitle={`1 PNC = Rp${TOKEN_TO_IDR.toLocaleString('id-ID')} (simulasi)`}
          />
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-ink p-5 text-white">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Saldo</div>
              <div className="flex items-center gap-2 text-4xl font-extrabold">
                <IconToken size={28} className="text-brand" />
                {wallet.balance}
                <span className="text-base font-medium text-white/50">PNC</span>
              </div>
              <div className="mt-1 text-sm text-white/60">
                ≈ Rp{(wallet.balance * TOKEN_TO_IDR).toLocaleString('id-ID')}
              </div>
            </div>
            <IconShield size={40} className="text-white/20" />
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-neutral-600">Deposit cepat</div>
            <div className="flex flex-wrap gap-2">
              {PACKS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    amount === p ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {p} PNC
                </button>
              ))}
            </div>
            <div className="mt-3 mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-neutral-600">Metode pembayaran:</span>
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    method === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {m === 'QRIS' ? '▦' : m === 'Visa' ? '💳' : '#'} {m}
                </button>
              ))}
            </div>
            {method === 'QRIS' && (
              <div className="mb-2 inline-flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <QrPlaceholder />
                <div className="text-xs text-neutral-500">Pindai QRIS untuk membayar<br />Rp{((amount || 0) * TOKEN_TO_IDR).toLocaleString('id-ID')}</div>
              </div>
            )}
            {method === 'Virtual Account' && (
              <div className="mb-2 rounded-xl border border-neutral-200 p-3 text-sm">
                No. Virtual Account <b>{bank}</b>: <span className="font-mono font-bold">8810 7700 {String(1000 + ((amount || 0) % 9000)).slice(0, 4)}</span>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Field label="Jumlah (PNC)">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Button
                onClick={() => {
                  depositTokens(Number(amount) || 0, `Top-up ${amount} PNC via ${method}`)
                  setMsg(`Pembayaran ${method} berhasil — ${amount} PNC ditambahkan.`)
                  setTimeout(() => setMsg(''), 2500)
                }}
                disabled={!amount || amount <= 0}
              >
                <IconToken size={16} /> Bayar Rp{((amount || 0) * TOKEN_TO_IDR).toLocaleString('id-ID')}
              </Button>
            </div>
            {msg && <p className="mt-2 text-xs font-semibold text-brand-dark">{msg}</p>}
            <p className="mt-2 text-xs text-neutral-400">
              Harga token mengikuti perhitungan biaya API + margin operasional (simulasi gateway). 1 PNC = Rp{TOKEN_TO_IDR.toLocaleString('id-ID')}.
            </p>

            {/* Withdraw to bank */}
            <div className="mt-5 rounded-xl border border-neutral-200 p-4">
              <div className="mb-2 text-sm font-bold">Tarik Sisa Deposit ke Bank</div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32">
                  <Field label="Jumlah (PNC)">
                    <input className={inputClass} type="number" min={1} value={withdraw} onChange={(e) => setWithdraw(Number(e.target.value))} />
                  </Field>
                </div>
                <div className="w-32">
                  <Field label="Bank">
                    <select className={inputClass} value={bank} onChange={(e) => setBank(e.target.value)}>
                      {['BCA', 'Mandiri', 'BNI', 'BRI'].map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const r = withdrawTokens(Number(withdraw) || 0, bank)
                    setMsg(r.ok ? `Penarikan Rp${((withdraw || 0) * TOKEN_TO_IDR).toLocaleString('id-ID')} ke ${bank} diproses.` : r.reason ?? 'Gagal.')
                    setTimeout(() => setMsg(''), 2800)
                  }}
                >
                  Tarik ke {bank}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription status */}
        <Card>
          <SectionTitle title="Status Langganan" />
          <div className="mb-3 rounded-xl bg-brand-50 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-brand-dark">Paket aktif</div>
            <div className="text-xl font-extrabold text-brand-dark">
              {subscription.plan === 'none'
                ? 'Belum berlangganan'
                : subscription.plan === 'individu'
                  ? 'Individu'
                  : 'Rumah Sakit'}
            </div>
            {subscription.since && (
              <div className="text-xs text-neutral-500">
                sejak {new Date(subscription.since).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
          <p className="text-sm leading-relaxed text-neutral-500">
            Langganan membuka AI-EMR penuh dan <b>edukasi pasien otomatis</b> — agar pasien memahami
            penyakitnya secara singkat & mendalam serta tahu cara menjaga kesehatannya.
          </p>
        </Card>
      </div>

      {/* Plans */}
      <Card>
        <SectionTitle title="Pilih Paket Langganan" subtitle="Untuk individu (klinisi) maupun institusi rumah sakit" />
        <div className="grid gap-4 md:grid-cols-2">
          {PLANS.map((pl) => {
            const active = subscription.plan === pl.id
            return (
              <div
                key={pl.id}
                className={`rounded-2xl border-2 p-5 ${active ? 'border-brand bg-brand-50/40' : 'border-neutral-100'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{pl.name}</h3>
                  {active && <Badge tone="brand">Aktif</Badge>}
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {pl.price} <span className="text-sm font-medium text-neutral-400">PNC / bulan</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {pl.features.map((fe) => (
                    <li key={fe} className="flex items-start gap-2">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                      {fe}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={active ? 'outline' : 'primary'}
                  disabled={active || wallet.balance < pl.price}
                  onClick={() => subscribe(pl.id, pl.id === 'rumah-sakit' ? 25 : 1)}
                >
                  {active
                    ? 'Sedang aktif'
                    : wallet.balance < pl.price
                      ? 'Saldo kurang — deposit dulu'
                      : `Berlangganan (${pl.price} PNC)`}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Transactions */}
      <Card>
        <SectionTitle title="Riwayat Transaksi" subtitle="Deposit · pembelian · royalti penulis · langganan" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="pb-2 pr-4 font-semibold">Waktu</th>
                <th className="pb-2 pr-4 font-semibold">Jenis</th>
                <th className="pb-2 pr-4 font-semibold">Keterangan</th>
                <th className="pb-2 text-right font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.map((t) => (
                <tr key={t.id} className="border-t border-neutral-100">
                  <td className="py-2.5 pr-4 text-neutral-500">
                    {new Date(t.at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={txMeta[t.type].tone}>{txMeta[t.type].label}</Badge>
                  </td>
                  <td className="py-2.5 pr-4">{t.note}</td>
                  <td
                    className={`py-2.5 text-right font-bold ${t.amount >= 0 ? 'text-brand-dark' : 'text-accent'}`}
                  >
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount} PNC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function QrPlaceholder() {
  // Decorative QR-like grid (payment simulation).
  const cells = Array.from({ length: 49 }, (_, i) => (i * 7 + 3) % 5 < 2)
  return (
    <div className="grid h-20 w-20 grid-cols-7 gap-0.5 rounded-md bg-white p-1 ring-1 ring-neutral-200">
      {cells.map((on, i) => (
        <span key={i} className={on ? 'bg-ink' : 'bg-transparent'} />
      ))}
    </div>
  )
}
