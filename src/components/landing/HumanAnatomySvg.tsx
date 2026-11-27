import React from 'react'

/**
 * UHD Z-Anatomy Multiscale Longitudinal Specimen Frame.
 * Replaces hand-drawn SVG organ doodles with baked WebGL studio anatomy (Z-Anatomy, CC BY-SA 4.0).
 */
export function HumanAnatomy() {
  return (
    <figure className="dark relative h-full w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#060A09] text-white">
      <img
        src="/landing/multiscale-systems-uhd.webp"
        alt="Visualisasi anatomi 3D multisistem Z-Anatomy — kardiovaskular, viseral, limfatik, dan saraf"
        width={1600}
        height={1000}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060A09] via-transparent to-transparent opacity-80"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 py-3 text-[11px] text-neutral-300">
        <span className="font-semibold text-white">Multiscale Human Twin</span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
          Z-Anatomy 3D · CC BY-SA 4.0
        </span>
      </figcaption>
    </figure>
  )
}
