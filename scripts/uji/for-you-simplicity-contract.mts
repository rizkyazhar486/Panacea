import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/ForYouHub.tsx', 'utf8')

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

for (const path of ['/?t=social', '/?t=community', '/?t=clubs', '/?t=religion', '/?t=finance', '/?t=markets']) {
  assert.match(page, new RegExp(path.replace(/[?]/g, '\\?')),
    `For You lost direct life-space access to ${path}`)
}

// Lower-frequency personal controls stay available, but out of the scrolling
// primary visual layer until requested.
assert.match(page, /<details className="group border-b border-white\/10">[\s\S]*Daily score/,
  'Daily score is not progressively disclosed')
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
