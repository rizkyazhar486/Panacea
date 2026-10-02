import { useState, type DetailsHTMLAttributes, type ReactNode, type SyntheticEvent } from 'react'

interface OnDemandDisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'children'> {
  /** Elemen `<summary>`; selalu dirender supaya panel bisa dibuka. */
  summary: ReactNode
  /** Dirender hanya setelah panel pernah dibuka, lalu tetap terpasang agar state di dalamnya tidak hilang saat ditutup. */
  children: ReactNode
}

/**
 * `<details>` yang tidak memasang isinya sampai dibuka.
 *
 * React merender anak `<details>` yang tertutup seperti biasa, jadi viewer WebGL di
 * dalamnya tetap membuat konteks GPU, mengunduh GLB, dan menjalankan loop render untuk
 * panel yang tak terlihat. Komponen ini membuat "dimuat saat dibuka" benar-benar terjadi.
 * Pembukaan lewat find-in-page atau anchor juga memicu `toggle`, jadi ikut terpasang.
 */
export function OnDemandDisclosure({ summary, children, onToggle, ...details }: OnDemandDisclosureProps) {
  const [opened, setOpened] = useState(Boolean(details.open))
  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) setOpened(true)
    onToggle?.(event)
  }
  return (
    <details {...details} data-on-demand={opened ? 'opened' : 'idle'} onToggle={handleToggle}>
      {summary}
      {opened ? children : null}
    </details>
  )
}
