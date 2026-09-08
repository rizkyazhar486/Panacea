import { readFile, writeFile } from 'node:fs/promises'

const path = 'src/pages/BodyExplorer.tsx'
let source = await readFile(path, 'utf8')

const before = `                <SurgicalLab
                  onKedalaman={setDissect}
                  onSorot={(nama) => { setActiveWorkout(null); setActiveOrgan(null); setFocusKeywords(null); setHighlighted(nama) }}
                />`

const after = `                <SurgicalLab
                  onKedalaman={setDissect}
                  onSorot={(nama) => { setActiveWorkout(null); setActiveOrgan(null); setFocusKeywords(null); setHighlighted(nama) }}
                  onSharedView={(view) => {
                    setRenderMode(view.renderMode)
                    setSlicePlane(view.slicePlane)
                    setSlicePos(view.slicePos)
                    setUnfold(view.unfold)
                  }}
                />`

const count = source.split(before).length - 1
if (count !== 1) throw new Error(`Expected exactly one SurgicalLab bridge anchor, found ${count}`)
source = source.replace(before, after)

if (!source.includes('setRenderMode(view.renderMode)')) throw new Error('Surgery render-mode bridge missing after patch')
if (!source.includes('setSlicePlane(view.slicePlane)')) throw new Error('Surgery slice-plane bridge missing after patch')
if (!source.includes('setUnfold(view.unfold)')) throw new Error('Surgery unfold bridge missing after patch')

await writeFile(path, source)
console.log('Applied guarded SurgerySimulatorLab → shared Body3D view bridge.')
