import { readFile } from 'node:fs/promises'
import { SUPER_PAGES, superPageForRoute } from '../../src/lib/superPages.ts'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'

const main = await readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const home = await readFile(new URL('../../src/pages/HomeSocialWorkspace.tsx', import.meta.url), 'utf8')
const shell = await readFile(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
const fab = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../../src/styles/superpage-convergence.css', import.meta.url), 'utf8')

let failed = false
const chk = (name: string, ok: boolean, detail = '') => {
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
  if (!ok) failed = true
}

const routes = [...main.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((route) => route !== '*')

chk('exactly three super pages define the primary product model', SUPER_PAGES.length === 3)
chk(
  'stable super-page identities exist',
  ['body', 'clinical', 'for-you'].every((id) => SUPER_PAGES.some((space) => space.id === id)),
)
chk('router inventory is derived from real source and exceeds 200 explicit routes', routes.length >= 200, String(routes.length))
chk(
  'every explicit route resolves to one super-page family',
  routes.every((route) => ['body', 'clinical', 'for-you'].includes(superPageForRoute(route))),
  String(routes.length),
)
chk(
  'every catalogued capability resolves to one super-page family',
  FITUR_DARI_HUB.every((feature) => ['body', 'clinical', 'for-you'].includes(superPageForRoute(feature.to, feature.grup))),
  String(FITUR_DARI_HUB.length),
)

chk('Home mounts the three-space launcher', home.includes('<SuperPageLauncher'))
chk('Home mounts the existing-asset image slider', home.includes('<PanaceaImageSlider'))
chk('Home has no persistent primary navigation dock', !home.includes('data-panacea-primary-nav'))

chk('Shell has no drawer/sidebar implementation', !shell.includes('DrawerNav') && !shell.includes('menuOpen') && !shell.includes('setMenuOpen'))
chk('Shell has no second persistent primary-link navbar', !shell.includes('panacea-command-primary-links'))
chk('command bar owns the three-space dropdown', shell.includes('SUPER_PAGES.map') && shell.includes('pmd-command-spaces'))
chk('spectral stage is global to authenticated Shell', shell.includes('pmd-spectral-shell'))
chk('scroll choreography is disabled on spatial surfaces', shell.includes("data-spatial={spatialSurface ? 'true' : 'false'}"))

chk('Assistive Touch is independent from scroll-hidden chrome', !shell.includes('navHidden') && !shell.includes('setNavHidden'))
chk('Assistive Touch is available beyond mobile breakpoints', !fab.includes('fixed z-50 lg:hidden') && !fab.includes('fixed inset-0 z-40 bg-black/20 lg:hidden'))
chk('Body Explorer keeps Assistive Touch pointer opt-out', fab.includes("lokasi.pathname.startsWith('/body-explorer')") && fab.includes('if (sembunyikanDiBodyExplorer) return null'))

chk('liquid metal has purposeful hover response', css.includes('.pmd-liquid-metal:hover::before') && css.includes('.pmd-superpage-tile:hover'))
chk('scroll motion uses a native view-timeline path when supported', css.includes('animation-timeline: view()') && css.includes('pmd-view-enter'))
chk('reduced-motion fallback exists', css.includes('@media (prefers-reduced-motion: reduce)'))
chk('reduced-transparency fallback exists', css.includes('@media (prefers-reduced-transparency: reduce)'))

if (failed) process.exitCode = 1
