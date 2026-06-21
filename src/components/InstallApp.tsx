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
        <div className="text-[13px] font-bold leading-tight">Pasang aplikasi Panaceamed</div>
        <div className="text-[11px] text-neutral-500">Gratis — akses lebih cepat dari layar utama.</div>
      </div>
      {state === 'available' && (
        <button onClick={() => promptInstall()} className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white">Pasang</button>
      )}
      {state === 'ios' && (
        <a href="/settings" className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white">Cara</a>
      )}
      <button onClick={() => { dismissBanner(); setHidden(true) }} className="shrink-0 px-1.5 text-lg leading-none text-neutral-400" aria-label="Tutup">×</button>
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
          <div className="text-sm font-bold">Aplikasi sudah terpasang</div>
          <div className="text-[11px] text-neutral-500">Panaceamed berjalan sebagai aplikasi di perangkat ini.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-brand/20 bg-brand-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-2xl">📲</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Pasang sebagai Aplikasi (gratis)</div>
          <div className="text-[12px] text-neutral-500">
            Tambahkan Panaceamed ke layar utama — tampil seperti aplikasi (ikon, layar penuh, akses cepat),
            tanpa biaya toko aplikasi.
          </div>
          <div className="mt-3">
            {state === 'available' ? (
              <button
                onClick={() => promptInstall()}
                className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
              >
                📲 Pasang Sekarang
              </button>
            ) : state === 'ios' ? (
              <button
                onClick={() => setShowIos((v) => !v)}
                className="rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-bold text-brand-dark"
              >
                Cara pasang di iPhone/iPad ▾
              </button>
            ) : (
              <p className="text-[12px] text-neutral-400">
                Buka lewat <b>Chrome (Android)</b> atau <b>Safari (iOS)</b> untuk memasang. Di desktop Chrome/Edge,
                klik ikon pasang (⊕) pada bilah alamat.
              </p>
            )}
          </div>

          {showIos && state === 'ios' && (
            <ol className="mt-3 list-decimal space-y-1 rounded-xl bg-white p-3 pl-7 text-[12px] text-neutral-600">
              <li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas) di Safari.</li>
              <li>Gulir lalu pilih <b>“Tambahkan ke Layar Utama”</b>.</li>
              <li>Ketuk <b>Tambah</b> — ikon Panaceamed muncul di layar utama Anda.</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
