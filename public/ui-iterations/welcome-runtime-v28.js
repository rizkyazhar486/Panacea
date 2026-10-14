/* Panacea Welcome runtime v28
   Lightweight media scheduler for the unauthenticated Landing only.
   - leaves React/history VideoSaatTerlihat behavior intact
   - keeps one Higgsfield hero film on capable devices
   - never downloads hidden Remotion demo media
   - defers all other autoplay films until near viewport
   - suppresses decorative autoplay on low-memory / Save-Data / reduced-motion
*/
(() => {
  const lowMemory = Boolean(window.__PANACEA_LOW_MEMORY__)
    || Boolean(navigator.connection && navigator.connection.saveData)
    || Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  let mediaObserver = null
  let bootObserver = null
  let tuned = false

  const parkVideo = (video, permanent = false) => {
    try { video.pause() } catch {}
    video.autoplay = false
    video.removeAttribute('autoplay')
    video.preload = 'none'
    const src = video.getAttribute('src')
    if (src && !video.dataset.pmdDeferredSrc) video.dataset.pmdDeferredSrc = src
    if (src) {
      video.removeAttribute('src')
      try { video.load() } catch {}
    }
    if (permanent) video.dataset.pmdNoAutoplay = 'true'
  }

  const restoreVideo = (video) => {
    if (video.dataset.pmdNoAutoplay === 'true') return
    const src = video.dataset.pmdDeferredSrc
    if (src && !video.getAttribute('src')) {
      video.setAttribute('src', src)
      video.preload = 'metadata'
      try { video.load() } catch {}
    }
    void video.play().catch(() => {})
  }

  const tuneLanding = () => {
    if (tuned) return true
    const scrim = document.querySelector('.hero-video-scrim')
    if (!scrim) return false
    tuned = true

    const heroSection = scrim.closest('section')
    const heroVideo = heroSection ? heroSection.querySelector('video') : null

    mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target
        if (!(video instanceof HTMLVideoElement)) return
        if (entry.isIntersecting && !lowMemory) restoreVideo(video)
        else {
          try { video.pause() } catch {}
        }
      })
    }, { rootMargin: '160px 0px', threshold: 0.12 })

    document.querySelectorAll('video').forEach((video) => {
      const src = video.getAttribute('src') || ''
      const isRemotionDemo = src.includes('media/brand-intro.mp4')
      const isReactVisibilityVideo = !video.autoplay && video.getAttribute('preload') === 'none'

      // Existing history cards already own their IntersectionObserver.
      if (isReactVisibilityVideo) return

      // The code-demo tile is deliberately not part of the refreshed Welcome.
      if (isRemotionDemo) {
        parkVideo(video, true)
        return
      }

      if (video === heroVideo) {
        video.preload = lowMemory ? 'none' : 'metadata'
        if (lowMemory) parkVideo(video, true)
        return
      }

      // All other autoplay films (featured Higgsfield, history timeline, etc.)
      // become on-demand instead of competing during first paint.
      if (video.autoplay || video.hasAttribute('autoplay')) {
        parkVideo(video)
        mediaObserver.observe(video)
      }
    })

    return true
  }

  if (!tuneLanding()) {
    bootObserver = new MutationObserver(() => {
      if (tuneLanding()) {
        bootObserver.disconnect()
        bootObserver = null
      }
    })
    bootObserver.observe(document.documentElement, { childList: true, subtree: true })
    window.setTimeout(() => {
      if (bootObserver) {
        bootObserver.disconnect()
        bootObserver = null
      }
    }, 12000)
  }
})()
