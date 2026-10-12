// D6: suavidade da emenda do loop WALK/RUN a partir dos quaterniões locais de cada osso (xyzw).
// Puro e determinístico. Reproduz a definição de bodyexposure/pipeline/check_gait_loop.py:
//   salto de ω na emenda = |ω_final − ω_inicial| (graus/s), com ω = 2·log(q₂·q₁⁻¹)/Δt,
//   e a escala de comparação é o salto de ω ENTRE intervalos consecutivos no interior do clipe.
// Emenda "tão suave quanto o interior" = salto na emenda ≤ máximo interior do mesmo osso.
// Isto mede continuidade de movimento; NÃO mede qualidade do gait nem deslizamento do pé.

export type Quat = readonly [number, number, number, number]

const norm = (q: Quat): Quat => { const n = Math.hypot(q[0], q[1], q[2], q[3]); return [q[0] / n, q[1] / n, q[2] / n, q[3] / n] }
const inv = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]]
function mul(a: Quat, b: Quat): Quat {
  const [x1, y1, z1, w1] = a, [x2, y2, z2, w2] = b
  return [x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2, y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2, z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2, w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2]
}
/** Rotação como vetor eixo-ângulo (rad), pelo caminho mais curto. */
function logVec(q0: Quat): [number, number, number] {
  let q = norm(q0)
  if (q[3] < 0) q = [-q[0], -q[1], -q[2], -q[3]]
  const s = Math.hypot(q[0], q[1], q[2])
  if (s < 1e-12) return [0, 0, 0]
  const ang = 2 * Math.atan2(s, q[3])
  return [q[0] / s * ang, q[1] / s * ang, q[2] / s * ang]
}
const omega = (a: Quat, b: Quat, dt: number): [number, number, number] => { const v = logVec(mul(b, inv(a))); return [v[0] / dt, v[1] / dt, v[2] / dt] }
const deg = (r: number) => r * 180 / Math.PI

export interface BoneLoop { seamDeg: number; omegaJumpDegS: number; interiorMaxDegS: number }

/** `times` crescentes (s), `quats` xyzw, ≥ 3 chaves. Entrada inválida → erro explícito, nunca um valor tentado. */
export function boneLoopSmoothness(times: readonly number[], quats: readonly Quat[]): BoneLoop {
  const n = times.length
  if (n < 3 || quats.length !== n) throw new Error('boneLoopSmoothness: need >=3 keys and one quaternion per key')
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(times[i]) || quats[i].length !== 4 || quats[i].some((x) => !Number.isFinite(x)) || Math.hypot(...quats[i]) < 1e-9) throw new Error(`boneLoopSmoothness: invalid key ${i}`)
    if (i > 0 && !(times[i] > times[i - 1])) throw new Error('boneLoopSmoothness: times must be strictly increasing')
  }
  const q = quats.map(norm)
  const seamDeg = deg(2 * Math.acos(Math.min(1, Math.abs(q[0][0] * q[n - 1][0] + q[0][1] * q[n - 1][1] + q[0][2] * q[n - 1][2] + q[0][3] * q[n - 1][3]))))
  const wEnd = omega(q[n - 2], q[n - 1], times[n - 1] - times[n - 2])
  const wStart = omega(q[0], q[1], times[1] - times[0])
  const omegaJumpDegS = deg(Math.hypot(wEnd[0] - wStart[0], wEnd[1] - wStart[1], wEnd[2] - wStart[2]))
  const w = Array.from({ length: n - 1 }, (_, i) => omega(q[i], q[i + 1], times[i + 1] - times[i]))
  let interiorMaxDegS = 0
  for (let i = 0; i < w.length - 1; i++) interiorMaxDegS = Math.max(interiorMaxDegS, deg(Math.hypot(w[i + 1][0] - w[i][0], w[i + 1][1] - w[i][1], w[i + 1][2] - w[i][2])))
  return { seamDeg, omegaJumpDegS, interiorMaxDegS }
}
