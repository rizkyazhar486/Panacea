import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tabs = readFileSync(new URL('../../src/components/HalamanTab.tsx', import.meta.url), 'utf8')
const ui = readFileSync(new URL('../../src/components/ui.tsx', import.meta.url), 'utf8')
const rail = readFileSync(new URL('../../src/components/SuperPageCapabilityRail.tsx', import.meta.url), 'utf8')
const body = readFileSync(new URL('../../src/pages/UnifiedBodyWorkspace.tsx', import.meta.url), 'utf8')

assert.match(tabs, /PRIMARY_TAB_LIMIT = 7/)
assert.match(tabs, /More \$\{moreTabs\.length\}/)
assert.match(tabs, /primaryTabs/)
assert.match(tabs, /aria-selected=\{selected\}/)
assert.match(tabs, /setAllOpen\(false\)/)

assert.match(ui, /rounded-\[22px\]/)
assert.match(ui, /p-4 sm:p-5/)
assert.match(ui, /min-h-\[44px\]/)
assert.match(ui, /text-\[12px\]/)

assert.match(rail, /previewLimit = Math\.min\(initialLimit, 10\)/)
assert.match(rail, /Close find/)
assert.match(rail, /Search tools…/)
assert.match(rail, /All \$\{items\.length\}/)

assert.match(body, /Your body, from whole person to molecule/)
assert.match(body, /Whole body → organ → tissue → cell → molecule/)
assert.match(body, /rounded-\[24px\]/)

console.log('clarity-pass-v50: crowded tabs, shared primitives, capability rails, and Body hierarchy remain compact and progressively disclosed')
