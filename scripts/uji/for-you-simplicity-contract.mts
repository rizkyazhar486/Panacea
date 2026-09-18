import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/ForYouHub.tsx', 'utf8')
// The Life destination rail (Social/Community/Clubs/Faith/Finance/Markets)
// used to live inline in ForYouHub.tsx. 824a119 "refactor(for-you): remove
// duplicate life destination rail" intentionally deleted it because
// ForYouSocialPulse already renders the same destinations (plus the social
// feed content itself) so For You does not show two overlapping nav rails.
// Direct one-tap reachability now lives in that child component, so the
// contract checks the combined rendered surface rather than only the hub
// shell.
const socialPulse = readFileSync('src/components/ForYouSocialPulse.tsx', 'utf8')
const combined = `${page}\n${socialPulse}`

// For You is a personal command surface, not a gallery of equal-weight
// glass/gradient cards.
assert.doesNotMatch(page, /framer-motion|<motion\.|liquid-glass|liquid-spectral-edge|liquid-lens/,
  'For You reintroduced glass-card or layout-motion decoration into content')
assert.doesNotMatch(page, /bg-gradient|backdrop-blur|shadow-\[/,
  'For You reintroduced decorative gradient/blur/shadow card styling')

// High-frequency personal and intelligence destinations remain one tap.
for (const path of ['/profile', '/messages', '/notifikasi', '/settings', '/chatbot', '/emr', '/care-episode', '/my-materials']) {
  assert.ok(page.includes(`to="${path}"`) || page.includes(`to: '${path}'`),
    `For You lost one-tap access to ${path}`)
}

for (const path of ['/?t=community', '/?t=clubs', '/?t=religion', '/?t=finance', '/?t=markets']) {
  assert.match(combined, new RegExp(path.replace(/[?]/g, '\\?')),
    `For You lost direct life-space access to ${path}`)
}
// Social itself is the canonical /feed route (see src/lib/katalogLengkap.ts
// '/feed' -> '/?t=social' aliasing and src/main.tsx's <Route path="/feed">),
// and ForYouSocialPulse links straight into it (avatar rail, "Open feed",
// composer) instead of duplicating the query-param form used for the other
// legacy Home tabs.
assert.ok(/(["'`])\/feed\1|\/\?t=social/.test(combined),
  'For You lost direct life-space access to the social feed')

// Lower-frequency personal controls stay available, but out of the scrolling
// primary visual layer until requested.
// 340324a "fix(for-you): remove invented default daily score" renamed the
// label from "Daily score" to "Daily check-in" (and dropped the fabricated
// 72 default) so the UI stops implying a real computed score exists before
// the person has actually rated anything.
assert.match(page, /<details className="group border-b border-white\/10">[\s\S]*Daily check-in/,
  'Daily check-in is not progressively disclosed')
assert.match(page, /Budget note/, 'Budget note capability disappeared')
assert.match(page, /Motivation/, 'Motivation capability disappeared')
assert.match(page, /localStorage\.setItem\('pm_for_you_score'/,
  'Daily score persistence disappeared')
assert.match(page, /localStorage\.setItem\('pm_for_you_budget_note'/,
  'Budget note persistence disappeared')

// Long-tail feature access remains delegated to the shared rail.
assert.match(page, /<SuperPageCapabilityRail domain="for-you" initialLimit=\{24\} \/>/,
  'For You long-tail capability reachability was removed')

console.log('for-you-simplicity-contract: direct one-tap personal/intelligence rails, progressive personal tools, no content-layer glass mosaic, and preserved long-tail reachability.')
