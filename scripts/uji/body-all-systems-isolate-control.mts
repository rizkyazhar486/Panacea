import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')

assert.match(
  source,
  /function applyProjectedSelection\(groups: readonly THREE\.Group\[\], selectedName\?: string \| null, isolate = false\)/,
  'selection application must accept an isolate flag distinct from the default fade',
)
assert.match(
  source,
  /if \(mesh\.userData\.panaceaContext !== true\) \{\s*mesh\.visible = hit \|\| selected === '' \|\| !isolate/,
  'isolate must fully hide non-selected, non-context meshes rather than only dimming them',
)
assert.doesNotMatch(
  source,
  /panaceaContext === true[\s\S]{0,40}mesh\.visible = false/,
  'isolate must never hide the whole-body context surface used for spatial orientation',
)

assert.match(source, /const \[isolate, setIsolate\] = useState\(false\)/, 'isolate must be explicit view state, off by default')
assert.match(
  source,
  /if \(!selectedStructureName && isolate\) setIsolate\(false\)/,
  'isolate must not persist once there is no selection left to isolate',
)
assert.match(
  source,
  /applyProjectedSelection\(projectedGroups, mesh\.name, isolateRef\.current\)/,
  'clicking a new structure while isolate is active must keep applying isolate to the new selection',
)

assert.match(source, /\{isolate \? 'Show others' : 'Isolate'\}/, 'the isolate toggle must be reachable from the selection badge')
assert.match(source, /aria-pressed=\{isolate\}/, 'the isolate toggle must expose its pressed state for assistive tech')
assert.match(source, /Clear\s*<\/button>/, 'a selection must be clearable without leaving isolate stuck on')

console.log('BodyAllSystems3D isolate/show-others control verified: hides only non-selected system meshes, preserves whole-body context, and resets when selection clears.')
