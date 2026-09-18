import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const di = dirname(fileURLToPath(import.meta.url))
const akar = join(di, '..', '..')

const shell = readFileSync(join(akar, 'src/components/Shell.tsx'), 'utf8')
const home = readFileSync(join(akar, 'src/components/HomeCommandDeck.tsx'), 'utf8')

assert.doesNotMatch(
  shell,
  /const \[sidebarOpen, setSidebarOpen\]/,
  'desktop sidebar state must not survive after permanent sidebar removal',
)

assert.doesNotMatch(
  shell,
  /Open sidebar menu/,
  'desktop command bar must not carry a button that resurrects the removed sidebar',
)

assert.doesNotMatch(
  shell,
  /sticky top-0 z-10 hidden h-screen[\s\S]{0,240}lg:flex/,
  'Shell must not render a persistent desktop sidebar',
)

assert.doesNotMatch(
  shell,
  /DrawerNav|menuOpen|setMenuOpen|Mobile drawer/,
  'sidebar/drawer navigation must not reappear on mobile after convergence',
)

assert.match(
  shell,
  /aria-label="Open Panacea spaces"/,
  'the top command bar lost the compact mobile-accessible super-page trigger',
)

assert.match(
  shell,
  /SUPER_PAGES\.map\([\s\S]{0,600}?pmd-command-space-link/,
  'the command dropdown must expose the three super pages after drawer removal',
)

assert.match(
  shell,
  /export const NAV_UNTUK_PENGATURAN/,
  'navigation data must stay exported even when the desktop presentation is removed',
)

assert.match(
  home,
  /NAV_UNTUK_PENGATURAN/,
  'Home must continue consuming the canonical navigation data',
)

assert.match(
  home,
  /gabungKatalog\(/,
  'Home must continue merging menu destinations into its complete capability index',
)

console.log('sidebar-removal: desktop and mobile drawers stay removed while command-bar super-page access remains reachable')
