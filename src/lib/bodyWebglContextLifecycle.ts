export interface BodyWebglContextLifecycleOptions {
  onLost: () => void
  onRestored: () => void
}

export interface BodyWebglContextLossEvent {
  preventDefault: () => void
}

/**
 * Owns the WebGL context-loss state independently of Three.js resources.
 * Calling preventDefault opts into the browser's context restoration path.
 */
export function createBodyWebglContextLifecycle(options: BodyWebglContextLifecycleOptions) {
  let lost = false
  let disposed = false

  const handleLost = (event: BodyWebglContextLossEvent) => {
    event.preventDefault()
    if (disposed || lost) return
    lost = true
    options.onLost()
  }

  const handleRestored = () => {
    if (disposed || !lost) return
    lost = false
    options.onRestored()
  }

  const dispose = () => {
    disposed = true
  }

  return {
    handleLost,
    handleRestored,
    dispose,
    isLost: () => lost,
  }
}
