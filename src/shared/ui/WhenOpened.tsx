import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mountsAtOnce } from './whenOpenedPolicy'

export interface WhenOpenedProps {
  children: ReactNode
  /** Shown until the enclosing <details> is opened for the first time. */
  fallback?: ReactNode
}

// Fold keeps closed content in the DOM so no control disappears, which is right for a line of
// text but makes a route download the code of a panel nobody has opened. This mounts the
// children the first time the nearest <details> ancestor opens (and keeps them mounted after),
// so a heavy panel costs nothing until it is wanted. Outside a <details>, or inside one that is
// already open (a `folds=open` link), it mounts at once.
export function WhenOpened({ children, fallback = null }: WhenOpenedProps) {
  const marker = useRef<HTMLSpanElement | null>(null)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    const details = marker.current?.closest('details') ?? null
    if (mountsAtOnce(details)) { setOpened(true); return }
    const onToggle = () => { if (details?.open) setOpened(true) }
    details?.addEventListener('toggle', onToggle)
    return () => details?.removeEventListener('toggle', onToggle)
  }, [])

  if (opened) return <>{children}</>
  return <>{fallback}<span ref={marker} hidden /></>
}
