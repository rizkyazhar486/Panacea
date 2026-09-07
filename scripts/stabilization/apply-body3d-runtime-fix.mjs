import { readFile, writeFile } from 'node:fs/promises'

const path = new URL('../../src/components/Body3D.tsx', import.meta.url)
let source = await readFile(path, 'utf8')

function replaceOnce(label, search, replacement) {
  const first = source.indexOf(search)
  if (first < 0) throw new Error(`${label}: expected source pattern was not found`)
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`${label}: source pattern is not unique`)
  }
  source = source.slice(0, first) + replacement + source.slice(first + search.length)
}

replaceOnce(
  'remove obsolete peristalsis animation import',
  "import { SEBAR_PERISTALTIK } from '../lib/motionWave'\n",
  '',
)

replaceOnce(
  'mobile DPR budget',
  '    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))',
  "    const pixelRatioCap = window.matchMedia('(max-width: 640px)').matches ? 1.5 : 2\n    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap))",
)

replaceOnce(
  'WebGL restoration handler',
  "    renderer.domElement.addEventListener('webglcontextlost', onContextLost)\n\n    let raf = 0",
  "    renderer.domElement.addEventListener('webglcontextlost', onContextLost)\n    const onContextRestored = () => {\n      setFatal('')\n      startRendering()\n    }\n    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)\n\n    let raf = 0",
)

const animationBlock = /    let raf = 0\n    const jam = new THREE\.Clock\(\)\n    function animate\(\) \{[\s\S]*?    animate\(\)\n\n    return \(\) => \{\n      cancelAnimationFrame\(raf\)/
const animationMatches = source.match(animationBlock)
if (!animationMatches) throw new Error('animation loop: expected block was not found')

const replacement = `    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    // Source anatomy is evidence-bearing geometry. Do not resize the heart,
    // lungs, arteries, bowel, or muscles to imply physiology: repeated mesh
    // scaling makes real atlas structures look toy-like and changes anatomical
    // dimensions. Physiology belongs in overlays/flow/conduction/data layers.
    function renderFrame() {
      raf = 0
      if (!inViewport || !documentVisible) return
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(renderFrame)
    }

    function startRendering() {
      if (raf !== 0 || !inViewport || !documentVisible) return
      raf = requestAnimationFrame(renderFrame)
    }

    function stopRendering() {
      if (raf === 0) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    // Heavy WebGL work must stop when the viewer is not actually visible.
    // A small root margin restarts it just before the user scrolls back.
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry?.isIntersecting ?? true
        if (inViewport && documentVisible) startRendering()
        else stopRendering()
      },
      { rootMargin: '128px 0px', threshold: 0.01 },
    )
    visibilityObserver.observe(container)

    const onVisibilityChange = () => {
      documentVisible = !document.hidden
      if (documentVisible && inViewport) startRendering()
      else stopRendering()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    startRendering()

    return () => {
      stopRendering()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)`

source = source.replace(animationBlock, replacement)

replaceOnce(
  'WebGL restored cleanup',
  "      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)\n      controls.dispose()",
  "      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)\n      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)\n      controls.dispose()",
)

await writeFile(path, source)
console.log('Applied guarded Body3D stabilization patch.')
