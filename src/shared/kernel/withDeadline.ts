// Menolak janji yang tak selesai dalam `ms`, supaya kartu yang menunggu server (mis. Render cold start) tidak
// pernah menggantung di "Loading…". Pewaktu diinjeksikan agar bisa diuji tanpa waktu nyata.
export class DeadlineExceeded extends Error {
  constructor(readonly ms: number) { super(`No response within ${ms} ms`); this.name = 'DeadlineExceeded' }
}

export interface DeadlineTimers {
  set: (fn: () => void, ms: number) => unknown
  clear: (handle: unknown) => void
}

const REAL_TIMERS: DeadlineTimers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
}

export function withDeadline<T>(work: Promise<T>, ms: number, timers: DeadlineTimers = REAL_TIMERS): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return Promise.reject(new RangeError('Deadline must be a positive number of milliseconds'))
  return new Promise<T>((resolve, reject) => {
    const handle = timers.set(() => reject(new DeadlineExceeded(ms)), ms)
    work.then(
      (v) => { timers.clear(handle); resolve(v) },
      (e) => { timers.clear(handle); reject(e) },
    )
  })
}
