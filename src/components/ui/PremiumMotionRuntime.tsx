import { useEffect } from 'react'

/** Lightweight global motion runtime. CSS does the animation; this only feeds pointer light coordinates. */
export function PremiumMotionRuntime() {
  useEffect(() => {
    const root = document.documentElement
    let raf = 0
    let x = 50
    let y = 25
    const paint = () => {
      root.style.setProperty('--panacea-pointer-x', `${x}%`)
      root.style.setProperty('--panacea-pointer-y', `${y}%`)
      raf = 0
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      x = (event.clientX / window.innerWidth) * 100
      y = (event.clientY / window.innerHeight) * 100
      if (!raf) raf = requestAnimationFrame(paint)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return null
}

export default PremiumMotionRuntime
