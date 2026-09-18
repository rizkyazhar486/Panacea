import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const body = readFileSync(new URL('../../src/pages/UnifiedBodyWorkspace.tsx', import.meta.url), 'utf8')
const rail = readFileSync(new URL('../../src/components/SuperPageCapabilityRail.tsx', import.meta.url), 'utf8')
const forYou = readFileSync(new URL('../../src/pages/ForYouHub.tsx', import.meta.url), 'utf8')
const stack = readFileSync(new URL('../../src/components/ForYouDailyStack.tsx', import.meta.url), 'utf8')
const depth = readFileSync(new URL('../../src/components/SurfaceDepthNavigator.tsx', import.meta.url), 'utf8')

assert.match(body, /SuperPageCapabilityRail/)
assert.match(body, /domain="body"/)
assert.doesNotMatch(body, /FeatureBoulevard/)

assert.match(rail, /FOR_YOU_PATHS/)
assert.doesNotMatch(rail, /if \(domain === 'for-you'\) return true/)
assert.match(rail, /previewLimit = Math\.min\(initialLimit, 10\)/)
assert.match(rail, /rounded-\[22px\]/)

assert.doesNotMatch(forYou, /const LIFE:/)
assert.doesNotMatch(forYou, /DestinationRail label="Life"/)

assert.match(stack, /FOR_YOU_WIDGET_CATALOG\.slice\(0, 4\)/)
assert.match(stack, /All \$\{FOR_YOU_WIDGET_CATALOG\.length\}/)
assert.match(stack, /aria-label=\{\`About \$\{widget\.title\}\`\}/)
assert.doesNotMatch(stack, /line-clamp-2/)

assert.match(depth, /snap-x/)
assert.match(depth, /min-h-\[42px\]/)
assert.match(depth, /bg-white\/\[\.08\]/)

console.log('clarity-pass-v52: super pages share one browser, For You is deduplicated, daily stack is progressive, and depth navigation remains compact')
