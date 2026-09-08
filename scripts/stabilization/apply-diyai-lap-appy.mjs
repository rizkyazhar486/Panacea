import { readFile, writeFile } from 'node:fs/promises'

async function edit(path, transform) {
  const before = await readFile(path, 'utf8')
  const after = transform(before)
  if (after === before) throw new Error(`Guarded patch made no change: ${path}`)
  await writeFile(path, after)
  console.log(`patched ${path}`)
}

await edit('src/lib/surgerySimulatorAppendectomy.ts', (source) => {
  const incorrect = 'BodyParts3D 4.0 / DBCLS, CC BY 4.0; Mitsuhashi et al. Database (Oxford) 2009; doi:10.1093/database/bap012 / atlas packaging provenance recorded in public/atlas/CREDITS.txt'
  const corrected = 'BodyParts3D 4.0 / DBCLS, CC BY 4.0; Mitsuhashi et al. (2009), doi:10.1093/nar/gkn613; atlas packaging provenance recorded in public/atlas/CREDITS.txt'
  if (!source.includes(incorrect)) throw new Error('Unexpected BodyParts3D citation draft state')
  return source.replace(incorrect, corrected)
})

await edit('src/lib/surgerySimulator.ts', (source) => {
  const typeAnchor = "export type SurgeryAtlasId = 'obgin' | 'cardio'"
  const arrayAnchor = 'export const SURGERY_SIMULATION_SCENARIOS: SurgerySimulationScenario[] = [\n'
  if (!source.includes(typeAnchor)) throw new Error('SurgeryAtlasId anchor not found')
  if (!source.includes(arrayAnchor)) throw new Error('Scenario array anchor not found')
  if (source.includes('LAP_APPENDIX_SCENARIO')) throw new Error('Lap Appy scenario already wired')
  source = `import { LAP_APPENDIX_SCENARIO } from './surgerySimulatorAppendectomy'\n\n${source}`
  source = source.replace(typeAnchor, "export type SurgeryAtlasId = 'obgin' | 'cardio' | 'gastro'")
  source = source.replace(arrayAnchor, `${arrayAnchor}  LAP_APPENDIX_SCENARIO,\n`)
  return source
})

await edit('src/pages/bodyhub/SurgerySimulatorLab.tsx', (source) => {
  const title = '<div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">Panacea Surgical Simulation</div>\n            <h3 className="mt-1 text-lg font-black">Verified anatomy first. Procedure logic second.</h3>'
  const replacement = '<div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">Panacea Surgical Simulation · Do It Yourself with AI #DIYAI</div>\n            <h3 className="mt-1 text-lg font-black">Source-grounded anatomy first. Human review status visible.</h3>'
  if (!source.includes(title)) throw new Error('Surgery simulator title anchor not found')
  source = source.replace(title, replacement)

  const grid = '            <span>Use</span><b className="text-neutral-300">Education</b>\n'
  const gridReplacement = `${grid}            <span>AI content</span><b className="text-neutral-300">AI-assisted · disclosed</b>\n            <span>Academic review</span><b className="text-amber-300">Human review pending</b>\n`
  if (!source.includes(grid)) throw new Error('Academic status grid anchor not found')
  source = source.replace(grid, gridReplacement)

  const chips = '        <div className="mt-3 flex flex-wrap gap-1.5">\n          {SURGERY_SIMULATION_SCENARIOS.map((item) => ('
  const chipsReplacement = '        <div className="mt-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2 text-[9px] leading-relaxed text-amber-100/70">\n          Academic gate: source citations and named geometry do not equal human academic review. Until a qualified anatomy/surgical reviewer is recorded with credentials, date and scope, this simulator remains explicitly <b className="text-amber-200">not academically reviewed</b>.\n        </div>\n\n        <div className="mt-3 flex flex-wrap gap-1.5">\n          {SURGERY_SIMULATION_SCENARIOS.map((item) => ('
  if (!source.includes(chips)) throw new Error('Scenario chip anchor not found')
  source = source.replace(chips, chipsReplacement)
  return source
})

await edit('scripts/uji/surgerySimulator.mts', (source) => {
  const dataAnchor = "const data = readFileSync('src/lib/surgerySimulator.ts', 'utf8')\n"
  if (!source.includes(dataAnchor)) throw new Error('Surgery test data anchor not found')
  source = source.replace(dataAnchor, `${dataAnchor}const lapAppy = readFileSync('src/lib/surgerySimulatorAppendectomy.ts', 'utf8')\n`)

  const uiAnchor = "assert.match(ui, /data-surgery-simulator=\"anatomy-grounded\"/, 'Simulator root marker is required')\n"
  if (!source.includes(uiAnchor)) throw new Error('Surgery UI test anchor not found')
  const lapAssertions = `assert.match(data, /SurgeryAtlasId = 'obgin' \\| 'cardio' \\| 'gastro'/, 'Gastro atlas must be an explicit supported surgical source')\nassert.match(data, /LAP_APPENDIX_SCENARIO/, 'DIYAI Lap Appy scenario must be wired into the simulator')\nassert.match(lapAppy, /id: 'diyai-laparoscopic-appendectomy'/, 'DIYAI laparoscopic appendectomy scenario is required')\nassert.match(lapAppy, /atlasFile: 'atlas\\/gastro\\.glb'/, 'Lap Appy must use the existing gastro reference atlas')\nassert.match(lapAppy, /BodyParts3D 4\\.0 \\/ DBCLS/, 'Lap Appy geometry provenance must stay explicit')\nassert.match(lapAppy, /10\\.1093\\/nar\\/gkn613/, 'BodyParts3D publication DOI must match repository atlas provenance')\nassert.doesNotMatch(lapAppy, /10\\.1093\\/database\\/bap012|Database \\(Oxford\\)/, 'Unverified BodyParts3D citation text must not return')\nassert.match(lapAppy, /PMID:39720866/, 'Appendix variation systematic review must remain pinned')\nassert.match(lapAppy, /retrocecal, pelvic, retro-ileal, pre-ileal/, 'Lap Appy must teach positional variation rather than a universal mesh')\nassert.match(lapAppy, /three taeniae coli converge at the appendiceal base/, 'Evidence-grounded appendiceal base landmark is required')\nassert.match(lapAppy, /Human academic review is currently pending/, 'Human academic review status must remain explicit')\nassert.match(lapAppy, /AI-assisted educational draft/, 'AI generation must be disclosed')\nassert.doesNotMatch(lapAppy, /trocar.{0,30}(?:mm|cm)|insufflat.{0,30}mmHg|stapler.{0,30}(?:mm|load)|energy.{0,20}(?:watt|\\bW\\b)|force.{0,20}\\bN\\b/i, 'DIYAI Lap Appy must not encode operative device settings or force')\n\n`
  source = source.replace(uiAnchor, `${lapAssertions}${uiAnchor}`)

  const patientAnchor = "assert.match(ui, /Patient data<\\/span><b className=\"text-neutral-300\">None/, 'Simulator must not imply patient-specific data')\n"
  if (!source.includes(patientAnchor)) throw new Error('Patient-data test anchor not found')
  source = source.replace(patientAnchor, `${patientAnchor}assert.match(ui, /Do It Yourself with AI #DIYAI/, 'DIYAI identity must be visible in the simulator')\nassert.match(ui, /AI-assisted · disclosed/, 'AI-assisted content must be disclosed')\nassert.match(ui, /Human review pending/, 'Human academic-review status must be visible')\nassert.match(ui, /not academically reviewed/, 'UI must fail closed instead of implying unrecorded expert review')\n`)
  return source
})

await edit('scripts/qa/surgery-simulator-mobile-smoke.mjs', (source) => {
  const metricAnchor = '  iceLongAxisVisible: false,\n'
  if (!source.includes(metricAnchor)) throw new Error('Surgery smoke metrics anchor not found')
  source = source.replace(metricAnchor, `${metricAnchor}  lapAppyLoaded: false,\n  lapAppyVariationVisible: false,\n  academicGateVisible: false,\n`)

  const flowAnchor = '  metrics.iceLongAxisVisible = true\n\n  await atlasCanvas.scrollIntoViewIfNeeded()\n'
  if (!source.includes(flowAnchor)) throw new Error('Surgery smoke flow anchor not found')
  const flow = `  metrics.iceLongAxisVisible = true\n\n  await simulator.getByRole('button', { name: 'DIYAI Lap Appy', exact: true }).click()\n  await simulator.getByText('DIYAI · Laparoscopic appendectomy anatomy simulation', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })\n  await atlasCanvas.waitFor({ state: 'visible', timeout: 60_000 })\n  await page.waitForTimeout(700)\n  if (await loadFailure.isVisible().catch(() => false)) throw new Error(\`DIYAI Lap Appy atlas failure: \${await loadFailure.innerText()}\`)\n  metrics.lapAppyLoaded = true\n\n  const variationStep = simulator.getByText('Position variation check', { exact: true }).first()\n  await variationStep.scrollIntoViewIfNeeded()\n  await variationStep.click()\n  await simulator.getByText(/retrocecal, pelvic, retro-ileal, pre-ileal/i).waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.lapAppyVariationVisible = true\n\n  await simulator.getByText('Human review pending', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 })\n  await simulator.getByText(/not academically reviewed/i).waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.academicGateVisible = true\n\n  await atlasCanvas.scrollIntoViewIfNeeded()\n`
  source = source.replace(flowAnchor, flow)
  return source
})

console.log('DIYAI Lap Appy academic + UI + deterministic + mobile integration patch applied.')
