import { useState } from 'react'
import { useStore } from '../../lib/store'
import {
  BETA_ROLES,
  buildFounderDemoAccount,
  buildIsolatedBetaAccount,
  type BetaRole,
} from '../../domains/beta/index.ts'
import {
  generateBetaNonceHex,
  markMissionStep,
  registerBetaSessionEdge,
  trackBetaFunnelStep,
} from './betaClientAdapter'
import { InfoDisclosure } from '../ui/InfoDisclosure'

const ROLE_LABELS: Readonly<Record<BetaRole, { readonly label: string; readonly icon: string }>> = {
  patient: { label: 'Patient', icon: '🩺' },
  doctor: { label: 'Doctor', icon: '👨‍⚕️' },
  athlete: { label: 'Athlete', icon: '🏃' },
}

export function BetaOnboardingModal({
  onDismiss,
  onOpenFullLogin,
}: {
  readonly onDismiss: () => void
  readonly onOpenFullLogin?: () => void
}) {
  const { login } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<BetaRole>('patient')
  const [contactOrInvite, setContactOrInvite] = useState('')
  const [pin6, setPin6] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const startIsolatedBeta = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const trimmedContact = contactOrInvite.trim()
      const hasEmail = trimmedContact.includes('@')
      const res = buildIsolatedBetaAccount({
        name,
        role,
        email: hasEmail ? trimmedContact : undefined,
        inviteCode: !hasEmail && trimmedContact ? trimmedContact : undefined,
        pin6: pin6.trim() || undefined,
        nonceHex: generateBetaNonceHex(4),
        nowIso: new Date().toISOString(),
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      login(res.account)
      markMissionStep(res.profileKey, 'profile')
      void registerBetaSessionEdge({
        profileKey: res.profileKey,
        name: res.account.name,
        role: res.betaRole,
        inviteCode: res.inviteCode,
        mode: 'beta_pass',
      }).then(() => trackBetaFunnelStep(res.account, 'onboarded'))
    } finally {
      setBusy(false)
    }
  }

  const startFounderDemo = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const founderAcc = buildFounderDemoAccount(new Date().toISOString())
      login(founderAcc)
      void registerBetaSessionEdge({
        profileKey: 'rizkyazhar486',
        name: founderAcc.name,
        role: 'owner',
        mode: 'founder_demo',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="15-Second Beta Access"
    >
      <div className="dark w-full max-w-md rounded-3xl border border-emerald-400/30 bg-[#060a10] p-4 text-white shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              15-Second Beta Pass
            </span>
            <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">
              Your Isolated Health Twin
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Private local + Neon workspace for each tester.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <InfoDisclosure title="Isolation & Epistemic Notice" badge="UU PDP">
              <p>Each visitor gets a unique scoped profile_key with zero cross-user bleed.</p>
              <p>AI and 3D estimates keep truthClass distinct from clinician-signed records.</p>
            </InfoDisclosure>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss beta onboarding"
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-bold text-slate-200 hover:bg-white/15"
            >
              ×
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void startIsolatedBeta()
          }}
          className="mt-4 space-y-3"
        >
          <div>
            <label htmlFor="beta-onboard-name" className="mb-1 block font-mono text-[10px] font-bold uppercase text-slate-300">
              Your Name
            </label>
            <input
              id="beta-onboard-name"
              data-testid="beta-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alya or dr. Budi"
              required
              minLength={2}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm text-white outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-slate-300">
              Role
            </span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select beta role">
              {BETA_ROLES.map((r) => {
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`beta-role-${r}`}
                    onClick={() => setRole(r)}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${
                      selected
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <span aria-hidden>{ROLE_LABELS[r].icon}</span>
                    <span>{ROLE_LABELS[r].label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_132px]">
            <input
              aria-label="Email or Invite Code (optional)"
              data-testid="beta-invite-input"
              value={contactOrInvite}
              onChange={(e) => setContactOrInvite(e.target.value)}
              placeholder="Email or Invite Code (optional)"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white outline-none focus:border-cyan-400"
            />
            <input
              aria-label="6-digit PIN (optional)"
              inputMode="numeric"
              maxLength={6}
              value={pin6}
              onChange={(e) => setPin6(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="6-digit PIN"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          {error && (
            <p role="alert" className="font-mono text-[11px] font-bold text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            data-testid="beta-submit-btn"
            className="min-h-[44px] w-full rounded-2xl bg-emerald-500 px-4 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {busy ? 'Creating Pass…' : 'Start in 15s →'}
          </button>
        </form>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            disabled={busy}
            data-testid="beta-demo-btn"
            onClick={() => void startFounderDemo()}
            className="min-h-[44px] rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
          >
            Try Demo
          </button>
          <button
            type="button"
            onClick={onOpenFullLogin || onDismiss}
            className="min-h-[44px] rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            Full Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default BetaOnboardingModal
