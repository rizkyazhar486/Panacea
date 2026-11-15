import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { LANGS, setLang, tr } from '../../../lib/i18n'
import { useBahasa } from '../../../lib/useBahasa'
import { SleepCheckin } from '../../recovery-checkin/index'
import { readSimpleStart, writeSimpleStart } from '../adapters/simpleModeStorage'
import { SEE_EVERYTHING_ROUTE, SIMPLE_ACTIONS } from '../model/simpleActions'

// Gaya inline yang sengaja dibatasi pada halaman ini: anggaran CSS pemblokir sudah
// habis (cssBlokirGzip ≤ 115200), dan halaman ini dimuat malas.
const sentuh = 72 // px, jauh di atas 44 px yang diwajibkan standar adaptif
const tombolBesar: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16, minHeight: 96, padding: '16px 20px', borderRadius: 20,
  color: '#fff', textDecoration: 'none', width: '100%', boxSizing: 'border-box',
  // CSS global menetapkan nowrap pada tautan/tombol; teks panjang HARUS membungkus, bukan terpotong.
  whiteSpace: 'normal', overflowWrap: 'anywhere',
}
const ikon: CSSProperties = { fontSize: 44, lineHeight: 1, flex: '0 0 auto' }
const tombolSekunder: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: sentuh, padding: '12px 16px', borderRadius: 16,
  border: '3px solid currentColor', background: 'transparent', color: 'inherit', fontSize: 22, fontWeight: 700,
  textDecoration: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer',
  whiteSpace: 'normal', overflowWrap: 'anywhere', textAlign: 'center',
}

export function SimpleHome() {
  const lang = useBahasa()
  const [mulaiDi, setMulaiDi] = useState(readSimpleStart)
  const [gagalSimpan, setGagalSimpan] = useState(false)

  const ganti = () => {
    const mau = !mulaiDi
    const tersimpan = writeSimpleStart(mau)
    setGagalSimpan(!tersimpan)
    if (tersimpan) setMulaiDi(mau)
  }

  return (
    <main aria-labelledby="simple-title" style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 48px', display: 'grid', gap: 16 }}>
      <h2 id="simple-title" style={{ fontSize: 32, lineHeight: 1.2, margin: '8px 0 0', fontWeight: 800 }}>{tr('What do you need?')}</h2>

      {SIMPLE_ACTIONS.map((a) => (
        <Link key={a.id} to={a.to} data-testid={`simple-${a.id}`} style={{ ...tombolBesar, background: a.background }}>
          <span aria-hidden="true" style={ikon}>{a.icon}</span>
          <span style={{ display: 'grid', gap: 4, minWidth: 0, flex: '1 1 0', whiteSpace: 'normal', textAlign: 'start' }}>
            <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{tr(a.label)}</span>
            <span style={{ fontSize: 19, lineHeight: 1.3 }}>{tr(a.hint)}</span>
          </span>
        </Link>
      ))}

      <SleepCheckin />

      <Link to={SEE_EVERYTHING_ROUTE} data-testid="simple-everything" style={tombolSekunder}>{tr('See everything')}</Link>

      <section aria-label={tr('Language')} style={{ display: 'grid', gap: 10 }}>
        <h3 style={{ fontSize: 22, margin: '8px 0 0' }}>{tr('Language')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {LANGS.map((l) => (
            <button key={l.id} type="button" onClick={() => setLang(l.id)} aria-pressed={l.id === lang} lang={l.id}
              style={{ ...tombolSekunder, flexDirection: 'column', gap: 4, fontSize: 20, overflowWrap: 'normal', borderWidth: l.id === lang ? 5 : 2 }}>
              <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>{l.flag}</span>{l.native}
            </button>
          ))}
        </div>
      </section>

      <button type="button" onClick={ganti} aria-pressed={mulaiDi} data-testid="simple-start-toggle" style={tombolSekunder}>
        {mulaiDi ? tr('✓ This screen opens first. Tap to turn off.') : tr('Make this my first screen')}
      </button>
      {/* data-pmd-unclamped: penjelasan efek tombol ini harus terbaca penuh, bukan teks redup yang bisa diketuk (skrip visual-first). */}
      <div data-pmd-unclamped="true"><p style={{ margin: 0, fontSize: 19, lineHeight: 1.4, fontWeight: 600 }}>{tr('Also makes text and buttons bigger on every page.')}</p></div>
      {gagalSimpan && <p role="alert" style={{ fontSize: 20, margin: 0 }}>{tr('This device could not save your choice.')}</p>}
    </main>
  )
}
