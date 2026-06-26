import { useEffect, useState, useRef } from 'react'
import { useStore, TOKEN_TO_IDR } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconWallet, IconToken, IconCheck, IconShield, IconUpload } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import type { SubscriptionPlan, TxType } from '../lib/types'

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
            title="Dompet PanaceaToken"
            subtitle={`1 PNC = Rp${TOKEN_TO_IDR.toLocaleString('id-ID')}`}
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

          <div className="mt-5 space-y-5">
            <ManualBankTransfer />
            {msg && <p className="text-xs font-semibold text-brand-dark">{msg}</p>}

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
                  onClick={() => setBuyPlan(pl.id)}
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

      {buyPlan && (
        <EmrPurchaseModal
          plan={buyPlan}
          price={PLANS.find((p) => p.id === buyPlan)?.price ?? 0}
          onClose={() => setBuyPlan(null)}
          onConfirm={(seats) => {
            subscribe(buyPlan, seats)
            setBuyPlan(null)
            setMsg('Pembelian AI-EMR berhasil — kredensial diterima & sedang diverifikasi.')
            setTimeout(() => setMsg(''), 3000)
          }}
        />
      )}

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
      if (!str.trim()) return setErr('Nomor STR wajib diisi untuk pembelian individu.')
    } else {
      if (!orgName.trim()) return setErr('Nama perusahaan/instansi wajib diisi.')
      if (!npwp.trim()) return setErr('NPWP perusahaan wajib diisi.')
      if (strFiles.length === 0) return setErr('Unggah minimal satu STR dokter (JPG).')
    }
    onConfirm(seats)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-brand-dark">
          <IconShield size={20} />
          <h3 className="text-lg font-bold">Pembelian AI-EMR — Verifikasi Kredensial</h3>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          AI-EMR hanya dijual ke pembeli bersertifikat. Paket <b>{isCompany ? 'Rumah Sakit' : 'Individu'}</b> · {price} PNC/bulan.
        </p>

        <div className="mt-4 flex gap-2">
          {(['individu', 'perusahaan'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBuyer(b)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${buyer === b ? 'bg-brand-50 text-brand-dark ring-1 ring-brand' : 'bg-neutral-100 text-neutral-500'}`}
            >
              {b === 'individu' ? 'Individu (Dokter)' : 'Perusahaan / Instansi'}
            </button>
          ))}
        </div>

        {buyer === 'individu' ? (
          <div className="mt-4 space-y-3">
            <Field label="Nomor STR / Sertifikat Praktik">
              <input className={inputClass} value={str} onChange={(e) => setStr(e.target.value)} placeholder="Wajib — STR aktif" />
            </Field>
            <UploadBox label="Unggah scan STR (JPG/PDF) — opsional" onFiles={(f) => setStrFiles(f)} files={strFiles} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Field label="Jenis Pembeli">
              <select className={inputClass} value={orgType} onChange={(e) => setOrgType(e.target.value as 'Rumah Sakit' | 'Instansi')}>
                <option>Rumah Sakit</option>
                <option>Instansi</option>
              </select>
            </Field>
            <Field label={`Nama ${orgType}`}>
              <input className={inputClass} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={`mis. ${orgType === 'Rumah Sakit' ? 'RS Sehat Sentosa' : 'Dinas Kesehatan Kota'}`} />
            </Field>
            <Field label="NPWP Perusahaan">
              <input className={inputClass} value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder="00.000.000.0-000.000" />
            </Field>
            <Field label="Jumlah seat dokter">
              <input className={inputClass} type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
            </Field>
            <UploadBox label="STR setiap dokter (beberapa JPG)" multiple onFiles={(f) => setStrFiles(f)} files={strFiles} />
          </div>
        )}

        {err && <p className="mt-3 text-xs font-semibold text-accent">{err}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" onClick={submit}>Bayar {price} PNC & Kirim</Button>
        </div>
      </div>
    </div>
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
const MANUAL_BANK = {
  bank: 'Bank Mandiri',
  number: '1260007276065',
  holder: 'RIZKY MUHAMMAD AZRIS',
  waNumber: '6282261143040', // E.164 without "+"
  waLabel: '+62 822-6114-3040',
}

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
    if (file.size > 8 * 1024 * 1024) { setReqMsg('Foto bukti terlalu besar (maks 8MB).'); return }
    const reader = new FileReader()
    reader.onload = () => setProof(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function submitManual() {
    if (amount <= 0) { setReqMsg('Masukkan jumlah PNC.'); return }
    if (!proof) { setReqMsg('Unggah foto bukti transfer terlebih dahulu.'); return }
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
    setReqMsg(`Bukti transfer ${amount} PNC (Rp${idr}) terkirim & menunggu verifikasi. Saldo otomatis ditambahkan setelah bukti diverifikasi.`)
    const text = `Halo, saya mau top-up Panaceamed.id%0A%0AJumlah: ${amount} PNC (Rp${idr})%0ASudah transfer ke ${MANUAL_BANK.bank} ${MANUAL_BANK.number} a.n. ${MANUAL_BANK.holder}.%0ABukti transfer (foto) saya lampirkan di chat ini.%0A%0AMohon diverifikasi & saldo ditambahkan. Terima kasih.`
    window.open(`https://wa.me/${MANUAL_BANK.waNumber}?text=${text}`, '_blank')
  }

  function copyNumber() {
    navigator.clipboard?.writeText(MANUAL_BANK.number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="rounded-2xl border-2 border-brand/20 bg-brand-50/40 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
        🏦 Top-up via Transfer Bank
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500">satu-satunya metode pembayaran</span>
      </div>
      <p className="mt-1 text-[12px] text-neutral-500">
        Transfer sesuai nominal, lalu konfirmasi via WhatsApp. Saldo PNC ditambahkan setelah pembayaran diverifikasi.
      </p>
      <div className="mt-3 rounded-xl bg-white p-3 text-sm">
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">Bank</span><span className="font-bold">{MANUAL_BANK.bank}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">No. Rekening</span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold">{MANUAL_BANK.number}</span>
            <button onClick={copyNumber} className="rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-dark">{copied ? 'Tersalin ✓' : 'Salin'}</button>
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-neutral-400">Atas Nama</span><span className="font-bold">{MANUAL_BANK.holder}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="w-28"><Field label="Jumlah (PNC)"><input className={inputClass} type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field></div>
        <div className="rounded-xl bg-white px-3 py-2 text-sm">
          Total transfer: <b>Rp{(amount * TOKEN_TO_IDR).toLocaleString('id-ID')}</b>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-brand/40 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-bold text-brand-dark">📸 Bukti Transfer (wajib)</div>
          {proof && <button onClick={() => setProof('')} className="text-[11px] font-semibold text-red-500 hover:underline">Hapus</button>}
        </div>
        <input ref={proofRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pickProof(e.target.files?.[0] ?? null)} />
        {proof ? (
          <img src={proof} alt="Bukti transfer" className="mt-2 max-h-44 w-full rounded-lg object-contain ring-1 ring-neutral-200" />
        ) : (
          <button onClick={() => proofRef.current?.click()} className="mt-2 grid w-full place-items-center rounded-lg border border-neutral-200 bg-neutral-50 py-6 text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
            Ketuk untuk unggah / foto struk transfer
          </button>
        )}
      </div>

      <div className="mt-3">
        <Button onClick={submitManual} disabled={amount <= 0 || !proof} className="!bg-[#25D366] hover:!bg-[#1ebe5a]">
          ✅ Kirim Bukti & Konfirmasi
        </Button>
      </div>
      {reqMsg && <p className="mt-2 text-[12px] font-semibold text-brand-dark">{reqMsg}</p>}
      <p className="mt-1 text-[11px] text-neutral-400">Admin: {MANUAL_BANK.waLabel} · saldo otomatis masuk setelah bukti diverifikasi.</p>
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
    depositTokens(r.amount, `Top-up manual terverifikasi (bukti transfer) — ${r.amount} PNC`)
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
        title="Verifikasi Bukti Transfer (Owner)"
        subtitle="Setujui bukti → PNC otomatis ditambahkan"
        right={<Badge tone={pending.length ? 'high' : 'brand'}>{pending.length} menunggu</Badge>}
      />
      {reqs.length === 0 ? (
        <p className="text-sm text-neutral-400">Belum ada bukti transfer yang masuk.</p>
      ) : (
        <div className="space-y-2">
          {reqs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
              <button onClick={() => setView(view === r.id ? '' : r.proof)} className="shrink-0">
                <img src={r.proof} alt="bukti" className="h-12 w-12 rounded-lg object-cover ring-1 ring-neutral-200" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{r.amount} PNC <span className="font-normal text-neutral-400">· Rp{r.idr}</span></div>
                <div className="text-[11px] text-neutral-400">{new Date(r.at).toLocaleString('id-ID')}</div>
              </div>
              {r.status === 'pending' ? (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => verify(r)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark">Verifikasi</button>
                  <button onClick={() => reject(r)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">Tolak</button>
                </div>
              ) : (
                <Badge tone={r.status === 'verified' ? 'brand' : 'high'}>{r.status === 'verified' ? 'Terverifikasi ✓' : 'Ditolak'}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
      {view && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" onClick={() => setView('')}>
          <img src={view} alt="bukti transfer" className="max-h-[80vh] max-w-full rounded-xl" />
        </div>
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
      setMsg('Isi nama pemilik & nomor rekening untuk menarik dana.')
      return
    }
    try {
      const r = await api.withdraw(amount, bank, accountNumber.trim(), accountHolder.trim())
      setBalance(r.balance)
      syncWalletBalance(r.balance)
      const idr = `Rp${(amount * TOKEN_TO_IDR).toLocaleString('id-ID')}`
      setMsg(
        r.payout?.status === 'processed'
          ? `✅ ${idr} sedang dikirim otomatis (Iris) ke ${bank} a.n. ${accountHolder}. Ref ${r.payout.referenceNo ?? '-'}.`
          : r.payout?.status === 'queued'
          ? `⏳ Penarikan ${idr} dibuat & menunggu persetujuan (Iris). Ref ${r.payout.referenceNo ?? '-'}.`
          : `Penarikan ${idr} ke ${bank} ${accountNumber} a.n. ${accountHolder} diterima — diproses oleh tim.`,
      )
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Gagal.'
      setMsg(m === 'insufficient_funds' ? 'Saldo tidak cukup.' : m === 'missing_account' ? 'Lengkapi data rekening.' : 'Gagal memproses penarikan.')
    }
  }

  return (
    <Card className="border-2 border-brand">
      <SectionTitle
        icon={<IconShield size={20} />}
        title="Dompet Real (Backend)"
        subtitle="Saldo & penarikan dana diproses server"
        right={<Badge tone={live ? 'brand' : 'high'}>{live ? 'Backend Aktif' : 'Mode Lokal'}</Badge>}
      />
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-brand p-5 text-white">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Saldo server</div>
          <div className="text-3xl font-extrabold">{balance} <span className="text-base font-medium text-white/70">PNC</span></div>
        </div>
        <Button variant="ghost" className="bg-white/15 text-white hover:bg-white/25" onClick={refresh}>Perbarui</Button>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 p-4">
        <div className="mb-2 text-sm font-semibold text-neutral-600">Tarik dana ke rekening bank</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Bank"><select className={inputClass} value={bank} onChange={(e) => setBank(e.target.value)}>{['Mandiri', 'BCA', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Permata'].map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Nomor Rekening"><input className={inputClass} inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="mis. 1260007276065" /></Field>
          <Field label="Nama Pemilik Rekening"><input className={inputClass} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value.toUpperCase())} placeholder="mis. RIZKY MUHAMMAD AZRIS" /></Field>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-28"><Field label="Jumlah (PNC)"><input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field></div>
          <Button variant="outline" onClick={withdraw}>Tarik Rp{(amount * TOKEN_TO_IDR).toLocaleString('id-ID')} ke Bank</Button>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">Dana ditarik ke rekening atas nama Anda. Pastikan data benar — kesalahan rekening di luar tanggung jawab platform.</p>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-brand-dark">{msg}</p>}
    </Card>
  )
}
