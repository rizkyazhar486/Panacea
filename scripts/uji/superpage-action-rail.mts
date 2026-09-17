import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/SuperPageActionRail.tsx', import.meta.url), 'utf8')
const chk = (name: string, condition: boolean, detail = '') => console.log(condition ? 'PASS' : 'FAIL', name, detail)

chk('super-page rail uses shared SlidableRail', source.includes('<SlidableRail'))
chk('rail exposes Home', source.includes("label: 'Home'"))
chk('rail exposes Your Body', source.includes("label: 'Your Body'"))
chk('rail exposes Clinical', source.includes("label: 'Clinical'"))
chk('rail exposes For You', source.includes("label: 'For You'"))
chk('rail uses real canonical destinations', source.includes("to: '/tubuh'") && source.includes("to: '/clinical-hub'") && source.includes("to: '/?t=for-you'"))
chk('context commands come from registered route actions', source.includes('registeredContextActionIds'))
chk('Body Explorer preserves immersive input ownership', source.includes("location.pathname.startsWith('/body-explorer')") && source.includes('return null'))
chk('targets meet mobile minimum', source.includes('min-h-[48px]'))
chk('rail does not install document pointer listeners', !source.includes("document.addEventListener('pointer"))
