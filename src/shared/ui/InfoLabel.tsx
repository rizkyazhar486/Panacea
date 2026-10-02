import { useId, useState, type ReactNode } from 'react'
import './infoLabel.css'

// Satu kata di layar, penjelasan di balik tombol i. Menjaga permukaan utama
// tenang (ruang lega, satu fokus) tanpa membuang kedalaman penjelasan.
// Tombol memenuhi lantai sentuh 44px; panel tidak terlihat dan tidak ada di
// pohon aksesibilitas sampai dibuka (aria-expanded menyatakan keadaannya).
export interface InfoLabelProps {
  /** Satu kata atau frasa sangat pendek. */
  label: string
  /** Penjelasan paragraf; wajib tidak kosong supaya tombol i tidak membuka kehampaan. */
  info: ReactNode
  className?: string
}

export function InfoLabel({ label, info, className = '' }: InfoLabelProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className={`info-label ${className}`.trim()}>
      <div className="info-label__row">
        <span className="info-label__word">{label}</span>
        <button
          type="button"
          className="info-label__button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? 'Hide' : 'Show'} details: ${label}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">i</span>
        </button>
      </div>
      <div id={panelId} role="region" aria-label={label} hidden={!open} className="info-label__panel">
        {info}
      </div>
    </div>
  )
}
