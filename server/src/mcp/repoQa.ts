import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { isAbsolute, relative, resolve } from 'node:path'

export type QaProfileName =
  | 'server_typecheck'
  | 'mcp_targeted_tests'
  | 'root_validators'
  | 'root_build'
  | 'server_full_tests'

export class RepoQaError extends Error {
  readonly code: 'qa_profile_not_allowed' | 'invalid_input'

  constructor(code: 'qa_profile_not_allowed' | 'invalid_input', message: string) {
    super(message)
    this.name = 'RepoQaError'
    this.code = code
  }
}

export interface QaCommandStep {
  executable: 'npm'
  args: string[]
  cwd: string
  shell: false
}

export interface QaInvocation {
  profile: QaProfileName
  steps: QaCommandStep[]
  timeoutMs: number
  maxOutputBytes: number
}

export interface QaOutputCap {
  text: string
  truncated: boolean
}

export interface QaStepResult {
  executable: string
  args: string[]
  cwd: string
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  stdout: string
  stderr: string
  stdoutTruncated: boolean
  stderrTruncated: boolean
  durationMs: number
  error?: string
}

export interface QaRunResult {
  profile: QaProfileName
  ok: boolean
  steps: QaStepResult[]
}

const PROFILE_NAMES = new Set<QaProfileName>([
  'server_typecheck',
  'mcp_targeted_tests',
  'root_validators',
  'root_build',
  'server_full_tests',
])

const SAFE_ENV_KEYS = [
  'PATH',
  'HOME',
  'USERPROFILE',
  'TMP',
  'TEMP',
  'TMPDIR',
  'CI',
  'GITHUB_ACTIONS',
  'RUNNER_OS',
  'NODE_ENV',
  'FORCE_COLOR',
  'NO_COLOR',
  'TERM',
  'LANG',
  'LC_ALL',
  'TZ',
  'npm_config_cache',
  'NPM_CONFIG_CACHE',
  'SystemRoot',
  'SYSTEMROOT',
  'ComSpec',
  'COMSPEC',
  'PATHEXT',
  'WINDIR',
] as const

function isProfileName(value: string): value is QaProfileName {
  return PROFILE_NAMES.has(value as QaProfileName)
}

function containedPath(root: string, child: string): string {
  const rel = relative(root, child)
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return child
  throw new RepoQaError('invalid_input', 'QA working directory escaped repository root')
}

function step(root: string, cwd: string, args: string[]): QaCommandStep {
  return {
    executable: 'npm',
    args,
    cwd: containedPath(root, cwd),
    shell: false,
  }
}

export function buildQaInvocation(profile: QaProfileName, repoRoot: string): QaInvocation {
  if (!isProfileName(profile as string)) {
    throw new RepoQaError('qa_profile_not_allowed', `Unknown QA profile: ${String(profile)}`)
  }
  if (!isAbsolute(repoRoot)) {
    throw new RepoQaError('invalid_input', 'repoRoot must be an absolute path')
  }

  const root = resolve(repoRoot)
  const server = containedPath(root, resolve(root, 'server'))

  switch (profile) {
    case 'server_typecheck':
      return { profile, steps: [step(root, server, ['run', 'typecheck'])], timeoutMs: 120_000, maxOutputBytes: 128 * 1024 }
    case 'mcp_targeted_tests':
      return { profile, steps: [step(root, server, ['run', 'uji:mcp'])], timeoutMs: 120_000, maxOutputBytes: 128 * 1024 }
    case 'root_validators':
      return {
        profile,
        steps: [
          step(root, root, ['run', 'validate:source-registry']),
          step(root, root, ['run', 'validate:feature-factory']),
          step(root, root, ['run', 'validate:academic-review']),
        ],
        timeoutMs: 180_000,
        maxOutputBytes: 192 * 1024,
      }
    case 'root_build':
      return { profile, steps: [step(root, root, ['run', 'build'])], timeoutMs: 600_000, maxOutputBytes: 512 * 1024 }
    case 'server_full_tests':
      return { profile, steps: [step(root, server, ['run', 'uji'])], timeoutMs: 900_000, maxOutputBytes: 512 * 1024 }
  }
}

export function buildQaEnvironment(
  source: Record<string, string | undefined> = process.env,
): NodeJS.ProcessEnv {
  const output: NodeJS.ProcessEnv = {}
  for (const key of SAFE_ENV_KEYS) {
    const value = source[key]
    if (typeof value === 'string' && value.length > 0) output[key] = value
  }
  return output
}

export function capQaOutput(current: string, chunk: string, maxBytes: number): QaOutputCap {
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new RepoQaError('invalid_input', 'maxBytes must be a positive integer')
  }
  const combined = Buffer.from(current + chunk, 'utf8')
  if (combined.byteLength <= maxBytes) return { text: combined.toString('utf8'), truncated: false }
  return { text: combined.subarray(0, maxBytes).toString('utf8'), truncated: true }
}

async function runStep(
  command: QaCommandStep,
  timeoutMs: number,
  maxOutputBytes: number,
  env: NodeJS.ProcessEnv,
): Promise<QaStepResult> {
  return new Promise((resolveResult) => {
    const started = Date.now()
    const child = spawn(command.executable, command.args, {
      cwd: command.cwd,
      shell: false,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let stdoutTruncated = false
    let stderrTruncated = false
    let timedOut = false
    let settled = false

    child.stdout.on('data', (data: Buffer | string) => {
      const capped = capQaOutput(stdout, data.toString(), maxOutputBytes)
      stdout = capped.text
      stdoutTruncated ||= capped.truncated
    })
    child.stderr.on('data', (data: Buffer | string) => {
      const capped = capQaOutput(stderr, data.toString(), maxOutputBytes)
      stderr = capped.text
      stderrTruncated ||= capped.truncated
    })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)

    const finish = (exitCode: number | null, signal: NodeJS.Signals | null, error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveResult({
        executable: command.executable,
        args: [...command.args],
        cwd: command.cwd,
        exitCode,
        signal,
        timedOut,
        stdout,
        stderr,
        stdoutTruncated,
        stderrTruncated,
        durationMs: Date.now() - started,
        error: error?.message,
      })
    }

    child.once('error', (error) => finish(null, null, error))
    child.once('close', (code, signal) => finish(code, signal))
  })
}

export async function runQaProfile(
  profile: QaProfileName,
  options: { repoRoot: string },
): Promise<QaRunResult> {
  const plan = buildQaInvocation(profile, options.repoRoot)
  const results: QaStepResult[] = []
  const env = buildQaEnvironment()

  for (const command of plan.steps) {
    const result = await runStep(command, plan.timeoutMs, plan.maxOutputBytes, env)
    results.push(result)
    if (result.exitCode !== 0 || result.timedOut || result.error) {
      return { profile, ok: false, steps: results }
    }
  }

  return { profile, ok: true, steps: results }
}
