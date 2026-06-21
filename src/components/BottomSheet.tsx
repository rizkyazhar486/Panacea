import { useEffect, type ReactNode } from 'react'

// Mobile-first bottom sheet — slides up from the bottom with a backdrop. Used
// instead of native dropdowns on phones (e.g. choosing a facility type).
export function BottomSheet({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in relative w-full max-w-md rounded-t-3xl bg-white p-4 pb-6 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-300 sm:hidden" />
        {title && <div className="mb-3 px-1 text-sm font-bold">{title}</div>}
        {children}
      </div>
    </div>
  )
}
