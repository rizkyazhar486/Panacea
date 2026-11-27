import { useState } from 'react'

// The landing hero's one visual: two renders of the SAME reference body from the Panaceamed 3D engine, taken from the
// same camera (muscle layer and skeleton layer). Dragging the divider reveals one beneath the other, so the page shows
// "see inside your body" with real geometry instead of an illustration, and without loading the 3D engine on a public
// page. Renders: public/landing/ (see CREDITS.txt there). Reference anatomy, not anyone's scan.

/** Reveal position, clamped to the image. Exported for the unit test. */
export function batasReveal(v: number): number {
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50
}

export function XRayBody() {
  const [pos, setPos] = useState(56)
  const p = batasReveal(pos)

  return (
    <figure data-pmd-unclamped="true" className="relative mx-auto w-full max-w-[420px] select-none" data-landing-xray="v1">
      <div className="relative">
      <div
        className="relative aspect-[640/1251] w-full"
        style={{
          // Fade the render's own backdrop into the section so no rectangle edge shows.
          WebkitMaskImage: 'radial-gradient(ellipse 62% 56% at 50% 50%, #000 70%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 62% 56% at 50% 50%, #000 70%, transparent 100%)',
        }}
      >
        <img
          src="/landing/body-skeleton.webp"
          alt="Rangka tubuh manusia dari model anatomi 3D"
          width={640}
          height={1251}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
        <img
          src="/landing/body-muscles.webp"
          alt="Otot tubuh manusia dari model anatomi 3D yang sama"
          width={640}
          height={1251}
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }}
        />
        {/* Divider: a hairline with a grip, purely visual; the range input below is the control. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-[6%]" style={{ left: `${p}%` }}>
          <div className="absolute inset-y-0 -left-px w-[2px] bg-gradient-to-b from-transparent via-cyan-300/90 to-transparent" />
          <div className="absolute left-0 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 shadow-[0_0_24px_rgba(34,211,238,.35)] backdrop-blur-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e6fbff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6-6 6 6 6" /><path d="m15 6 6 6-6 6" /></svg>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={p}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Geser untuk melihat lapisan otot dan tulang"
          aria-valuetext={`${p}% otot, ${100 - p}% tulang`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
        <span className="pointer-events-none absolute left-[8%] top-[3%] rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-rose-200 backdrop-blur">Otot</span>
        <span className="pointer-events-none absolute right-[8%] top-[3%] rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-amber-100 backdrop-blur">Tulang</span>
      </div>
      <figcaption className="mt-2 text-center text-[11px] leading-snug text-slate-400">
        Model anatomi referensi (Z-Anatomy / BodyParts3D, CC BY-SA 4.0) dari mesin 3D Panaceamed. Bukan pindaian tubuh Anda.
      </figcaption>
    </figure>
  )
}
