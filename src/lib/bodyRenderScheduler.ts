export interface BodyRenderSchedulerOptions {
  canRender: () => boolean
  renderFrame: () => void
  requestFrame: (callback: () => void) => number
  cancelFrame: (frameId: number) => void
}

export interface BodyRenderScheduler {
  request: () => void
  stop: () => void
  dispose: () => void
  hasPendingFrame: () => boolean
}

/**
 * Coalesces renderer invalidations into a single animation frame.
 *
 * It deliberately has no self-sustaining loop: OrbitControls, resize, asset
 * loading, selection and visibility changes request the next frame only when
 * state actually changes. This keeps an idle atlas at zero scheduled frames.
 */
export function createBodyRenderScheduler(options: BodyRenderSchedulerOptions): BodyRenderScheduler {
  let pendingFrame: number | null = null
  let disposed = false

  const stop = () => {
    if (pendingFrame === null) return
    options.cancelFrame(pendingFrame)
    pendingFrame = null
  }

  const request = () => {
    if (disposed || pendingFrame !== null || !options.canRender()) return
    pendingFrame = options.requestFrame(() => {
      pendingFrame = null
      if (disposed || !options.canRender()) return
      options.renderFrame()
    })
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    stop()
  }

  return {
    request,
    stop,
    dispose,
    hasPendingFrame: () => pendingFrame !== null,
  }
}
