import { useEffect, useState } from 'react'
import { installState, promptInstall, onInstallableChange, isBannerDismissed, dismissBanner, type InstallState } from '../lib/pwa'

// Compact, dismissible "install" banner for the home screen.
export function InstallBanner() {
  const [state, setState] = useState<InstallState>(installState)
  const [hidden, setHidden] = useState(isBannerDismissed)
  useEffect(() => onInstallableChange(() => setState(installState())), [])
  if (hidden || (state !== 'available' && state !== 'ios')) return null
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-50 px-3 py-2.5">
      <span className="text-xl">📲</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold leading-tight">Install the Panaceamed app</div>
        <div className="text-[11px] text-neutral-500">Free — faster access from your home screen.</div>
      </div>
      {state === 'available' && (
        <button onClick={() => promptInstall()} className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white">Install</button>
      )}
      {state === 'ios' && (
        <a href="/settings" className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white">How</a>
      )}
      <button onClick={() => { dismissBanner(); setHidden(true) }} className="shrink-0 px-1.5 text-lg leading-none text-neutral-400" aria-label="Close">×</button>
    </div>
  )
}

// "Pasang Aplikasi" card — installs the PWA to the home screen (free, no store).
// On iOS (which has no install prompt) it shows the manual Share-sheet steps.
export function InstallApp() {
  const [state, setState] = useState<InstallState>(installState)
  const [showIos, setShowIos] = useState(false)

  useEffect(() => onInstallableChange(() => setState(installState())), [])

  if (state === 'installed') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-50 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-2xl">✅</span>
        <div>
          <div className="text-sm font-bold">App already installed</div>
          <div className="text-[11px] text-neutral-500">Panaceamed is running as an app on this device.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-brand/20 bg-brand-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-2xl">📲</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Install as an App (free)</div>
          <div className="text-[12px] text-neutral-500">
            Add Panaceamed to your home screen — it looks like an app (icon, full screen, quick access),
            with no app store fees.
          </div>
          <div className="mt-3">
            {state === 'available' ? (
              <button
                onClick={() => promptInstall()}
                className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
              >
                📲 Install Now
              </button>
            ) : state === 'ios' ? (
              <button
                onClick={() => setShowIos((v) => !v)}
                className="rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-bold text-brand-dark"
              >
                How to install on iPhone/iPad ▾
              </button>
            ) : (
              <p className="text-[12px] text-neutral-400">
                Open in <b>Chrome (Android)</b> or <b>Safari (iOS)</b> to install. On desktop Chrome/Edge,
                click the install icon (⊕) in the address bar.
              </p>
            )}
          </div>

          {showIos && state === 'ios' && (
            <ol className="mt-3 list-decimal space-y-1 rounded-xl bg-white p-3 pl-7 text-[12px] text-neutral-600">
              <li>Tap the <b>Share</b> button (a box with an upward arrow) in Safari.</li>
              <li>Scroll down and select <b>“Add to Home Screen”</b>.</li>
              <li>Tap <b>Add</b> — the Panaceamed icon appears on your home screen.</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
