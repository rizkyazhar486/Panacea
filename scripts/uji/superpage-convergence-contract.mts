import { readFile } from 'node:fs/promises'
import { SUPER_PAGES, superPageForRoute } from '../../src/lib/superPages.ts'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'

const main = await readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const home = await readFile(new URL('../../src/pages/HomeSocialWorkspace.tsx', import.meta.url), 'utf8')
const shell = await readFile(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
const fab = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')
const forYou = await readFile(new URL('../../src/pages/ForYouHub.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../../src/styles/superpage-convergence.css', import.meta.url), 'utf8')

let failed = false
function chk(name: string, condition: boolean, detail = '') {
  console.log(condition ? 'PASS' : 'FAIL', name, detail)
  if (!condition) failed = true
}

const routes = [...main.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((route) => route !== '*')

chk('exactly three super pages define the primary product model', SUPER_PAGES.length === 3)
chk(
  'super-page ids are stable',
  new Set(SUPER_PAGES.map((space) => space.id)).size === 3 &&
    ['body', 'clinical', 'for-you'].every((id) => SUPER_PAGES.some((space) => space.id === id)),
)

chk('router inventory is measured from real routes, not a marketing number', routes.length >= 200, String(routes.length))
chk(
  'every explicit route resolves to one super-page family',
  routes.every((route) => ['body', 'clinical', 'for-you'].includes(superPageForRoute(route))),
  String(routes.length),
)
chk(
  'every catalogued product capability resolves to one super-page family',
  FITUR_DARI_HUB.every((feature) => ['body', 'clinical', 'for-you'].includes(superPageForRoute(feature.to, feature.grup))),
  String(FITUR_DARI_HUB.length),
)

chk('Home exposes the three-space launcher', home.includes('<SuperPageLauncher'))
chk('Home exposes the functional image slider', home.includes('<PanaceaImageSlider'))
chk('Home no longer carries a persistent primary nav dock', !home.includes('data-panacea-primary-nav'))

chk('Shell has no sidebar or mobile drawer implementation', !shell.includes('DrawerNav') && !shell.includes('menuOpen') && !shell.includes('setMenuOpen'))
chk('Shell command bar owns the compact three-space dropdown', shell.includes('SUPER_PAGES.map') && shell.includes('pmd-command-spaces'))
chk('Shell applies the spectral stage globally', shell.includes('pmd-spectral-shell'))
chk('scroll choreography excludes spatial surfaces', shell.includes("data-spatial={spatialSurface ? 'true' : 'false'}"))

chk('Assistive Touch is independent from scroll-hidden chrome', !shell.includes('navHidden') && !shell.includes('setNavHidden'))
chk('Assistive Touch is available beyond mobile breakpoints', !fab.includes('fixed z-50 lg:hidden') && !fab.includes('fixed inset-0 z-40 bg-black/20 lg:hidden'))
chk('Body Explorer keeps Assistive Touch input opt-out', fab.includes("lokasi.pathname.startsWith('/body-explorer')") && fab.includes('if (sembunyikanDiBodyExplorer) return null'))

chk('For You mounts the functional music player', forYou.includes('<PanaceaMusicPlayer'))
chk('For You mounts a long-tail capability activity feed', forYou.includes('<SuperPageActivityFeed'))
chk('liquid metal treatment has an explicit hover state', css.includes('.pmd-liquid-metal:hover::before') && css.includes('.pmd-superpage-tile:hover'))
chk('scroll animation has a view-timeline path', css.includes('animation-timeline: view()') && css.includes('pmd-view-enter'))
chk('reduced-motion fallback is present', css.includes('@media (prefers-reduced-motion: reduce)'))
chk('reduced-transparency fallback is present', css.includes('@media (prefers-reduced-transparency: reduce)'))

if (failed) process.exitCode = 1
