import { useEffect, useState, useRef } from 'react'
import { useStore, TOKEN_TO_IDR } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconWallet, IconToken, IconCheck, IconShield, IconUpload } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { MANUAL_BANK } from '../lib/payment'
import { Portal } from '../components/Portal'
import type { SubscriptionPlan, TxType } from '../lib/types'

const txMeta: Record<TxType, { label: string; tone: 'brand' | 'critical' | 'neutral' | 'high' }> = {
  deposit: { label: 'Deposit', tone: 'brand' },
  purchase: { label: 'Purchase', tone: 'critical' },
  payout: { label: 'Royalty', tone: 'brand' },
  subscription: { label: 'Subscription', tone: 'high' },
  withdraw: { label: 'Withdrawal', tone: 'high' },
  consult: { label: 'Consultation', tone: 'neutral' },
}

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: number
  features: string[]
}[] = [
  {
    id: 'individu',
    name: 'Individual',
    price: 349,
    features: [
      'Full AI-EMR for 1 clinician',
      'Unlimited patient education',
      '10% discount on material purchases',
    ],
  },
  {
    id: 'rumah-sakit',
    name: 'Hospital',
    price: 5900,
    features: [
      'Multi-seat AI-EMR + patient identity integration',
      'Automatic patient education for all patients',
      'Claude AI verification for internal templates',
      'Priority support & onboarding',
    ],
  },
]

export function Billing() {
  const { state, subscribe, withdrawTokens } = useStore()
  const { wallet, subscription } = state
  const [withdraw, setWithdraw] = useState(10)
  const [bank, setBank] = useState('BCA')
  const [msg, setMsg] = useState('')
  const [buyPlan, setBuyPlan] = useState<SubscriptionPlan | null>(null)

  return (
    <div className="space-y-6">
      {(state.account?.role === 'owner' || state.account?.isOwner) && <ProofVerification />}
      {backendEnabled && <BackendWallet />}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance + deposit */}
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<IconWallet size={20} />}
            title="PanaceaToken Wallet"
            subtitle={`1 PNC = Rp${TOKEN_TO_IDR.toLocaleString('id-ID')}`}
          />
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-ink p-5 text-white">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Balance</div>
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

          <div className="mt-5 space-y-5">
            <ManualBankTransfer />
            {msg && <p className="text-xs font-semibold text-brand-dark">{msg}</p>}

            {/* Withdraw to bank */}
            <div className="mt-5 rounded-xl border border-neutral-200 p-4">
              <div className="mb-2 text-sm font-bold">Withdraw Remaining Deposit to Bank</div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32">
                  <Field label="Amount (PNC)">
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
                    setMsg(r.ok ? `Withdrawal of Rp${((withdraw || 0) * TOKEN_TO_IDR).toLocaleString('id-ID')} to ${bank} is being processed.` : r.reason ?? 'Failed.')
                    setTimeout(() => setMsg(''), 2800)
                  }}
                >
                  Withdraw to {bank}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription status */}
        <Card>
          <SectionTitle title="Subscription Status" />
          <div className="mb-3 rounded-xl bg-brand-50 p-3 text-center">
            <div className="text-xs uppercase tracking-wide text-brand-dark">Active plan</div>
            <div className="text-xl font-extrabold text-brand-dark">
              {subscription.plan === 'none'
                ? 'Not subscribed'
                : subscription.plan === 'individu'
                  ? 'Individual'
                  : 'Hospital'}
            </div>
            {subscription.since && (
              <div className="text-xs text-neutral-500">
                since {new Date(subscription.since).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
          <p className="text-sm leading-relaxed text-neutral-500">
            A subscription unlocks the full AI-EMR and <b>automatic patient education</b> — so patients
            understand their condition, briefly yet thoroughly, and know how to care for their health.
          </p>
        </Card>
      </div>

      {/* Plans */}
      <Card>
        <SectionTitle title="Choose a Subscription Plan" subtitle="For individual clinicians as well as hospital institutions" />
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
                  {active && <Badge tone="brand">Active</Badge>}
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {pl.price} <span className="text-sm font-medium text-neutral-400">PNC / month</span>
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
                  onClick={() => setBuyPlan(pl.id)}
                >
                  {active
                    ? 'Currently active'
                    : wallet.balance < pl.price
                      ? 'Insufficient balance — deposit first'
                      : `Subscribe (${pl.price} PNC)`}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {buyPlan && (
        <EmrPurchaseModal
          plan={buyPlan}
          price={PLANS.find((p) => p.id === buyPlan)?.price ?? 0}
          onClose={() => setBuyPlan(null)}
          onConfirm={(seats) => {
            subscribe(buyPlan, seats)
            setBuyPlan(null)
            setMsg('AI-EMR purchase successful — credentials received and under verification.')
            setTimeout(() => setMsg(''), 3000)
          }}
        />
      )}

      {/* Transactions */}
      <Card>
        <SectionTitle title="Transaction History" subtitle="Deposit · purchase · author royalty · subscription" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="pb-2 pr-4 font-semibold">Time</th>
                <th className="pb-2 pr-4 font-semibold">Type</th>
                <th className="pb-2 pr-4 font-semibold">Description</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
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

// AI-EMR is sold to certified buyers only. Individuals submit their STR;
// companies (hospital/institution) submit an NPWP plus each doctor's STR (JPGs).
function EmrPurchaseModal({
  plan, price, onClose, onConfirm,
}: {
  plan: SubscriptionPlan
  price: number
  onClose: () => void
  onConfirm: (seats: number) => void
}) {
  const isCompany = plan === 'rumah-sakit'
  const [buyer, setBuyer] = useState<'perusahaan' | 'individu'>(isCompany ? 'perusahaan' : 'individu')
  const [orgType, setOrgType] = useState<'Rumah Sakit' | 'Instansi'>('Rumah Sakit')
  const [orgName, setOrgName] = useState('')
  const [npwp, setNpwp] = useState('')
  const [str, setStr] = useState('')
  const [strFiles, setStrFiles] = useState<string[]>([])
  const [seats, setSeats] = useState(isCompany ? 25 : 1)
  const [err, setErr] = useState('')

  function submit() {
    if (buyer === 'individu') {
      if (!str.trim()) return setErr('STR number is required for individual purchases.')
    } else {
      if (!orgName.trim()) return setErr('Company/institution name is required.')
      if (!npwp.trim()) return setErr('Company NPWP (tax ID) is required.')
      if (strFiles.length === 0) return setErr('Upload at least one doctor STR (JPG).')
    }
    onConfirm(seats)
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-brand-dark">
          <IconShield size={20} />
          <h3 className="text-lg font-bold">AI-EMR Purchase — Credential Verification</h3>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          AI-EMR is sold only to certified buyers. <b>{isCompany ? 'Hospital' : 'Individual'}</b> plan · {price} PNC/month.
        </p>

        <div className="mt-4 flex gap-2">
          {(['individu', 'perusahaan'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBuyer(b)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${buyer === b ? 'bg-brand-50 text-brand-dark ring-1 ring-brand' : 'bg-neutral-100 text-neutral-500'}`}
            >
              {b === 'individu' ? 'Individual (Doctor)' : 'Company / Institution'}
            </button>
          ))}
        </div>

        {buyer === 'individu' ? (
          <div className="mt-4 space-y-3">
            <Field label="STR Number / Practice Certificate">
              <input className={inputClass} value={str} onChange={(e) => setStr(e.target.value)} placeholder="Required — active STR" />
            </Field>
            <UploadBox label="Upload STR scan (JPG/PDF) — optional" onFiles={(f) => setStrFiles(f)} files={strFiles} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Field label="Buyer Type">
              <select className={inputClass} value={orgType} onChange={(e) => setOrgType(e.target.value as 'Rumah Sakit' | 'Instansi')}>
                <option>Rumah Sakit</option>
                <option>Instansi</option>
              </select>
            </Field>
            <Field label={`${orgType === 'Rumah Sakit' ? 'Hospital' : 'Institution'} Name`}>
              <input className={inputClass} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={`e.g. ${orgType === 'Rumah Sakit' ? 'Sehat Sentosa Hospital' : 'City Health Department'}`} />
            </Field>
            <Field label="Company NPWP (Tax ID)">
              <input className={inputClass} value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder="00.000.000.0-000.000" />
            </Field>
            <Field label="Number of doctor seats">
              <input className={inputClass} type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
            </Field>
            <UploadBox label="STR for each doctor (multiple JPGs)" multiple onFiles={(f) => setStrFiles(f)} files={strFiles} />
          </div>
        )}

        {err && <p className="mt-3 text-xs font-semibold text-accent">{err}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={submit}>Pay {price} PNC & Submit</Button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

function UploadBox({ label, multiple, onFiles, files }: { label: string; multiple?: boolean; onFiles: (names: string[]) => void; files: string[] }) {
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-5 text-neutral-500 hover:border-brand">
        <IconUpload size={22} />
        <span className="text-xs font-semibold">{label}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple={multiple}
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files ?? []).map((f) => f.name))}
        />
      </label>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {files.map((f) => (
            <span key={f} className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
              <IconCheck size={12} /> {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Manual bank-transfer destination (no Midtrans/NPWP needed). Confirmed by owner.
// Shared via lib/payment so every page quotes the same account.

// Sole valid payment path: manual transfer to the owner's own Mandiri account,
// confirmed with a photo proof. PNC is credited only after owner verification
// (see ProofVerification below) — never auto-credited from the upload alone.
function ManualBankTransfer() {
  const [amount, setAmount] = useState(25)
  const [proof, setProof] = useState<string>('')
  const [reqMsg, setReqMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const proofRef = useRef<HTMLInputElement>(null)

  async function pickProof(file: File | null) {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setReqMsg('Proof photo is too large (max 8MB).'); return }
    const reader = new FileReader()
    reader.onload = () => setProof(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function submitManual() {
    if (amount <= 0) { setReqMsg('Enter a PNC amount.'); return }
    if (!proof) { setReqMsg('Upload a photo of the transfer proof first.'); return }
    const idr = (amount * TOKEN_TO_IDR).toLocaleString('id-ID')
    try {
      const key = 'pm_topup_proofs'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      list.unshift({ id: `tp_${Date.now()}`, amount, idr, proof, at: new Date().toISOString(), status: 'pending' })
      localStorage.setItem(key, JSON.stringify(list.slice(0, 30)))
    } catch { /* storage full — proof still sent via WhatsApp */ }
    try {
      await api.topupRequest(amount).catch(() => {})
    } catch { /* ignore */ }
    setReqMsg(`Transfer proof for ${amount} PNC (Rp${idr}) sent & awaiting verification. Balance is added automatically once the proof is verified.`)
    const text = `Hello, I'd like to top up Panaceamed.id%0A%0AAmount: ${amount} PNC (Rp${idr})%0AI've transferred to ${MANUAL_BANK.bank} ${MANUAL_BANK.number} a.n. ${MANUAL_BANK.holder}.%0AI've attached the transfer proof (photo) in this chat.%0A%0APlease verify & add the balance. Thank you.`
    window.open(`https://wa.me/${MANUAL_BANK.waNumber}?text=${text}`, '_blank')
  }

  function copyNumber() {
    navigator.clipboard?.writeText(MANUAL_BANK.number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="rounded-2xl border-2 border-brand/20 bg-brand-50/40 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
        🏦 Top-up via Bank Transfer
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500">the only payment method</span>
      </div>
      <p className="mt-1 text-[12px] text-neutral-500">
        Transfer to the following account for the exact amount, then confirm via WhatsApp. PNC balance is added once payment is verified.
      </p>
      <div className="mt-3 rounded-xl bg-white p-3 text-sm">
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">Bank</span><span className="font-bold">{MANUAL_BANK.bank}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">Account No.</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold">{MANUAL_BANK.number}</span>
            <button onClick={copyNumber} className="rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-dark">{copied ? 'Copied ✓' : 'Copy'}</button>
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">Account Holder</span><span className="font-bold">{MANUAL_BANK.holder}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="w-28"><Field label="Amount (PNC)"><input className={inputClass} type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field></div>
        <div className="rounded-xl bg-white px-3 py-2 text-sm">
          Total transfer: <b>Rp{(amount * TOKEN_TO_IDR).toLocaleString('id-ID')}</b>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-brand/40 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-bold text-brand-dark">📸 Transfer Proof (required)</div>
          {proof && <button onClick={() => setProof('')} className="text-[11px] font-semibold text-red-500 hover:underline">Remove</button>}
        </div>
        <input ref={proofRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pickProof(e.target.files?.[0] ?? null)} />
        {proof ? (
          <img src={proof} alt="Transfer proof" className="mt-2 max-h-44 w-full rounded-lg object-contain ring-1 ring-neutral-200" />
        ) : (
          <button onClick={() => proofRef.current?.click()} className="mt-2 grid w-full place-items-center rounded-lg border border-neutral-200 bg-neutral-50 py-6 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
            Tap to upload / photograph the transfer receipt
          </button>
        )}
      </div>

      <div className="mt-3">
        <Button onClick={submitManual} disabled={amount <= 0 || !proof} className="!bg-[#25D366] hover:!bg-[#1ebe5a]">
          ✅ Send Proof & Confirm
        </Button>
      </div>
      {reqMsg && <p className="mt-2 text-[12px] font-semibold text-brand-dark">{reqMsg}</p>}
      <p className="mt-1 text-[11px] text-neutral-400">Admin: {MANUAL_BANK.waLabel} · balance is credited automatically once the proof is verified.</p>
    </div>
  )
}

// Owner-only: verify queued transfer-proof photos and auto-credit PNC on approval.
interface ProofReq { id: string; amount: number; idr: string; proof: string; at: string; status: 'pending' | 'verified' | 'rejected' }
function ProofVerification() {
  const { depositTokens } = useStore()
  const [reqs, setReqs] = useState<ProofReq[]>([])
  const [view, setView] = useState<string>('')

  function reload() {
    try { setReqs(JSON.parse(localStorage.getItem('pm_topup_proofs') || '[]')) } catch { setReqs([]) }
  }
  useEffect(reload, [])

  function save(next: ProofReq[]) {
    setReqs(next)
    try { localStorage.setItem('pm_topup_proofs', JSON.stringify(next)) } catch { /* ignore */ }
  }
  function verify(r: ProofReq) {
    depositTokens(r.amount, `Manual top-up verified (transfer proof) — ${r.amount} PNC`)
    save(reqs.map((x) => (x.id === r.id ? { ...x, status: 'verified' } : x)))
  }
  function reject(r: ProofReq) {
    save(reqs.map((x) => (x.id === r.id ? { ...x, status: 'rejected' } : x)))
  }

  const pending = reqs.filter((r) => r.status === 'pending')

  return (
    <Card className="border-2 border-amber-300">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Verify Transfer Proof (Owner)"
        subtitle="Approve proof → PNC is added automatically"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} pending</Badge>}
      />
      {reqs.length === 0 ? (
        <p className="text-sm text-neutral-400">No transfer proofs submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {reqs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
              <button onClick={() => setView(view === r.id ? '' : r.proof)} className="shrink-0">
                <img src={r.proof} alt="proof" className="h-12 w-12 rounded-lg object-cover ring-1 ring-neutral-200" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{r.amount} PNC <span className="font-normal text-neutral-400">· Rp{r.idr}</span></div>
                <div className="text-[11px] text-neutral-400">{new Date(r.at).toLocaleString('id-ID')}</div>
              </div>
              {r.status === 'pending' ? (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => verify(r)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark">Verify</button>
                  <button onClick={() => reject(r)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">Reject</button>
                </div>
              ) : (
                <Badge tone={r.status === 'verified' ? 'brand' : 'high'}>{r.status === 'verified' ? 'Verified ✓' : 'Rejected'}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
      {view && (
        <Portal>
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" onClick={() => setView('')}>
          <img src={view} alt="transfer proof" className="max-h-[80vh] max-w-full rounded-xl" />
        </div>
        </Portal>
      )}
    </Card>
  )
}

// Real backend wallet — server-side balance & bank-payout for withdrawals.
function BackendWallet() {
  const { syncWalletBalance } = useStore()
  const [balance, setBalance] = useState(0)
  const [live, setLive] = useState(false)
  const [amount, setAmount] = useState(25)
  const [bank, setBank] = useState('Mandiri')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [msg, setMsg] = useState('')

  function refresh() {
    api.wallet().then((w) => { setBalance(w.balance); syncWalletBalance(w.balance) }).catch(() => {})
    api.health().then((h) => setLive(h.features.payments)).catch(() => {})
  }
  useEffect(refresh, [])

  async function withdraw() {
    if (!accountNumber.trim() || !accountHolder.trim()) {
      setMsg('Enter the account holder name & account number to withdraw funds.')
      return
    }
    try {
      const r = await api.withdraw(amount, bank, accountNumber.trim(), accountHolder.trim())
      setBalance(r.balance)
      syncWalletBalance(r.balance)
      const idr = `Rp${(amount * TOKEN_TO_IDR).toLocaleString('id-ID')}`
      setMsg(
        r.payout?.status === 'processed'
          ? `✅ ${idr} is being sent automatically (Iris) to ${bank} a.n. ${accountHolder}. Ref ${r.payout.referenceNo ?? '-'}.`
          : r.payout?.status === 'queued'
          ? `⏳ Withdrawal of ${idr} created & awaiting approval (Iris). Ref ${r.payout.referenceNo ?? '-'}.`
          : `Withdrawal of ${idr} to ${bank} ${accountNumber} a.n. ${accountHolder} received — being processed by the team.`,
      )
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Failed.'
      setMsg(m === 'insufficient_funds' ? 'Insufficient balance.' : m === 'missing_account' ? 'Complete the account details.' : 'Failed to process withdrawal.')
    }
  }

  return (
    <Card className="border-2 border-brand">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Real Wallet (Backend)"
        subtitle="Balance & fund withdrawals processed by the server"
        right={<Badge tone={live ? 'brand' : 'high'}>{live ? 'Backend Active' : 'Local Mode'}</Badge>}
      />
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-brand p-5 text-white">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Server balance</div>
          <div className="text-3xl font-extrabold">{balance} <span className="text-base font-medium text-white/70">PNC</span></div>
        </div>
        <Button variant="ghost" className="bg-white/15 text-white hover:bg-white/25" onClick={refresh}>Refresh</Button>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 p-4">
        <div className="mb-2 text-sm font-semibold text-neutral-600">Withdraw funds to a bank account</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Bank"><select className={inputClass} value={bank} onChange={(e) => setBank(e.target.value)}>{['Mandiri', 'BCA', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Permata'].map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Account Number"><input className={inputClass} inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1260007276065" /></Field>
          <Field label="Account Holder Name"><input className={inputClass} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value.toUpperCase())} placeholder="e.g. RIZKY MUHAMMAD AZRIS" /></Field>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-28"><Field label="Amount (PNC)"><input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field></div>
          <Button variant="outline" onClick={withdraw}>Withdraw Rp{(amount * TOKEN_TO_IDR).toLocaleString('id-ID')} to Bank</Button>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">Funds are withdrawn to an account in your name. Make sure the details are correct — account errors are not the platform's responsibility.</p>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-brand-dark">{msg}</p>}
    </Card>
  )
}
