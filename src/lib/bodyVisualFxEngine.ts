export type BodyFxFamily = 'glass' | 'spectral' | 'clinical' | 'microscopic' | 'cinematic' | 'flow' | 'neural' | 'surgical'

export interface BodyFxPreset {
  id: string
  label: string
  family: BodyFxFamily
  blur: number
  saturation: number
  contrast: number
  glow: number
  depth: number
  refraction: number
  grain: number
  motion: number
  palette: readonly [string, string, string]
  notes: string
}

const fx = (
  id: string,
  label: string,
  family: BodyFxFamily,
  blur: number,
  saturation: number,
  contrast: number,
  glow: number,
  depth: number,
  refraction: number,
  grain: number,
  motion: number,
  palette: readonly [string, string, string],
  notes: string,
): BodyFxPreset => ({ id, label, family, blur, saturation, contrast, glow, depth, refraction, grain, motion, palette, notes })

export const BODY_FX_PRESETS: readonly BodyFxPreset[] = [
  fx('medical-glass', 'Medical Glass', 'glass', 16, 1.6, 1.08, .34, .62, .28, .02, .22, ['#e9fbff', '#67e8f9', '#8b5cf6'], 'Calm premium translucent surface for primary learning UI.'),
  fx('liquid-prism', 'Liquid Prism', 'spectral', 22, 1.9, 1.12, .58, .78, .72, .03, .48, ['#67e8f9', '#8b5cf6', '#ec4899'], 'Chromatic rim and refractive highlight for experimental navigation.'),
  fx('deep-space', 'Deep Space', 'cinematic', 10, 1.35, 1.18, .44, .92, .16, .08, .18, ['#020617', '#0ea5e9', '#a78bfa'], 'Near-black scene with sparse luminous anatomy.'),
  fx('sterile-clinical', 'Sterile Clinical', 'clinical', 8, 1.05, 1.16, .16, .34, .06, .01, .08, ['#f8fafc', '#bae6fd', '#1e293b'], 'High legibility mode for information-heavy clinical surfaces.'),
  fx('vascular-pulse', 'Vascular Pulse', 'flow', 12, 1.55, 1.12, .68, .56, .12, .02, .74, ['#fb7185', '#f43f5e', '#67e8f9'], 'Pulsatile emissive treatment for blood-flow teaching scenes.'),
  fx('neural-electric', 'Neural Electric', 'neural', 14, 1.8, 1.14, .76, .68, .18, .02, .88, ['#67e8f9', '#c4b5fd', '#f0abfc'], 'Fast signal trails and node ignition for nervous-system scenes.'),
  fx('micro-fluorescence', 'Micro Fluorescence', 'microscopic', 18, 2.1, 1.2, .72, .48, .2, .06, .36, ['#22d3ee', '#a3e635', '#f472b6'], 'Stylized fluorescence microscopy look for cell-scale worlds.'),
  fx('warm-operating-room', 'Warm Operating Room', 'surgical', 10, 1.2, 1.15, .26, .52, .08, .03, .12, ['#fff7ed', '#fbbf24', '#fb7185'], 'Restrained warm highlight for synthetic surgical training scenes.'),
  fx('ghost-tissue', 'Ghost Tissue', 'glass', 20, 1.45, 1.06, .52, .84, .34, .02, .26, ['#ffffff', '#7dd3fc', '#c4b5fd'], 'Translucent context tissue with internal systems preserved.'),
  fx('spectral-edge', 'Spectral Edge', 'spectral', 14, 1.85, 1.18, .64, .76, .44, .04, .42, ['#22d3ee', '#8b5cf6', '#f472b6'], 'Thin rainbow edge lighting without filling whole surfaces in neon.'),
  fx('focus-tunnel', 'Focus Tunnel', 'cinematic', 18, 1.32, 1.24, .48, .9, .12, .05, .34, ['#020617', '#67e8f9', '#ffffff'], 'Dims unrelated anatomy while selected structures remain crisp.'),
  fx('holo-blueprint', 'Holographic Blueprint', 'clinical', 12, 1.5, 1.2, .5, .58, .16, .03, .3, ['#0f172a', '#38bdf8', '#e0f2fe'], 'Technical schematic surface with measured luminous edges.'),
  fx('plasma-flow', 'Plasma Flow', 'flow', 16, 1.72, 1.1, .7, .6, .22, .03, .7, ['#06b6d4', '#3b82f6', '#c084fc'], 'Directional animated energy suitable for perfusion and airflow abstractions.'),
  fx('axon-trail', 'Axon Trail', 'neural', 11, 1.65, 1.16, .82, .62, .08, .02, .94, ['#f8fafc', '#22d3ee', '#a78bfa'], 'High-speed node-to-node firing trail.'),
  fx('cell-membrane', 'Cell Membrane', 'microscopic', 19, 1.9, 1.08, .5, .7, .38, .04, .32, ['#a7f3d0', '#67e8f9', '#c4b5fd'], 'Soft refractive lipid-membrane inspired world.'),
  fx('histology-ink', 'Histology Ink', 'microscopic', 6, 1.38, 1.28, .12, .28, .02, .08, .08, ['#fdf2f8', '#c084fc', '#7c3aed'], 'Diagram-like tissue view with strong microstructure separation.'),
  fx('red-alert', 'Emergency Red Alert', 'clinical', 8, 1.22, 1.28, .56, .36, .02, .02, .62, ['#0b0b0f', '#fb7185', '#ffffff'], 'Focused urgency treatment for synthetic emergency scenarios.'),
  fx('quiet-rounds', 'Quiet Rounds', 'clinical', 14, 1.08, 1.1, .12, .3, .04, .01, .04, ['#020617', '#cbd5e1', '#67e8f9'], 'Low-distraction information mode.'),
  fx('cinema-gold', 'Cinema Gold', 'cinematic', 22, 1.36, 1.14, .44, .76, .32, .07, .2, ['#fff7ed', '#f59e0b', '#8b5cf6'], 'Warm halo paired with restrained violet depth for intros and recaps.'),
  fx('black-chrome', 'Black Chrome', 'spectral', 26, 1.3, 1.24, .62, .88, .56, .06, .24, ['#020202', '#e2e8f0', '#67e8f9'], 'Reflective near-black material for premium anatomy shells.'),
  fx('surgical-depth', 'Surgical Depth', 'surgical', 9, 1.18, 1.22, .24, .78, .05, .03, .14, ['#190b0b', '#fda4af', '#fef3c7'], 'Depth separation emphasizing planes rather than spectacle.'),
  fx('bloodless-training', 'Bloodless Training', 'surgical', 8, 1.08, 1.2, .14, .66, .04, .02, .1, ['#111827', '#f1f5f9', '#38bdf8'], 'Abstracted training palette when realistic tissue color would distract.'),
  fx('aurora-medical', 'Aurora Medical', 'spectral', 24, 1.75, 1.08, .54, .72, .46, .03, .36, ['#22d3ee', '#6366f1', '#ec4899'], 'Slow aurora gradient for environmental depth.'),
  fx('ultrasound-night', 'Ultrasound Night', 'clinical', 5, .9, 1.34, .04, .18, .01, .12, .04, ['#000000', '#94a3b8', '#f8fafc'], 'Monochrome diagnostic-style teaching surface.'),
  fx('xray-phosphor', 'X-Ray Phosphor', 'clinical', 7, .72, 1.38, .16, .22, .01, .06, .04, ['#020617', '#bae6fd', '#f8fafc'], 'Cool phosphor-style projection visualization.'),
  fx('mri-velvet', 'MRI Velvet', 'clinical', 8, .84, 1.3, .08, .34, .02, .05, .04, ['#000000', '#64748b', '#f8fafc'], 'Dark high-contrast tissue visualization for synthetic MR views.'),
  fx('organ-portal', 'Organ Portal', 'cinematic', 28, 1.6, 1.12, .66, .92, .62, .04, .56, ['#0f172a', '#67e8f9', '#f0abfc'], 'Deep portal transition from organ scale into tissue worlds.'),
  fx('gene-nebula', 'Gene Nebula', 'microscopic', 30, 1.8, 1.06, .5, .94, .52, .08, .28, ['#020617', '#8b5cf6', '#22d3ee'], 'Cosmic-scale molecular visualization for nonliteral gene exploration.'),
  fx('calm-rehab', 'Calm Rehabilitation', 'clinical', 14, 1.05, 1.08, .12, .36, .04, .01, .14, ['#082f49', '#67e8f9', '#d1fae5'], 'Gentle low-cognitive-load motion coaching surface.'),
  fx('performance-grid', 'Performance Grid', 'flow', 8, 1.22, 1.22, .26, .46, .02, .03, .44, ['#020617', '#22d3ee', '#a3e635'], 'Biomechanics grid with vectors and temporal traces.'),
] as const

export type BodyFxVars = Record<`--body-fx-${string}`, string>

export function bodyFxById(id: string) {
  return BODY_FX_PRESETS.find((preset) => preset.id === id) ?? BODY_FX_PRESETS[0]
}

export function bodyFxCssVars(presetOrId: BodyFxPreset | string, intensity = 1): BodyFxVars {
  const preset = typeof presetOrId === 'string' ? bodyFxById(presetOrId) : presetOrId
  const i = Math.max(0, Math.min(2, intensity))
  return {
    '--body-fx-blur': `${(preset.blur * i).toFixed(1)}px`,
    '--body-fx-saturation': `${(1 + (preset.saturation - 1) * i).toFixed(3)}`,
    '--body-fx-contrast': `${(1 + (preset.contrast - 1) * i).toFixed(3)}`,
    '--body-fx-glow': `${(preset.glow * i).toFixed(3)}`,
    '--body-fx-depth': `${(preset.depth * i).toFixed(3)}`,
    '--body-fx-refraction': `${(preset.refraction * i).toFixed(3)}`,
    '--body-fx-grain': `${(preset.grain * i).toFixed(3)}`,
    '--body-fx-motion': `${(preset.motion * i).toFixed(3)}`,
    '--body-fx-color-a': preset.palette[0],
    '--body-fx-color-b': preset.palette[1],
    '--body-fx-color-c': preset.palette[2],
  }
}

export function bodyFxFamilies() {
  return [...new Set(BODY_FX_PRESETS.map((preset) => preset.family))]
}

export function bodyFxFamilyPresets(family: BodyFxFamily) {
  return BODY_FX_PRESETS.filter((preset) => preset.family === family)
}

export function blendBodyFx(aId: string, bId: string, mix = .5) {
  const a = bodyFxById(aId)
  const b = bodyFxById(bId)
  const t = Math.max(0, Math.min(1, mix))
  const blend = (x: number, y: number) => x + (y - x) * t
  return {
    id: `${a.id}+${b.id}@${t.toFixed(2)}`,
    label: `${a.label} × ${b.label}`,
    family: t < .5 ? a.family : b.family,
    blur: blend(a.blur, b.blur),
    saturation: blend(a.saturation, b.saturation),
    contrast: blend(a.contrast, b.contrast),
    glow: blend(a.glow, b.glow),
    depth: blend(a.depth, b.depth),
    refraction: blend(a.refraction, b.refraction),
    grain: blend(a.grain, b.grain),
    motion: blend(a.motion, b.motion),
    palette: t < .5 ? a.palette : b.palette,
    notes: `Procedural blend of ${a.label} and ${b.label}.`,
  } satisfies BodyFxPreset
}
