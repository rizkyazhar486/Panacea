// Face from photo, step 1: consent, one photo, line the face up with the outline (drag, zoom, rotate). The photo
// stays in this tab's memory as an object URL and is released on Cancel or when the panel closes; nothing is
// uploaded or stored. Landmark measurement is the next step and is said to be not built yet, not faked.

import { useEffect, useRef, useState } from 'react'
import {
  ALIGN_START, FACE_PHOTO_BOUNDARY, ROTATE_MAX_DEG, ZOOM_MAX, ZOOM_MIN, alignTransform, canGenerate, checkPhotoFile, checkPhotoSize,
  clampAlignment, photoReason, type Alignment,
} from '../../engine/face-capture/faceAlign.ts'
import './faceCapture.css'

const SIZE = 220

export function FaceCapture() {
  const [consent, setConsent] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [align, setAlign] = useState<Alignment>(ALIGN_START)
  const [done, setDone] = useState(false)
  const drag = useRef<{ x: number; y: number; from: Alignment } | null>(null)

  // Release the photo from memory when it is replaced or the panel goes away.
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const reset = () => { setUrl(null); setAlign(ALIGN_START); setDone(false); setErr(null) }

  const pick = (file: File | undefined) => {
    if (!file) return
    const check = checkPhotoFile(file.type, file.size)
    if (!check.ok) { setErr(photoReason(check)); return }
    const next = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = checkPhotoSize(img.naturalWidth, img.naturalHeight)
      if (!size.ok) { URL.revokeObjectURL(next); setErr(photoReason(size)); return }
      setErr(null); setAlign(ALIGN_START); setDone(false); setUrl(next)
    }
    img.onerror = () => { URL.revokeObjectURL(next); setErr('That photo could not be opened.') }
    img.src = next
  }

  const set = (patch: Partial<Alignment>) => setAlign((a) => clampAlignment({ ...a, ...patch }))

  return (
    <section className="fc" aria-label="Face from photo">
      <p className="fc-boundary">{FACE_PHOTO_BOUNDARY}</p>

      <label className="fc-consent">
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (!e.target.checked) reset() }} />
        <span>Use my photo on this device only, for this session. It is not uploaded or saved.</span>
      </label>

      <div
        className={`fc-stage${url ? '' : ' is-empty'}`}
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={(e) => { if (!url || done) return; drag.current = { x: e.clientX, y: e.clientY, from: align }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          set({ panX: d.from.panX + (e.clientX - d.x) / SIZE, panY: d.from.panY + (e.clientY - d.y) / SIZE })
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        {url ? (
          <img src={url} alt="Your photo, positioned inside the face outline" draggable={false} style={{ transform: alignTransform(align, SIZE) }} />
        ) : (
          <span className="fc-placeholder">{consent ? 'Choose a photo of your face' : 'Agree above to add a photo'}</span>
        )}
        <svg className="fc-outline" viewBox="0 0 100 100" aria-hidden>
          <ellipse cx="50" cy="47" rx="27" ry="35" />
          <line x1="35" y1="42" x2="45" y2="42" /><line x1="55" y1="42" x2="65" y2="42" />
        </svg>
      </div>
      <p className="fc-hint">{url && !done ? 'Drag to move. Line your eyes up with the two marks.' : ' '}</p>

      {err && <p className="fc-err" role="alert">{err}</p>}

      {url && !done && (
        <div className="fc-sliders">
          <label><span>Zoom</span><input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.01} value={align.zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} /></label>
          <label><span>Rotate</span><input type="range" min={-ROTATE_MAX_DEG} max={ROTATE_MAX_DEG} step={1} value={align.rotateDeg} onChange={(e) => set({ rotateDeg: Number(e.target.value) })} /></label>
        </div>
      )}

      {done && (
        <p className="fc-next" role="status">Photo aligned. Measuring face landmarks from it is the next step and is not built yet.</p>
      )}

      <div className="fc-actions">
        <label className={`fc-btn${consent ? '' : ' is-off'}`}>
          {url ? 'Change photo' : 'Choose photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={!consent} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {url && <button type="button" className="fc-btn" onClick={reset}>Cancel</button>}
        {url && !done && (
          <button type="button" className="fc-btn is-primary" disabled={!canGenerate(true, consent)} onClick={() => setDone(true)}>Done aligning</button>
        )}
      </div>
    </section>
  )
}
