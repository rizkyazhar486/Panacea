import { useEffect, useRef } from 'react'
import { PRIVACY_DISCLOSURE } from '../../../domains/privacy'
import { Link } from 'react-router-dom'
export function LegalModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    dialog?.querySelector('h3')?.focus()
    if (dialog) dialog.scrollTop = 0
    document.body.style.overflow = 'hidden'
    return () => {
      if (dialog?.open) dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  return (
    <dialog ref={dialogRef} aria-labelledby="privacy-summary-title"
      onCancel={e => { e.preventDefault(); onClose() }}
      onKeyDown={e => {
        if (e.key !== 'Tab') return
        const controls = e.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        const first = controls[0], last = controls[controls.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget.querySelector('h3'))) {
          e.preventDefault(); last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus()
        }
      }}
      onClick={e => {
        const box = e.currentTarget.getBoundingClientRect()
        if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) onClose()
      }}
      style={{ width: 'calc(100% - 2rem)' }}
      className="m-auto max-h-[85vh] max-w-lg overflow-y-auto rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-neutral-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
    >
        <h3 id="privacy-summary-title" tabIndex={-1} className="text-lg font-bold text-neutral-900 dark:text-white">
          Clinical Consent, Privacy &amp; Terms
        </h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p><b>Clinical authority.</b> {PRIVACY_DISCLOSURE.draftReview} {PRIVACY_DISCLOSURE.clinicalAuthority}</p>
          <p><b>Data requests.</b> {PRIVACY_DISCLOSURE.requests} {PRIVACY_DISCLOSURE.localReset}</p>
          <p><b>Sharing.</b> {PRIVACY_DISCLOSURE.sharing}</p>
          <p><b>Deployment.</b> {PRIVACY_DISCLOSURE.deployment}</p>
          <p><b>Retention.</b> {PRIVACY_DISCLOSURE.retention}</p>
          <Link to="/legal" onClick={onClose} className="inline-flex min-h-11 items-center underline">Read full policy and control details</Link>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="mt-5 w-full rounded-full bg-brand hover:opacity-95 py-3 text-sm font-bold text-white shadow-md min-h-[44px]"
        >
          Close policy summary
        </button>
    </dialog>
  )
}
