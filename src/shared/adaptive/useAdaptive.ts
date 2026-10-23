import { useState, useEffect } from 'react'

export interface AdaptiveViewport {
  /** Layar ponsel (< 768px) */
  isMobile: boolean
  /** Layar tablet (768px s.d. 1023px) */
  isTablet: boolean
  /** Layar laptop / desktop (≥ 1024px) */
  isDesktop: boolean
  /** Layar monitor lebar (≥ 1280px) */
  isWide: boolean
  /** Perangkat layar sentuh */
  hasTouch: boolean
  /** Lebar viewport dalam piksel */
  width: number
  /** Tinggi viewport dalam piksel */
  height: number
  /** Orientasi layar */
  orientation: 'portrait' | 'landscape'
}

function getViewportState(): AdaptiveViewport {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: true,
      hasTouch: false,
      width: 1280,
      height: 800,
      orientation: 'landscape',
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isWide: width >= 1280,
    hasTouch,
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
  }
}

/**
 * Hook pendeteksi adaptif breakpoint & kapabilitas perangkat secara real-time.
 * Digunakan untuk conditional rendering pola mobile-first vs desktop-first.
 */
export function useAdaptive(): AdaptiveViewport {
  const [viewport, setViewport] = useState<AdaptiveViewport>(getViewportState)

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportState())
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return viewport
}
