import { Link } from 'react-router-dom'
import { tr } from '../../../lib/i18n'
import { useBahasa } from '../../../lib/useBahasa'
import { SIMPLE_ROUTE } from '../model/simpleActions'

/** Satu tautan besar di atas beranda penuh: jalan masuk untuk orang yang kewalahan. */
export function SimpleModeInvite() {
  useBahasa()
  return (
    <Link to={SIMPLE_ROUTE} data-testid="simple-invite"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 72, padding: '12px 16px', margin: '8px 0', borderRadius: 16, background: '#1d4ed8', color: '#fff', fontSize: 22, fontWeight: 800, textDecoration: 'none', textAlign: 'center', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
      <span aria-hidden="true">👆</span>{tr('Too many buttons? Tap here for the simple screen')}
    </Link>
  )
}
