import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

// Renders children directly under document.body, escaping any ancestor
// stacking context. Shell's main content wrapper has `position:relative;
// z-index:10` (its own stacking context, ranked below the mobile bottom
// nav's z-30 and drawer's z-40 at the root level) — any `fixed z-*` modal
// declared inside a page component gets trapped inside that context and
// can never actually paint above the bottom nav, no matter how high its
// own z-index is. Use this for any full-screen modal/dialog rendered from
// a page so it isn't silently buried (and unclickable) behind the nav.
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
