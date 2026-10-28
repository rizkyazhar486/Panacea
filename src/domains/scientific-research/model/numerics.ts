export type Vector = readonly number[]
export type Field = (t: number, state: Vector) => Vector
export interface Sample { t: number; state: number[] }
export interface Integration {
  initial: Vector
  start: number
  end: number
  step: number
  drift: Field
}

function finiteVector(value: Vector, size: number): void {
  if (!Array.isArray(value) || value.length !== size || !value.every(Number.isFinite)) {
    throw new RangeError('NONFINITE_OR_MISMATCHED_VECTOR')
  }
}

function schedule(options: Integration): number {
  const { start, end, step, initial } = options
  if (![start, end, step].every(Number.isFinite) || end <= start || step <= 0) {
    throw new RangeError('INVALID_INTEGRATION_INTERVAL')
  }
  if (!Array.isArray(initial) || initial.length < 1 || initial.length > 64) throw new RangeError('DIMENSION_BUDGET')
  finiteVector(initial, initial.length)
  const count = Math.ceil((end - start) / step)
  if (!Number.isSafeInteger(count) || count > 10_000) throw new RangeError('STEP_BUDGET')
  return count
}

function evaluate(field: Field, t: number, state: Vector): Vector {
  finiteVector(state, state.length)
  const result = field(t, Object.freeze([...state]))
  finiteVector(result, state.length)
  return result
}

// Solver menolak divergensi; tidak menjepit nilai agar hasil terlihat sah.
export function rk4(options: Integration): Sample[] {
  const count = schedule(options)
  const { start, end, step, drift } = options
  const samples: Sample[] = [{ t: start, state: [...options.initial] }]
  for (let i = 0; i < count; i++) {
    const { t, state: x } = samples[i]
    const next = i === count - 1 ? end : Math.min(end, start + (i + 1) * step)
    const h = next - t
    if (h <= 0) throw new RangeError('TIME_RESOLUTION')
    const k1 = evaluate(drift, t, x)
    const k2 = evaluate(drift, t + h / 2, x.map((v, j) => v + h * k1[j] / 2))
    const k3 = evaluate(drift, t + h / 2, x.map((v, j) => v + h * k2[j] / 2))
    const k4 = evaluate(drift, next, x.map((v, j) => v + h * k3[j]))
    const state = x.map((v, j) => v + h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6)
    finiteVector(state, x.length)
    samples.push({ t: next, state })
  }
  return samples
}

// Euler–Maruyama diagonal adalah kapabilitas matematika terpisah, bukan model pasien.
export function seededEulerMaruyama(options: Integration & { diffusion: Field; seed: number }): Sample[] {
  const count = schedule(options)
  if (!Number.isInteger(options.seed) || options.seed < 0 || options.seed > 0xffff_ffff) throw new RangeError('INVALID_SEED')
  let seed = options.seed
  const uniform = () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform())
  const samples: Sample[] = [{ t: options.start, state: [...options.initial] }]
  for (let i = 0; i < count; i++) {
    const { t, state: x } = samples[i]
    const next = i === count - 1 ? options.end : Math.min(options.end, options.start + (i + 1) * options.step)
    const h = next - t
    if (h <= 0) throw new RangeError('TIME_RESOLUTION')
    const drift = evaluate(options.drift, t, x)
    const diffusion = evaluate(options.diffusion, t, x)
    const state = x.map((v, j) => v + h * drift[j] + Math.sqrt(h) * diffusion[j] * normal())
    finiteVector(state, x.length)
    samples.push({ t: next, state })
  }
  return samples
}
