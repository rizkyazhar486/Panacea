import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const hub = readFileSync(new URL('../../src/pages/ForYouHub.tsx', import.meta.url), 'utf8')
const feed = readFileSync(new URL('../../src/components/ForYouOmniFeed.tsx', import.meta.url), 'utf8')
const network = readFileSync(new URL('../../src/components/ForYouNetworkHub.tsx', import.meta.url), 'utf8')

test('For You mounts one unified superfeed instead of fragmented social/daily sections', () => {
  assert.match(hub, /<ForYouOmniFeed \/>/)
  assert.doesNotMatch(hub, /<ForYouSocialPulse \/>/)
  assert.doesNotMatch(hub, /<ForYouDailyStack \/>/)
})

test('superfeed carries social media interaction primitives inline', () => {
  for (const token of ['For You', 'Following', 'Fitness', 'Work', 'People', 'ShareToFeed', 'toggleLike', 'toggleRepost', 'toggleBookmark', 'Stories']) {
    assert.ok(feed.includes(token), `missing feed primitive: ${token}`)
  }
})

test('superfeed mixes community rank daily work and network objects into the same scroll', () => {
  for (const token of ['RankCard', 'CommunityCard', 'JobsCard', 'ForYouDailyStack', 'ForYouNetworkHub']) {
    assert.ok(feed.includes(token), `missing mixed feed object: ${token}`)
  }
})

test('network OS connects discovery discussion tasks and opportunity discovery', () => {
  for (const token of ['Discover people', 'Squads / Clubs', 'Discussions', 'Workboard', 'Slack-like group discussion inside For You', '# training', '# research', '# opportunities', 'For You · opportunities', 'Search LinkedIn Jobs']) {
    assert.ok(network.includes(token), `missing network surface: ${token}`)
  }
})

test('empty social state is fail-closed rather than populated by fake people or posts', () => {
  assert.match(feed, /fabricat(?:e|ing).*people.*posts/i)
  assert.match(network, /instead of synthetic matches/)
})


test('Following mode uses the canonical follow graph and discovery deep-links into DMs', () => {
  assert.match(feed, /state\.follows/)
  assert.match(network, /\/messages\?peer=/)
})
