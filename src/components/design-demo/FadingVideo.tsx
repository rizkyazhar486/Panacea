import { useRef, useState, type CSSProperties } from 'react'

// Video latar yang memudar masuk saat siap dan memudar keluar sesaat
// sebelum berakhir, lalu berpindah ke sumber berikutnya (atau mengulang
// sumber yang sama) tanpa ada frame hitam/terpotong yang terlihat.
export function FadingVideo({
  src,
  className = '',
  style,
}: {
  src: string | string[]
  className?: string
  style?: CSSProperties
}) {
  const sources = Array.isArray(src) ? src : [src]
  const [index, setIndex] = useState(0)
  const [opacity, setOpacity] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fadingOutRef = useRef(false)

  function fadeTo(target: number, durationMs: number) {
    const start = performance.now()
    const from = target === 1 ? 0 : 1
    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      setOpacity(from + (target - from) * t)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  function handleLoadedData() {
    fadingOutRef.current = false
    fadeTo(1, 500)
  }

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v || fadingOutRef.current || !Number.isFinite(v.duration)) return
    const remaining = v.duration - v.currentTime
    if (remaining <= 0.55) {
      fadingOutRef.current = true
      fadeTo(0, 550)
    }
  }

  function handleEnded() {
    const v = videoRef.current
    if (!v) return
    if (sources.length === 1) {
      v.currentTime = 0
      v.play()
      fadingOutRef.current = false
      fadeTo(1, 500)
    } else {
      setIndex((i) => (i + 1) % sources.length)
    }
  }

  return (
    <video
      ref={videoRef}
      key={sources[index]}
      src={sources[index]}
      className={className}
      style={{ opacity, ...style }}
      autoPlay
      muted
      playsInline
      preload="auto"
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  )
}
