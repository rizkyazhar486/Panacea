import { useEffect, useRef, useState } from 'react'

/**
 * Becomes ready once the referenced element comes within `rootMargin` of the viewport, then stays ready.
 * Lets a page defer a below-the-fold lazy chunk until the reader actually scrolls towards it, so the
 * first load does not pay for it. Without IntersectionObserver (old browsers, tests) it is ready at once.
 */
export function useNearViewport<T extends HTMLElement = HTMLDivElement>(rootMargin = '900px 0px') {
  const ref = useRef<T>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setReady(true)
      observer.disconnect()
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ready, rootMargin])

  return { ref, ready }
}
