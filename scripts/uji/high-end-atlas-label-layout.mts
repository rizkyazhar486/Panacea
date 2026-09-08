import assert from 'node:assert/strict'
import { layoutAtlasLabels, type AtlasLabelCandidate } from '../../src/lib/anatomy/atlasLabelLayout.ts'

const candidates: AtlasLabelCandidate[] = Array.from({ length: 48 }, (_, index) => ({
  nodeId: `structure-${String(index).padStart(2, '0')}`,
  text: `Structure ${index}`,
  anchor: {
    x: 160 + (index % 8) * 18,
    y: 180 + Math.floor(index / 8) * 18,
  },
  width: 88,
  height: 24,
  priority: 100 - index,
  selected: index === 0,
  pinned: index === 1,
}))

const options = {
  viewportWidth: 390,
  viewportHeight: 844,
  safeInset: 12,
  maxVisibleLabels: 20,
  maxRings: 6,
  candidateStep: 18,
  gridCellSize: 48,
  maxOverlapRatio: 0,
}

const layoutA = layoutAtlasLabels(candidates, options)
const layoutB = layoutAtlasLabels([...candidates].reverse(), options)
assert.deepEqual(layoutA, layoutB, 'Label layout must be independent of input ordering.')
assert.ok(layoutA.visibleCount <= options.maxVisibleLabels + 2, 'Only selected/pinned labels may exceed the ordinary capacity.')
assert.ok(layoutA.hiddenCount > 0, 'Dense anatomy labels should be decluttered rather than stacked.')
assert.equal(layoutA.placements.find((placement) => placement.nodeId === 'structure-00')?.visible, true)
assert.equal(layoutA.placements.find((placement) => placement.nodeId === 'structure-01')?.visible, true)

const visible = layoutA.placements.filter((placement) => placement.visible)
for (const placement of visible) {
  assert.ok(placement.rect.x >= options.safeInset)
  assert.ok(placement.rect.y >= options.safeInset)
  assert.ok(placement.rect.x + placement.rect.width <= options.viewportWidth - options.safeInset + 1e-9)
  assert.ok(placement.rect.y + placement.rect.height <= options.viewportHeight - options.safeInset + 1e-9)
  assert.ok(Number.isFinite(placement.leaderLength))
}

const overlap = (a: typeof visible[number]['rect'], b: typeof visible[number]['rect']) => {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

for (let i = 0; i < visible.length; i += 1) {
  for (let j = i + 1; j < visible.length; j += 1) {
    const a = visible[i]
    const b = visible[j]
    if (a.selected || a.pinned || b.selected || b.pinned) continue
    assert.equal(overlap(a.rect, b.rect), 0, `Ordinary visible labels ${a.nodeId} and ${b.nodeId} overlap.`)
  }
}

const capacityFixture = layoutAtlasLabels([
  { nodeId: 'ordinary-a', text: 'Ordinary A', anchor: { x: 80, y: 80 }, width: 60, height: 20, priority: 10 },
  { nodeId: 'ordinary-b', text: 'Ordinary B', anchor: { x: 180, y: 80 }, width: 60, height: 20, priority: 9 },
  { nodeId: 'selected', text: 'Selected', anchor: { x: 280, y: 80 }, width: 60, height: 20, priority: 1, selected: true },
], {
  viewportWidth: 390,
  viewportHeight: 844,
  maxVisibleLabels: 1,
})
assert.equal(capacityFixture.placements.find((placement) => placement.nodeId === 'selected')?.visible, true)
assert.equal(capacityFixture.visibleCount, 1, 'Selected label is prioritized before ordinary labels and occupies capacity first.')

assert.throws(() => layoutAtlasLabels([
  { nodeId: 'dup', text: 'A', anchor: { x: 0, y: 0 }, width: 10, height: 10, priority: 1 },
  { nodeId: 'dup', text: 'B', anchor: { x: 0, y: 0 }, width: 10, height: 10, priority: 1 },
], { viewportWidth: 390, viewportHeight: 844 }), /Duplicate atlas label node id/)

console.log(`High-end atlas label layout: deterministic spatial-hash decluttering verified with ${layoutA.visibleCount} visible and ${layoutA.hiddenCount} hidden labels on a 390x844 viewport.`)
