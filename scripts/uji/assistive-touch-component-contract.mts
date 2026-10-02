import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')
const picker = await readFile(new URL('../../src/components/PemilihAksiFab.tsx', import.meta.url), 'utf8')

const chk = (name: string, condition: boolean, detail = '') => console.log(condition ? 'PASS' : 'FAIL', name, detail)

chk('Assistive Touch consumes shared gesture kernel', source.includes("from '../lib/interaction/gesture'"))
chk('Assistive Touch consumes validated preference model', source.includes("from '../lib/interaction/assistive'"))
chk('Assistive command pages use shared SlidableRail', source.includes('<SlidableRail'))
chk('Assistive Touch has a stable accessible name', source.includes('aria-label="Panacea Assistive Touch"'))
chk('Assistive Touch exposes semantic marker', source.includes('data-pmd-assistive="true"'))
chk('Body Explorer retains global orb opt-out', source.includes("lokasi.pathname.startsWith('/body-explorer')") && source.includes('if (sembunyikanDiBodyExplorer) return null'))
chk('pointer cancel cannot emit a release action', source.includes('onPointerCancel={onPointerCancel}') && source.includes('pointer.current = null'))
chk('long press uses shared threshold', source.includes('DEFAULT_GESTURE_THRESHOLDS.longPressMs'))
chk('double tap uses shared threshold', source.includes('DEFAULT_GESTURE_THRESHOLDS.doubleTapMs'))
chk('four directional mappings are wired', ['swipeUp', 'swipeDown', 'swipeLeft', 'swipeRight'].every((key) => source.includes(`prefs.gestures.${key}`)))
chk('pointer capture stays local to orb', source.includes('orbRef.current?.setPointerCapture') && !source.includes("document.addEventListener('pointer"))
chk('reduced motion controls scroll and transform behavior', source.includes('reducedMotion()') && source.includes("behavior: reducedMotion() ? 'auto' : 'smooth'"))
chk('customizer exposes gesture controls', picker.includes('Gesture actions') && picker.includes("key: 'doubleTap'") && picker.includes("key: 'longPress'"))
chk('customizer exposes snap and haptics', picker.includes('Snap to nearest edge') && picker.includes('Haptic feedback'))
chk('command slots are bounded to 12', picker.includes('of 12 command slots used') && picker.includes('slice(-12)'))
