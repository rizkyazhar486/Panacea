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

assert.match(
  shell,
  /Mobile drawer[\s\S]{0,500}lg:hidden/,
  'mobile contextual drawer must remain available after desktop sidebar removal',
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

console.log('desktop-sidebar-removal: ok')
