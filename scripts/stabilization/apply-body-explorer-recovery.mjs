import { readFileSync, writeFileSync } from 'node:fs'

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before)
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`)
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous patch anchor: ${label}`)
  return source.slice(0, first) + after + source.slice(first + before.length)
}

const bodyPath = 'src/pages/BodyExplorer.tsx'
let body = readFileSync(bodyPath, 'utf8')

body = replaceOnce(
  body,
  "import { Body3D, ANATOMY_LAYERS, RENDER_MODES, CT_WINDOWS, MOTION_OFF, MOTION_REST, MOTION_EXERCISE, type AnatomyLayer, type RenderMode, type SlicePlane, type MotionState } from '../components/Body3D'\n",
  "import { Body3D, ANATOMY_LAYERS, RENDER_MODES, CT_WINDOWS, MOTION_OFF, MOTION_REST, MOTION_EXERCISE, type AnatomyLayer, type RenderMode, type SlicePlane, type MotionState } from '../components/Body3D'\nimport { FeatureErrorBoundary } from '../components/FeatureErrorBoundary'\n",
  'FeatureErrorBoundary import',
)

body = replaceOnce(
  body,
  `          </div>\n\n          <div className="mt-3">\n            {panelTab === 'layers'`,
  `          </div>\n\n          <FeatureErrorBoundary\n            key={panelTab}\n            featureName={\`${'${'}PANEL_TABS.find((tab) => tab.key === panelTab)?.label ?? 'Body Exposure'} panel\`}\n            onBack={() => setPanelTab('layers')}\n            onLightweight={() => setPanelTab('layers')}\n          >\n            <div className="mt-3">\n              {panelTab === 'layers'`,
  'panel error-boundary opening',
)

body = replaceOnce(
  body,
  `            )}\n          </div>\n        </div>\n\n        <div className="mt-4 min-w-0">`,
  `            )}\n            </div>\n          </FeatureErrorBoundary>\n        </div>\n\n        <div className="mt-4 min-w-0">`,
  'panel error-boundary closing',
)

body = replaceOnce(
  body,
  `                <WholeBodyPrecisionLab\n                  onHighlight={(nodes) => { setActiveWorkout(null); setActiveOrgan(null); setFocusKeywords(null); setHighlighted(nodes) }}\n                  onEnableLayer={(l) => setLayers((prev) => (prev.has(l) ? prev : new Set(prev).add(l)))}\n                  onSetUnfold={setUnfold}\n                  onSetDissectionDepth={setDissect}\n                />`,
  `                <WholeBodyPrecisionLab\n                  onHighlight={(nodes) => { setActiveWorkout(null); setActiveOrgan(null); setHighlighted(nodes) }}\n                  onFocusRegion={(keywords) => { setActiveWorkout(null); setActiveOrgan(null); setFocusKeywords(keywords) }}\n                  onEnableLayer={(l) => setLayers((prev) => (prev.has(l) ? prev : new Set(prev).add(l)))}\n                  onSetUnfold={setUnfold}\n                  onSetDissectionDepth={setDissect}\n                  onOpenSurgical={() => setPanelTab('bedah')}\n                  onOpenMovement={() => setPanelTab('workout-sim')}\n                />`,
  'WholeBodyPrecision wiring',
)

body = body
  .replace('Driven by the simulator — the figure is beating at {simVitals.hr}/min and breathing at {simVitals.rr}/min.', 'Driven by the simulator — heart rate {simVitals.hr}/min and respiratory rate {simVitals.rr}/min. Source anatomy remains dimensionally stable.')
  .replace('Turn on Vessels &amp; Organs to see it move →', 'Turn on Vessels &amp; Organs to inspect the system →')
  .replace('The arteries pulse a fraction of a second AFTER the heart — the pulse wave travels at about 5 m/s, so\n              the ankle beats later than the chest. The gut squeezes as a travelling wave, not all at once.', 'Pulse-wave transit and peristaltic timing remain physiology teaching data. The source atlas is not scaled or deformed to simulate those processes.')

writeFileSync(bodyPath, body)

const precisionPath = 'src/pages/bodyhub/WholeBodyPrecisionLab.tsx'
let precision = readFileSync(precisionPath, 'utf8')

precision = replaceOnce(
  precision,
  `interface Props {\n  onHighlight?: (nodeHints: string[]) => void\n  onEnableLayer?: (layer: AtlasLayerKey) => void\n  onSetUnfold?: (amount: number) => void\n  onSetDissectionDepth?: (depth: number) => void\n}`,
  `interface Props {\n  onHighlight?: (nodeHints: string[]) => void\n  onFocusRegion?: (nodeHints: string[]) => void\n  onEnableLayer?: (layer: AtlasLayerKey) => void\n  onSetUnfold?: (amount: number) => void\n  onSetDissectionDepth?: (depth: number) => void\n  onOpenSurgical?: () => void\n  onOpenMovement?: () => void\n}`,
  'precision props',
)

precision = replaceOnce(
  precision,
  `function MiniBodyMap({ region }: { region: AtlasRegionKey }) {\n  const active = (key: AtlasRegionKey) => key === region\n  const cell = (key: AtlasRegionKey, label: string) => (\n    <div className={\`rounded-xl border px-2 py-2 text-center text-[10px] font-black transition ${'${'}active(key) ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20' : 'border-white/10 bg-white/5 text-neutral-400'}\`}>\n      {label}\n    </div>\n  )`,
  `function MiniBodyMap({ region, onSelect }: { region: AtlasRegionKey; onSelect: (key: AtlasRegionKey) => void }) {\n  const active = (key: AtlasRegionKey) => key === region\n  const cell = (key: AtlasRegionKey, label: string) => (\n    <button\n      type="button"\n      aria-pressed={active(key)}\n      onClick={() => onSelect(key)}\n      className={\`min-h-11 rounded-xl border px-2 py-2 text-center text-[10px] font-black transition ${'${'}active(key) ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20' : 'border-white/10 bg-white/5 text-neutral-400 hover:border-brand/50 hover:text-white'}\`}\n    >\n      {label}\n    </button>\n  )`,
  'interactive mini body map',
)

precision = precision.replace(
  '<p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Navigation scaffold only. Final agent pass should bind each region to camera presets, clipping volumes and exact mesh selections.</p>',
  '<p className="mt-3 text-[9px] leading-relaxed text-neutral-500">Select a region to reveal its represented layers and fit the shared 3D camera around matching source geometry.</p>',
)

precision = replaceOnce(
  precision,
  'export function WholeBodyPrecisionLab({ onHighlight, onEnableLayer, onSetUnfold, onSetDissectionDepth }: Props) {',
  'export function WholeBodyPrecisionLab({ onHighlight, onFocusRegion, onEnableLayer, onSetUnfold, onSetDissectionDepth, onOpenSurgical, onOpenMovement }: Props) {',
  'precision component signature',
)

precision = replaceOnce(
  precision,
  `    const hints = picked.structures.flatMap((structure) => structure.nodeHints)\n    onHighlight?.(hints)\n    for (const layer of new Set(picked.structures.map((structure) => structure.layer))) onEnableLayer?.(layer)`,
  `    const hints = [...new Set(picked.structures.flatMap((structure) => structure.nodeHints))]\n    onHighlight?.(hints)\n    onFocusRegion?.(hints)\n    for (const layer of new Set(picked.structures.map((structure) => structure.layer))) onEnableLayer?.(layer)`,
  'region focus wiring',
)

precision = precision
  .replace('Panacea · Whole-body precision atlas scaffold', 'Panacea · Whole-body precision atlas')
  .replace('Built as a production handoff for the next visual agent: the interaction model is explicit now, while final Blender-quality materials, region camera choreography, mesh cleanup and microanatomy overlays remain intentionally separable.', 'Use one shared anatomy viewer to move from whole-body orientation into represented regions, layers, surgical teaching and movement biomechanics while preserving geometry provenance.')
  .replace('<MiniBodyMap region={regionKey} />', '<MiniBodyMap region={regionKey} onSelect={chooseRegion} />')
  .replace('Final visual pass should preserve superior–inferior relationships and separate structures radially from the body axis.', 'Unfold preserves the source anatomy while separating represented structures radially for inspection.')
  .replace('Bind this to the existing Body3D depth model; absent fascial planes should be overlays, never invented anatomy meshes.', 'Dissection depth controls the shared Body3D layer model. Missing fascial geometry remains disclosed rather than fabricated.')

precision = replaceOnce(
  precision,
  `            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"><span className="font-black">Geometry contract: </span>{specialty.meshExpectation}</div>\n          </div>`,
  `            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"><span className="font-black">Geometry contract: </span>{specialty.meshExpectation}</div>\n            <button type="button" onClick={onOpenSurgical} className="mt-3 min-h-11 rounded-full border border-brand px-4 text-[11px] font-black text-brand transition hover:bg-brand hover:text-white">Open surgical layers →</button>\n          </div>`,
  'surgical deep link',
)

precision = replaceOnce(
  precision,
  `            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">This is explicitly an external-load teaching model, not patient-specific inverse dynamics or internal joint-contact-force estimation.</p>\n          </div>`,
  `            <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">This is explicitly an external-load teaching model, not patient-specific inverse dynamics or internal joint-contact-force estimation.</p>\n            <button type="button" onClick={onOpenMovement} className="mt-3 min-h-11 rounded-full border border-brand px-4 text-[11px] font-black text-brand transition hover:bg-brand hover:text-white">Open movement simulator →</button>\n          </div>`,
  'movement deep link',
)

writeFileSync(precisionPath, precision)

const testPath = 'scripts/uji/body-explorer-recovery.mts'
writeFileSync(testPath, `import assert from 'node:assert/strict'\nimport { readFileSync } from 'node:fs'\n\nconst body = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')\nconst precision = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')\n\nassert.match(body, /FeatureErrorBoundary/, 'Body Explorer must isolate heavy panel failures')\nassert.match(body, /onBack=\\{\\(\\) => setPanelTab\\('layers'\\)\\}/, 'recovery must return to stable layers panel')\nassert.match(body, /onFocusRegion=\\{\\(keywords\\).*setFocusKeywords\\(keywords\\)/s, 'precision atlas must drive shared Body3D focus')\nassert.match(body, /onOpenSurgical=\\{\\(\\) => setPanelTab\\('bedah'\\)\\}/)\nassert.match(body, /onOpenMovement=\\{\\(\\) => setPanelTab\\('workout-sim'\\)\\}/)\nassert.doesNotMatch(body, /figure is beating|see it move →|ankle beats later than the chest/, 'copy must not imply source meshes still deform')\n\nassert.match(precision, /MiniBodyMap\\(\\{ region, onSelect \\}/, 'mini navigator must accept real selection callback')\nassert.match(precision, /onClick=\\{\\(\\) => onSelect\\(key\\)\\}/, 'mini navigator regions must be interactive')\nassert.match(precision, /onFocusRegion\\?\\.\\(hints\\)/, 'region selection must focus the shared viewer')\nassert.match(precision, /Open surgical layers →/)\nassert.match(precision, /Open movement simulator →/)\nassert.doesNotMatch(precision, /scaffold|next visual agent|Final visual pass|Bind this to/i, 'user-facing internal handoff language must be removed')\n\nconsole.log('Body Explorer recovery boundary and Whole-Body Precision integration are wired')\n`)

console.log('Applied Body Explorer recovery + Whole-Body Precision integration patch')
