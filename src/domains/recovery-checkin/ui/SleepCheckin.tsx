import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { tr } from '../../../lib/i18n'
import { readTodaySleepQuality, saveTodaySleepQuality } from '../adapters/readinessStorage'
import { SLEEP_FACES, type SleepQuality } from '../model/types'

// Gaya inline: anggaran CSS pemblokir sudah habis; halaman ini dimuat malas (lihat SimpleHome).
const wajah = (aktif: boolean): CSSProperties => ({
  display: 'grid', gap: 4, placeItems: 'center', minHeight: 88, padding: '8px 4px', borderRadius: 16, cursor: 'pointer',
  border: aktif ? '5px solid currentColor' : '3px solid currentColor', background: 'transparent', color: 'inherit',
  boxSizing: 'border-box', whiteSpace: 'normal', overflowWrap: 'normal', textAlign: 'center',
})

export function SleepCheckin() {
  const [nilai, setNilai] = useState<SleepQuality | null>(readTodaySleepQuality)
  const [gagal, setGagal] = useState(false)

  const pilih = (q: SleepQuality) => {
    const ok = saveTodaySleepQuality(q)
    setGagal(!ok)
    if (ok) setNilai(q)
  }

  return (
    <section aria-labelledby="sleep-checkin-title" data-testid="sleep-checkin" style={{ display: 'grid', gap: 10 }}>
      <h3 id="sleep-checkin-title" style={{ fontSize: 24, margin: '8px 0 0' }}>{tr('How did you sleep?')}</h3>
      <div role="group" aria-labelledby="sleep-checkin-title" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
        {SLEEP_FACES.map((f) => (
          <button key={f.value} type="button" onClick={() => pilih(f.value)} aria-pressed={nilai === f.value} data-testid={`sleep-${f.value}`} style={wajah(nilai === f.value)}>
            <span aria-hidden="true" style={{ fontSize: 34, lineHeight: 1 }}>{f.face}</span>
            <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{tr(f.label)}</span>
          </button>
        ))}
      </div>
      {nilai === null
        ? <p style={{ margin: 0, fontSize: 19 }}>{tr('Tap one. Your own rating, saved on this device.')}</p>
        : <p style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{tr('Saved for today.')} <Link to="/readiness" style={{ color: 'inherit' }}>{tr('See more')}</Link></p>}
      {gagal && <p role="alert" style={{ fontSize: 20, margin: 0 }}>{tr('This device could not save your choice.')}</p>}
    </section>
  )
}
