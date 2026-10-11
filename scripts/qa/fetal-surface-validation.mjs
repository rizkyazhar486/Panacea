// Closed surface winding in a right-handed mesh frame. Engineering geometry only.
export function auditSurface(positions, indices) {
  if (positions.length < 12 || positions.length % 3 || indices.length < 12 || indices.length % 3
      || !Array.from(positions).every(Number.isFinite)) throw new Error('finite indexed triangle surface required')
  const count = positions.length / 3
  if (!Array.from(indices).every(i => Number.isInteger(i) && i >= 0 && i < count)) throw new Error('invalid surface indices')
  const key = i => Array.from(positions.slice(i * 3, i * 3 + 3)).join(',')
  const point = i => [0, 1, 2].map(axis => positions[i * 3 + axis] - positions[axis])
  const edges = new Map(); let volume6 = 0
  for (let i = 0; i < indices.length; i += 3) {
    const ids = Array.from(indices.slice(i, i + 3)), keys = ids.map(key)
    if (new Set(keys).size !== 3) throw new Error('degenerate triangle')
    const [a, b, c] = ids.map(point)
    const cross = [(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),
      (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),
      (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])]
    if (!cross.some(v => v !== 0)) throw new Error('degenerate triangle')
    volume6 += a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])
    for (let j = 0; j < 3; j++) {
      const from=keys[j], to=keys[(j+1)%3], edge=[from,to].sort().join('|')
      const row=edges.get(edge) ?? { count:0, balance:0 };row.count++;row.balance+=from<to?1:-1;edges.set(edge,row)
    }
  }
  if ([...edges.values()].some(e => e.count !== 2 || e.balance !== 0)) throw new Error('surface must be closed with consistent winding')
  const volume = volume6/6
  if (!Number.isFinite(volume) || volume <= 0) throw new Error('outward positive volume required')
  return { triangles: indices.length/3, signedVolume:volume, boundaryEdges:0, nonmanifoldEdges:0 }
}
