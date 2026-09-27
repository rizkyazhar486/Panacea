import { arahSinkron } from './labSyncArah'

export type LabSyncStatus = 'lokal' | 'menyinkron' | 'tersinkron' | 'gagal'
export type LabSyncLog = Record<string, { id: string; tanggal: string; nilai: number; rujukanBawah?: number; rujukanAtas?: number }[]>
export interface LabServerSnapshot { log: LabSyncLog; diperbaruiPada: string | null }

/** Private scope only: never emit this value in logs or diagnostics. */
export function labSessionScope(read: (key: string) => string | null, now = Date.now()): string | null {
  try {
    const raw = read('panaceamed.session.v1')
    if (!raw) return null
    const value = JSON.parse(raw)
    if (typeof value?.account?.email !== 'string' || !value.account.email.trim()
      || !Number.isFinite(value.loginAt) || value.loginAt > now || now - value.loginAt > 7 * 86400000) return null
    return JSON.stringify([raw, read('pmd-token')])
  } catch { return null }
}

interface Dependencies {
  enabled: boolean
  session: () => string | null
  getServer: () => Promise<LabServerSnapshot>
  putServer: (log: LabSyncLog, timestamp: string) => Promise<unknown>
  getLocal: () => LabSyncLog
  getLocalTimestamp: () => string | null
  applyServer: (log: LabSyncLog, timestamp: string) => void
  getStatus: () => LabSyncStatus
  setStatus: (status: LabSyncStatus) => void
  now: () => string
}

/** Each asynchronous continuation belongs to both its starting session and run. */
export function createLabSyncRunner(d: Dependencies): () => Promise<LabSyncStatus> {
  let latestRun = 0
  return async () => {
    const run = ++latestRun
    const session = d.session()
    if (!d.enabled || session === null) { d.setStatus('lokal'); return d.getStatus() }
    const current = () => {
      if (run !== latestRun) return false
      if (d.session() !== session) { d.setStatus('lokal'); return false }
      return true
    }
    d.setStatus('menyinkron')
    try {
      const server = await d.getServer()
      if (!current()) return d.getStatus()
      const local = d.getLocal()
      const direction = arahSinkron(d.getLocalTimestamp(), server.diperbaruiPada, Object.keys(local).length > 0)
      if (direction === 'tarik' && server.diperbaruiPada) d.applyServer(server.log, server.diperbaruiPada)
      if (direction === 'dorong') {
        const timestamp = d.getLocalTimestamp() ?? d.now()
        try { await d.putServer(local, timestamp) } catch (e) {
          if (!current()) return d.getStatus()
          if (!/409/.test(String((e as Error).message))) throw e
          const retry = await d.getServer()
          if (!current()) return d.getStatus()
          if (retry.diperbaruiPada) d.applyServer(retry.log, retry.diperbaruiPada)
        }
      }
      if (current()) d.setStatus('tersinkron')
    } catch (e) {
      if (current()) d.setStatus(/unauthorized|401/i.test(String((e as Error).message)) ? 'lokal' : 'gagal')
    }
    return d.getStatus()
  }
}
