import { useEffect, useState } from 'react'

// Shows a small banner when the device loses connectivity. The app itself keeps
// working offline (local-first state + cached shell); this just tells the user.
export function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [justBack, setJustBack] = useState(false)

  useEffect(() => {
    const goOffline = () => setOnline(false)
    const goOnline = () => {
      setOnline(true)
      setJustBack(true)
      setTimeout(() => setJustBack(false), 2500)
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (online && !justBack) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 py-2 text-center text-xs font-bold text-white transition-colors ${online ? 'bg-brand-dark' : 'bg-neutral-800'}`}
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      {online ? (
        <>✓ Kembali online</>
      ) : (
        <>📴 Mode Offline — Atlet, Lab Performa & Program AI tetap bisa dipakai; data tersinkron saat online kembali</>
      )}
    </div>
  )
}
