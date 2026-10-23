import { useState } from 'react'
import { OWNER_EMAIL } from '../../../lib/store'
import { inputClass } from '../../../components/ui'
import { api } from '../../../lib/api'
import type { Account, Role } from '../../../lib/types'
import { STR_ROLES } from '../loginData'

export function EmailOtpLogin({ role, name, str, email, setEmail, consentOk, onLogin }: {
  role: Role; name: string; str: string; email: string;
  setEmail: (v: string) => void; consentOk: () => boolean; onLogin: (a: Account) => void
}) {
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function start() {
    if (!consentOk()) return
    if (!email.trim()) { setMsg('Harap masukkan alamat email Anda.'); return }
    setBusy(true); setMsg('')
    try {
      await api.emailOtpStart(email.trim())
      setSent(true)
      setMsg('Kode verifikasi telah dikirim ke email Anda.')
    } catch {
      setMsg('Gagal mengirim kode verifikasi.')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Harap masukkan kode dari email Anda.'); return }
    setBusy(true); setMsg('')
    try {
      const a = await api.emailOtpVerify(email.trim(), code.trim(), name.trim() || 'Pengguna Panacea', role)
      onLogin({
        ...a,
        isOwner: a.email.toLowerCase() === OWNER_EMAIL,
        isSubscriber: role === 'owner',
        sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none',
        consentAt: new Date().toISOString(),
      })
    } catch {
      setMsg('Kode verifikasi salah atau sudah kedaluwarsa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-50/50 p-3 dark:border-brand/30 dark:bg-brand/10">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark dark:text-brand">
        ✉️ Masuk Cepat via Kode Email (OTP Gratis)
      </div>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="nama@email.com"
          disabled={sent}
        />
        {!sent ? (
          <button
            onClick={start}
            disabled={busy}
            type="button"
            className="shrink-0 min-h-[40px] px-4 rounded-xl bg-brand text-white font-bold text-xs disabled:opacity-50"
          >
            {busy ? '…' : 'Kirim Kode'}
          </button>
        ) : (
          <button
            onClick={() => { setSent(false); setCode(''); setMsg('') }}
            type="button"
            className="shrink-0 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 min-h-[40px]"
          >
            Ganti
          </button>
        )}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            value={code}
            onChange={e => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="6 digit kode"
          />
          <button
            onClick={verify}
            disabled={busy}
            type="button"
            className="shrink-0 min-h-[40px] px-4 rounded-xl bg-brand text-white font-bold text-xs disabled:opacity-50"
          >
            {busy ? '…' : 'Verifikasi'}
          </button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark dark:text-brand">{msg}</p>}
    </div>
  )
}
