// Server real pada berkas data terpisah untuk uji HTTP otorisasi. Hanya fixture alur kerja; bukan persetujuan klinis.
// restart() menghentikan proses lalu menjalankan proses baru pada berkas data, rahasia sesi, dan direktori yang sama,
// sehingga token lama tetap sah dan hanya yang benar-benar tersimpan di berkas yang selamat.
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const serverRoot = fileURLToPath(new URL('../..', import.meta.url))

export interface CallResult { status: number; body: any }

function freePort(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const listener = createServer()
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', () => {
      const chosen = (listener.address() as { port: number }).port
      listener.close(error => error ? reject(error) : resolve(chosen))
    })
  })
}

export async function startIsolatedServer(prefix: string, ownerEmail: string) {
  const directory = mkdtempSync(join(tmpdir(), `panacea-${prefix}-`))
  const secret = randomBytes(32).toString('hex')
  const dataFile = join(directory, 'data.json')
  let child: ChildProcess
  let base = ''
  let failed = false
  let exited: Promise<void>

  const launch = async () => {
    const port = await freePort()
    failed = false
    child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: serverRoot, stdio: 'ignore', env: {
        ...process.env, NODE_ENV: 'development', PORT: String(port), JWT_SECRET: secret,
        ALLOW_DEV_LOGIN: 'true', OWNER_EMAIL: ownerEmail, COOKIE_SECURE: 'false',
        PANACEA_DATA_FILE: dataFile, PANACEA_ARCHIVE_DIR: join(directory, 'archive'), MONGODB_URI: '',
        GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', SMTP_HOST: '', SMTP_USER: '',
        VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', MIDTRANS_SERVER_KEY: '', MIDTRANS_CLIENT_KEY: '',
        IRIS_API_KEY: '', IRIS_CREATOR_KEY: '', ANTHROPIC_API_KEY: '', OPENROUTER_API_KEY: '',
        GENOMICS_WORKER_URL: '', WHO_ICD_CLIENT_ID: '', WHO_ICD_CLIENT_SECRET: '',
      },
    })
    const current = child
    exited = new Promise<void>(resolve => {
      current.once('exit', () => resolve())
      current.once('error', () => { failed = true; resolve() })
    })
    base = `http://127.0.0.1:${port}`
    let ready = false
    for (let i = 0; i < 120 && !ready; i++) {
      assert.ok(!failed && current.exitCode === null && current.signalCode === null, 'isolated server exited before readiness')
      try {
        const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })
        if (response.ok) {
          const health = await response.json() as { penyimpanan: string }
          assert.equal(health.penyimpanan, 'berkas', 'fixture must exercise explicit isolated file mode')
          ready = true
        }
      } catch (error) { if (error instanceof assert.AssertionError) throw error }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, 'isolated server must start')
  }

  const terminate = async () => {
    if (failed || child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    let timer: ReturnType<typeof setTimeout> | undefined
    try { await Promise.race([exited, new Promise<void>(resolve => { timer = setTimeout(resolve, 5000) })]) }
    finally { if (timer) clearTimeout(timer) }
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited }
  }

  const stop = async () => {
    try { await terminate() } finally { rmSync(directory, { recursive: true, force: true }) }
  }
  // mutate: mengubah isi berkas data selagi proses berhenti (mis. memundurkan tanggal berakhir), agar waktu dapat diatur tanpa jam palsu.
  const restart = async (mutate?: (data: any) => void) => {
    await terminate()
    if (mutate) {
      const data = JSON.parse(readFileSync(dataFile, 'utf8'))
      mutate(data)
      writeFileSync(dataFile, JSON.stringify(data))
    }
    await launch()
  }
  const call = async (method: string, path: string, token?: string, body?: unknown): Promise<CallResult> => {
    const response = await fetch(base + path, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(5000),
    })
    return { status: response.status, body: await response.json().catch(() => null) as any }
  }
  try {
    await launch()
    return { call, stop, restart, dataFile }
  } catch (error) { await stop(); throw error }
}
