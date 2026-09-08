import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { publishAnatomySourceNodes } from './anatomySourceNodeRegistry'

let installed = false

function anatomyFileFromUrl(url: string) {
  const match = url.match(/(?:^|\/)anatomy\/([^/?#]+\.glb)(?:[?#]|$)/i)
  return match?.[1] ?? null
}

/**
 * Capture exact node names from the GLTF JSON before Body3D relies on the
 * sanitised Object3D names produced by GLTFLoader. The hook is intentionally
 * restricted to Panacea's /anatomy/*.glb requests and does not alter geometry,
 * materials, loading order, or the onLoad payload.
 */
export function installBody3dSourceNodeCapture() {
  if (installed) return
  installed = true

  const originalLoad = GLTFLoader.prototype.load
  GLTFLoader.prototype.load = function patchedAnatomyLoad(url, onLoad, onProgress, onError) {
    const file = anatomyFileFromUrl(url)
    if (!file) return originalLoad.call(this, url, onLoad, onProgress, onError)

    return originalLoad.call(
      this,
      url,
      (gltf) => {
        const rawNodes = gltf.parser.json.nodes as Array<{ name?: unknown }> | undefined
        const names = (rawNodes ?? [])
          .map((node) => node.name)
          .filter((name): name is string => typeof name === 'string' && Boolean(name.trim()))
          .filter((name) => !name.trim().startsWith('HOW TO'))
        publishAnatomySourceNodes(file, names)
        onLoad(gltf)
      },
      onProgress,
      onError,
    )
  }
}
