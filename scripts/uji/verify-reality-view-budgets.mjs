import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import {
  QUIET_MODE_MAX_BYTES,
  QUIET_MODE_SHELL_MANIFEST,
  TIER_BUDGETS,
  detectPerformanceTier,
  resolveActiveLodBundlePlan,
} from '../../src/components/reality-view/performanceTierManager.ts'

const root = new URL('../../', import.meta.url)

// 1. Inspect every Quiet Mode outer shell asset on disk and enforce <= 1.8 MB cap
let maxShellBytes = 0
let maxShellPath = ''
for (const entry of QUIET_MODE_SHELL_MANIFEST) {
  assert.ok(!/cardiovascular|nervous|visceral|muscular|skeletal|lymphoid/.test(entry.publicPath),
    `Internal organ bundle ${entry.publicPath} leaked into Quiet Mode initial shell manifest`)
  const stat = statSync(new URL(entry.publicPath, root))
  assert.ok(stat.size > 0, `Quiet Mode shell ${entry.publicPath} is empty`)
  assert.ok(
    stat.size <= QUIET_MODE_MAX_BYTES,
    `Quiet Mode shell ${entry.publicPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB) exceeds 1.8 MB budget`,
  )
  if (stat.size > maxShellBytes) {
    maxShellBytes = stat.size
    maxShellPath = entry.publicPath
  }
}

// 2. Enforce Quiet Mode NEVER preloads internal organ bundles across any tier
for (const tier of ['webgpu_high', 'mobile_lod', 'fallback_25d']) {
  const plan = resolveActiveLodBundlePlan({
    tier,
    mode: 'quiet',
    requestedSystems: ['cardiovascular', 'respiratory', 'nervous', 'renal'],
  })
  assert.deepEqual(plan.streamableSystems, [], `Quiet mode on ${tier} must not preload internal organ bundles`)
}

// 3. Hardware tier detection & RAM ceiling invariants
assert.equal(detectPerformanceTier({ hasWebGPU: true, hasWebGL2: true, isMobile: false, deviceMemoryGb: 16 }).tier, 'webgpu_high')
assert.equal(detectPerformanceTier({ hasWebGPU: false, hasWebGL2: true, isMobile: true, deviceMemoryGb: 6 }).tier, 'mobile_lod')
assert.equal(detectPerformanceTier({ hasWebGPU: true, hasWebGL2: true, isMobile: true, deviceMemoryGb: 2 }).tier, 'fallback_25d')
assert.equal(detectPerformanceTier({ hasWebGPU: false, hasWebGL2: true, isMobile: false, deviceMemoryGb: 8, rendererString: 'Google SwiftShader' }).tier, 'fallback_25d')
assert.equal(detectPerformanceTier({ hasWebGPU: true, hasWebGL2: true, isMobile: false, deviceMemoryGb: 16, consecutiveLowFpsSeconds: 3 }).tier, 'fallback_25d')
assert.ok(TIER_BUDGETS.fallback_25d.maxRamMb <= 150, 'Low-end fallback RAM ceiling must stay <= 150 MB')

console.log(
  `verify-reality-view-budgets: PASS (${QUIET_MODE_SHELL_MANIFEST.length} Quiet Mode shells verified; largest=${maxShellPath} ${(maxShellBytes / 1024).toFixed(1)} KB / ${(QUIET_MODE_MAX_BYTES / 1024).toFixed(0)} KB cap)`,
)
