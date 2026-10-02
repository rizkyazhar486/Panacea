export interface RailViewportGeometry {
  viewportWidth: number
  scrollWidth: number
  itemLeft: number
  itemWidth: number
  currentScrollLeft: number
  edgePadding?: number
}

/**
 * Keep the active item visible in a horizontal rail without moving a rail that
 * already exposes it. When it is clipped, centre it and clamp to the legal
 * scroll range. Geometry is expressed in the rail's own scroll coordinates.
 */
export function hitungScrollAgarTerlihat({
  viewportWidth,
  scrollWidth,
  itemLeft,
  itemWidth,
  currentScrollLeft,
  edgePadding = 8,
}: RailViewportGeometry): number {
  const safeViewport = Math.max(0, viewportWidth)
  const maxScroll = Math.max(0, scrollWidth - safeViewport)
  const current = Math.min(maxScroll, Math.max(0, currentScrollLeft))
  const padding = Math.max(0, Math.min(edgePadding, safeViewport / 2))
  const visibleLeft = current + padding
  const visibleRight = current + safeViewport - padding
  const itemRight = itemLeft + itemWidth

  if (itemLeft >= visibleLeft && itemRight <= visibleRight) return current

  const centered = itemLeft - (safeViewport - itemWidth) / 2
  return Math.min(maxScroll, Math.max(0, centered))
}
